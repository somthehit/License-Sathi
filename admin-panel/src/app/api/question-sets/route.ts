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

// GET /api/question-sets
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snap = await adminDb.collection(COL).orderBy('setNumber', 'asc').get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[GET /api/question-sets]', err);
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 });
  }
}

// POST /api/question-sets
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, setNumber } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!setNumber || setNumber < 1) return NextResponse.json({ error: 'Set number must be ≥ 1' }, { status: 400 });

    // Check for duplicate setNumber
    const existing = await adminDb.collection(COL).where('setNumber', '==', setNumber).get();
    if (!existing.empty) return NextResponse.json({ error: `Set ${setNumber} already exists` }, { status: 409 });

    const docRef = await adminDb.collection(COL).add({
      name: name.trim(),
      description: description?.trim() ?? '',
      setNumber,
      questionCount: 0,
      createdBy: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await docRef.get();
    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/question-sets]', err);
    return NextResponse.json({ error: 'Failed to create set' }, { status: 500 });
  }
}
