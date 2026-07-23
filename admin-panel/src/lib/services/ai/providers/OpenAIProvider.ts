import OpenAI from 'openai';
import { AIService, AIRequest, AIResponse } from '../AIService';

export class OpenAIProvider implements AIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateAnswer(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const response = await this.client.responses.create({
      model: request.model || 'gpt-4.1',
      input: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.question },
      ],
      ...(request.maxTokens && { max_output_tokens: request.maxTokens }),
      ...(request.temperature && { temperature: request.temperature }),
    });

    return {
      answer_text: response.output_text,
      model_name: response.model,
      prompt_tokens: response.usage?.input_tokens ?? 0,
      completion_tokens: response.usage?.output_tokens ?? 0,
      total_tokens: response.usage?.total_tokens ?? 0,
      finish_reason: 'stop',
      provider: 'openai',
      latency_ms: Date.now() - start,
    };
  }
}
