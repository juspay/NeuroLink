/**
 * JSON Chunker
 *
 * Splits JSON documents by object boundaries.
 */

import type {
  Chunk,
  ChunkerConfig,
  ChunkingStrategy,
} from "../../types/index.js";
import { BaseChunker, DEFAULT_CHUNKER_CONFIG } from "./BaseChunker.js";
import { ChunkingError, RAGErrorCodes } from "../errors/RAGError.js";

/**
 * JSON Chunker
 */
export class JSONChunker extends BaseChunker {
  readonly strategy: ChunkingStrategy = "json";

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

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new ChunkingError("Invalid JSON content", {
        code: RAGErrorCodes.CHUNKING_INVALID_CONFIG,
        strategy: this.strategy,
      });
    }

    const chunks: Chunk[] = [];
    const items = this.flattenJson(parsed);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) {
        continue;
      }
      const jsonString = JSON.stringify(item, null, 2);

      if (jsonString.length <= maxSize) {
        const startOffset = content.indexOf(jsonString.slice(0, 20));
        chunks.push(
          this.createChunk(
            jsonString,
            i,
            startOffset >= 0 ? startOffset : i * maxSize,
            startOffset >= 0
              ? startOffset + jsonString.length
              : (i + 1) * maxSize,
          ),
        );
      } else {
        // Split large objects
        const segments = this.splitBySizeWithOverlap(jsonString, maxSize, 0);
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

  /**
   * Flatten JSON into array of objects
   */
  private flattenJson(data: unknown): unknown[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === "object" && data !== null) {
      return [data];
    }
    return [{ value: data }];
  }
}
