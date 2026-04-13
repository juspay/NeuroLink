/**
 * LaTeX Chunker
 *
 * Splits LaTeX documents by sections and environments.
 */

import type {
  Chunk,
  ChunkerConfig,
  ChunkingStrategy,
} from "../../types/index.js";
import { BaseChunker, DEFAULT_CHUNKER_CONFIG } from "./BaseChunker.js";

/**
 * LaTeX Chunker
 */
export class LaTeXChunker extends BaseChunker {
  readonly strategy: ChunkingStrategy = "latex";

  getDefaultConfig(): ChunkerConfig {
    return {
      ...DEFAULT_CHUNKER_CONFIG,
      maxSize: 1000,
      overlap: 0,
    };
  }

  protected async doChunk(
    content: string,
    config: ChunkerConfig,
  ): Promise<Chunk[]> {
    const maxSize = config.maxSize ?? 1000;

    // Split by sections
    const sectionPattern =
      /\\(?:section|subsection|subsubsection|chapter|paragraph)\{[^}]+\}/g;
    const sections: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sectionPattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        sections.push(content.slice(lastIndex, match.index));
      }
      lastIndex = match.index;
    }

    if (lastIndex < content.length) {
      sections.push(content.slice(lastIndex));
    }

    if (sections.length === 0) {
      sections.push(content);
    }

    const chunks: Chunk[] = [];
    let offset = 0;

    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.length <= maxSize) {
        const startOffset = content.indexOf(trimmed, offset);
        chunks.push(
          this.createChunk(
            trimmed,
            chunks.length,
            startOffset >= 0 ? startOffset : offset,
            startOffset >= 0
              ? startOffset + trimmed.length
              : offset + trimmed.length,
          ),
        );
        if (startOffset >= 0) {
          offset = startOffset + 1;
        }
      } else {
        const segments = this.splitBySizeWithOverlap(trimmed, maxSize, 0);
        for (const segment of segments) {
          chunks.push(
            this.createChunk(
              segment.text,
              chunks.length,
              segment.start,
              segment.end,
            ),
          );
        }
      }
    }

    return chunks;
  }
}
