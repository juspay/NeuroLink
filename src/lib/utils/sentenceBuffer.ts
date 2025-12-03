/**
 * SentenceBuffer Utility Class
 * Intelligent text chunking for streaming TTS synthesis
 * Accumulates text chunks and extracts complete sentences
 */

import { logger } from "./logger.js";

/**
 * Regular expression for detecting sentence boundaries
 * Matches common sentence endings while handling abbreviations
 *
 * Sentence endings: . ! ?
 * Edge cases handled:
 * - Common abbreviations: Dr., Mr., Mrs., Ms., Jr., Sr., etc., vs., e.g., i.e., Ph.D.
 * - Ellipsis: ... (three dots should not trigger boundary in middle of sentence)
 * - Multiple punctuation: !!, ??, !!!, etc.
 */
const SENTENCE_BOUNDARY_REGEX =
  /(?<![A-Z][a-z]r|M[rs]s?|Jr|Sr|vs|etc|Ph\.D|e\.g|i\.e|a\.m|p\.m|U\.S|Inc|Ltd|Co|Dr)([.!?]+)(?=\s+[A-Z]|\s*$)/g;

/**
 * Common abbreviations that should NOT trigger sentence boundaries
 * Used for additional validation beyond regex
 */
const COMMON_ABBREVIATIONS = new Set([
  "Dr.",
  "Mr.",
  "Mrs.",
  "Ms.",
  "Jr.",
  "Sr.",
  "etc.",
  "vs.",
  "e.g.",
  "i.e.",
  "Ph.D.",
  "a.m.",
  "p.m.",
  "U.S.",
  "Inc.",
  "Ltd.",
  "Co.",
]);

/**
 * SentenceBuffer class for intelligent text chunking
 *
 * Usage example:
 * ```typescript
 * const buffer = new SentenceBuffer();
 * buffer.add("Hello world. This is a test.");
 * if (buffer.hasCompleteSentence()) {
 *   const sentence = buffer.extractSentence();
 *   console.log(sentence); // "Hello world."
 * }
 * const remaining = buffer.flush();
 * console.log(remaining); // "This is a test."
 * ```
 */
export class SentenceBuffer {
  private buffer: string = "";

  /**
   * Add text chunk to buffer
   * Accumulates text for sentence detection
   *
   * @param text - Text chunk to add
   */
  add(text: string): void {
    if (typeof text !== "string") {
      logger.warn(
        "[SentenceBuffer] add() received non-string input, converting to string",
      );
      text = String(text);
    }
    this.buffer += text;
  }

  /**
   * Check if buffer contains at least one complete sentence
   * A complete sentence ends with . ! ? followed by whitespace or end of string
   *
   * @returns true if buffer has complete sentence, false otherwise
   */
  hasCompleteSentence(): boolean {
    if (!this.buffer.trim()) {
      return false;
    }

    // Reset regex state
    SENTENCE_BOUNDARY_REGEX.lastIndex = 0;

    const match = SENTENCE_BOUNDARY_REGEX.exec(this.buffer);

    if (!match) {
      return false;
    }

    const endPosition = match.index + match[0].length;
    const sentenceText = this.buffer.substring(0, endPosition).trim();

    // Check for ellipsis in middle of sentence (three or more dots followed by more text)
    // "Wait... I'm thinking" should NOT be a sentence boundary
    // But "Wait... Never mind." SHOULD be (ellipsis followed by another sentence)
    if (/\.{3,}$/.test(match[0]) && endPosition < this.buffer.length) {
      // Check if there's text after the ellipsis
      const afterEllipsis = this.buffer.substring(endPosition).trimStart();
      if (afterEllipsis) {
        // If the text after starts with punctuation or new sentence marker, it's OK
        if (/^[.!?,;:]/.test(afterEllipsis)) {
          return true; // Punctuation follows, likely end of sentence
        }
        // Check if next part is a capital letter (new sentence)
        if (/^[A-Z]/.test(afterEllipsis)) {
          // This could be a new sentence, but we need to check if that sentence is complete
          // For now, allow it if there's a sentence-ending punctuation later
          if (/[.!?]/.test(afterEllipsis)) {
            return true; // There's a complete sentence after the ellipsis
          }
        }
        // Otherwise, it's text continuing the same thought
        return false;
      }
    }

    // Check if sentence ends with a common abbreviation
    const hasAbbreviation = COMMON_ABBREVIATIONS.size > 0 && [...COMMON_ABBREVIATIONS].some((abbr) =>
      sentenceText.endsWith(abbr),
    );

    if (hasAbbreviation && endPosition < this.buffer.length) {
      // If it ends with abbreviation and there's more text, it's likely not a sentence boundary
      // unless the next character is uppercase (start of new sentence)
      const nextChar = this.buffer[endPosition];
      return /[A-Z]/.test(nextChar);
    }

    return true;
  }

  /**
   * Extract and remove the first complete sentence from buffer
   * Returns the trimmed sentence without leading or trailing whitespace
   * Updates buffer to contain only remaining text
   *
   * @returns Complete sentence or empty string if no complete sentence exists
   */
  extractSentence(): string {
    if (!this.hasCompleteSentence()) {
      return "";
    }

    // Reset regex state
    SENTENCE_BOUNDARY_REGEX.lastIndex = 0;

    const match = SENTENCE_BOUNDARY_REGEX.exec(this.buffer);

    if (!match) {
      return "";
    }

    // Extract sentence up to and including the punctuation
    const endPosition = match.index + match[0].length;
    const sentence = this.buffer.substring(0, endPosition).trim();

    // Update buffer to remaining text
    this.buffer = this.buffer.substring(endPosition).trimStart();

    logger.debug(
      `[SentenceBuffer] Extracted sentence: "${sentence.substring(0, 50)}${sentence.length > 50 ? "..." : ""}"`,
    );

    return sentence;
  }

  /**
   * Check if buffer has any remaining text (complete sentence or not)
   *
   * @returns true if buffer contains text, false if empty
   */
  hasRemainingText(): boolean {
    return this.buffer.trim().length > 0;
  }

  /**
   * Flush all remaining text from buffer
   * Returns all buffered text and clears the buffer
   * Use this at end of stream to get incomplete sentences
   *
   * @returns All remaining text in buffer
   */
  flush(): string {
    const remaining = this.buffer.trim();
    this.buffer = "";

    if (remaining) {
      logger.debug(
        `[SentenceBuffer] Flushed remaining text: "${remaining.substring(0, 50)}${remaining.length > 50 ? "..." : ""}"`,
      );
    }

    return remaining;
  }

  /**
   * Get current buffer content without modifying it
   * Useful for debugging or inspection
   *
   * @returns Current buffer content
   */
  peek(): string {
    return this.buffer;
  }

  /**
   * Clear all buffered text without returning it
   */
  clear(): void {
    this.buffer = "";
  }

  /**
   * Get the current length of buffered text
   *
   * @returns Number of characters in buffer
   */
  length(): number {
    return this.buffer.length;
  }
}
