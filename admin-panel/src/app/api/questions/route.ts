import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'questions';
const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

// GET /api/questions?category=A&topic=Traffic+Signs&status=Active&page=1&pageSize=20
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const category   = searchParams.get('category');
    const topic      = searchParams.get('topic');
    const status     = searchParams.get('status');
    const setId      = searchParams.get('setId');
    const search     = searchParams.get('search')?.trim().toLowerCase();
    const difficulty = searchParams.get('difficulty');
    const page     = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

    let query: FirebaseFirestore.Query = adminDb.collection(COL);
    const hasFilter = (category && category !== 'All') ||
                      (topic    && topic    !== 'All Topics') ||
                      (status   && status   !== 'All') ||
                      (difficulty && difficulty !== 'All') ||
                      !!setId || !!search;

    if (category && category !== 'All')       query = query.where('category', 'in', [category, 'ALL']);
    if (topic    && topic    !== 'All Topics') query = query.where('topic',    '==', topic);
    if (status   && status   !== 'All')        query = query.where('status',   '==', status);
    if (difficulty && difficulty !== 'All')    query = query.where('difficulty','==', difficulty);
    if (setId) {
      if (setId === 'unassigned') {
        query = query.where('setId', '==', '');
      } else {
        query = query.where('setId', '==', setId);
      }
    }

    // Fetch all, then do client-side search filter (Firestore has no full-text search)
    const totalSnap = await query.count().get();
    const total = totalSnap.data().count;

    let snap = await query.offset((page - 1) * pageSize).limit(pageSize).get();
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    // Client-side search filter (on already paginated slice — for full-text, integrate Algolia)
    if (search) {
      items = items.filter((q: any) =>
        (q.questionEn ?? '').toLowerCase().includes(search) ||
        (q.questionNp ?? '').toLowerCase().includes(search) ||
        (q.subject    ?? '').toLowerCase().includes(search) ||
        (q.subjectNp  ?? '').toLowerCase().includes(search)
      );
    }

    // Stats
    const [activeSnap, draftSnap] = await Promise.all([
      adminDb.collection(COL).where('status', '==', 'Active').count().get(),
      adminDb.collection(COL).where('status', '==', 'Draft').count().get(),
    ]);

    return NextResponse.json({
      items, total, page, pageSize,
      stats: { active: activeSnap.data().count, draft: draftSnap.data().count },
    });
  } catch (err) {
    console.error('[GET /api/questions]', err);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST /api/questions
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const docRef = await adminDb.collection(COL).add({
      ...body,
      createdBy: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await docRef.get();
    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/questions]', err);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
