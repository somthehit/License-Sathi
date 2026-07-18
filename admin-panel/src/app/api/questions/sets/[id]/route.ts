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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const doc = await adminDb.collection(COL).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }
    
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[GET /api/questions/sets/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch set' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const updateData: any = { updatedAt: FieldValue.serverTimestamp() };
    if (body.name) updateData.name = body.name.trim();
    if (typeof body.nameNp === 'string') updateData.nameNp = body.nameNp.trim();
    if (typeof body.description === 'string') updateData.description = body.description.trim();

    await adminDb.collection(COL).doc(id).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/questions/sets/[id]]', err);
    return NextResponse.json({ error: 'Failed to update set' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await adminDb.collection(COL).doc(id).delete();
    
    // Note: This does not delete or update questions that belong to this set.
    // They will keep the old `setId`, which can be handled as 'Unassigned' or orphaned on the frontend.
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/questions/sets/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete set' }, { status: 500 });
  }
}
