/**
 * Reranker Registry
 *
 * Centralized registry for all reranker implementations with metadata
 * and discovery capabilities. Follows the BaseRegistry pattern.
 */

import { BaseRegistry } from "../../core/infrastructure/index.js";
import { logger } from "../../utils/logger.js";
import { RAGErrorCodes, RerankerError } from "../errors/RAGError.js";
import type {
  Reranker,
  RerankerConfig,
  RerankerMetadata,
  RerankerType,
} from "../../types/index.js";

/**
 * Default reranker metadata entries
 */
const DEFAULT_RERANKER_METADATA: Record<RerankerType, RerankerMetadata> = {
  llm: {
    description: "LLM-powered semantic reranking with multi-factor scoring",
    defaultConfig: {
      topK: 3,
      weights: { semantic: 0.4, vector: 0.4, position: 0.2 },
    },
    supportedOptions: ["model", "provider", "topK", "weights"],
    useCases: [
      "High-quality semantic reranking",
      "Complex query understanding",
      "Context-aware scoring",
    ],
    aliases: ["semantic", "ai", "model-based"],
    requiresModel: true,
    requiresExternalAPI: false,
  },
  "cross-encoder": {
    description: "Cross-encoder model for query-document relevance scoring",
    defaultConfig: {
      topK: 3,
      model: "ms-marco-MiniLM-L-6-v2",
    },
    supportedOptions: ["model", "topK"],
    useCases: [
      "High-precision reranking",
      "Search result refinement",
      "Academic/research applications",
    ],
    aliases: ["cross", "encoder", "bi-encoder"],
    requiresModel: true,
    requiresExternalAPI: false,
  },
  cohere: {
    description: "Cohere Rerank API for production-grade relevance scoring",
    defaultConfig: {
      topK: 3,
      model: "rerank-v3.5",
    },
    supportedOptions: ["model", "topK", "apiKey"],
    useCases: [
      "Production search systems",
      "Enterprise applications",
      "High-volume reranking",
    ],
    aliases: ["cohere-rerank", "cohere-api"],
    requiresModel: false,
    requiresExternalAPI: true,
  },
  simple: {
    description: "Position and vector score-based reranking (no LLM required)",
    defaultConfig: {
      topK: 3,
      weights: { vector: 0.8, position: 0.2 },
    },
    supportedOptions: ["topK", "weights"],
    useCases: [
      "Fast reranking",
      "Low-latency requirements",
      "When LLM is unavailable",
    ],
    aliases: ["fast", "basic", "position-based"],
    requiresModel: false,
    requiresExternalAPI: false,
  },
  batch: {
    description: "Batch LLM reranking for efficient multi-document scoring",
    defaultConfig: {
      topK: 3,
      weights: { semantic: 0.4, vector: 0.4, position: 0.2 },
    },
    supportedOptions: ["model", "provider", "topK", "weights"],
    useCases: [
      "Large result sets",
      "Cost-efficient LLM usage",
      "Batch processing pipelines",
    ],
    aliases: ["batch-llm", "efficient", "bulk"],
    requiresModel: true,
    requiresExternalAPI: false,
  },
};

/**
 * Reranker Registry
 *
 * Manages registration and discovery of all reranker implementations.
 * Extends BaseRegistry for consistent lifecycle management.
 */
export class RerankerRegistry extends BaseRegistry<Reranker, RerankerMetadata> {
  private static instance: RerankerRegistry | null = null;
  private aliasMap = new Map<string, RerankerType>();

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RerankerRegistry {
    if (!RerankerRegistry.instance) {
      RerankerRegistry.instance = new RerankerRegistry();
    }
    return RerankerRegistry.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    if (RerankerRegistry.instance) {
      RerankerRegistry.instance.clear();
      RerankerRegistry.instance = null;
    }
  }

  /**
   * Register all built-in rerankers
   */
  protected async registerAll(): Promise<void> {
    // Import reranker functions
    const rerankerModule = await import("./reranker.js");

    // Register LLM reranker
    this.registerReranker(
      "llm",
      async () => this.createLLMRerankerInstance(rerankerModule.rerank),
      DEFAULT_RERANKER_METADATA.llm,
    );

    // Register cross-encoder reranker
    this.registerReranker(
      "cross-encoder",
      async () =>
        this.createCrossEncoderInstance(rerankerModule.CrossEncoderReranker),
      DEFAULT_RERANKER_METADATA["cross-encoder"],
    );

    // Register Cohere reranker
    this.registerReranker(
      "cohere",
      async () =>
        this.createCohereInstance(rerankerModule.CohereRelevanceScorer),
      DEFAULT_RERANKER_METADATA.cohere,
    );

    // Register simple reranker
    this.registerReranker(
      "simple",
      async () =>
        this.createSimpleRerankerInstance(rerankerModule.simpleRerank),
      DEFAULT_RERANKER_METADATA.simple,
    );

    // Register batch reranker
    this.registerReranker(
      "batch",
      async () => this.createBatchRerankerInstance(rerankerModule.batchRerank),
      DEFAULT_RERANKER_METADATA.batch,
    );

    logger.debug(
      `[RerankerRegistry] Registered ${this.items.size} reranker types`,
    );
  }

  /**
   * Create LLM reranker instance wrapper
   */
  private createLLMRerankerInstance(
    _rerankFn: typeof import("./reranker.js").rerank,
  ): Reranker {
    return {
      type: "llm" as RerankerType,
      async rerank() {
        throw new RerankerError(
          "LLM reranker requires model provider. Use RerankerFactory.createReranker() instead.",
          {
            rerankerType: "llm",
          },
        );
      },
    };
  }

  /**
   * Create cross-encoder instance wrapper
   */
  private createCrossEncoderInstance(
    CrossEncoderClass: typeof import("./reranker.js").CrossEncoderReranker,
  ): Reranker {
    const encoder = new CrossEncoderClass();
    return {
      type: "cross-encoder" as RerankerType,
      async rerank(results, query, options) {
        const documents = results.map(
          (r) => r.text || (r.metadata?.text as string) || "",
        );
        const scores = await encoder.rerank(query, documents);
        const topK = options?.topK ?? 3;

        return scores
          .map((s) => ({
            result: results[s.index],
            score: s.score,
            details: {
              semantic: s.score,
              vector: results[s.index].score ?? 0,
              position: 1 - s.index / results.length,
            },
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
      },
    };
  }

  /**
   * Create Cohere instance wrapper
   */
  private createCohereInstance(
    CohereClass: typeof import("./reranker.js").CohereRelevanceScorer,
  ): Reranker {
    const scorer = new CohereClass();
    return {
      type: "cohere" as RerankerType,
      async rerank(results, query, options) {
        const documents = results.map(
          (r) => r.text || (r.metadata?.text as string) || "",
        );
        const scores = await scorer.score(query, documents);
        const topK = options?.topK ?? 3;

        return scores
          .map((s) => ({
            result: results[s.index],
            score: s.score,
            details: {
              semantic: s.score,
              vector: results[s.index].score ?? 0,
              position: 1 - s.index / results.length,
            },
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
      },
    };
  }

  /**
   * Create simple reranker instance wrapper
   */
  private createSimpleRerankerInstance(
    simpleRerankFn: typeof import("./reranker.js").simpleRerank,
  ): Reranker {
    return {
      type: "simple" as RerankerType,
      async rerank(results, _query, options) {
        return simpleRerankFn(results, {
          topK: options?.topK,
          vectorWeight: options?.weights?.vector,
          positionWeight: options?.weights?.position,
        });
      },
    };
  }

  /**
   * Create batch reranker instance wrapper
   */
  private createBatchRerankerInstance(
    _batchRerankFn: typeof import("./reranker.js").batchRerank,
  ): Reranker {
    return {
      type: "batch" as RerankerType,
      async rerank() {
        throw new RerankerError(
          "Batch reranker requires model provider. Use RerankerFactory.createReranker() instead.",
          {
            rerankerType: "batch",
          },
        );
      },
    };
  }

  /**
   * Register a reranker with aliases
   */
  registerReranker(
    type: RerankerType,
    factory: () => Promise<Reranker>,
    metadata: RerankerMetadata,
  ): void {
    this.register(type, factory, metadata.aliases, { metadata });

    // Register aliases in local alias map for type resolution
    for (const alias of metadata.aliases) {
      this.aliasMap.set(alias.toLowerCase(), type);
      logger.debug(
        `[RerankerRegistry] Registered alias '${alias}' -> '${type}'`,
      );
    }
  }

  /**
   * Resolve type from alias
   */
  resolveType(nameOrAlias: string): RerankerType {
    const lower = nameOrAlias.toLowerCase();

    // Check if it's a direct type
    if (this.items.has(lower)) {
      return lower as RerankerType;
    }

    // Check aliases
    const resolved = this.aliasMap.get(lower);
    if (resolved) {
      return resolved;
    }

    throw new RerankerError(
      `Unknown reranker type: '${nameOrAlias}'. Available types: ${this.list()
        .map((item) => item.id)
        .join(", ")}`,
      {
        code: RAGErrorCodes.RERANKER_NOT_FOUND,
        rerankerType: nameOrAlias,
        details: {
          requestedType: nameOrAlias,
          availableTypes: this.list().map((item) => item.id),
        },
      },
    );
  }

  /**
   * Get a reranker by type or alias
   */
  async getReranker(typeOrAlias: string): Promise<Reranker> {
    await this.ensureInitialized();
    const type = this.resolveType(typeOrAlias);
    const reranker = await this.get(type);

    if (!reranker) {
      throw new RerankerError(`Reranker not found: ${type}`, {
        code: RAGErrorCodes.RERANKER_NOT_FOUND,
        rerankerType: type,
        details: { type },
      });
    }

    return reranker;
  }

  /**
   * Get list of available reranker types
   */
  async getAvailableRerankers(): Promise<RerankerType[]> {
    await this.ensureInitialized();
    return this.list().map((item) => item.id as RerankerType);
  }

  /**
   * Get metadata for a specific reranker
   */
  getRerankerMetadata(typeOrAlias: string): RerankerMetadata | undefined {
    const type = this.resolveType(typeOrAlias);
    const entry = this.list().find((item) => item.id === type);
    return entry?.metadata;
  }

  /**
   * Get all aliases for a type
   */
  getAliasesForType(type: RerankerType): string[] {
    const metadata = DEFAULT_RERANKER_METADATA[type];
    return metadata?.aliases ?? [];
  }

  /**
   * Get all registered aliases
   */
  getAllAliases(): Map<string, RerankerType> {
    return new Map(this.aliasMap);
  }

  /**
   * Check if a type or alias exists
   */
  hasReranker(typeOrAlias: string): boolean {
    try {
      this.resolveType(typeOrAlias);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get rerankers by use case
   */
  getRerankersByUseCase(useCase: string): RerankerType[] {
    const matches: RerankerType[] = [];
    const useCaseLower = useCase.toLowerCase();

    for (const [type, metadata] of Object.entries(DEFAULT_RERANKER_METADATA)) {
      const hasMatchingUseCase = metadata.useCases.some((uc) =>
        uc.toLowerCase().includes(useCaseLower),
      );
      if (hasMatchingUseCase) {
        matches.push(type as RerankerType);
      }
    }

    return matches;
  }

  /**
   * Get default configuration for a reranker
   */
  getDefaultConfig(typeOrAlias: string): Partial<RerankerConfig> | undefined {
    const metadata = this.getRerankerMetadata(typeOrAlias);
    return metadata?.defaultConfig;
  }

  /**
   * Get rerankers that don't require external APIs
   */
  getLocalRerankers(): RerankerType[] {
    const matches: RerankerType[] = [];

    for (const [type, metadata] of Object.entries(DEFAULT_RERANKER_METADATA)) {
      if (!metadata.requiresExternalAPI) {
        matches.push(type as RerankerType);
      }
    }

    return matches;
  }

  /**
   * Get rerankers that don't require AI models
   */
  getModelFreeRerankers(): RerankerType[] {
    const matches: RerankerType[] = [];

    for (const [type, metadata] of Object.entries(DEFAULT_RERANKER_METADATA)) {
      if (!metadata.requiresModel) {
        matches.push(type as RerankerType);
      }
    }

    return matches;
  }

  /**
   * Clear the registry (also clears aliases)
   */
  override clear(): void {
    super.clear();
    this.aliasMap.clear();
  }
}

/**
 * Global reranker registry singleton
 */
export const rerankerRegistry = RerankerRegistry.getInstance();

/**
 * Convenience function to get available rerankers
 */
export async function getAvailableRerankers(): Promise<RerankerType[]> {
  return rerankerRegistry.getAvailableRerankers();
}

/**
 * Convenience function to get reranker by type
 */
export async function getReranker(typeOrAlias: string): Promise<Reranker> {
  return rerankerRegistry.getReranker(typeOrAlias);
}

/**
 * Convenience function to get reranker metadata
 */
export function getRegisteredRerankerMetadata(
  typeOrAlias: string,
): RerankerMetadata | undefined {
  return rerankerRegistry.getRerankerMetadata(typeOrAlias);
}
