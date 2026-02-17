/**
 * Speech-to-Text (STT) Types
 *
 * Type definitions for audio transcription using Google Cloud Speech-to-Text
 *
 * @module types/sttTypes
 */

/**
 * Audio encoding formats supported by Google Speech-to-Text
 */
export type AudioEncoding =
  | "LINEAR16" // Uncompressed 16-bit signed little-endian samples (WAV)
  | "FLAC" // Free Lossless Audio Codec
  | "MULAW" // 8-bit µ-law encoding
  | "AMR" // Adaptive Multi-Rate Narrowband
  | "AMR_WB" // Adaptive Multi-Rate Wideband
  | "OGG_OPUS" // Opus encoded audio in Ogg container
  | "SPEEX_WITH_HEADER_BYTE"
  | "MP3" // MP3 audio
  | "WEBM_OPUS"; // Opus in WebM container

/**
 * Valid STT models as an array for runtime validation
 * Used to derive STTModel type for compile-time safety
 */
export const VALID_STT_MODELS = [
  "default",
  "command_and_search",
  "phone_call",
  "video",
  "medical_dictation",
  "latest_long",
  "latest_short",
] as const;

/**
 * STT model type derived from VALID_STT_MODELS
 * Automatically stays in sync with the runtime validation array
 */
export type STTModel = (typeof VALID_STT_MODELS)[number];

/**
 * Speech-to-Text configuration options
 */
export type STTOptions = {
  /** Audio encoding format */
  encoding?: AudioEncoding;
  /** Sample rate in Hz (8000, 16000, 48000, etc.) */
  sampleRateHertz?: number;
  /** Language code (e.g., 'en-US', 'es-ES') - leave undefined for auto-detection */
  languageCode?: string;
  /** Alternative language codes for multi-language audio */
  alternativeLanguageCodes?: string[];
  /** Maximum number of recognition alternatives to return */
  maxAlternatives?: number;
  /** Enable profanity filtering */
  profanityFilter?: boolean;
  /** Enable automatic punctuation */
  enableAutomaticPunctuation?: boolean;
  /** Enable word-level timestamps */
  enableWordTimeOffsets?: boolean;
  /** Enable word confidence scores */
  enableWordConfidence?: boolean;
  /** Speech contexts (phrases/words to bias recognition) */
  speechContexts?: Array<{
    phrases: string[];
    boost?: number;
  }>;
  /** Audio channel count (1 for mono, 2 for stereo) */
  audioChannelCount?: number;
  /** Enable speaker diarization (who spoke when) */
  enableSpeakerDiarization?: boolean;
  /** Min/max number of speakers for diarization */
  diarizationSpeakerCount?: number;
  /** Model to use for transcription */
  model?: STTModel;
  /** Use enhanced models (higher cost, better accuracy) */
  useEnhanced?: boolean;
};

/**
 * Word-level timing information
 */
export type WordInfo = {
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** The word itself */
  word: string;
  /** Confidence score 0.0-1.0 */
  confidence?: number;
  /** Speaker tag (if diarization enabled) */
  speakerTag?: number;
};

/**
 * Alternative transcription result
 */
export type TranscriptAlternative = {
  /** Transcribed text */
  transcript: string;
  /** Confidence score 0.0-1.0 */
  confidence: number;
  /** Word-level details */
  words?: WordInfo[];
};

/**
 * Speech-to-Text transcription result
 */
export type STTResult = {
  /** Primary transcription text */
  text: string;
  /** Confidence score for primary result (0.0-1.0) */
  confidence: number;
  /** Alternative transcriptions (if requested) */
  alternatives?: TranscriptAlternative[];
  /** Language detected/used */
  languageCode?: string;
  /** Word-level timing and confidence */
  words?: WordInfo[];
  /** Audio duration in seconds */
  duration?: number;
  /** Provider metadata */
  metadata: {
    /** Processing latency in milliseconds */
    latency: number;
    /** Provider name */
    provider: string;
    /** Model used */
    model?: string;
    /** Total billed time in seconds */
    billedSeconds?: number;
  };
};

/**
 * Supported audio formats (file extensions)
 */
export const SUPPORTED_AUDIO_FORMATS = [
  "wav",
  "flac",
  "mp3",
  "ogg",
  "opus",
  "webm",
  "amr",
] as const;

export type SupportedAudioFormat = (typeof SUPPORTED_AUDIO_FORMATS)[number];

/**
 * Type guard to check if format is supported
 */
export function isSupportedAudioFormat(
  format: string,
): format is SupportedAudioFormat {
  const normalized = format.replace(/^\./, "").toLowerCase();
  return SUPPORTED_AUDIO_FORMATS.includes(normalized as SupportedAudioFormat);
}

/**
 * Valid audio encodings as an array for runtime validation
 */
export const VALID_AUDIO_ENCODINGS: readonly AudioEncoding[] = [
  "LINEAR16",
  "FLAC",
  "MULAW",
  "AMR",
  "AMR_WB",
  "OGG_OPUS",
  "SPEEX_WITH_HEADER_BYTE",
  "MP3",
  "WEBM_OPUS",
];

/**
 * Type guard to check if an object is a valid STTOptions
 */
export function isSTTOptions(value: unknown): value is STTOptions {
  if (!value || typeof value !== "object") {
    return false;
  }

  const opts = value as Record<string, unknown>;

  // Check encoding if present
  if (opts.encoding !== undefined) {
    if (
      typeof opts.encoding !== "string" ||
      !VALID_AUDIO_ENCODINGS.includes(opts.encoding as AudioEncoding)
    ) {
      return false;
    }
  }

  // Check sample rate if present
  if (opts.sampleRateHertz !== undefined) {
    if (typeof opts.sampleRateHertz !== "number" || opts.sampleRateHertz <= 0) {
      return false;
    }
  }

  // Check language code if present
  if (opts.languageCode !== undefined) {
    if (
      typeof opts.languageCode !== "string" ||
      opts.languageCode.length === 0
    ) {
      return false;
    }
  }

  // Check maxAlternatives if present
  if (opts.maxAlternatives !== undefined) {
    if (
      typeof opts.maxAlternatives !== "number" ||
      opts.maxAlternatives < 1 ||
      opts.maxAlternatives > 30
    ) {
      return false;
    }
  }

  // Check model if present
  if (opts.model !== undefined) {
    const validModels: readonly string[] = VALID_STT_MODELS;
    if (typeof opts.model !== "string" || !validModels.includes(opts.model)) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard to check if an object is a valid STTResult
 */
export function isSTTResult(value: unknown): value is STTResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;

  // Required fields
  if (typeof result.text !== "string") {
    return false;
  }

  if (
    typeof result.confidence !== "number" ||
    result.confidence < 0 ||
    result.confidence > 1
  ) {
    return false;
  }

  // Metadata is required
  if (!result.metadata || typeof result.metadata !== "object") {
    return false;
  }

  const metadata = result.metadata as Record<string, unknown>;
  if (typeof metadata.latency !== "number" || metadata.latency < 0) {
    return false;
  }

  if (typeof metadata.provider !== "string") {
    return false;
  }

  return true;
}

/**
 * Type guard to check if an object is a valid WordInfo
 */
export function isWordInfo(value: unknown): value is WordInfo {
  if (!value || typeof value !== "object") {
    return false;
  }

  const word = value as Record<string, unknown>;

  return (
    typeof word.startTime === "number" &&
    typeof word.endTime === "number" &&
    typeof word.word === "string" &&
    word.startTime >= 0 &&
    word.endTime >= word.startTime
  );
}

/**
 * Type guard to check if an object is a valid TranscriptAlternative
 */
export function isTranscriptAlternative(
  value: unknown,
): value is TranscriptAlternative {
  if (!value || typeof value !== "object") {
    return false;
  }

  const alt = value as Record<string, unknown>;

  return (
    typeof alt.transcript === "string" &&
    typeof alt.confidence === "number" &&
    alt.confidence >= 0 &&
    alt.confidence <= 1
  );
}
