/**
 * Text-to-Speech (TTS) type definitions for NeuroLink
 * Comprehensive types for TTS operations, streaming, voice configuration, and error handling
 */

import type { UnknownRecord } from "./common.js";

/**
 * Supported audio formats for TTS output
 *
 * @description Audio format types supported across different TTS providers
 * - mp3: MPEG Audio Layer 3 (lossy compression, widely supported)
 * - wav: Waveform Audio File Format (uncompressed, high quality)
 * - ogg: Ogg Vorbis (lossy compression, open format)
 * - opus: Opus codec (efficient for speech, low latency)
 * - aac: Advanced Audio Coding (lossy compression, Apple ecosystem)
 * - flac: Free Lossless Audio Codec (lossless compression)
 * - pcm: Pulse-Code Modulation (raw uncompressed audio)
 * - mulaw: μ-law encoding (telephony standard, 8-bit)
 * - alaw: A-law encoding (telephony standard, 8-bit)
 *
 * @example
 * ```typescript
 * const format: AudioFormat = "mp3";
 * const streamFormat: AudioFormat = "opus";
 * ```
 */
export type AudioFormat =
  | "mp3"
  | "wav"
  | "ogg"
  | "opus"
  | "aac"
  | "flac"
  | "pcm"
  | "mulaw"
  | "alaw";

/**
 * Voice configuration for TTS operations
 *
 * @description Defines a voice profile with characteristics and metadata
 *
 * @example
 * ```typescript
 * const voice: TTSVoice = {
 *   id: "en-US-Neural2-F",
 *   name: "Jenny",
 *   language: "en-US",
 *   gender: "female",
 *   provider: "google-ai",
 *   preview: "https://example.com/preview.mp3"
 * };
 * ```
 */
export type TTSVoice = {
  /** Unique identifier for the voice */
  id: string;

  /** Human-readable name of the voice */
  name: string;

  /** Language code (BCP-47 format, e.g., "en-US", "es-ES") */
  language: string;

  /** Locale variant for regional accents (e.g., "en-GB", "en-AU") */
  locale?: string;

  /** Voice gender classification */
  gender?: "male" | "female" | "neutral";

  /** Voice type category */
  type?: "standard" | "neural" | "wavenet" | "studio" | "premium";

  /** Provider offering this voice */
  provider?: string;

  /** Age range suggestion for the voice */
  ageRange?: "child" | "young-adult" | "adult" | "senior";

  /** Voice characteristics and tags */
  tags?: string[];

  /** Preview audio URL */
  preview?: string;

  /** Whether this voice supports SSML */
  supportsSsml?: boolean;

  /** Additional voice metadata */
  metadata?: UnknownRecord;
};

/**
 * TTS provider capabilities and feature support
 *
 * @description Describes what features and configurations a TTS provider supports
 *
 * @example
 * ```typescript
 * const capabilities: TTSCapabilities = {
 *   formats: ["mp3", "wav", "opus"],
 *   voices: 50,
 *   languages: ["en-US", "es-ES", "fr-FR"],
 *   streaming: true,
 *   ssml: true,
 *   customVoice: false
 * };
 * ```
 */
export type TTSCapabilities = {
  /** Supported audio formats */
  formats: AudioFormat[];

  /** Number of available voices */
  voices: number;

  /** Supported language codes */
  languages: string[];

  /** Whether streaming synthesis is supported */
  streaming: boolean;

  /** SSML (Speech Synthesis Markup Language) support */
  ssml: boolean;

  /** Custom voice creation/cloning support */
  customVoice: boolean;

  /** Real-time voice conversion support */
  voiceConversion?: boolean;

  /** Maximum text length per request (in characters) */
  maxTextLength?: number;

  /** Minimum sample rate in Hz */
  minSampleRate?: number;

  /** Maximum sample rate in Hz */
  maxSampleRate?: number;

  /** Support for pitch adjustment */
  supportsPitch?: boolean;

  /** Support for speed/rate adjustment */
  supportsSpeed?: boolean;

  /** Support for volume adjustment */
  supportsVolume?: boolean;

  /** Support for audio effects */
  supportsEffects?: boolean;

  /** Additional capability metadata */
  metadata?: UnknownRecord;
};

/**
 * Options for standard TTS synthesis operations
 *
 * @description Configuration options for converting text to speech
 *
 * @example Basic usage
 * ```typescript
 * const options: TTSOptions = {
 *   text: "Hello, world!",
 *   voice: "en-US-Neural2-F",
 *   format: "mp3"
 * };
 * ```
 *
 * @example Advanced configuration
 * ```typescript
 * const options: TTSOptions = {
 *   text: "<speak>Hello <break time='500ms'/> world!</speak>",
 *   voice: "en-US-Neural2-F",
 *   format: "opus",
 *   ssml: true,
 *   speed: 1.2,
 *   pitch: 0.5,
 *   sampleRate: 24000,
 *   timeout: 30000
 * };
 * ```
 */
export type TTSOptions = {
  /** Text to synthesize (plain text or SSML) */
  text: string;

  /** Voice ID or name to use for synthesis */
  voice: string;

  /** Output audio format */
  format?: AudioFormat;

  /** Whether the text contains SSML markup */
  ssml?: boolean;

  /** Speech rate/speed (typically 0.25 to 4.0, 1.0 is normal) */
  speed?: number;

  /** Voice pitch adjustment (-20.0 to 20.0, 0 is normal) */
  pitch?: number;

  /** Audio volume adjustment (0.0 to 1.0, 1.0 is normal) */
  volume?: number;

  /** Sample rate in Hz (e.g., 16000, 22050, 24000, 48000) */
  sampleRate?: number;

  /** Language code override (BCP-47 format) */
  language?: string;

  /** Audio effects to apply */
  effects?: string[];

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Provider-specific options */
  providerOptions?: UnknownRecord;

  /** Additional metadata for the request */
  metadata?: UnknownRecord;
};

/**
 * Options for streaming TTS synthesis operations
 *
 * @description Extended configuration for streaming text-to-speech with real-time processing
 *
 * @example
 * ```typescript
 * const options: TTSStreamOptions = {
 *   text: "This is a long text that will be streamed...",
 *   voice: "en-US-Neural2-F",
 *   format: "opus",
 *   chunkSize: 4096,
 *   enableProgress: true,
 *   onProgress: (progress) => {
 *     console.log(`Streamed ${progress.bytesProcessed} bytes`);
 *   }
 * };
 * ```
 */
export type TTSStreamOptions = TTSOptions & {
  /** Size of audio chunks in bytes */
  chunkSize?: number;

  /** Buffer size for streaming in bytes */
  bufferSize?: number;

  /** Enable progress tracking callbacks */
  enableProgress?: boolean;

  /** Progress callback function */
  onProgress?: (progress: TTSStreamProgress) => void | Promise<void>;

  /** Chunk callback function for handling individual audio chunks */
  onChunk?: (chunk: TTSChunk) => void | Promise<void>;

  /** Whether to automatically start streaming */
  autoStart?: boolean;

  /** Maximum concurrent streaming requests */
  maxConcurrentStreams?: number;
};

/**
 * Progress tracking information for streaming TTS operations
 *
 * @description Real-time progress data during streaming synthesis
 */
export type TTSStreamProgress = {
  /** Number of bytes processed so far */
  bytesProcessed: number;

  /** Total estimated bytes (if known) */
  totalBytes?: number;

  /** Number of chunks generated */
  chunkCount: number;

  /** Elapsed time in milliseconds */
  elapsedTime: number;

  /** Estimated time remaining in milliseconds */
  estimatedRemaining?: number;

  /** Current processing phase */
  phase: "initializing" | "streaming" | "processing" | "complete" | "error";

  /** Percentage complete (0-100) */
  progress?: number;
};

/**
 * Audio chunk for streaming TTS synthesis
 *
 * @description Represents a single chunk of audio data in a stream
 *
 * @example
 * ```typescript
 * const chunk: TTSChunk = {
 *   data: audioBuffer,
 *   format: "opus",
 *   sampleRate: 24000,
 *   channels: 1,
 *   timestamp: Date.now(),
 *   sequenceNumber: 42,
 *   isLast: false
 * };
 * ```
 */
export type TTSChunk = {
  /** Raw audio data buffer */
  data: Buffer | Uint8Array;

  /** Audio format of this chunk */
  format: AudioFormat;

  /** Sample rate in Hz */
  sampleRate: number;

  /** Number of audio channels (1 for mono, 2 for stereo) */
  channels: number;

  /** Encoding type (if applicable) */
  encoding?: "PCM16LE" | "PCM32LE" | "LINEAR16";

  /** Timestamp when this chunk was generated */
  timestamp: number;

  /** Sequence number for ordering chunks */
  sequenceNumber: number;

  /** Whether this is the final chunk in the stream */
  isLast: boolean;

  /** Size of this chunk in bytes */
  size: number;

  /** Duration of audio in this chunk (milliseconds) */
  duration?: number;

  /** Additional chunk metadata */
  metadata?: UnknownRecord;
};

/**
 * Result of a TTS synthesis operation
 *
 * @description Complete result including audio data and metadata
 *
 * @example Standard synthesis
 * ```typescript
 * const result: TTSResult = {
 *   audio: audioBuffer,
 *   format: "mp3",
 *   metadata: {
 *     duration: 3500,
 *     sampleRate: 24000,
 *     size: 48000,
 *     voice: "en-US-Neural2-F"
 *   }
 * };
 * ```
 *
 * @example Streaming synthesis
 * ```typescript
 * const result: TTSResult = {
 *   stream: asyncAudioChunks,
 *   format: "opus",
 *   metadata: {
 *     estimatedDuration: 5000,
 *     voice: "en-US-Neural2-F"
 *   }
 * };
 * ```
 */
export type TTSResult = {
  /** Generated audio data (for non-streaming) */
  audio?: Buffer | Uint8Array;

  /** Async iterable of audio chunks (for streaming) */
  stream?: AsyncIterable<TTSChunk>;

  /** Audio format of the result */
  format: AudioFormat;

  /** TTS operation metadata */
  metadata: TTSMetadata;

  /** Provider that generated this audio */
  provider?: string;

  /** Voice used for synthesis */
  voice?: string;

  /** Any warnings encountered during synthesis */
  warnings?: string[];
};

/**
 * Metadata for TTS synthesis operations
 *
 * @description Detailed information about the synthesis process and result
 *
 * @example
 * ```typescript
 * const metadata: TTSMetadata = {
 *   duration: 3500,
 *   sampleRate: 24000,
 *   channels: 1,
 *   size: 48000,
 *   format: "mp3",
 *   voice: "en-US-Neural2-F",
 *   language: "en-US",
 *   synthesisTime: 250,
 *   textLength: 120
 * };
 * ```
 */
export type TTSMetadata = {
  /** Duration of audio in milliseconds */
  duration?: number;

  /** Sample rate in Hz */
  sampleRate?: number;

  /** Number of audio channels */
  channels?: number;

  /** Total size in bytes */
  size?: number;

  /** Audio format */
  format?: AudioFormat;

  /** Voice ID used */
  voice?: string;

  /** Language code */
  language?: string;

  /** Time taken for synthesis in milliseconds */
  synthesisTime?: number;

  /** Length of input text in characters */
  textLength?: number;

  /** Estimated cost of the operation */
  cost?: number;

  /** Model or engine used */
  model?: string;

  /** Timestamp when synthesis was performed */
  timestamp?: number;

  /** Whether SSML was used */
  usedSsml?: boolean;

  /** Applied audio effects */
  appliedEffects?: string[];

  /** Provider-specific metadata */
  providerMetadata?: UnknownRecord;

  /** Additional custom metadata */
  custom?: UnknownRecord;
};

/**
 * TTS error codes for specific error conditions
 *
 * @description Standardized error codes for TTS operations
 *
 * @example
 * ```typescript
 * const errorCode: TTSErrorCode = "INVALID_VOICE";
 * ```
 */
export type TTSErrorCode =
  | "INVALID_VOICE"
  | "UNSUPPORTED_FORMAT"
  | "UNSUPPORTED_LANGUAGE"
  | "TEXT_TOO_LONG"
  | "INVALID_SSML"
  | "RATE_LIMIT_EXCEEDED"
  | "AUTHENTICATION_FAILED"
  | "NETWORK_ERROR"
  | "SYNTHESIS_FAILED"
  | "STREAMING_ERROR"
  | "INVALID_CONFIGURATION"
  | "PROVIDER_ERROR"
  | "TIMEOUT"
  | "UNKNOWN_ERROR";

/**
 * TTS-specific error class
 *
 * @description Custom error class for TTS operations with additional context
 *
 * @example
 * ```typescript
 * throw new TTSError(
 *   "Voice not found",
 *   "INVALID_VOICE",
 *   "google-ai",
 *   { voice: "unknown-voice-id" }
 * );
 * ```
 *
 * @example Catching TTS errors
 * ```typescript
 * try {
 *   const result = await handler.synthesize(options);
 * } catch (error) {
 *   if (error instanceof TTSError) {
 *     console.error(`TTS Error [${error.code}]: ${error.message}`);
 *     console.error("Provider:", error.provider);
 *     console.error("Details:", error.details);
 *   }
 * }
 * ```
 */
export class TTSError extends Error {
  /** Error code for categorization */
  public readonly code: TTSErrorCode;

  /** Provider where the error occurred */
  public readonly provider?: string;

  /** Additional error details */
  public readonly details?: UnknownRecord;

  /** Original error if this wraps another error */
  public readonly cause?: Error;

  /**
   * Creates a new TTSError
   *
   * @param message - Human-readable error message
   * @param code - TTS error code
   * @param provider - Provider where error occurred
   * @param details - Additional error context
   * @param cause - Original error if wrapping
   */
  constructor(
    message: string,
    code: TTSErrorCode = "UNKNOWN_ERROR",
    provider?: string,
    details?: UnknownRecord,
    cause?: Error,
  ) {
    super(provider ? `[${provider}] ${message}` : message);
    this.name = "TTSError";
    this.code = code;
    this.provider = provider;
    this.details = details;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TTSError);
    }
  }

  /**
   * Converts the error to a JSON-serializable object
   */
  toJSON(): UnknownRecord {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      provider: this.provider,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * TTS handler interface for provider implementations
 *
 * @description Defines the contract that all TTS providers must implement
 *
 * @example Implementing a TTS handler
 * ```typescript
 * class GoogleTTSHandler implements TTSHandler {
 *   async synthesize(options: TTSOptions): Promise<TTSResult> {
 *     // Implementation
 *   }
 *
 *   async synthesizeStream(options: TTSStreamOptions): Promise<TTSResult> {
 *     // Implementation
 *   }
 *
 *   async listVoices(language?: string): Promise<TTSVoice[]> {
 *     // Implementation
 *   }
 *
 *   async getCapabilities(): Promise<TTSCapabilities> {
 *     // Implementation
 *   }
 *
 *   async isAvailable(): Promise<boolean> {
 *     return true;
 *   }
 * }
 * ```
 *
 * @example Using a TTS handler
 * ```typescript
 * const handler: TTSHandler = new GoogleTTSHandler();
 *
 * // Check availability
 * const available = await handler.isAvailable();
 *
 * // List voices
 * const voices = await handler.listVoices("en-US");
 *
 * // Synthesize speech
 * const result = await handler.synthesize({
 *   text: "Hello, world!",
 *   voice: voices[0].id,
 *   format: "mp3"
 * });
 * ```
 */
export interface TTSHandler {
  /**
   * Synthesizes text to speech (non-streaming)
   *
   * @param options - TTS synthesis options
   * @returns Promise resolving to TTS result with audio data
   * @throws {TTSError} If synthesis fails
   *
   * @example
   * ```typescript
   * const result = await handler.synthesize({
   *   text: "Hello, world!",
   *   voice: "en-US-Neural2-F",
   *   format: "mp3",
   *   speed: 1.0
   * });
   *
   * // result.audio contains the complete audio buffer
   * fs.writeFileSync("output.mp3", result.audio);
   * ```
   */
  synthesize(options: TTSOptions): Promise<TTSResult>;

  /**
   * Synthesizes text to speech with streaming support
   *
   * @param options - TTS streaming options
   * @returns Promise resolving to TTS result with audio stream
   * @throws {TTSError} If streaming synthesis fails
   *
   * @example
   * ```typescript
   * const result = await handler.synthesizeStream({
   *   text: "This is a long text...",
   *   voice: "en-US-Neural2-F",
   *   format: "opus",
   *   onChunk: (chunk) => {
   *     console.log(`Received chunk ${chunk.sequenceNumber}`);
   *     // Process chunk immediately
   *   }
   * });
   *
   * // Or iterate over the stream
   * for await (const chunk of result.stream!) {
   *   processAudioChunk(chunk);
   * }
   * ```
   */
  synthesizeStream(options: TTSStreamOptions): Promise<TTSResult>;

  /**
   * Lists available voices for the provider
   *
   * @param language - Optional language filter (BCP-47 format)
   * @returns Promise resolving to array of available voices
   * @throws {TTSError} If listing voices fails
   *
   * @example
   * ```typescript
   * // List all voices
   * const allVoices = await handler.listVoices();
   *
   * // List only English voices
   * const enVoices = await handler.listVoices("en-US");
   *
   * // Filter by characteristics
   * const femaleVoices = enVoices.filter(v => v.gender === "female");
   * ```
   */
  listVoices(language?: string): Promise<TTSVoice[]>;

  /**
   * Gets the provider's TTS capabilities
   *
   * @returns Promise resolving to capability information
   * @throws {TTSError} If fetching capabilities fails
   *
   * @example
   * ```typescript
   * const capabilities = await handler.getCapabilities();
   *
   * console.log("Supported formats:", capabilities.formats);
   * console.log("Available voices:", capabilities.voices);
   * console.log("Streaming support:", capabilities.streaming);
   * console.log("SSML support:", capabilities.ssml);
   * ```
   */
  getCapabilities(): Promise<TTSCapabilities>;

  /**
   * Checks if the TTS handler is available and properly configured
   *
   * @returns Promise resolving to true if available, false otherwise
   *
   * @example
   * ```typescript
   * const available = await handler.isAvailable();
   * if (available) {
   *   // Proceed with TTS operations
   * } else {
   *   console.error("TTS provider not available");
   * }
   * ```
   */
  isAvailable(): Promise<boolean>;

  /**
   * Optional: Validates TTS options before synthesis
   *
   * @param options - TTS options to validate
   * @returns Promise resolving to true if valid, false otherwise
   *
   * @example
   * ```typescript
   * const options: TTSOptions = {
   *   text: "Hello!",
   *   voice: "en-US-Neural2-F",
   *   format: "mp3"
   * };
   *
   * const valid = await handler.validateOptions?.(options);
   * if (!valid) {
   *   console.error("Invalid TTS options");
   * }
   * ```
   */
  validateOptions?(options: TTSOptions | TTSStreamOptions): Promise<boolean>;

  /**
   * Optional: Gets provider name
   *
   * @returns Provider name string
   *
   * @example
   * ```typescript
   * const name = handler.getName?.() ?? "unknown";
   * console.log(`Using TTS provider: ${name}`);
   * ```
   */
  getName?(): string;
}
