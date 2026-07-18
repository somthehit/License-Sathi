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

// GET /api/admin-users
export async function GET(req: NextRequest) {
  try {
    const caller = await requireAdmin(req);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snap = await adminDb.collection(COL).orderBy('createdAt', 'desc').get();
    const items = snap.docs
      .filter(d => d.id !== '_schema') // skip placeholder doc from seed
      .map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[GET /api/admin-users]', err);
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
  }
}

// POST /api/admin-users  — create a new admin user
export async function POST(req: NextRequest) {
  try {
    const caller = await requireAdmin(req);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, email, password, role = 'admin' } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 });
    }

    // Create Firebase Auth user
    const authUser = await adminAuth.createUser({
      email, password,
      displayName: name,
      emailVerified: true,
    });

    // Set custom claim
    await adminAuth.setCustomUserClaims(authUser.uid, { role });

    // Write Firestore doc
    await adminDb.collection(COL).doc(authUser.uid).set({
      name, email, role,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    });

    const doc = await adminDb.collection(COL).doc(authUser.uid).get();
    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/admin-users]', err);
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists')
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
}
