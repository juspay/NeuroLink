import type {
  RetryFeedback,
  PromptModification,
  FeedbackIntegrationMode,
  RetryAttempt,
} from "./retryTypes.js";
import type { TextGenerationOptions } from "../core/types.js";

export class FeedbackIntegrator {
  integrateFeedback(
    originalOptions: TextGenerationOptions,
    feedback: RetryFeedback,
    previousAttempts: RetryAttempt[],
    mode: FeedbackIntegrationMode = FeedbackIntegrationMode.MERGE,
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    const modifications: PromptModification[] = [];
    const modifiedOptions = this.deepClone(originalOptions);

    switch (mode) {
      case FeedbackIntegrationMode.APPEND:
        return this.appendFeedback(modifiedOptions, feedback, modifications);

      case FeedbackIntegrationMode.REPLACE:
        return this.replaceSections(modifiedOptions, feedback, modifications);

      case FeedbackIntegrationMode.MERGE:
        return this.mergeFeedback(
          modifiedOptions,
          feedback,
          previousAttempts,
          modifications,
        );

      case FeedbackIntegrationMode.HIERARCHICAL:
        return this.hierarchicalIntegration(
          modifiedOptions,
          feedback,
          previousAttempts,
          modifications,
        );

      default:
        return { options: modifiedOptions, modifications };
    }
  }

  private appendFeedback(
    options: TextGenerationOptions,
    feedback: RetryFeedback,
    modifications: PromptModification[],
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    const feedbackMessage = this.createFeedbackMessage(feedback);

    if (typeof options === "string") {
      // Simple string prompt - create messages array
      const newOptions: TextGenerationOptions = {
        messages: [
          { role: "user", content: options },
          { role: "system", content: feedbackMessage },
        ],
      };

      modifications.push({
        type: "userPrompt",
        originalContent: options,
        modifiedContent: JSON.stringify(newOptions.messages),
        reason: "Converted string to messages with feedback",
      });

      return { options: newOptions, modifications };
    }

    // Add feedback as system message
    if (!options.messages) {
      options.messages = [];
    }

    const originalMessages = JSON.stringify(options.messages);
    options.messages.push({
      role: "system",
      content: feedbackMessage,
    });

    modifications.push({
      type: "systemPrompt",
      originalContent: originalMessages,
      modifiedContent: JSON.stringify(options.messages),
      reason: "Appended feedback as system message",
    });

    return { options, modifications };
  }

  private replaceSections(
    options: TextGenerationOptions,
    feedback: RetryFeedback,
    modifications: PromptModification[],
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    const enhancedPrompt = this.buildEnhancedPrompt(feedback);

    if (typeof options === "string") {
      modifications.push({
        type: "userPrompt",
        originalContent: options,
        modifiedContent: enhancedPrompt,
        reason: "Replaced with enhanced prompt based on feedback",
      });

      return { options: enhancedPrompt, modifications };
    }

    // Replace system prompt if exists
    if (options.messages && options.messages.length > 0) {
      const systemIndex = options.messages.findIndex(
        (m) => m.role === "system",
      );

      if (systemIndex >= 0) {
        const original = options.messages[systemIndex].content;
        options.messages[systemIndex].content = this.enhanceSystemPrompt(
          original,
          feedback,
        );

        modifications.push({
          type: "systemPrompt",
          originalContent: original,
          modifiedContent: options.messages[systemIndex].content,
          reason: "Enhanced system prompt with feedback",
        });
      }
    }

    return { options, modifications };
  }

  private mergeFeedback(
    options: TextGenerationOptions,
    feedback: RetryFeedback,
    previousAttempts: RetryAttempt[],
    modifications: PromptModification[],
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    // Start with basic append
    const result = this.appendFeedback(options, feedback, modifications);

    // Add context about previous attempts
    if (previousAttempts.length > 0) {
      const contextMessage = this.createAttemptContext(previousAttempts);

      if (result.options.messages) {
        result.options.messages.push({
          role: "system",
          content: contextMessage,
        });

        modifications.push({
          type: "context",
          originalContent: "",
          modifiedContent: contextMessage,
          reason: "Added context about previous attempts",
        });
      }
    }

    // Enhance temperature and other params based on attempts
    const paramModifications = this.adjustGenerationParams(
      result.options,
      feedback.attempt,
    );

    modifications.push(...paramModifications);

    return result;
  }

  private hierarchicalIntegration(
    options: TextGenerationOptions,
    feedback: RetryFeedback,
    previousAttempts: RetryAttempt[],
    modifications: PromptModification[],
  ): { options: TextGenerationOptions; modifications: PromptModification[] } {
    let result = this.deepClone(options) as TextGenerationOptions;

    // Layer 1: Critical issues
    const criticalIssues = feedback.specificIssues.filter(
      (issue) =>
        issue.includes("hallucination") ||
        issue.includes("off-topic") ||
        issue.includes("misinformation"),
    );

    if (criticalIssues.length > 0) {
      const criticalMessage = `CRITICAL ISSUES TO ADDRESS:
${criticalIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

These MUST be fixed in your response.`;

      result = this.prependSystemMessage(result, criticalMessage);
      modifications.push({
        type: "systemPrompt",
        originalContent: "",
        modifiedContent: criticalMessage,
        reason: "Added critical issues layer",
      });
    }

    // Layer 2: Required improvements
    if (feedback.requiredImprovements.length > 0) {
      const improvementMessage = `REQUIRED IMPROVEMENTS:
${feedback.requiredImprovements.map((imp, i) => `${i + 1}. ${imp}`).join("\n")}`;

      result = this.appendSystemMessage(result, improvementMessage);
      modifications.push({
        type: "systemPrompt",
        originalContent: "",
        modifiedContent: improvementMessage,
        reason: "Added required improvements layer",
      });
    }

    // Layer 3: Constraints
    if (feedback.constraints.length > 0) {
      const constraintMessage = `CONSTRAINTS FOR THIS ATTEMPT:
${feedback.constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}`;

      result = this.appendSystemMessage(result, constraintMessage);
      modifications.push({
        type: "constraints",
        originalContent: "",
        modifiedContent: constraintMessage,
        reason: "Added constraints layer",
      });
    }

    return { options: result, modifications };
  }

  private createFeedbackMessage(feedback: RetryFeedback): string {
    return `EVALUATION FEEDBACK (Attempt ${feedback.attempt}):

Issues Identified:
${feedback.specificIssues.map((issue) => `- ${issue}`).join("\n")}

Required Improvements:
${feedback.requiredImprovements.map((imp) => `- ${imp}`).join("\n")}

Focus Areas:
${feedback.focusAreas.map((area) => `- ${area}`).join("\n")}

Constraints:
${feedback.constraints.map((constraint) => `- ${constraint}`).join("\n")}

Your response MUST address all these points to achieve a quality score of 7+.`;
  }

  private buildEnhancedPrompt(feedback: RetryFeedback): string {
    return `Based on the evaluation feedback, please provide a response that:

${feedback.requiredImprovements.map((imp, i) => `${i + 1}. ${imp}`).join("\n")}

Remember to:
${feedback.focusAreas.map((area) => `- ${area}`).join("\n")}

Constraints:
${feedback.constraints.map((c) => `- ${c}`).join("\n")}`;
  }

  private enhanceSystemPrompt(
    original: string,
    feedback: RetryFeedback,
  ): string {
    return `${original}

IMPORTANT - Based on previous evaluation:
${feedback.specificIssues.map((issue) => `- ${issue}`).join("\n")}

You MUST:
${feedback.requiredImprovements
  .slice(0, 3)
  .map((imp) => `- ${imp}`)
  .join("\n")}`;
  }

  private createAttemptContext(attempts: RetryAttempt[]): string {
    const lastAttempt = attempts[attempts.length - 1];
    const scoreProgression = attempts
      .map((a) => a.evaluation.overall)
      .join(" → ");

    return `RETRY CONTEXT:
- This is attempt ${attempts.length + 1}
- Score progression: ${scoreProgression}
- Last attempt scored: ${lastAttempt.evaluation.overall}/10
- Main issues: ${lastAttempt.feedback.specificIssues[0]}
- Improvement trend: ${this.calculateTrend(attempts)}`;
  }

  private calculateTrend(attempts: RetryAttempt[]): string {
    if (attempts.length < 2) {
      return "First retry";
    }

    const lastDelta = attempts[attempts.length - 1].improvementDelta;
    const totalImprovement = lastDelta.overall;

    if (totalImprovement > 1) {
      return "Good improvement";
    }
    if (totalImprovement > 0) {
      return "Slight improvement";
    }
    if (totalImprovement === 0) {
      return "No change";
    }
    return "Declining";
  }

  private adjustGenerationParams(
    options: TextGenerationOptions,
    attemptNumber: number,
  ): PromptModification[] {
    const modifications: PromptModification[] = [];

    if (typeof options === "object" && options !== null) {
      // Adjust temperature based on attempt
      if (attemptNumber >= 2 && options.temperature !== undefined) {
        const originalTemp = options.temperature;
        options.temperature = Math.max(0.1, originalTemp - 0.1 * attemptNumber);

        modifications.push({
          type: "context",
          originalContent: `temperature: ${originalTemp}`,
          modifiedContent: `temperature: ${options.temperature}`,
          reason: "Reduced temperature for more focused response",
        });
      }

      // Increase max tokens if needed
      if (attemptNumber >= 2 && options.maxTokens !== undefined) {
        const originalTokens = options.maxTokens;
        options.maxTokens = Math.min(4000, originalTokens * 1.2);

        modifications.push({
          type: "context",
          originalContent: `maxTokens: ${originalTokens}`,
          modifiedContent: `maxTokens: ${options.maxTokens}`,
          reason: "Increased token limit for more comprehensive response",
        });
      }
    }

    return modifications;
  }

  private prependSystemMessage(
    options: TextGenerationOptions,
    content: string,
  ): TextGenerationOptions {
    if (typeof options === "string") {
      return {
        messages: [
          { role: "system", content },
          { role: "user", content: options },
        ],
      };
    }

    if (!options.messages) {
      options.messages = [];
    }

    options.messages.unshift({ role: "system", content });
    return options;
  }

  private appendSystemMessage(
    options: TextGenerationOptions,
    content: string,
  ): TextGenerationOptions {
    if (typeof options === "string") {
      return {
        messages: [
          { role: "user", content: options },
          { role: "system", content },
        ],
      };
    }

    if (!options.messages) {
      options.messages = [];
    }

    options.messages.push({ role: "system", content });
    return options;
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
