export interface AIRequest {
  question: string;
  context: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  answer_text: string;
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  finish_reason?: string;
  provider: string;
  latency_ms: number;
}

export interface AIService {
  generateAnswer(request: AIRequest): Promise<AIResponse>;
}
