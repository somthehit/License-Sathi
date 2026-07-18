import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'notices';
const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

// GET /api/notices?status=&type=&page=1&pageSize=10
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const status   = searchParams.get('status') ?? '';
    const type     = searchParams.get('type')   ?? '';
    const page     = Math.max(1, Number(searchParams.get('page')     ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 10)));

    let query: FirebaseFirestore.Query = adminDb.collection(COL).orderBy('createdAt', 'desc');
    if (status && status !== 'All') query = query.where('status', '==', status);
    if (type   && type   !== 'All') query = query.where('type',   '==', type);

    const totalSnap = await query.count().get();
    const total = totalSnap.data().count;

    const snap = await query.offset((page - 1) * pageSize).limit(pageSize).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const [publishedSnap, draftSnap] = await Promise.all([
      adminDb.collection(COL).where('status', '==', 'Published').count().get(),
      adminDb.collection(COL).where('status', '==', 'Draft').count().get(),
    ]);

    return NextResponse.json({
      items, total, page, pageSize,
      stats: {
        published: publishedSnap.data().count,
        draft:     draftSnap.data().count,
      },
    });
  } catch (err) {
    console.error('[GET /api/notices]', err);
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 });
  }
}

// POST /api/notices
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { titleEn, titleNp, contentEn, contentNp, type, targetCategory, status, expiresAt } = body;

    if (!titleEn?.trim()) {
      return NextResponse.json({ error: 'English title is required' }, { status: 400 });
    }

    const docRef = await adminDb.collection(COL).add({
      titleEn:        titleEn.trim(),
      titleNp:        titleNp?.trim()   ?? '',
      contentEn:      contentEn?.trim() ?? '',
      contentNp:      contentNp?.trim() ?? '',
      type:           type           ?? 'info',
      targetCategory: targetCategory ?? ['all'],
      status:         status         ?? 'Draft',
      publishedAt:    status === 'Published' ? FieldValue.serverTimestamp() : null,
      expiresAt:      expiresAt ?? null,
      createdBy:      admin.uid,
      createdAt:      FieldValue.serverTimestamp(),
      updatedAt:      FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/notices]', err);
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
  }
}
