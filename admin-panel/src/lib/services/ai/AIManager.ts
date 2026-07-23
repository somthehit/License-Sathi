import { AIService, AIRequest, AIResponse } from "./AIService";

interface ProviderConfig {
  name: string;
  service: AIService;
}

export class AIManager {
  constructor(
    private readonly primary: ProviderConfig,
    private readonly fallback?: ProviderConfig
  ) {}

  private async executeWithTimeout(
    provider: ProviderConfig,
    request: AIRequest,
    timeoutMs: number
  ): Promise<AIResponse> {
    console.log(`[AIManager] ${provider.name} → Starting request (${timeoutMs}ms timeout)`);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${provider.name} request timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    return Promise.race([
      provider.service.generateAnswer(request),
      timeoutPromise,
    ]) as Promise<AIResponse>;
  }

  private async runProvider(
    provider: ProviderConfig,
    request: AIRequest,
    retries = 0,
    timeoutMs = 20000
  ): Promise<AIResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[AIManager] ${provider.name} attempt ${attempt + 1}/${retries + 1}`);
        return await this.executeWithTimeout(provider, request, timeoutMs);
      } catch (error) {
        lastError = error;
        console.error(`[AIManager] ${provider.name} attempt ${attempt + 1} failed:`, error);
        if (attempt < retries) {
          console.log(`[AIManager] Retrying ${provider.name}...`);
        }
      }
    }

    throw lastError;
  }

  async generateAnswer(request: AIRequest): Promise<AIResponse> {
    const errors: string[] = [];

    try {
      return await this.runProvider(this.primary, request, 1, 20000);
    } catch (error: any) {
      errors.push(`${this.primary.name}: ${error?.message ?? "Unknown error"}`);
    }

    if (this.fallback) {
      try {
        console.log(`[AIManager] Switching to fallback provider: ${this.fallback.name}`);
        return await this.runProvider(this.fallback, request, 0, 20000);
      } catch (error: any) {
        errors.push(`${this.fallback.name}: ${error?.message ?? "Unknown error"}`);
      }
    }

    console.error("[AIManager] All providers failed.", errors);
    throw new Error(`All AI providers failed.\n${errors.join("\n")}`);
  }
}
