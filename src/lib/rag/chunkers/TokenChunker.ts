/**
 * Token Chunker
 *
 * Splits text by token count using a tokenizer.
 * Useful for precise token budget management.
 */

import type {
  Chunk,
  ChunkerConfig,
  ChunkingStrategy,
} from "../../types/index.js";
import { BaseChunker, DEFAULT_CHUNKER_CONFIG } from "./BaseChunker.js";

/**
 * Token Chunker
 *
 * Approximates token-based splitting using word count.
 * For production, integrate with a proper tokenizer (tiktoken, etc.)
 */
export class TokenChunker extends BaseChunker {
  readonly strategy: ChunkingStrategy = "token";

  getDefaultConfig(): ChunkerConfig {
    return {
      ...DEFAULT_CHUNKER_CONFIG,
      maxSize: 512, // Tokens
      overlap: 50, // Tokens
    };
  }

  protected async doChunk(
    content: string,
    config: ChunkerConfig,
  ): Promise<Chunk[]> {
    const maxTokens = config.maxSize ?? 512;
    const overlapTokens = config.overlap ?? 50;

    // Approximate tokenization using words
    // In production, use a proper tokenizer like tiktoken
    const words = content.split(/\s+/);
    const chunks: Chunk[] = [];
    let currentWords: string[] = [];
    let currentStart = 0;
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) {
        continue;
      }

      // Estimate tokens (roughly 1.3 tokens per word on average)
      const estimatedTokens = Math.ceil(currentWords.length * 1.3);

      if (estimatedTokens >= maxTokens) {
        const chunkText = currentWords.join(" ");
        const startOffset = content.indexOf(
          currentWords[0] ?? "",
          currentStart,
        );
        const endOffset = startOffset + chunkText.length;

        chunks.push(
          this.createChunk(chunkText, chunkIndex++, startOffset, endOffset),
        );

        // Keep overlap words
        const overlapCount = Math.ceil(overlapTokens / 1.3);
        currentWords = currentWords.slice(-overlapCount);
        currentStart = endOffset - currentWords.join(" ").length;
      }

      currentWords.push(word);
    }

    // Add remaining chunk
    if (currentWords.length > 0) {
      const chunkText = currentWords.join(" ");
      const startOffset = content.indexOf(currentWords[0] ?? "", currentStart);
      const endOffset = startOffset + chunkText.length;

      chunks.push(
        this.createChunk(chunkText, chunkIndex, startOffset, endOffset),
      );
    }

    return chunks;
  }
}
