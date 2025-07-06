import type { ProviderModelConfig } from "./types.js";

/**
 * Comprehensive provider configurations for evaluation
 * All 9 NeuroLink providers with cost and performance data
 */
export const EVALUATION_PROVIDER_CONFIGS: Record<string, ProviderModelConfig> =
  {
    "google-ai": {
      provider: "google-ai",
      models: {
        fast: "gemini-2.5-flash",
        balanced: "gemini-2.5-pro",
        quality: "gemini-2.5-pro",
      },
      costPerToken: { input: 0.000075, output: 0.0003 },
      requiresApiKey: ["GOOGLE_AI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
      performance: { speed: 3, quality: 3, cost: 3 },
    },

    openai: {
      provider: "openai",
      models: {
        fast: "gpt-4o-mini",
        balanced: "gpt-4o",
        quality: "gpt-4o",
      },
      costPerToken: { input: 0.00015, output: 0.0006 },
      requiresApiKey: ["OPENAI_API_KEY"],
      performance: { speed: 2, quality: 3, cost: 2 },
    },

    anthropic: {
      provider: "anthropic",
      models: {
        fast: "claude-3-haiku-20240307",
        balanced: "claude-3-sonnet-20240229",
        quality: "claude-3-opus-20240229",
      },
      costPerToken: { input: 0.00025, output: 0.00125 },
      requiresApiKey: ["ANTHROPIC_API_KEY"],
      performance: { speed: 2, quality: 3, cost: 2 },
    },

    vertex: {
      provider: "vertex",
      models: {
        fast: "gemini-2.5-flash",
        balanced: "gemini-2.5-pro",
        quality: "gemini-2.5-pro",
      },
      costPerToken: { input: 0.000075, output: 0.0003 },
      requiresApiKey: [
        "GOOGLE_VERTEX_PROJECT",
        "GOOGLE_APPLICATION_CREDENTIALS",
      ],
      performance: { speed: 2, quality: 3, cost: 3 },
    },

    bedrock: {
      provider: "bedrock",
      models: {
        fast: "anthropic.claude-3-haiku-20240307-v1:0",
        balanced: "anthropic.claude-3-sonnet-20240229-v1:0",
        quality: "anthropic.claude-3-opus-20240229-v1:0",
      },
      costPerToken: { input: 0.00025, output: 0.00125 },
      requiresApiKey: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
      performance: { speed: 2, quality: 3, cost: 2 },
    },

    azure: {
      provider: "azure",
      models: {
        fast: "gpt-4o-mini",
        balanced: "gpt-4o",
        quality: "gpt-4o",
      },
      costPerToken: { input: 0.00015, output: 0.0006 },
      requiresApiKey: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"],
      performance: { speed: 2, quality: 3, cost: 2 },
    },

    ollama: {
      provider: "ollama",
      models: {
        fast: "llama3.2:latest",
        balanced: "llama3.1:8b",
        quality: "llama3.1:70b",
      },
      costPerToken: { input: 0, output: 0 }, // Local model
      requiresApiKey: [], // No API key needed
      performance: { speed: 1, quality: 2, cost: 3 },
    },

    huggingface: {
      provider: "huggingface",
      models: {
        fast: "microsoft/DialoGPT-medium",
        balanced: "microsoft/DialoGPT-large",
        quality: "meta-llama/Llama-2-7b-chat-hf",
      },
      costPerToken: { input: 0.0002, output: 0.0006 },
      requiresApiKey: ["HUGGINGFACE_API_KEY"],
      performance: { speed: 1, quality: 2, cost: 2 },
    },

    mistral: {
      provider: "mistral",
      models: {
        fast: "mistral-small-latest",
        balanced: "mistral-medium-latest",
        quality: "mistral-large-latest",
      },
      costPerToken: { input: 0.0002, output: 0.0006 },
      requiresApiKey: ["MISTRAL_API_KEY"],
      performance: { speed: 2, quality: 2, cost: 2 },
    },
  };

/**
 * Get provider configuration by name
 */
export function getProviderConfig(
  providerName: string,
): ProviderModelConfig | null {
  return EVALUATION_PROVIDER_CONFIGS[providerName] || null;
}

/**
 * Get all available providers with required API keys present
 */
export function getAvailableProviders(): ProviderModelConfig[] {
  return Object.values(EVALUATION_PROVIDER_CONFIGS).filter((config) => {
    if (config.requiresApiKey.length === 0) {
      return true;
    } // Ollama
    return config.requiresApiKey.some((key) => process.env[key]);
  });
}

/**
 * Sort providers by preference (cost, speed, quality)
 */
export function sortProvidersByPreference(
  providers: ProviderModelConfig[],
  preferCheap: boolean = true,
): ProviderModelConfig[] {
  return providers.sort((a, b) => {
    if (preferCheap) {
      // Cost > Speed > Quality for cheap preference
      if (a.performance.cost !== b.performance.cost) {
        return b.performance.cost - a.performance.cost;
      }
      if (a.performance.speed !== b.performance.speed) {
        return b.performance.speed - a.performance.speed;
      }
      return b.performance.quality - a.performance.quality;
    } else {
      // Quality > Speed > Cost for quality preference
      if (a.performance.quality !== b.performance.quality) {
        return b.performance.quality - a.performance.quality;
      }
      if (a.performance.speed !== b.performance.speed) {
        return b.performance.speed - a.performance.speed;
      }
      return b.performance.cost - a.performance.cost;
    }
  });
}

/**
 * Estimate cost for a specific provider and token usage
 */
export function estimateProviderCost(
  providerName: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const config = getProviderConfig(providerName);
  if (!config || !config.costPerToken) {
    return 0;
  }

  return (
    inputTokens * config.costPerToken.input +
    outputTokens * config.costPerToken.output
  );
}

/**
 * Check if a provider is available (has required API keys)
 */
export function isProviderAvailable(providerName: string): boolean {
  const config = getProviderConfig(providerName);
  if (!config) {
    return false;
  }

  if (config.requiresApiKey.length === 0) {
    return true;
  } // Ollama
  return config.requiresApiKey.some((key) => process.env[key]);
}

/**
 * Get the best available provider based on preference
 */
export function getBestAvailableProvider(
  preferCheap: boolean = true,
): ProviderModelConfig | null {
  const availableProviders = getAvailableProviders();
  if (availableProviders.length === 0) {
    return null;
  }

  const sortedProviders = sortProvidersByPreference(
    availableProviders,
    preferCheap,
  );
  return sortedProviders[0];
}
