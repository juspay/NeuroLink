/**
 * Multi-Modal Streaming Support
 *
 * Provides unified streaming support for different content types including:
 * - Text generation
 * - Audio/TTS streaming
 * - Image generation
 * - Mixed content (text + images)
 *
 * @module streaming/multiModalStreaming
 */

import type {
  StreamEventPayload,
  TextDeltaPayload,
  AudioDeltaPayload,
  AudioEndPayload,
  ImageCompletePayload,
} from "./types.js";
import type {
  EnhancedStreamChunk,
  AudioChunk,
  ImageChunk,
  TextChunk,
} from "./chunkTypes.js";
import { logger } from "../utils/logger.js";

// ============================================
// MULTI-MODAL EVENT TYPES
// ============================================

/**
 * Content type enumeration
 */
export type ContentType = "text" | "audio" | "image" | "video" | "mixed";

/**
 * Multi-modal content item
 */
export type MultiModalContent =
  | { type: "text"; text: string }
  | { type: "audio"; data: Buffer | string; format: AudioFormat }
  | {
      type: "image";
      data: Buffer | string;
      format: ImageFormat;
      width?: number;
      height?: number;
    }
  | {
      type: "video";
      data: Buffer | string;
      format: VideoFormat;
      duration?: number;
    };

/**
 * Audio format specification
 */
export type AudioFormat = {
  encoding: "pcm" | "mp3" | "wav" | "ogg" | "opus" | "aac" | "flac";
  sampleRateHz: number;
  channels: number;
  bitDepth?: number;
};

/**
 * Image format specification
 */
export type ImageFormat = "png" | "jpeg" | "webp" | "gif" | "svg";

/**
 * Video format specification
 */
export type VideoFormat = "mp4" | "webm" | "mov" | "avi";

/**
 * Multi-modal stream configuration
 */
export type MultiModalStreamConfig = {
  /** Content types to accept */
  acceptTypes: ContentType[];
  /** Preferred audio format */
  audioFormat?: AudioFormat;
  /** Preferred image format */
  imageFormat?: ImageFormat;
  /** Buffer audio chunks before emitting */
  bufferAudio?: boolean;
  /** Audio buffer size in ms */
  audioBufferMs?: number;
  /** Convert audio to base64 */
  audioAsBase64?: boolean;
  /** Convert images to base64 */
  imageAsBase64?: boolean;
};

/**
 * Default multi-modal configuration
 */
export const DEFAULT_MULTIMODAL_CONFIG: MultiModalStreamConfig = {
  acceptTypes: ["text", "audio", "image"],
  audioFormat: {
    encoding: "pcm",
    sampleRateHz: 24000,
    channels: 1,
  },
  imageFormat: "png",
  bufferAudio: true,
  audioBufferMs: 100,
  audioAsBase64: true,
  imageAsBase64: true,
};

// ============================================
// MULTI-MODAL STREAM HANDLER
// ============================================

/**
 * MultiModalStreamHandler - Handles streaming of multiple content types
 *
 * @example Basic usage
 * ```typescript
 * const handler = new MultiModalStreamHandler({
 *   acceptTypes: ["text", "audio"],
 * });
 *
 * for await (const event of handler.process(sourceStream)) {
 *   if (event.type === "text:delta") {
 *     console.log(event.delta);
 *   } else if (event.type === "audio:delta") {
 *     // Handle audio chunk
 *   }
 * }
 * ```
 */
export class MultiModalStreamHandler {
  private readonly config: MultiModalStreamConfig;
  private seqCounter: number = 0;
  private audioBuffer: AudioDeltaPayload[] = [];
  private audioBufferStartTime: number | null = null;
  private totalAudioDuration: number = 0;
  private totalAudioBytes: number = 0;

  constructor(config: Partial<MultiModalStreamConfig> = {}) {
    this.config = { ...DEFAULT_MULTIMODAL_CONFIG, ...config };
  }

  /**
   * Process a multi-modal stream
   */
  async *process(
    stream: AsyncIterable<EnhancedStreamChunk | MultiModalContent>,
  ): AsyncGenerator<StreamEventPayload> {
    for await (const chunk of stream) {
      const events = this.processChunk(chunk);
      for (const event of events) {
        yield event;
      }
    }

    // Flush any remaining audio buffer
    yield* this.flushAudioBuffer();

    // Emit audio end if we had audio
    if (this.totalAudioBytes > 0) {
      yield this.createAudioEnd();
    }
  }

  /**
   * Process a single chunk
   */
  private processChunk(
    chunk: EnhancedStreamChunk | MultiModalContent,
  ): StreamEventPayload[] {
    const events: StreamEventPayload[] = [];

    // Handle MultiModalContent type
    if ("type" in chunk) {
      switch (chunk.type) {
        case "text":
          if (this.config.acceptTypes.includes("text")) {
            if ("content" in chunk) {
              // EnhancedStreamChunk TextChunk
              events.push(this.createTextDelta((chunk as TextChunk).content));
            } else if ("text" in chunk) {
              // MultiModalContent text
              events.push(
                this.createTextDelta(
                  (chunk as { type: "text"; text: string }).text,
                ),
              );
            }
          }
          break;

        case "audio":
          if (this.config.acceptTypes.includes("audio")) {
            const audioEvent = this.createAudioDelta(
              chunk as AudioChunk | MultiModalContent,
            );
            if (this.config.bufferAudio) {
              this.bufferAudioEvent(audioEvent);
            } else {
              events.push(audioEvent);
            }
          }
          break;

        case "image":
          if (this.config.acceptTypes.includes("image")) {
            events.push(
              this.createImageComplete(chunk as ImageChunk | MultiModalContent),
            );
          }
          break;

        default:
          // Handle other chunk types
          if (
            "content" in chunk &&
            typeof (chunk as { content: unknown }).content === "string"
          ) {
            events.push(
              this.createTextDelta((chunk as { content: string }).content),
            );
          }
      }
    }

    return events;
  }

  /**
   * Create text delta event
   */
  private createTextDelta(delta: string): TextDeltaPayload {
    return {
      type: "text:delta",
      seq: this.seqCounter++,
      timestamp: Date.now(),
      delta,
    };
  }

  /**
   * Create audio delta event
   */
  private createAudioDelta(
    chunk: AudioChunk | MultiModalContent,
  ): AudioDeltaPayload {
    let data: string;
    let sampleRateHz: number;
    let channels: number;
    let encoding: string;
    let durationMs: number | undefined;

    if ("audioChunk" in chunk) {
      // EnhancedStreamChunk AudioChunk (uses TTSChunk)
      const audioChunk = chunk.audioChunk;
      data = this.config.audioAsBase64
        ? this.toBase64(audioChunk.data)
        : audioChunk.data.toString();
      sampleRateHz = audioChunk.sampleRate ?? 24000;
      channels = 1; // TTS audio is typically mono
      encoding = audioChunk.format;
      durationMs = this.estimateAudioDuration(
        audioChunk.data,
        sampleRateHz,
        channels,
      );
    } else if ("data" in chunk && "format" in chunk) {
      // MultiModalContent audio (format is a string like "mp3", "wav", etc.)
      const audioContent = chunk as unknown as {
        type: "audio";
        data: Buffer | string;
        format: string;
      };
      data = this.config.audioAsBase64
        ? this.toBase64(audioContent.data)
        : audioContent.data.toString();
      sampleRateHz = 24000; // Default sample rate
      channels = 1; // Default mono
      encoding = audioContent.format;
      durationMs = this.estimateAudioDuration(
        audioContent.data,
        sampleRateHz,
        channels,
      );
    } else {
      // Fallback
      data = "";
      sampleRateHz = 24000;
      channels = 1;
      encoding = "pcm";
    }

    // Track totals
    if (durationMs) {
      this.totalAudioDuration += durationMs;
    }
    this.totalAudioBytes += data.length;

    return {
      type: "audio:delta",
      seq: this.seqCounter++,
      timestamp: Date.now(),
      data,
      sampleRateHz,
      channels,
      encoding,
      durationMs,
    };
  }

  /**
   * Create image complete event
   */
  private createImageComplete(
    chunk: ImageChunk | MultiModalContent,
  ): ImageCompletePayload {
    let base64: string;
    let mimeType: string;
    let width: number | undefined;
    let height: number | undefined;

    if ("imageOutput" in chunk) {
      // EnhancedStreamChunk ImageChunk
      base64 = chunk.imageOutput.base64;
      mimeType = chunk.imageOutput.mimeType ?? "image/png";
      width = chunk.imageOutput.width;
      height = chunk.imageOutput.height;
    } else if ("data" in chunk && "format" in chunk) {
      // MultiModalContent image
      const imageContent = chunk as {
        type: "image";
        data: Buffer | string;
        format: ImageFormat;
        width?: number;
        height?: number;
      };
      base64 = this.config.imageAsBase64
        ? this.toBase64(imageContent.data)
        : imageContent.data.toString();
      mimeType = this.formatToMimeType(imageContent.format);
      width = imageContent.width;
      height = imageContent.height;
    } else {
      // Fallback
      base64 = "";
      mimeType = "image/png";
    }

    return {
      type: "image:complete",
      seq: this.seqCounter++,
      timestamp: Date.now(),
      base64,
      mimeType,
      width,
      height,
    };
  }

  /**
   * Create audio end event
   */
  private createAudioEnd(): AudioEndPayload {
    return {
      type: "audio:end",
      seq: this.seqCounter++,
      timestamp: Date.now(),
      totalDurationMs: this.totalAudioDuration,
      totalSizeBytes: this.totalAudioBytes,
      format: this.config.audioFormat?.encoding ?? "pcm",
    };
  }

  /**
   * Buffer audio event for batching
   */
  private bufferAudioEvent(event: AudioDeltaPayload): void {
    if (this.audioBufferStartTime === null) {
      this.audioBufferStartTime = Date.now();
    }
    this.audioBuffer.push(event);
  }

  /**
   * Flush audio buffer
   */
  private *flushAudioBuffer(): Generator<AudioDeltaPayload> {
    for (const event of this.audioBuffer) {
      yield event;
    }
    this.audioBuffer = [];
    this.audioBufferStartTime = null;
  }

  /**
   * Convert data to base64
   */
  private toBase64(data: Buffer | string): string {
    if (typeof data === "string") {
      return data; // Assume already base64
    }
    return data.toString("base64");
  }

  /**
   * Estimate audio duration from buffer size
   */
  private estimateAudioDuration(
    data: Buffer | string,
    sampleRateHz: number,
    channels: number,
    bitDepth: number = 16,
  ): number {
    const byteLength = typeof data === "string" ? data.length : data.length;
    const bytesPerSample = (bitDepth / 8) * channels;
    const samples = byteLength / bytesPerSample;
    return (samples / sampleRateHz) * 1000;
  }

  /**
   * Convert image format to MIME type
   */
  private formatToMimeType(format: ImageFormat): string {
    const mimeTypes: Record<ImageFormat, string> = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
    };
    return mimeTypes[format] ?? "image/png";
  }
}

// ============================================
// AUDIO STREAMING UTILITIES
// ============================================

/**
 * Audio stream processor for TTS
 */
export class AudioStreamProcessor {
  private readonly config: {
    format: AudioFormat;
    bufferSizeMs: number;
    normalizeVolume: boolean;
  };

  constructor(
    options: Partial<{
      format: AudioFormat;
      bufferSizeMs: number;
      normalizeVolume: boolean;
    }> = {},
  ) {
    this.config = {
      format: options.format ?? {
        encoding: "pcm",
        sampleRateHz: 24000,
        channels: 1,
      },
      bufferSizeMs: options.bufferSizeMs ?? 100,
      normalizeVolume: options.normalizeVolume ?? false,
    };
  }

  /**
   * Process audio chunks
   */
  async *process(
    stream: AsyncIterable<{
      data: Buffer;
      sampleRateHz: number;
      channels: number;
      encoding: string;
    }>,
  ): AsyncGenerator<AudioDeltaPayload> {
    let seqCounter = 0;

    for await (const chunk of stream) {
      yield {
        type: "audio:delta",
        seq: seqCounter++,
        timestamp: Date.now(),
        data: chunk.data.toString("base64"),
        sampleRateHz: chunk.sampleRateHz,
        channels: chunk.channels,
        encoding: chunk.encoding,
      };
    }
  }

  /**
   * Convert audio format
   */
  convertFormat(
    data: Buffer,
    _fromFormat: AudioFormat,
    _toFormat: AudioFormat,
  ): Buffer {
    // Placeholder - would need actual audio processing library
    logger.debug("Audio format conversion requested");
    return data;
  }
}

// ============================================
// IMAGE STREAMING UTILITIES
// ============================================

/**
 * Image stream processor
 */
export class ImageStreamProcessor {
  private seqCounter: number = 0;

  /**
   * Process image generation progress
   */
  async *processProgress(
    stream: AsyncIterable<{
      step: number;
      totalSteps: number;
      preview?: string;
    }>,
  ): AsyncGenerator<StreamEventPayload> {
    for await (const progress of stream) {
      yield {
        type: "image:complete", // Using complete for progress preview
        seq: this.seqCounter++,
        timestamp: Date.now(),
        base64: progress.preview ?? "",
        mimeType: "image/png",
      } as ImageCompletePayload;
    }
  }

  /**
   * Process multiple images
   */
  async *processMultiple(
    images: Array<{
      base64: string;
      mimeType?: string;
      width?: number;
      height?: number;
    }>,
  ): AsyncGenerator<ImageCompletePayload> {
    for (const image of images) {
      yield {
        type: "image:complete",
        seq: this.seqCounter++,
        timestamp: Date.now(),
        base64: image.base64,
        mimeType: image.mimeType ?? "image/png",
        width: image.width,
        height: image.height,
      };
    }
  }
}

// ============================================
// MIXED CONTENT STREAMING
// ============================================

/**
 * Mixed content stream combiner
 *
 * Combines multiple streams (text, audio, images) into a single
 * unified event stream with proper ordering and sequencing.
 */
export class MixedContentCombiner {
  private seqCounter: number = 0;

  /**
   * Combine multiple content streams
   */
  async *combine(sources: {
    text?: AsyncIterable<string>;
    audio?: AsyncIterable<{ data: Buffer; format: AudioFormat }>;
    images?: AsyncIterable<{ base64: string; mimeType?: string }>;
  }): AsyncGenerator<StreamEventPayload> {
    const iterators: Array<{
      type: ContentType;
      iterator: AsyncIterator<unknown>;
      active: boolean;
    }> = [];

    if (sources.text) {
      iterators.push({
        type: "text",
        iterator: sources.text[Symbol.asyncIterator](),
        active: true,
      });
    }

    if (sources.audio) {
      iterators.push({
        type: "audio",
        iterator: sources.audio[Symbol.asyncIterator](),
        active: true,
      });
    }

    if (sources.images) {
      iterators.push({
        type: "image",
        iterator: sources.images[Symbol.asyncIterator](),
        active: true,
      });
    }

    // Round-robin through active iterators
    while (iterators.some((it) => it.active)) {
      for (const source of iterators) {
        if (!source.active) {
          continue;
        }

        const result = await source.iterator.next();

        if (result.done) {
          source.active = false;
          continue;
        }

        yield this.createEvent(source.type, result.value);
      }
    }
  }

  private createEvent(type: ContentType, value: unknown): StreamEventPayload {
    switch (type) {
      case "text":
        return {
          type: "text:delta",
          seq: this.seqCounter++,
          timestamp: Date.now(),
          delta: value as string,
        };

      case "audio": {
        const audio = value as { data: Buffer; format: AudioFormat };
        return {
          type: "audio:delta",
          seq: this.seqCounter++,
          timestamp: Date.now(),
          data: audio.data.toString("base64"),
          sampleRateHz: audio.format.sampleRateHz,
          channels: audio.format.channels,
          encoding: audio.format.encoding,
        };
      }

      case "image": {
        const image = value as { base64: string; mimeType?: string };
        return {
          type: "image:complete",
          seq: this.seqCounter++,
          timestamp: Date.now(),
          base64: image.base64,
          mimeType: image.mimeType ?? "image/png",
        };
      }

      default:
        return {
          type: "text:delta",
          seq: this.seqCounter++,
          timestamp: Date.now(),
          delta: String(value),
        };
    }
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create a multi-modal stream handler
 */
export function createMultiModalHandler(
  config?: Partial<MultiModalStreamConfig>,
): MultiModalStreamHandler {
  return new MultiModalStreamHandler(config);
}

/**
 * Create an audio stream processor
 */
export function createAudioProcessor(
  options?: Partial<{ format: AudioFormat; bufferSizeMs: number }>,
): AudioStreamProcessor {
  return new AudioStreamProcessor(options);
}

/**
 * Create an image stream processor
 */
export function createImageProcessor(): ImageStreamProcessor {
  return new ImageStreamProcessor();
}

/**
 * Create a mixed content combiner
 */
export function createMixedContentCombiner(): MixedContentCombiner {
  return new MixedContentCombiner();
}

/**
 * Type guard for multi-modal content
 */
export function isMultiModalContent(
  value: unknown,
): value is MultiModalContent {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const typed = value as { type?: unknown };
  return (
    typed.type === "text" ||
    typed.type === "audio" ||
    typed.type === "image" ||
    typed.type === "video"
  );
}
