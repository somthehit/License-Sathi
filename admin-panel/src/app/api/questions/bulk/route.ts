import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'questions';
const SESSION_COOKIE = 'admin_session';
const BATCH_SIZE = 500; // Firestore batch write limit

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

/**
 * POST /api/questions/bulk
 * Body: { questions: ParsedQuestion[] }
 *
 * Each ParsedQuestion must have:
 *   category, topic, difficulty, questionEn, questionNp,
 *   optionAEn, optionANp, optionBEn, optionBNp,
 *   optionCEn, optionCNp, optionDEn, optionDNp,
 *   correctOption, explanation, status
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const rows: Record<string, string>[] = body.questions ?? [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 });
    }
    if (rows.length > 1000) {
      return NextResponse.json({ error: 'Maximum 1000 questions per upload' }, { status: 400 });
    }

    const errors: { row: number; message: string }[] = [];
    const valid: Record<string, unknown>[] = [];

    const VALID_CATEGORIES  = new Set(['A', 'B', 'K', 'G']);
    const VALID_DIFFICULTIES = new Set(['Easy', 'Medium', 'Hard']);
    const VALID_OPTIONS      = new Set(['A', 'B', 'C', 'D']);
    const VALID_STATUSES     = new Set(['Active', 'Draft']);

    rows.forEach((row, i) => {
      const rowNum = i + 2; // 1-indexed + header row
      const e = (msg: string) => errors.push({ row: rowNum, message: msg });

      const category      = String(row.category      ?? '').trim().toUpperCase();
      const topic         = String(row.topic          ?? '').trim();
      const difficulty    = String(row.difficulty     ?? '').trim();
      const questionEn    = String(row.questionEn     ?? '').trim();
      const questionNp    = String(row.questionNp     ?? '').trim();
      const optionAEn     = String(row.optionAEn      ?? '').trim();
      const optionANp     = String(row.optionANp      ?? '').trim();
      const optionBEn     = String(row.optionBEn      ?? '').trim();
      const optionBNp     = String(row.optionBNp      ?? '').trim();
      const optionCEn     = String(row.optionCEn      ?? '').trim();
      const optionCNp     = String(row.optionCNp      ?? '').trim();
      const optionDEn     = String(row.optionDEn      ?? '').trim();
      const optionDNp     = String(row.optionDNp      ?? '').trim();
      const correctOption = String(row.correctOption  ?? '').trim().toUpperCase();
      const explanation   = String(row.explanation    ?? '').trim();
      const status        = String(row.status         ?? 'Draft').trim();

      if (!VALID_CATEGORIES.has(category))   e(`Invalid category "${category}" (must be A/B/K/G)`);
      if (!topic)                            e('topic is required');
      if (!VALID_DIFFICULTIES.has(difficulty)) e(`Invalid difficulty "${difficulty}" (must be Easy/Medium/Hard)`);
      if (!questionEn)                       e('questionEn is required');
      if (!optionAEn || !optionBEn || !optionCEn || !optionDEn) e('All 4 English options are required');
      if (!VALID_OPTIONS.has(correctOption)) e(`Invalid correctOption "${correctOption}" (must be A/B/C/D)`);
      if (!VALID_STATUSES.has(status))       e(`Invalid status "${status}" (must be Active/Draft)`);

      if (errors.filter(er => er.row === rowNum).length === 0) {
        valid.push({
          category, topic, difficulty, questionEn, questionNp,
          options: {
            A: { en: optionAEn, np: optionANp },
            B: { en: optionBEn, np: optionBNp },
            C: { en: optionCEn, np: optionCNp },
            D: { en: optionDEn, np: optionDNp },
          },
          correctOption, explanation, status,
          imageUrl:  null,
          createdBy: admin.uid,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    // Write in batches
    let written = 0;
    for (let i = 0; i < valid.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      valid.slice(i, i + BATCH_SIZE).forEach(q => {
        const ref = adminDb.collection(COL).doc();
        batch.set(ref, q);
      });
      await batch.commit();
      written += Math.min(BATCH_SIZE, valid.length - i);
    }

    return NextResponse.json({
      success: true,
      written,
      skipped: errors.length,
      errors: errors.slice(0, 20), // cap error list for response size
    });
  } catch (err) {
    console.error('[POST /api/questions/bulk]', err);
    return NextResponse.json({ error: 'Bulk import failed' }, { status: 500 });
  }
}
