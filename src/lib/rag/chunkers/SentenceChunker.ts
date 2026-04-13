/**
 * Sentence Chunker
 *
 * Splits text by sentence boundaries for semantically meaningful chunks.
 */

import type {
  Chunk,
  ChunkerConfig,
  ChunkingStrategy,
} from "../../types/index.js";
import { BaseChunker, DEFAULT_CHUNKER_CONFIG } from "./BaseChunker.js";

/**
 * Sentence Chunker
 */
export class SentenceChunker extends BaseChunker {
  readonly strategy: ChunkingStrategy = "sentence";

  getDefaultConfig(): ChunkerConfig {
    return {
      ...DEFAULT_CHUNKER_CONFIG,
      maxSize: 1000,
      overlap: 1, // Overlap in sentences
    };
  }

  protected async doChunk(
    content: string,
    config: ChunkerConfig,
  ): Promise<Chunk[]> {
    const maxSize = config.maxSize ?? 1000;

    // Simple sentence splitting (can be enhanced with NLP)
    const sentences = this.splitIntoSentences(content);
    const chunks: Chunk[] = [];
    let currentChunk = "";
    let currentStart = 0;
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk.length > 0) {
          const startOffset = content.indexOf(currentChunk, currentStart);
          chunks.push(
            this.createChunk(
              currentChunk,
              chunkIndex++,
              startOffset,
              startOffset + currentChunk.length,
            ),
          );
          currentStart = startOffset + 1;
        }
        currentChunk = sentence;
      }
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      const startOffset = content.indexOf(currentChunk, currentStart);
      chunks.push(
        this.createChunk(
          currentChunk,
          chunkIndex,
          startOffset,
          startOffset + currentChunk.length,
        ),
      );
    }

    return chunks;
  }

  /**
   * Split content into sentences
   */
  private splitIntoSentences(content: string): string[] {
    // Simple regex-based sentence splitting
    // Handles common abbreviations and sentence endings
    const sentencePattern = /[^.!?]*[.!?]+(?:\s|$)/g;
    const sentences: string[] = [];
    let match;

    while ((match = sentencePattern.exec(content)) !== null) {
      sentences.push(match[0]);
    }

    // Handle remaining content without sentence ending
    const lastIndex = sentences.reduce((acc, s) => acc + s.length, 0);
    if (lastIndex < content.length) {
      sentences.push(content.slice(lastIndex));
    }

    return sentences;
  }
}
