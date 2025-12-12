/**
 * Text-to-Speech (TTS) Processing Utility
 * 
 * Central orchestrator for all TTS operations across providers.
 * Manages provider-specific TTS handlers and audio generation.
 * 
 * @module utils/ttsProcessor
 */

import { logger } from "./logger.js";
import type {
  TTSOptions,
  TTSResult,
  TTSHandler,
} from "../types/ttsTypes.js";
import { TTSError, TTSErrorCode } from "../types/ttsTypes.js";

/**
 * Maximum text length in bytes for TTS synthesis
 * Google Cloud TTS API has a 5000 byte limit
 */
const MAX_TEXT_LENGTH_BYTES = 5000;

/**
 * TTS processor class for orchestrating text-to-speech operations
 * 
 * Follows the same pattern as CSVProcessor, ImageProcessor, and PDFProcessor.
 * Provides a unified interface for TTS generation across multiple providers.
 * 
 * @example
 * ```typescript
 * // Register a handler
 * TTSProcessor.registerHandler('google-ai', googleAIHandler);
 * 
 * // Synthesize text to speech
 * const result = await TTSProcessor.synthesize('google-ai', 'Hello, world!', {
 *   voice: 'en-US-Neural2-C',
 *   format: 'mp3',
 *   speed: 1.0
 * });
 * ```
 */
export class TTSProcessor {
  /**
   * Handler registry mapping provider names to TTS handlers
   * Uses Map for O(1) lookups and better type safety
   * 
   * @private
   */
  private static readonly handlers = new Map<string, TTSHandler>();

  /**
   * Register a TTS handler for a specific provider
   * 
   * Allows providers to register their TTS implementation at runtime.
   * 
   * @param providerName - Provider identifier (e.g., 'google-ai', 'openai')
   * @param handler - TTS handler implementation
   * 
   * @example
   * ```typescript
   * const googleHandler: TTSHandler = {
   *   synthesize: async (text, options) => { ... },
   *   getVoices: async (languageCode) => { ... },
   *   isConfigured: () => true
   * };
   * 
   * TTSProcessor.registerHandler('google-ai', googleHandler);
   * ```
   */
  static registerHandler(providerName: string, handler: TTSHandler): void {
    if (!providerName) {
      throw new Error("Provider name is required");
    }

    if (!handler) {
      throw new Error("Handler is required");
    }

    const normalizedName = providerName.toLowerCase();
    
    if (this.handlers.has(normalizedName)) {
      logger.warn(
        `[TTSProcessor] Overwriting existing handler for provider: ${normalizedName}`
      );
    }

    this.handlers.set(normalizedName, handler);
    logger.debug(
      `[TTSProcessor] Registered TTS handler for provider: ${normalizedName}`
    );
  }

  /**
   * Get a registered TTS handler by provider name
   * 
   * @private
   * @param providerName - Provider identifier
   * @returns Handler instance or undefined if not registered
   */
  private static getHandler(providerName: string): TTSHandler | undefined {
    const normalizedName = providerName.toLowerCase();
    return this.handlers.get(normalizedName);
  }

  /**
   * Check if a provider is supported (has a registered TTS handler)
   * 
   * @param providerName - Provider identifier
   * @returns True if handler is registered
   * 
   * @example
   * ```typescript
   * if (TTSProcessor.supports('google-ai')) {
   *   console.log('Google AI TTS is supported');
   * }
   * ```
   */
  static supports(providerName: string): boolean {
    if (!providerName) {
      logger.error("[TTSProcessor] Provider name is required for supports check");
      return false;
    }

    const normalizedName = providerName.toLowerCase();
    const isSupported = this.handlers.has(normalizedName);
    
    if (!isSupported) {
      logger.debug(
        `[TTSProcessor] Provider ${providerName} is not supported`
      );
    }
    
    return isSupported;
  }

  /**
   * Main synthesis method that orchestrates text-to-speech conversion
   *
   * This method performs the following steps:
   * 1. Validates the input text (not empty, within length limits)
   * 2. Looks up the appropriate handler for the provider
   * 3. Delegates to the handler's synthesize method
   * 4. Adds metadata to the result
   * 5. Handles errors comprehensively
   *
   * @param providerName - Provider identifier (e.g., 'google-ai', 'vertex')
   * @param text - Text to synthesize to speech
   * @param options - TTS configuration options
   * @returns Promise resolving to TTS result with audio buffer and metadata
   * @throws {TTSError} If validation fails or handler not found
   * 
   * @example
   * ```typescript
   * const result = await TTSProcessor.synthesize('google-ai', 'Hello, world!', {
   *   voice: 'en-US-Neural2-C',
   *   format: 'mp3',
   *   speed: 1.0
   * });
   * ```
   */
  static async synthesize(
    providerName: string,
    text: string,
    options: TTSOptions = {},
  ): Promise<TTSResult> {
    try {
      // Step 1: Validate text input
      this.validateText(text);

      // Step 2: Lookup handler
      const handler = this.getHandler(providerName);
      if (!handler) {
        const errorMessage = `TTS handler not found for provider: ${providerName}`;
        logger.error(`[TTSProcessor] ${errorMessage}`, {
          provider: providerName,
          availableProviders: Array.from(this.handlers.keys()),
        });
        throw new TTSError(
          errorMessage,
          TTSErrorCode.HANDLER_NOT_FOUND,
          providerName,
        );
      }

      logger.info(`[TTSProcessor] Starting TTS synthesis with provider: ${providerName}`, {
        textLength: text.length,
        voice: options.voice,
        format: options.format,
      });

      // Step 3: Call handler synthesize
      const result = await handler.synthesize(text, options);

      // Step 4: Post-processing - add metadata
      const enrichedResult = this.addMetadata(result, options);

      logger.info("[TTSProcessor] TTS synthesis completed successfully", {
        provider: providerName,
        size: enrichedResult.size,
        format: enrichedResult.format,
        voice: enrichedResult.voice,
      });

      return enrichedResult;
    } catch (error) {
      // Step 5: Comprehensive error handling
      if (error instanceof TTSError) {
        // Re-throw TTS-specific errors
        throw error;
      }

      // Wrap other errors as synthesis failures
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error("[TTSProcessor] TTS synthesis failed", {
        provider: providerName,
        error: errorMessage,
        textLength: text.length,
      });

      throw new TTSError(
        `Synthesis failed: ${errorMessage}`,
        TTSErrorCode.SYNTHESIS_FAILED,
        providerName,
      );
    }
  }

  /**
   * Validate text input
   *
   * Checks:
   * - Text is not empty or whitespace only
   * - Text does not exceed maximum byte length
   *
   * @private
   * @param text - The text to validate
   * @throws {TTSError} If validation fails
   */
  private static validateText(text: string): void {
    // Check for empty text
    if (!text || text.trim().length === 0) {
      logger.warn("[TTSProcessor] TTS synthesis rejected: empty text provided");
      throw new TTSError(
        "Text is required for TTS synthesis",
        TTSErrorCode.INVALID_TEXT,
      );
    }

    // Check text length in bytes (Google TTS API limit is 5000 bytes)
    const textBytes = new TextEncoder().encode(text).length;
    if (textBytes > MAX_TEXT_LENGTH_BYTES) {
      logger.warn("[TTSProcessor] TTS synthesis rejected: text exceeds maximum length", {
        textBytes,
        maxBytes: MAX_TEXT_LENGTH_BYTES,
      });
      throw new TTSError(
        `Text exceeds maximum length of ${MAX_TEXT_LENGTH_BYTES} bytes (got ${textBytes} bytes)`,
        TTSErrorCode.TEXT_TOO_LONG,
      );
    }
  }

  /**
   * Add metadata to the TTS result
   *
   * Enriches the result with additional information such as:
   * - Voice used for generation
   *
   * @private
   * @param result - The base TTS result from the handler
   * @param options - The TTS options used
   * @returns Enriched TTS result with metadata
   */
  private static addMetadata(
    result: TTSResult,
    options: TTSOptions,
  ): TTSResult {
    // Add voice to result if not already present
    const voice = result.voice || options.voice;

    // Return enriched result
    return {
      ...result,
      voice,
    };
  }
}
