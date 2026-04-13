/**
 * Token-based Chunker
 *
 * Splits text based on token counts using simple tokenization.
 * Best for controlling context window usage with LLMs.
 */

import { randomUUID } from "crypto";
import type {
  Chunker,
  Chunk,
  ChunkerValidationResult,
  TokenChunkerConfig,
  BaseChunkerConfig,
} from "../../types/index.js";

/**
 * Token-aware chunker implementation
 * Splits text based on approximate token counts
 *
 * Note: Uses simple word-based tokenization as approximation.
 * For exact token counts, integrate with tiktoken or model-specific tokenizers.
 */
export class TokenChunker implements Chunker {
  readonly strategy = "token" as const;

  // Approximate characters per token for different tokenizers
  private readonly CHARS_PER_TOKEN: Record<string, number> = {
    cl100k_base: 4, // GPT-4, GPT-3.5-turbo
    p50k_base: 4, // Codex
    r50k_base: 4, // GPT-3
    default: 4,
  };

  async chunk(text: string, config?: TokenChunkerConfig): Promise<Chunk[]> {
    const {
      maxSize,
      overlap = 0,
      tokenizer = "cl100k_base",
      maxTokens = 512,
      tokenOverlap,
      trimWhitespace = true,
      metadata = {},
    } = config || {};

    const chunks: Chunk[] = [];
    const documentId = randomUUID();

    if (!text || text.length === 0) {
      return chunks;
    }

    // Determine effective overlap
    const effectiveOverlap =
      tokenOverlap ?? Math.floor(overlap / this.getCharsPerToken(tokenizer));

    // Use maxSize if provided, otherwise calculate from maxTokens
    const _effectiveMaxChars =
      maxSize ?? maxTokens * this.getCharsPerToken(tokenizer);

    // Tokenize text (simple word-based approximation)
    const words = this.tokenize(text);
    const _tokensPerWord = this.estimateTokensPerWord(tokenizer);

    let currentWords: string[] = [];
    let currentTokenCount = 0;
    let chunkIndex = 0;
    let startPosition = 0;
    let charPosition = 0;

    for (const word of words) {
      const wordTokens = Math.ceil(
        word.length / this.getCharsPerToken(tokenizer),
      );

      // Check if adding this word would exceed the limit
      if (
        currentTokenCount + wordTokens > maxTokens &&
        currentWords.length > 0
      ) {
        // Save current chunk
        const chunkText = currentWords.join(" ");
        const finalText = trimWhitespace ? chunkText.trim() : chunkText;

        if (finalText.length > 0) {
          chunks.push({
            id: randomUUID(),
            text: finalText,
            metadata: {
              documentId,
              chunkIndex,
              startPosition,
              endPosition: charPosition,
              documentType: "text",
              custom: {
                ...metadata,
                estimatedTokens: currentTokenCount,
              },
            },
          });
          chunkIndex++;
        }

        // Handle token overlap
        if (effectiveOverlap > 0 && currentWords.length > 0) {
          // Keep some words for overlap
          let overlapTokens = 0;
          const overlapWords: string[] = [];

          for (let i = currentWords.length - 1; i >= 0; i--) {
            const w = currentWords[i];
            const wTokens = Math.ceil(
              w.length / this.getCharsPerToken(tokenizer),
            );

            if (overlapTokens + wTokens <= effectiveOverlap) {
              overlapWords.unshift(w);
              overlapTokens += wTokens;
            } else {
              break;
            }
          }

          currentWords = overlapWords;
          currentTokenCount = overlapTokens;

          // Adjust start position for overlap
          const overlapChars = overlapWords.join(" ").length + 1;
          startPosition = charPosition - overlapChars;
        } else {
          currentWords = [];
          currentTokenCount = 0;
          startPosition = charPosition;
        }
      }

      currentWords.push(word);
      currentTokenCount += wordTokens;
      charPosition += word.length + 1; // +1 for space
    }

    // Don't forget the last chunk
    if (currentWords.length > 0) {
      const chunkText = currentWords.join(" ");
      const finalText = trimWhitespace ? chunkText.trim() : chunkText;

      if (finalText.length > 0) {
        chunks.push({
          id: randomUUID(),
          text: finalText,
          metadata: {
            documentId,
            chunkIndex,
            startPosition,
            endPosition: charPosition,
            documentType: "text",
            custom: {
              ...metadata,
              estimatedTokens: currentTokenCount,
            },
          },
        });
      }
    }

    // Update total chunks count
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Simple word-based tokenization
   */
  private tokenize(text: string): string[] {
    // Split on whitespace and filter empty strings
    return text.split(/\s+/).filter((w) => w.length > 0);
  }

  /**
   * Get characters per token for a tokenizer
   */
  private getCharsPerToken(tokenizer: string): number {
    return this.CHARS_PER_TOKEN[tokenizer] ?? this.CHARS_PER_TOKEN.default;
  }

  /**
   * Estimate average tokens per word
   */
  private estimateTokensPerWord(_tokenizer: string): number {
    // Average English word is ~5 characters, so roughly 1.25 tokens
    return 1.25;
  }

  /**
   * Estimate token count for text
   */
  estimateTokenCount(text: string, tokenizer: string = "cl100k_base"): number {
    return Math.ceil(text.length / this.getCharsPerToken(tokenizer));
  }

  validateConfig(config: BaseChunkerConfig): ChunkerValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const tokenConfig = config as TokenChunkerConfig;

    if (tokenConfig.maxTokens !== undefined && tokenConfig.maxTokens <= 0) {
      errors.push("maxTokens must be greater than 0");
    }

    if (
      tokenConfig.tokenOverlap !== undefined &&
      tokenConfig.tokenOverlap < 0
    ) {
      errors.push("tokenOverlap must be non-negative");
    }

    if (
      tokenConfig.tokenOverlap !== undefined &&
      tokenConfig.maxTokens !== undefined
    ) {
      if (tokenConfig.tokenOverlap >= tokenConfig.maxTokens) {
        errors.push("tokenOverlap must be less than maxTokens");
      }
    }

    if (tokenConfig.maxSize !== undefined && tokenConfig.maxSize <= 0) {
      errors.push("maxSize must be greater than 0");
    }

    // Warn about tokenizer approximation
    warnings.push(
      "Token counts are approximated. For exact counts, integrate with tiktoken.",
    );

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
