import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'video_guides';
const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

// GET /api/video-guides
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const status   = searchParams.get('status');
    const page     = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

    let query: FirebaseFirestore.Query = adminDb.collection(COL);
    const hasFilter = status && status !== 'All';
    if (hasFilter) query = query.where('status', '==', status);
    if (!hasFilter) query = query.orderBy('createdAt', 'desc');

    const totalSnap = await query.count().get();
    const total = totalSnap.data().count;
    const snap  = await query.offset((page - 1) * pageSize).limit(pageSize).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const [pubSnap, draftSnap] = await Promise.all([
      adminDb.collection(COL).where('status', '==', 'Published').count().get(),
      adminDb.collection(COL).where('status', '==', 'Draft').count().get(),
    ]);

    return NextResponse.json({
      items,
      total,
      stats: { published: pubSnap.data().count, draft: draftSnap.data().count },
      page,
      pageSize,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/video-guides
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { titleEn, titleNp, descriptionEn, descriptionNp, videoUrl, durationSeconds, category, status } = body;

    if (!titleEn || !videoUrl) {
      return NextResponse.json({ error: 'titleEn and videoUrl are required' }, { status: 400 });
    }

    const docRef = await adminDb.collection(COL).add({
      titleEn:          titleEn.trim(),
      titleNp:          (titleNp ?? '').trim(),
      descriptionEn:    (descriptionEn ?? '').trim(),
      descriptionNp:    (descriptionNp ?? '').trim(),
      videoUrl:         videoUrl.trim(),
      durationSeconds:  Number(durationSeconds ?? 0),
      category:         category ?? 'ALL',
      status:           status ?? 'Draft',
      isPublished:      status === 'Published',
      createdAt:        FieldValue.serverTimestamp(),
      updatedAt:        FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
