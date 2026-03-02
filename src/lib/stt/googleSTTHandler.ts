/**
 * Google Cloud Speech-to-Text v2 Handler
 *
 * Handles audio transcription using Google Cloud Speech-to-Text v2 API.
 * This handler uses recognizers for reusable configuration and supports regional endpoints.
 *
 * **Authentication**: Uses service account credentials via GOOGLE_APPLICATION_CREDENTIALS
 * environment variable. API keys are NOT supported.
 *
 * **API Version**: v2 (with auto-detection, regional support, and recognizers)
 * **Models**: chirp_3
 *
 * **Configuration**:
 * - GOOGLE_CLOUD_PROJECT: GCP project ID (required)
 * - GOOGLE_CLOUD_LOCATION: Region (default: asia-south1)
 * - GOOGLE_STT_RECOGNIZER: Recognizer ID (default: rec1)
 *
 * **Recognizer rec1 Configuration**:
 * - Model: chirp_3
 * - Languages: en-IN, en-US
 * - Encoding: LINEAR16, 8000Hz, mono
 * - Features: Profanity filter enabled, automatic punctuation enabled
 *
 * @module stt/googleSTTHandler
 */

import { v2 } from "@google-cloud/speech";
import type { protos } from "@google-cloud/speech";
import type { STTOptions, STTTranscriptionResult } from "../types/sttTypes.js";
import { logger } from "../utils/logger.js";
import { ErrorFactory } from "../utils/errorHandling.js";

// Use v2 client
const { SpeechClient } = v2;

// Type aliases for v2 API
type RecognitionConfig = protos.google.cloud.speech.v2.IRecognitionConfig;
type RecognizeRequest = protos.google.cloud.speech.v2.IRecognizeRequest;

/**
 * Default configuration for Google Cloud STT v2
 */
const DEFAULT_PROJECT_ID = "ttsapi-485209";
const DEFAULT_LOCATION = "asia-south1";
const DEFAULT_RECOGNIZER = "rec1";

/**
 * Maximum file size for Google Cloud STT v2 inline recognition
 * For files larger than 10MB, use batch recognition with Cloud Storage
 */
const STT_MAX_SIZE_MB = 10;

/**
 * Transcription timeout in milliseconds (60 seconds)
 */
const TRANSCRIPTION_TIMEOUT_MS = 60_000;

/**
 * Check if Google Cloud credentials are available
 *
 * @returns True if GOOGLE_APPLICATION_CREDENTIALS is set
 */
export function hasGoogleCloudCredentials(): boolean {
  return !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

/**
 * Convert stereo WAV audio to mono by averaging left and right channels
 *
 * NOTE: This function is retained for backward compatibility but is no longer
 * strictly required in v2 since auto-detection handles multi-channel audio.
 * However, mono conversion can reduce bandwidth and improve efficiency.
 *
 * @param audioBuffer - Stereo WAV audio buffer
 * @returns Mono WAV audio buffer
 * @throws Error if WAV format is invalid or unsupported
 * @deprecated v2 API auto-detects channels; this is optional optimization
 */
function convertStereoToMono(audioBuffer: Buffer): Buffer {
  // Basic WAV header validation (minimum 44 bytes)
  if (audioBuffer.length < 44) {
    throw ErrorFactory.invalidConfiguration(
      "WAV file header",
      "file too small to contain header (minimum 44 bytes required)",
      { fileSize: audioBuffer.length },
    );
  }

  // Verify RIFF header
  const riffHeader = audioBuffer.toString("ascii", 0, 4);
  if (riffHeader !== "RIFF") {
    throw ErrorFactory.invalidConfiguration(
      "WAV file format",
      "missing RIFF header (not a valid WAV file)",
    );
  }

  // Verify WAVE format
  const waveFormat = audioBuffer.toString("ascii", 8, 12);
  if (waveFormat !== "WAVE") {
    throw ErrorFactory.invalidConfiguration(
      "WAV file format",
      "not a WAVE format file",
    );
  }

  // Read WAV header fields
  const numChannels = audioBuffer.readUInt16LE(22);
  const sampleRate = audioBuffer.readUInt32LE(24);
  const _byteRate = audioBuffer.readUInt32LE(28);
  const _blockAlign = audioBuffer.readUInt16LE(32);
  const bitsPerSample = audioBuffer.readUInt16LE(34);

  // If already mono, return as-is
  if (numChannels === 1) {
    logger.debug("[GoogleSTTHandler] Audio is already mono");
    return audioBuffer;
  }

  // Only handle stereo conversion
  if (numChannels !== 2) {
    throw ErrorFactory.invalidConfiguration(
      "audio channels",
      `unsupported channel count (${numChannels}). Only mono and stereo are supported`,
      { numChannels },
    );
  }

  // Only handle 16-bit PCM for simplicity
  if (bitsPerSample !== 16) {
    throw ErrorFactory.invalidConfiguration(
      "audio bit depth",
      `unsupported bit depth (${bitsPerSample}). Only 16-bit PCM is supported for stereo-to-mono conversion`,
      { bitsPerSample },
    );
  }

  logger.debug("[GoogleSTTHandler] Converting stereo to mono", {
    sampleRate,
    bitsPerSample,
    originalChannels: numChannels,
  });

  // Find data chunk by scanning through all chunks
  // First, read the fmt chunk size to know where to start scanning
  const fmtChunkSize = audioBuffer.readUInt32LE(16);
  let dataOffset = 20 + fmtChunkSize; // Start after "fmt " header (4 bytes) + size (4 bytes) + fmt data
  let dataSize = 0;
  let foundData = false;

  logger.debug(`[GoogleSTTHandler] Starting chunk scan after fmt chunk`, {
    fmtChunkSize,
    scanStartOffset: dataOffset,
  });

  while (dataOffset < audioBuffer.length - 8) {
    const chunkId = audioBuffer.toString("ascii", dataOffset, dataOffset + 4);
    const chunkSize = audioBuffer.readUInt32LE(dataOffset + 4);

    logger.debug(
      `[GoogleSTTHandler] Found chunk: ${chunkId}, size: ${chunkSize} at offset ${dataOffset}`,
    );

    if (chunkId === "data") {
      dataSize = chunkSize;
      dataOffset += 8; // Skip "data" + size header
      foundData = true;
      break;
    }

    // Skip to next chunk (chunkId + size + data)
    dataOffset += 8 + chunkSize;

    // Align to even boundary (WAV chunks are word-aligned)
    if (chunkSize % 2 !== 0) {
      dataOffset += 1;
    }
  }

  if (!foundData || dataOffset >= audioBuffer.length) {
    throw ErrorFactory.invalidConfiguration(
      "WAV file structure",
      "data chunk not found in file",
    );
  }

  // Calculate sizes
  const stereoData = audioBuffer.subarray(dataOffset);
  const actualDataSize = Math.min(dataSize, stereoData.length);
  const numSamples = Math.floor(actualDataSize / 4); // 2 bytes per sample * 2 channels
  const monoDataSize = numSamples * 2; // 2 bytes per sample * 1 channel

  logger.debug(`[GoogleSTTHandler] Processing audio data`, {
    dataOffset,
    dataSize,
    numSamples,
    monoDataSize,
  });

  // Create mono audio data by averaging left and right channels
  const monoData = Buffer.alloc(monoDataSize);
  for (let i = 0; i < numSamples; i++) {
    const leftSample = stereoData.readInt16LE(i * 4); // Left channel
    const rightSample = stereoData.readInt16LE(i * 4 + 2); // Right channel
    const monoSample = Math.round((leftSample + rightSample) / 2);
    monoData.writeInt16LE(monoSample, i * 2);
  }

  // Create new WAV header for mono audio
  const monoHeader = Buffer.alloc(44);

  // RIFF header
  monoHeader.write("RIFF", 0);
  monoHeader.writeUInt32LE(36 + monoDataSize, 4); // File size - 8
  monoHeader.write("WAVE", 8);

  // fmt chunk
  monoHeader.write("fmt ", 12);
  monoHeader.writeUInt32LE(16, 16); // fmt chunk size
  monoHeader.writeUInt16LE(1, 20); // Audio format (PCM)
  monoHeader.writeUInt16LE(1, 22); // Num channels (MONO)
  monoHeader.writeUInt32LE(sampleRate, 24); // Sample rate
  monoHeader.writeUInt32LE(sampleRate * 2, 28); // Byte rate (sampleRate * 1 channel * 2 bytes)
  monoHeader.writeUInt16LE(2, 32); // Block align (1 channel * 2 bytes)
  monoHeader.writeUInt16LE(16, 34); // Bits per sample

  // data chunk header
  monoHeader.write("data", 36);
  monoHeader.writeUInt32LE(monoDataSize, 40);

  // Combine header and data
  const monoBuffer = Buffer.concat([monoHeader, monoData]);

  logger.debug("[GoogleSTTHandler] Stereo-to-mono conversion completed", {
    originalSize: audioBuffer.length,
    monoSize: monoBuffer.length,
    reduction: `${((1 - monoBuffer.length / audioBuffer.length) * 100).toFixed(1)}%`,
  });

  return monoBuffer;
}

/**
 * Transcribe audio using Google Cloud Speech-to-Text v2 API
 *
 * **Authentication**: Requires GOOGLE_APPLICATION_CREDENTIALS environment variable
 * pointing to a service account JSON key file with roles/speech.client permission.
 *
 * **Supported Models (v2)**:
 * - `long`: Optimized for long-form audio (replaces latest_long)
 * - `short`: Optimized for short audio (replaces latest_short)
 * - `chirp`: Latest Chirp model (v2 only)
 * - `chirp_2`: Chirp 2.0 model (v2 only)
 * - `chirp_3`: Chirp 3.0 model (v2 only, latest)
 *
 * **Recognizer Configuration**: When using a pre-configured recognizer (default: rec1),
 * the recognizer's default configuration is used. The `rec1` recognizer has:
 * - Model: chirp_3
 * - Languages: en-IN, en-US
 * - Explicit decoding: LINEAR16, 8000Hz, mono
 * - Profanity filter and automatic punctuation enabled
 *
 * **Regional Endpoint**: Uses {location} from environment (default: asia-south1)
 * **Recognizer**: Uses pre-configured recognizer from environment (default: rec1)
 *
 * @param audioBuffer - Audio file content as Buffer
 * @param sttOptions - STT configuration options
 * @returns Transcription result with transcript text
 * @throws Error if authentication fails or API call fails
 *
 * @example Basic transcription
 * ```typescript
 * const result = await transcribe(audioBuffer, {
 *   language: "en-IN",
 *   model: "long"
 * });
 * console.log(result.transcript);
 * ```
 *
 * @example Advanced transcription
 * ```typescript
 * const result = await transcribe(audioBuffer, {
 *   language: "hi-IN",
 *   model: "chirp_2",
 *   enableAutomaticPunctuation: true,
 *   profanityFilter: false
 * });
 * ```
 */
export async function transcribe(
  audioBuffer: Buffer,
  sttOptions: STTOptions,
): Promise<STTTranscriptionResult> {
  logger.info("[GOOGLE-STT-CHECKPOINT-1] transcribe() function called", {
    bufferSize: audioBuffer?.length || 0,
    sttOptions,
  });

  // Validate audio buffer
  if (!audioBuffer || audioBuffer.length === 0) {
    logger.error(
      "[GOOGLE-STT-CHECKPOINT-2] Audio buffer validation failed - buffer is empty",
    );
    throw ErrorFactory.invalidConfiguration(
      "audio buffer",
      "buffer is empty or invalid",
    );
  }

  logger.info("[GOOGLE-STT-CHECKPOINT-3] Audio buffer validated");

  // Check file size (10MB limit for inline recognition)
  const fileSizeMB = audioBuffer.length / (1024 * 1024);
  if (fileSizeMB > STT_MAX_SIZE_MB) {
    logger.error("[GOOGLE-STT-CHECKPOINT-4] File size validation failed", {
      fileSizeMB: fileSizeMB.toFixed(2),
      maxSizeMB: STT_MAX_SIZE_MB,
    });
    throw ErrorFactory.invalidConfiguration(
      "audio file size",
      `file too large (${fileSizeMB.toFixed(2)}MB). Maximum ${STT_MAX_SIZE_MB}MB for inline recognition. Use Google Cloud Storage with async recognition for larger files`,
      { fileSizeMB: fileSizeMB.toFixed(2), maxSizeMB: STT_MAX_SIZE_MB },
    );
  }

  logger.info("[GOOGLE-STT-CHECKPOINT-5] File size validated", {
    fileSizeMB: fileSizeMB.toFixed(2),
  });

  logger.debug("[GoogleSTTHandler] Starting transcription", {
    audioSizeMB: fileSizeMB.toFixed(2),
    language: sttOptions.language || "en-IN",
    model: sttOptions.model || "default",
  });

  try {
    logger.info(
      "[GOOGLE-STT-CHECKPOINT-6] Entering try block for transcription (v2 API)",
    );

    // v2 API auto-detects encoding, sample rate, and channels
    // Optional: Convert stereo to mono for bandwidth optimization
    let processedAudioBuffer = audioBuffer;
    const isWavFile = audioBuffer.toString("ascii", 0, 4) === "RIFF";

    logger.info("[GOOGLE-STT-CHECKPOINT-7] Checking audio format", {
      isWavFile,
      header: audioBuffer.toString("ascii", 0, 4),
    });

    // Optional optimization: Convert stereo to mono to reduce bandwidth
    if (isWavFile) {
      try {
        logger.debug(
          "[GOOGLE-STT-CHECKPOINT-8] Detected WAV file, attempting stereo-to-mono conversion for optimization",
        );
        processedAudioBuffer = convertStereoToMono(audioBuffer);
        logger.debug(
          "[GOOGLE-STT-CHECKPOINT-9] Conversion successful or file already mono",
        );
      } catch (conversionError) {
        // v2 auto-handles stereo, so conversion failure is non-fatal
        logger.warn(
          "[GoogleSTTHandler] Stereo-to-mono conversion failed, using original (v2 will auto-detect)",
          {
            error:
              conversionError instanceof Error
                ? conversionError.message
                : String(conversionError),
          },
        );
        processedAudioBuffer = audioBuffer; // Use original
      }
    } else {
      logger.debug(
        "[GOOGLE-STT-CHECKPOINT-10] Non-WAV audio format detected, v2 API will auto-detect encoding",
      );
    }

    logger.info(
      "[GOOGLE-STT-CHECKPOINT-11] Initializing Google Speech Client (v2)",
      {
        GOOGLE_APPLICATION_CREDENTIALS:
          process.env.GOOGLE_APPLICATION_CREDENTIALS,
        projectId: "ttsapi-485209",
        location: DEFAULT_LOCATION,
      },
    );

    // Initialize SpeechClient v2 with regional endpoint
    // The v2 API is accessed through the same SpeechClient but uses v2-specific methods
    const client = new SpeechClient({
      apiEndpoint: `${DEFAULT_LOCATION}-speech.googleapis.com`,
    });

    logger.info(
      "[GOOGLE-STT-CHECKPOINT-12] Speech client initialized successfully (v2 regional endpoint)",
      { apiEndpoint: `${DEFAULT_LOCATION}-speech.googleapis.com` },
    );

    // Build v2 recognition config
    // Note: rec1 recognizer has full explicit configuration (chirp_3, LINEAR16, 8000Hz, mono,
    // en-IN/en-US, profanity filter + auto punctuation enabled)
    // We build a minimal config and only override specific settings if user provides them
    logger.info("[GOOGLE-STT-CHECKPOINT-13] Building v2 recognition config");

    // Start with minimal config - let recognizer handle defaults
    const config: RecognitionConfig = {};

    // Override language codes if provided (recognizer has en-IN and en-US)
    if (sttOptions.language) {
      config.languageCodes = [sttOptions.language];
    }

    // Override model if provided (recognizer has chirp_3)
    if (sttOptions.model) {
      config.model = sttOptions.model;
    }

    // Override features if explicitly provided (recognizer has profanity filter + auto punctuation enabled)
    if (
      sttOptions.enableAutomaticPunctuation !== undefined ||
      sttOptions.profanityFilter !== undefined
    ) {
      config.features = {
        enableAutomaticPunctuation:
          sttOptions.enableAutomaticPunctuation ?? true,
        profanityFilter: sttOptions.profanityFilter ?? true,
      };
    }

    logger.info("[GOOGLE-STT-CHECKPOINT-21] v2 config created", {
      usingRecognizerDefaults: "chirp_3, LINEAR16, 8000Hz, mono, en-IN/en-US",
      languageOverride: config.languageCodes?.[0],
      modelOverride: config.model,
      featuresOverride: config.features,
    });

    // Build recognizer path (uses pre-configured recognizer)
    const recognizerPath = `projects/${DEFAULT_PROJECT_ID}/locations/${DEFAULT_LOCATION}/recognizers/${DEFAULT_RECOGNIZER}`;

    logger.info("[GOOGLE-STT-CHECKPOINT-23] Using recognizer path", {
      recognizerPath,
    });

    // Build v2 request
    logger.info("[GOOGLE-STT-CHECKPOINT-26] Building v2 API request");
    const request: RecognizeRequest = {
      recognizer: recognizerPath,
      config,
      content: processedAudioBuffer.toString("base64"), // v2 accepts Buffer directly
    };

    logger.debug("[GoogleSTTHandler] Calling Google Cloud STT v2 API", {
      recognizer: recognizerPath,
      configModel: config.model,
      configLanguages: config.languageCodes,
      audioLength: processedAudioBuffer.length,
    });

    // Call recognize with timeout using v2 API method
    logger.info(
      "[GOOGLE-STT-CHECKPOINT-28] Calling client.recognize() with timeout (v2)",
      {
        timeoutMs: TRANSCRIPTION_TIMEOUT_MS,
      },
    );

    const recognizePromise = client.recognize(request);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        logger.error(
          "[GOOGLE-STT-CHECKPOINT-29] Transcription timeout reached",
        );
        reject(
          ErrorFactory.toolTimeout(
            "GoogleSTTHandler.transcribe",
            TRANSCRIPTION_TIMEOUT_MS,
          ),
        );
      }, TRANSCRIPTION_TIMEOUT_MS),
    );

    const [response] = await Promise.race([recognizePromise, timeoutPromise]);
    logger.info(
      "[GOOGLE-STT-CHECKPOINT-30] Google Cloud STT API call completed",
    );

    // Extract transcript from results
    const transcript =
      response.results
        ?.map((r) => r.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join(" ") || "";

    const confidence = response.results?.[0]?.alternatives?.[0]?.confidence;

    if (!transcript || transcript.trim().length === 0) {
      logger.warn(
        "[GOOGLE-STT-CHECKPOINT-34] Speech-to-Text returned no results (empty audio or unrecognizable speech)",
      );
      return {
        transcript: "",
        confidence: 0,
      };
    }

    logger.info(
      "[GOOGLE-STT-CHECKPOINT-35] Transcription completed successfully",
      {
        transcriptLength: transcript.length,
        confidence: confidence ?? "N/A",
      },
    );

    logger.debug("[GoogleSTTHandler] Transcription completed", {
      transcriptLength: transcript.length,
      confidence: confidence ?? "N/A",
    });

    return {
      transcript: transcript.trim(),
      confidence: confidence ?? undefined, // Convert null to undefined
    };
  } catch (error) {
    logger.error(
      "[GOOGLE-STT-CHECKPOINT-36] Error caught in transcribe function",
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    );

    // Enhanced error handling with specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for authentication errors
    if (
      errorMessage.includes("authentication") ||
      errorMessage.includes("credentials") ||
      errorMessage.includes("GOOGLE_APPLICATION_CREDENTIALS")
    ) {
      logger.error("[GOOGLE-STT-CHECKPOINT-37] Authentication error detected");
      throw ErrorFactory.missingConfiguration(
        "GOOGLE_APPLICATION_CREDENTIALS",
        {
          message:
            "Google Cloud STT authentication failed. Set GOOGLE_APPLICATION_CREDENTIALS to a valid service account JSON key file with roles/speech.client permission",
          errorDetails: errorMessage,
        },
      );
    }

    // Check for quota/permission errors
    if (errorMessage.includes("quota") || errorMessage.includes("permission")) {
      logger.error(
        "[GOOGLE-STT-CHECKPOINT-38] Quota or permission error detected",
      );
      throw ErrorFactory.invalidConfiguration(
        "Google Cloud STT API access",
        `${errorMessage}. Check your API quota and IAM permissions (roles/speech.client required)`,
        { errorDetails: errorMessage },
      );
    }

    // Re-throw with context
    logger.error("[GOOGLE-STT-CHECKPOINT-39] Re-throwing error with context");
    throw ErrorFactory.toolExecutionFailed(
      "GoogleSTTHandler.transcribe",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * Validate STT options before processing (v2 API)
 *
 * @param sttOptions - STT options to validate
 * @throws Error if options are invalid
 */
export function validateSTTOptions(sttOptions: STTOptions): void {
  // Validate model (v2 models)
  if (sttOptions.model) {
    const validModels = [
      "long", // Replaces latest_long
      "short", // Replaces latest_short
      "chirp", // v2 Chirp model
      "chirp_2", // v2 Chirp 2.0
      "chirp_3", // v2 Chirp 3.0 (latest)
    ];
    if (!validModels.includes(sttOptions.model)) {
      throw ErrorFactory.invalidConfiguration(
        "STT model",
        `invalid v2 model (${sttOptions.model}). Valid models: ${validModels.join(", ")}`,
        { model: sttOptions.model, validModels },
      );
    }
  }

  // Validate language code format (basic check)
  if (sttOptions.language) {
    const langPattern = /^[a-z]{2}(-[A-Z]{2})?$/;
    if (!langPattern.test(sttOptions.language)) {
      throw ErrorFactory.invalidConfiguration(
        "language code",
        `invalid format (${sttOptions.language}). Expected format: "en-US", "hi-IN", etc. (BCP-47)`,
        { language: sttOptions.language },
      );
    }
  }

  // Note: sampleRateHertz is auto-detected in v2, validation not strictly required
  if (sttOptions.sampleRateHertz) {
    logger.warn(
      "[GoogleSTTHandler] sampleRateHertz is auto-detected in v2 API, provided value will be ignored",
      { sampleRateHertz: sttOptions.sampleRateHertz },
    );
  }
}
