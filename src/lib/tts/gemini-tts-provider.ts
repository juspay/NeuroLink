/**
 * Google Cloud Text-to-Speech Provider
 * Integrates with Google Cloud Text-to-Speech API
 */

import type {
  TTSInput,
  TTSResponse,
  TTSConfig,
  AudioEncoding,
  GoogleAudioEncoding,
  GoogleTTSRequest,
  GoogleTTSResponse,
  GoogleVoice,
  GoogleVoicesResponse,
} from "../types/tts.js";
import { TTSError } from "../types/tts.js";
import { NETWORK_TIMEOUTS } from "../constants/timeouts.js";

/**
 * Safely extract error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

export class GeminiTTSProvider {
  private apiKey: string;
  private synthesizeUrl: string;
  private voicesUrl: string;

  constructor(config: TTSConfig) {
    this.apiKey = config.apiKey;

    if (!this.apiKey) {
      throw new TTSError(
        "Google API key is required for TTS",
        "MISSING_API_KEY",
      );
    }

    // Validate and set API URLs with security checks to prevent SSRF
    const defaultSynthesizeUrl =
      "https://texttospeech.googleapis.com/v1/text:synthesize";
    const defaultVoicesUrl = "https://texttospeech.googleapis.com/v1/voices";

    this.synthesizeUrl = this.validateApiUrl(
      process.env.GOOGLE_TTS_SYNTHESIZE_URL || defaultSynthesizeUrl,
      "GOOGLE_TTS_SYNTHESIZE_URL",
    );
    this.voicesUrl = this.validateApiUrl(
      process.env.GOOGLE_TTS_VOICES_URL || defaultVoicesUrl,
      "GOOGLE_TTS_VOICES_URL",
    );
  }

  /**
   * Generate audio from text using Google Text-to-Speech API
   */
  async generateAudio(input: TTSInput): Promise<TTSResponse> {
    const startTime = Date.now();

    try {
      // Validate input parameters
      this.validateInput(input);

      // Prepare the request payload
      const requestBody: GoogleTTSRequest = {
        input: {
          text: input.text,
        },
        voice: {
          languageCode: input.languageCode,
          name: input.voiceName,
        },
        audioConfig: {
          audioEncoding: this.mapAudioEncoding(input.audioEncoding || "MP3"),
          speakingRate: input.speakingRate ?? 1.0,
          pitch: input.pitch ?? 0.0,
        },
      };

      // Make API request to Google TTS with secure header-based authentication and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        NETWORK_TIMEOUTS.REQUEST_MS,
      );

      let response: Response;
      try {
        response = await fetch(this.synthesizeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new TTSError(
          `Google TTS API error: ${response.status} - ${errorData}`,
          "API_ERROR",
        );
      }

      const data: GoogleTTSResponse = await response.json();

      if (!data.audioContent) {
        throw new TTSError(
          "No audio content received from Google TTS API",
          "EMPTY_RESPONSE",
        );
      }

      // Decode base64 audio content to buffer
      const audioBuffer = Buffer.from(data.audioContent, "base64");
      const generationTime = Date.now() - startTime;
      // Return user-facing encoding, not Google's internal format
      const encoding: AudioEncoding = input.audioEncoding || "MP3";

      const ttsResponse: TTSResponse = {
        audioBuffer,
        audioSize: audioBuffer.length,
        generationTime,
        wasPlayed: false,
        encoding,
      };

      return ttsResponse;
    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new TTSError(
          `Google TTS request timed out after ${NETWORK_TIMEOUTS.REQUEST_MS}ms`,
          "GENERATION_FAILED",
          error,
        );
      }

      if (error instanceof TTSError) {
        throw error;
      }

      throw new TTSError(
        `Failed to generate TTS audio: ${getErrorMessage(error)}`,
        "GENERATION_FAILED",
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Validate API URL to prevent SSRF attacks
   * Ensures URL uses HTTPS and points to allowed Google domains
   */
  private validateApiUrl(url: string, envVarName: string): string {
    try {
      const parsed = new URL(url);

      // Security check: Must use HTTPS protocol
      if (parsed.protocol !== "https:") {
        throw new TTSError(
          `${envVarName} must use HTTPS protocol, got: ${parsed.protocol}`,
          "INVALID_URL_PROTOCOL",
        );
      }

      // Security check: Whitelist only specific Google API domains
      // No wildcard - explicit hosts only for security
      const allowedHosts = [
        "texttospeech.googleapis.com",
        "speech.googleapis.com",
        "tts.googleapis.com",
      ];

      const isAllowedHost = allowedHosts.includes(parsed.hostname);

      if (!isAllowedHost) {
        throw new TTSError(
          `${envVarName} must point to an allowed Google TTS domain (${allowedHosts.join(", ")}), got: ${parsed.hostname}`,
          "INVALID_URL_HOST",
        );
      }

      return url;
    } catch (error) {
      if (error instanceof TTSError) {
        throw error;
      }

      throw new TTSError(
        `Invalid URL format in ${envVarName}: ${getErrorMessage(error)}`,
        "INVALID_URL_FORMAT",
      );
    }
  }

  /**
   * Validate TTS input parameters
   */
  private validateInput(input: TTSInput): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new TTSError("Text is required for TTS generation", "INVALID_TEXT");
    }

    const textBytes = new TextEncoder().encode(input.text).length;
    if (textBytes > 5000) {
      throw new TTSError("Text is too long (max 5000 bytes)", "TEXT_TOO_LONG");
    }

    if (!input.languageCode) {
      throw new TTSError("Language code is required", "MISSING_LANGUAGE_CODE");
    }

    if (!input.voiceName) {
      throw new TTSError("Voice name is required", "MISSING_VOICE_NAME");
    }

    if (
      typeof input.speakingRate === "number" &&
      (!Number.isFinite(input.speakingRate) ||
        input.speakingRate < 0.25 ||
        input.speakingRate > 4.0)
    ) {
      throw new TTSError(
        "Speaking rate must be a finite number between 0.25 and 4.0",
        "INVALID_SPEAKING_RATE",
      );
    }

    if (
      typeof input.pitch === "number" &&
      (!Number.isFinite(input.pitch) ||
        input.pitch < -20.0 ||
        input.pitch > 20.0)
    ) {
      throw new TTSError(
        "Pitch must be a finite number between -20.0 and 20.0",
        "INVALID_PITCH",
      );
    }
  }

  /**
   * Map audio encoding format to Google TTS format
   */
  private mapAudioEncoding(encoding: AudioEncoding): GoogleAudioEncoding {
    switch (encoding) {
      case "MP3":
        return "MP3";
      case "WAV":
        return "LINEAR16";
      case "OGG":
        return "OGG_OPUS";
      default:
        return "MP3";
    }
  }

  /**
   * Get available voices for a language
   */
  async getAvailableVoices(languageCode?: string): Promise<GoogleVoice[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        NETWORK_TIMEOUTS.REQUEST_MS,
      );

      let response: Response;
      try {
        response = await fetch(this.voicesUrl, {
          headers: {
            "X-Goog-Api-Key": this.apiKey,
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new TTSError(
          `Failed to fetch voices: ${response.status}`,
          "VOICES_FETCH_FAILED",
        );
      }

      const data: GoogleVoicesResponse = await response.json();
      const voices = data.voices || [];

      if (languageCode) {
        return voices.filter((voice: GoogleVoice) =>
          voice.languageCodes?.includes(languageCode),
        );
      }

      return voices;
    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new TTSError(
          `Google TTS voices request timed out after ${NETWORK_TIMEOUTS.REQUEST_MS}ms`,
          "VOICES_FETCH_FAILED",
          error,
        );
      }

      throw new TTSError(
        `Failed to get available voices: ${getErrorMessage(error)}`,
        "VOICES_FETCH_FAILED",
        error instanceof Error ? error : undefined,
      );
    }
  }
}
