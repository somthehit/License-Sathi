import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'admins';
const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

// PATCH /api/admin-users/[id]  — update role / status / name
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await requireAdmin(req);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Prevent self-demotion
    if (id === caller.uid) {
      const body = await req.json();
      if (body.status === 'inactive' || body.role !== 'admin') {
        return NextResponse.json({ error: 'You cannot demote or deactivate your own account.' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { id: _id, createdAt: _c, email: _e, ...fields } = body;

    await adminDb.collection(COL).doc(id).update({
      ...fields,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Sync custom claim if role changed
    if (fields.role) {
      await adminAuth.setCustomUserClaims(id, { role: fields.role });
    }

    const doc = await adminDb.collection(COL).doc(id).get();
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[PATCH /api/admin-users/:id]', err);
    return NextResponse.json({ error: 'Failed to update admin user' }, { status: 500 });
  }
}

// DELETE /api/admin-users/[id]  — revoke access (keeps Auth user, removes Firestore doc)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await requireAdmin(req);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    if (id === caller.uid) {
      return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 403 });
    }

    // Remove admin role claim
    await adminAuth.setCustomUserClaims(id, {});
    // Delete Firestore admin doc (this removes their access)
    await adminDb.collection(COL).doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin-users/:id]', err);
    return NextResponse.json({ error: 'Failed to remove admin user' }, { status: 500 });
  }
}
