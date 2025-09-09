import { z } from "zod";

// Query Intent Types
export interface QueryIntentAnalysis {
  primaryIntent: QueryIntent;
  complexity: QueryComplexity;
  expectedResponseType: ResponseType;
  domains: string[];
  requiresTools: boolean;
  suggestedTools: string[];
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
}

export enum QueryIntent {
  QUESTION = "question",
  COMMAND = "command",
  CREATIVE = "creative",
  ANALYSIS = "analysis",
  EXPLANATION = "explanation",
  TROUBLESHOOTING = "troubleshooting",
  CODE_GENERATION = "code_generation",
  CONVERSATION = "conversation",
}

export enum QueryComplexity {
  SIMPLE = "simple", // Single straightforward question
  MODERATE = "moderate", // Multi-part or requires some reasoning
  COMPLEX = "complex", // Requires deep analysis or multiple tools
}

export enum ResponseType {
  FACTUAL = "factual",
  ANALYTICAL = "analytical",
  CREATIVE = "creative",
  INSTRUCTIONAL = "instructional",
  CONVERSATIONAL = "conversational",
  CODE = "code",
}

// Tool Execution Types
export interface ExtractedToolExecution {
  toolName: string;
  toolCallId: string;
  input: Record<string, unknown>;
  output: unknown;
  duration: number;
  success: boolean;
  error?: string;
  metadata: {
    timestamp: number;
    sequenceNumber: number;
    retryCount: number;
  };
}

// Enhanced Conversation Types
export interface EnhancedConversationTurn {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: {
    tokenCount?: number;
    responseTime?: number;
    toolCalls?: string[];
    evaluationScore?: number;
    provider?: string;
    model?: string;
  };
}

// Enhanced Evaluation Context
export interface EnhancedEvaluationContext {
  // Query Information
  userQuery: string;
  queryAnalysis: QueryIntentAnalysis;

  // Response Information
  aiResponse: string;
  provider: string;
  model: string;

  // Generation Metadata
  generationParams: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };

  // Tool Execution Data
  toolExecutions: ExtractedToolExecution[];

  // Conversation Context
  conversationHistory: EnhancedConversationTurn[];
  conversationSummary?: string;

  // Performance Data
  responseTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };

  // Retry Context
  previousEvaluations?: EvaluationResult[];
  attemptNumber: number;

  // Additional Context
  context?: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
}

// Evaluation Result for Reference
export interface EvaluationResult {
  relevance: number;
  accuracy: number;
  completeness: number;
  overall: number;

  domainAlignment?: number;
  terminologyAccuracy?: number;
  toolEffectiveness?: number;

  isOffTopic: boolean;
  alertSeverity: "low" | "medium" | "high" | "none";
  reasoning: string;
  suggestedImprovements?: string;

  evaluationModel: string;
  evaluationTime: number;
  evaluationProvider?: string;
}

// Validation Schemas
export const QueryIntentAnalysisSchema = z.object({
  primaryIntent: z.nativeEnum(QueryIntent),
  complexity: z.nativeEnum(QueryComplexity),
  expectedResponseType: z.nativeEnum(ResponseType),
  domains: z.array(z.string()),
  requiresTools: z.boolean(),
  suggestedTools: z.array(z.string()),
  keywords: z.array(z.string()),
  sentiment: z.enum(["positive", "neutral", "negative"]),
});

export const ExtractedToolExecutionSchema = z.object({
  toolName: z.string(),
  toolCallId: z.string(),
  input: z.record(z.any()),
  output: z.any(),
  duration: z.number(),
  success: z.boolean(),
  error: z.string().optional(),
  metadata: z.object({
    timestamp: z.number(),
    sequenceNumber: z.number(),
    retryCount: z.number(),
  }),
});
