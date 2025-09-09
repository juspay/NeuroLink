import type { StructuredEvaluation, RetryFeedback } from "./evaluationTypes.js";
import type { EnhancedEvaluationContext } from "./types.js";

export class FeedbackGenerator {
  generateRetryFeedback(
    evaluation: StructuredEvaluation,
    context: EnhancedEvaluationContext,
    attemptNumber: number,
  ): RetryFeedback {
    const feedback: RetryFeedback = {
      attempt: attemptNumber,
      specificIssues: this.identifySpecificIssues(evaluation),
      requiredImprovements: this.generateRequiredImprovements(
        evaluation,
        context,
      ),
      constraints: this.generateConstraints(attemptNumber),
      focusAreas: this.identifyFocusAreas(evaluation),
    };

    return feedback;
  }

  private identifySpecificIssues(evaluation: StructuredEvaluation): string[] {
    const issues: string[] = [];

    // Score-based issues
    if (evaluation.scores.relevance < 7) {
      issues.push(
        `Low relevance score (${evaluation.scores.relevance}/10): Response doesn't adequately address the query`,
      );
    }

    if (evaluation.scores.accuracy < 7) {
      issues.push(
        `Low accuracy score (${evaluation.scores.accuracy}/10): Contains factual errors or imprecision`,
      );
    }

    if (evaluation.scores.completeness < 7) {
      issues.push(
        `Low completeness score (${evaluation.scores.completeness}/10): Missing important information`,
      );
    }

    // Flag-based issues
    if (evaluation.flags.isOffTopic) {
      issues.push(
        "Response is off-topic and doesn't address the user's actual question",
      );
    }

    if (evaluation.flags.hasHallucination) {
      issues.push("Response contains hallucinated or fabricated information");
    }

    if (evaluation.flags.hasIncompleteAnswer) {
      issues.push(
        "Response is incomplete and doesn't fully answer the question",
      );
    }

    if (evaluation.flags.hasMisinformation) {
      issues.push("Response contains misinformation that needs correction");
    }

    // Add specific weaknesses
    evaluation.analysis.weaknesses.forEach((weakness) => {
      issues.push(`Weakness: ${weakness}`);
    });

    return issues;
  }

  private generateRequiredImprovements(
    evaluation: StructuredEvaluation,
    context: EnhancedEvaluationContext,
  ): string[] {
    const improvements: string[] = [];

    // Based on missing elements
    evaluation.analysis.missingElements.forEach((element) => {
      improvements.push(`Add missing information: ${element}`);
    });

    // Based on suggestions
    evaluation.analysis.suggestions.forEach((suggestion) => {
      improvements.push(`Implement suggestion: ${suggestion}`);
    });

    // Based on query analysis
    if (
      context.queryAnalysis.requiresTools &&
      context.toolExecutions.length === 0
    ) {
      improvements.push("Use appropriate tools to gather required information");
    }

    // Based on expected response type
    const responseTypeImprovements = this.getResponseTypeImprovements(
      context.queryAnalysis.expectedResponseType,
      evaluation,
    );
    improvements.push(...responseTypeImprovements);

    // Prioritize improvements
    return this.prioritizeImprovements(improvements, evaluation);
  }

  private generateConstraints(attemptNumber: number): string[] {
    const constraints: string[] = [];

    if (attemptNumber === 1) {
      constraints.push(
        "Focus on addressing the main query directly",
        "Ensure factual accuracy in all statements",
        "Provide comprehensive coverage of the topic",
      );
    } else if (attemptNumber === 2) {
      constraints.push(
        "MUST fix all previously identified issues",
        "Do NOT introduce new problems while fixing old ones",
        "Maintain high quality across all evaluation criteria",
        "Be more specific and detailed in explanations",
      );
    } else {
      constraints.push(
        "This is the FINAL attempt - must meet ALL quality standards",
        "Every identified issue MUST be completely resolved",
        "Response must score 7+ on ALL criteria",
        "No partial fixes - complete resolution required",
        "Prioritize accuracy and relevance above all else",
      );
    }

    return constraints;
  }

  private identifyFocusAreas(evaluation: StructuredEvaluation): string[] {
    const focusAreas: string[] = [];
    const scores = evaluation.scores;

    // Identify lowest scoring areas
    const scoreEntries = [
      { name: "relevance", score: scores.relevance },
      { name: "accuracy", score: scores.accuracy },
      { name: "completeness", score: scores.completeness },
    ];

    scoreEntries.sort((a, b) => a.score - b.score);

    // Focus on lowest scores
    scoreEntries.forEach((entry) => {
      if (entry.score < 7) {
        focusAreas.push(`Improve ${entry.name} (currently ${entry.score}/10)`);
      }
    });

    // Add flag-based focus areas
    if (evaluation.flags.hasHallucination) {
      focusAreas.push("Eliminate all hallucinated content");
    }

    if (evaluation.flags.isOffTopic) {
      focusAreas.push("Directly address the user's question");
    }

    return focusAreas;
  }

  private getResponseTypeImprovements(
    responseType: string,
    evaluation: StructuredEvaluation,
  ): string[] {
    const improvements: string[] = [];

    switch (responseType) {
      case "factual":
        if (evaluation.scores.accuracy < 8) {
          improvements.push("Provide specific facts with sources or context");
        }
        break;

      case "analytical":
        if (evaluation.scores.completeness < 8) {
          improvements.push(
            "Include deeper analysis with multiple perspectives",
          );
        }
        break;

      case "instructional":
        improvements.push("Ensure step-by-step clarity and completeness");
        break;

      case "code":
        improvements.push(
          "Ensure code is syntactically correct and well-commented",
        );
        break;
    }

    return improvements;
  }

  private prioritizeImprovements(
    improvements: string[],
    _evaluation: StructuredEvaluation,
  ): string[] {
    // Remove duplicates
    const unique = [...new Set(improvements)];

    // Sort by priority
    return unique.sort((a, b) => {
      // Hallucination fixes are highest priority
      if (a.includes("hallucin") && !b.includes("hallucin")) {
        return -1;
      }
      if (!a.includes("hallucin") && b.includes("hallucin")) {
        return 1;
      }

      // Accuracy fixes are next priority
      if (a.includes("accuracy") && !b.includes("accuracy")) {
        return -1;
      }
      if (!a.includes("accuracy") && b.includes("accuracy")) {
        return 1;
      }

      // Then relevance
      if (a.includes("relevance") && !b.includes("relevance")) {
        return -1;
      }
      if (!a.includes("relevance") && b.includes("relevance")) {
        return 1;
      }

      return 0;
    });
  }

  // Generate a system prompt modification for retry
  generateRetrySystemPrompt(feedback: RetryFeedback): string {
    return `IMPORTANT: This is retry attempt ${feedback.attempt}. You MUST address these specific issues:

${feedback.specificIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Required Improvements:
${feedback.requiredImprovements.map((imp, i) => `${i + 1}. ${imp}`).join("\n")}

Constraints for this attempt:
${feedback.constraints.map((constraint, i) => `${i + 1}. ${constraint}`).join("\n")}

Focus especially on:
${feedback.focusAreas.map((area, i) => `${i + 1}. ${area}`).join("\n")}

Your response MUST score 7+ on all evaluation criteria to be acceptable.`;
  }
}
