/**
 * TTS (Text-to-Speech) Types
 * Supports Google Cloud Text-to-Speech with configurable voice parameters
 */

/**
 * Audio encoding formats (user-facing)
 */
export type AudioEncoding = "MP3" | "WAV" | "OGG";

/**
 * Google API audio encodings (transport)
 */
export type GoogleAudioEncoding = "MP3" | "LINEAR16" | "OGG_OPUS";

/**
 * Input parameters for TTS generation
 */
export type TTSInput = {
  /** Text to convert to speech */
  text: string;

  /** TTS provider - currently only 'gemini' is supported. To add more providers, extend the union type (e.g., "gemini" | "openai"), which is the preferred pattern in modern TypeScript. */
  provider: "gemini";

  /** Language code (e.g., 'en-US', 'en-GB', 'es-ES') */
  languageCode: string;

  /** Voice name (e.g., 'en-US-Wavenet-D', 'en-US-Neural2-A') */
  voiceName: string;

  /** Audio encoding format (user-facing) */
  audioEncoding?: AudioEncoding;

  /** Speaking rate (0.25 to 4.0, default: 1.0) */
  speakingRate?: number;

  /** Voice pitch (-20.0 to 20.0, default: 0.0) */
  pitch?: number;

  /** Whether to play audio after generating */
  play?: boolean;
};

/**
 * Configuration for TTS service
 */
export type TTSConfig = {
  /** Google API Key for authentication */
  apiKey: string;

  /** Default audio encoding (user-facing) */
  defaultEncoding?: AudioEncoding;
};

/**
 * Response from TTS generation
 */
export type TTSResponse = {
  /** Generated audio buffer */
  audioBuffer: Buffer;

  /** Size of the generated audio in bytes */
  audioSize: number;

  /** Duration of audio generation in milliseconds */
  generationTime: number;

  /** Whether audio was played */
  wasPlayed: boolean;

  /** Audio encoding format (user-facing) */
  encoding: AudioEncoding;
};

/**
 * Voice option for TTS (for backward compatibility)
 * Note: Use GoogleVoice type for actual API responses
 */
export type VoiceOption = {
  /** Voice identifier */
  name: string;

  /** Language code (single code for display) */
  languageCode: string;

  /** Voice gender */
  gender: "MALE" | "FEMALE" | "NEUTRAL";

  /** Voice type */
  type: "NEURAL2" | "WAVENET" | "STANDARD" | "STUDIO" | "CHIRP3" | "ONESPEAKER";
};

/**
 * Custom error class for TTS operations
 */
export class TTSError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "TTSError";
  }
}

/**
 * Arguments for TTS generate command
 */
export type TTSGenerateArgs = {
  text: string;
  voiceName?: string;
  languageCode?: string;
  audioEncoding?: AudioEncoding;
  speakingRate?: number;
  pitch?: number;
  format?: "text" | "json" | "table";
  quiet?: boolean;
  debug?: boolean;
};

/**
 * Arguments for TTS voices command
 */
export type TTSVoicesArgs = {
  language?: string;
  format?: "text" | "json" | "table";
  quiet?: boolean;
  debug?: boolean;
};

/**
 * Google TTS API Types
 */

/**
 * Request format for Google TTS API
 */
export type GoogleTTSRequest = {
  input: {
    text: string;
  };
  voice: {
    languageCode: string;
    name: string;
  };
  audioConfig: {
    audioEncoding: GoogleAudioEncoding;
    speakingRate?: number;
    pitch?: number;
  };
};

/**
 * Response format from Google TTS API
 */
export type GoogleTTSResponse = {
  audioContent: string;
};

/**
 * Google voice option details
 */
export type GoogleVoice = {
  languageCodes: string[];
  name: string;
  ssmlGender: string;
  naturalSampleRateHertz: number;
};

/**
 * Response format for Google voices list API
 */
export type GoogleVoicesResponse = {
  voices: GoogleVoice[];
};
