import OpenAI from 'openai';
import { AIService, AIRequest, AIResponse } from '../AIService';

export class OpenRouterProvider implements AIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async generateAnswer(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: request.model || 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.question },
      ],
      max_tokens: request.maxTokens ?? 512,
      ...(request.temperature && { temperature: request.temperature }),
    });

    const choice = response.choices?.[0];

    return {
      answer_text: choice?.message?.content ?? '',
      model_name: response.model,
      prompt_tokens: response.usage?.prompt_tokens ?? 0,
      completion_tokens: response.usage?.completion_tokens ?? 0,
      total_tokens: response.usage?.total_tokens ?? 0,
      finish_reason: choice?.finish_reason,
      provider: 'openrouter',
      latency_ms: Date.now() - start,
    };
  }
}
