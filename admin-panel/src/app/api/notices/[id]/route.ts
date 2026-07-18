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

// PATCH /api/notices/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { id: _id, createdAt: _c, createdBy: _cb, ...fields } = body;

    // Stamp publishedAt when status is being set to Published for the first time
    const updates: Record<string, unknown> = { ...fields, updatedAt: FieldValue.serverTimestamp() };
    if (fields.status === 'Published' && !fields.publishedAt) {
      updates.publishedAt = FieldValue.serverTimestamp();
    }

    await adminDb.collection(COL).doc(id).update(updates);
    const doc = await adminDb.collection(COL).doc(id).get();
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[PATCH /api/notices/:id]', err);
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 });
  }
}

// DELETE /api/notices/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await adminDb.collection(COL).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/notices/:id]', err);
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
}
