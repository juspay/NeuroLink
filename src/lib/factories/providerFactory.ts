import stringSimilarity from "string-similarity";
const { findBestMatch } = stringSimilarity;
import type {
  AIProvider,
  AIProviderName,
  ProviderHealth,
} from "../types/index.js";
import type { UnknownRecord } from "../types/common.js";
import { logger } from "../utils/logger.js";

// Pure factory pattern with no hardcoded imports
// All providers loaded dynamically via registry to avoid circular dependencies

/**
 * Provider constructor interface - supports both sync constructors and async factory functions
 */
type ProviderConstructor =
  | {
      new (
        modelName?: string,
        providerName?: string,
        sdk?: UnknownRecord,
      ): AIProvider;
    }
  | ((
      modelName?: string,
      providerName?: string,
      sdk?: UnknownRecord,
    ) => Promise<AIProvider>);

/**
 * Provider registration entry
 */
interface ProviderRegistration {
  primaryName: string; // canonical registration name (lowercase)
  constructor: ProviderConstructor;
  defaultModel?: string; // Optional - provider can read from env
  modelEnvVar?: string; // Optional - environment variable for model name
  aliases?: string[];
  isFactory?: boolean; // Explicitly mark if the constructor is a factory function
}

/**
 * True Factory Pattern implementation for AI Providers
 * Uses registration-based approach to eliminate switch statements
 * and enable dynamic provider registration
 */
export class ProviderFactory {
  private static readonly SIMILARITY_SUGGESTION_THRESHOLD = 0.6;
  static healthCheckTtlMs = 300_000;
  private static readonly providers = new Map<string, ProviderRegistration>();
  private static readonly providerCache = new Map<string, AIProvider>();
  private static readonly providerStatus = new Map<
    string,
    { isHealthy: boolean; lastCheck: number }
  >();
  private static initialized = false;

  /**
   * Register a provider with the factory
   */
  static registerProvider(
    name: AIProviderName | string,
    constructor: ProviderConstructor,
    defaultModel?: string,
    aliases: string[] = [],
    modelEnvVar?: string,
    isFactory?: boolean,
  ): void {
    const registration: ProviderRegistration = {
      primaryName: String(name).toLowerCase(),
      constructor,
      defaultModel,
      aliases,
      modelEnvVar,
      isFactory,
    };

    // Register main name
    this.providers.set(name.toLowerCase(), registration);

    // Register aliases
    aliases.forEach((alias) => {
      this.providers.set(alias.toLowerCase(), registration);
    });

    logger.debug(
      `Registered provider: ${name} with model ${defaultModel || "from-env"}`,
    );
  }
  /**
   * Create a provider instance
   */
  static async createProvider(
    providerName: AIProviderName | string,
    modelName?: string,
    sdk?: UnknownRecord,
  ): Promise<AIProvider> {
    const normalizedName = providerName.toLowerCase();
    const resolvedProviderName =
      this.normalizeProviderName(providerName) || normalizedName;

    const registration = this.providers.get(resolvedProviderName);

    if (!registration) {
      const availableProviders = this.getAvailableProviders();
      const bestMatch = findBestMatch(
        normalizedName,
        availableProviders,
      ).bestMatch;

      let errorMessage = `Unknown provider: '${providerName}'.`;
      if (bestMatch.rating > this.SIMILARITY_SUGGESTION_THRESHOLD) {
        // Suggest only if the similarity is reasonably high
        errorMessage += ` Did you mean '${bestMatch.target}'?`;
      }
      errorMessage += `\nAvailable providers: ${availableProviders.join(", ")}`;

      throw new Error(errorMessage);
    }

    // Resolve the final model name *before* generating the cache key
    const model =
      modelName ||
      (registration.modelEnvVar && process.env[registration.modelEnvVar]) ||
      registration.defaultModel;

    const canonicalName = registration.primaryName;
    const cacheKey = `${canonicalName}:${model || "default"}`;

    // Check cache first with the correctly resolved model name
    if (this.providerCache.has(cacheKey)) {
      const status = this.providerStatus.get(cacheKey);
      const ttlMs = ProviderFactory.healthCheckTtlMs ?? 300_000;
      if (status?.isHealthy && Date.now() - status.lastCheck < ttlMs) {
        // 5-minute health check validity
        return this.providerCache.get(cacheKey)!;
      }
    }

    try {
      let providerInstance: AIProvider;

      const ctor = registration.constructor;
      // Use the explicit `isFactory` flag if available, otherwise fallback to the heuristic
      // for backward compatibility with any registrations that don't use the new flag.
      const isFactoryFunction =
        registration.isFactory ?? typeof ctor.prototype === "undefined";

      if (isFactoryFunction) {
        // Treat as a factory function
        providerInstance = await (
          ctor as (
            modelName?: string,
            providerName?: string,
            sdk?: UnknownRecord,
          ) => Promise<AIProvider>
        )(model, canonicalName, sdk);
      } else {
        // Treat as a class constructor
        providerInstance = new (ctor as new (
          modelName?: string,
          providerName?: string,
          sdk?: UnknownRecord,
        ) => AIProvider)(model, canonicalName, sdk);
      }

      // Perform health check if available
      if (typeof providerInstance.healthCheck === "function") {
        const health: ProviderHealth = await providerInstance.healthCheck();
        this.providerStatus.set(cacheKey, {
          isHealthy: health.isHealthy,
          lastCheck: Date.now(),
        });
        if (!health.isHealthy) {
          throw new Error(
            `Provider ${providerName} failed health check: ${health.message || "Unknown error"}`,
          );
        }
      } else {
        // If no health check, assume healthy
        this.providerStatus.set(cacheKey, {
          isHealthy: true,
          lastCheck: Date.now(),
        });
      }

      this.providerCache.set(cacheKey, providerInstance);
      return providerInstance;
    } catch (error) {
      logger.error(`Failed to create provider ${providerName}:`, error);
      // Set status to unhealthy *before* throwing
      this.providerStatus.set(cacheKey, {
        isHealthy: false,
        lastCheck: Date.now(),
      });
      // Re-throw original error to preserve stack trace and context
      throw error;
    }
  }

  /**
   * Check if a provider is registered
   */
  static hasProvider(providerName: string): boolean {
    return this.providers.has(providerName.toLowerCase());
  }
  /**
   * Get list of available providers
   */
  static getAvailableProviders(): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const [, reg] of this.providers) {
      const name = reg.primaryName;
      if (!seen.has(name)) {
        seen.add(name);
        result.push(name);
      }
    }
    return result;
  }

  /**
   * Get provider registration info
   */
  static getProviderInfo(
    providerName: string,
  ): ProviderRegistration | undefined {
    return this.providers.get(providerName.toLowerCase());
  }

  /**
   * Normalize provider names using aliases (PHASE 1: Factory Pattern)
   */
  static normalizeProviderName(providerName: string): string | null {
    const normalized = providerName.toLowerCase();
    const registration = this.providers.get(normalized);

    if (registration) {
      return registration.primaryName;
    }

    return null;
  }

  /**
   * Clear all registrations (mainly for testing)
   */
  static clearRegistrations(): void {
    this.providers.clear();
    this.providerCache.clear();
    this.providerStatus.clear();
    this.initialized = false;
  }

  /**
   * Ensure providers are initialized
   */
  private static ensureInitialized(): void {
    if (!this.initialized) {
      this.initializeDefaultProviders();
      this.initialized = true;
    }
  }

  /**
   * Initialize default providers
   * NOTE: Providers are now registered by ProviderRegistry to avoid circular dependencies
   */
  private static initializeDefaultProviders(): void {
    logger.debug(
      "BaseProvider factory pattern ready - providers registered by ProviderRegistry",
    );
    // No hardcoded registrations - all done dynamically by ProviderRegistry
  }

  /**
   * Create the best available provider for the given name
   * Used by NeuroLink SDK for streaming and generation
   */
  static async createBestProvider(
    providerName: AIProviderName | string,
    modelName?: string,
    enableMCP?: boolean,
    sdk?: UnknownRecord,
  ): Promise<AIProvider> {
    return await this.createProvider(providerName, modelName, sdk);
  }
}

/**
 * Helper function to create providers with backward compatibility
 */
export async function createAIProvider(
  providerName: AIProviderName | string,
  modelName?: string,
): Promise<AIProvider> {
  return await ProviderFactory.createProvider(providerName, modelName);
}
