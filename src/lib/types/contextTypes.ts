/**
 * Context Types for NeuroLink - Factory Pattern Implementation
 * Provides type-safe context integration for AI generation
 */

import { JsonValue, JsonObject } from "./common.js";

/**
 * Base context interface for all AI operations
 */
export interface BaseContext {
  // Core identification
  userId?: string;
  sessionId?: string;
  requestId?: string;

  // User information
  userRole?: string;
  userPreferences?: JsonObject;
  userMetadata?: JsonObject;

  // Application context
  applicationContext?: {
    name: string;
    version?: string;
    environment?: "development" | "staging" | "production";
  };

  // Business context
  organizationId?: string;
  departmentId?: string;
  projectId?: string;

  // Index signature for flexible access
  [key: string]: unknown;
}

/**
 * Context integration mode types
 */
export type ContextIntegrationMode =
  | "prompt_prefix" // Add context as prompt prefix
  | "prompt_suffix" // Add context as prompt suffix
  | "system_prompt" // Include context in system prompt
  | "metadata_only" // Context for analytics/tracking only
  | "structured_prompt" // Structure context within prompt
  | "none"; // No integration (default)

/**
 * Context configuration for AI generation
 */
export interface ContextConfig {
  mode: ContextIntegrationMode;
  includeInPrompt?: boolean;
  includeInAnalytics?: boolean;
  includeInEvaluation?: boolean;
  template?: string; // Custom template for context integration
  maxLength?: number; // Maximum context length to include
}

/**
 * Context processing result
 */
export interface ProcessedContext {
  originalContext: BaseContext;
  processedContext: string | null;
  config: ContextConfig;
  metadata: {
    truncated: boolean;
    processingTime: number;
    template: string;
    mode: ContextIntegrationMode;
  };
}

/**
 * Factory for context processing
 */
export class ContextFactory {
  /**
   * Default context configuration
   */
  static readonly DEFAULT_CONFIG: ContextConfig = {
    mode: "metadata_only",
    includeInPrompt: false,
    includeInAnalytics: true,
    includeInEvaluation: true,
    maxLength: 1000,
  };

  /**
   * Validate and normalize context data
   */
  static validateContext(context: unknown): BaseContext | null {
    if (!context || typeof context !== "object") {
      return null;
    }

    try {
      // Ensure it's JSON serializable
      const serialized = JSON.stringify(context);
      const parsed = JSON.parse(serialized) as BaseContext;

      // Basic validation
      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Process context for AI generation based on configuration
   */
  static processContext(
    context: BaseContext,
    config: Partial<ContextConfig> = {},
  ): ProcessedContext {
    const startTime = Date.now();
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    let processedContext: string | null = null;
    const template = "default";
    let truncated = false;

    if (finalConfig.includeInPrompt && finalConfig.mode !== "metadata_only") {
      processedContext = this.formatContextForPrompt(context, finalConfig);

      // Truncate if necessary
      if (
        finalConfig.maxLength &&
        processedContext.length > finalConfig.maxLength
      ) {
        processedContext =
          processedContext.substring(0, finalConfig.maxLength) + "...";
        truncated = true;
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      originalContext: context,
      processedContext,
      config: finalConfig,
      metadata: {
        truncated,
        processingTime,
        template,
        mode: finalConfig.mode,
      },
    };
  }

  /**
   * Format context for prompt integration
   */
  private static formatContextForPrompt(
    context: BaseContext,
    config: ContextConfig,
  ): string {
    switch (config.mode) {
      case "prompt_prefix":
        return this.formatAsPrefix(context);

      case "prompt_suffix":
        return this.formatAsSuffix(context);

      case "system_prompt":
        return this.formatForSystemPrompt(context);

      case "structured_prompt":
        return this.formatStructured(context);

      case "metadata_only":
      case "none":
      default:
        return "";
    }
  }

  /**
   * Format context as prompt prefix
   */
  private static formatAsPrefix(context: BaseContext): string {
    const parts: string[] = [];

    if (context.userId) {
      parts.push(`User: ${context.userId}`);
    }

    if (context.userRole) {
      parts.push(`Role: ${context.userRole}`);
    }

    if (context.sessionId) {
      parts.push(`Session: ${context.sessionId}`);
    }

    if (parts.length === 0) {
      return "";
    }

    return `Context: ${parts.join(", ")}\n\n`;
  }

  /**
   * Format context as prompt suffix
   */
  private static formatAsSuffix(context: BaseContext): string {
    const relevantKeys = Object.keys(context).filter(
      (key) => !["userId", "sessionId", "requestId"].includes(key),
    );

    if (relevantKeys.length === 0) {
      return "";
    }

    const contextData = relevantKeys.reduce(
      (acc, key) => {
        acc[key] = context[key] as JsonValue;
        return acc;
      },
      {} as Record<string, JsonValue>,
    );

    return `\n\nAdditional Context: ${JSON.stringify(contextData, null, 2)}`;
  }

  /**
   * Format context for system prompt
   */
  private static formatForSystemPrompt(context: BaseContext): string {
    const parts: string[] = [];

    if (context.userRole) {
      parts.push(`You are assisting a user with the role: ${context.userRole}`);
    }

    if (context.organizationId) {
      parts.push(`Organization context: ${context.organizationId}`);
    }

    if (context.userPreferences) {
      parts.push(
        `User preferences: ${JSON.stringify(context.userPreferences)}`,
      );
    }

    return parts.join(". ");
  }

  /**
   * Format context in structured format
   */
  private static formatStructured(context: BaseContext): string {
    return `[CONTEXT]\n${JSON.stringify(context, null, 2)}\n[/CONTEXT]\n\n`;
  }

  /**
   * Extract analytics data from context
   */
  static extractAnalyticsContext(context: BaseContext): JsonObject {
    return {
      hasUserId: !!context.userId,
      hasSessionId: !!context.sessionId,
      hasUserRole: !!context.userRole,
      hasOrgContext: !!context.organizationId,
      contextKeys: Object.keys(context),
      contextSize: JSON.stringify(context).length,
    };
  }

  /**
   * Extract evaluation context
   */
  static extractEvaluationContext(context: BaseContext): JsonObject {
    return {
      userRole: context.userRole || "unknown",
      applicationContext: context.applicationContext?.name || "unknown",
      organizationContext: context.organizationId || "unknown",
      hasPreferences: !!context.userPreferences,
    };
  }
}

/**
 * Type guard to check if value is valid context
 */
export function isValidContext(value: unknown): value is BaseContext {
  return ContextFactory.validateContext(value) !== null;
}

/**
 * Context integration options for AI generation
 */
export interface ContextIntegrationOptions {
  context?: BaseContext;
  contextConfig?: Partial<ContextConfig>;
}
