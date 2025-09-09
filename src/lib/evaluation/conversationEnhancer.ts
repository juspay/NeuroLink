import type { ChatMessage } from "../types/conversationTypes.js";
import type { EnhancedConversationTurn } from "./types.js";

export class ConversationEnhancer {
  private readonly maxTurnsToInclude: number = 10;
  private readonly maxTokensPerTurn: number = 500;

  enhance(
    conversationHistory: ChatMessage[] | undefined,
    currentQuery: string,
    currentResponse: string,
    metadata?: {
      provider?: string;
      model?: string;
      responseTime?: number;
      tokenUsage?: { prompt: number; completion: number; total: number };
    },
  ): EnhancedConversationTurn[] {
    const enhancedTurns: EnhancedConversationTurn[] = [];

    // Add historical conversation
    if (conversationHistory && conversationHistory.length > 0) {
      const relevantHistory = this.selectRelevantHistory(
        conversationHistory,
        currentQuery,
      );

      relevantHistory.forEach((message) => {
        enhancedTurns.push(this.enhanceMessage(message));
      });
    }

    // Add current interaction
    enhancedTurns.push({
      role: "user",
      content: currentQuery,
      timestamp: Date.now(),
      metadata: {
        tokenCount: this.estimateTokenCount(currentQuery),
      },
    });

    enhancedTurns.push({
      role: "assistant",
      content: currentResponse,
      timestamp: Date.now(),
      metadata: {
        tokenCount:
          metadata?.tokenUsage?.completion ||
          this.estimateTokenCount(currentResponse),
        responseTime: metadata?.responseTime,
        provider: metadata?.provider,
        model: metadata?.model,
      },
    });

    return enhancedTurns;
  }

  private selectRelevantHistory(
    history: ChatMessage[],
    currentQuery: string,
  ): ChatMessage[] {
    // If history is short, include all
    if (history.length <= this.maxTurnsToInclude) {
      return history;
    }

    // Otherwise, use a relevance scoring system
    const scoredMessages = history.map((message, index) => {
      const score = this.calculateRelevanceScore(
        message,
        currentQuery,
        index,
        history.length,
      );
      return { message, score, index };
    });

    // Sort by score and take top messages
    scoredMessages.sort((a, b) => b.score - a.score);
    const selectedMessages = scoredMessages
      .slice(0, this.maxTurnsToInclude)
      .sort((a, b) => a.index - b.index) // Restore chronological order
      .map((item) => item.message);

    return selectedMessages;
  }

  private calculateRelevanceScore(
    message: ChatMessage,
    currentQuery: string,
    index: number,
    totalMessages: number,
  ): number {
    let score = 0;

    // Recency score (more recent = higher score)
    const recencyScore = (index / totalMessages) * 30;
    score += recencyScore;

    // Content similarity score
    const similarityScore =
      this.calculateSimilarity(message.content, currentQuery) * 40;
    score += similarityScore;

    // Role importance (user messages slightly more important for context)
    if (message.role === "user") {
      score += 10;
    }

    // System messages are very important
    if (message.role === "system") {
      score += 20;
    }

    // Length penalty (very long messages get penalized)
    const contentLength = message.content.length;
    if (contentLength > 1000) {
      score -= 10;
    }

    return score;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple keyword overlap similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private enhanceMessage(message: ChatMessage): EnhancedConversationTurn {
    return {
      role: message.role,
      content: this.truncateIfNeeded(message.content),
      timestamp: Date.now(),
      metadata: {
        tokenCount: this.estimateTokenCount(message.content),
        toolCalls: this.extractToolCalls(message.content),
      },
    };
  }

  private truncateIfNeeded(content: string): string {
    const estimatedTokens = this.estimateTokenCount(content);

    if (estimatedTokens > this.maxTokensPerTurn) {
      // Rough truncation (4 chars ≈ 1 token)
      const maxChars = this.maxTokensPerTurn * 4;
      return content.substring(0, maxChars) + "... [truncated]";
    }

    return content;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private extractToolCalls(content: string): string[] {
    const toolCalls: string[] = [];

    // Look for common tool call patterns
    const patterns = [
      /(?:calling|using|executing)\s+(\w+)\s+tool/gi,
      /tool:\s*(\w+)/gi,
      /<tool>(\w+)<\/tool>/gi,
    ];

    patterns.forEach((pattern) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          toolCalls.push(match[1]);
        }
      }
    });

    return [...new Set(toolCalls)]; // Remove duplicates
  }

  // Generate a summary of the conversation for context
  generateSummary(turns: EnhancedConversationTurn[]): string {
    if (turns.length === 0) {
      return "No conversation history";
    }

    const topics = this.extractTopics(turns);
    const turnCount = turns.filter((t) => t.role === "user").length;
    const toolsUsed = this.extractAllTools(turns);

    let summary = `Conversation with ${turnCount} user turns. `;

    if (topics.length > 0) {
      summary += `Topics discussed: ${topics.join(", ")}. `;
    }

    if (toolsUsed.length > 0) {
      summary += `Tools used: ${toolsUsed.join(", ")}.`;
    }

    return summary;
  }

  private extractTopics(turns: EnhancedConversationTurn[]): string[] {
    const topics = new Set<string>();

    // Simple topic extraction based on keywords
    const topicPatterns: Record<string, RegExp> = {
      "code/programming":
        /\b(code|function|variable|programming|debug|error)\b/i,
      "data analysis": /\b(data|analysis|statistics|graph|chart)\b/i,
      writing: /\b(write|essay|document|content|text)\b/i,
      math: /\b(calculate|math|equation|formula|number)\b/i,
      "general Q&A": /\b(what|how|why|explain|describe)\b/i,
    };

    turns.forEach((turn) => {
      Object.entries(topicPatterns).forEach(([topic, pattern]) => {
        if (pattern.test(turn.content)) {
          topics.add(topic);
        }
      });
    });

    return Array.from(topics);
  }

  private extractAllTools(turns: EnhancedConversationTurn[]): string[] {
    const tools = new Set<string>();

    turns.forEach((turn) => {
      if (turn.metadata?.toolCalls) {
        turn.metadata.toolCalls.forEach((tool) => tools.add(tool));
      }
    });

    return Array.from(tools);
  }
}
