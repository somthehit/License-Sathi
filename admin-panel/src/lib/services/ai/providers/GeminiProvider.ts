import { GoogleGenAI } from '@google/genai';
import { AIService, AIRequest, AIResponse } from '../AIService';

export class GeminiProvider implements AIService {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateAnswer(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const response = await this.client.models.generateContent({
      model: request.model || 'gemini-2.0-flash-lite',
      contents: `${request.systemPrompt}\n\nQuestion:\n${request.question}`,
      ...(request.maxTokens && { config: { maxOutputTokens: request.maxTokens } }),
    });

    return {
      answer_text: response.text,
      model_name: request.model || 'gemini-2.0-flash-lite',
      prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
      finish_reason: 'stop',
      provider: 'gemini',
      latency_ms: Date.now() - start,
    };
  }
}
