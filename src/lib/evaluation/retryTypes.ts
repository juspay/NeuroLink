import type { EvaluationResult, RetryFeedback } from "./types.js";
import type { TextGenerationOptions } from "../core/types.js";

// Retry attempt record
export interface RetryAttempt {
  attemptNumber: number;
  timestamp: number;
  evaluation: EvaluationResult;
  feedback: RetryFeedback;
  promptModifications: PromptModification[];
  responseContent: string;
  improvementDelta: {
    relevance: number;
    accuracy: number;
    completeness: number;
    overall: number;
  };
}

// Prompt modification tracking
export interface PromptModification {
  type: "systemPrompt" | "userPrompt" | "context" | "constraints";
  originalContent: string;
  modifiedContent: string;
  reason: string;
}

// Retry configuration
export interface RetryConfiguration {
  maxAttempts: number;
  qualityThreshold: number;
  backoffMultiplier?: number;
  enableProgressiveFeedback?: boolean;
  strictMode?: boolean; // All scores must meet threshold
  timeout?: number;
}

// Retry state
export interface RetryState {
  originalRequest: TextGenerationOptions;
  currentAttempt: number;
  attempts: RetryAttempt[];
  startTime: number;
  lastAttemptTime: number;
  status: "active" | "succeeded" | "failed" | "timeout";
  finalResult?: {
    content: string;
    evaluation: EvaluationResult;
    totalAttempts: number;
    totalDuration: number;
  };
}

// Retry decision
export interface RetryDecision {
  shouldRetry: boolean;
  reason: string;
  suggestedDelay?: number;
  modificationStrategy?: "aggressive" | "moderate" | "minimal";
}

// Progress tracking
export interface RetryProgress {
  attemptNumber: number;
  scoreHistory: {
    relevance: number[];
    accuracy: number[];
    completeness: number[];
    overall: number[];
  };
  improvementTrend: "improving" | "stagnant" | "declining";
  estimatedAttemptsRemaining: number;
}

// Enhanced options for retry
export interface EnhancedRetryOptions extends TextGenerationOptions {
  retryMetadata?: {
    attemptNumber: number;
    previousFeedback: RetryFeedback;
    focusAreas: string[];
    mandatoryImprovements: string[];
  };
}

// Retry result
export interface RetryResult {
  success: boolean;
  finalContent: string;
  finalEvaluation: EvaluationResult;
  attempts: RetryAttempt[];
  totalDuration: number;
  averageScoreImprovement: number;
  retryMetadata: {
    reasonForSuccess?: string;
    reasonForFailure?: string;
    bottlenecks?: string[];
  };
}

// Strategy patterns for retry
export enum RetryStrategy {
  STANDARD = "standard", // Normal progressive enhancement
  AGGRESSIVE = "aggressive", // More dramatic prompt changes
  CONSERVATIVE = "conservative", // Minimal changes, focus on specific issues
  ADAPTIVE = "adaptive", // Adjusts based on improvement trends
}

// Feedback integration mode
export enum FeedbackIntegrationMode {
  APPEND = "append", // Add feedback to existing prompt
  REPLACE = "replace", // Replace sections with feedback
  MERGE = "merge", // Intelligently merge feedback
  HIERARCHICAL = "hierarchical", // Layer feedback by importance
}
