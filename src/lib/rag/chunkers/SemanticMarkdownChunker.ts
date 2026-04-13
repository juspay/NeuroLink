/**
 * Semantic Markdown Chunker
 *
 * Combines markdown splitting with semantic similarity for intelligent merging.
 */

import type {
  Chunk,
  ChunkerConfig,
  ChunkingStrategy,
} from "../../types/index.js";
import { BaseChunker, DEFAULT_CHUNKER_CONFIG } from "./BaseChunker.js";

/**
 * Semantic Markdown Chunker
 *
 * Extends markdown chunking with semantic awareness.
 * Can be enhanced with embedding-based similarity.
 */
export class SemanticMarkdownChunker extends BaseChunker {
  readonly strategy: ChunkingStrategy = "semantic-markdown";

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

    // First, split by markdown headers
    const headerPattern = /^(#{1,6})\s+(.+)$/gm;
    const sections: Array<{ header: string; content: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null = headerPattern.exec(content);

    while (match !== null) {
      if (match.index > lastIndex) {
        const prevContent = content.slice(lastIndex, match.index).trim();
        if (prevContent && sections.length > 0) {
          const lastSection = sections[sections.length - 1];
          if (lastSection) {
            lastSection.content += "\n\n" + prevContent;
          }
        } else if (prevContent) {
          sections.push({ header: "", content: prevContent });
        }
      }
      sections.push({ header: match[0], content: "" });
      lastIndex = match.index + match[0].length;
      match = headerPattern.exec(content);
    }

    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex).trim();
      if (remaining) {
        if (sections.length > 0) {
          const lastSection = sections[sections.length - 1];
          if (lastSection) {
            lastSection.content += remaining;
          }
        } else {
          sections.push({ header: "", content: remaining });
        }
      }
    }

    // Merge small sections that are semantically related
    const mergedSections = this.mergeSmallSections(sections, maxSize);

    // Convert to chunks
    const chunks: Chunk[] = [];
    let offset = 0;

    for (let i = 0; i < mergedSections.length; i++) {
      const section = mergedSections[i];
      if (!section) {
        continue;
      }
      const fullContent = section.header
        ? section.header + "\n\n" + section.content.trim()
        : section.content.trim();

      if (!fullContent) {
        continue;
      }

      if (fullContent.length > maxSize) {
        const segments = this.splitBySizeWithOverlap(
          fullContent,
          maxSize,
          overlap,
        );
        for (const segment of segments) {
          const startOffset = content.indexOf(
            segment.text.slice(0, 50),
            offset,
          );
          chunks.push(
            this.createChunk(
              segment.text,
              chunks.length,
              startOffset >= 0 ? startOffset : offset,
              startOffset >= 0
                ? startOffset + segment.text.length
                : offset + segment.text.length,
              "unknown",
              { sectionContext: section.header },
            ),
          );
          if (startOffset >= 0) {
            offset = startOffset + 1;
          }
        }
      } else {
        const startOffset = content.indexOf(fullContent.slice(0, 50), offset);
        chunks.push(
          this.createChunk(
            fullContent,
            chunks.length,
            startOffset >= 0 ? startOffset : offset,
            startOffset >= 0
              ? startOffset + fullContent.length
              : offset + fullContent.length,
            "unknown",
            { sectionContext: section.header },
          ),
        );
        if (startOffset >= 0) {
          offset = startOffset + 1;
        }
      }
    }

    return chunks;
  }

  /**
   * Merge small sections to optimize chunk sizes
   */
  private mergeSmallSections(
    sections: Array<{ header: string; content: string }>,
    maxSize: number,
  ): Array<{ header: string; content: string }> {
    const result: Array<{ header: string; content: string }> = [];
    let current: { header: string; content: string } | null = null;

    for (const section of sections) {
      const fullContent = section.header
        ? section.header + "\n\n" + section.content.trim()
        : section.content.trim();
      const sectionLength = fullContent.length;

      if (!current) {
        current = { ...section };
        continue;
      }

      const currentLength = current.header
        ? current.header.length + current.content.length + 2
        : current.content.length;

      // Merge if combined size is within limit
      if (currentLength + sectionLength <= maxSize) {
        if (section.header) {
          current.content += "\n\n" + section.header + "\n" + section.content;
        } else {
          current.content += "\n\n" + section.content;
        }
      } else {
        result.push(current);
        current = { ...section };
      }
    }

    if (current) {
      result.push(current);
    }

    return result;
  }
}
