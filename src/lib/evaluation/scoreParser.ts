// Score parser for evaluation responses
import type { StructuredEvaluation } from "./evaluationTypes.js";
import { StructuredEvaluationSchema } from "./evaluationTypes.js";

export class ScoreParser {
  private readonly scorePatterns = {
    scores: {
      relevance: /Relevance:\s*(\d+)/i,
      accuracy: /Accuracy:\s*(\d+)/i,
      completeness: /Completeness:\s*(\d+)/i,
      overall: /Overall:\s*(\d+)/i,
    },
    flags: {
      isOffTopic: /Is Off-Topic:\s*(true|false)/i,
      hasHallucination: /Has Hallucination:\s*(true|false)/i,
      hasIncompleteAnswer: /Has Incomplete Answer:\s*(true|false)/i,
      hasMisinformation: /Has Misinformation:\s*(true|false)/i,
    },
    severity: /Alert Severity:\s*(none|low|medium|high)/i,
  };

  parseEvaluationResponse(
    response: string,
    evaluationDuration: number,
  ): StructuredEvaluation {
    try {
      // Extract scores
      const scores = this.extractScores(response);

      // Extract analysis sections
      const analysis = this.extractAnalysis(response);

      // Extract flags
      const flags = this.extractFlags(response);

      // Extract reasoning
      const reasoning = this.extractReasoning(response);

      // Extract severity
      const alertSeverity = this.extractSeverity(response);

      // Count atomic statements (simple heuristic)
      const atomicStatementCount = this.countAtomicStatements(response);

      // Calculate confidence based on extraction success
      const confidence = this.calculateConfidence(scores, analysis, flags);

      const evaluation: StructuredEvaluation = {
        scores,
        analysis,
        flags,
        metadata: {
          atomicStatementCount,
          evaluationDuration,
          confidence,
        },
        reasoning,
        alertSeverity,
      };

      // Validate with Zod
      return StructuredEvaluationSchema.parse(evaluation);
    } catch (error) {
      console.error("Failed to parse evaluation response:", error);
      return this.getDefaultEvaluation(evaluationDuration, error as Error);
    }
  }

  private extractScores(response: string): StructuredEvaluation["scores"] {
    const scores: Record<string, number> = {};

    for (const [key, pattern] of Object.entries(this.scorePatterns.scores)) {
      const match = response.match(pattern);
      if (match && match[1]) {
        const score = parseInt(match[1], 10);
        if (score >= 1 && score <= 10) {
          scores[key] = score;
        }
      }
    }

    // Ensure all required scores are present
    if (!scores.relevance) {
      scores.relevance = 5;
    }
    if (!scores.accuracy) {
      scores.accuracy = 5;
    }
    if (!scores.completeness) {
      scores.completeness = 5;
    }
    if (!scores.overall) {
      scores.overall = 5;
    }

    return scores as StructuredEvaluation["scores"];
  }

  private extractAnalysis(response: string): StructuredEvaluation["analysis"] {
    const analysis = {
      strengths: this.extractListSection(response, "Strengths:"),
      weaknesses: this.extractListSection(response, "Weaknesses:"),
      missingElements: this.extractListSection(response, "Missing Elements:"),
      suggestions: this.extractListSection(response, "Suggestions:"),
    };

    // Ensure at least empty arrays
    return {
      strengths:
        analysis.strengths.length > 0
          ? analysis.strengths
          : ["Response provided"],
      weaknesses:
        analysis.weaknesses.length > 0
          ? analysis.weaknesses
          : ["Could be improved"],
      missingElements:
        analysis.missingElements.length > 0 ? analysis.missingElements : [],
      suggestions:
        analysis.suggestions.length > 0
          ? analysis.suggestions
          : ["Continue refining"],
    };
  }

  private extractListSection(text: string, sectionHeader: string): string[] {
    const items: string[] = [];

    // Find the section
    const sectionIndex = text.indexOf(sectionHeader);
    if (sectionIndex === -1) {
      return items;
    }

    // Extract text after the header until the next section
    const afterHeader = text.substring(sectionIndex + sectionHeader.length);
    const nextSectionMatch = afterHeader.match(/\n(#{1,3}|[A-Z][A-Za-z\s]+:)/);
    const sectionEnd = nextSectionMatch
      ? (nextSectionMatch.index ?? 0)
      : afterHeader.length;
    const sectionText = afterHeader.substring(0, sectionEnd);

    // Extract bullet points
    const bulletPattern = /^[\s]*[-•*]\s*(.+)$/gm;
    let match;
    while ((match = bulletPattern.exec(sectionText)) !== null) {
      if (match[1].trim()) {
        items.push(match[1].trim());
      }
    }

    return items;
  }

  private extractFlags(response: string): StructuredEvaluation["flags"] {
    const flags: Record<string, boolean> = {};

    for (const [key, pattern] of Object.entries(this.scorePatterns.flags)) {
      const match = response.match(pattern);
      if (match && match[1]) {
        flags[key] = match[1].toLowerCase() === "true";
      }
    }

    // Ensure all flags have values
    return {
      isOffTopic: flags.isOffTopic || false,
      hasHallucination: flags.hasHallucination || false,
      hasIncompleteAnswer: flags.hasIncompleteAnswer || false,
      hasMisinformation: flags.hasMisinformation || false,
    };
  }

  private extractReasoning(response: string): string {
    // Look for REASONING section
    const reasoningMatch = response.match(/### REASONING\n(.+?)(?=\n###|$)/s);
    if (reasoningMatch && reasoningMatch[1]) {
      return reasoningMatch[1].trim();
    }

    // Fallback: look for any paragraph after scores
    const paragraphMatch = response.match(/Overall:\s*\d+\n\n(.+?)(?=\n\n|$)/s);
    if (paragraphMatch && paragraphMatch[1]) {
      return paragraphMatch[1].trim();
    }

    return "Evaluation completed based on provided criteria.";
  }

  private extractSeverity(
    response: string,
  ): StructuredEvaluation["alertSeverity"] {
    const match = response.match(this.scorePatterns.severity);
    if (match && match[1]) {
      return match[1] as StructuredEvaluation["alertSeverity"];
    }
    return "none";
  }

  private countAtomicStatements(response: string): number {
    // Simple heuristic: count bullet points in analysis sections
    const bulletMatches = response.match(/^[\s]*[-•*]\s*.+$/gm);
    return bulletMatches ? bulletMatches.length : 1;
  }

  private calculateConfidence(
    scores: Record<string, unknown>,
    analysis: Record<string, unknown>,
    flags: Record<string, unknown>,
  ): number {
    let confidence = 0;

    // Check score completeness (40%)
    const scoreKeys = ["relevance", "accuracy", "completeness", "overall"];
    const validScores = scoreKeys.filter((key) => {
      const score = scores[key];
      return typeof score === "number" && score >= 1 && score <= 10;
    }).length;
    confidence += (validScores / scoreKeys.length) * 0.4;

    // Check analysis completeness (40%)
    const analysisKeys = ["strengths", "weaknesses", "suggestions"];
    const validAnalysis = analysisKeys.filter((key) => {
      const value = analysis[key];
      return Array.isArray(value) && value.length > 0;
    }).length;
    confidence += (validAnalysis / analysisKeys.length) * 0.4;

    // Check flags completeness (20%)
    const flagKeys = Object.keys(flags);
    confidence += flagKeys.length > 0 ? 0.2 : 0;

    return Math.min(confidence, 1);
  }

  private getDefaultEvaluation(
    evaluationDuration: number,
    error: Error,
  ): StructuredEvaluation {
    return {
      scores: {
        relevance: 5,
        accuracy: 5,
        completeness: 5,
        overall: 5,
      },
      analysis: {
        strengths: ["Unable to parse evaluation"],
        weaknesses: ["Evaluation parsing failed"],
        missingElements: [],
        suggestions: ["Retry evaluation"],
      },
      flags: {
        isOffTopic: false,
        hasHallucination: false,
        hasIncompleteAnswer: true,
        hasMisinformation: false,
      },
      metadata: {
        atomicStatementCount: 0,
        evaluationDuration,
        confidence: 0,
      },
      reasoning: `Evaluation parsing failed: ${error.message}`,
      alertSeverity: "medium",
    };
  }

  // Utility method to validate score consistency
  validateScoreConsistency(evaluation: StructuredEvaluation): boolean {
    const { scores, flags } = evaluation;

    // If flagged as off-topic, relevance should be low
    if (flags.isOffTopic && scores.relevance > 3) {
      return false;
    }

    // If has hallucination, accuracy should be low
    if (flags.hasHallucination && scores.accuracy > 3) {
      return false;
    }

    // Overall score should be reasonable average
    const avgScore =
      (scores.relevance + scores.accuracy + scores.completeness) / 3;
    const overallDiff = Math.abs(scores.overall - avgScore);
    if (overallDiff > 2) {
      return false;
    }

    return true;
  }
}
