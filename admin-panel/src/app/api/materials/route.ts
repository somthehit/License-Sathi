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

// GET /api/materials
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const contentType      = searchParams.get('contentType');
    const vehicleCategory  = searchParams.get('vehicleCategory');
    const status           = searchParams.get('status');
    const page     = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

    let query: FirebaseFirestore.Query = adminDb.collection(COL);
    const hasFilter = (contentType && contentType !== 'All') ||
                      (vehicleCategory && vehicleCategory !== 'All') ||
                      (status && status !== 'All');

    if (contentType     && contentType     !== 'All') query = query.where('contentType',     '==', contentType);
    if (vehicleCategory && vehicleCategory !== 'All') query = query.where('vehicleCategory', '==', vehicleCategory);
    if (status          && status          !== 'All') query = query.where('status',          '==', status);

    // Only add orderBy when no where-filter is active to avoid needing composite indexes
    if (!hasFilter) query = query.orderBy('createdAt', 'desc');

    const totalSnap = await query.count().get();
    const total = totalSnap.data().count;
    const snap  = await query.offset((page - 1) * pageSize).limit(pageSize).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const [pubSnap, draftSnap] = await Promise.all([
      adminDb.collection(COL).where('status', '==', 'Published').count().get(),
      adminDb.collection(COL).where('status', '==', 'Draft').count().get(),
    ]);

    return NextResponse.json({
      items, total, page, pageSize,
      stats: { published: pubSnap.data().count, draft: draftSnap.data().count },
    });
  } catch (err) {
    console.error('[GET /api/materials]', err);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

// POST /api/materials
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const docRef = await adminDb.collection(COL).add({
      ...body,
      createdBy: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await docRef.get();
    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/materials]', err);
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
  }
}
