/**
 * Text-to-Speech (TTS) Type Definitions for NeuroLink
 *
 * This module defines types for TTS audio generation and output.
 *
 * @module types/ttsTypes
 */

/**
 * Supported audio formats for TTS output
 */
export type AudioFormat = "mp3" | "wav" | "ogg" | "opus" | "aac" | "flac" | "pcm";

/**
 * TTS quality settings
 */
export type TTSQuality = "standard" | "hd";

/**
 * TTS configuration options
 */
export type TTSOptions = {
  /** Text to synthesize */
  text?: string;
  /** Enable TTS output */
  enabled?: boolean;
  /** Voice identifier (e.g., "en-US-Neural2-C") */
  voice?: string;
  /** Audio format (default: mp3) */
  format?: AudioFormat;
  /** Speaking rate 0.25-4.0 (default: 1.0) */
  speed?: number;
  /** Audio quality (default: standard) */
  quality?: TTSQuality;
  /** Output file path (optional) */
  output?: string;
  /** Auto-play audio after generation (default: false) */
  play?: boolean;
};

/**
 * TTS audio result returned from generation
 */
export type TTSResult = {
  /** Audio data as Buffer */
  buffer: Buffer;
  /** Audio format */
  format: AudioFormat;
  /** Audio file size in bytes */
  size: number;
  /** Duration in seconds (if available) */
  duration?: number;
  /** Voice used for generation */
  voice?: string;
  /** Sample rate in Hz */
  sampleRate?: number;
};

/**
 * Result of saving audio to file
 */
export type AudioSaveResult = {
  /** Whether the save was successful */
  success: boolean;
  /** Full path to the saved file */
  path: string;
  /** File size in bytes */
  size: number;
  /** Error message if failed */
  error?: string;
};

/**
 * TTS voice information
 */
export type TTSVoice = {
  /** Voice identifier */
  id: string;
  /** Display name */
  name: string;
  /** Language code (e.g., "en-US") */
  languageCode: string;
  /** Gender */
  gender: "male" | "female" | "neutral";
  /** Voice type */
  type: "neural" | "wavenet" | "standard";
};

/** Valid audio formats as an array for runtime validation */
export const VALID_AUDIO_FORMATS: readonly AudioFormat[] = [
  "mp3",
  "wav",
  "ogg",
  "opus",
  "aac",
  "flac",
  "pcm",
];

/** Valid TTS quality levels as an array for runtime validation */
export const VALID_TTS_QUALITIES: readonly TTSQuality[] = ["standard", "hd"];

/**
 * Type guard to check if an object is a TTSResult
 */
export function isTTSResult(value: unknown): value is TTSResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    Buffer.isBuffer(obj.buffer) &&
    typeof obj.format === "string" &&
    VALID_AUDIO_FORMATS.includes(obj.format as AudioFormat) &&
    typeof obj.size === "number" &&
    obj.size >= 0
  );
}

/**
 * Type guard to check if TTSOptions are valid
 */
export function isValidTTSOptions(options: unknown): options is TTSOptions {
  if (!options || typeof options !== "object") {
    return false;
  }
  const opts = options as TTSOptions;
  if (opts.speed !== undefined) {
    if (
      typeof opts.speed !== "number" ||
      opts.speed < 0.25 ||
      opts.speed > 4.0
    ) {
      return false;
    }
  }
  if (opts.format !== undefined) {
    if (!VALID_AUDIO_FORMATS.includes(opts.format)) {
      return false;
    }
  }
  if (opts.quality !== undefined) {
    if (!VALID_TTS_QUALITIES.includes(opts.quality)) {
      return false;
    }
  }
  return true;
}

/**
 * OpenAI TTS-specific voice names
 */
export type OpenAITTSVoice =
  | "alloy"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "shimmer";

/**
 * Base TTS Handler type for implementing TTS providers
 */
export type ITTSHandler = {
  /**
   * Synthesize text to speech
   * @param options - Synthesis options
   * @returns Promise resolving to TTS result
   */
  synthesize(options: TTSOptions): Promise<TTSResult>;

  /**
   * Get supported voices
   * @returns List of supported voice names
   */
  getSupportedVoices(): string[];

  /**
   * Get supported audio formats
   * @returns List of supported format names
   */
  getSupportedFormats(): AudioFormat[];
};
