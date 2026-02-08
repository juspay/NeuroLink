/**
 * Markdown-aware Chunker
 *
 * Splits markdown documents based on header structure while preserving formatting.
 * Best for documentation, README files, and structured markdown content.
 */

import { randomUUID } from "crypto";
import type {
  BaseChunkerConfig,
  Chunk,
  Chunker,
  ChunkerValidationResult,
  MarkdownChunkerConfig,
} from "../types.js";

/**
 * Markdown-aware chunker implementation
 * Splits based on markdown structure (headers, code blocks, etc.)
 */
export class MarkdownChunker implements Chunker {
  readonly strategy = "markdown" as const;

  async chunk(text: string, config?: MarkdownChunkerConfig): Promise<Chunk[]> {
    const {
      maxSize = 1000,
      overlap = 0,
      headerLevels = [1, 2, 3],
      preserveCodeBlocks = true,
      includeHeader = true,
      stripFormatting = false,
      trimWhitespace = true,
      metadata = {},
    } = config || {};

    const documentId = randomUUID();
    const chunks: Chunk[] = [];

    if (!text || text.length === 0) {
      return chunks;
    }

    // Build header regex pattern
    const headerPattern = new RegExp(
      `^(#{${Math.min(...headerLevels)},${Math.max(...headerLevels)}})\\s+(.+)$`,
      "gm",
    );

    // Split by headers while preserving them
    const sections = this.splitByHeaders(text, headerPattern, includeHeader);

    let chunkIndex = 0;
    let currentPosition = 0;

    for (const section of sections) {
      const { header, content, level } = section;

      // Handle code blocks
      let processedContent = content;
      const codeBlocks: { placeholder: string; code: string }[] = [];

      if (preserveCodeBlocks) {
        processedContent = content.replace(
          /```[\s\S]*?```|`[^`]+`/g,
          (match) => {
            const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push({ placeholder, code: match });
            return placeholder;
          },
        );
      }

      // Split content if too large
      const effectiveMaxSize = Math.max(maxSize - (header?.length || 0), 100);
      const contentChunks = this.splitContent(
        processedContent,
        effectiveMaxSize,
        overlap,
      );

      for (const contentChunk of contentChunks) {
        let chunkText =
          header && includeHeader
            ? `${header}\n\n${contentChunk}`
            : contentChunk;

        // Restore code blocks
        for (const { placeholder, code } of codeBlocks) {
          chunkText = chunkText.replace(placeholder, code);
        }

        // Strip formatting if requested
        if (stripFormatting) {
          chunkText = this.stripMarkdown(chunkText);
        }

        const finalText = trimWhitespace ? chunkText.trim() : chunkText;

        if (finalText.length > 0) {
          chunks.push({
            id: randomUUID(),
            text: finalText,
            metadata: {
              documentId,
              chunkIndex,
              startPosition: currentPosition,
              endPosition: currentPosition + chunkText.length,
              documentType: "markdown",
              headerLevel: level ?? undefined,
              header: header?.replace(/^#+\s*/, "") ?? undefined,
              custom: metadata,
            },
          });
          chunkIndex++;
        }

        currentPosition += chunkText.length;
      }
    }

    // Update total chunks count
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  private splitByHeaders(
    text: string,
    headerPattern: RegExp,
    _includeHeader: boolean,
  ): Array<{ header: string | null; content: string; level: number | null }> {
    const sections: Array<{
      header: string | null;
      content: string;
      level: number | null;
    }> = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let currentHeader: string | null = null;
    let currentLevel: number | null = null;

    // Reset regex
    headerPattern.lastIndex = 0;

    while ((match = headerPattern.exec(text)) !== null) {
      // Content before this header
      if (match.index > lastIndex) {
        const content = text.slice(lastIndex, match.index);
        if (content.trim()) {
          sections.push({
            header: currentHeader,
            content: content.trim(),
            level: currentLevel,
          });
        }
      }

      currentHeader = match[0];
      currentLevel = match[1].length; // Number of # characters
      lastIndex = match.index + match[0].length;
    }

    // Don't forget content after the last header
    if (lastIndex < text.length) {
      const content = text.slice(lastIndex);
      if (content.trim()) {
        sections.push({
          header: currentHeader,
          content: content.trim(),
          level: currentLevel,
        });
      }
    }

    // If no headers found, return entire text as one section
    if (sections.length === 0 && text.trim()) {
      sections.push({
        header: null,
        content: text.trim(),
        level: null,
      });
    }

    return sections;
  }

  private splitContent(
    content: string,
    maxSize: number,
    overlap: number,
  ): string[] {
    const effectiveMaxSize = Math.max(maxSize, 1);
    const effectiveOverlap = Math.min(
      Math.max(overlap, 0),
      effectiveMaxSize - 1,
    );

    if (content.length <= effectiveMaxSize) {
      return [content];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      let end = Math.min(start + effectiveMaxSize, content.length);

      // Try to break at a paragraph or sentence boundary
      if (end < content.length) {
        const searchStart = Math.max(start, end - 200);
        const searchText = content.slice(searchStart, end);

        // Look for paragraph break first
        const paragraphBreak = searchText.lastIndexOf("\n\n");
        if (paragraphBreak > 0) {
          end = searchStart + paragraphBreak;
        } else {
          // Look for sentence break
          const sentenceBreak = searchText.search(/[.!?]\s+[A-Z]/);
          if (sentenceBreak > 0) {
            end = searchStart + sentenceBreak + 1;
          }
        }
      }

      chunks.push(content.slice(start, end));
      start = Math.max(start + 1, end - effectiveOverlap);
    }

    return chunks;
  }

  private stripMarkdown(text: string): string {
    return text
      .replace(/^#+\s+/gm, "") // Headers
      .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
      .replace(/\*(.+?)\*/g, "$1") // Italic
      .replace(/__(.+?)__/g, "$1") // Bold (underscore)
      .replace(/_(.+?)_/g, "$1") // Italic (underscore)
      .replace(/`(.+?)`/g, "$1") // Inline code
      .replace(/```[\s\S]*?```/g, "") // Code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1"); // Images
  }

  validateConfig(config: BaseChunkerConfig): ChunkerValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const mdConfig = config as MarkdownChunkerConfig;

    if (mdConfig.maxSize !== undefined && mdConfig.maxSize <= 0) {
      errors.push("maxSize must be greater than 0");
    }

    if (mdConfig.headerLevels !== undefined) {
      if (mdConfig.headerLevels.length === 0) {
        errors.push("headerLevels must not be empty");
      }
      for (const level of mdConfig.headerLevels) {
        if (level < 1 || level > 6) {
          errors.push(
            `Invalid header level: ${level}. Must be between 1 and 6`,
          );
        }
      }
    }

    if (mdConfig.overlap !== undefined && mdConfig.overlap < 0) {
      errors.push("overlap must be non-negative");
    }

    if (
      mdConfig.overlap !== undefined &&
      mdConfig.maxSize !== undefined &&
      mdConfig.overlap >= mdConfig.maxSize
    ) {
      errors.push("overlap must be less than maxSize");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
