/**
 * Google Gemini TTS Provider
 * Integrates with Google Cloud Text-to-Speech API
 */

import type {
  TTSInput,
  TTSResponse,
  TTSConfig,
  GoogleTTSRequest,
  GoogleTTSResponse,
  GoogleVoice,
  GoogleVoicesResponse,
} from "../types/tts.js";
import { TTSError } from "../types/tts.js";

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

    this.synthesizeUrl =
      process.env.GOOGLE_TTS_SYNTHESIZE_URL ||
      "https://texttospeech.googleapis.com/v1/text:synthesize";
    this.voicesUrl =
      process.env.GOOGLE_TTS_VOICES_URL ||
      "https://texttospeech.googleapis.com/v1/voices";
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
          speakingRate: input.speakingRate || 1.0,
          pitch: input.pitch || 0.0,
        },
      };

      // Make API request to Google TTS with secure header-based authentication
      const response = await fetch(this.synthesizeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

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
      const encoding = this.mapAudioEncoding(input.audioEncoding || "MP3");

      const ttsResponse: TTSResponse = {
        audioBuffer,
        audioSize: audioBuffer.length,
        generationTime,
        wasPlayed: false,
        encoding,
      };

      return ttsResponse;
    } catch (error) {
      if (error instanceof TTSError) {
        throw error;
      }

      throw new TTSError(
        `Failed to generate TTS audio: ${(error as Error).message}`,
        "GENERATION_FAILED",
        error as Error,
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

    if (input.text.length > 5000) {
      throw new TTSError(
        "Text is too long (max 5000 characters)",
        "TEXT_TOO_LONG",
      );
    }

    if (!input.languageCode) {
      throw new TTSError("Language code is required", "MISSING_LANGUAGE_CODE");
    }

    if (!input.voiceName) {
      throw new TTSError("Voice name is required", "MISSING_VOICE_NAME");
    }

    if (
      input.speakingRate &&
      (input.speakingRate < 0.25 || input.speakingRate > 4.0)
    ) {
      throw new TTSError(
        "Speaking rate must be between 0.25 and 4.0",
        "INVALID_SPEAKING_RATE",
      );
    }

    if (input.pitch && (input.pitch < -20.0 || input.pitch > 20.0)) {
      throw new TTSError(
        "Pitch must be between -20.0 and 20.0",
        "INVALID_PITCH",
      );
    }
  }

  /**
   * Map audio encoding format to Google TTS format
   */
  private mapAudioEncoding(encoding: string): string {
    switch (encoding.toUpperCase()) {
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
      const response = await fetch(this.voicesUrl, {
        headers: {
          "X-Goog-Api-Key": this.apiKey,
        },
      });

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
      throw new TTSError(
        `Failed to get available voices: ${(error as Error).message}`,
        "VOICES_FETCH_FAILED",
        error as Error,
      );
    }
  }
}
