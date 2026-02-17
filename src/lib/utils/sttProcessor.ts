/**
 * Speech-to-Text (STT) Processing Utility
 *
 * Central orchestrator for all STT operations across providers.
 * Follows the same pattern as TTSProcessor.
 *
 * @module utils/sttProcessor
 */

import { logger } from "./logger.js";
import type { STTOptions, STTResult } from "../types/sttTypes.js";
import { ErrorCategory, ErrorSeverity } from "../constants/enums.js";
import { NeuroLinkError } from "./errorHandling.js";

/**
 * STT-specific error codes
 *
 * Comprehensive error codes for all STT operations, following TTS pattern
 */
export const STT_ERROR_CODES = {
  // Input validation errors
  EMPTY_AUDIO: "STT_EMPTY_AUDIO",
  AUDIO_TOO_LARGE: "STT_AUDIO_TOO_LARGE",
  AUDIO_TOO_LONG: "STT_AUDIO_TOO_LONG",
  INVALID_FORMAT: "STT_INVALID_FORMAT",
  INVALID_ENCODING: "STT_INVALID_ENCODING",
  INVALID_SAMPLE_RATE: "STT_INVALID_SAMPLE_RATE",
  INVALID_OPTIONS: "STT_INVALID_OPTIONS",

  // Provider errors
  PROVIDER_NOT_SUPPORTED: "STT_PROVIDER_NOT_SUPPORTED",
  PROVIDER_NOT_CONFIGURED: "STT_PROVIDER_NOT_CONFIGURED",
  PROVIDER_ERROR: "STT_PROVIDER_ERROR",

  // Transcription errors
  TRANSCRIPTION_FAILED: "STT_TRANSCRIPTION_FAILED",
  TRANSCRIPTION_TIMEOUT: "STT_TRANSCRIPTION_TIMEOUT",
  NO_SPEECH_DETECTED: "STT_NO_SPEECH_DETECTED",
  LANGUAGE_NOT_SUPPORTED: "STT_LANGUAGE_NOT_SUPPORTED",
  MODEL_NOT_AVAILABLE: "STT_MODEL_NOT_AVAILABLE",

  // Network/API errors
  NETWORK_ERROR: "STT_NETWORK_ERROR",
  API_ERROR: "STT_API_ERROR",
  RATE_LIMIT_ERROR: "STT_RATE_LIMIT_ERROR",
  QUOTA_EXCEEDED: "STT_QUOTA_EXCEEDED",
} as const;

export type STTErrorCode =
  (typeof STT_ERROR_CODES)[keyof typeof STT_ERROR_CODES];

/**
 * STT Error class for speech-to-text specific errors
 *
 * Extends NeuroLinkError with STT-specific defaults and error handling.
 * Provides consistent error reporting across all STT operations.
 *
 * @example
 * ```typescript
 * throw new STTError({
 *   code: STT_ERROR_CODES.AUDIO_TOO_LARGE,
 *   message: 'Audio file exceeds 10MB limit',
 *   severity: ErrorSeverity.MEDIUM,
 *   retriable: false,
 *   context: { sizeMB: 15, maxSizeMB: 10 }
 * });
 * ```
 */
export class STTError extends NeuroLinkError {
  constructor(params: {
    code: string;
    message: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    retriable?: boolean;
    context?: Record<string, unknown>;
    originalError?: Error;
  }) {
    super({
      code: params.code,
      message: params.message,
      category: params.category ?? ErrorCategory.STT,
      severity: params.severity ?? ErrorSeverity.MEDIUM,
      retriable: params.retriable ?? false,
      context: params.context,
      originalError: params.originalError,
    });
    this.name = "STTError";
  }
}

/**
 * STT Handler interface for provider-specific implementations
 *
 * Each provider (Google Cloud, AWS Transcribe, etc.) implements this interface
 * to provide STT transcription capabilities using their respective APIs.
 *
 * **Timeout Handling:**
 * Implementations MUST handle their own timeouts for the `transcribe()` method.
 * Recommended timeout: 60 seconds. Implementations should use `withTimeout()` utility
 * or provider-specific timeout mechanisms.
 *
 * **Error Handling:**
 * Implementations should throw STTError for all failures, including timeouts.
 * Use appropriate error codes from STT_ERROR_CODES.
 *
 * @example
 * ```typescript
 * class MySTTHandler implements STTHandler {
 *   async transcribe(audio: Buffer, options: STTOptions): Promise<STTResult> {
 *     // REQUIRED: Implement timeout handling
 *     return await withTimeout(
 *       this.actualTranscription(audio, options),
 *       60000, // 60 second timeout
 *       'STT transcription timed out'
 *     );
 *   }
 *
 *   isConfigured(): boolean {
 *     return !!process.env.MY_STT_API_KEY;
 *   }
 * }
 * ```
 */
export interface STTHandler {
  /**
   * Transcribe audio to text using provider-specific STT API
   *
   * **IMPORTANT: Timeout Responsibility**
   * Implementations MUST enforce their own timeouts (recommended: 60 seconds).
   * Use the `withTimeout()` utility or provider-specific timeout mechanisms.
   *
   * @param audio - Audio buffer to transcribe (pre-validated, non-empty, within size limits)
   * @param options - STT configuration options (language, model, encoding, etc.)
   * @returns Transcription result with metadata
   * @throws {STTError} On transcription failure, timeout, or configuration issues
   */
  transcribe(audio: Buffer, options: STTOptions): Promise<STTResult>;

  /**
   * Get available models for the provider
   *
   * @returns List of available model identifiers
   */
  getModels?(): Promise<string[]>;

  /**
   * Validate that the provider is properly configured
   *
   * @returns True if provider can transcribe audio
   */
  isConfigured(): boolean;

  /**
   * Maximum audio file size in MB
   * Different providers have different limits
   *
   * @default 10 if not specified
   */
  readonly maxAudioSizeMB: number;

  /**
   * Maximum audio duration in seconds
   * Different providers have different limits
   *
   * @default 60 if not specified
   */
  readonly maxDurationSeconds: number;
}

/**
 * STT Processor class for orchestrating speech-to-text operations
 *
 * Follows the same pattern as TTSProcessor.
 * Provides a unified interface for STT transcription across multiple providers.
 *
 * @example
 * ```typescript
 * // Register a handler
 * STTProcessor.registerHandler('google-ai', googleSTTHandler);
 *
 * // Check if provider is supported
 * if (STTProcessor.supports('google-ai')) {
 *   // Provider is registered
 * }
 *
 * // Transcribe audio
 * const result = await STTProcessor.transcribe(
 *   audioBuffer,
 *   'google-ai',
 *   { languageCode: 'en-US', enableWordTimeOffsets: true }
 * );
 * ```
 */
export class STTProcessor {
  /**
   * Handler registry mapping provider names to STT handlers
   * Uses Map for O(1) lookups and better type safety
   *
   * @private
   */
  private static readonly handlers = new Map<string, STTHandler>();

  /**
   * Default maximum audio size in MB
   *
   * Providers can override this value by specifying the `maxAudioSizeMB` property
   * in their respective `STTHandler` implementation.
   *
   * @private
   */
  private static readonly DEFAULT_MAX_AUDIO_SIZE_MB = 10;

  /**
   * Register an STT handler for a specific provider
   *
   * Allows providers to register their STT implementation at runtime.
   *
   * @param providerName - Provider identifier (e.g., 'google-ai', 'vertex')
   * @param handler - STT handler implementation
   *
   * @example
   * ```typescript
   * const googleHandler: STTHandler = {
   *   transcribe: async (audio, options) => { ... },
   *   isConfigured: () => true,
   *   maxAudioSizeMB: 10,
   *   maxDurationSeconds: 60
   * };
   *
   * STTProcessor.registerHandler('google-ai', googleHandler);
   * ```
   */
  static registerHandler(providerName: string, handler: STTHandler): void {
    if (!providerName) {
      throw new STTError({
        code: STT_ERROR_CODES.INVALID_OPTIONS,
        message: "Provider name is required for STT handler registration",
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.HIGH,
        retriable: false,
        context: {
          method: "STTProcessor.registerHandler",
        },
      });
    }

    if (!handler) {
      throw new STTError({
        code: STT_ERROR_CODES.INVALID_OPTIONS,
        message: "Handler is required for STT handler registration",
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.HIGH,
        retriable: false,
        context: {
          method: "STTProcessor.registerHandler",
          providerName,
        },
      });
    }

    const normalizedName = providerName.toLowerCase();

    if (this.handlers.has(normalizedName)) {
      logger.warn(
        `[STTProcessor] Overwriting existing handler for provider: ${normalizedName}`,
      );
    }

    this.handlers.set(normalizedName, handler);
    logger.info(
      `[STTProcessor] Registered STT handler for provider: ${normalizedName}`,
    );
  }

  /**
   * Get a registered STT handler by provider name
   *
   * @private
   * @param providerName - Provider identifier
   * @returns Handler instance or undefined if not registered
   */
  private static getHandler(providerName: string): STTHandler | undefined {
    const normalizedName = providerName.toLowerCase();
    return this.handlers.get(normalizedName);
  }

  /**
   * Check if a provider is supported (has a registered STT handler)
   *
   * @param providerName - Provider identifier
   * @returns True if handler is registered
   *
   * @example
   * ```typescript
   * if (STTProcessor.supports('google-ai')) {
   *   console.log('Google AI STT is supported');
   * }
   * ```
   */
  static supports(providerName: string): boolean {
    if (!providerName) {
      logger.error(
        "[STTProcessor] Provider name is required for supports check",
      );
      return false;
    }

    const normalizedName = providerName.toLowerCase();
    const isSupported = this.handlers.has(normalizedName);

    if (!isSupported) {
      logger.debug(`[STTProcessor] Provider ${providerName} is not supported`);
    }

    return isSupported;
  }

  /**
   * Get list of all registered providers
   *
   * @returns Array of registered provider names
   */
  static getRegisteredProviders(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get available models for a specific provider
   *
   * @param providerName - Provider identifier
   * @returns List of available model identifiers
   * @throws {STTError} If provider not supported
   */
  static async getModels(providerName: string): Promise<string[]> {
    const handler = this.getHandler(providerName);

    if (!handler) {
      throw new STTError({
        code: STT_ERROR_CODES.PROVIDER_NOT_SUPPORTED,
        message: `STT provider "${providerName}" is not supported`,
        severity: ErrorSeverity.HIGH,
        retriable: false,
        context: { provider: providerName },
      });
    }

    if (!handler.getModels) {
      logger.warn(
        `[STTProcessor] Provider "${providerName}" does not implement getModels()`,
      );
      return [];
    }

    return handler.getModels();
  }

  /**
   * Transcribe audio using specified provider
   *
   * Orchestrates the speech-to-text transcription process:
   * 1. Validates audio buffer (not empty, within size limits)
   * 2. Looks up the provider handler
   * 3. Verifies provider configuration
   * 4. Delegates transcription to the provider (timeout handled by provider)
   * 5. Enriches result with metadata
   *
   * **Timeout Handling:**
   * Timeouts are enforced by individual provider implementations (see STTHandler interface).
   * Providers typically use 60-second timeouts via `withTimeout()` utility or
   * provider-specific timeout mechanisms.
   *
   * @param audio - Audio buffer to transcribe (validated, non-empty, within size limits)
   * @param provider - Provider identifier
   * @param options - STT configuration options
   * @returns Transcription result with text, confidence, and metadata
   * @throws {STTError} If validation fails or provider not supported/configured
   *
   * @example
   * ```typescript
   * const result = await STTProcessor.transcribe(
   *   audioBuffer,
   *   'google-ai',
   *   {
   *     languageCode: 'en-US',
   *     enableWordTimeOffsets: true,
   *     enableAutomaticPunctuation: true
   *   }
   * );
   *
   * console.log(`Transcription: ${result.text}`);
   * console.log(`Confidence: ${result.confidence}`);
   * ```
   */
  static async transcribe(
    audio: Buffer,
    provider: string,
    options: STTOptions,
  ): Promise<STTResult> {
    // 1. Validate audio buffer
    if (!audio || audio.length === 0) {
      logger.error("[STTProcessor] Audio buffer is empty");
      throw new STTError({
        code: STT_ERROR_CODES.EMPTY_AUDIO,
        message: "Audio buffer is required for transcription",
        severity: ErrorSeverity.LOW,
        retriable: false,
        context: { provider },
      });
    }

    // 2. Get handler
    const handler = this.getHandler(provider);
    if (!handler) {
      logger.error(`[STTProcessor] Provider "${provider}" is not registered`);
      throw new STTError({
        code: STT_ERROR_CODES.PROVIDER_NOT_SUPPORTED,
        message: `STT provider "${provider}" is not supported. Available: ${Array.from(this.handlers.keys()).join(", ")}`,
        severity: ErrorSeverity.HIGH,
        retriable: false,
        context: { provider, available: Array.from(this.handlers.keys()) },
      });
    }

    // 3. Check configuration
    if (!handler.isConfigured()) {
      logger.error(`[STTProcessor] Provider "${provider}" is not configured`);
      throw new STTError({
        code: STT_ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        message: `STT provider "${provider}" is not properly configured. Check API credentials.`,
        category: ErrorCategory.CONFIGURATION,
        severity: ErrorSeverity.HIGH,
        retriable: false,
        context: { provider },
      });
    }

    // 4. Validate audio size
    const sizeMB = audio.length / (1024 * 1024);
    if (sizeMB > handler.maxAudioSizeMB) {
      logger.error(
        `[STTProcessor] Audio size ${sizeMB.toFixed(1)}MB exceeds limit of ${handler.maxAudioSizeMB}MB`,
      );
      throw new STTError({
        code: STT_ERROR_CODES.AUDIO_TOO_LARGE,
        message: `Audio size ${sizeMB.toFixed(1)}MB exceeds provider limit of ${handler.maxAudioSizeMB}MB`,
        severity: ErrorSeverity.MEDIUM,
        retriable: false,
        context: { sizeMB, maxSizeMB: handler.maxAudioSizeMB },
      });
    }

    try {
      // 5. Transcribe
      logger.info(
        `[STTProcessor] Transcribing ${sizeMB.toFixed(2)}MB audio with provider: ${provider}`,
      );

      const result = await handler.transcribe(audio, options);

      // 6. Post-processing: add metadata
      const enrichedResult: STTResult = {
        ...result,
        languageCode: result.languageCode ?? options.languageCode,
      };

      logger.info(
        `[STTProcessor] Successfully transcribed audio (confidence: ${(result.confidence * 100).toFixed(1)}%)`,
      );

      return enrichedResult;
    } catch (err: unknown) {
      // 7. Comprehensive error handling
      // Re-throw STTError as-is
      if (err instanceof STTError) {
        throw err;
      }

      // Wrap other errors in STTError
      const errorMessage =
        err instanceof Error ? err.message : String(err || "Unknown error");
      logger.error(
        `[STTProcessor] Transcription failed for provider "${provider}": ${errorMessage}`,
      );
      throw new STTError({
        code: STT_ERROR_CODES.TRANSCRIPTION_FAILED,
        message: `STT transcription failed for provider "${provider}": ${errorMessage}`,
        category: ErrorCategory.EXECUTION,
        severity: ErrorSeverity.HIGH,
        retriable: true,
        context: {
          provider,
          audioSizeMB: sizeMB,
          options,
        },
        originalError: err instanceof Error ? err : undefined,
      });
    }
  }
}
