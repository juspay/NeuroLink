/**
 * Google Cloud Speech-to-Text Handler
 *
 * Handler for Google Cloud Speech-to-Text API integration.
 * Mirrors the architecture of GoogleTTSHandler.
 *
 * @module adapters/stt/googleSTTHandler
 * @see https://cloud.google.com/speech-to-text/docs
 */
import { SpeechClient, protos } from "@google-cloud/speech";
import { STTError, STT_ERROR_CODES } from "../../utils/sttProcessor.js";
import type { STTHandler } from "../../utils/sttProcessor.js";
import type {
  STTOptions,
  STTResult,
  AudioEncoding,
  WordInfo,
  TranscriptAlternative,
} from "../../types/sttTypes.js";
import { ErrorCategory, ErrorSeverity } from "../../constants/enums.js";
import { logger } from "../../utils/logger.js";
import { withTimeout } from "../../utils/timeout.js";

export class GoogleSTTHandler implements STTHandler {
  private client: SpeechClient | null = null;

  // Google Cloud Speech-to-Text limits
  private static readonly DEFAULT_MAX_AUDIO_SIZE_MB = 10;
  private static readonly DEFAULT_MAX_DURATION_SECONDS = 60; // Synchronous API limit
  private static readonly DEFAULT_API_TIMEOUT_MS = 60000; // 60 seconds

  public readonly maxAudioSizeMB: number =
    GoogleSTTHandler.DEFAULT_MAX_AUDIO_SIZE_MB;
  public readonly maxDurationSeconds: number =
    GoogleSTTHandler.DEFAULT_MAX_DURATION_SECONDS;

  constructor(credentialsPath?: string) {
    try {
      const options = credentialsPath ? { keyFilename: credentialsPath } : {}; // Uses GOOGLE_APPLICATION_CREDENTIALS env var

      this.client = new SpeechClient(options);
      logger.info(
        "[GoogleSTTHandler] Initialized Google Speech-to-Text client",
      );
    } catch (err) {
      logger.warn(
        `[GoogleSTTHandler] Failed to initialize: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      this.client = null;
    }
  }

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Get available models for Google Cloud Speech-to-Text
   *
   * @returns List of available model identifiers
   */
  async getModels(): Promise<string[]> {
    return [
      "default", // General model for most use cases
      "command_and_search", // Short queries and commands
      "phone_call", // Audio from phone calls
      "video", // Audio from video files
      "medical_dictation", // Medical terminology
      "latest_long", // Latest model for long audio
      "latest_short", // Latest model for short audio
    ];
  }

  /**
   * Transcribe audio to text using Google Cloud Speech-to-Text API
   *
   * @param audio - Audio buffer to transcribe
   * @param options - STT configuration options
   * @returns Transcription result with metadata
   */
  async transcribe(audio: Buffer, options: STTOptions): Promise<STTResult> {
    if (!this.client) {
      throw new STTError({
        code: STT_ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        message:
          "Google Cloud Speech-to-Text client not initialized. Set GOOGLE_APPLICATION_CREDENTIALS or pass credentials path.",
        category: ErrorCategory.CONFIGURATION,
        severity: ErrorSeverity.HIGH,
        retriable: false,
      });
    }

    const startTime = Date.now();

    try {
      // Map the encoding first to determine if we need sampleRateHertz
      const encoding = options.encoding || "MP3";
      const mappedEncoding = this.mapAudioEncoding(encoding);

      // Self-describing formats auto-detect sample rate, non-self-describing formats require it
      const selfDescribingFormats: AudioEncoding[] = [
        "MP3",
        "FLAC",
        "OGG_OPUS",
        "WEBM_OPUS",
      ];
      const isSelfDescribing = selfDescribingFormats.includes(encoding);

      // Build the request
      const request = {
        audio: {
          content: audio.toString("base64"),
        },
        config: {
          encoding: mappedEncoding,
          // For MP3 files and not self-describing formats, Google Cloud Speech-to-Text works better with explicit sample rate
          ...((!isSelfDescribing ||
            options.sampleRateHertz ||
            encoding === "MP3") && {
            sampleRateHertz:
              options.sampleRateHertz || (encoding === "MP3" ? 44100 : 16000),
          }),
          languageCode: options.languageCode || "en-US",
          alternativeLanguageCodes: options.alternativeLanguageCodes,
          maxAlternatives: options.maxAlternatives || 1,
          profanityFilter: options.profanityFilter ?? false,
          enableAutomaticPunctuation:
            options.enableAutomaticPunctuation ?? true,
          enableWordTimeOffsets: options.enableWordTimeOffsets ?? false,
          enableWordConfidence: options.enableWordConfidence ?? false,
          speechContexts: options.speechContexts,
          audioChannelCount: options.audioChannelCount || 1,
          model: options.model || "default",
          useEnhanced: options.useEnhanced ?? false,
          ...(options.enableSpeakerDiarization && {
            diarizationConfig: {
              enableSpeakerDiarization: true,
              minSpeakerCount: options.diarizationSpeakerCount || 2,
              maxSpeakerCount: options.diarizationSpeakerCount || 6,
            },
          }),
        },
      };

      // Call Google Speech-to-Text API
      const [response] = await withTimeout(
        this.client.recognize(request, {
          timeout: GoogleSTTHandler.DEFAULT_API_TIMEOUT_MS,
        }),
        GoogleSTTHandler.DEFAULT_API_TIMEOUT_MS,
        "google-ai",
        "generate",
      );

      if (!response.results || response.results.length === 0) {
        throw new STTError({
          code: STT_ERROR_CODES.TRANSCRIPTION_FAILED,
          message: "Google Speech-to-Text returned no results",
          category: ErrorCategory.EXECUTION,
          severity: ErrorSeverity.HIGH,
          retriable: true,
        });
      }

      // Aggregate all segments from response.results
      const aggregatedTranscripts: string[] = [];
      const aggregatedWords: WordInfo[] = [];
      const aggregatedAlternatives: TranscriptAlternative[] = [];
      let aggregatedConfidence = 0;
      let confidenceCount = 0;
      let detectedLanguageCode: string | undefined;

      // Iterate over all results to aggregate full response
      for (const result of response.results) {
        const primaryAlternative = result.alternatives?.[0];

        if (!primaryAlternative?.transcript) {
          continue; // Skip empty segments
        }

        // Aggregate transcript text
        aggregatedTranscripts.push(primaryAlternative.transcript);

        // Aggregate confidence (compute weighted average)
        if (
          primaryAlternative.confidence !== null &&
          primaryAlternative.confidence !== undefined
        ) {
          aggregatedConfidence += primaryAlternative.confidence;
          confidenceCount++;
        }

        // Use language code from first result that has it
        if (!detectedLanguageCode && result.languageCode) {
          detectedLanguageCode = result.languageCode;
        }

        // Aggregate word-level information
        if (primaryAlternative.words) {
          primaryAlternative.words.forEach(
            (w: protos.google.cloud.speech.v1.IWordInfo) => {
              aggregatedWords.push({
                word: w.word || "",
                startTime: this.convertDurationToSeconds(w.startTime),
                endTime: this.convertDurationToSeconds(w.endTime),
                confidence:
                  w.confidence !== null && w.confidence !== undefined
                    ? w.confidence
                    : undefined,
                speakerTag:
                  w.speakerTag !== null && w.speakerTag !== undefined
                    ? w.speakerTag
                    : undefined,
              });
            },
          );
        }

        // Aggregate alternatives from each segment
        if (result.alternatives && result.alternatives.length > 1) {
          result.alternatives
            .slice(1)
            .forEach(
              (
                alt: protos.google.cloud.speech.v1.ISpeechRecognitionAlternative,
              ) => {
                aggregatedAlternatives.push({
                  transcript: alt.transcript || "",
                  confidence: alt.confidence || 0,
                  words: alt.words?.map(
                    (w: protos.google.cloud.speech.v1.IWordInfo) => ({
                      word: w.word || "",
                      startTime: this.convertDurationToSeconds(w.startTime),
                      endTime: this.convertDurationToSeconds(w.endTime),
                      confidence:
                        w.confidence !== null && w.confidence !== undefined
                          ? w.confidence
                          : undefined,
                      speakerTag:
                        w.speakerTag !== null && w.speakerTag !== undefined
                          ? w.speakerTag
                          : undefined,
                    }),
                  ),
                });
              },
            );
        }
      }

      // Validate that we have at least some transcript
      if (aggregatedTranscripts.length === 0) {
        throw new STTError({
          code: STT_ERROR_CODES.TRANSCRIPTION_FAILED,
          message: "Google Speech-to-Text returned empty transcript",
          category: ErrorCategory.EXECUTION,
          severity: ErrorSeverity.HIGH,
          retriable: true,
        });
      }

      const latency = Date.now() - startTime;

      // Combine all transcript segments with spaces
      const fullTranscript = aggregatedTranscripts.join(" ");

      // Compute average confidence
      const averageConfidence =
        confidenceCount > 0 ? aggregatedConfidence / confidenceCount : 0;

      // Calculate duration from aggregated words if available
      const duration =
        aggregatedWords.length > 0
          ? aggregatedWords[aggregatedWords.length - 1].endTime
          : undefined;

      logger.info(
        `[GoogleSTTHandler] Transcribed ${audio.length} bytes in ${latency}ms (${response.results.length} segments)`,
      );

      return {
        text: fullTranscript,
        confidence: averageConfidence,
        languageCode: detectedLanguageCode || options.languageCode,
        words: aggregatedWords.length > 0 ? aggregatedWords : undefined,
        alternatives:
          aggregatedAlternatives.length > 0
            ? aggregatedAlternatives
            : undefined,
        duration,
        metadata: {
          latency,
          provider: "google-ai",
          model: options.model || "default",
          billedSeconds: Math.ceil(duration || 0),
        },
      };
    } catch (err) {
      if (err instanceof STTError) {
        throw err;
      }

      const latency = Date.now() - startTime;
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new STTError({
        code: STT_ERROR_CODES.TRANSCRIPTION_FAILED,
        message: `Google Speech-to-Text failed after ${latency}ms: ${message}`,
        category: ErrorCategory.EXECUTION,
        severity: ErrorSeverity.HIGH,
        retriable: true,
        context: { latency },
        originalError: err instanceof Error ? err : undefined,
      });
    }
  }

  /**
   * Convert protobuf Duration to seconds
   *
   * @param duration - Protobuf duration object with seconds and nanos
   * @returns Total duration in seconds as a number
   */
  private convertDurationToSeconds(
    duration?: protos.google.protobuf.IDuration | null,
  ): number {
    if (!duration) {
      return 0;
    }

    const seconds = duration.seconds ?? null;
    const nanos = duration.nanos ?? 0;

    // Handle seconds as string, number, or Long (from protobuf)
    let secondsValue = 0;
    if (typeof seconds === "string") {
      secondsValue = parseFloat(seconds);
    } else if (typeof seconds === "number") {
      secondsValue = seconds;
    } else if (
      seconds &&
      typeof seconds === "object" &&
      "toNumber" in seconds
    ) {
      // Handle Long type from protobuf
      secondsValue = (seconds as { toNumber: () => number }).toNumber();
    }

    return secondsValue + nanos / 1e9;
  }

  /**
   * Map generic audio encoding to Google Cloud encoding enum
   * Uses proto enum values directly to avoid fragile hardcoded integers
   */
  private mapAudioEncoding(
    encoding: AudioEncoding,
  ): protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding {
    const AudioEncodingEnum =
      protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;

    const encodingMap: Record<
      AudioEncoding,
      protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding
    > = {
      LINEAR16: AudioEncodingEnum.LINEAR16,
      FLAC: AudioEncodingEnum.FLAC,
      MULAW: AudioEncodingEnum.MULAW,
      AMR: AudioEncodingEnum.AMR,
      AMR_WB: AudioEncodingEnum.AMR_WB,
      OGG_OPUS: AudioEncodingEnum.OGG_OPUS,
      SPEEX_WITH_HEADER_BYTE: AudioEncodingEnum.SPEEX_WITH_HEADER_BYTE,
      MP3: AudioEncodingEnum.MP3,
      WEBM_OPUS: AudioEncodingEnum.WEBM_OPUS,
    };

    const googleEncoding = encodingMap[encoding];
    if (!googleEncoding) {
      throw new STTError({
        code: STT_ERROR_CODES.INVALID_ENCODING,
        message: `Unsupported audio encoding: ${encoding}`,
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        retriable: false,
        context: { encoding },
      });
    }

    return googleEncoding;
  }
}
