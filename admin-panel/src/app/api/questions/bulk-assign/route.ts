import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'questions';
const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { questionIds, setId } = body;

    if (!Array.isArray(questionIds)) {
      return NextResponse.json({ error: 'questionIds must be an array' }, { status: 400 });
    }

    const batch = adminDb.batch();
    
    questionIds.forEach(id => {
      const docRef = adminDb.collection(COL).doc(id);
      batch.update(docRef, { 
        setId: setId,
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true, count: questionIds.length });
  } catch (err) {
    console.error('[POST /api/questions/bulk-assign]', err);
    return NextResponse.json({ error: 'Failed to assign questions' }, { status: 500 });
  }
}
