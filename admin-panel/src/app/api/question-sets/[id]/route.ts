import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'question_sets';
const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { id: _id, createdAt: _c, createdBy: _cb, ...fields } = await req.json();
    await adminDb.collection(COL).doc(id).update({ ...fields, updatedAt: FieldValue.serverTimestamp() });
    const doc = await adminDb.collection(COL).doc(id).get();
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[PATCH /api/question-sets/:id]', err);
    return NextResponse.json({ error: 'Failed to update set' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await adminDb.collection(COL).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/question-sets/:id]', err);
    return NextResponse.json({ error: 'Failed to delete set' }, { status: 500 });
  }
}
