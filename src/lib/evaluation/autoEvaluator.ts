import type { EnhancedEvaluationContext, EvaluationResult } from "./types.js";
import type {
  StructuredEvaluation,
  EvaluationConfig,
  RetryFeedback,
} from "./evaluationTypes.js";
import { EvaluationPromptBuilder } from "./promptBuilder.js";
import { ScoreParser } from "./scoreParser.js";
import { FeedbackGenerator } from "./feedbackGenerator.js";
import { AIProviderFactory } from "../core/factory.js";
import type { BaseProvider } from "../core/baseProvider.js";
import { CORE_CRITERIA } from "./evaluationTypes.js";

export class AutoEvaluator {
  private promptBuilder: EvaluationPromptBuilder;
  private scoreParser: ScoreParser;
  private feedbackGenerator: FeedbackGenerator;
  private evaluationProvider?: BaseProvider;
  private config: EvaluationConfig;

  constructor(config: EvaluationConfig = {}) {
    this.promptBuilder = new EvaluationPromptBuilder();
    this.scoreParser = new ScoreParser();
    this.feedbackGenerator = new FeedbackGenerator();
    this.config = {
      provider:
        config.provider ||
        process.env.NEUROLINK_EVALUATION_PROVIDER ||
        "google-ai",
      model:
        config.model ||
        process.env.NEUROLINK_EVALUATION_MODEL ||
        "gemini-2.0-flash",
      temperature: config.temperature || 0.3,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      ...config,
    };
  }

  async evaluate(
    context: EnhancedEvaluationContext,
    previousFeedback?: RetryFeedback,
  ): Promise<EvaluationResult> {
    const startTime = Date.now();

    try {
      // Get evaluation provider
      const provider = await this.getEvaluationProvider();

      // Determine evaluation criteria
      const criteria = this.determineCriteria(context);

      // Build evaluation prompt
      const prompt = this.buildPrompt(context, criteria, previousFeedback);

      // Call evaluation model
      const response = await provider.generate({
        prompt,
        temperature: this.config.temperature,
        maxTokens: 2000,
        timeout: this.config.timeout,
      });

      // Parse evaluation response
      const evaluation = this.scoreParser.parseEvaluationResponse(
        response.content,
        Date.now() - startTime,
      );

      // Validate score consistency
      if (!this.scoreParser.validateScoreConsistency(evaluation)) {
        console.warn("Evaluation scores show inconsistency");
      }

      // Convert to standard format
      return this.convertToEvaluationResult(
        evaluation,
        provider.providerName,
        this.config.model || "auto",
      );
    } catch (error) {
      console.error("Evaluation failed:", error);
      return this.getDefaultEvaluation(error as Error);
    }
  }

  generateFeedback(
    evaluation: EvaluationResult,
    context: EnhancedEvaluationContext,
    attemptNumber: number,
  ): RetryFeedback {
    // Convert to structured evaluation for feedback generation
    const structured = this.convertToStructuredEvaluation(evaluation);

    return this.feedbackGenerator.generateRetryFeedback(
      structured,
      context,
      attemptNumber,
    );
  }

  generateRetryPrompt(feedback: RetryFeedback): string {
    return this.feedbackGenerator.generateRetrySystemPrompt(feedback);
  }

  private async getEvaluationProvider(): Promise<BaseProvider> {
    if (!this.evaluationProvider) {
      const factory = new AIProviderFactory();
      this.evaluationProvider = await factory.createProvider(
        this.config.provider || "auto",
        this.config.model,
      );
    }
    return this.evaluationProvider;
  }

  private determineCriteria(_context: EnhancedEvaluationContext) {
    return [...CORE_CRITERIA];
  }

  private buildPrompt(
    context: EnhancedEvaluationContext,
    criteria: EvaluationCriteria[],
    previousFeedback?: RetryFeedback,
  ): string {
    // Default evaluation
    return this.promptBuilder.buildEvaluationPrompt(
      context,
      criteria,
      previousFeedback,
    );
  }

  private convertToEvaluationResult(
    evaluation: StructuredEvaluation,
    provider: string,
    model: string,
  ): EvaluationResult {
    const result: EvaluationResult = {
      relevance: evaluation.scores.relevance,
      accuracy: evaluation.scores.accuracy,
      completeness: evaluation.scores.completeness,
      overall: evaluation.scores.overall,

      isOffTopic: evaluation.flags.isOffTopic,
      alertSeverity: evaluation.alertSeverity,
      reasoning: evaluation.reasoning,
      suggestedImprovements: evaluation.analysis.suggestions.join("; "),

      evaluationModel: model,
      evaluationTime: evaluation.metadata.evaluationDuration,
      evaluationProvider: provider,
    };

    return result;
  }

  private convertToStructuredEvaluation(
    result: EvaluationResult,
  ): StructuredEvaluation {
    return {
      scores: {
        relevance: result.relevance,
        accuracy: result.accuracy,
        completeness: result.completeness,
        overall: result.overall,
      },
      analysis: {
        strengths: [],
        weaknesses: [],
        missingElements: [],
        suggestions: result.suggestedImprovements?.split("; ") || [],
      },
      flags: {
        isOffTopic: result.isOffTopic,
        hasHallucination: false,
        hasIncompleteAnswer: result.completeness < 7,
        hasMisinformation: result.accuracy < 5,
      },
      metadata: {
        atomicStatementCount: 0,
        evaluationDuration: result.evaluationTime,
        confidence: 0.8,
      },
      reasoning: result.reasoning,
      alertSeverity: result.alertSeverity,
    };
  }

  private getDefaultEvaluation(error: Error): EvaluationResult {
    return {
      relevance: 5,
      accuracy: 5,
      completeness: 5,
      overall: 5,
      isOffTopic: false,
      alertSeverity: "medium",
      reasoning: `Evaluation failed: ${error.message}`,
      evaluationModel: this.config.model || "auto",
      evaluationTime: 0,
      evaluationProvider: this.config.provider,
    };
  }

  // Check if response meets quality threshold
  meetsQualityThreshold(
    evaluation: EvaluationResult,
    threshold: number = 7,
  ): boolean {
    const scores = [
      evaluation.relevance,
      evaluation.accuracy,
      evaluation.completeness,
      evaluation.overall,
    ];

    return scores.every((score) => score >= threshold);
  }

  // Get detailed quality report
  getQualityReport(evaluation: EvaluationResult): string {
    const scores = [
      `Relevance: ${evaluation.relevance}/10`,
      `Accuracy: ${evaluation.accuracy}/10`,
      `Completeness: ${evaluation.completeness}/10`,
      `Overall: ${evaluation.overall}/10`,
    ];

    if (evaluation.domainAlignment !== undefined) {
      scores.push(`Domain Alignment: ${evaluation.domainAlignment}/10`);
    }

    return `Quality Report:
${scores.join("\n")}

${evaluation.reasoning}

Alert Level: ${evaluation.alertSeverity}
${evaluation.isOffTopic ? "⚠️ Response is off-topic" : ""}
${evaluation.suggestedImprovements ? `\nSuggestions: ${evaluation.suggestedImprovements}` : ""}`;
  }
}

// Export singleton instance for convenience
export const autoEvaluator = new AutoEvaluator();
