/**
 * Token Counting Service
 *
 * Comprehensive token counting infrastructure for conversation memory management.
 * Supports multiple AI providers with provider-specific counting methods.
 *
 * Features:
 * - Client-side counting (OpenAI/Azure): <10ms latency
 * - API-based counting (Google/Anthropic/Bedrock): Cached for 5 minutes
 * - Estimation fallback: For unsupported providers
 * - Automatic caching: 5-minute TTL with cache hit/miss tracking
 *
 * @example
 * ```typescript
 * import { countTokens } from './services/tokenCounting';
 *
 * const result = await countTokens('openai', {
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   model: 'gpt-4',
 * });
 *
 * console.log(`Tokens: ${result.inputTokens}`);
 * console.log(`Method: ${result.method}`);
 * console.log(`Latency: ${result.latency}ms`);
 * ```
 */

// Main exports
export {
  countTokens,
  countTokensAuto,
  clearCounterCache,
  getSupportedProviders,
} from "./tokenCounterFactory.js";

// Counter exports
export {
  createOpenAICounter,
  createGoogleCounter,
  createAnthropicCounter,
  createBedrockCounter,
  createMistralCounter,
  createEstimationCounter,
  OpenAITokenCounter,
  GoogleTokenCounter,
  AnthropicTokenCounter,
  BedrockTokenCounter,
  MistralTokenCounter,
  EstimationTokenCounter,
} from "./counters/index.js";

// Utility exports
export {
  generateCacheKey,
  getCachedResult,
  setCachedResult,
  cleanExpiredEntries,
  clearCache,
  getCacheStats,
  stopCacheCleanup,
  hashMessages,
  normalizeMessages,
  messagesToText,
  calculateMessageSize,
  validateMessages,
} from "./utils/index.js";

// Type exports
export type {
  TokenCounter,
  TokenCountInput,
  TokenCountResult,
  TokenCountMethod,
  TokenCountAccuracy,
  TokenCountCacheEntry,
  AIProviderName,
} from "../../types/conversation.js";
