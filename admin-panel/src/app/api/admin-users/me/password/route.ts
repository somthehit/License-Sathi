import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebaseAdmin';

const SESSION_COOKIE = 'admin_session';

async function getAdminUid(req: NextRequest): Promise<string | null> {
  try {
    const cookie = req.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) return null;
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return decoded.uid;
  } catch { return null; }
}

// PATCH /api/admin-users/me/password
export async function PATCH(req: NextRequest) {
  const uid = await getAdminUid(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Firebase Admin SDK can change password directly — no need to verify current password
    // server-side since we already validated the session cookie above
    await adminAuth.updateUser(uid, { password: newPassword });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/admin-users/me/password]', err);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
