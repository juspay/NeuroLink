import type {
  RetryState,
  RetryAttempt,
  RetryProgress,
  RetryConfiguration,
  RetryDecision,
} from "./retryTypes.js";
import type { EvaluationResult } from "./types.js";
import type { TextGenerationOptions } from "../core/types.js";

export class RetryStateManager {
  private states: Map<string, RetryState> = new Map();
  private readonly defaultConfig: RetryConfiguration = {
    maxAttempts: 3,
    qualityThreshold: 7,
    backoffMultiplier: 1.5,
    enableProgressiveFeedback: true,
    strictMode: false,
    timeout: 120000, // 2 minutes total
  };

  createState(
    stateId: string,
    originalRequest: TextGenerationOptions,
    _config?: Partial<RetryConfiguration>,
  ): RetryState {
    const state: RetryState = {
      originalRequest,
      currentAttempt: 0,
      attempts: [],
      startTime: Date.now(),
      lastAttemptTime: Date.now(),
      status: "active",
    };

    this.states.set(stateId, state);
    return state;
  }

  getState(stateId: string): RetryState | undefined {
    return this.states.get(stateId);
  }

  updateState(stateId: string, updates: Partial<RetryState>): void {
    const state = this.states.get(stateId);
    if (state) {
      Object.assign(state, updates);
      state.lastAttemptTime = Date.now();
    }
  }

  addAttempt(stateId: string, attempt: RetryAttempt): void {
    const state = this.states.get(stateId);
    if (state) {
      state.attempts.push(attempt);
      state.currentAttempt = attempt.attemptNumber;

      // Calculate improvement delta if not first attempt
      if (state.attempts.length > 1) {
        const prevAttempt = state.attempts[state.attempts.length - 2];
        attempt.improvementDelta = {
          relevance:
            attempt.evaluation.relevance - prevAttempt.evaluation.relevance,
          accuracy:
            attempt.evaluation.accuracy - prevAttempt.evaluation.accuracy,
          completeness:
            attempt.evaluation.completeness -
            prevAttempt.evaluation.completeness,
          overall: attempt.evaluation.overall - prevAttempt.evaluation.overall,
        };
      }
    }
  }

  shouldRetry(
    stateId: string,
    lastEvaluation: EvaluationResult,
    config: RetryConfiguration,
  ): RetryDecision {
    const state = this.states.get(stateId);
    if (!state) {
      return { shouldRetry: false, reason: "State not found" };
    }

    // Check max attempts
    if (state.currentAttempt >= config.maxAttempts) {
      return { shouldRetry: false, reason: "Maximum attempts reached" };
    }

    // Check timeout
    if (
      Date.now() - state.startTime >
      (config.timeout || this.defaultConfig.timeout || 30000)
    ) {
      return { shouldRetry: false, reason: "Timeout exceeded" };
    }

    // Check quality threshold
    const meetsThreshold = config.strictMode
      ? this.allScoresMeetThreshold(lastEvaluation, config.qualityThreshold)
      : this.overallMeetsThreshold(lastEvaluation, config.qualityThreshold);

    if (meetsThreshold) {
      return { shouldRetry: false, reason: "Quality threshold met" };
    }

    // Check improvement trend
    const progress = this.calculateProgress(state);
    if (
      progress.improvementTrend === "declining" &&
      state.currentAttempt >= 2
    ) {
      return {
        shouldRetry: false,
        reason: "Scores declining, unlikely to improve",
      };
    }

    // Check for stagnation
    if (progress.improvementTrend === "stagnant" && state.currentAttempt >= 2) {
      return {
        shouldRetry: true,
        reason: "Scores stagnant, trying aggressive approach",
        modificationStrategy: "aggressive",
        suggestedDelay: 1000 * (config.backoffMultiplier || 1),
      };
    }

    // Default: continue retrying
    return {
      shouldRetry: true,
      reason: "Quality below threshold, improvement possible",
      modificationStrategy: "moderate",
      suggestedDelay: 500 * state.currentAttempt,
    };
  }

  calculateProgress(state: RetryState): RetryProgress {
    const scoreHistory = {
      relevance: [] as number[],
      accuracy: [] as number[],
      completeness: [] as number[],
      overall: [] as number[],
    };

    // Collect score history
    state.attempts.forEach((attempt) => {
      scoreHistory.relevance.push(attempt.evaluation.relevance);
      scoreHistory.accuracy.push(attempt.evaluation.accuracy);
      scoreHistory.completeness.push(attempt.evaluation.completeness);
      scoreHistory.overall.push(attempt.evaluation.overall);
    });

    // Determine improvement trend
    const trend = this.calculateTrend(scoreHistory.overall);

    // Estimate remaining attempts
    const averageImprovement = this.calculateAverageImprovement(
      scoreHistory.overall,
    );
    const currentScore =
      scoreHistory.overall[scoreHistory.overall.length - 1] || 0;
    const targetScore = 7;
    const estimatedAttempts =
      averageImprovement > 0
        ? Math.ceil((targetScore - currentScore) / averageImprovement)
        : 3;

    return {
      attemptNumber: state.currentAttempt,
      scoreHistory,
      improvementTrend: trend,
      estimatedAttemptsRemaining: Math.min(estimatedAttempts, 3),
    };
  }

  private allScoresMeetThreshold(
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

  private overallMeetsThreshold(
    evaluation: EvaluationResult,
    threshold: number,
  ): boolean {
    return evaluation.overall >= threshold;
  }

  private calculateTrend(
    scores: number[],
  ): "improving" | "stagnant" | "declining" {
    if (scores.length < 2) {
      return "improving";
    }

    const recentScores = scores.slice(-3); // Look at last 3 attempts
    const differences = [];

    for (let i = 1; i < recentScores.length; i++) {
      differences.push(recentScores[i] - recentScores[i - 1]);
    }

    const avgDifference =
      differences.reduce((a, b) => a + b, 0) / differences.length;

    if (avgDifference > 0.5) {
      return "improving";
    }
    if (avgDifference < -0.5) {
      return "declining";
    }
    return "stagnant";
  }

  private calculateAverageImprovement(scores: number[]): number {
    if (scores.length < 2) {
      return 1;
    }

    let totalImprovement = 0;
    for (let i = 1; i < scores.length; i++) {
      totalImprovement += scores[i] - scores[i - 1];
    }

    return totalImprovement / (scores.length - 1);
  }

  clearState(stateId: string): void {
    this.states.delete(stateId);
  }

  getAllStates(): Map<string, RetryState> {
    return new Map(this.states);
  }

  // Generate retry summary
  generateSummary(stateId: string): string {
    const state = this.states.get(stateId);
    if (!state) {
      return "No retry state found";
    }

    const progress = this.calculateProgress(state);
    const duration = Date.now() - state.startTime;

    return `Retry Summary:
- Total Attempts: ${state.currentAttempt}
- Duration: ${(duration / 1000).toFixed(1)}s
- Status: ${state.status}
- Score Progression: ${progress.scoreHistory.overall.map((s) => s.toFixed(1)).join(" → ")}
- Trend: ${progress.improvementTrend}
- Final Result: ${state.finalResult ? `Success (${state.finalResult.evaluation.overall}/10)` : "In Progress"}`;
  }
}
