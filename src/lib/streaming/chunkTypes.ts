/**
 * Stream Chunk Types
 *
 * Defines enhanced discriminated union types for stream chunks including
 * text, audio, tool, thinking/reasoning, and image content types.
 * Compatible with existing NeuroLink StreamChunk while providing richer typing.
 *
 * @module streaming/chunkTypes
 */

import type { JsonValue, UnknownRecord } from "../types/common.js";
import type { TTSChunk } from "../types/ttsTypes.js";

// ============================================
// BASE CHUNK TYPE
// ============================================

/**
 * Base chunk type with common properties
 */
export type BaseChunk = {
  /** Chunk type discriminator */
  type: string;
  /** Sequence number */
  seq?: number;
  /** Timestamp */
  timestamp?: number;
};

// ============================================
// TEXT CHUNKS
// ============================================

/**
 * Text content chunk
 */
export type TextChunk = BaseChunk & {
  type: "text";
  /** Text content */
  content: string;
  /** Accumulated text so far */
  accumulated?: string;
  /** Character offset */
  offset?: number;
};

/**
 * Legacy content chunk (for backward compatibility)
 */
export type LegacyContentChunk = {
  /** Text content */
  content: string;
};

// ============================================
// AUDIO CHUNKS
// ============================================

/**
 * TTS audio chunk (using existing TTSChunk type)
 */
export type AudioChunk = BaseChunk & {
  type: "audio";
  /** TTS audio chunk data */
  audioChunk: TTSChunk;
};

/**
 * Raw audio chunk (for streaming audio)
 */
export type RawAudioChunk = BaseChunk & {
  type: "raw-audio";
  /** Audio data buffer */
  data: Buffer;
  /** Sample rate in Hz */
  sampleRateHz: number;
  /** Number of channels */
  channels: number;
  /** Encoding format */
  encoding: string;
  /** Duration of this chunk in ms */
  durationMs?: number;
  /** Is this the final chunk */
  isFinal?: boolean;
};

// ============================================
// TOOL CHUNKS
// ============================================

/**
 * Tool call chunk (tool being invoked)
 */
export type ToolCallChunk = BaseChunk & {
  type: "tool-call";
  /** Tool call ID */
  toolCallId: string;
  /** Tool name */
  toolName: string;
  /** Tool arguments */
  args: UnknownRecord;
  /** MCP server ID if external */
  serverId?: string;
};

/**
 * Tool call arguments delta (streaming args)
 */
export type ToolArgsDeltaChunk = BaseChunk & {
  type: "tool-args-delta";
  /** Tool call ID */
  toolCallId: string;
  /** Arguments text delta */
  argsTextDelta: string;
};

/**
 * Tool result chunk
 */
export type ToolResultChunk = BaseChunk & {
  type: "tool-result";
  /** Tool call ID */
  toolCallId: string;
  /** Tool name */
  toolName: string;
  /** Result value */
  result: JsonValue;
  /** Execution duration in ms */
  durationMs: number;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
};

/**
 * Tool execution status chunk
 */
export type ToolStatusChunk = BaseChunk & {
  type: "tool-status";
  /** Tool call ID */
  toolCallId: string;
  /** Tool name */
  toolName: string;
  /** Current status */
  status: "pending" | "executing" | "completed" | "failed";
  /** Progress percentage (0-100) */
  progress?: number;
  /** Status message */
  message?: string;
};

// ============================================
// THINKING/REASONING CHUNKS
// ============================================

/**
 * Thinking content chunk (extended thinking/reasoning)
 */
export type ThinkingChunk = BaseChunk & {
  type: "thinking";
  /** Thinking content delta */
  content: string;
  /** Thinking phase */
  phase?: string;
  /** Step number in reasoning chain */
  stepNumber?: number;
  /** Is this the final thinking chunk */
  isFinal?: boolean;
};

/**
 * Reasoning summary chunk (end of thinking)
 */
export type ReasoningSummaryChunk = BaseChunk & {
  type: "reasoning-summary";
  /** Complete reasoning text */
  reasoning: string;
  /** Tokens used for reasoning */
  reasoningTokens?: number;
  /** Thinking signature/hash */
  thoughtSignature?: string;
  /** Structured thoughts */
  thoughts?: Array<{
    id?: string;
    type?: string;
    content: string;
  }>;
};

// ============================================
// IMAGE CHUNKS
// ============================================

/**
 * Image output chunk
 */
export type ImageChunk = BaseChunk & {
  type: "image";
  /** Image output data */
  imageOutput: {
    /** Base64-encoded image */
    base64: string;
    /** MIME type */
    mimeType?: string;
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
  };
};

/**
 * Image generation progress chunk
 */
export type ImageProgressChunk = BaseChunk & {
  type: "image-progress";
  /** Generation step */
  step: number;
  /** Total steps */
  totalSteps: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Preview image (low quality) */
  preview?: string;
};

// ============================================
// STRUCTURED OUTPUT CHUNKS
// ============================================

/**
 * Partial object chunk (during structured output streaming)
 */
export type PartialObjectChunk = BaseChunk & {
  type: "partial-object";
  /** Partial object built so far */
  partialObject: JsonValue;
  /** Current JSON path */
  currentPath?: string;
  /** JSON text delta */
  jsonTextDelta?: string;
};

/**
 * Complete object chunk
 */
export type CompleteObjectChunk = BaseChunk & {
  type: "complete-object";
  /** Complete parsed object */
  object: JsonValue;
  /** Validation status */
  valid: boolean;
  /** Validation errors */
  validationErrors?: string[];
};

// ============================================
// CONTROL CHUNKS
// ============================================

/**
 * Step start chunk (multi-step generation)
 */
export type StepStartChunk = BaseChunk & {
  type: "step-start";
  /** Step number */
  stepNumber: number;
  /** Maximum steps */
  maxSteps: number;
  /** Step type */
  stepType: "initial" | "tool-response" | "continuation";
};

/**
 * Step end chunk
 */
export type StepEndChunk = BaseChunk & {
  type: "step-end";
  /** Step number */
  stepNumber: number;
  /** Finish reason */
  finishReason: string;
  /** Will continue */
  isContinued: boolean;
};

/**
 * Error chunk
 */
export type ErrorChunk = BaseChunk & {
  type: "error";
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Retriable */
  retriable: boolean;
};

/**
 * Done chunk (stream complete)
 */
export type DoneChunk = BaseChunk & {
  type: "done";
  /** Total duration */
  totalDurationMs?: number;
  /** Total chunks */
  totalChunks?: number;
};

/**
 * Ping chunk (keep-alive)
 */
export type PingChunk = BaseChunk & {
  type: "ping";
  /** Elapsed time */
  elapsedMs?: number;
};

// ============================================
// METADATA CHUNKS
// ============================================

/**
 * Usage metadata chunk
 */
export type UsageChunk = BaseChunk & {
  type: "usage";
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens: number;
  /** Total tokens */
  totalTokens: number;
  /** Reasoning tokens */
  reasoningTokens?: number;
  /** Cache tokens */
  cacheTokens?: {
    read: number;
    write: number;
  };
};

/**
 * Provider metadata chunk
 */
export type MetadataChunk = BaseChunk & {
  type: "metadata";
  /** Provider name */
  provider?: string;
  /** Model name */
  model?: string;
  /** Response ID */
  responseId?: string;
  /** Additional metadata */
  data: UnknownRecord;
};

// ============================================
// UNION TYPES
// ============================================

/**
 * All text-related chunks
 */
export type TextRelatedChunk = TextChunk | LegacyContentChunk;

/**
 * All audio-related chunks
 */
export type AudioRelatedChunk = AudioChunk | RawAudioChunk;

/**
 * All tool-related chunks
 */
export type ToolRelatedChunk =
  | ToolCallChunk
  | ToolArgsDeltaChunk
  | ToolResultChunk
  | ToolStatusChunk;

/**
 * All thinking-related chunks
 */
export type ThinkingRelatedChunk = ThinkingChunk | ReasoningSummaryChunk;

/**
 * All structured output chunks
 */
export type StructuredOutputChunk = PartialObjectChunk | CompleteObjectChunk;

/**
 * All control chunks
 */
export type ControlChunk =
  | StepStartChunk
  | StepEndChunk
  | ErrorChunk
  | DoneChunk
  | PingChunk;

/**
 * All metadata chunks
 */
export type MetadataRelatedChunk = UsageChunk | MetadataChunk;

/**
 * Enhanced stream chunk - complete discriminated union
 */
export type EnhancedStreamChunk =
  | TextChunk
  | AudioChunk
  | RawAudioChunk
  | ToolCallChunk
  | ToolArgsDeltaChunk
  | ToolResultChunk
  | ToolStatusChunk
  | ThinkingChunk
  | ReasoningSummaryChunk
  | ImageChunk
  | ImageProgressChunk
  | PartialObjectChunk
  | CompleteObjectChunk
  | StepStartChunk
  | StepEndChunk
  | ErrorChunk
  | DoneChunk
  | PingChunk
  | UsageChunk
  | MetadataChunk;

/**
 * Legacy-compatible stream chunk (matches existing StreamChunk)
 */
export type CompatibleStreamChunk =
  | { content: string }
  | {
      type: "audio";
      audio: {
        data: Buffer;
        sampleRateHz: number;
        channels: number;
        encoding: string;
      };
    }
  | { type: "image"; imageOutput: { base64: string } };

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Check if chunk is a text chunk
 */
export function isTextChunk(chunk: unknown): chunk is TextChunk {
  return (
    typeof chunk === "object" &&
    chunk !== null &&
    (chunk as BaseChunk).type === "text"
  );
}

/**
 * Check if chunk is a legacy content chunk
 */
export function isLegacyContentChunk(
  chunk: unknown,
): chunk is LegacyContentChunk {
  return (
    typeof chunk === "object" &&
    chunk !== null &&
    "content" in chunk &&
    !("type" in chunk)
  );
}

/**
 * Check if chunk is an audio chunk
 */
export function isAudioChunk(chunk: unknown): chunk is AudioChunk {
  return (
    typeof chunk === "object" &&
    chunk !== null &&
    (chunk as BaseChunk).type === "audio"
  );
}

/**
 * Check if chunk is a tool-related chunk
 */
export function isToolChunk(chunk: unknown): chunk is ToolRelatedChunk {
  if (typeof chunk !== "object" || chunk === null) {
    return false;
  }
  const type = (chunk as BaseChunk).type;
  return (
    type === "tool-call" ||
    type === "tool-args-delta" ||
    type === "tool-result" ||
    type === "tool-status"
  );
}

/**
 * Check if chunk is a thinking chunk
 */
export function isThinkingChunk(chunk: unknown): chunk is ThinkingRelatedChunk {
  if (typeof chunk !== "object" || chunk === null) {
    return false;
  }
  const type = (chunk as BaseChunk).type;
  return type === "thinking" || type === "reasoning-summary";
}

/**
 * Check if chunk is an image chunk
 */
export function isImageChunk(chunk: unknown): chunk is ImageChunk {
  return (
    typeof chunk === "object" &&
    chunk !== null &&
    (chunk as BaseChunk).type === "image"
  );
}

/**
 * Check if chunk is a structured output chunk
 */
export function isStructuredOutputChunk(
  chunk: unknown,
): chunk is StructuredOutputChunk {
  if (typeof chunk !== "object" || chunk === null) {
    return false;
  }
  const type = (chunk as BaseChunk).type;
  return type === "partial-object" || type === "complete-object";
}

/**
 * Check if chunk is an error chunk
 */
export function isErrorChunk(chunk: unknown): chunk is ErrorChunk {
  return (
    typeof chunk === "object" &&
    chunk !== null &&
    (chunk as BaseChunk).type === "error"
  );
}

/**
 * Check if chunk is a done chunk
 */
export function isDoneChunk(chunk: unknown): chunk is DoneChunk {
  return (
    typeof chunk === "object" &&
    chunk !== null &&
    (chunk as BaseChunk).type === "done"
  );
}

/**
 * Check if chunk has content (text or legacy)
 */
export function hasContent(
  chunk: unknown,
): chunk is TextChunk | LegacyContentChunk {
  return isTextChunk(chunk) || isLegacyContentChunk(chunk);
}

// ============================================
// CONVERSION UTILITIES
// ============================================

/**
 * Convert enhanced chunk to legacy format
 */
export function toLegacyChunk(
  chunk: EnhancedStreamChunk,
): CompatibleStreamChunk | null {
  switch (chunk.type) {
    case "text":
      return { content: chunk.content };
    case "audio":
      return {
        type: "audio",
        audio: {
          data: chunk.audioChunk.data,
          sampleRateHz: chunk.audioChunk.sampleRate ?? 24000,
          channels: 1, // TTS audio is typically mono
          encoding: chunk.audioChunk.format,
        },
      };
    case "image":
      return {
        type: "image",
        imageOutput: { base64: chunk.imageOutput.base64 },
      };
    default:
      return null;
  }
}

/**
 * Convert legacy chunk to enhanced format
 */
export function fromLegacyChunk(
  chunk: CompatibleStreamChunk,
  seq: number = 0,
): EnhancedStreamChunk {
  if ("content" in chunk && !("type" in chunk)) {
    return {
      type: "text",
      content: chunk.content,
      seq,
      timestamp: Date.now(),
    };
  }

  if ("type" in chunk) {
    if (chunk.type === "audio") {
      const audioChunk = chunk as {
        type: "audio";
        audio: {
          data: Buffer;
          sampleRateHz: number;
          channels: number;
          encoding: string;
        };
      };
      return {
        type: "audio",
        audioChunk: {
          data: audioChunk.audio.data,
          format: audioChunk.audio.encoding as "mp3" | "wav" | "ogg" | "opus",
          index: seq,
          isFinal: false,
          sampleRate: audioChunk.audio.sampleRateHz,
        },
        seq,
        timestamp: Date.now(),
      } as AudioChunk;
    }

    if (chunk.type === "image") {
      const imageChunk = chunk as {
        type: "image";
        imageOutput: { base64: string };
      };
      return {
        type: "image",
        imageOutput: {
          base64: imageChunk.imageOutput.base64,
        },
        seq,
        timestamp: Date.now(),
      };
    }
  }

  // Default to text chunk
  return {
    type: "text",
    content: "",
    seq,
    timestamp: Date.now(),
  };
}

/**
 * Extract text content from any chunk type or array of chunks
 */
export function extractTextContent(chunk: unknown): string | null {
  // Handle array of chunks
  if (Array.isArray(chunk)) {
    const texts: string[] = [];
    for (const c of chunk) {
      const text = extractTextContent(c);
      if (text !== null) {
        texts.push(text);
      }
    }
    return texts.length > 0 ? texts.join("") : null;
  }

  if (isTextChunk(chunk)) {
    return chunk.content;
  }
  if (isLegacyContentChunk(chunk)) {
    return chunk.content;
  }
  if (isThinkingChunk(chunk) && chunk.type === "thinking") {
    return chunk.content;
  }
  return null;
}

/**
 * Create a text chunk
 */
export function createTextChunk(
  content: string,
  options?: { seq?: number; accumulated?: string; offset?: number },
): TextChunk {
  return {
    type: "text",
    content,
    seq: options?.seq,
    timestamp: Date.now(),
    accumulated: options?.accumulated,
    offset: options?.offset,
  };
}

/**
 * Create an error chunk
 */
export function createErrorChunk(
  code: string,
  message: string,
  retriable: boolean = true,
  seq?: number,
): ErrorChunk {
  return {
    type: "error",
    code,
    message,
    retriable,
    seq,
    timestamp: Date.now(),
  };
}

/**
 * Create a done chunk
 */
export function createDoneChunk(
  totalDurationMs?: number,
  totalChunks?: number,
  seq?: number,
): DoneChunk {
  return {
    type: "done",
    totalDurationMs,
    totalChunks,
    seq,
    timestamp: Date.now(),
  };
}
