import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { encryptKey } from '@/lib/services/crypto';

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4.1',
  anthropic: 'claude-sonnet-4',
  gemini: 'gemini-2.0-flash-lite',
  openrouter: 'openai/gpt-4o-mini',
};

export async function POST(request: NextRequest) {
  try {
    const { service, key_value, model, admin_user_id } = await request.json();

    if (!service || !key_value) {
      return NextResponse.json({ error: 'Missing service or key_value' }, { status: 400 });
    }

    const encryptedValue = encryptKey(key_value);

    await adminDb.collection(COLLECTIONS.ADMIN_API_KEYS).doc(service).set({
      key_value: encryptedValue,
      model: model || DEFAULT_MODELS[service] || '',
      updated_by: admin_user_id || 'system',
      updated_at: new Date().toISOString(),
    });

    await adminDb.collection(COLLECTIONS.ADMIN_API_KEY_AUDIT_LOG).add({
      action: `ROTATED_KEY_${service.toUpperCase()}`,
      performed_by: admin_user_id || 'system',
      performed_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving API key:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const keysSnapshot = await adminDb.collection(COLLECTIONS.ADMIN_API_KEYS).get();
    const keys = keysSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        service: doc.id,
        model: data.model || DEFAULT_MODELS[doc.id] || '',
        updated_by: data.updated_by,
        updated_at: data.updated_at,
        is_configured: !!data.key_value,
      };
    });

    return NextResponse.json({ keys });
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
