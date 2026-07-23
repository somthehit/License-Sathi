import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { decryptKey } from '@/lib/services/crypto';
import crypto from 'crypto';
import { AIManager } from '@/lib/services/ai/AIManager';
import { OpenAIProvider } from '@/lib/services/ai/providers/OpenAIProvider';
import { GeminiProvider } from '@/lib/services/ai/providers/GeminiProvider';
import { AnthropicProvider } from '@/lib/services/ai/providers/AnthropicProvider';
import { OpenRouterProvider } from '@/lib/services/ai/providers/OpenRouterProvider';
import type { AIService } from '@/lib/services/ai/AIService';

const normalizeQuestion = (q: string) => q.toLowerCase().trim().replace(/[^\w\s\u0900-\u097F]/gi, '');

async function getKeyConfig(service: string): Promise<{ key: string; model: string } | null> {
  const doc = await adminDb.collection(COLLECTIONS.ADMIN_API_KEYS).doc(service).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return { key: decryptKey(data.key_value), model: data.model || '' };
}

function buildProvider(service: string, key: string): AIService | null {
  switch (service) {
    case 'openai': return new OpenAIProvider(key);
    case 'gemini': return new GeminiProvider(key);
    case 'anthropic': return new AnthropicProvider(key);
    case 'openrouter': return new OpenRouterProvider(key);
    default: return null;
  }
}

// Provider priority order
const PROVIDER_PRIORITY = ['openai', 'gemini', 'anthropic', 'openrouter'];

export async function POST(request: NextRequest) {
  try {
    const { user_id, question, category } = await request.json();

    if (!user_id || !question || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check feature flag
    const flagDoc = await adminDb.collection(COLLECTIONS.FEATURE_FLAGS).doc('ask_expert_enabled').get();
    if (flagDoc.exists && flagDoc.data()?.is_enabled === false) {
      return NextResponse.json({ error: 'Ask the Expert is temporarily disabled' }, { status: 503 });
    }

    // 2. Rate limiting
    const today = new Date().toISOString().split('T')[0];
    const userRequests = await adminDb.collection(COLLECTIONS.ASK_EXPERT_QUESTIONS)
      .where('user_id', '==', user_id)
      .where('created_at', '>=', today)
      .count().get();

    if (userRequests.data().count >= 50) {
      return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 });
    }

    // 3. Check ad credit
    const logsSnapshot = await adminDb.collection(COLLECTIONS.AD_REWARD_LOGS)
      .where('user_id', '==', user_id).limit(1).get();
    const hasCredit = !logsSnapshot.empty;

    // 4. Cache key
    const contentVersion = 1;
    const normalizedQuestion = normalizeQuestion(question);
    const hash = crypto.createHash('sha256');
    hash.update(normalizedQuestion + contentVersion);
    const cacheKey = hash.digest('hex');

    // 5. Check cache
    const cacheDoc = await adminDb.collection(COLLECTIONS.AI_CACHE).doc(cacheKey).get();
    if (cacheDoc.exists) {
      const data = cacheDoc.data()!;
      await cacheDoc.ref.update({ hit_count: (data.hit_count || 0) + 1 });
      await adminDb.collection(COLLECTIONS.ASK_EXPERT_QUESTIONS).add({
        user_id, question, answer: data.answer_text, cache_hit: true, status: 'success',
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ answer: data.answer_text, citations: data.matched_content_ids, cache_hit: true });
    }

    // 6. Build context
    const contextStr = "MOCK CONTEXT: Driving over the speed limit incurs a fine of 1500 NPR.";
    const matchedContentIds = ["traffic_rules_sec_4"];

    // 7. Find first configured provider and call AI
    let aiResponse = null;
    const errors: string[] = [];

    for (const service of PROVIDER_PRIORITY) {
      const config = await getKeyConfig(service);
      if (!config) continue;

      const provider = buildProvider(service, config.key);
      if (!provider) continue;

      const flagKey = `provider_${service}_enabled`;
      const flagDoc = await adminDb.collection(COLLECTIONS.FEATURE_FLAGS).doc(flagKey).get();
      if (flagDoc.exists && flagDoc.data()?.is_enabled === false) continue;

      try {
        const manager = new AIManager({ name: service, service: provider });
        aiResponse = await manager.generateAnswer({
          question,
          context: contextStr,
          model: config.model,
          systemPrompt: `You are an expert on Nepal's driving license rules, traffic laws, road signs, and the licensing process. Answer clearly and concisely. Focus only on Nepal traffic rules, DOTM regulations, and driving license topics. Category: ${category ?? 'General'}`,
          temperature: 0.4,
          maxTokens: 512,
        });
        break;
      } catch (e: any) {
        errors.push(`${service}: ${e.message}`);
        console.error(`[Ask Expert] Provider ${service} failed:`, e);
      }
    }

    if (!aiResponse) {
      return NextResponse.json({
        error: `All AI providers failed.\n${errors.join('\n')}`,
      }, { status: 502 });
    }

    // 8. Cache result
    await adminDb.collection(COLLECTIONS.AI_CACHE).doc(cacheKey).set({
      question_text: question,
      answer_text: aiResponse.answer_text,
      content_category: category,
      content_version_at_creation: contentVersion,
      matched_content_ids: matchedContentIds,
      model_name: aiResponse.model_name,
      prompt_version: 'v1',
      hit_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 9. Log usage
    await adminDb.collection(COLLECTIONS.ASK_EXPERT_QUESTIONS).add({
      user_id, question, answer: aiResponse.answer_text, cache_hit: false,
      prompt_tokens: aiResponse.prompt_tokens, completion_tokens: aiResponse.completion_tokens,
      total_tokens: aiResponse.total_tokens,
      ai_cost_estimate: (aiResponse.total_tokens * 0.0001),
      provider: aiResponse.provider, model_name: aiResponse.model_name, latency_ms: aiResponse.latency_ms,
      status: 'success', created_at: new Date().toISOString(),
    });

    return NextResponse.json({ answer: aiResponse.answer_text, citations: matchedContentIds, cache_hit: false });

  } catch (error: any) {
    console.error('[Ask Expert] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
