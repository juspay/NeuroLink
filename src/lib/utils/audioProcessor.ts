/**
 * Audio processing utilities for multimodal support
 * Handles audio transcription and processing for different AI providers
 */

import { logger } from "./logger.js";

/**
 * Supported audio transcription providers
 */
export type AudioTranscriptionProvider = "openai" | "google";

/**
 * Audio input options for transcription
 */
export type TranscriptionOptions = {
  /** Audio file as Buffer */
  audio: Buffer;
  /** Language code (e.g., 'en-US', 'es-ES') */
  language?: string;
  /** Audio format/MIME type (e.g., 'audio/wav', 'audio/mp3') */
  mimeType?: string;
  /** Optional model override */
  model?: string;
};

/**
 * Transcription result structure
 * Matches the expected return format for OpenAI transcription
 */
export type TranscriptionResult = {
  /** The transcribed text content */
  text: string;
  /** Detected or specified language */
  language?: string;
  /** Transcription duration in seconds */
  duration?: number;
  /** Provider used for transcription */
  provider: AudioTranscriptionProvider;
  /** Model used for transcription */
  model?: string;
  /** Confidence score (0-1) if available */
  confidence?: number;
  /** Additional metadata */
  metadata?: {
    /** Audio file size in bytes */
    audioSize?: number;
    /** Processing time in milliseconds */
    processingTimeMs?: number;
  };
};

/**
 * Audio processor class for handling provider-specific audio processing
 */
export class AudioProcessor {
  /**
   * Transcribe audio using Google Cloud Speech-to-Text
   *
   * @param options - Transcription options including audio buffer and language
   * @returns Promise<TranscriptionResult> - The transcription result
   * @throws Error - Always throws as this feature is not yet implemented
   *
   * @remarks
   * This method is a placeholder for future Google Cloud Speech-to-Text integration.
   * Currently not implemented - use OpenAI provider instead.
   *
   * @example
   * ```typescript
   * // This will throw an error - use OpenAI instead
   * const result = await AudioProcessor.transcribeWithGoogle({
   *   audio: audioBuffer,
   *   language: 'en-US'
   * });
   * ```
   *
   * @future
   * Future implementation will require:
   * - Google Cloud credentials configuration
   * - @google-cloud/speech package dependency
   * - Speech-to-Text API v1 or v2 integration
   */
  static async transcribeWithGoogle(
    _options: TranscriptionOptions,
  ): Promise<TranscriptionResult> {
    logger.warn(
      "Google Speech-to-Text transcription is not yet implemented. Please use OpenAI provider instead.",
    );

    throw new Error(
      "Google Speech-to-Text transcription is not yet implemented. " +
        "Please use the OpenAI provider for audio transcription by setting provider: 'openai'. " +
        "Google Cloud Speech-to-Text support is planned for a future release.",
    );
  }

  /**
   * Detect audio type from Buffer using magic bytes
   *
   * @param buffer - Audio file as Buffer
   * @returns Detected MIME type or default
   */
  static detectAudioType(buffer: Buffer): string {
    try {
      if (buffer.length < 12) {
        return "audio/mpeg"; // Default fallback
      }

      // WAV: RIFF....WAVE
      if (
        buffer.subarray(0, 4).toString() === "RIFF" &&
        buffer.subarray(8, 12).toString() === "WAVE"
      ) {
        return "audio/wav";
      }

      // MP3: ID3 or FF FB/FA/F3
      if (
        buffer.subarray(0, 3).toString() === "ID3" ||
        (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
      ) {
        return "audio/mpeg";
      }

      // OGG: OggS
      if (buffer.subarray(0, 4).toString() === "OggS") {
        return "audio/ogg";
      }

      // FLAC: fLaC
      if (buffer.subarray(0, 4).toString() === "fLaC") {
        return "audio/flac";
      }

      // M4A/AAC: ftyp
      if (buffer.subarray(4, 8).toString() === "ftyp") {
        return "audio/mp4";
      }

      // WebM: 1A 45 DF A3
      if (
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      ) {
        return "audio/webm";
      }

      return "audio/mpeg"; // Default fallback
    } catch (error) {
      logger.warn("Failed to detect audio type, using default:", error);
      return "audio/mpeg";
    }
  }

  /**
   * Validate audio file size
   *
   * @param data - Audio file as Buffer
   * @param maxSize - Maximum allowed size in bytes (default: 25MB)
   * @returns Boolean indicating if size is valid
   */
  static validateAudioSize(
    data: Buffer,
    maxSize: number = 25 * 1024 * 1024,
  ): boolean {
    try {
      return data.length <= maxSize;
    } catch (error) {
      logger.warn("Failed to validate audio size:", error);
      return false;
    }
  }

  /**
   * Validate audio format for transcription
   *
   * @param mimeType - MIME type of the audio file
   * @returns Boolean indicating if format is supported
   */
  static validateAudioFormat(mimeType: string): boolean {
    const supportedFormats = [
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/m4a",
      "audio/ogg",
      "audio/flac",
      "audio/webm",
    ];
    return supportedFormats.includes(mimeType.toLowerCase());
  }
}

/**
 * Utility functions for audio handling
 */
export const audioUtils = {
  /**
   * Check if a Buffer is a valid audio file
   */
  isAudioBuffer: (buffer: Buffer): boolean => {
    const mimeType = AudioProcessor.detectAudioType(buffer);
    return AudioProcessor.validateAudioFormat(mimeType);
  },

  /**
   * Get audio file extension from MIME type
   */
  getExtensionFromMimeType: (mimeType: string): string => {
    const extensions: Record<string, string> = {
      "audio/wav": "wav",
      "audio/wave": "wav",
      "audio/x-wav": "wav",
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/mp4": "m4a",
      "audio/m4a": "m4a",
      "audio/ogg": "ogg",
      "audio/flac": "flac",
      "audio/webm": "webm",
    };
    return extensions[mimeType.toLowerCase()] || "bin";
  },

  /**
   * Convert file size to human readable format
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },
};
