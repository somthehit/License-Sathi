import Anthropic from '@anthropic-ai/sdk';
import { AIService, AIRequest, AIResponse } from '../AIService';

export class AnthropicProvider implements AIService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateAnswer(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const response = await this.client.messages.create({
      model: request.model || 'claude-sonnet-4',
      max_tokens: request.maxTokens ?? 1024,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.question }],
      ...(request.temperature && { temperature: request.temperature }),
    });

    const content = response.content.find((c) => c.type === 'text');

    return {
      answer_text: content?.text ?? '',
      model_name: response.model,
      prompt_tokens: response.usage?.input_tokens ?? 0,
      completion_tokens: response.usage?.output_tokens ?? 0,
      total_tokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
      finish_reason: response.stop_reason,
      provider: 'anthropic',
      latency_ms: Date.now() - start,
    };
  }
}
