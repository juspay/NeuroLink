/**
 * Recursive Chunker
 *
 * Smart text splitting using hierarchical separators.
 * Tries each separator in order, recursively splitting chunks that are too large.
 * Best for general-purpose text that has natural boundaries.
 */

import { randomUUID } from "crypto";
import type {
  Chunker,
  Chunk,
  ChunkerValidationResult,
  RecursiveChunkerConfig,
  BaseChunkerConfig,
} from "../../types/index.js";

/**
 * Recursive chunker implementation
 * Smart splitting based on content structure using hierarchical separators
 */
export class RecursiveChunker implements Chunker {
  readonly strategy = "recursive" as const;

  private readonly defaultSeparators = ["\n\n", "\n", ". ", " ", ""];

  async chunk(text: string, config?: RecursiveChunkerConfig): Promise<Chunk[]> {
    const {
      maxSize = 1000,
      overlap = 200,
      separators = this.defaultSeparators,
      isSeparatorRegex = false,
      trimWhitespace = true,
      metadata = {},
    } = config || {};

    const documentId = randomUUID();
    const chunks: Chunk[] = [];

    if (!text || text.length === 0) {
      return chunks;
    }

    const splitTexts = this.recursiveSplit(
      text,
      separators,
      maxSize,
      overlap,
      isSeparatorRegex,
    );

    let chunkIndex = 0;
    let currentPosition = 0;

    for (const splitText of splitTexts) {
      const chunkText = trimWhitespace ? splitText.trim() : splitText;

      if (chunkText.length > 0) {
        const startPosition = text.indexOf(splitText, currentPosition);

        chunks.push({
          id: randomUUID(),
          text: chunkText,
          metadata: {
            documentId,
            chunkIndex,
            startPosition: startPosition >= 0 ? startPosition : currentPosition,
            endPosition:
              startPosition >= 0
                ? startPosition + splitText.length
                : currentPosition + splitText.length,
            documentType: "text",
            custom: metadata,
          },
        });

        chunkIndex++;
        if (startPosition >= 0) {
          currentPosition = startPosition + splitText.length - overlap;
        }
      }
    }

    // Update total chunks count
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  private recursiveSplit(
    text: string,
    separators: string[],
    maxSize: number,
    overlap: number,
    isRegex: boolean,
  ): string[] {
    const results: string[] = [];

    if (text.length <= maxSize) {
      return [text];
    }

    // Find the best separator to use
    let separator = separators[separators.length - 1]; // Default to last (usually "")
    let newSeparators = separators;

    for (let i = 0; i < separators.length; i++) {
      const sep = separators[i];
      const hasMatch = isRegex
        ? new RegExp(sep).test(text)
        : text.includes(sep);

      if (sep === "" || hasMatch) {
        separator = sep;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    // Split the text
    const splits = isRegex
      ? text.split(new RegExp(separator))
      : text.split(separator);

    // Merge splits into chunks
    let currentChunk = "";

    for (const split of splits) {
      const potentialChunk = currentChunk
        ? currentChunk + separator + split
        : split;

      if (potentialChunk.length <= maxSize) {
        currentChunk = potentialChunk;
      } else {
        // Current chunk is ready
        if (currentChunk.length > 0) {
          results.push(currentChunk);
        }

        // Handle split that's still too large
        if (split.length > maxSize) {
          const subSplits = this.recursiveSplit(
            split,
            newSeparators,
            maxSize,
            overlap,
            isRegex,
          );
          results.push(...subSplits.slice(0, -1));
          currentChunk = subSplits[subSplits.length - 1] || "";
        } else {
          // Add overlap from previous chunk
          if (results.length > 0 && overlap > 0) {
            const lastChunk = results[results.length - 1];
            const overlapText = lastChunk.slice(-overlap);
            currentChunk = overlapText + separator + split;
          } else {
            currentChunk = split;
          }
        }
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      results.push(currentChunk);
    }

    return results;
  }

  validateConfig(config: BaseChunkerConfig): ChunkerValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recConfig = config as RecursiveChunkerConfig;

    if (recConfig.maxSize !== undefined && recConfig.maxSize <= 0) {
      errors.push("maxSize must be greater than 0");
    }

    if (recConfig.overlap !== undefined && recConfig.overlap < 0) {
      errors.push("overlap must be non-negative");
    }

    if (
      recConfig.separators !== undefined &&
      recConfig.separators.length === 0
    ) {
      errors.push("separators array must not be empty");
    }

    if (recConfig.isSeparatorRegex && recConfig.separators) {
      for (const sep of recConfig.separators) {
        try {
          new RegExp(sep);
        } catch {
          errors.push(`Invalid regex separator: ${sep}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
