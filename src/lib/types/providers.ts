/**
 * Provider-specific type definitions for NeuroLink
 */

import type { UnknownRecord, JsonValue } from "./common.js";

/**
 * Generic AI SDK model interface
 */
export interface AISDKModel {
  // This will be refined based on actual AI SDK types
  [key: string]: unknown;
}

/**
 * Provider error information
 */
export interface ProviderError extends Error {
  code?: string | number;
  statusCode?: number;
  provider?: string;
  originalError?: unknown;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

/**
 * Analytics data structure
 */
export interface AnalyticsData {
  provider: string;
  model?: string;
  tokenUsage: TokenUsage;
  requestDuration: number;
  timestamp: string;
  cost?: number;
  context?: JsonValue;
}

/**
 * AWS Credential Configuration for Bedrock provider
 */
export interface AWSCredentialConfig {
  region?: string;
  profile?: string;
  roleArn?: string;
  roleSessionName?: string;
  timeout?: number;
  /** @deprecated Prefer maxAttempts to match AWS SDK v3 config */
  maxRetries?: number;
  /** Number of attempts as per AWS SDK v3 ("retry-mode") */
  maxAttempts?: number;
  enableDebugLogging?: boolean;
  /** Optional service endpoint override (e.g., VPC/Gov endpoints) */
  endpoint?: string;
}

/**
 * AWS Credential Validation Result
 */
export interface CredentialValidationResult {
  isValid: boolean;
  credentialSource: string;
  region: string;
  hasExpiration: boolean;
  expirationTime?: Date;
  error?: string;
  debugInfo: {
    accessKeyId: string;
    hasSessionToken: boolean;
    providerConfig: Readonly<Required<AWSCredentialConfig>>;
  };
}

/**
 * Service Connectivity Test Result
 */
export interface ServiceConnectivityResult {
  bedrockAccessible: boolean;
  availableModels: number;
  responseTimeMs: number;
  error?: string;
  sampleModels: string[];
}

/**
 * Model Capabilities - Maximally Reusable
 */
export type ModelCapability =
  | "text"
  | "vision"
  | "function-calling"
  | "embedding"
  | "audio"
  | "video"
  | "code"
  | "reasoning"
  | "multimodal";

/**
 * Model Use Cases - High Reusability
 */
export type ModelUseCase =
  | "chat"
  | "completion"
  | "analysis"
  | "coding"
  | "creative"
  | "reasoning"
  | "translation"
  | "summarization"
  | "classification";

/**
 * Model Filter Configuration - High Reusability
 */
export interface ModelFilter {
  provider?: string;
  capability?: ModelCapability;
  useCase?: ModelUseCase;
  requireVision?: boolean;
  requireFunctionCalling?: boolean;
  maxTokens?: number;
  costLimit?: number;
}

/**
 * Model Resolution Context - High Reusability
 */
export interface ModelResolutionContext {
  requireCapabilities?: ModelCapability[];
  preferredProviders?: string[];
  useCase?: ModelUseCase;
  budgetConstraints?: {
    maxCostPerRequest?: number;
    maxTokens?: number;
  };
  performance?: {
    maxLatency?: number;
    minQuality?: number;
  };
}

/**
 * Model Statistics Object - High Reusability
 */
export interface ModelStats {
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  useCases: ModelUseCase[];
  performance: {
    avgLatency?: number;
    avgTokensPerSecond?: number;
    reliability?: number;
  };
  pricing?: ModelPricing;
  metadata: {
    [key: string]: JsonValue;
  } & {
    version?: string;
    lastUpdated?: Date;
  };
}

/**
 * Model Pricing Information - High Reusability
 */
export interface ModelPricing {
  inputTokens?: {
    price: number;
    currency: string;
    per: number;
  };
  outputTokens?: {
    price: number;
    currency: string;
    per: number;
  };
  requestPrice?: {
    price: number;
    currency: string;
  };
  tier?: "free" | "basic" | "premium" | "enterprise";
  // Additional properties for models command compatibility
  average?: number;
  min?: number;
  max?: number;
  free?: boolean;
}

/**
 * Response quality evaluation scores - Comprehensive evaluation interface
 */
export interface EvaluationData {
  // Core scores (1-10 scale) - Compatible with GenerateResult format
  relevance: number; // How well response addresses query intent and domain alignment
  accuracy: number; // Factual correctness and terminological accuracy
  completeness: number; // How completely the response addresses the query
  overall: number; // Overall quality (derived from above scores)
  domainAlignment?: number;
  terminologyAccuracy?: number;
  toolEffectiveness?: number;

  // Advanced insights
  isOffTopic: boolean; // True if response significantly deviates from query/domain
  alertSeverity: "low" | "medium" | "high" | "none"; // Quality alert level
  reasoning: string; // Brief justification for scores (max 150 words)
  suggestedImprovements?: string; // How to improve the response (max 100 words)

  // Metadata
  evaluationModel: string; // Model used for evaluation
  evaluationTime: number; // Time taken for evaluation (ms)
  evaluationDomain?: string; // Domain for evaluation (e.g., "healthcare", "analytics")

  // Enhanced metadata
  evaluationProvider?: string; // Provider used for evaluation
  evaluationAttempt?: number; // Attempt number (for retry logic)
  evaluationConfig?: {
    mode: string;
    fallbackUsed: boolean;
    costEstimate: number;
  };

  // Domain configuration support
  domainConfig?: {
    domainName: string;
    domainDescription: string;
    keyTerms: string[];
    failurePatterns: string[];
    successPatterns: string[];
    evaluationCriteria?: Record<string, unknown>;
  };

  // Domain-specific evaluation metadata
  domainEvaluation?: {
    domainRelevance: number;
    terminologyAccuracy: number;
    domainExpertise: number;
    domainSpecificInsights: string[];
  };
}

/**
 * Enhanced evaluation context for comprehensive response assessment
 */
export interface EvaluationContext {
  userQuery: string;
  aiResponse: string;
  context?: Record<string, unknown>;
  primaryDomain?: string;
  assistantRole?: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
  }>;
  toolUsage?: Array<{
    toolName: string;
    input: unknown;
    output: unknown;
    executionTime: number;
  }>;
  expectedOutcome?: string;
  evaluationCriteria?: string[];
}

/**
 * Evaluation result interface that extends EvaluationData with additional context
 */
export interface EvaluationResult extends EvaluationData {
  contextUtilization?: {
    conversationUsed: boolean;
    toolsUsed: boolean;
    domainKnowledgeUsed: boolean;
  };
  evaluationContext?: {
    domain: string;
    toolsEvaluated: string[];
    conversationTurns: number;
  };
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsImages: boolean;
  supportsAudio: boolean;
  maxTokens?: number;
  supportedModels: string[];
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
  model?: string;
  [key: string]: unknown;
}

/**
 * Amazon Bedrock specific types
 */
export namespace BedrockTypes {
  export interface Client {
    // Based on AWS SDK Bedrock types
    send(command: unknown): Promise<unknown>;
    config: {
      region?: string;
      credentials?: unknown;
    };
  }

  export interface InvokeModelCommand {
    // Based on AWS SDK types
    input: {
      modelId: string;
      body: string;
      contentType?: string;
    };
  }
}

/**
 * Mistral specific types
 */
export namespace MistralTypes {
  export interface Client {
    // Based on Mistral SDK types
    chat?: {
      complete?: (options: unknown) => Promise<unknown>;
      stream?: (options: unknown) => AsyncIterable<unknown>;
    };
  }
}

/**
 * OpenTelemetry specific types (for telemetry service)
 */
export namespace TelemetryTypes {
  export interface Meter {
    createCounter(name: string, options?: unknown): Counter;
    createHistogram(name: string, options?: unknown): Histogram;
  }

  export interface Tracer {
    startSpan(name: string, options?: unknown): Span;
  }

  export interface Counter {
    add(value: number, attributes?: UnknownRecord): void;
  }

  export interface Histogram {
    record(value: number, attributes?: UnknownRecord): void;
  }

  export interface Span {
    end(): void;
    setStatus(status: unknown): void;
    recordException(exception: unknown): void;
  }
}

/**
 * Provider factory function type
 */
export type ProviderFactory = (
  modelName?: string,
  providerName?: string,
  sdk?: unknown,
) => Promise<unknown>;

/**
 * Provider constructor type
 */
export interface ProviderConstructor {
  new (modelName?: string, providerName?: string, sdk?: unknown): unknown;
}

/**
 * Provider registration entry
 */
export interface ProviderRegistration {
  name: string;
  constructor: ProviderConstructor | ProviderFactory;
  capabilities?: ProviderCapabilities;
  defaultConfig?: ProviderConfig;
}

/**
 * Type guard for provider error
 */
export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof Error && "provider" in error;
}

/**
 * Type guard for token usage
 */
export function isTokenUsage(value: unknown): value is TokenUsage {
  return (
    typeof value === "object" &&
    value !== null &&
    "input" in value &&
    "output" in value &&
    "total" in value &&
    typeof (value as TokenUsage).input === "number" &&
    typeof (value as TokenUsage).output === "number" &&
    typeof (value as TokenUsage).total === "number"
  );
}
