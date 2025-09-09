import type { EnhancedEvaluationContext, EvaluationResult } from "./types.js";
import type { ChatMessage } from "../types/conversationTypes.js";
import type { GenerateResult } from "../types/generateTypes.js";
import type { TextGenerationOptions } from "../core/types.js";
import { QueryIntentAnalyzer } from "./queryIntentAnalyzer.js";
import { ToolExecutionExtractor } from "./toolExecutionExtractor.js";
import { ConversationEnhancer } from "./conversationEnhancer.js";

export class ContextBuilder {
  private readonly queryAnalyzer: QueryIntentAnalyzer;
  private readonly toolExtractor: ToolExecutionExtractor;
  private readonly conversationEnhancer: ConversationEnhancer;

  constructor() {
    this.queryAnalyzer = new QueryIntentAnalyzer();
    this.toolExtractor = new ToolExecutionExtractor();
    this.conversationEnhancer = new ConversationEnhancer();
  }

  async build(
    result: GenerateResult,
    options: TextGenerationOptions,
    additionalContext?: {
      previousEvaluations?: EvaluationResult[];
      attemptNumber?: number;
      sessionId?: string;
      userId?: string;
    },
  ): Promise<EnhancedEvaluationContext> {
    const startTime = Date.now();

    // Extract user query
    const userQuery = this.extractUserQuery(options);

    // Analyze query intent
    const queryAnalysis = this.queryAnalyzer.analyze(userQuery);

    // Extract tool executions
    const toolExecutions = this.toolExtractor.extract(result);

    // Enhance conversation history
    const conversationHistory = this.conversationEnhancer.enhance(
      options.conversationMessages,
      userQuery,
      result.content,
      {
        provider: result.provider,
        model: result.model,
        responseTime: result.responseTime,
        tokenUsage: result.usage
          ? {
              prompt: result.usage.input,
              completion: result.usage.output,
              total: result.usage.total,
            }
          : undefined,
      },
    );

    // Generate conversation summary if history is long
    const conversationSummary =
      conversationHistory.length > 5
        ? this.conversationEnhancer.generateSummary(conversationHistory)
        : undefined;

    // Build generation parameters
    const generationParams = this.extractGenerationParams(options);

    // Calculate performance metrics
    const responseTime = result.responseTime || Date.now() - startTime;

    // Construct the enhanced context
    const context: EnhancedEvaluationContext = {
      // Query Information
      userQuery,
      queryAnalysis,

      // Response Information
      aiResponse: result.content,
      provider: result.provider || "unknown",
      model: result.model || "unknown",

      // Generation Metadata
      generationParams,

      // Tool Execution Data
      toolExecutions,

      // Conversation Context
      conversationHistory,
      conversationSummary,

      // Performance Data
      responseTime,
      tokenUsage: result.usage
        ? {
            prompt: result.usage.input,
            completion: result.usage.output,
            total: result.usage.total,
          }
        : {
            prompt: 0,
            completion: 0,
            total: 0,
          },

      // Retry Context
      previousEvaluations: additionalContext?.previousEvaluations,
      attemptNumber: additionalContext?.attemptNumber || 1,

      // Additional Context
      context: options.context,
      sessionId: additionalContext?.sessionId,
      userId: additionalContext?.userId,
    };

    return context;
  }

  private extractUserQuery(options: TextGenerationOptions): string {
    // If there's a direct prompt, use it
    if (typeof options === "string") {
      return options;
    }

    // If there's an input.text, use it
    if (options.input?.text) {
      return options.input.text;
    }

    // Otherwise, extract from messages
    if (
      options.conversationMessages &&
      options.conversationMessages.length > 0
    ) {
      // Find the last user message
      for (let i = options.conversationMessages.length - 1; i >= 0; i--) {
        if (options.conversationMessages[i].role === "user") {
          return options.conversationMessages[i].content;
        }
      }
    }

    return "No user query found";
  }

  private extractGenerationParams(
    options: TextGenerationOptions,
  ): EnhancedEvaluationContext["generationParams"] {
    if (typeof options === "string") {
      return {};
    }

    return {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      systemPrompt: this.extractSystemPrompt(options.conversationMessages),
      // Note: topP, presencePenalty, frequencyPenalty are provider-specific
      // and not part of base TextGenerationOptions
    };
  }

  private extractSystemPrompt(messages?: ChatMessage[]): string | undefined {
    if (!messages || messages.length === 0) {
      return undefined;
    }

    // Find the first system message
    const systemMessage = messages.find((m) => m.role === "system");
    return systemMessage?.content;
  }

  // Utility method to create a minimal context for testing
  static createMinimalContext(
    query: string,
    response: string,
    provider: string = "test",
    model: string = "test-model",
  ): EnhancedEvaluationContext {
    const analyzer = new QueryIntentAnalyzer();

    return {
      userQuery: query,
      queryAnalysis: analyzer.analyze(query),
      aiResponse: response,
      provider,
      model,
      generationParams: {},
      toolExecutions: [],
      conversationHistory: [
        {
          role: "user",
          content: query,
          timestamp: Date.now(),
        },
        {
          role: "assistant",
          content: response,
          timestamp: Date.now(),
        },
      ],
      responseTime: 100,
      tokenUsage: {
        prompt: 10,
        completion: 20,
        total: 30,
      },
      attemptNumber: 1,
    };
  }

  // Method to enrich context with domain-specific information
  enrichWithDomain(
    context: EnhancedEvaluationContext,
    domain: string,
  ): EnhancedEvaluationContext {
    const domainEnrichments: Record<string, unknown> = {
      healthcare: {
        requiresMedicalAccuracy: true,
        sensitivityLevel: "high",
        disclaimerRequired: true,
      },
      finance: {
        requiresNumericalAccuracy: true,
        regulatoryCompliance: true,
        disclaimerRequired: true,
      },
      legal: {
        requiresLegalAccuracy: true,
        jurisdictionAware: true,
        disclaimerRequired: true,
      },
      education: {
        ageAppropriate: true,
        learningObjectivesAlignment: true,
      },
    };

    if (domainEnrichments[domain]) {
      context.context = {
        ...context.context,
        domainRequirements: domainEnrichments[domain],
      };
    }

    return context;
  }
}

// Export a singleton instance for convenience
export const contextBuilder = new ContextBuilder();
