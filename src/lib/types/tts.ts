/**
 * TTS (Text-to-Speech) Type Definitions
 * Defines interfaces and types for TTS functionality
 */

/**
 * Audio encoding formats supported by TTS
 */
export type AudioEncoding = "mp3" | "wav" | "ogg" | "opus" | "aac" | "flac" | "pcm";

/**
 * TTS generation options
 */
export interface TTSOptions {
  /** Voice name (e.g., "alloy") */
  voice: string;
  /** Audio encoding format (default: MP3) */
  encoding?: AudioEncoding;
  /**
   * Speaking rate: 0.25 to 4.0 (default: 1.0)
   * Note: This field is modeled after Google Cloud TTS ("speakingRate").
   * For OpenAI TTS, map this to the "speed" parameter.
   * Implementations should map this field appropriately for each provider.
   */
  speakingRate?: number;
  /**
   * Pitch adjustment: -20.0 to 20.0 (default: 0.0)
   * Only supported by Google Cloud TTS. Not supported by OpenAI TTS.
   */
  pitch?: number;
  /** Auto-play audio (default: false) */
  play?: boolean;
}

/**
 * Audio data returned from TTS generation
 */
export interface AudioData {
  /** Audio buffer containing the audio data */
  buffer: Buffer;
  /** Audio encoding format */
  encoding: AudioEncoding;
  /** Size of the audio data in bytes */
  size: number;
}

/**
 * Voice metadata for TTS voice discovery
 */
export interface VoiceOption {
  /** Voice name (format varies by provider, e.g., "alloy" for OpenAI, "en-US-Neural2-C" for Google) */
  name: string;
  /** Language code (e.g., "en-US") */
  languageCode: string;
  /** Gender of the voice */
  gender: "MALE" | "FEMALE" | "NEUTRAL";
  /** Voice type/quality tier (provider-specific, optional) */
  type?: string;
}

/**
 * TTS Handler interface
 * Defines the contract for TTS provider implementations
 */
export interface TTSHandler {
  /**
   * Generate audio from text
   * @param text - The text to convert to speech
   * @param options - TTS generation options
   * @returns Audio data buffer and metadata
   */
  synthesize(text: string, options: TTSOptions): Promise<AudioData>;

  /**
   * Get available voices
   * @param languageCode - Optional language code to filter voices (e.g., "en-US")
   * @returns List of available voices
   */
  getVoices(languageCode?: string): Promise<VoiceOption[]>;

  /**
   * Validate TTS options
   * @param options - TTS options to validate
   * @throws Error if options are invalid
   */
  validateOptions(options: TTSOptions): void;

  /**
   * Play audio from buffer
   * @param audioData - Audio data to play
   * @returns Promise that resolves when playback completes
   */
  playAudio(audioData: AudioData): Promise<void>;
}
