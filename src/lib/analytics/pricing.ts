/**
 * Provider Pricing Mapping and Cost Calculation Helpers
 * Supports OpenAI, Anthropic, Google, DeepSeek, and Groq.
 */

export interface TokenPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

/**
 * Pricing rates per million tokens in USD
 */
export const ADVANCED_MODEL_PRICING: Record<string, TokenPricing> = {
  // OpenAI
  "gpt-4o": { inputPricePerMillion: 2.5, outputPricePerMillion: 10.0 },
  "gpt-4o-mini": { inputPricePerMillion: 0.15, outputPricePerMillion: 0.6 },
  "o1": { inputPricePerMillion: 15.0, outputPricePerMillion: 60.0 },
  "o1-mini": { inputPricePerMillion: 3.0, outputPricePerMillion: 12.0 },

  // Anthropic
  "claude-3-5-sonnet-20241022": { inputPricePerMillion: 3.0, outputPricePerMillion: 15.0 },
  "claude-3-5-haiku-20241022": { inputPricePerMillion: 0.8, outputPricePerMillion: 4.0 },
  "claude-3-opus-20240229": { inputPricePerMillion: 15.0, outputPricePerMillion: 75.0 },

  // Google
  "gemini-2.5-flash": { inputPricePerMillion: 0.15, outputPricePerMillion: 0.6 },
  "gemini-2.5-pro": { inputPricePerMillion: 1.25, outputPricePerMillion: 10.0 },
  "gemini-1.5-flash": { inputPricePerMillion: 0.075, outputPricePerMillion: 0.3 },
  "gemini-1.5-pro": { inputPricePerMillion: 1.25, outputPricePerMillion: 5.0 },

  // DeepSeek
  "deepseek-chat": { inputPricePerMillion: 0.14, outputPricePerMillion: 0.28 },
  "deepseek-reasoner": { inputPricePerMillion: 0.55, outputPricePerMillion: 2.19 },

  // Groq
  "llama3-8b-8192": { inputPricePerMillion: 0.05, outputPricePerMillion: 0.08 },
  "llama3-70b-8192": { inputPricePerMillion: 0.59, outputPricePerMillion: 0.79 },
  "mixtral-8x7b-32768": { inputPricePerMillion: 0.24, outputPricePerMillion: 0.24 },
};

/**
 * Helper to calculate cost from token counts and model/provider
 * Fallback safely to 0 when pricing is unavailable.
 *
 * @param model - Model name
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Total cost in USD
 */
export function calculateAdvancedCost(
  model: string | undefined,
  inputTokens: number,
  outputTokens: number,
): number {
  if (!model) {
    return 0;
  }

  // Find exact match or partial match (e.g., if model name contains the key)
  let pricing = ADVANCED_MODEL_PRICING[model];
  if (!pricing) {
    const matchedKey = Object.keys(ADVANCED_MODEL_PRICING).find((k) => model.includes(k));
    if (matchedKey) {
      pricing = ADVANCED_MODEL_PRICING[matchedKey];
    }
  }

  if (!pricing) {
    return 0; // Fallback safely when pricing unavailable
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;
  return inputCost + outputCost;
}
