/**
 * Metadata Extractor Registry
 *
 * Centralized registry for all metadata extractor implementations with metadata
 * and discovery capabilities. Follows the BaseRegistry pattern.
 */

import { BaseRegistry } from "../../core/infrastructure/index.js";
import { logger } from "../../utils/logger.js";
import { MetadataExtractionError, RAGErrorCodes } from "../errors/RAGError.js";
import type {
  MetadataExtractor,
  MetadataExtractorConfig,
  MetadataExtractorMetadata,
  MetadataExtractorType,
} from "../../types/index.js";

/**
 * Default metadata extractor metadata entries
 */
const DEFAULT_EXTRACTOR_METADATA: Record<
  MetadataExtractorType,
  MetadataExtractorMetadata
> = {
  llm: {
    description:
      "Full LLM-powered metadata extraction supporting all extraction types",
    defaultConfig: {
      provider: "openai",
      modelName: "gpt-4o-mini",
      temperature: 0.3,
    },
    supportedOptions: [
      "provider",
      "modelName",
      "promptTemplate",
      "maxTokens",
      "temperature",
    ],
    useCases: [
      "Comprehensive metadata extraction",
      "Multi-type extraction in single pass",
      "Custom schema extraction",
    ],
    aliases: ["full", "comprehensive", "all"],
    requiresModel: true,
    extractionTypes: ["title", "summary", "keywords", "questions", "custom"],
  },
  title: {
    description: "Extracts concise, descriptive titles from document content",
    defaultConfig: {
      provider: "openai",
      modelName: "gpt-4o-mini",
      maxTokens: 100,
    },
    supportedOptions: ["provider", "modelName", "promptTemplate", "maxTokens"],
    useCases: [
      "Document indexing",
      "Content organization",
      "Navigation systems",
    ],
    aliases: ["header", "heading"],
    requiresModel: true,
    extractionTypes: ["title"],
  },
  summary: {
    description: "Generates concise summaries of document chunks",
    defaultConfig: {
      provider: "openai",
      modelName: "gpt-4o-mini",
      maxTokens: 200,
    },
    supportedOptions: [
      "provider",
      "modelName",
      "promptTemplate",
      "maxTokens",
      "maxWords",
    ],
    useCases: [
      "Document previews",
      "Search result snippets",
      "Content condensation",
    ],
    aliases: ["summarize", "abstract"],
    requiresModel: true,
    extractionTypes: ["summary"],
  },
  keywords: {
    description: "Extracts key terms and phrases from content",
    defaultConfig: {
      provider: "openai",
      modelName: "gpt-4o-mini",
      maxTokens: 100,
    },
    supportedOptions: [
      "provider",
      "modelName",
      "promptTemplate",
      "maxKeywords",
    ],
    useCases: ["Tag generation", "Topic modeling", "Search optimization"],
    aliases: ["tags", "terms", "keyphrase"],
    requiresModel: true,
    extractionTypes: ["keywords"],
  },
  questions: {
    description: "Generates Q&A pairs from content for training or FAQs",
    defaultConfig: {
      provider: "openai",
      modelName: "gpt-4o-mini",
      maxTokens: 500,
    },
    supportedOptions: [
      "provider",
      "modelName",
      "promptTemplate",
      "numQuestions",
      "includeAnswers",
    ],
    useCases: [
      "FAQ generation",
      "Training data creation",
      "Knowledge base building",
    ],
    aliases: ["qa", "faq", "questions-answers"],
    requiresModel: true,
    extractionTypes: ["questions"],
  },
  custom: {
    description: "Extracts structured data according to custom schema",
    defaultConfig: {
      provider: "openai",
      modelName: "gpt-4o-mini",
      maxTokens: 500,
    },
    supportedOptions: [
      "provider",
      "modelName",
      "promptTemplate",
      "schema",
      "description",
    ],
    useCases: [
      "Structured data extraction",
      "Entity extraction",
      "Custom field extraction",
    ],
    aliases: ["schema", "structured", "entity"],
    requiresModel: true,
    extractionTypes: ["custom"],
  },
  composite: {
    description: "Combines multiple extraction types in a single pass",
    defaultConfig: {
      provider: "openai",
      modelName: "gpt-4o-mini",
    },
    supportedOptions: ["provider", "modelName", "extractors"],
    useCases: [
      "Multi-field extraction",
      "Complete document processing",
      "Pipeline integration",
    ],
    aliases: ["multi", "combined", "batch"],
    requiresModel: true,
    extractionTypes: ["title", "summary", "keywords", "questions", "custom"],
  },
};

/**
 * Metadata Extractor Registry
 *
 * Manages registration and discovery of all metadata extractor implementations.
 * Extends BaseRegistry for consistent lifecycle management.
 */
export class MetadataExtractorRegistry extends BaseRegistry<
  MetadataExtractor,
  MetadataExtractorMetadata
> {
  private static instance: MetadataExtractorRegistry | null = null;
  private aliasMap = new Map<string, MetadataExtractorType>();

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MetadataExtractorRegistry {
    if (!MetadataExtractorRegistry.instance) {
      MetadataExtractorRegistry.instance = new MetadataExtractorRegistry();
    }
    return MetadataExtractorRegistry.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    if (MetadataExtractorRegistry.instance) {
      MetadataExtractorRegistry.instance.clear();
      MetadataExtractorRegistry.instance = null;
    }
  }

  /**
   * Register all built-in extractors
   */
  protected async registerAll(): Promise<void> {
    const { LLMMetadataExtractor } = await import("./metadataExtractor.js");

    // Register all extractor types
    for (const [type, metadata] of Object.entries(DEFAULT_EXTRACTOR_METADATA)) {
      this.registerExtractor(
        type as MetadataExtractorType,
        async () =>
          this.createExtractorInstance(
            LLMMetadataExtractor,
            type as MetadataExtractorType,
          ),
        metadata,
      );
    }

    logger.debug(
      `[MetadataExtractorRegistry] Registered ${this.items.size} extractor types`,
    );
  }

  /**
   * Create extractor instance wrapper
   */
  private createExtractorInstance(
    ExtractorClass: typeof import("./metadataExtractor.js").LLMMetadataExtractor,
    type: MetadataExtractorType,
  ): MetadataExtractor {
    const extractor = new ExtractorClass();
    return {
      type,
      async extract(chunks, params) {
        return extractor.extract(chunks, params ?? {});
      },
    };
  }

  /**
   * Register an extractor with aliases
   */
  registerExtractor(
    type: MetadataExtractorType,
    factory: () => Promise<MetadataExtractor>,
    metadata: MetadataExtractorMetadata,
  ): void {
    this.register(type, factory, metadata.aliases, { metadata });

    // Register aliases in local alias map for type resolution
    for (const alias of metadata.aliases) {
      this.aliasMap.set(alias.toLowerCase(), type);
      logger.debug(
        `[MetadataExtractorRegistry] Registered alias '${alias}' -> '${type}'`,
      );
    }
  }

  /**
   * Resolve type from alias
   */
  resolveType(nameOrAlias: string): MetadataExtractorType {
    const lower = nameOrAlias.toLowerCase();

    // Check if it's a direct type
    if (this.items.has(lower)) {
      return lower as MetadataExtractorType;
    }

    // Check aliases
    const resolved = this.aliasMap.get(lower);
    if (resolved) {
      return resolved;
    }

    throw new MetadataExtractionError(
      `Unknown metadata extractor type: '${nameOrAlias}'. Available types: ${this.getAvailableExtractors().join(", ")}`,
      {
        code: RAGErrorCodes.METADATA_EXTRACTOR_NOT_FOUND,
        extractorType: nameOrAlias,
        details: {
          requestedType: nameOrAlias,
          availableTypes: this.getAvailableExtractors(),
        },
      },
    );
  }

  /**
   * Get an extractor by type or alias
   */
  async getExtractor(typeOrAlias: string): Promise<MetadataExtractor> {
    await this.ensureInitialized();
    const type = this.resolveType(typeOrAlias);
    const extractor = await this.get(type);

    if (!extractor) {
      throw new MetadataExtractionError(
        `Metadata extractor not found: ${type}`,
        {
          code: RAGErrorCodes.METADATA_EXTRACTOR_NOT_FOUND,
          extractorType: type,
          details: { type },
        },
      );
    }

    return extractor;
  }

  /**
   * Get list of available extractor types
   */
  getAvailableExtractors(): MetadataExtractorType[] {
    return this.list().map((item) => item.id as MetadataExtractorType);
  }

  /**
   * Get metadata for a specific extractor
   */
  getExtractorMetadata(
    typeOrAlias: string,
  ): MetadataExtractorMetadata | undefined {
    const type = this.resolveType(typeOrAlias);
    const entry = this.list().find((item) => item.id === type);
    return entry?.metadata;
  }

  /**
   * Get all aliases for a type
   */
  getAliasesForType(type: MetadataExtractorType): string[] {
    const metadata = DEFAULT_EXTRACTOR_METADATA[type];
    return metadata?.aliases ?? [];
  }

  /**
   * Get all registered aliases
   */
  getAllAliases(): Map<string, MetadataExtractorType> {
    return new Map(this.aliasMap);
  }

  /**
   * Check if a type or alias exists
   */
  hasExtractor(typeOrAlias: string): boolean {
    try {
      this.resolveType(typeOrAlias);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get extractors by use case
   */
  getExtractorsByUseCase(useCase: string): MetadataExtractorType[] {
    const matches: MetadataExtractorType[] = [];
    const useCaseLower = useCase.toLowerCase();

    for (const [type, metadata] of Object.entries(DEFAULT_EXTRACTOR_METADATA)) {
      const hasMatchingUseCase = metadata.useCases.some((uc) =>
        uc.toLowerCase().includes(useCaseLower),
      );
      if (hasMatchingUseCase) {
        matches.push(type as MetadataExtractorType);
      }
    }

    return matches;
  }

  /**
   * Get extractors that can produce a specific extraction type
   */
  getExtractorsByExtractionType(
    extractionType: string,
  ): MetadataExtractorType[] {
    const matches: MetadataExtractorType[] = [];

    for (const [type, metadata] of Object.entries(DEFAULT_EXTRACTOR_METADATA)) {
      if (metadata.extractionTypes.includes(extractionType)) {
        matches.push(type as MetadataExtractorType);
      }
    }

    return matches;
  }

  /**
   * Get default configuration for an extractor
   */
  getDefaultConfig(
    typeOrAlias: string,
  ): Partial<MetadataExtractorConfig> | undefined {
    const metadata = this.getExtractorMetadata(typeOrAlias);
    return metadata?.defaultConfig;
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
 * Global metadata extractor registry singleton
 */
export const metadataExtractorRegistry =
  MetadataExtractorRegistry.getInstance();

/**
 * Convenience function to get available extractors
 */
export function getAvailableExtractors(): MetadataExtractorType[] {
  return metadataExtractorRegistry.getAvailableExtractors();
}

/**
 * Convenience function to get extractor by type
 */
export async function getExtractor(
  typeOrAlias: string,
): Promise<MetadataExtractor> {
  return metadataExtractorRegistry.getExtractor(typeOrAlias);
}

/**
 * Convenience function to get extractor metadata
 */
export function getRegisteredExtractorMetadata(
  typeOrAlias: string,
): MetadataExtractorMetadata | undefined {
  return metadataExtractorRegistry.getExtractorMetadata(typeOrAlias);
}
