/**
 * Markdown Chunker
 *
 * Splits markdown content by headers and structural elements.
 */

import type { Chunk, ChunkerConfig, ChunkingStrategy } from "../types.js";
import { BaseChunker, DEFAULT_CHUNKER_CONFIG } from "./BaseChunker.js";

/**
 * Markdown Chunker
 */
export class MarkdownChunker extends BaseChunker {
  readonly strategy: ChunkingStrategy = "markdown";

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

    // Split by headers
    const headerPattern = /^(#{1,6})\s+(.+)$/gm;
    const sections: Array<{ header: string; content: string; level: number }> =
      [];
    let lastIndex = 0;
    let match: RegExpExecArray | null = headerPattern.exec(content);

    while (match !== null) {
      // Add content before this header
      if (match.index > lastIndex) {
        const prevContent = content.slice(lastIndex, match.index).trim();
        if (prevContent && sections.length > 0) {
          const lastSection = sections[sections.length - 1];
          if (lastSection) {
            lastSection.content += "\n\n" + prevContent;
          }
        } else if (prevContent) {
          sections.push({ header: "", content: prevContent, level: 0 });
        }
      }

      sections.push({
        header: match[0],
        content: "",
        level: match[1]?.length ?? 1,
      });
      lastIndex = match.index + match[0].length;
      match = headerPattern.exec(content);
    }

    // Add remaining content
    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex).trim();
      if (remaining) {
        if (sections.length > 0) {
          const lastSection = sections[sections.length - 1];
          if (lastSection) {
            lastSection.content += remaining;
          }
        } else {
          sections.push({ header: "", content: remaining, level: 0 });
        }
      }
    }

    // Convert sections to chunks
    const chunks: Chunk[] = [];
    let offset = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section) {
        continue;
      }
      const fullContent = section.header
        ? section.header + "\n\n" + section.content.trim()
        : section.content.trim();

      if (!fullContent) {
        continue;
      }

      // Split if too large
      if (fullContent.length > maxSize) {
        const subChunks = this.splitBySizeWithOverlap(fullContent, maxSize, 0);
        for (const sub of subChunks) {
          const startOffset = content.indexOf(sub.text, offset);
          chunks.push(
            this.createChunk(
              sub.text,
              chunks.length,
              startOffset >= 0 ? startOffset : offset,
              startOffset >= 0
                ? startOffset + sub.text.length
                : offset + sub.text.length,
              "unknown",
              { sectionContext: section.header },
            ),
          );
          if (startOffset >= 0) {
            offset = startOffset + 1;
          }
        }
      } else {
        const startOffset = content.indexOf(fullContent, offset);
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
}
