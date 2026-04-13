/**
 * Character Chunker
 *
 * Splits text into fixed-size character chunks with optional overlap.
 * The simplest chunking strategy for language-agnostic processing.
 */

import type {
  Chunk,
  ChunkerConfig,
  ChunkingStrategy,
} from "../../types/index.js";
import { BaseChunker, DEFAULT_CHUNKER_CONFIG } from "./BaseChunker.js";

/**
 * Character Chunker
 *
 * Splits content into fixed-size character chunks.
 */
export class CharacterChunker extends BaseChunker {
  readonly strategy: ChunkingStrategy = "character";

  getDefaultConfig(): ChunkerConfig {
    return {
      ...DEFAULT_CHUNKER_CONFIG,
      maxSize: 1000,
      overlap: 100,
    };
  }

  protected async doChunk(
    content: string,
    config: ChunkerConfig,
  ): Promise<Chunk[]> {
    const maxSize = config.maxSize ?? 1000;
    const overlap = config.overlap ?? 100;

    const segments = this.splitBySizeWithOverlap(content, maxSize, overlap);

    return segments.map((segment, index) =>
      this.createChunk(segment.text, index, segment.start, segment.end),
    );
  }
}
