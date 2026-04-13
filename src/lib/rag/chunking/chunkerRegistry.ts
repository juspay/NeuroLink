/**
 * Chunker Registry
 *
 * Central registry for all chunking strategies following NeuroLink's registry pattern.
 * Provides factory methods for creating chunker instances.
 */

import { SemanticMarkdownChunker } from "../chunkers/SemanticMarkdownChunker.js";
import type { Chunker, ChunkingStrategy } from "../../types/index.js";
import { CharacterChunker } from "./characterChunker.js";
import { HTMLChunker } from "./htmlChunker.js";
import { JSONChunker } from "./jsonChunker.js";
import { LaTeXChunker } from "./latexChunker.js";
import { MarkdownChunker } from "./markdownChunker.js";
import { RecursiveChunker } from "./recursiveChunker.js";
import { SemanticChunker } from "./semanticChunker.js";
import { SentenceChunker } from "./sentenceChunker.js";
import { TokenChunker } from "./tokenChunker.js";

/**
 * Registry for chunking strategies
 * Follows NeuroLink's factory pattern with lazy initialization
 */
export class ChunkerRegistry {
  private static chunkers = new Map<ChunkingStrategy, () => Chunker>();
  private static initialized = false;

  /**
   * Initialize all built-in chunkers
   */
  static initialize(): void {
    if (ChunkerRegistry.initialized) {
      return;
    }

    ChunkerRegistry.register("character", () => new CharacterChunker());
    ChunkerRegistry.register("recursive", () => new RecursiveChunker());
    ChunkerRegistry.register("sentence", () => new SentenceChunker());
    ChunkerRegistry.register("token", () => new TokenChunker());
    ChunkerRegistry.register("markdown", () => new MarkdownChunker());
    ChunkerRegistry.register("html", () => new HTMLChunker());
    ChunkerRegistry.register("json", () => new JSONChunker());
    ChunkerRegistry.register("latex", () => new LaTeXChunker());
    ChunkerRegistry.register("semantic", () => new SemanticChunker());
    ChunkerRegistry.register(
      "semantic-markdown",
      () => new SemanticMarkdownChunker(),
    );

    ChunkerRegistry.initialized = true;
  }

  /**
   * Register a custom chunker
   * @param strategy - Strategy name
   * @param factory - Factory function that creates chunker instance
   */
  static register(strategy: ChunkingStrategy, factory: () => Chunker): void {
    ChunkerRegistry.chunkers.set(strategy, factory);
  }

  /**
   * Get a chunker by strategy name
   * @param strategy - Chunking strategy name
   * @returns Chunker instance
   * @throws Error if strategy is not registered
   */
  static get(strategy: ChunkingStrategy): Chunker {
    ChunkerRegistry.initialize();

    const factory = ChunkerRegistry.chunkers.get(strategy);
    if (!factory) {
      throw new Error(
        `Unknown chunking strategy: ${strategy}. Available strategies: ${ChunkerRegistry.getAvailableStrategies().join(", ")}`,
      );
    }

    return factory();
  }

  /**
   * Get all available chunking strategies
   * @returns Array of strategy names
   */
  static getAvailableStrategies(): ChunkingStrategy[] {
    ChunkerRegistry.initialize();
    return Array.from(ChunkerRegistry.chunkers.keys());
  }

  /**
   * Check if a strategy is registered
   * @param strategy - Strategy name to check
   * @returns True if strategy is registered
   */
  static has(strategy: ChunkingStrategy): boolean {
    ChunkerRegistry.initialize();
    return ChunkerRegistry.chunkers.has(strategy);
  }

  /**
   * Get strategy recommendation based on content type
   * @param contentType - Document type or MIME type
   * @returns Recommended chunking strategy
   */
  static getRecommendedStrategy(contentType: string): ChunkingStrategy {
    const normalized = contentType.toLowerCase();

    if (normalized.includes("markdown") || normalized === "md") {
      return "markdown";
    }
    if (normalized.includes("html") || normalized.includes("htm")) {
      return "html";
    }
    if (normalized.includes("json")) {
      return "json";
    }
    // Check for latex specifically - don't match "text" which contains "tex"
    if (
      normalized.includes("latex") ||
      normalized === "tex" ||
      normalized.endsWith("/tex")
    ) {
      return "latex";
    }
    if (normalized.includes("code") || normalized.includes("programming")) {
      return "recursive";
    }
    if (normalized.includes("document") || normalized.includes("text")) {
      return "sentence";
    }

    // Default to recursive for general text
    return "recursive";
  }

  /**
   * Get default configuration for a strategy
   * @param strategy - Chunking strategy
   * @returns Default configuration object
   */
  static getDefaultConfig(strategy: ChunkingStrategy): Record<string, unknown> {
    const defaults: Record<ChunkingStrategy, Record<string, unknown>> = {
      character: {
        maxSize: 1000,
        overlap: 0,
        separator: "",
        keepSeparator: false,
      },
      recursive: {
        maxSize: 1000,
        overlap: 200,
        separators: ["\n\n", "\n", ". ", " ", ""],
      },
      sentence: {
        maxSize: 1000,
        overlap: 0,
        minSentences: 1,
        sentenceEnders: [".", "!", "?"],
      },
      token: {
        maxTokens: 512,
        tokenOverlap: 50,
        tokenizer: "cl100k_base",
      },
      markdown: {
        maxSize: 1000,
        headerLevels: [1, 2, 3],
        preserveCodeBlocks: true,
        includeHeader: true,
      },
      html: {
        maxSize: 1000,
        splitTags: ["div", "p", "section", "article"],
        extractTextOnly: false,
      },
      json: {
        maxSize: 1000,
        maxDepth: 10,
        includeJsonPath: true,
      },
      latex: {
        maxSize: 1000,
        splitEnvironments: ["section", "subsection", "chapter"],
        preserveMath: true,
      },
      semantic: {
        maxSize: 1000,
        similarityThreshold: 0.7,
        joinThreshold: 100,
      },
      "semantic-markdown": {
        maxSize: 1000,
        overlap: 100,
        similarityThreshold: 0.7,
      },
    };

    return defaults[strategy] || { maxSize: 1000 };
  }

  /**
   * Reset the registry (useful for testing)
   */
  static reset(): void {
    ChunkerRegistry.chunkers.clear();
    ChunkerRegistry.initialized = false;
  }
}

/**
 * Convenience function to chunk text with a given strategy
 * @param text - Text to chunk
 * @param strategy - Chunking strategy (default: "recursive")
 * @param config - Strategy-specific configuration
 * @returns Array of chunks
 */
export async function chunkText(
  text: string,
  strategy: ChunkingStrategy = "recursive",
  config?: Record<string, unknown>,
) {
  const chunker = ChunkerRegistry.get(strategy);
  return chunker.chunk(text, config);
}
