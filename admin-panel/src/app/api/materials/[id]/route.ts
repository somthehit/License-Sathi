import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'study_materials';
const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const doc = await adminDb.collection(COL).doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[GET /api/materials/:id]', err);
    return NextResponse.json({ error: 'Failed to fetch material' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { id: _id, createdAt: _c, createdBy: _cb, ...fields } = body;

    await adminDb.collection(COL).doc(id).update({
      ...fields,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await adminDb.collection(COL).doc(id).get();
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[PATCH /api/materials/:id]', err);
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
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
    console.error('[DELETE /api/materials/:id]', err);
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}
