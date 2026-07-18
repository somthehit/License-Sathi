import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'study_materials';
const SESSION_COOKIE = 'admin_session';
const BATCH_SIZE = 500;

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

/**
 * POST /api/materials/bulk
 * Body: { materials: ParsedMaterial[] }
 *
 * CSV columns:
 *   code, contentType, vehicleCategory, difficulty,
 *   titleEn, titleNp, descEn, descNp,
 *   sectionId, dotmRef, status
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const rows: Record<string, string>[] = body.materials ?? [];

    if (!Array.isArray(rows) || rows.length === 0)
      return NextResponse.json({ error: 'No materials provided' }, { status: 400 });
    if (rows.length > 500)
      return NextResponse.json({ error: 'Maximum 500 materials per upload' }, { status: 400 });

    const VALID_TYPES       = new Set(['Traffic Sign', 'Road Rule', 'Vehicle Knowledge']);
    const VALID_CATEGORIES  = new Set(['A - Motorcycle/Bike', 'B - Car / Jeep / Van', 'K - Scooter / Moped', 'G - Tractor', 'All']);
    const VALID_DIFFICULTIES = new Set(['Easy', 'Medium', 'Hard']);
    const VALID_STATUSES    = new Set(['Published', 'Draft']);

    const errors: { row: number; message: string }[] = [];
    const valid: Record<string, unknown>[] = [];

    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const e = (msg: string) => errors.push({ row: rowNum, message: msg });

      const code            = String(row.code            ?? '').trim();
      const contentType     = String(row.contentType     ?? '').trim();
      const vehicleCategory = String(row.vehicleCategory ?? '').trim();
      const difficulty      = String(row.difficulty      ?? '').trim();
      const titleEn         = String(row.titleEn         ?? '').trim();
      const titleNp         = String(row.titleNp         ?? '').trim();
      const descEn          = String(row.descEn          ?? '').trim();
      const descNp          = String(row.descNp          ?? '').trim();
      const sectionId       = String(row.sectionId       ?? '').trim() || null;
      const dotmRef         = String(row.dotmRef         ?? '').trim() || null;
      const status          = String(row.status          ?? 'Draft').trim();

      if (!code)                                e('code is required');
      if (!VALID_TYPES.has(contentType))        e(`Invalid contentType "${contentType}" (must be Traffic Sign / Road Rule / Vehicle Knowledge)`);
      if (!VALID_CATEGORIES.has(vehicleCategory)) e(`Invalid vehicleCategory "${vehicleCategory}"`);
      if (!VALID_DIFFICULTIES.has(difficulty))  e(`Invalid difficulty "${difficulty}" (Easy/Medium/Hard)`);
      if (!titleEn)                             e('titleEn is required');
      if (!VALID_STATUSES.has(status))          e(`Invalid status "${status}" (Published/Draft)`);

      if (!errors.find(er => er.row === rowNum)) {
        valid.push({
          code, contentType, vehicleCategory, difficulty,
          titleEn, titleNp, descEn, descNp,
          sectionId, dotmRef,
          imageUrl: null,
          status,
          createdBy: admin.uid,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    let written = 0;
    for (let i = 0; i < valid.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      valid.slice(i, i + BATCH_SIZE).forEach(m => {
        const ref = adminDb.collection(COL).doc();
        batch.set(ref, m);
      });
      await batch.commit();
      written += Math.min(BATCH_SIZE, valid.length - i);
    }

    return NextResponse.json({ success: true, written, skipped: errors.length, errors: errors.slice(0, 20) });
  } catch (err) {
    console.error('[POST /api/materials/bulk]', err);
    return NextResponse.json({ error: 'Bulk import failed' }, { status: 500 });
  }
}
