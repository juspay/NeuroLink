/**
 * NeuroLink Streaming Module
 *
 * Provides streaming utilities that work with the existing StreamResult pattern:
 * - Backpressure control and flow management
 * - Error recovery with typed errors and retry strategies
 * - Client integration (Node.js, Web, React adapters)
 * - SSE encoding/decoding for HTTP streaming
 * - Multi-agent network orchestration
 * - Workflow DAG streaming execution
 * - Structured output (partial JSON) streaming
 * - Multi-modal stream processing
 *
 * @module streaming
 */

// ============================================
// ERROR RECOVERY - Retry and fallback patterns
// ============================================

export {
  // Error classes
  StreamError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ProviderError as StreamProviderError,
  ValidationError,
  ContentFilterError,

  // Error classification
  categorizeError,
  extractErrorCode,
  isRetriableError,
  calculateRetryDelay,
  sleep,

  // Retry utilities
  withRetry,
  withStreamRetry,
  withProviderFallback,
  withStreamRecovery,

  // Config constants
  DEFAULT_RETRY_CONFIG,
  AGGRESSIVE_RETRY_CONFIG,
  CONSERVATIVE_RETRY_CONFIG,
} from "./errorRecovery.js";

export type {
  ErrorCategory,
  RetryConfig as StreamRetryConfig,
  ProviderFallbackConfig,
  FallbackResult,
  StreamRecoveryOptions,
} from "./errorRecovery.js";

// ============================================
// DATA STREAM PROTOCOL - SSE encoding/decoding
// ============================================

export {
  // SSE encoding/decoding
  encodeSSE,
  encodeSSEBatch,
  encodeSSEDone,
  parseSSELine,

  // SSE Response creation
  toSSEResponse,
  createDataStreamResponse, // legacy alias
  parseSSEResponse,
  parseDataStream, // legacy alias

  // Data parts for custom metadata in SSE
  createDataPart,
  createStatusPart,
  createProgressPart,
  createMetadataPart,

  // Usage conversion
  toAISDKUsage,
  fromAISDKUsage,
} from "./dataStreamProtocol.js";

export type {
  SSEResponseOptions,
  DataPartType,
  DataPart,
} from "./dataStreamProtocol.js";

// ============================================
// BACKPRESSURE HANDLING - Flow control
// ============================================

export {
  BackpressureController,
  withBackpressure,
  AdaptiveRateController,
  DEFAULT_BACKPRESSURE_CONFIG,
} from "./backpressure.js";

export type { BackpressureConfig, BackpressureState } from "./backpressure.js";

// ============================================
// CLIENT INTEGRATION - Consumer patterns
// ============================================

export {
  // Stream consumers
  consumeStream,
  consumeStreamWithState,
  createInitialStreamState,

  // Node.js adapters
  toNodeReadable,
  toTextNodeReadable,
  pipeToWritable,

  // Web stream adapters
  toWebReadableStream,
  toTextWebReadableStream,

  // Iterator utilities
  withTimeout,
  bufferStream,
  debounceStream,
  throttleStream,

  // Stream multiplexing
  teeStream,
  mergeStreams,
} from "./clientIntegration.js";

export type {
  OnTextDeltaCallback,
  OnCompleteCallback,
  OnErrorCallback,
  StreamConsumerOptions,
  StreamState,
  StreamStateUpdater,
} from "./clientIntegration.js";

// ============================================
// STRUCTURED STREAMING - Partial object streaming
// ============================================

export {
  PartialObjectStreamer,
  createPartialObjectStream,
  collectPartialObjectStream,
  subscribeToPartialObject,
} from "./structuredStreaming.js";

export type {
  PartialObjectStreamerConfig,
  JSONSchemaDefinition,
} from "./structuredStreaming.js";

// ============================================
// MULTI-MODAL STREAMING - Audio, images, mixed content
// ============================================

export {
  MultiModalStreamHandler,
  AudioStreamProcessor,
  ImageStreamProcessor,
  MixedContentCombiner,
  createMultiModalHandler,
  createAudioProcessor,
  createImageProcessor,
  createMixedContentCombiner,
  isMultiModalContent,
  DEFAULT_MULTIMODAL_CONFIG,
} from "./multiModalStreaming.js";

export type {
  ContentType,
  MultiModalContent,
  AudioFormat as StreamAudioFormat,
  ImageFormat,
  VideoFormat,
  MultiModalStreamConfig,
} from "./multiModalStreaming.js";

// ============================================
// AGENT NETWORK STREAMING - Multi-agent orchestration
// ============================================

export {
  MastraAgentNetworkStream,
  createAgentNetworkStream,
  DEFAULT_NETWORK_CONFIG,
} from "./agentNetworkStream.js";

export type {
  AgentEntry,
  AgentResult,
  OrchestrationMode,
  AgentNetworkConfig,
} from "./agentNetworkStream.js";

// ============================================
// WORKFLOW STREAMING - Step-by-step execution
// ============================================

export {
  MastraWorkflowStream,
  createWorkflowStream,
  isWorkflowStreamEvent,
  WorkflowBuilder,
  DEFAULT_WORKFLOW_CONFIG,
} from "./workflowStream.js";

export type {
  WorkflowStep,
  WorkflowDefinition,
  WorkflowContext,
  StepResult,
  WorkflowStreamConfig,
  WorkflowStreamEvent,
  WorkflowStartEvent,
  WorkflowStepStartEvent,
  WorkflowStepDeltaEvent,
  WorkflowStepEndEvent,
  WorkflowVariableEvent,
  WorkflowBranchEvent,
  WorkflowLoopEvent,
  WorkflowEndEvent,
  WorkflowErrorEvent,
  WorkflowExecutors,
  AIStepExecutor,
} from "./workflowStream.js";

// ============================================
// PROVIDER INTEGRATION - Stream utilities
// ============================================

export {
  StreamObserver,
  createStreamObserver,
  collectStreamText,
  countStreamChunks,
  measureStreamPerformance,
} from "./providerIntegration.js";

// ============================================
// RE-EXPORTS FROM CORE MODULES
// ============================================

export { StreamHandler } from "../core/modules/StreamHandler.js";

export type {
  StreamOptions,
  StreamResult,
  StreamChunk as LegacyStreamChunk,
  ToolCall as StreamingToolCall,
  ToolResult as StreamingToolResult,
  StreamingProgressData,
  StreamingMetadata,
  ProgressCallback,
} from "../types/streamTypes.js";
