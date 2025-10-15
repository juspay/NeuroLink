/**
 * Main TTS Service
 * Orchestrates text-to-speech generation and audio playback
 */

import type { TTSInput, TTSResponse, TTSConfig } from "../types/tts.js";
import { TTSError } from "../types/tts.js";
import { GeminiTTSProvider } from "./gemini-tts-provider.js";
import { CrossPlatformAudioPlayer } from "./audio-player.js";

export class TTSService {
  private ttsProvider: GeminiTTSProvider;
  private audioPlayer: CrossPlatformAudioPlayer;
  private config: TTSConfig;

  constructor(config?: Partial<TTSConfig>) {
    // Get API key from environment if not provided
    const apiKey = config?.apiKey || process.env.GOOGLE_AI_API_KEY || "";

    if (!apiKey) {
      throw new TTSError(
        "GOOGLE_AI_API_KEY environment variable or config.apiKey is required",
        "MISSING_API_KEY",
      );
    }

    this.config = {
      apiKey,
      defaultEncoding: config?.defaultEncoding || "MP3",
    };

    this.ttsProvider = new GeminiTTSProvider(this.config);
    this.audioPlayer = new CrossPlatformAudioPlayer();
  }

  /**
   * Main method: Generate audio from text and return audio buffer
   * This is the primary interface method as specified in requirements
   */
  async generateAudio(input: TTSInput): Promise<TTSResponse> {
    try {
      // Validate provider
      if (input.provider !== "gemini") {
        throw new TTSError(
          `Unsupported provider: ${input.provider}. Only 'gemini' is currently supported.`,
          "UNSUPPORTED_PROVIDER",
        );
      }

      // Generate audio using the TTS provider
      const response = await this.ttsProvider.generateAudio(input);

      // Play audio if requested
      if (input.play) {
        try {
          await this.playAudioFromBuffer(
            response.audioBuffer,
            response.encoding,
          );
          response.wasPlayed = true;
        } catch {
          // Don't throw here - audio generation was successful
        }
      }

      return response;
    } catch (error) {
      if (error instanceof TTSError) {
        throw error;
      }

      throw new TTSError(
        `TTS generation failed: ${(error as Error).message}`,
        "GENERATION_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Play an audio file
   */
  async playAudio(filePath: string): Promise<void> {
    if (!this.audioPlayer.isSupported()) {
      throw new TTSError(
        "Audio playback is not supported on this platform",
        "PLAYBACK_NOT_SUPPORTED",
      );
    }

    await this.audioPlayer.play(filePath);
  }

  /**
   * Play audio from buffer
   */
  async playAudioFromBuffer(
    audioBuffer: Buffer,
    encoding: string = "mp3",
  ): Promise<void> {
    if (!this.audioPlayer.isSupported()) {
      throw new TTSError(
        "Audio playback is not supported on this platform",
        "PLAYBACK_NOT_SUPPORTED",
      );
    }

    await this.audioPlayer.playFromBuffer(audioBuffer, encoding);
  }

  /**
   * Test audio playback capability
   */
  async testAudioPlayback(): Promise<boolean> {
    return this.audioPlayer.testPlayback();
  }

  /**
   * Get available voices for a language
   */
  async getAvailableVoices(languageCode?: string) {
    return this.ttsProvider.getAvailableVoices(languageCode);
  }

  /**
   * Get supported audio encodings
   */
  getSupportedEncodings(): string[] {
    return ["MP3", "WAV", "OGG"];
  }

  /**
   * Get supported platforms for audio playback
   */
  getSupportedPlatforms(): string[] {
    return ["darwin", "linux", "win32"];
  }

  /**
   * Get current configuration
   */
  getConfig(): Partial<TTSConfig> {
    return {
      defaultEncoding: this.config.defaultEncoding,
    };
  }

  /**
   * Create a quick TTS instance with minimal configuration
   */
  static create(apiKey?: string): TTSService {
    return new TTSService({ apiKey });
  }

  /**
   * Validate TTS input before processing
   */
  validateInput(input: TTSInput): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new TTSError("Text is required for TTS generation", "INVALID_TEXT");
    }

    if (input.provider !== "gemini") {
      throw new TTSError(
        `Unsupported provider: ${input.provider}. Only 'gemini' is currently supported.`,
        "UNSUPPORTED_PROVIDER",
      );
    }

    if (!input.languageCode) {
      throw new TTSError("Language code is required", "MISSING_LANGUAGE_CODE");
    }

    if (!input.voiceName) {
      throw new TTSError("Voice name is required", "MISSING_VOICE_NAME");
    }
  }

  /**
   * Get system information for debugging
   */
  getSystemInfo() {
    return {
      platform: process.platform,
      audioSupported: this.audioPlayer.isSupported(),
      playerCommand: this.audioPlayer.isSupported()
        ? this.audioPlayer.getPlayerCommand()
        : "none",
      supportedEncodings: this.getSupportedEncodings(),
      nodeVersion: process.version,
    };
  }
}
