/**
 * Enhanced Stream Event Types for NeuroLink
 *
 * Provides Mastra-style fine-grained streaming events with discriminated unions.
 * These types enable precise event handling for AI generation, tool execution,
 * reasoning/thinking, and structured output streaming.
 *
 * @module streaming/types
 */

import type { TokenUsage } from "../types/analytics.js";
import type { JsonObject, JsonValue, UnknownRecord } from "../types/common.js";

// ============================================
// BASE STREAM EVENT
// ============================================

/**
 * Base stream event type with common properties
 */
export type BaseStreamEvent = {
  /** Event type discriminator */
  type: string;
  /** Event sequence number (monotonically increasing within a stream) */
  seq: number;
  /** Event timestamp (Unix milliseconds) */
  timestamp: number;
};

// ============================================
// FINISH REASON TYPE
// ============================================

/**
 * Finish reason types (aligned with AI SDK)
 */
export type FinishReason =
  | "stop" // Natural completion
  | "length" // Max tokens reached
  | "content-filter" // Content filtered
  | "tool-calls" // Tool calls requested
  | "error" // Error occurred
  | "cancelled" // User cancelled
  | "other" // Other reason
  | "unknown"; // Unknown reason

// ============================================
// TEXT EVENTS
// ============================================

/**
 * Emitted when text generation begins
 */
export type TextStartPayload = BaseStreamEvent & {
  type: "text:start";
  /** Optional generation ID */
  generationId?: string;
  /** Model that will generate */
  model?: string;
};

/**
 * Emitted for each text chunk during streaming
 */
export type TextDeltaPayload = BaseStreamEvent & {
  type: "text:delta";
  /** The text delta content */
  delta: string;
  /** Cumulative text so far (optional, for clients that need it) */
  accumulated?: string;
  /** Character offset in the full response */
  offset?: number;
};

/**
 * Emitted when text generation completes
 */
export type TextEndPayload = BaseStreamEvent & {
  type: "text:end";
  /** Final complete text */
  text: string;
  /** Character count */
  charCount: number;
  /** Word count (approximate) */
  wordCount?: number;
};

// ============================================
// TOOL EVENTS
// ============================================

/**
 * Emitted when a tool call begins
 */
export type ToolCallStartPayload = BaseStreamEvent & {
  type: "tool:call:start";
  /** Unique tool call ID */
  toolCallId: string;
  /** Tool name being called */
  toolName: string;
  /** MCP server ID if external tool */
  serverId?: string;
  /** Tool category */
  category?: "direct" | "custom" | "mcp";
};

/**
 * Emitted during streaming tool call arguments
 */
export type ToolCallDeltaPayload = BaseStreamEvent & {
  type: "tool:call:delta";
  /** Tool call ID this delta belongs to */
  toolCallId: string;
  /** Argument text delta (JSON being built) */
  argsTextDelta: string;
  /** Accumulated args text so far */
  accumulatedArgsText?: string;
};

/**
 * Emitted when tool call arguments are complete
 */
export type ToolCallPayload = BaseStreamEvent & {
  type: "tool:call";
  /** Unique tool call ID */
  toolCallId: string;
  /** Tool name that was called */
  toolName: string;
  /** Complete parsed arguments */
  args: JsonObject;
  /** Server ID for MCP tools */
  serverId?: string;
};

/**
 * Emitted when a tool execution begins
 */
export type ToolExecuteStartPayload = BaseStreamEvent & {
  type: "tool:execute:start";
  /** Tool call ID being executed */
  toolCallId: string;
  /** Tool name */
  toolName: string;
  /** Input parameters */
  input: JsonValue;
};

/**
 * Emitted when a tool execution completes
 */
export type ToolResultPayload = BaseStreamEvent & {
  type: "tool:result";
  /** Tool call ID */
  toolCallId: string;
  /** Tool name */
  toolName: string;
  /** Tool execution result */
  result: JsonValue;
  /** Execution duration in ms */
  duration: number;
  /** Whether execution was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: {
    serverId?: string;
    cached?: boolean;
    fallback?: boolean;
  };
};

// ============================================
// REASONING EVENTS (Extended Thinking)
// ============================================

/**
 * Emitted when extended thinking/reasoning begins
 */
export type ReasoningStartPayload = BaseStreamEvent & {
  type: "reasoning:start";
  /** Thinking level (for Gemini 3) */
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
  /** Budget tokens (for Anthropic) */
  budgetTokens?: number;
};

/**
 * Emitted for reasoning content deltas
 */
export type ReasoningDeltaPayload = BaseStreamEvent & {
  type: "reasoning:delta";
  /** Reasoning text delta */
  delta: string;
  /** Thinking phase or step */
  phase?: string;
  /** Step number in reasoning chain */
  stepNumber?: number;
};

/**
 * Emitted when reasoning completes
 */
export type ReasoningEndPayload = BaseStreamEvent & {
  type: "reasoning:end";
  /** Complete reasoning text */
  reasoning: string;
  /** Reasoning tokens used */
  reasoningTokens?: number;
  /** Thinking signature/hash */
  thoughtSignature?: string;
  /** Structured thoughts array */
  thoughts?: Array<{
    id?: string;
    type?: string;
    content: string;
  }>;
};

// ============================================
// MESSAGE LIFECYCLE EVENTS
// ============================================

/**
 * Emitted when a message generation starts
 */
export type MessageStartPayload = BaseStreamEvent & {
  type: "message:start";
  /** Message role */
  role: "assistant" | "user" | "system" | "tool";
  /** Message ID */
  messageId: string;
  /** Provider name */
  provider?: string;
  /** Model name */
  model?: string;
  /** Step number in multi-step generation */
  stepNumber?: number;
};

/**
 * Emitted when a message generation completes
 */
export type MessageEndPayload = BaseStreamEvent & {
  type: "message:end";
  /** Message ID */
  messageId: string;
  /** Final message content */
  content?: string;
  /** Stop reason */
  finishReason: FinishReason;
  /** Token usage for this message */
  usage?: TokenUsage;
  /** Provider-specific response metadata */
  providerMetadata?: UnknownRecord;
};

// ============================================
// STRUCTURED OUTPUT EVENTS
// ============================================

/**
 * Emitted during partial object streaming
 */
export type ObjectDeltaPayload = BaseStreamEvent & {
  type: "object:delta";
  /** Partial object built so far */
  partialObject: JsonValue;
  /** JSON path being updated */
  currentPath?: string;
  /** Raw JSON text delta */
  jsonTextDelta?: string;
};

/**
 * Emitted when structured object is complete
 */
export type ObjectCompletePayload = BaseStreamEvent & {
  type: "object:complete";
  /** Complete parsed object */
  object: JsonValue;
  /** Whether object passed schema validation */
  valid: boolean;
  /** Validation errors if any */
  validationErrors?: string[];
};

// ============================================
// STEP EVENTS (Multi-step Generation)
// ============================================

/**
 * Emitted when a generation step begins
 */
export type StepStartPayload = BaseStreamEvent & {
  type: "step:start";
  /** Step number (1-indexed) */
  stepNumber: number;
  /** Maximum steps allowed */
  maxSteps: number;
  /** Step type */
  stepType: "initial" | "tool-response" | "continuation";
};

/**
 * Emitted when a generation step completes
 */
export type StepEndPayload = BaseStreamEvent & {
  type: "step:end";
  /** Step number */
  stepNumber: number;
  /** Step finish reason */
  finishReason: FinishReason;
  /** Whether more steps will follow */
  isContinued: boolean;
  /** Step token usage */
  usage?: TokenUsage;
  /** Tools called in this step */
  toolsCalled?: string[];
};

// ============================================
// AUDIO EVENTS (TTS)
// ============================================

/**
 * Emitted for audio chunk during TTS streaming
 */
export type AudioDeltaPayload = BaseStreamEvent & {
  type: "audio:delta";
  /** Audio data (base64 encoded) */
  data: string;
  /** Sample rate in Hz */
  sampleRateHz: number;
  /** Number of channels */
  channels: number;
  /** Encoding format */
  encoding: string;
  /** Duration of this chunk in ms */
  durationMs?: number;
};

/**
 * Emitted when audio generation completes
 */
export type AudioEndPayload = BaseStreamEvent & {
  type: "audio:end";
  /** Total audio duration in ms */
  totalDurationMs: number;
  /** Total audio size in bytes */
  totalSizeBytes: number;
  /** Audio format */
  format: string;
};

// ============================================
// IMAGE EVENTS
// ============================================

/**
 * Emitted when image generation completes
 */
export type ImageCompletePayload = BaseStreamEvent & {
  type: "image:complete";
  /** Base64-encoded image data */
  base64: string;
  /** Image MIME type */
  mimeType: string;
  /** Image width */
  width?: number;
  /** Image height */
  height?: number;
};

// ============================================
// ERROR EVENTS
// ============================================

/**
 * Error category types
 */
export type ErrorCategory =
  | "validation"
  | "execution"
  | "timeout"
  | "network"
  | "provider"
  | "rate_limit"
  | "content_filter";

/**
 * Emitted when an error occurs during streaming
 */
export type ErrorPayload = BaseStreamEvent & {
  type: "error";
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Whether error is retriable */
  retriable: boolean;
  /** Error category */
  category: ErrorCategory;
  /** Additional error context */
  context?: UnknownRecord;
};

// ============================================
// STREAM CONTROL EVENTS
// ============================================

/**
 * Emitted for keep-alive during long operations
 */
export type PingPayload = BaseStreamEvent & {
  type: "ping";
  /** Milliseconds since stream started */
  elapsedMs: number;
};

/**
 * Emitted when stream is done
 */
export type DonePayload = BaseStreamEvent & {
  type: "done";
  /** Total duration in ms */
  totalDurationMs: number;
  /** Total events emitted */
  totalEvents: number;
};

// ============================================
// UNION TYPES
// ============================================

/**
 * All text-related events
 */
export type TextStreamEvent =
  | TextStartPayload
  | TextDeltaPayload
  | TextEndPayload;

/**
 * All tool-related events
 */
export type ToolStreamEvent =
  | ToolCallStartPayload
  | ToolCallDeltaPayload
  | ToolCallPayload
  | ToolExecuteStartPayload
  | ToolResultPayload;

/**
 * All reasoning-related events
 */
export type ReasoningStreamEvent =
  | ReasoningStartPayload
  | ReasoningDeltaPayload
  | ReasoningEndPayload;

/**
 * All message lifecycle events
 */
export type MessageStreamEvent = MessageStartPayload | MessageEndPayload;

/**
 * All structured output events
 */
export type ObjectStreamEvent = ObjectDeltaPayload | ObjectCompletePayload;

/**
 * All step events
 */
export type StepStreamEvent = StepStartPayload | StepEndPayload;

/**
 * All audio events
 */
export type AudioStreamEvent = AudioDeltaPayload | AudioEndPayload;

/**
 * All possible stream event payloads (complete discriminated union)
 */
export type StreamEventPayload =
  | TextStartPayload
  | TextDeltaPayload
  | TextEndPayload
  | ToolCallStartPayload
  | ToolCallDeltaPayload
  | ToolCallPayload
  | ToolExecuteStartPayload
  | ToolResultPayload
  | ReasoningStartPayload
  | ReasoningDeltaPayload
  | ReasoningEndPayload
  | MessageStartPayload
  | MessageEndPayload
  | ObjectDeltaPayload
  | ObjectCompletePayload
  | StepStartPayload
  | StepEndPayload
  | AudioDeltaPayload
  | AudioEndPayload
  | ImageCompletePayload
  | ErrorPayload
  | PingPayload
  | DonePayload;

/**
 * Event type string literal union
 */
export type StreamEventType = StreamEventPayload["type"];

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Check if event is a text event
 */
export function isTextEvent(
  event: StreamEventPayload,
): event is TextStreamEvent {
  return event.type.startsWith("text:");
}

/**
 * Check if event is a tool event
 */
export function isToolEvent(
  event: StreamEventPayload,
): event is ToolStreamEvent {
  return event.type.startsWith("tool:");
}

/**
 * Check if event is a reasoning event
 */
export function isReasoningEvent(
  event: StreamEventPayload,
): event is ReasoningStreamEvent {
  return event.type.startsWith("reasoning:");
}

/**
 * Check if event is a message event
 */
export function isMessageEvent(
  event: StreamEventPayload,
): event is MessageStreamEvent {
  return event.type.startsWith("message:");
}

/**
 * Check if event is an object/structured output event
 */
export function isObjectEvent(
  event: StreamEventPayload,
): event is ObjectStreamEvent {
  return event.type.startsWith("object:");
}

/**
 * Check if event is a step event
 */
export function isStepEvent(
  event: StreamEventPayload,
): event is StepStreamEvent {
  return event.type.startsWith("step:");
}

/**
 * Check if event is an audio event
 */
export function isAudioEvent(
  event: StreamEventPayload,
): event is AudioStreamEvent {
  return event.type.startsWith("audio:");
}

/**
 * Check if event is an error event
 */
export function isErrorEvent(event: StreamEventPayload): event is ErrorPayload {
  return event.type === "error";
}

/**
 * Check if event carries content (text delta)
 */
export function isContentEvent(
  event: StreamEventPayload,
): event is TextDeltaPayload {
  return event.type === "text:delta";
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Configuration for stream event emission
 */
export type StreamEventEmitterConfig = {
  /** Provider name */
  provider?: string;
  /** Model name */
  model?: string;
  /** Emit reasoning events separately */
  emitReasoningEvents?: boolean;
  /** Include accumulated text in deltas */
  includeAccumulated?: boolean;
  /** Maximum steps for multi-step generation */
  maxSteps?: number;
  /** Stream ID for correlation */
  streamId?: string;
};

/**
 * Stream metadata for tracking
 */
export type StreamMetadata = {
  streamId: string;
  startTime: number;
  provider: string;
  model: string;
  totalEvents?: number;
  totalChunks?: number;
  responseTime?: number;
  fallback?: boolean;
  totalToolExecutions?: number;
  toolExecutionTime?: number;
  hasToolErrors?: boolean;
  guardrailsBlocked?: boolean;
  error?: string;
  thoughtSignature?: string;
  thoughts?: Array<{ id?: string; type?: string; content?: string }>;
};

/**
 * Event handler type for stream consumers
 */
export type StreamEventHandler<
  T extends StreamEventPayload = StreamEventPayload,
> = (event: T) => void | Promise<void>;

/**
 * Filter predicate for stream events
 */
export type StreamEventFilter = (event: StreamEventPayload) => boolean;
