import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebaseAdmin';

const SESSION_COOKIE = 'admin_session';

async function getAdminUid(req: NextRequest): Promise<string | null> {
  try {
    const cookie = req.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) return null;
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return decoded.uid;
  } catch { return null; }
}

// PATCH /api/admin-users/me  — update own display name
export async function PATCH(req: NextRequest) {
  const uid = await getAdminUid(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    // Update in Firestore admins collection
    await adminDb.collection('admins').doc(uid).update({ name: name.trim() });

    // Also update Firebase Auth display name
    await adminAuth.updateUser(uid, { displayName: name.trim() });

    return NextResponse.json({ success: true, name: name.trim() });
  } catch (err) {
    console.error('[PATCH /api/admin-users/me]', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
