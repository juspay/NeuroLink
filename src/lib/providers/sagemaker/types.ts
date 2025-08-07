/**
 * TypeScript type definitions for Amazon SageMaker Provider
 *
 * This module contains all interfaces and types for SageMaker integration
 * with the NeuroLink ecosystem and Vercel AI SDK compatibility.
 */

/**
 * AWS configuration options for SageMaker client
 */
export interface SageMakerConfig {
  /** AWS region for SageMaker service */
  region: string;
  /** AWS access key ID */
  accessKeyId: string;
  /** AWS secret access key */
  secretAccessKey: string;
  /** AWS session token (optional, for temporary credentials) */
  sessionToken?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Custom SageMaker endpoint URL (optional) */
  endpoint?: string;
}

/**
 * Model-specific configuration for SageMaker endpoints
 */
export interface SageMakerModelConfig {
  /** SageMaker endpoint name */
  endpointName: string;
  /** Model type for request/response formatting */
  modelType?:
    | "llama"
    | "mistral"
    | "claude"
    | "huggingface"
    | "jumpstart"
    | "custom";
  /** Content type for requests */
  contentType?: string;
  /** Accept header for responses */
  accept?: string;
  /** Custom attributes for the endpoint */
  customAttributes?: string;
  /** Input format specification */
  inputFormat?: "huggingface" | "jumpstart" | "custom";
  /** Output format specification */
  outputFormat?: "huggingface" | "jumpstart" | "custom";
  /** Maximum tokens for generation */
  maxTokens?: number;
  /** Temperature parameter */
  temperature?: number;
  /** Top-p parameter */
  topP?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Initial concurrency for batch processing */
  initialConcurrency?: number;
  /** Maximum concurrency for batch processing */
  maxConcurrency?: number;
  /** Minimum concurrency for batch processing */
  minConcurrency?: number;
  /** Maximum concurrent detection tests */
  maxConcurrentDetectionTests?: number;
}

/**
 * SageMaker endpoint information and metadata
 */
export interface SageMakerEndpointInfo {
  /** Endpoint name */
  endpointName: string;
  /** Endpoint ARN */
  endpointArn: string;
  /** Associated model name */
  modelName: string;
  /** EC2 instance type */
  instanceType: string;
  /** Endpoint creation timestamp */
  creationTime: string; // ISO 8601 date string
  /** Last modification timestamp */
  lastModifiedTime: string; // ISO 8601 date string
  /** Current endpoint status */
  endpointStatus:
    | "InService"
    | "Creating"
    | "Updating"
    | "SystemUpdating"
    | "RollingBack"
    | "Deleting"
    | "Failed";
  /** Current instance count */
  currentInstanceCount?: number;
  /** Variant weights for A/B testing */
  productionVariants?: Array<{
    variantName: string;
    modelName: string;
    initialInstanceCount: number;
    instanceType: string;
    currentWeight?: number;
  }>;
}

/**
 * Token usage and billing information
 */
export interface SageMakerUsage {
  /** Number of prompt tokens */
  promptTokens: number;
  /** Number of completion tokens */
  completionTokens: number;
  /** Total tokens used */
  totalTokens: number;
  /** Request processing time in milliseconds */
  requestTime?: number;
  /** Model inference time in milliseconds */
  inferenceTime?: number;
  /** Estimated cost in USD */
  estimatedCost?: number;
}

/**
 * Parameters for SageMaker endpoint invocation
 */
export interface InvokeEndpointParams {
  /** Endpoint name to invoke */
  EndpointName: string;
  /** Request body as string or Uint8Array */
  Body: string | Uint8Array;
  /** Content type of the request */
  ContentType?: string;
  /** Accept header for response format */
  Accept?: string;
  /** Custom attributes for the request */
  CustomAttributes?: string;
  /** Target model for multi-model endpoints */
  TargetModel?: string;
  /** Target variant for A/B testing */
  TargetVariant?: string;
  /** Inference ID for request tracking */
  InferenceId?: string;
}

/**
 * Response from SageMaker endpoint invocation
 */
export interface InvokeEndpointResponse {
  /** Response body */
  Body?: Uint8Array;
  /** Content type of the response */
  ContentType?: string;
  /** Invoked production variant */
  InvokedProductionVariant?: string;
  /** Custom attributes in the response */
  CustomAttributes?: string;
}

/**
 * Streaming response chunk from SageMaker
 */
export interface SageMakerStreamChunk {
  /** Text content in the chunk */
  content?: string;
  /** Indicates if this is the final chunk */
  done?: boolean;
  /** Usage information (only in final chunk) */
  usage?: SageMakerUsage;
  /** Error information if chunk contains error */
  error?: string;
  /** Finish reason for generation */
  finishReason?:
    | "stop"
    | "length"
    | "tool-calls"
    | "content-filter"
    | "unknown";
  /** Tool call in progress (Phase 2.3) */
  toolCall?: SageMakerStreamingToolCall;
  /** Tool result chunk (Phase 2.3) */
  toolResult?: SageMakerStreamingToolResult;
  /** Structured output streaming (Phase 2.3) */
  structuredOutput?: SageMakerStructuredOutput;
}

/**
 * Tool call information for function calling
 */
export interface SageMakerToolCall {
  /** Tool call identifier */
  id: string;
  /** Tool/function name */
  name: string;
  /** Tool arguments as JSON object */
  arguments: Record<string, unknown>;
  /** Tool call type */
  type: "function";
}

/**
 * Tool result information
 */
export interface SageMakerToolResult {
  /** Tool call identifier */
  toolCallId: string;
  /** Tool name */
  toolName: string;
  /** Tool result data */
  result: unknown;
  /** Execution status */
  status: "success" | "error";
  /** Error message if status is error */
  error?: string;
}

/**
 * Streaming tool call information (Phase 2.3)
 */
export interface SageMakerStreamingToolCall {
  /** Tool call identifier */
  id: string;
  /** Tool/function name */
  name?: string;
  /** Partial or complete arguments as JSON string */
  arguments?: string;
  /** Tool call type */
  type: "function";
  /** Indicates if this tool call is complete */
  complete?: boolean;
  /** Delta text for incremental argument building */
  argumentsDelta?: string;
}

/**
 * Streaming tool result information (Phase 2.3)
 */
export interface SageMakerStreamingToolResult {
  /** Tool call identifier */
  toolCallId: string;
  /** Tool name */
  toolName: string;
  /** Partial or complete result data */
  result?: unknown;
  /** Result delta for incremental responses */
  resultDelta?: string;
  /** Execution status */
  status: "pending" | "running" | "success" | "error";
  /** Error message if status is error */
  error?: string;
  /** Indicates if this result is complete */
  complete?: boolean;
}

/**
 * Structured output streaming information (Phase 2.3)
 */
export interface SageMakerStructuredOutput {
  /** Partial JSON object being built */
  partialObject?: Record<string, unknown>;
  /** JSON delta text */
  jsonDelta?: string;
  /** Current parsing path (e.g., "user.name") */
  currentPath?: string;
  /** Schema validation errors */
  validationErrors?: string[];
  /** Indicates if JSON is complete and valid */
  complete?: boolean;
  /** JSON schema being validated against */
  schema?: Record<string, unknown>;
}

/**
 * Enhanced generation request options
 */
export interface SageMakerGenerationOptions {
  /** Input prompt text */
  prompt: string;
  /** System prompt for context */
  systemPrompt?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for randomness (0-1) */
  temperature?: number;
  /** Top-p nucleus sampling (0-1) */
  topP?: number;
  /** Top-k sampling */
  topK?: number;
  /** Stop sequences to end generation */
  stopSequences?: string[];
  /** Enable streaming response */
  stream?: boolean;
  /** Tools available for function calling */
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  /** Tool choice mode */
  toolChoice?: "auto" | "none" | { type: "tool"; name: string };
}

/**
 * Generation response from SageMaker
 */
export interface SageMakerGenerationResponse {
  /** Generated text content */
  text: string;
  /** Token usage information */
  usage: SageMakerUsage;
  /** Finish reason for generation */
  finishReason: "stop" | "length" | "tool-calls" | "content-filter" | "unknown";
  /** Tool calls made during generation */
  toolCalls?: SageMakerToolCall[];
  /** Tool results if tools were executed */
  toolResults?: SageMakerToolResult[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Model version or identifier */
  modelVersion?: string;
}

/**
 * Error codes specific to SageMaker operations
 */
export type SageMakerErrorCode =
  | "VALIDATION_ERROR"
  | "MODEL_ERROR"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "CREDENTIALS_ERROR"
  | "NETWORK_ERROR"
  | "ENDPOINT_NOT_FOUND"
  | "THROTTLING_ERROR"
  | "UNKNOWN_ERROR";

/**
 * SageMaker-specific error information
 */
export interface SageMakerErrorInfo {
  /** Error code */
  code: SageMakerErrorCode;
  /** Human-readable error message */
  message: string;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Original error from AWS SDK */
  cause?: Error;
  /** Endpoint name where error occurred */
  endpoint?: string;
  /** Request ID for debugging */
  requestId?: string;
  /** Retry suggestion */
  retryable?: boolean;
}

/**
 * Batch inference job configuration
 */
export interface BatchInferenceConfig {
  /** Input S3 location */
  inputS3Uri: string;
  /** Output S3 location */
  outputS3Uri: string;
  /** SageMaker model name */
  modelName: string;
  /** Instance type for batch job */
  instanceType: string;
  /** Instance count for batch job */
  instanceCount: number;
  /** Maximum payload size in MB */
  maxPayloadInMB?: number;
  /** Batch strategy */
  batchStrategy?: "MultiRecord" | "SingleRecord";
}

/**
 * Model deployment configuration
 */
export interface ModelDeploymentConfig {
  /** Model name */
  modelName: string;
  /** Endpoint name */
  endpointName: string;
  /** EC2 instance type */
  instanceType: string;
  /** Initial instance count */
  initialInstanceCount: number;
  /** Model data S3 location */
  modelDataUrl: string;
  /** Container image URI */
  image: string;
  /** IAM execution role ARN */
  executionRoleArn: string;
  /** Resource tags */
  tags?: Record<string, string>;
  /** Auto scaling configuration */
  autoScaling?: {
    minCapacity: number;
    maxCapacity: number;
    targetValue: number;
    scaleUpCooldown: number;
    scaleDownCooldown: number;
  };
}

/**
 * Endpoint metrics and monitoring data
 */
export interface EndpointMetrics {
  /** Endpoint name */
  endpointName: string;
  /** Total invocations */
  invocations: number;
  /** Average latency in milliseconds */
  averageLatency: number;
  /** Error rate percentage */
  errorRate: number;
  /** CPU utilization percentage */
  cpuUtilization?: number;
  /** Memory utilization percentage */
  memoryUtilization?: number;
  /** Instance count */
  instanceCount: number;
  /** Timestamp of metrics */
  timestamp: string; // ISO 8601 date string
}

/**
 * Cost estimation data
 */
export interface CostEstimate {
  /** Estimated cost in USD */
  estimatedCost: number;
  /** Currency code */
  currency: string;
  /** Cost breakdown */
  breakdown: {
    /** Instance hours cost */
    instanceCost: number;
    /** Request-based cost */
    requestCost: number;
    /** Total processing hours */
    totalHours: number;
  };
  /** Time period for estimate */
  period?: {
    start: string; // ISO 8601 date string
    end: string; // ISO 8601 date string
  };
}

/**
 * SageMaker generation result interface for better type safety
 */
export interface SageMakerGenerateResult {
  text?: string;
  reasoning?:
    | string
    | Array<
        | { type: "text"; text: string; signature?: string }
        | { type: "redacted"; data: string }
      >;
  files?: Array<{ data: string | Uint8Array; mimeType: string }>;
  logprobs?: Array<{
    token: string;
    logprob: number;
    topLogprobs: Array<{ token: string; logprob: number }>;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  finishReason:
    | "stop"
    | "length"
    | "content-filter"
    | "tool-calls"
    | "error"
    | "unknown";
  warnings?: Array<{ type: "other"; message: string }>;
  rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
  rawResponse?: { headers?: Record<string, string> };
  request?: { body?: string };
  toolCalls?: SageMakerToolCall[];
  object?: unknown;
}
