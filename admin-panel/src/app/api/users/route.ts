import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'users';
const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

// GET /api/users?search=&vehicleCategory=&status=&page=1&pageSize=10
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const search          = searchParams.get('search')?.toLowerCase() ?? '';
    const vehicleCategory = searchParams.get('vehicleCategory') ?? '';
    const status          = searchParams.get('status') ?? '';
    const page     = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 10)));

    let query: FirebaseFirestore.Query = adminDb.collection(COL);

    // Apply Firestore-level filters only for fields that exist on both schemas
    if (status && status !== 'All')
      query = query.where('status', '==', status);

    // Fetch all matching docs — no orderBy to avoid excluding app-signup users
    // who don't have a createdAt field. Sorting is done in-memory below.
    const allSnap = await query.get();
    let allDocs = allSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Record<string, unknown>[];

    // Normalise: app users use "name", admin-created users use "fullName"
    allDocs = allDocs.map(u => ({
      ...u,
      _displayName: String(u.fullName ?? u.name ?? ''),
      _displayPhone: String(u.phone ?? u.phoneNumber ?? ''),
      _displayCategory: u.vehicleCategory ?? (() => {
        const cat = String(u.preferredCategory ?? (Array.isArray(u.categoryPreferences) ? (u.categoryPreferences as string[])[0] : '') ?? '');
        const MAP: Record<string, string> = { A: 'A - Motorcycle/Bike', B: 'B - Car / Jeep / Van', K: 'K - Scooter / Moped', G: 'G - Tractor' };
        return MAP[cat] ?? cat;
      })(),
    }));

    // Category filter (client-side — app users store short code, admin stores full string)
    if (vehicleCategory && vehicleCategory !== 'All') {
      allDocs = allDocs.filter(u => {
        const cat = String(u._displayCategory ?? '');
        return cat === vehicleCategory || cat.startsWith(vehicleCategory.charAt(0));
      });
    }

    // Client-side search filter across all name/email/phone variants
    if (search) {
      allDocs = allDocs.filter(u => {
        const name  = String(u._displayName).toLowerCase();
        const email = String(u.email ?? '').toLowerCase();
        const phone = String(u._displayPhone).toLowerCase();
        return name.includes(search) || email.includes(search) || phone.includes(search);
      });
    }

    // Sort: docs with createdAt first (newest first), then the rest
    allDocs.sort((a, b) => {
      const ta = (a.createdAt as { _seconds?: number } | null)?._seconds ?? 0;
      const tb = (b.createdAt as { _seconds?: number } | null)?._seconds ?? 0;
      return tb - ta;
    });

    const total = allDocs.length;
    // Strip internal normalisation keys before sending to client
    const items = allDocs
      .slice((page - 1) * pageSize, page * pageSize)
      .map(({ _displayName: _n, _displayPhone: _p, _displayCategory: _c, ...rest }) => rest);

    // Stats: count across all docs (status field may be absent on app-signup users — treat as Active)
    const allForStats = await adminDb.collection(COL).get();
    let active = 0; let suspended = 0;
    for (const doc of allForStats.docs) {
      const s = doc.data().status;
      if (s === 'Suspended') suspended++;
      else active++; // treat missing/Active as active
    }

    return NextResponse.json({
      items, total, page, pageSize,
      stats: { active, suspended },
    });
  } catch (err) {
    console.error('[GET /api/users]', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fullName, email, password, phone, dob, vehicleCategory, citizenshipId, readinessScore, status, sendWelcome } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 1. Create Firebase Auth user so they can log into the mobile app
    let authUser;
    try {
      authUser = await adminAuth.createUser({
        email,
        password,
        displayName: fullName,
        phoneNumber: phone ? (phone.startsWith('+') ? phone : `+977${phone.replace(/^0/, '')}`) : undefined,
        emailVerified: false,
        disabled: status === 'Suspended',
      });
    } catch (authErr: unknown) {
      const code = (authErr as { code?: string }).code;
      if (code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      if (code === 'auth/invalid-phone-number') {
        // Retry without phone if format is invalid
        authUser = await adminAuth.createUser({
          email, password, displayName: fullName, emailVerified: false, disabled: status === 'Suspended',
        });
      } else {
        throw authErr;
      }
    }

    // 2. Write Firestore doc using the Auth UID as document ID (so mobile app can find their profile)
    await adminDb.collection(COL).doc(authUser.uid).set({
      fullName: fullName ?? '',
      email,
      phone: phone ?? '',
      dob: dob ?? '',
      vehicleCategory: vehicleCategory ?? 'A - Motorcycle/Bike',
      citizenshipId: citizenshipId ?? '',
      readinessScore: readinessScore ?? 0,
      status: status ?? 'Active',
      examsTaken:  0,
      passRate:    0,
      lastActive:  null,
      sendWelcome: sendWelcome ?? false,
      createdAt:   FieldValue.serverTimestamp(),
      updatedAt:   FieldValue.serverTimestamp(),
    });

    const doc = await adminDb.collection(COL).doc(authUser.uid).get();
    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/users]', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
