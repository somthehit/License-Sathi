import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebaseAdmin';

const SESSION_COOKIE = 'admin_session';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(SESSION_COOKIE)?.value;

    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the session cookie and check it hasn't been revoked
    const decoded = await adminAuth.verifySessionCookie(cookie, true);

    const adminDoc = await adminDb.collection('admins').doc(decoded.uid).get();

    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const adminData = adminDoc.data()!;

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
      name: adminData.name ?? decoded.name ?? decoded.email,
      role: adminData.role,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
}
