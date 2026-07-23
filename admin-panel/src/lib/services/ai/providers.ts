import { AIService, AIRequest, AIResponse } from './AIService';

export class AnthropicProvider implements AIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateAnswer(request: AIRequest): Promise<AIResponse> {
    // TODO: Implement actual Anthropic SDK call
    console.log(`[Anthropic] Generating answer for: ${request.question}`);
    return {
      answer_text: 'This is a dummy response from Anthropic.',
      model_name: 'claude-3-5-sonnet-20240620',
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
      provider: 'anthropic',
      latency_ms: 0,
    };
  }
}

export class OpenAIProvider implements AIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateAnswer(request: AIRequest): Promise<AIResponse> {
    // TODO: Implement actual OpenAI SDK call
    console.log(`[OpenAI] Generating answer for: ${request.question}`);
    return {
      answer_text: 'This is a dummy response from OpenAI.',
      model_name: 'gpt-4o-mini',
      prompt_tokens: 110,
      completion_tokens: 60,
      total_tokens: 170,
      provider: 'openai',
      latency_ms: 0,
    };
  }
}

export class GeminiProvider implements AIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateAnswer(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const prompt = request.systemPrompt
      ? `${request.systemPrompt}\n\nQuestion: ${request.question}\n\nContext: ${request.context}`
      : `Question: ${request.question}\n\nContext: ${request.context}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.model ?? 'gemini-1.5-flash'}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: request.maxTokens ?? 512,
            temperature: request.temperature ?? 0.4,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`[Gemini] API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const answer_text = candidate?.content?.parts?.[0]?.text ?? 'No response generated.';
    const usage = data?.usageMetadata ?? {};

    return {
      answer_text,
      model_name: request.model ?? 'gemini-1.5-flash',
      prompt_tokens: usage.promptTokenCount ?? 0,
      completion_tokens: usage.candidatesTokenCount ?? 0,
      total_tokens: usage.totalTokenCount ?? 0,
      finish_reason: candidate?.finishReason,
      provider: 'gemini',
      latency_ms: Date.now() - start,
    };
  }
}
