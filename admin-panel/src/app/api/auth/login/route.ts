import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebaseAdmin';

const SESSION_COOKIE = 'admin_session';
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
    }

    // 1. Verify the Firebase ID token is valid
    const decoded = await adminAuth.verifyIdToken(idToken);

    // 2. Check the user exists in the `admins` Firestore collection
    const adminDoc = await adminDb.collection('admins').doc(decoded.uid).get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: 'Access denied. This account does not have admin privileges.' },
        { status: 403 }
      );
    }

    const adminData = adminDoc.data();
    // Accept role stored in Firestore OR in the custom claim
    const role = adminData?.role ?? decoded['role'];
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Insufficient role.' },
        { status: 403 }
      );
    }

    // 3. Create a long-lived Firebase session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    // 4. Set it as an HTTP-only, Secure cookie
    const response = NextResponse.json({
      success: true,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: adminData.name ?? decoded.name ?? decoded.email,
        role: adminData.role,
      },
    });

    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
