import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'unread' | 'read' | 'all'
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.CONTACT_MESSAGES);

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc');

    // Get total count
    const countSnap = await query.count().get();
    const total = countSnap.data().count;

    // Get page
    const offset = (page - 1) * pageSize;
    const snap = await query.offset(offset).limit(pageSize).get();

    const items = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Stats
    const unreadSnap = await adminDb.collection(COLLECTIONS.CONTACT_MESSAGES).where('status', '==', 'unread').count().get();
    const readSnap = await adminDb.collection(COLLECTIONS.CONTACT_MESSAGES).where('status', '==', 'read').count().get();

    return NextResponse.json({
      ok: true,
      items,
      total,
      stats: {
        unread: unreadSnap.data().count,
        read: readSnap.data().count,
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/contact-messages]', err);
    return NextResponse.json({ ok: false, error: 'Failed to load messages.' }, { status: 500 });
  }
}
