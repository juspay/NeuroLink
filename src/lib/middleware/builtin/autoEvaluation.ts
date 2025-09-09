import type { LanguageModelV1Middleware } from "ai";
import type {
  NeuroLinkMiddleware,
  NeuroLinkMiddlewareMetadata,
} from "../../types/middlewareTypes.js";
import type { AutoEvaluationConfig } from "../../evaluation/autoEvaluationConfig.js";
import { DEFAULT_AUTO_EVALUATION_CONFIG } from "../../evaluation/autoEvaluationConfig.js";
import { ContextBuilder } from "../../evaluation/contextBuilder.js";
import { AutoEvaluator } from "../../evaluation/autoEvaluator.js";
import { RetryManager } from "../../evaluation/retryManager.js";
import { EvaluationCache } from "../../evaluation/evaluationCache.js";
import { TelemetryCollector } from "../../evaluation/telemetryCollector.js";
import { ErrorHandler } from "../../evaluation/errorHandler.js";
import { logger } from "../../utils/logger.js";

/**
 * Create Auto-Evaluation middleware for quality assurance and automatic retries.
 * This middleware is always active and ensures responses meet quality thresholds.
 * @param config - Optional configuration for the auto-evaluation middleware.
 */
export function createAutoEvaluationMiddleware(
  config: AutoEvaluationConfig = {},
): NeuroLinkMiddleware {
  // Merge with defaults
  const mergedConfig = {
    quality: { ...DEFAULT_AUTO_EVALUATION_CONFIG.quality, ...config.quality },
    retry: { ...DEFAULT_AUTO_EVALUATION_CONFIG.retry, ...config.retry },
    evaluationModel: {
      ...DEFAULT_AUTO_EVALUATION_CONFIG.evaluationModel,
      ...config.evaluationModel,
    },
    performance: {
      ...DEFAULT_AUTO_EVALUATION_CONFIG.performance,
      ...config.performance,
    },
    telemetry: {
      ...DEFAULT_AUTO_EVALUATION_CONFIG.telemetry,
      ...config.telemetry,
    },
  };

  // Initialize components
  const contextBuilder = new ContextBuilder();
  const evaluator = new AutoEvaluator({
    provider: mergedConfig.evaluationModel.provider,
    model: mergedConfig.evaluationModel.model,
    temperature: mergedConfig.evaluationModel.temperature,
  });
  const retryManager = new RetryManager(evaluator, {
    maxAttempts: mergedConfig.retry.maxAttempts,
    qualityThreshold: mergedConfig.quality.threshold,
    backoffMultiplier: mergedConfig.retry.backoffMultiplier,
    strictMode: mergedConfig.quality.strictMode,
    timeout: mergedConfig.performance.timeout,
  });
  const cache = mergedConfig.performance.cache
    ? new EvaluationCache(mergedConfig.performance.cacheTTL)
    : null;
  const telemetry = mergedConfig.telemetry.enabled
    ? new TelemetryCollector({
        enabled: true,
        endpoint: mergedConfig.telemetry.endpoint,
      })
    : null;
  const errorHandler = new ErrorHandler();

  const metadata: NeuroLinkMiddlewareMetadata = {
    id: "auto-evaluation",
    name: "Auto-Evaluation",
    description:
      "Provides automatic quality evaluation and retry for AI responses to ensure they meet quality thresholds.",
    priority: 100, // Higher priority than guardrails
    defaultEnabled: true, // Always enabled by default
  };

  const middleware: LanguageModelV1Middleware = {
    wrapGenerate: async ({ doGenerate, params }) => {
      const startTime = Date.now();
      const requestId = `ae-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      logger.debug(`[AutoEvaluation] Processing request ${requestId}`, {
        threshold: mergedConfig.quality.threshold,
        maxRetries: mergedConfig.retry.maxAttempts,
      });

      // Check if circuit breaker is open
      if (errorHandler.isEvaluationDisabled()) {
        logger.warn(
          `[AutoEvaluation] Circuit breaker open, skipping evaluation`,
        );
        const result = await doGenerate();
        return {
          ...result,
          autoEvaluationMetadata: {
            performed: false,
            error: true,
            errorMessage: "Circuit breaker open",
          },
        };
      }

      try {
        // Check cache if enabled
        if (cache) {
          const cached = cache.get(params);
          if (cached) {
            logger.debug(`[AutoEvaluation] Cache hit for request ${requestId}`);
            return cached;
          }
        }

        // Create a provider wrapper for retry manager
        const providerWrapper = {
          generate: async (_options: unknown) => {
            const result = await doGenerate();
            return {
              content: result.text || "",
              provider: params.model?.provider || "unknown",
              model: params.model?.modelId || "unknown",
              usage: result.usage
                ? {
                    prompt: result.usage.promptTokens || 0,
                    completion: result.usage.completionTokens || 0,
                    total: result.usage.totalTokens || 0,
                  }
                : undefined,
              responseTime: Date.now() - startTime,
            };
          },
          providerName: params.model?.provider || "unknown",
        };

        // Use retry manager to handle generation with quality assurance
        const result = await retryManager.retryGeneration(
          providerWrapper,
          params,
        );

        // Collect telemetry
        if (telemetry) {
          telemetry.collectEvaluationEvent(
            requestId,
            params.model?.provider || "unknown",
            params.model?.modelId || "unknown",
            result,
          );
        }

        // Get the actual generation result with enhanced metadata
        const finalResult = await doGenerate();
        const enhancedResult = {
          ...finalResult,
          text: result.finalContent || finalResult.text,
          autoEvaluationMetadata: {
            performed: true,
            finalScore: result.finalEvaluation.overall,
            attempts: result.attempts.length,
            duration: Date.now() - startTime,
            improvement: result.averageScoreImprovement,
            success: result.success,
          },
        };

        // Cache successful result
        if (cache && result.success) {
          cache.set(params, enhancedResult);
        }

        logger.debug(`[AutoEvaluation] Completed request ${requestId}`, {
          finalScore: result.finalEvaluation.overall,
          attempts: result.attempts.length,
          success: result.success,
        });

        return enhancedResult;
      } catch (error) {
        errorHandler.handleError(error as Error, `Request ${requestId}`);

        // Fallback to original generation on error
        const fallbackResult = await doGenerate();
        return {
          ...fallbackResult,
          autoEvaluationMetadata: {
            performed: false,
            error: true,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    },

    wrapStream: async ({ doStream, params }) => {
      // For streaming, we collect the full response and evaluate at the end
      logger.debug(
        `[AutoEvaluation] Streaming mode - evaluation deferred to completion`,
      );

      const { stream, ...rest } = await doStream();
      const startTime = Date.now();
      let fullText = "";

      const transformStream = new TransformStream({
        transform(chunk, controller) {
          if (typeof chunk === "string") {
            fullText += chunk;
          } else if (chunk && typeof chunk === "object" && "text" in chunk) {
            fullText += chunk.text || "";
          }
          controller.enqueue(chunk);
        },
        async flush(_controller) {
          // Evaluate the complete response after streaming
          try {
            if (fullText && !errorHandler.isEvaluationDisabled()) {
              const context = await contextBuilder.build(
                {
                  content: fullText,
                  provider: params.model?.provider || "streaming",
                  model: params.model?.modelId || "unknown",
                },
                params,
              );
              const evaluation = await evaluator.evaluate(context);

              logger.debug(`[AutoEvaluation] Stream evaluation completed`, {
                score: evaluation.overall,
                length: fullText.length,
                duration: Date.now() - startTime,
              });

              // If below threshold, log warning (can't retry in streaming mode)
              if (evaluation.overall < mergedConfig.quality.threshold) {
                logger.warn(
                  `[AutoEvaluation] Stream response below quality threshold`,
                  {
                    score: evaluation.overall,
                    threshold: mergedConfig.quality.threshold,
                  },
                );
              }
            }
          } catch (error) {
            errorHandler.handleError(error as Error, "Stream evaluation");
          }
        },
      });

      return {
        stream: stream.pipeThrough(transformStream),
        ...rest,
      };
    },
  };

  return {
    ...middleware,
    metadata,
  };
}
