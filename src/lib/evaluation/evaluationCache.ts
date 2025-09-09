import { createHash } from "crypto";
import { logger } from "../utils/logger.js";

/**
 * Simple cache implementation for evaluation results
 */
export class EvaluationCache {
  private cache = new Map<string, { result: unknown; timestamp: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private ttl: number = 3600000) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  get(params: unknown): unknown | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`[EvaluationCache] Cache hit`, { key });
    return entry.result;
  }

  set(params: unknown, result: unknown): void {
    const key = this.generateKey(params);
    this.cache.set(key, { result, timestamp: Date.now() });
    logger.debug(`[EvaluationCache] Cached result`, { key });
  }

  private generateKey(params: unknown): string {
    const normalized = {
      messages: params.messages,
      prompt: params.prompt,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      model: params.model,
    };
    return createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex");
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`[EvaluationCache] Removed ${removed} expired entries`);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}
