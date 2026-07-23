import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { decryptKey } from '@/lib/services/crypto';

const SYSTEM_PROMPT = (category: string) =>
  `You are an expert on Nepal's driving license rules, traffic laws, road signs, and the licensing process. Answer clearly and concisely. Focus only on Nepal traffic rules, DOTM regulations, and driving license topics. Category: ${category ?? 'General'}`;

async function callGemini(apiKey: string, question: string, category: string, model?: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash-lite'}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT(category) + '\n\nQuestion: ' + question }] },
        ],
        generationConfig: { maxOutputTokens: 512, temperature: 0.4 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function callOpenRouter(apiKey: string, question: string, category: string, model?: string) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(category) },
        { role: 'user', content: question },
      ],
      max_tokens: 512,
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content;
}

async function getKeyConfig(service: string): Promise<{ key: string; model: string } | null> {
  const doc = await adminDb.collection(COLLECTIONS.ADMIN_API_KEYS).doc(service).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return { key: decryptKey(data.key_value), model: data.model || '' };
}

export async function POST(req: NextRequest) {
  try {
    const { question, category } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    let lastError = '';

    let apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        const answer = await callGemini(apiKey, question, category);
        if (answer) return NextResponse.json({ answer });
      } catch (e: any) {
        lastError = e.message;
        console.error('[ask-expert] Gemini .env failed:', e.message.slice(0, 200));
      }
    }

    const openrouterConfig = await getKeyConfig('openrouter');
    if (openrouterConfig) {
      try {
        const answer = await callOpenRouter(openrouterConfig.key, question, category, openrouterConfig.model);
        if (answer) return NextResponse.json({ answer });
      } catch (e: any) {
        lastError = e.message;
        console.error('[ask-expert] OpenRouter failed:', e.message.slice(0, 200));
      }
    }

    const geminiConfig = await getKeyConfig('gemini');
    if (geminiConfig) {
      try {
        const answer = await callGemini(geminiConfig.key, question, category, geminiConfig.model);
        if (answer) return NextResponse.json({ answer });
      } catch (e: any) {
        lastError = e.message;
        console.error('[ask-expert] Gemini Firestore failed:', e.message.slice(0, 200));
      }
    }

    if (lastError) {
      return NextResponse.json({ answer: 'AI service is temporarily unavailable. Please try again later.' });
    }

    return NextResponse.json({
      answer: 'AI service is not configured yet. Please add a valid API key in the admin panel (Gemini or OpenRouter) or .env.local.',
    });
  } catch (err) {
    console.error('[ask-expert]', err);
    return NextResponse.json({
      answer: 'An unexpected error occurred. Please try again.',
    });
  }
}
