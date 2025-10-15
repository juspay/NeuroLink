/**
 * TTS (Text-to-Speech) Types
 * Supports Google Gemini TTS with configurable voice parameters
 */

/**
 * Input parameters for TTS generation
 */
export type TTSInput = {
  /** Text to convert to speech */
  text: string;

  /** TTS provider - currently only 'gemini' is supported. In the future, for additional providers, this can be made into an enum type */
  provider: "gemini";

  /** Language code (e.g., 'en-US', 'en-GB', 'es-ES') */
  languageCode: string;

  /** Voice name (e.g., 'en-US-Wavenet-D', 'en-US-Neural2-A') */
  voiceName: string;

  /** Audio encoding format */
  audioEncoding?: "MP3" | "WAV" | "OGG";

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

  /** Default audio encoding */
  defaultEncoding?: "MP3" | "WAV" | "OGG";
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

  /** Audio encoding format */
  encoding: string;
};

/**
 * Voice option for TTS
 */
export type VoiceOption = {
  /** Voice identifier */
  name: string;

  /** Language code */
  languageCode: string;

  /** Voice gender */
  gender: "MALE" | "FEMALE" | "NEUTRAL";

  /** Voice type (Neural, Wavenet, Standard) */
  type: "NEURAL" | "WAVENET" | "STANDARD";
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
  audioEncoding?: "MP3" | "WAV" | "OGG";
  speakingRate?: number;
  pitch?: number;
  format?: "text" | "json";
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
    audioEncoding: string;
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
