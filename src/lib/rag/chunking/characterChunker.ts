/**
 * Character-based Chunker
 *
 * Simple character-based text splitting with configurable separator and overlap.
 * Best for unstructured text where character count is the primary concern.
 */

import { randomUUID } from "crypto";
import type {
  Chunker,
  Chunk,
  ChunkerValidationResult,
  CharacterChunkerConfig,
  BaseChunkerConfig,
} from "../../types/index.js";

/**
 * Character-based chunker implementation
 * Splits text by character count with optional separator
 */
export class CharacterChunker implements Chunker {
  readonly strategy = "character" as const;

  async chunk(text: string, config?: CharacterChunkerConfig): Promise<Chunk[]> {
    const {
      maxSize = 1000,
      overlap = 0,
      separator = "",
      keepSeparator = false,
      trimWhitespace = true,
      metadata = {},
    } = config || {};

    const chunks: Chunk[] = [];
    const documentId = randomUUID();

    if (!text || text.length === 0) {
      return chunks;
    }

    // Split by separator if provided
    let segments: string[];
    if (separator) {
      segments = text.split(separator);
      if (keepSeparator && separator) {
        segments = segments.map((s, i) =>
          i < segments.length - 1 ? s + separator : s,
        );
      }
    } else {
      segments = [text];
    }

    let currentChunk = "";
    let chunkIndex = 0;
    let startPosition = 0;

    for (const segment of segments) {
      if (currentChunk.length + segment.length <= maxSize) {
        currentChunk += segment;
      } else {
        // Save current chunk if it has content
        if (currentChunk.length > 0) {
          const chunkText = trimWhitespace ? currentChunk.trim() : currentChunk;
          if (chunkText.length > 0) {
            chunks.push({
              id: randomUUID(),
              text: chunkText,
              metadata: {
                documentId,
                chunkIndex,
                startPosition,
                endPosition: startPosition + currentChunk.length,
                documentType: "text",
                custom: metadata,
              },
            });
            chunkIndex++;
          }
        }

        // Handle overlap
        if (overlap > 0 && currentChunk.length > overlap) {
          currentChunk = currentChunk.slice(-overlap) + segment;
          startPosition = startPosition + currentChunk.length - overlap;
        } else {
          startPosition += currentChunk.length;
          currentChunk = segment;
        }

        // If segment is larger than maxSize, split it further
        while (currentChunk.length > maxSize) {
          const chunkText = trimWhitespace
            ? currentChunk.slice(0, maxSize).trim()
            : currentChunk.slice(0, maxSize);

          chunks.push({
            id: randomUUID(),
            text: chunkText,
            metadata: {
              documentId,
              chunkIndex,
              startPosition,
              endPosition: startPosition + maxSize,
              documentType: "text",
              custom: metadata,
            },
          });
          chunkIndex++;

          const overlapStart = Math.max(0, maxSize - overlap);
          currentChunk = currentChunk.slice(overlapStart);
          startPosition += overlapStart;
        }
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      const chunkText = trimWhitespace ? currentChunk.trim() : currentChunk;
      if (chunkText.length > 0) {
        chunks.push({
          id: randomUUID(),
          text: chunkText,
          metadata: {
            documentId,
            chunkIndex,
            startPosition,
            endPosition: startPosition + currentChunk.length,
            documentType: "text",
            custom: metadata,
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

  validateConfig(config: BaseChunkerConfig): ChunkerValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const charConfig = config as CharacterChunkerConfig;

    if (charConfig.maxSize !== undefined && charConfig.maxSize <= 0) {
      errors.push("maxSize must be greater than 0");
    }

    if (charConfig.overlap !== undefined && charConfig.overlap < 0) {
      errors.push("overlap must be non-negative");
    }

    if (charConfig.overlap !== undefined && charConfig.maxSize !== undefined) {
      if (charConfig.overlap >= charConfig.maxSize) {
        errors.push("overlap must be less than maxSize");
      }
    }

    if (charConfig.minSize !== undefined && charConfig.maxSize !== undefined) {
      if (charConfig.minSize > charConfig.maxSize) {
        warnings.push(
          "minSize is greater than maxSize, some chunks may be smaller than minSize",
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
