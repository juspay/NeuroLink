import {
  type QueryIntentAnalysis,
  QueryIntent,
  QueryComplexity,
  ResponseType,
} from "./types.js";

export class QueryIntentAnalyzer {
  private static readonly INTENT_PATTERNS: Record<QueryIntent, RegExp[]> = {
    [QueryIntent.QUESTION]: [
      /^(what|who|where|when|why|how|which|is|are|can|could|would|should)\s/i,
      /\?$/,
      /(explain|describe|tell me about)/i,
    ],
    [QueryIntent.COMMAND]: [
      /^(create|make|generate|build|write|implement|design|develop)/i,
      /^(delete|remove|update|modify|change|fix)/i,
      /^(do|perform|execute|run|start|stop)/i,
    ],
    [QueryIntent.CREATIVE]: [
      /^(write|compose|create|imagine|design)\s+(a|an|the)?\s*(story|poem|song|script)/i,
      /(creative|artistic|imaginative)/i,
      /^(invent|brainstorm|ideate)/i,
    ],
    [QueryIntent.ANALYSIS]: [
      /^(analyze|examine|evaluate|assess|review|compare)/i,
      /(pros and cons|advantages|disadvantages|benefits)/i,
      /^(what are the implications|impact|effects)/i,
    ],
    [QueryIntent.EXPLANATION]: [
      /^(explain|clarify|elaborate|define|describe)/i,
      /(how does|how do|how to)/i,
      /^(what is|what are)/i,
    ],
    [QueryIntent.TROUBLESHOOTING]: [
      /(error|bug|issue|problem|not working|failed|crash)/i,
      /^(debug|fix|resolve|troubleshoot|diagnose)/i,
      /(why is|why does|why doesn't)/i,
    ],
    [QueryIntent.CODE_GENERATION]: [
      /(code|function|class|method|api|endpoint)/i,
      /^(implement|write|create).*(function|code|script|program)/i,
      /(python|javascript|typescript|java|c\+\+|golang|rust)/i,
    ],
    [QueryIntent.CONVERSATION]: [
      /^(hello|hi|hey|good morning|good afternoon)/i,
      /^(thank you|thanks|bye|goodbye)/i,
      /(chat|talk|discuss)/i,
    ],
  };

  private static readonly COMPLEXITY_INDICATORS = {
    simple: {
      maxWords: 15,
      indicators: [/^(what is|who is|when is|where is)/i, /simple|basic|easy/i],
    },
    complex: {
      minWords: 30,
      indicators: [
        /multiple|several|various|comprehensive/i,
        /step.?by.?step|detailed|in.?depth/i,
        /and also|additionally|furthermore/i,
      ],
    },
  };

  private static readonly DOMAIN_KEYWORDS: Record<string, string[]> = {
    technology: [
      "software",
      "hardware",
      "computer",
      "programming",
      "ai",
      "machine learning",
      "api",
      "database",
    ],
    business: [
      "strategy",
      "marketing",
      "finance",
      "revenue",
      "customer",
      "sales",
      "roi",
      "kpi",
    ],
    science: [
      "research",
      "experiment",
      "hypothesis",
      "theory",
      "biology",
      "chemistry",
      "physics",
    ],
    healthcare: [
      "medical",
      "health",
      "doctor",
      "patient",
      "treatment",
      "diagnosis",
      "symptom",
    ],
    education: [
      "learning",
      "teaching",
      "student",
      "course",
      "curriculum",
      "academic",
      "study",
    ],
    legal: [
      "law",
      "legal",
      "contract",
      "compliance",
      "regulation",
      "policy",
      "attorney",
    ],
  };

  private static readonly TOOL_SUGGESTIONS: Record<string, string[]> = {
    file_operations: [
      "read",
      "write",
      "create",
      "delete",
      "file",
      "document",
      "save",
    ],
    web_search: [
      "search",
      "find",
      "lookup",
      "current",
      "latest",
      "news",
      "information about",
    ],
    calculation: [
      "calculate",
      "compute",
      "math",
      "sum",
      "average",
      "percentage",
      "formula",
    ],
    data_analysis: [
      "analyze",
      "data",
      "statistics",
      "trend",
      "pattern",
      "insights",
    ],
  };

  analyze(query: string): QueryIntentAnalysis {
    const normalizedQuery = query.toLowerCase().trim();
    const wordCount = query.split(/\s+/).length;

    return {
      primaryIntent: this.detectIntent(normalizedQuery),
      complexity: this.assessComplexity(query, wordCount),
      expectedResponseType: this.determineResponseType(normalizedQuery),
      domains: this.identifyDomains(normalizedQuery),
      requiresTools: this.checkToolRequirement(normalizedQuery),
      suggestedTools: this.suggestTools(normalizedQuery),
      keywords: this.extractKeywords(query),
      sentiment: this.analyzeSentiment(normalizedQuery),
    };
  }

  private detectIntent(query: string): QueryIntent {
    // Check patterns in priority order
    for (const [intent, patterns] of Object.entries(
      QueryIntentAnalyzer.INTENT_PATTERNS,
    )) {
      if (patterns.some((pattern) => pattern.test(query))) {
        return intent as QueryIntent;
      }
    }

    // Default based on question marks
    if (query.includes("?")) {
      return QueryIntent.QUESTION;
    }

    return QueryIntent.CONVERSATION;
  }

  private assessComplexity(query: string, wordCount: number): QueryComplexity {
    // Simple queries
    if (
      wordCount <= QueryIntentAnalyzer.COMPLEXITY_INDICATORS.simple.maxWords
    ) {
      if (
        QueryIntentAnalyzer.COMPLEXITY_INDICATORS.simple.indicators.some(
          (pattern) => pattern.test(query),
        )
      ) {
        return QueryComplexity.SIMPLE;
      }
    }

    // Complex queries
    if (
      wordCount >= QueryIntentAnalyzer.COMPLEXITY_INDICATORS.complex.minWords
    ) {
      return QueryComplexity.COMPLEX;
    }

    if (
      QueryIntentAnalyzer.COMPLEXITY_INDICATORS.complex.indicators.some(
        (pattern) => pattern.test(query),
      )
    ) {
      return QueryComplexity.COMPLEX;
    }

    // Check for multiple questions or requirements
    const questionMarks = (query.match(/\?/g) || []).length;
    const andClauses = (query.match(/\band\b/gi) || []).length;

    if (questionMarks > 1 || andClauses > 2) {
      return QueryComplexity.COMPLEX;
    }

    return QueryComplexity.MODERATE;
  }

  private determineResponseType(query: string): ResponseType {
    if (/^(write|create).*(code|function|script|program)/i.test(query)) {
      return ResponseType.CODE;
    }
    if (/^(analyze|evaluate|compare|assess)/i.test(query)) {
      return ResponseType.ANALYTICAL;
    }
    if (/^(create|write|compose).*(story|poem|content)/i.test(query)) {
      return ResponseType.CREATIVE;
    }
    if (/^(how to|guide|tutorial|steps)/i.test(query)) {
      return ResponseType.INSTRUCTIONAL;
    }
    if (/^(hi|hello|chat|talk)/i.test(query)) {
      return ResponseType.CONVERSATIONAL;
    }
    return ResponseType.FACTUAL;
  }

  private identifyDomains(query: string): string[] {
    const domains: string[] = [];

    for (const [domain, keywords] of Object.entries(
      QueryIntentAnalyzer.DOMAIN_KEYWORDS,
    )) {
      if (keywords.some((keyword) => query.includes(keyword))) {
        domains.push(domain);
      }
    }

    return domains.length > 0 ? domains : ["general"];
  }

  private checkToolRequirement(query: string): boolean {
    const toolIndicators = [
      /\b(file|document|save|read|write)\b/i,
      /\b(search|find|lookup|current|latest)\b/i,
      /\b(calculate|compute|math)\b/i,
      /\b(weather|time|date)\b/i,
    ];

    return toolIndicators.some((pattern) => pattern.test(query));
  }

  private suggestTools(query: string): string[] {
    const suggestedTools: string[] = [];

    for (const [tool, keywords] of Object.entries(
      QueryIntentAnalyzer.TOOL_SUGGESTIONS,
    )) {
      if (keywords.some((keyword) => query.includes(keyword))) {
        suggestedTools.push(tool);
      }
    }

    return suggestedTools;
  }

  private extractKeywords(query: string): string[] {
    // Remove common words and extract significant terms
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
      "is",
      "was",
      "are",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "shall",
    ]);

    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    // Return unique keywords
    return [...new Set(words)];
  }

  private analyzeSentiment(query: string): "positive" | "neutral" | "negative" {
    const positivePatterns = [
      /\b(good|great|excellent|amazing|wonderful|love|like|appreciate)\b/i,
      /\b(thank|thanks|please|grateful)\b/i,
    ];

    const negativePatterns = [
      /\b(bad|terrible|awful|hate|dislike|problem|issue|error|wrong)\b/i,
      /\b(not working|failed|broken|bug)\b/i,
    ];

    const hasPositive = positivePatterns.some((pattern) => pattern.test(query));
    const hasNegative = negativePatterns.some((pattern) => pattern.test(query));

    if (hasPositive && !hasNegative) {
      return "positive";
    }
    if (hasNegative && !hasPositive) {
      return "negative";
    }
    return "neutral";
  }
}
