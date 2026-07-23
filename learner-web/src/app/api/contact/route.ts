import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Validation
    const errors: string[] = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name is required (min 2 characters).');
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('A valid email address is required.');
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      errors.push('Subject is required (min 3 characters).');
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      errors.push('Message is required (min 10 characters).');
    }
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, error: errors.join(' ') }, { status: 400 });
    }

    // Store in Firestore
    const docRef = await adminDb.collection(COLLECTIONS.CONTACT_MESSAGES).add({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'unread',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err: unknown) {
    console.error('[POST /api/contact]', err);
    return NextResponse.json({ ok: false, error: 'Internal server error.' }, { status: 500 });
  }
}
