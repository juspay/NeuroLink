import type { EnhancedEvaluationContext } from "./types.js";
import type {
  EvaluationCriteria,
  EvaluationPromptSections,
  RetryFeedback,
} from "./evaluationTypes.js";
import { CORE_CRITERIA } from "./evaluationTypes.js";

export class EvaluationPromptBuilder {
  buildEvaluationPrompt(
    context: EnhancedEvaluationContext,
    criteria: EvaluationCriteria[] = CORE_CRITERIA,
    previousFeedback?: RetryFeedback,
  ): string {
    const sections = this.buildPromptSections(
      context,
      criteria,
      previousFeedback,
    );

    return this.assemblePrompt(sections);
  }

  private buildPromptSections(
    context: EnhancedEvaluationContext,
    criteria: EvaluationCriteria[],
    previousFeedback?: RetryFeedback,
  ): EvaluationPromptSections {
    return {
      systemPrompt: this.buildSystemPrompt(),
      contextSection: this.buildContextSection(context),
      querySection: this.buildQuerySection(context),
      responseSection: this.buildResponseSection(context),
      criteriaSection: this.buildCriteriaSection(criteria),
      instructionsSection: this.buildInstructionsSection(previousFeedback),
      formatSection: this.buildFormatSection(),
    };
  }

  private buildSystemPrompt(): string {
    return `You are an expert AI response evaluator. Your task is to evaluate AI responses with precision, objectivity, and detailed analysis.

Key principles:
1. Break down responses into atomic statements for granular evaluation
2. Apply consistent scoring based on provided rubrics
3. Identify specific strengths and weaknesses
4. Provide actionable feedback for improvement
5. Consider context and user intent carefully`;
  }

  private buildContextSection(context: EnhancedEvaluationContext): string {
    const { queryAnalysis, conversationSummary, toolExecutions } = context;

    let contextInfo = `## Evaluation Context

**Query Type**: ${queryAnalysis.primaryIntent}
**Complexity**: ${queryAnalysis.complexity}
**Expected Response Type**: ${queryAnalysis.expectedResponseType}
**Domains**: ${queryAnalysis.domains.join(", ")}
**Sentiment**: ${queryAnalysis.sentiment}`;

    if (queryAnalysis.requiresTools) {
      contextInfo += `\n**Tools Required**: Yes
**Suggested Tools**: ${queryAnalysis.suggestedTools.join(", ")}`;
    }

    if (toolExecutions.length > 0) {
      contextInfo += `\n\n**Tool Usage**:
${toolExecutions
  .map(
    (exec) =>
      `- ${exec.toolName}: ${exec.success ? "✓" : "✗"} (${exec.duration}ms)`,
  )
  .join("\n")}`;
    }

    if (conversationSummary) {
      contextInfo += `\n\n**Conversation Context**: ${conversationSummary}`;
    }

    if (context.previousEvaluations && context.previousEvaluations.length > 0) {
      const lastEval =
        context.previousEvaluations[context.previousEvaluations.length - 1];
      contextInfo += `\n\n**Previous Evaluation** (Attempt ${context.attemptNumber - 1}):
- Overall Score: ${lastEval.overall}/10
- Main Issues: ${lastEval.reasoning.substring(0, 200)}...`;
    }

    return contextInfo;
  }

  private buildQuerySection(context: EnhancedEvaluationContext): string {
    return `## User Query

\`\`\`
${context.userQuery}
\`\`\`

**Keywords**: ${context.queryAnalysis.keywords.join(", ")}`;
  }

  private buildResponseSection(context: EnhancedEvaluationContext): string {
    return `## AI Response

\`\`\`
${context.aiResponse}
\`\`\`

**Provider**: ${context.provider} (${context.model})
**Response Time**: ${context.responseTime}ms
**Tokens Used**: ${context.tokenUsage.total}`;
  }

  private buildCriteriaSection(criteria: EvaluationCriteria[]): string {
    let criteriaText = "## Evaluation Criteria\n\n";

    criteria.forEach((criterion) => {
      criteriaText += `### ${criterion.name.charAt(0).toUpperCase() + criterion.name.slice(1)} (Weight: ${criterion.weight * 100}%)
**Description**: ${criterion.description}

**Scoring Rubric**:
${Object.entries(criterion.rubric)
  .map(([score, description]) => `- **${score}/10**: ${description}`)
  .join("\n")}

`;
    });

    return criteriaText;
  }

  private buildInstructionsSection(previousFeedback?: RetryFeedback): string {
    let instructions = `## Evaluation Instructions

1. **Atomic Analysis**: Break the response into atomic statements (facts, claims, instructions)
2. **Individual Scoring**: Score each criterion based on the rubrics
3. **Holistic Assessment**: Consider the response as a whole
4. **Flag Issues**: Identify any critical problems (hallucinations, misinformation, etc.)
5. **Provide Feedback**: List specific strengths, weaknesses, and suggestions`;

    if (previousFeedback) {
      instructions += `\n\n### Retry-Specific Instructions (Attempt ${previousFeedback.attempt})

**Previous Issues to Address**:
${previousFeedback.specificIssues.map((issue) => `- ${issue}`).join("\n")}

**Required Improvements**:
${previousFeedback.requiredImprovements.map((req) => `- ${req}`).join("\n")}

**Focus Areas**:
${previousFeedback.focusAreas.map((area) => `- ${area}`).join("\n")}

Be especially strict on these previously identified issues.`;
    }

    return instructions;
  }

  private buildFormatSection(): string {
    return `## Required Output Format

Provide your evaluation in this EXACT format:

### SCORES
Relevance: [1-10]
Accuracy: [1-10]
Completeness: [1-10]
Overall: [1-10]

### ANALYSIS
Strengths:
- [Specific strength 1]
- [Specific strength 2]

Weaknesses:
- [Specific weakness 1]
- [Specific weakness 2]

Missing Elements:
- [Missing element 1]
- [Missing element 2]

Suggestions:
- [Improvement suggestion 1]
- [Improvement suggestion 2]

### FLAGS
Is Off-Topic: [true/false]
Has Hallucination: [true/false]
Has Incomplete Answer: [true/false]
Has Misinformation: [true/false]

### REASONING
[Detailed explanation of your evaluation, 100-200 words]

### SEVERITY
Alert Severity: [none/low/medium/high]`;
  }

  private assemblePrompt(sections: EvaluationPromptSections): string {
    const parts = [
      sections.systemPrompt,
      sections.contextSection,
      sections.querySection,
      sections.responseSection,
      sections.criteriaSection,
      sections.instructionsSection,
      sections.formatSection,
    ];

    if (sections.examplesSection) {
      parts.push(sections.examplesSection);
    }

    return parts.join("\n\n---\n\n");
  }
}
