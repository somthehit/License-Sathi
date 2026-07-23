import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import crypto from 'crypto';

// To fully verify AdMob SSV in production:
// 1. Fetch Google's public keys from https://www.gstatic.com/admob/reward/verifier-keys.json
// 2. Extract key_id from the query parameters
// 3. Find the matching public key
// 4. Verify the ECDSA signature using the public key and the query string

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const user_id = searchParams.get('user_id');
  const reward_amount = searchParams.get('reward_amount');
  const transaction_id = searchParams.get('transaction_id');
  const signature = searchParams.get('signature');
  const key_id = searchParams.get('key_id');

  if (!user_id || !reward_amount || !transaction_id || !signature || !key_id) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // [PHASE 1 MOCK]: In a real app, verify the signature cryptographically here.
    const isSignatureValid = true; // Replace with actual verification

    if (!isSignatureValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Record the reward in Firestore
    await adminDb.collection(COLLECTIONS.AD_REWARD_LOGS).add({
      user_id,
      reward_amount: parseInt(reward_amount, 10),
      ad_network: 'admob',
      transaction_id,
      verified_at: new Date().toISOString(),
    });

    // Optionally update user's total credit balance if you keep a running total in the user's doc
    // await adminDb.collection('users').doc(user_id).update({
    //   ai_credits: FieldValue.increment(parseInt(reward_amount, 10))
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AdMob SSV] Error verifying reward:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
