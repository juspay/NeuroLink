/**
 * Generation Handler Module
 *
 * Handles text generation execution, result formatting, and tool information extraction.
 * Extracted from BaseProvider to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Generation execution with AI SDK
 * - Tool information extraction
 * - Result formatting and enhancement
 * - Response analysis and logging
 *
 * @module core/modules/GenerationHandler
 */

import type { LanguageModelV1, CoreMessage, Tool } from "ai";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import type {
  TextGenerationOptions,
  EnhancedGenerateResult,
  AIProviderName,
  StandardRecord,
  ExtendedTool,
  AISDKGenerateResult,
} from "../../types/index.js";
import type { ToolCallObject, ToolResult } from "../../types/tools.js";
import type { UnknownRecord } from "../../types/common.js";
import { logger } from "../../utils/logger.js";
import {
  extractTokenUsage,
  extractCacheCreationTokens,
  extractCacheReadTokens,
  calculateCacheSavingsPercent,
} from "../../utils/tokenUtils.js";
import { DEFAULT_MAX_STEPS } from "../constants.js";

/**
 * Safely preview-serialize a value for debug logging.
 * Handles undefined, circular references, and non-serializable values.
 */
function safePreview(v: unknown): string {
  if (v === undefined) {
    return "";
  }
  try {
    const text = typeof v === "string" ? v : JSON.stringify(v);
    return (text ?? "").substring(0, 200);
  } catch {
    return "[unserializable]";
  }
}

/**
 * GenerationHandler class - Handles text generation operations for AI providers
 */
export class GenerationHandler {
  constructor(
    private readonly providerName: AIProviderName,
    private readonly modelName: string,
    private readonly supportsToolsFn: () => boolean,
    private readonly getTelemetryConfigFn: (
      options: TextGenerationOptions,
      type: string,
    ) =>
      | {
          isEnabled: boolean;
          functionId?: string;
          metadata?: Record<string, string | number | boolean>;
        }
      | undefined,
    private readonly handleToolStorageFn: (
      toolCalls: unknown[],
      toolResults: unknown[],
      options: TextGenerationOptions,
      timestamp: Date,
    ) => Promise<void>,
  ) {}

  /**
   * Helper method to call generateText with optional structured output
   * @private
   */
  private async callGenerateText(
    model: LanguageModelV1,
    messages: CoreMessage[],
    tools: Record<string, Tool>,
    options: TextGenerationOptions,
    shouldUseTools: boolean,
    includeStructuredOutput: boolean,
  ): Promise<Awaited<ReturnType<typeof generateText>>> {
    // Check if this is a Google provider (for provider-specific options)
    const isGoogleProvider =
      this.providerName === "google-ai" || this.providerName === "vertex";

    // Check if this is an Anthropic provider (includes Vertex+Claude)
    const isAnthropicProvider =
      this.providerName === "anthropic" ||
      this.providerName === "bedrock" ||
      (this.providerName === "vertex" && this.modelName?.startsWith("claude-"));

    const useStructuredOutput =
      includeStructuredOutput &&
      !!options.schema &&
      (options.output?.format === "json" ||
        options.output?.format === "structured");

    // Annotate the last tool with cache_control so the full tool-definition
    // block becomes a cache breakpoint for Anthropic-family providers.
    // Non-Anthropic providers harmlessly ignore unknown providerOptions.
    // Note: The AI SDK Tool type doesn't yet include providerOptions, so we
    // use a type assertion. The Anthropic adapter reads this at runtime.
    const toolsWithCache: Record<
      string,
      Tool & { providerOptions?: Record<string, unknown> }
    > = { ...tools };
    if (
      isAnthropicProvider &&
      shouldUseTools &&
      Object.keys(toolsWithCache).length > 0
    ) {
      const toolNames = Object.keys(toolsWithCache);
      const lastToolName = toolNames[toolNames.length - 1];
      if (lastToolName && toolsWithCache[lastToolName]) {
        const lastTool = toolsWithCache[lastToolName] as Tool & {
          providerOptions?: Record<string, unknown>;
        };
        toolsWithCache[lastToolName] = {
          ...lastTool,
          providerOptions: {
            ...(lastTool.providerOptions ?? {}),
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        };
      }
    }

    return await generateText({
      model,
      messages,
      ...(shouldUseTools &&
        Object.keys(toolsWithCache).length > 0 && { tools: toolsWithCache }),
      maxSteps: options.maxSteps ?? DEFAULT_MAX_STEPS,
      ...(shouldUseTools &&
        options.toolChoice && { toolChoice: options.toolChoice }),
      ...(options.prepareStep && {
        experimental_prepareStep: options.prepareStep,
      }),
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      abortSignal: options.abortSignal,
      ...(useStructuredOutput &&
        options.schema && {
          experimental_output: Output.object({ schema: options.schema }),
        }),
      // Add thinking configuration for extended reasoning
      // Gemini 3 models use providerOptions.google.thinkingConfig with thinkingLevel
      // Gemini 2.5 models use thinkingBudget
      // Anthropic models use experimental_thinking with budgetTokens
      ...(options.thinkingConfig?.enabled && {
        // For Anthropic: experimental_thinking with budgetTokens
        ...(isAnthropicProvider &&
          options.thinkingConfig.budgetTokens &&
          !options.thinkingConfig.thinkingLevel && {
            experimental_thinking: {
              type: "enabled" as const,
              budgetTokens: options.thinkingConfig.budgetTokens,
            },
          }),
        // For Google Gemini 3: providerOptions with thinkingLevel
        // For Gemini 2.5: providerOptions with thinkingBudget
        ...(isGoogleProvider && {
          providerOptions: {
            google: {
              thinkingConfig: {
                ...(options.thinkingConfig.thinkingLevel && {
                  thinkingLevel: options.thinkingConfig.thinkingLevel,
                }),
                ...(options.thinkingConfig.budgetTokens &&
                  !options.thinkingConfig.thinkingLevel && {
                    thinkingBudget: options.thinkingConfig.budgetTokens,
                  }),
                includeThoughts: true,
              },
            },
          },
        }),
      }),
      experimental_telemetry: this.getTelemetryConfigFn(options, "generate"),
      onStepFinish: ({ toolCalls, toolResults }) => {
        logger.info("Tool execution completed", { toolResults, toolCalls });

        // Handle tool execution storage
        this.handleToolStorageFn(
          toolCalls,
          toolResults,
          options,
          new Date(),
        ).catch((error: unknown) => {
          logger.warn("[GenerationHandler] Failed to store tool executions", {
            provider: this.providerName,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      },
    });
  }

  /**
   * Execute the generation with AI SDK
   */
  async executeGeneration(
    model: LanguageModelV1,
    messages: CoreMessage[],
    tools: Record<string, Tool>,
    options: TextGenerationOptions,
  ): Promise<Awaited<ReturnType<typeof generateText>>> {
    const shouldUseTools = !options.disableTools && this.supportsToolsFn();

    const useStructuredOutput =
      !!options.schema &&
      (options.output?.format === "json" ||
        options.output?.format === "structured");

    const requestId =
      options.requestId ||
      ((options.context as Record<string, unknown>)?.requestId as string) ||
      "unknown";

    logger.info("[GenerationHandler] Calling generateText", {
      requestId,
      model: model.modelId || "unknown",
      messageCount: messages.length,
      toolCount: Object.keys(tools || {}).length,
      maxSteps: options.maxSteps,
      temperature: options.temperature,
    });

    if (logger.shouldLog("debug")) {
      try {
        logger.debug("[Observability] Full generateText parameters", {
          requestId,
          model: model.modelId || "unknown",
          messageCount: messages.length,
          messages: messages.map((msg, i) => ({
            index: i,
            role: msg.role,
            contentLength:
              typeof msg.content === "string"
                ? msg.content.length
                : safePreview(msg.content).length,
            contentPreview:
              typeof msg.content === "string"
                ? msg.content.substring(0, 200)
                : "[multimodal]",
          })),
          toolNames: Object.keys(tools || {}),
          toolCount: Object.keys(tools || {}).length,
          maxSteps: options.maxSteps,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        });
      } catch {
        // Ignore serialization errors in debug logging
      }
    }

    const genStartTime = Date.now();

    try {
      const result = await this.callGenerateText(
        model,
        messages,
        tools,
        options,
        shouldUseTools,
        true, // includeStructuredOutput
      );

      logger.info("[GenerationHandler] generateText returned", {
        requestId,
        durationMs: Date.now() - genStartTime,
        finishReason: result.finishReason,
        steps: result.steps?.length || 1,
        toolCallsTotal: result.toolCalls?.length || 0,
        responseChars: result.text?.length || 0,
      });

      if (logger.shouldLog("debug")) {
        logger.debug("[Observability] Full LLM response", {
          requestId,
          finishReason: result.finishReason,
          responseTextPreview: result.text?.substring(0, 200) || "",
          responseTextLength: result.text?.length || 0,
          toolCalls: result.toolCalls?.map(
            (tc: { toolName: string; args: unknown }) => ({
              toolName: tc.toolName,
              argsPreview: safePreview(tc.args),
            }),
          ),
          toolResults: result.toolResults?.map(
            (tr: { toolName: string; result: unknown }) => ({
              toolName: tr.toolName,
              resultPreview: safePreview(tr.result),
            }),
          ),
          steps: result.steps?.map(
            (
              step: {
                stepType?: string;
                text?: string;
                toolCalls?: Array<{ toolName: string; args: unknown }>;
                toolResults?: Array<{ toolName: string; result: unknown }>;
                finishReason?: string;
              },
              i: number,
            ) => ({
              stepIndex: i,
              stepType: step.stepType,
              textPreview: step.text?.substring(0, 200),
              textLength: step.text?.length || 0,
              toolCalls: step.toolCalls?.map(
                (tc: { toolName: string; args: unknown }) => ({
                  toolName: tc.toolName,
                  argsPreview: safePreview(tc.args),
                }),
              ),
              toolResults: step.toolResults?.map(
                (tr: { toolName: string; result: unknown }) => ({
                  toolName: tr.toolName,
                  resultPreview: safePreview(tr.result),
                }),
              ),
              finishReason: step.finishReason,
            }),
          ),
          usage: result.usage,
          providerMetadata:
            result.experimental_providerMetadata ||
            (result as unknown as Record<string, unknown>).providerMetadata,
        });
      }

      return result;
    } catch (error) {
      // If NoObjectGeneratedError is thrown when using schema + tools together,
      // fall back to generating without experimental_output and extract JSON manually
      if (error instanceof NoObjectGeneratedError && useStructuredOutput) {
        logger.debug(
          "[GenerationHandler] NoObjectGeneratedError caught - falling back to manual JSON extraction",
          {
            provider: this.providerName,
            model: this.modelName,
            error: error.message,
          },
        );

        // Retry without experimental_output - the formatEnhancedResult method
        // will extract JSON from the text response
        const result = await this.callGenerateText(
          model,
          messages,
          tools,
          options,
          shouldUseTools,
          false, // includeStructuredOutput - intentionally omitted
        );

        logger.info("[GenerationHandler] generateText returned (fallback)", {
          requestId,
          durationMs: Date.now() - genStartTime,
          finishReason: result.finishReason,
          steps: result.steps?.length || 1,
          toolCallsTotal: result.toolCalls?.length || 0,
          responseChars: result.text?.length || 0,
        });

        return result;
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Extract cache metrics from provider metadata (e.g. Anthropic's providerMetadata.anthropic)
   * The Vercel AI SDK's LanguageModelUsage only has promptTokens/completionTokens/totalTokens.
   * Cache metrics are surfaced via providerMetadata by provider-specific SDK adapters.
   */
  private extractCacheMetricsFromProviderMetadata(
    generateResult: Awaited<ReturnType<typeof generateText>>,
  ): { cacheCreationTokens?: number; cacheReadTokens?: number } {
    const providerMeta =
      ((generateResult as unknown as Record<string, unknown>)
        .providerMetadata as Record<string, unknown> | undefined) ||
      (generateResult.experimental_providerMetadata as
        | Record<string, unknown>
        | undefined);
    if (!providerMeta) {
      return {};
    }

    // Anthropic surfaces cache metrics under providerMetadata.anthropic
    const anthropicMeta = providerMeta.anthropic as
      | Record<string, unknown>
      | undefined;
    if (anthropicMeta) {
      const cacheCreationTokens = extractCacheCreationTokens(
        anthropicMeta as Parameters<typeof extractCacheCreationTokens>[0],
      );
      const cacheReadTokens = extractCacheReadTokens(
        anthropicMeta as Parameters<typeof extractCacheReadTokens>[0],
      );
      return {
        ...(cacheCreationTokens !== undefined && { cacheCreationTokens }),
        ...(cacheReadTokens !== undefined && { cacheReadTokens }),
      };
    }

    return {};
  }

  /**
   * Log generation completion information
   */
  logGenerationComplete(
    generateResult: Awaited<ReturnType<typeof generateText>>,
  ): void {
    const cacheMetrics =
      this.extractCacheMetricsFromProviderMetadata(generateResult);

    logger.debug(`generateText completed`, {
      provider: this.providerName,
      model: this.modelName,
      responseLength: generateResult.text?.length || 0,
      toolResultsCount: generateResult.toolResults?.length || 0,
      finishReason: generateResult.finishReason,
      usage: generateResult.usage,
      ...(cacheMetrics.cacheCreationTokens !== undefined && {
        cacheCreationTokens: cacheMetrics.cacheCreationTokens,
      }),
      ...(cacheMetrics.cacheReadTokens !== undefined && {
        cacheReadTokens: cacheMetrics.cacheReadTokens,
      }),
      timestamp: Date.now(),
    });
  }

  /**
   * Extract tool information from generation result
   */
  extractToolInformation(
    generateResult: Awaited<ReturnType<typeof generateText>>,
  ): {
    toolsUsed: string[];
    toolExecutions: Array<{
      name: string;
      input: StandardRecord;
      output: unknown;
    }>;
  } {
    const toolsUsed: string[] = [];
    const toolExecutions: Array<{
      name: string;
      input: StandardRecord;
      output: unknown;
    }> = [];

    // Extract tool names from tool calls
    if (generateResult.toolCalls && generateResult.toolCalls.length > 0) {
      toolsUsed.push(
        ...generateResult.toolCalls.map((tc: ToolCallObject) => {
          return tc.toolName || tc.name || "unknown";
        }),
      );
    }

    // Extract from steps
    if (
      (generateResult as unknown as AISDKGenerateResult).steps &&
      Array.isArray((generateResult as unknown as AISDKGenerateResult).steps)
    ) {
      const toolCallArgsMap = new Map<string, StandardRecord>();

      for (const step of (generateResult as unknown as AISDKGenerateResult)
        .steps || []) {
        // Collect tool calls and their arguments
        if (step?.toolCalls && Array.isArray(step.toolCalls)) {
          for (const toolCall of step.toolCalls) {
            const tcRecord = toolCall as UnknownRecord;
            const toolName =
              (tcRecord.toolName as string) ||
              (tcRecord.name as string) ||
              "unknown";
            const toolId =
              (tcRecord.toolCallId as string) ||
              (tcRecord.id as string) ||
              toolName;

            toolsUsed.push(toolName);

            let callArgs: StandardRecord = {};
            if (tcRecord.args) {
              callArgs = tcRecord.args as StandardRecord;
            } else if (tcRecord.arguments) {
              callArgs = tcRecord.arguments as StandardRecord;
            } else if (tcRecord.parameters) {
              callArgs = tcRecord.parameters as StandardRecord;
            }

            toolCallArgsMap.set(toolId, callArgs);
            toolCallArgsMap.set(toolName, callArgs);
          }
        }

        // Process tool results
        if (step?.toolResults && Array.isArray(step.toolResults)) {
          for (const toolResult of step.toolResults) {
            const trRecord = toolResult as UnknownRecord;
            const toolName = (trRecord.toolName as string) || "unknown";
            const toolId =
              (trRecord.toolCallId as string) || (trRecord.id as string);

            let toolArgs: StandardRecord = {};
            if (trRecord.args) {
              toolArgs = trRecord.args as StandardRecord;
            } else if (trRecord.arguments) {
              toolArgs = trRecord.arguments as StandardRecord;
            } else if (trRecord.parameters) {
              toolArgs = trRecord.parameters as StandardRecord;
            } else if (trRecord.input) {
              toolArgs = trRecord.input as StandardRecord;
            } else {
              toolArgs = toolCallArgsMap.get(toolId || toolName) || {};
            }

            toolExecutions.push({
              name: toolName,
              input: toolArgs,
              output: (trRecord.result as unknown) ?? "success",
            });
          }
        }
      }
    }

    return { toolsUsed: [...new Set(toolsUsed)], toolExecutions };
  }

  /**
   * Format the enhanced result
   */
  formatEnhancedResult(
    generateResult: Awaited<ReturnType<typeof generateText>>,
    tools: Record<string, Tool>,
    toolsUsed: string[],
    toolExecutions: Array<{
      name: string;
      input: StandardRecord;
      output: unknown;
    }>,
    options: TextGenerationOptions,
  ): EnhancedGenerateResult {
    // Structured output check
    const useStructuredOutput =
      !!options.schema &&
      (options.output?.format === "json" ||
        options.output?.format === "structured");

    let content: string;
    if (useStructuredOutput) {
      try {
        const experimentalOutput = generateResult.experimental_output;
        if (experimentalOutput !== undefined) {
          content = JSON.stringify(experimentalOutput);
        } else {
          // Fall back to text parsing
          const rawText = generateResult.text || "";
          const strippedText = rawText
            .replace(/^```(?:json)?\s*\n?/i, "")
            .replace(/\n?```\s*$/i, "")
            .trim();
          content = strippedText;
        }
      } catch (outputError) {
        // experimental_output is a getter that can throw NoObjectGeneratedError
        // Fall back to text parsing when structured output fails
        logger.debug(
          "[GenerationHandler] experimental_output threw, falling back to text parsing",
          {
            error:
              outputError instanceof Error
                ? outputError.message
                : String(outputError),
          },
        );
        const rawText = generateResult.text || "";
        const strippedText = rawText
          .replace(/^```(?:json)?\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();
        content = strippedText;
      }
    } else {
      content = generateResult.text;
    }

    // Extract usage with support for different formats and reasoning tokens
    // Note: The AI SDK bundles thinking tokens into promptTokens for Google models.
    // Separate reasoningTokens tracking will work when/if the AI SDK adds support.
    const usage = extractTokenUsage(generateResult.usage);

    // Merge cache metrics from providerMetadata if not already present in usage
    // The AI SDK's LanguageModelUsage doesn't include cache tokens; they come from
    // provider-specific metadata (e.g. Anthropic's providerMetadata.anthropic)
    if (
      usage.cacheCreationTokens === undefined ||
      usage.cacheReadTokens === undefined
    ) {
      const cacheMetrics =
        this.extractCacheMetricsFromProviderMetadata(generateResult);
      if (
        usage.cacheCreationTokens === undefined &&
        cacheMetrics.cacheCreationTokens !== undefined
      ) {
        usage.cacheCreationTokens = cacheMetrics.cacheCreationTokens;
      }
      if (
        usage.cacheReadTokens === undefined &&
        cacheMetrics.cacheReadTokens !== undefined
      ) {
        usage.cacheReadTokens = cacheMetrics.cacheReadTokens;
      }
      // Recalculate cache savings if we added cache metrics
      if (usage.cacheReadTokens !== undefined) {
        const savingsPercent = calculateCacheSavingsPercent(
          usage.cacheReadTokens,
          usage.input,
        );
        if (savingsPercent !== undefined) {
          usage.cacheSavingsPercent = savingsPercent;
        }
      }
    }

    return {
      content,
      usage,
      finishReason: generateResult.finishReason,
      provider: this.providerName,
      model: this.modelName,
      toolCalls: generateResult.toolCalls
        ? generateResult.toolCalls.map((tc: ToolCallObject) => ({
            toolCallId: tc.toolCallId || "unknown",
            toolName: tc.toolName || "unknown",
            args: tc.args || {},
          }))
        : [],
      toolResults: (generateResult.toolResults as ToolResult[]) || [],
      toolsUsed,
      toolExecutions,
      availableTools: Object.keys(tools).map((name) => {
        const tool = tools[name] as ExtendedTool;
        return {
          name,
          description: tool.description || "No description available",
          parameters: tool.parameters || {},
          server: tool.serverId || "direct",
        };
      }),
    };
  }

  /**
   * Analyze AI response structure and log detailed debugging information
   */
  analyzeAIResponse(result: Record<string, unknown>): void {
    logger.debug("NeuroLink Raw AI Response Analysis", {
      provider: this.providerName,
      model: this.modelName,
      responseTextLength: (result.text as string)?.length || 0,
      responsePreview: (result.text as string)?.substring(0, 500) ?? "",
      finishReason: result.finishReason,
      usage: result.usage,
    });

    // Tool calls analysis
    const toolCallsAnalysis = {
      hasToolCalls: !!result.toolCalls,
      toolCallsLength: (result.toolCalls as unknown[])?.length || 0,
      toolCalls:
        (result.toolCalls as unknown[])?.map((toolCall, index) => {
          const tcRecord = toolCall as Record<string, unknown>;
          const toolName = tcRecord.toolName || tcRecord.name || "unknown";
          return {
            index: index + 1,
            toolName,
            toolId: tcRecord.toolCallId || tcRecord.id || "none",
            hasArgs: !!tcRecord.args,
            argsKeys:
              tcRecord.args && typeof tcRecord.args === "object"
                ? Object.keys(tcRecord.args as Record<string, unknown>)
                : [],
          };
        }) || [],
    };
    logger.debug("Tool Calls Analysis", toolCallsAnalysis);
  }
}
