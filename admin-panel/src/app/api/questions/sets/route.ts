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

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snap = await adminDb.collection(COL).orderBy('createdAt', 'desc').get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[GET /api/questions/sets]', err);
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Set name is required' }, { status: 400 });
    }

    const docRef = await adminDb.collection(COL).add({
      name: body.name.trim(),
      nameNp: (body.nameNp ?? '').trim(),
      description: (body.description ?? '').trim(),
      createdBy: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const doc = await docRef.get();
    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/questions/sets]', err);
    return NextResponse.json({ error: 'Failed to create set' }, { status: 500 });
  }
}
