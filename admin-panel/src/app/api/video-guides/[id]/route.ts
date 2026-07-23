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

// GET /api/video-guides/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snap = await adminDb.collection(COL).doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ id: snap.id, ...snap.data() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/video-guides/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { titleEn, titleNp, descriptionEn, descriptionNp, videoUrl, durationSeconds, category, status } = body;

    await adminDb.collection(COL).doc(params.id).update({
      titleEn:          titleEn?.trim(),
      titleNp:          (titleNp ?? '').trim(),
      descriptionEn:    (descriptionEn ?? '').trim(),
      descriptionNp:    (descriptionNp ?? '').trim(),
      videoUrl:         videoUrl?.trim(),
      durationSeconds:  Number(durationSeconds ?? 0),
      category:         category ?? 'ALL',
      status:           status ?? 'Draft',
      isPublished:      status === 'Published',
      updatedAt:        FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: params.id, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/video-guides/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await adminDb.collection(COL).doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
