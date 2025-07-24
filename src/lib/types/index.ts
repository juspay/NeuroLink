/**
 * Centralized type exports for NeuroLink
 * Provides type-safe alternatives to 'any' usage throughout the codebase
 */

// Common utility types
export * from "./common.js";

// Tool system types
export * from "./tools.js";

// Provider types
export * from "./providers.js";

// CLI types
export * from "./cli.js";

// Re-export commonly used types for convenience
export type {
  Unknown,
  UnknownRecord,
  UnknownArray,
  JsonValue,
  JsonObject,
  JsonArray,
  ErrorInfo,
  Result,
  FunctionParameters,
} from "./common.js";

export type {
  ToolArgs,
  ToolContext,
  ToolResult,
  ToolDefinition,
  SimpleTool,
  AvailableTool,
  ToolExecution,
} from "./tools.js";

export type {
  AISDKModel,
  ProviderError,
  TokenUsage,
  AnalyticsData,
  EvaluationData,
  ProviderConfig,
} from "./providers.js";

export type {
  BaseCommandArgs,
  GenerateCommandArgs,
  CommandResult,
  GenerateResult,
  StreamChunk,
} from "./cli.js";
