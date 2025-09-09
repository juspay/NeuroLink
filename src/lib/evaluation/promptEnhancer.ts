import type {
  RetryFeedback,
  RetryAttempt,
  RetryStrategy,
  PromptModification,
} from "./retryTypes.js";
import type { TextGenerationOptions } from "../core/types.js";

export class PromptEnhancer {
  enhancePrompt(
    originalOptions: TextGenerationOptions,
    feedback: RetryFeedback,
    strategy: RetryStrategy,
    previousAttempts: RetryAttempt[],
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    switch (strategy) {
      case RetryStrategy.STANDARD:
        return this.standardEnhancement(originalOptions, feedback);

      case RetryStrategy.AGGRESSIVE:
        return this.aggressiveEnhancement(
          originalOptions,
          feedback,
          previousAttempts,
        );

      case RetryStrategy.CONSERVATIVE:
        return this.conservativeEnhancement(originalOptions, feedback);

      case RetryStrategy.ADAPTIVE:
        return this.adaptiveEnhancement(
          originalOptions,
          feedback,
          previousAttempts,
        );

      default:
        return { options: originalOptions, modifications: [] };
    }
  }

  private standardEnhancement(
    options: TextGenerationOptions,
    feedback: RetryFeedback,
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    const modifications: PromptModification[] = [];
    const enhanced = this.cloneOptions(options);

    // Add structured feedback
    const feedbackPrompt = this.createStructuredFeedback(feedback);

    if (typeof enhanced === "string") {
      const newPrompt = `${feedbackPrompt}\n\nOriginal request: ${enhanced}`;

      modifications.push({
        type: "userPrompt",
        originalContent: enhanced,
        modifiedContent: newPrompt,
        reason: "Standard feedback enhancement",
      });

      return { options: newPrompt, modifications };
    }

    // For message-based options
    this.injectFeedbackMessage(enhanced, feedbackPrompt);
    modifications.push({
      type: "systemPrompt",
      originalContent: JSON.stringify(enhanced.messages),
      modifiedContent: JSON.stringify(enhanced.messages),
      reason: "Injected standard feedback",
    });

    return { options: enhanced, modifications };
  }

  private aggressiveEnhancement(
    options: TextGenerationOptions,
    feedback: RetryFeedback,
    previousAttempts: RetryAttempt[],
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    const modifications: PromptModification[] = [];
    const enhanced = this.cloneOptions(options);

    // Create strong directive
    const directive = this.createAggressiveDirective(
      feedback,
      previousAttempts,
    );

    if (typeof enhanced === "string") {
      // Completely restructure the prompt
      const newPrompt = `${directive}

ORIGINAL REQUEST (interpret with above requirements):
${enhanced}

Remember: This is attempt ${feedback.attempt}. Previous attempts failed due to:
${feedback.specificIssues.slice(0, 2).join("\n")}

YOU MUST ACHIEVE ALL SCORES >= 7/10.`;

      modifications.push({
        type: "userPrompt",
        originalContent: enhanced,
        modifiedContent: newPrompt,
        reason: "Aggressive restructuring for attempt " + feedback.attempt,
      });

      return { options: newPrompt, modifications };
    }

    // For message-based - add multiple system messages
    this.addMultipleSystemMessages(enhanced, [
      directive,
      this.createScoreRequirements(),
      this.createExampleStructure(feedback),
    ]);

    modifications.push({
      type: "systemPrompt",
      originalContent: JSON.stringify(options.messages || []),
      modifiedContent: JSON.stringify(enhanced.messages),
      reason: "Aggressive multi-layer enhancement",
    });

    return { options: enhanced, modifications };
  }

  private conservativeEnhancement(
    options: TextGenerationOptions,
    feedback: RetryFeedback,
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    const modifications: PromptModification[] = [];
    const enhanced = this.cloneOptions(options);

    // Focus only on the most critical issue
    const criticalIssue = feedback.specificIssues[0];
    const primaryImprovement = feedback.requiredImprovements[0];

    const minimalFeedback = `Please address this specific issue: ${criticalIssue}
Improvement needed: ${primaryImprovement}`;

    if (typeof enhanced === "string") {
      const newPrompt = `${enhanced}\n\nNote: ${minimalFeedback}`;

      modifications.push({
        type: "userPrompt",
        originalContent: enhanced,
        modifiedContent: newPrompt,
        reason: "Conservative single-issue focus",
      });

      return { options: newPrompt, modifications };
    }

    // Add as single note
    this.addNote(enhanced, minimalFeedback);
    modifications.push({
      type: "context",
      originalContent: "",
      modifiedContent: minimalFeedback,
      reason: "Minimal conservative enhancement",
    });

    return { options: enhanced, modifications };
  }

  private adaptiveEnhancement(
    options: TextGenerationOptions,
    feedback: RetryFeedback,
    previousAttempts: RetryAttempt[],
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    // Analyze improvement trend
    const trend = this.analyzeTrend(previousAttempts);

    // Choose strategy based on trend
    if (trend === "declining" || trend === "stagnant") {
      // Switch to aggressive if not improving
      return this.aggressiveEnhancement(options, feedback, previousAttempts);
    } else if (trend === "rapid_improvement") {
      // Use conservative if improving well
      return this.conservativeEnhancement(options, feedback);
    } else {
      // Standard for steady improvement
      return this.standardEnhancement(options, feedback);
    }
  }

  private createStructuredFeedback(feedback: RetryFeedback): string {
    return `QUALITY IMPROVEMENT REQUIRED (Attempt ${feedback.attempt}):

Key Issues to Fix:
${feedback.specificIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Specific Improvements Needed:
${feedback.requiredImprovements.map((imp, i) => `${i + 1}. ${imp}`).join("\n")}

Focus on These Areas:
${feedback.focusAreas.map((area) => `• ${area}`).join("\n")}

Constraints:
${feedback.constraints.map((c) => `• ${c}`).join("\n")}`;
  }

  private createAggressiveDirective(
    feedback: RetryFeedback,
    attempts: RetryAttempt[],
  ): string {
    const failedScores = attempts.map((a) => a.evaluation.overall).join(", ");

    return `CRITICAL: Previous ${attempts.length} attempts failed (scores: ${failedScores}).

MANDATORY REQUIREMENTS:
1. MUST achieve Relevance >= 7/10
2. MUST achieve Accuracy >= 7/10  
3. MUST achieve Completeness >= 7/10
4. MUST achieve Overall >= 7/10

SPECIFIC FAILURES TO AVOID:
${feedback.specificIssues.map((issue) => `❌ ${issue}`).join("\n")}

EXACT IMPROVEMENTS REQUIRED:
${feedback.requiredImprovements.map((imp) => `✓ ${imp}`).join("\n")}

This is your FINAL CHANCE. Follow these requirements EXACTLY.`;
  }

  private createScoreRequirements(): string {
    return `SCORING REQUIREMENTS:
- Relevance: Address every aspect of the user's query directly
- Accuracy: Ensure all facts are correct and verifiable
- Completeness: Cover all necessary information thoroughly
- Overall: Maintain high quality throughout the response`;
  }

  private createExampleStructure(feedback: RetryFeedback): string {
    return `RESPONSE STRUCTURE GUIDE:
1. Start by directly addressing the main query
2. Provide comprehensive information covering all aspects
3. Ensure accuracy in every statement
4. Include relevant examples or details
5. Conclude with a summary if appropriate

Avoid these patterns from previous attempts:
${feedback.specificIssues
  .slice(0, 2)
  .map((issue) => `- ${issue}`)
  .join("\n")}`;
  }

  private analyzeTrend(attempts: RetryAttempt[]): string {
    if (attempts.length < 2) {
      return "insufficient_data";
    }

    const scores = attempts.map((a) => a.evaluation.overall);
    // const lastDelta = scores[scores.length - 1] - scores[scores.length - 2];
    const avgDelta = this.calculateAverageDelta(scores);

    if (avgDelta > 1.5) {
      return "rapid_improvement";
    }
    if (avgDelta > 0.5) {
      return "steady_improvement";
    }
    if (avgDelta > -0.5) {
      return "stagnant";
    }
    return "declining";
  }

  private calculateAverageDelta(scores: number[]): number {
    if (scores.length < 2) {
      return 0;
    }

    let totalDelta = 0;
    for (let i = 1; i < scores.length; i++) {
      totalDelta += scores[i] - scores[i - 1];
    }

    return totalDelta / (scores.length - 1);
  }

  private cloneOptions(options: TextGenerationOptions): TextGenerationOptions {
    return JSON.parse(JSON.stringify(options));
  }

  private injectFeedbackMessage(
    options: TextGenerationOptions,
    feedback: string,
  ): void {
    if (!options.messages) {
      options.messages = [];
    }

    // Find the best position to inject
    const lastUserIndex = this.findLastUserMessageIndex(options.messages);

    if (lastUserIndex >= 0) {
      // Insert after last user message
      options.messages.splice(lastUserIndex + 1, 0, {
        role: "system",
        content: feedback,
      });
    } else {
      // Add at the beginning
      options.messages.unshift({
        role: "system",
        content: feedback,
      });
    }
  }

  private findLastUserMessageIndex(
    messages: { role: string; content: string }[],
  ): number {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return i;
      }
    }
    return -1;
  }

  private addMultipleSystemMessages(
    options: TextGenerationOptions,
    messages: string[],
  ): void {
    if (!options.messages) {
      options.messages = [];
    }

    messages.forEach((msg) => {
      options.messages.push({
        role: "system",
        content: msg,
      });
    });
  }

  private addNote(options: TextGenerationOptions, note: string): void {
    if (!options.messages) {
      options.messages = [];
    }

    // Add as assistant message to make it conversational
    options.messages.push({
      role: "assistant",
      content: `I'll keep in mind: ${note}`,
    });
  }
}
