import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !['read', 'unread'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 });
    }

    await adminDb.collection(COLLECTIONS.CONTACT_MESSAGES).doc(id).update({ status });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[PATCH /api/contact-messages]', err);
    return NextResponse.json({ ok: false, error: 'Failed to update message.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await adminDb.collection(COLLECTIONS.CONTACT_MESSAGES).doc(id).delete();

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/contact-messages]', err);
    return NextResponse.json({ ok: false, error: 'Failed to delete message.' }, { status: 500 });
  }
}
