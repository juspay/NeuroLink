/**
 * OpenAI TTS Handler
 *
 * Implements text-to-speech synthesis using OpenAI's TTS API.
 * Supports models: tts-1, tts-1-hd
 * Supports voices: alloy, echo, fable, onyx, nova, shimmer
 * Supports formats: mp3, opus, aac, flac, wav, pcm
 *
 * @module adapters/tts/openaiTTSHandler
 */

import OpenAI from "openai";
import { logger } from "../../utils/logger.js";
import type {
  ITTSHandler,
  TTSOptions,
  TTSResult,
  AudioFormat,
  OpenAITTSVoice,
} from "../../types/ttsTypes.js";

/**
 * Audio formats supported by OpenAI's TTS API
 */
type OpenAIAudioFormat = "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";

/**
 * OpenAI TTS Handler implementation
 */
export class OpenAITTSHandler implements ITTSHandler {
  private client: OpenAI;
  private readonly supportedVoices: OpenAITTSVoice[] = [
    "alloy",
    "echo",
    "fable",
    "onyx",
    "nova",
    "shimmer",
  ];
  private readonly supportedFormats: OpenAIAudioFormat[] = [
    "mp3",
    "opus",
    "aac",
    "flac",
    "wav",
    "pcm",
  ];

  /**
   * Create a new OpenAI TTS Handler
   * @param apiKey - OpenAI API key (defaults to OPENAI_API_KEY env var)
   */
  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Synthesize text to speech using OpenAI's TTS API
   * @param options - Synthesis options
   * @returns Promise resolving to TTS result with audio buffer and metadata
   */
  async synthesize(options: TTSOptions): Promise<TTSResult> {
    const startTime = Date.now();

    // Validate text is provided
    if (!options.text) {
      throw new Error("Text is required for TTS synthesis");
    }

    // Validate and set defaults
    const voice = (options.voice || "alloy") as OpenAITTSVoice;
    const format = (options.format || "mp3") as OpenAIAudioFormat;
    const quality = options.quality || "standard";
    const speed = options.speed ?? 1.0;

    // Validate inputs
    this.validateInputs(options.text, voice, format, speed);

    // Select model based on quality
    const model = quality === "hd" ? "tts-1-hd" : "tts-1";

    try {
      logger.debug("OpenAI TTS synthesis starting", {
        model,
        voice,
        format,
        speed,
        textLength: options.text.length,
      });

      // Call OpenAI TTS API
      const response = await this.client.audio.speech.create({
        model,
        voice,
        input: options.text,
        response_format: format,
        speed,
      });

      // Convert response to ArrayBuffer then to Buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Estimate duration based on text length and speed
      // Rough estimate: ~150 words per minute at speed 1.0
      const wordCount = options.text.split(/\s+/).length;
      const estimatedDuration = ((wordCount / 150) * 60) / speed;

      const result: TTSResult = {
        buffer,
        format,
        size: buffer.length,
        duration: estimatedDuration,
        voice,
        sampleRate: undefined, // OpenAI doesn't provide sample rate in response
      };

      logger.debug("OpenAI TTS synthesis completed", {
        latency,
        bufferSize: buffer.length,
        estimatedDuration,
      });

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error("OpenAI TTS synthesis failed", {
        error,
        latency,
        model,
        voice,
        format,
      });

      // Re-throw with enhanced error information
      if (error instanceof Error) {
        throw new Error(`OpenAI TTS synthesis failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate synthesis inputs
   * @param text - Input text
   * @param voice - Voice name
   * @param format - Audio format
   * @param speed - Speech speed
   * @throws Error if validation fails
   */
  private validateInputs(
    text: string,
    voice: string,
    format: OpenAIAudioFormat,
    speed: number,
  ): void {
    // Validate text
    if (!text || text.trim().length === 0) {
      throw new Error("Text is required for TTS synthesis");
    }

    if (text.length > 4096) {
      throw new Error("Text exceeds maximum length of 4096 characters");
    }

    // Validate voice
    if (!this.supportedVoices.includes(voice as OpenAITTSVoice)) {
      throw new Error(
        `Unsupported voice: ${voice}. Supported voices: ${this.supportedVoices.join(", ")}`,
      );
    }

    // Validate format
    if (!this.supportedFormats.includes(format)) {
      throw new Error(
        `Unsupported format: ${format}. Supported formats: ${this.supportedFormats.join(", ")}`,
      );
    }

    // Validate speed
    if (speed < 0.25 || speed > 4.0) {
      throw new Error("Speed must be between 0.25 and 4.0");
    }
  }

  /**
   * Get list of supported voices
   * @returns Array of supported voice names
   */
  getSupportedVoices(): string[] {
    return [...this.supportedVoices];
  }

  /**
   * Get list of supported audio formats
   * @returns Array of supported format names
   */
  getSupportedFormats(): AudioFormat[] {
    return [...this.supportedFormats];
  }
}
