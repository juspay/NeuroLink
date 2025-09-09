import type {
  RetryConfiguration,
  RetryResult,
  RetryStrategy,
  FeedbackIntegrationMode,
  RetryDecision,
  RetryAttempt,
  PromptModification,
} from "./retryTypes.js";
import type { TextGenerationOptions } from "../core/types.js";
import type { BaseProvider } from "../core/baseProvider.js";
import { RetryStateManager } from "./retryStateManager.js";
import { FeedbackIntegrator } from "./feedbackIntegrator.js";
import { PromptEnhancer } from "./promptEnhancer.js";
import { ContextBuilder } from "./contextBuilder.js";
import { AutoEvaluator } from "./autoEvaluator.js";
import type { EvaluationResult, RetryFeedback } from "./types.js";
import { v4 as uuidv4 } from "uuid";

export class RetryManager {
  private stateManager: RetryStateManager;
  private feedbackIntegrator: FeedbackIntegrator;
  private promptEnhancer: PromptEnhancer;
  private contextBuilder: ContextBuilder;
  private evaluator: AutoEvaluator;

  private defaultConfig: RetryConfiguration = {
    maxAttempts: 3,
    qualityThreshold: 7,
    backoffMultiplier: 1.5,
    enableProgressiveFeedback: true,
    strictMode: false,
    timeout: 120000,
  };

  constructor(evaluator?: AutoEvaluator, config?: Partial<RetryConfiguration>) {
    this.stateManager = new RetryStateManager();
    this.feedbackIntegrator = new FeedbackIntegrator();
    this.promptEnhancer = new PromptEnhancer();
    this.contextBuilder = new ContextBuilder();
    this.evaluator = evaluator || new AutoEvaluator();

    if (config) {
      this.defaultConfig = { ...this.defaultConfig, ...config };
    }
  }

  async retryGeneration(
    provider: BaseProvider,
    originalOptions: TextGenerationOptions,
    config?: Partial<RetryConfiguration>,
  ): Promise<RetryResult> {
    const retryConfig = { ...this.defaultConfig, ...config };
    const stateId = uuidv4();
    const startTime = Date.now();

    // Initialize retry state
    const state = this.stateManager.createState(
      stateId,
      originalOptions,
      retryConfig,
    );

    try {
      // First attempt - original generation
      const firstResult = await this.attemptGeneration(
        provider,
        originalOptions,
        stateId,
        1,
        retryConfig,
      );

      if (firstResult.success) {
        return firstResult.result;
      }

      // Retry loop
      let currentOptions = originalOptions;
      let lastEvaluation = firstResult.evaluation;
      let lastFeedback = firstResult.feedback;

      for (let attempt = 2; attempt <= retryConfig.maxAttempts; attempt++) {
        // Check if we should continue
        const decision = this.stateManager.shouldRetry(
          stateId,
          lastEvaluation,
          retryConfig,
        );

        if (!decision.shouldRetry) {
          break;
        }

        // Apply delay if suggested
        if (decision.suggestedDelay) {
          await this.delay(decision.suggestedDelay);
        }

        // Enhance prompt based on feedback
        const strategy = this.determineStrategy(state, decision);
        const enhanced = await this.enhanceForRetry(
          currentOptions,
          lastFeedback,
          strategy,
          state.attempts,
        );

        // Attempt generation with enhanced prompt
        const result = await this.attemptGeneration(
          provider,
          enhanced.options,
          stateId,
          attempt,
          retryConfig,
          enhanced.modifications,
        );

        if (result.success) {
          return result.result;
        }

        // Update for next iteration
        currentOptions = enhanced.options;
        lastEvaluation = result.evaluation;
        lastFeedback = result.feedback;
      }

      // All attempts exhausted
      return this.createFailureResult(stateId, startTime);
    } finally {
      // Clean up state
      this.stateManager.clearState(stateId);
    }
  }

  private async attemptGeneration(
    provider: BaseProvider,
    options: TextGenerationOptions,
    stateId: string,
    attemptNumber: number,
    config: RetryConfiguration,
    modifications: PromptModification[] = [],
  ): Promise<{
    success: boolean;
    result: RetryResult;
    evaluation: EvaluationResult;
    feedback: RetryFeedback;
  }> {
    try {
      // Generate response
      const generateResult = await provider.generate(options);

      // Build evaluation context
      const context = await this.contextBuilder.build(generateResult, options, {
        attemptNumber,
      });

      // Evaluate response
      const evaluation = await this.evaluator.evaluate(context);

      // Check if meets threshold
      const meetsThreshold = config.strictMode
        ? this.allScoresMeet(evaluation, config.qualityThreshold)
        : evaluation.overall >= config.qualityThreshold;

      // Generate feedback (even if successful, for logging)
      const feedback = this.evaluator.generateFeedback(
        evaluation,
        context,
        attemptNumber,
      );

      // Record attempt
      this.stateManager.addAttempt(stateId, {
        attemptNumber,
        timestamp: Date.now(),
        evaluation,
        feedback,
        promptModifications: modifications,
        responseContent: generateResult.content,
        improvementDelta: {
          relevance: 0,
          accuracy: 0,
          completeness: 0,
          overall: 0,
        },
      });

      if (meetsThreshold) {
        // Success!
        const state = this.stateManager.getState(stateId);
        if (!state) {
          throw new Error(`Retry state not found for ID: ${stateId}`);
        }
        const result = this.createSuccessResult(
          generateResult.content,
          evaluation,
          state,
          Date.now() - state.startTime,
        );

        return {
          success: true,
          result,
          evaluation,
          feedback,
        };
      }

      // Not successful, return for retry
      return {
        success: false,
        result: {} as RetryResult, // Will be overwritten
        evaluation,
        feedback,
      };
    } catch (error) {
      // Handle generation errors
      const errorResult = this.createErrorResult(
        stateId,
        error as Error,
        attemptNumber,
      );

      return {
        success: false,
        result: errorResult,
        evaluation: this.createDefaultEvaluation(),
        feedback: this.createErrorFeedback(error as Error, attemptNumber),
      };
    }
  }

  private async enhanceForRetry(
    originalOptions: TextGenerationOptions,
    feedback: RetryFeedback,
    strategy: RetryStrategy,
    previousAttempts: RetryAttempt[],
  ): Promise<{
    options: TextGenerationOptions;
    modifications: PromptModification[];
  }> {
    // First, integrate feedback
    const integrationMode = this.selectIntegrationMode(
      strategy,
      feedback.attempt,
    );
    const integrated = this.feedbackIntegrator.integrateFeedback(
      originalOptions,
      feedback,
      previousAttempts,
      integrationMode,
    );

    // Then, enhance prompt based on strategy
    const enhanced = this.promptEnhancer.enhancePrompt(
      integrated.options,
      feedback,
      strategy,
      previousAttempts,
    );

    // Combine modifications
    const allModifications = [
      ...integrated.modifications,
      ...enhanced.modifications,
    ];

    return {
      options: enhanced.options,
      modifications: allModifications,
    };
  }

  private determineStrategy(
    state: RetryState,
    decision: RetryDecision,
  ): RetryStrategy {
    // Use decision strategy if provided
    if (decision.modificationStrategy === "aggressive") {
      return RetryStrategy.AGGRESSIVE;
    }

    if (decision.modificationStrategy === "minimal") {
      return RetryStrategy.CONSERVATIVE;
    }

    // Otherwise, determine based on progress
    const progress = this.stateManager.calculateProgress(state);

    if (progress.improvementTrend === "declining") {
      return RetryStrategy.AGGRESSIVE;
    }

    if (progress.improvementTrend === "stagnant" && state.currentAttempt >= 2) {
      return RetryStrategy.ADAPTIVE;
    }

    return RetryStrategy.STANDARD;
  }

  private selectIntegrationMode(
    strategy: RetryStrategy,
    attemptNumber: number,
  ): FeedbackIntegrationMode {
    switch (strategy) {
      case RetryStrategy.AGGRESSIVE:
        return FeedbackIntegrationMode.HIERARCHICAL;

      case RetryStrategy.CONSERVATIVE:
        return FeedbackIntegrationMode.APPEND;

      case RetryStrategy.ADAPTIVE:
        return attemptNumber >= 3
          ? FeedbackIntegrationMode.REPLACE
          : FeedbackIntegrationMode.MERGE;

      default:
        return FeedbackIntegrationMode.MERGE;
    }
  }

  private allScoresMeet(
    evaluation: EvaluationResult,
    threshold: number,
  ): boolean {
    return (
      evaluation.relevance >= threshold &&
      evaluation.accuracy >= threshold &&
      evaluation.completeness >= threshold &&
      evaluation.overall >= threshold
    );
  }

  private createSuccessResult(
    content: string,
    evaluation: EvaluationResult,
    state: RetryState,
    duration: number,
  ): RetryResult {
    const avgImprovement = this.calculateAverageImprovement(state.attempts);

    return {
      success: true,
      finalContent: content,
      finalEvaluation: evaluation,
      attempts: state.attempts,
      totalDuration: duration,
      averageScoreImprovement: avgImprovement,
      retryMetadata: {
        reasonForSuccess: `Achieved quality threshold after ${state.currentAttempt} attempts`,
        bottlenecks: this.identifyBottlenecks(state.attempts),
      },
    };
  }

  private createFailureResult(stateId: string, startTime: number): RetryResult {
    const state = this.stateManager.getState(stateId);
    if (!state) {
      throw new Error(`Retry state not found for ID: ${stateId}`);
    }
    const lastAttempt = state.attempts[state.attempts.length - 1];

    return {
      success: false,
      finalContent: lastAttempt?.responseContent || "",
      finalEvaluation:
        lastAttempt?.evaluation || this.createDefaultEvaluation(),
      attempts: state.attempts,
      totalDuration: Date.now() - startTime,
      averageScoreImprovement: this.calculateAverageImprovement(state.attempts),
      retryMetadata: {
        reasonForFailure: this.determineFailureReason(state),
        bottlenecks: this.identifyBottlenecks(state.attempts),
      },
    };
  }

  private createErrorResult(
    stateId: string,
    error: Error,
    attemptNumber: number,
  ): RetryResult {
    const state = this.stateManager.getState(stateId);

    return {
      success: false,
      finalContent: "",
      finalEvaluation: this.createDefaultEvaluation(),
      attempts: state?.attempts || [],
      totalDuration: state ? Date.now() - state.startTime : 0,
      averageScoreImprovement: 0,
      retryMetadata: {
        reasonForFailure: `Error during attempt ${attemptNumber}: ${error.message}`,
        bottlenecks: ["Generation error"],
      },
    };
  }

  private createDefaultEvaluation(): EvaluationResult {
    return {
      relevance: 0,
      accuracy: 0,
      completeness: 0,
      overall: 0,
      isOffTopic: false,
      alertSeverity: "high",
      reasoning: "Evaluation not performed",
      evaluationModel: "none",
      evaluationTime: 0,
    };
  }

  private createErrorFeedback(
    error: Error,
    attemptNumber: number,
  ): RetryFeedback {
    return {
      attempt: attemptNumber,
      specificIssues: [`Generation failed: ${error.message}`],
      requiredImprovements: ["Resolve generation error"],
      constraints: ["Ensure valid prompt format"],
      focusAreas: ["Error resolution"],
    };
  }

  private calculateAverageImprovement(attempts: RetryAttempt[]): number {
    if (attempts.length < 2) {
      return 0;
    }

    let totalImprovement = 0;
    for (let i = 1; i < attempts.length; i++) {
      totalImprovement +=
        attempts[i].evaluation.overall - attempts[i - 1].evaluation.overall;
    }

    return totalImprovement / (attempts.length - 1);
  }

  private identifyBottlenecks(attempts: RetryAttempt[]): string[] {
    const bottlenecks: string[] = [];

    if (attempts.length === 0) {
      return bottlenecks;
    }

    // Check which scores consistently stayed low
    const lastAttempt = attempts[attempts.length - 1];

    if (lastAttempt.evaluation.relevance < 7) {
      bottlenecks.push("Relevance - Response not addressing query properly");
    }

    if (lastAttempt.evaluation.accuracy < 7) {
      bottlenecks.push("Accuracy - Factual errors or imprecision");
    }

    if (lastAttempt.evaluation.completeness < 7) {
      bottlenecks.push("Completeness - Missing important information");
    }

    // Check for stagnation
    if (attempts.length >= 2) {
      const noImprovement = attempts
        .slice(-2)
        .every((a) => Math.abs(a.improvementDelta.overall) < 0.5);

      if (noImprovement) {
        bottlenecks.push("Stagnation - Scores not improving despite retries");
      }
    }

    return bottlenecks;
  }

  private determineFailureReason(state: RetryState): string {
    const progress = this.stateManager.calculateProgress(state);

    if (state.currentAttempt >= this.defaultConfig.maxAttempts) {
      return "Maximum retry attempts exhausted";
    }

    if (Date.now() - state.startTime > this.defaultConfig.timeout!) {
      return "Retry timeout exceeded";
    }

    if (progress.improvementTrend === "declining") {
      return "Score trend declining, unlikely to improve";
    }

    return "Quality threshold not achieved";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public utility methods
  getRetryStatistics(): {
    activeRetries: number;
    averageAttempts: number;
    successRate: number;
  } {
    const states = this.stateManager.getAllStates();
    const completed = Array.from(states.values()).filter(
      (s) => s.status !== "active",
    );
    const successful = completed.filter((s) => s.status === "succeeded");

    return {
      activeRetries: Array.from(states.values()).filter(
        (s) => s.status === "active",
      ).length,
      averageAttempts:
        completed.length > 0
          ? completed.reduce((sum, s) => sum + s.currentAttempt, 0) /
            completed.length
          : 0,
      successRate:
        completed.length > 0 ? successful.length / completed.length : 0,
    };
  }
}

// Export convenience function
export async function retryWithQuality(
  provider: BaseProvider,
  options: TextGenerationOptions,
  config?: Partial<RetryConfiguration>,
): Promise<RetryResult> {
  const manager = new RetryManager();
  return manager.retryGeneration(provider, options, config);
}
