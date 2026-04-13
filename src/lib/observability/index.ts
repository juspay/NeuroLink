/**
 * Observability Module
 * Multi-platform observability with OpenTelemetry integration
 */

// Core - Registry with singleton pattern
export {
  ExporterRegistry,
  getExporterRegistry,
  resetExporterRegistry,
} from "./exporterRegistry.js";
export { ArizeExporter } from "./exporters/arizeExporter.js";

// Exporters
export { BaseExporter, NoOpExporter } from "./exporters/baseExporter.js";
export { BraintrustExporter } from "./exporters/braintrustExporter.js";
export { DatadogExporter } from "./exporters/datadogExporter.js";
export { LaminarExporter } from "./exporters/laminarExporter.js";
export { LangfuseExporter } from "./exporters/langfuseExporter.js";
export { LangSmithExporter } from "./exporters/langsmithExporter.js";
export { OtelExporter } from "./exporters/otelExporter.js";
export { PostHogExporter } from "./exporters/posthogExporter.js";
export { SentryExporter } from "./exporters/sentryExporter.js";
// Metrics Aggregation with singleton pattern
export {
  getMetricsAggregator,
  MetricsAggregator,
  resetMetricsAggregator,
} from "./metricsAggregator.js";
export { OtelBridge } from "./otelBridge.js";
// Retry Policies
export {
  BaseRetryPolicy,
  CircuitBreakerAwarePolicy,
  ExponentialBackoffPolicy,
  FixedDelayPolicy,
  LinearBackoffPolicy,
  NoRetryPolicy,
  RetryExecutor,
  RetryPolicyFactory,
} from "./retryPolicy.js";
// Sampling
export {
  AlwaysSampler,
  AttributeBasedSampler,
  CompositeSampler,
  CustomSampler,
  ErrorOnlySampler,
  NeverSampler,
  PrioritySampler,
  RatioSampler,
  SamplerFactory,
  TraceIdRatioSampler,
} from "./sampling/samplers.js";
// Span Processing
export {
  AttributeEnrichmentProcessor,
  BatchProcessor,
  CompositeProcessor,
  FilterProcessor,
  PassThroughProcessor,
  RedactionProcessor,
  SpanProcessorFactory,
  TruncationProcessor,
} from "./spanProcessor.js";
export {
  enrichSpanWithTokenUsage,
  getTokenTracker,
  resetTokenTracker,
  TokenTracker,
} from "./tokenTracker.js";

// Types
export {
  AGENT_ATTRIBUTES,
  GENAI_ATTRIBUTES,
  SpanStatus,
  SpanType,
} from "../types/index.js";
// Utilities
export { SpanSerializer } from "./utils/spanSerializer.js";
