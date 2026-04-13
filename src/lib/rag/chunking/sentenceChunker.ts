/**
 * Sentence-based Chunker
 *
 * Splits text based on sentence boundaries while respecting size limits.
 * Best for prose and natural language content where sentence integrity matters.
 */

import { randomUUID } from "crypto";
import type {
  BaseChunkerConfig,
  Chunk,
  Chunker,
  ChunkerValidationResult,
  SentenceChunkerConfig,
} from "../../types/index.js";

/**
 * Sentence-aware chunker implementation
 * Splits text by sentences while respecting size constraints
 */
export class SentenceChunker implements Chunker {
  readonly strategy = "sentence" as const;

  private readonly defaultSentenceEnders = [".", "!", "?"];

  async chunk(text: string, config?: SentenceChunkerConfig): Promise<Chunk[]> {
    const {
      maxSize = 1000,
      overlap = 0,
      sentenceEnders = this.defaultSentenceEnders,
      minSentences = 1,
      maxSentences,
      trimWhitespace = true,
      metadata = {},
    } = config || {};

    const chunks: Chunk[] = [];
    const documentId = randomUUID();

    if (!text || text.length === 0) {
      return chunks;
    }

    // Split text into sentences
    const sentences = this.splitIntoSentences(text, sentenceEnders);

    if (sentences.length === 0) {
      return chunks;
    }

    let currentChunkSentences: string[] = [];
    let currentChunkLength = 0;
    let chunkIndex = 0;
    let startPosition = 0;
    let currentPosition = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceLength = sentence.length;

      // Check if adding this sentence would exceed limits
      const wouldExceedSize = currentChunkLength + sentenceLength + 1 > maxSize;
      const wouldExceedSentences =
        maxSentences !== undefined &&
        currentChunkSentences.length >= maxSentences;

      if (
        currentChunkSentences.length > 0 &&
        (wouldExceedSize || wouldExceedSentences)
      ) {
        // Save current chunk if it meets minimum requirements
        if (currentChunkSentences.length >= minSentences) {
          const chunkText = currentChunkSentences.join(" ");
          const finalText = trimWhitespace ? chunkText.trim() : chunkText;

          if (finalText.length > 0) {
            chunks.push({
              id: randomUUID(),
              text: finalText,
              metadata: {
                documentId,
                chunkIndex,
                startPosition,
                endPosition: startPosition + chunkText.length,
                documentType: "text",
                custom: metadata,
              },
            });
            chunkIndex++;
          }
        }

        // Handle overlap by keeping some sentences
        if (overlap > 0 && currentChunkSentences.length > 0) {
          // Calculate how many sentences to keep for overlap
          let overlapLength = 0;
          const overlapSentences: string[] = [];

          for (let j = currentChunkSentences.length - 1; j >= 0; j--) {
            const s = currentChunkSentences[j];
            if (overlapLength + s.length + 1 <= overlap) {
              overlapSentences.unshift(s);
              overlapLength += s.length + 1;
            } else {
              break;
            }
          }

          currentChunkSentences = overlapSentences;
          currentChunkLength = overlapLength;
          startPosition = currentPosition - overlapLength;
        } else {
          currentChunkSentences = [];
          currentChunkLength = 0;
          startPosition = currentPosition;
        }
      }

      // Handle sentences larger than maxSize
      if (sentenceLength > maxSize) {
        // Split the sentence itself if necessary
        const subChunks = this.splitLargeSentence(sentence, maxSize);
        for (const subChunk of subChunks) {
          chunks.push({
            id: randomUUID(),
            text: trimWhitespace ? subChunk.trim() : subChunk,
            metadata: {
              documentId,
              chunkIndex,
              startPosition: currentPosition,
              endPosition: currentPosition + subChunk.length,
              documentType: "text",
              custom: metadata,
            },
          });
          chunkIndex++;
          currentPosition += subChunk.length;
        }
        startPosition = currentPosition;
      } else {
        currentChunkSentences.push(sentence);
        currentChunkLength += sentenceLength + 1; // +1 for space
        currentPosition += sentenceLength + 1;
      }
    }

    // Don't forget the last chunk
    if (currentChunkSentences.length >= minSentences) {
      const chunkText = currentChunkSentences.join(" ");
      const finalText = trimWhitespace ? chunkText.trim() : chunkText;

      if (finalText.length > 0) {
        chunks.push({
          id: randomUUID(),
          text: finalText,
          metadata: {
            documentId,
            chunkIndex,
            startPosition,
            endPosition: startPosition + chunkText.length,
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

  /**
   * Split text into sentences based on sentence enders
   */
  private splitIntoSentences(text: string, sentenceEnders: string[]): string[] {
    const sentences: string[] = [];

    // Build regex pattern for sentence splitting
    // Look for sentence enders followed by whitespace or end of string
    const pattern = new RegExp(
      `([${sentenceEnders.map((e) => "\\" + e).join("")}]+)(?=\\s|$)`,
      "g",
    );

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset regex state
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentence = text.slice(lastIndex, endIndex).trim();

      if (sentence.length > 0) {
        sentences.push(sentence);
      }

      lastIndex = endIndex;

      // Skip whitespace
      while (lastIndex < text.length && /\s/.test(text[lastIndex])) {
        lastIndex++;
      }
    }

    // Don't forget the last part
    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex).trim();
      if (remaining.length > 0) {
        sentences.push(remaining);
      }
    }

    return sentences;
  }

  /**
   * Split a large sentence into smaller chunks
   */
  private splitLargeSentence(sentence: string, maxSize: number): string[] {
    const chunks: string[] = [];
    const words = sentence.split(/\s+/);

    let currentChunk = "";

    for (const word of words) {
      if (currentChunk.length + word.length + 1 <= maxSize) {
        currentChunk = currentChunk ? currentChunk + " " + word : word;
      } else {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
        }
        // If a single word is larger than maxSize, we have to include it anyway
        currentChunk = word;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  validateConfig(config: BaseChunkerConfig): ChunkerValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sentConfig = config as SentenceChunkerConfig;

    if (sentConfig.maxSize !== undefined && sentConfig.maxSize <= 0) {
      errors.push("maxSize must be greater than 0");
    }

    if (sentConfig.overlap !== undefined && sentConfig.overlap < 0) {
      errors.push("overlap must be non-negative");
    }

    if (
      sentConfig.overlap !== undefined &&
      sentConfig.maxSize !== undefined &&
      sentConfig.overlap >= sentConfig.maxSize
    ) {
      errors.push("overlap must be less than maxSize");
    }

    if (sentConfig.minSentences !== undefined && sentConfig.minSentences < 1) {
      errors.push("minSentences must be at least 1");
    }

    if (
      sentConfig.maxSentences !== undefined &&
      sentConfig.minSentences !== undefined
    ) {
      if (sentConfig.maxSentences < sentConfig.minSentences) {
        errors.push("maxSentences must be >= minSentences");
      }
    }

    if (
      sentConfig.sentenceEnders !== undefined &&
      sentConfig.sentenceEnders.length === 0
    ) {
      warnings.push("No sentence enders specified, using defaults");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
