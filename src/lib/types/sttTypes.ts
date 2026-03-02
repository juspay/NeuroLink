/**
 * Speech-to-Text (STT) Types for NeuroLink
 *
 * Type definitions for Google Cloud Speech-to-Text v1 integration.
 * STT is implemented as a native input modality, not as a provider.
 *
 * @module types/sttTypes
 */

/**
 * Google Cloud Speech-to-Text v1 model types
 *
 * @see https://cloud.google.com/speech-to-text/docs/reference/rest/v1/RecognitionConfig#model
 */
export type STTModel =
  | "long" // Optimized for long-form audio (replaces v1 latest_long)
  | "short" // Optimized for short audio (replaces v1 latest_short)
  | "chirp" // Latest Chirp model
  | "chirp_2" // Chirp 2.0 model
  | "chirp_3"; // Chirp 3.0 model (latest, recommended)

/**
 * Speech-to-Text configuration options
 *
 * Used within GenerateOptions to enable audio transcription via Google Cloud STT v1.
 *
 * @example Basic usage
 * ```typescript
 * const result = await neurolink.generate({
 *   input: { text: "Summarize this", files: ["meeting.mp3"] },
 *   provider: "google-ai",
 *   sttOptions: {
 *     language: "en-IN",
 *     model: "default"
 *   }
 * });
 * ```
 *
 * @example Advanced usage
 * ```typescript
 * const result = await neurolink.generate({
 *   input: { text: "Transcribe", files: ["audio.wav"] },
 *   provider: "vertex",
 *   sttOptions: {
 *     language: "hi-IN",
 *     model: "latest_long",
 *     enableAutomaticPunctuation: true,
 *     profanityFilter: false,
 *     sampleRateHertz: 16000
 *   }
 * });
 * ```
 */
export type STTOptions = {
  /**
   * Language code (BCP-47 format)
   *
   * Examples: "en-US", "en-IN", "hi-IN", "es-ES"
   *
   * @default "en-IN"
   * @see https://cloud.google.com/speech-to-text/docs/languages
   */
  language?: string;

  /**
   * STT model to use
   *
   * If not specified, the recognizer's default model is used (chirp_3 for rec1).
   *
   * @default undefined (uses recognizer default: chirp_3)
   */
  model?: STTModel;

  /**
   * Enable automatic punctuation in transcript
   *
   * @default true
   */
  enableAutomaticPunctuation?: boolean;

  /**
   * Filter profanity in transcript
   *
   * @default false
   */
  profanityFilter?: boolean;

  /**
   * Sample rate of audio in Hertz
   *
   * Optional override. If not provided, Google Cloud STT will auto-detect.
   *
   * @example 16000 // 16kHz (common for phone calls)
   * @example 44100 // 44.1kHz (CD quality)
   */
  sampleRateHertz?: number;

  /**
   * Whether to use AI to process the transcribed text
   *
   * - `true` (default): Inject transcript into prompt → AI generates response
   * - `false`: Skip AI processing → Return raw transcript directly
   *
   * @default true
   *
   * @example Direct transcription (useAIResponse: false)
   * ```typescript
   * const result = await neurolink.generate({
   *   input: { text: "", files: ["meeting.mp3"] },
   *   sttOptions: { useAIResponse: false }
   * });
   * console.log(result.content); // Raw transcript
   * ```
   *
   * @example AI-powered summary (useAIResponse: true, default)
   * ```typescript
   * const result = await neurolink.generate({
   *   input: { text: "Summarize this", files: ["meeting.mp3"] },
   *   sttOptions: { useAIResponse: true }
   * });
   * console.log(result.content); // AI summary of transcript
   * ```
   */
  useAIResponse?: boolean;
};

/**
 * STT transcription result
 *
 * Internal type returned by GoogleSTTHandler.
 */
export type STTTranscriptionResult = {
  /**
   * Transcribed text
   */
  transcript: string;

  /**
   * Confidence score (0-1) if available
   */
  confidence?: number;
};
