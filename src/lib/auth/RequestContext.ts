// src/lib/auth/RequestContext.ts
/**
 * Type-safe Map wrapper for request-scoped context.
 * Flows from auth middleware through generate/stream/tools/memory.
 * Reserved keys (prefixed neurolink__) cannot be overridden by client code.
 */

export const NEUROLINK_RESOURCE_ID_KEY = "neurolink__resourceId";
export const NEUROLINK_THREAD_ID_KEY = "neurolink__threadId";

const RESERVED_PREFIX = "neurolink__";

export class RequestContext<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  private registry = new Map<string, unknown>();

  constructor(initial?: Partial<T> | [string, unknown][]) {
    if (Array.isArray(initial)) {
      for (const [key, value] of initial) {
        this.registry.set(key, value);
      }
    } else if (initial) {
      for (const [key, value] of Object.entries(initial)) {
        this.registry.set(key, value);
      }
    }
  }

  set<K extends string>(key: K, value: unknown): void {
    this.registry.set(key, value);
  }

  get<K extends string>(key: K): unknown {
    return this.registry.get(key);
  }

  has(key: string): boolean {
    return this.registry.has(key);
  }

  delete(key: string): boolean {
    return this.registry.delete(key);
  }

  get size(): number {
    return this.registry.size;
  }

  /**
   * Merge client-provided values, but SKIP reserved keys that are already set.
   * This prevents clients from overriding auth middleware values.
   */
  mergeClientContext(clientContext: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(clientContext)) {
      if (key.startsWith(RESERVED_PREFIX) && this.registry.has(key)) {
        continue; // Server-set reserved keys cannot be overridden
      }
      if (!this.registry.has(key)) {
        this.registry.set(key, value);
      }
    }
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.registry.entries()) {
      if (this.isSerializable(value)) {
        result[key] = value;
      }
    }
    return result;
  }

  private isSerializable(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    const type = typeof value;
    if (type === "function" || type === "symbol") {
      return false;
    }
    try {
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  }
}
