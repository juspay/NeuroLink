import { z } from "zod";

// Evaluation criteria with detailed rubrics
export interface EvaluationCriteria {
  name: string;
  description: string;
  weight: number;
  rubric: Record<number, string>; // Score -> description mapping
}

// Atomic statement for component-wise evaluation
export interface AtomicStatement {
  id: string;
  content: string;
  type: "fact" | "opinion" | "instruction" | "explanation" | "example";
  importance: "critical" | "important" | "supplementary";
  evaluationScores?: Record<string, number>;
}

// Evaluation prompt sections
export interface EvaluationPromptSections {
  systemPrompt: string;
  contextSection: string;
  querySection: string;
  responseSection: string;
  criteriaSection: string;
  instructionsSection: string;
  formatSection: string;
  examplesSection?: string;
}

// Structured evaluation result
export interface StructuredEvaluation {
  scores: {
    relevance: number;
    accuracy: number;
    completeness: number;
    overall: number;
  };

  analysis: {
    strengths: string[];
    weaknesses: string[];
    missingElements: string[];
    suggestions: string[];
  };

  flags: {
    isOffTopic: boolean;
    hasHallucination: boolean;
    hasIncompleteAnswer: boolean;
    hasMisinformation: boolean;
  };

  metadata: {
    atomicStatementCount: number;
    evaluationDuration: number;
    confidence: number; // 0-1 confidence in evaluation
  };

  reasoning: string;
  alertSeverity: "none" | "low" | "medium" | "high";
}

// Feedback for retry attempts
export interface RetryFeedback {
  attempt: number;
  specificIssues: string[];
  requiredImprovements: string[];
  constraints: string[];
  focusAreas: string[];
}

// Evaluation configuration
export interface EvaluationConfig {
  provider?: string;
  model?: string;
  temperature?: number;
  maxRetries?: number;
  timeout?: number;
}

// Core evaluation criteria
export const CORE_CRITERIA: EvaluationCriteria[] = [
  {
    name: "relevance",
    description: "How well the response addresses the user's query",
    weight: 0.3,
    rubric: {
      1: "Completely off-topic, does not address the query at all",
      3: "Partially addresses the query but misses key points",
      5: "Addresses the query but with some irrelevant information",
      7: "Mostly relevant with minor deviations",
      9: "Highly relevant, directly addresses all aspects",
      10: "Perfect relevance, comprehensive coverage of the query",
    },
  },
  {
    name: "accuracy",
    description: "Factual correctness and precision of information",
    weight: 0.3,
    rubric: {
      1: "Contains significant factual errors or hallucinations",
      3: "Multiple minor errors or questionable statements",
      5: "Generally accurate with some imprecision",
      7: "Mostly accurate with minor issues",
      9: "Highly accurate with negligible errors",
      10: "Completely accurate and precise",
    },
  },
  {
    name: "completeness",
    description: "How thoroughly the response covers the topic",
    weight: 0.2,
    rubric: {
      1: "Severely incomplete, missing most required information",
      3: "Missing several important aspects",
      5: "Covers basics but lacks depth",
      7: "Good coverage with some gaps",
      9: "Comprehensive with minor omissions",
      10: "Exhaustive coverage of all aspects",
    },
  },
  {
    name: "overall",
    description: "General quality assessment",
    weight: 0.2,
    rubric: {
      1: "Unacceptable quality",
      3: "Poor quality with significant issues",
      5: "Average quality, meets minimum standards",
      7: "Good quality with room for improvement",
      9: "Excellent quality",
      10: "Outstanding quality",
    },
  },
];

// Validation schemas
export const StructuredEvaluationSchema = z.object({
  scores: z.object({
    relevance: z.number().min(1).max(10),
    accuracy: z.number().min(1).max(10),
    completeness: z.number().min(1).max(10),
    overall: z.number().min(1).max(10),
  }),
  analysis: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    missingElements: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  flags: z.object({
    isOffTopic: z.boolean(),
    hasHallucination: z.boolean(),
    hasIncompleteAnswer: z.boolean(),
    hasMisinformation: z.boolean(),
  }),
  metadata: z.object({
    atomicStatementCount: z.number(),
    evaluationDuration: z.number(),
    confidence: z.number().min(0).max(1),
  }),
  reasoning: z.string(),
  alertSeverity: z.enum(["none", "low", "medium", "high"]),
});
