/**
 * Structured Output Streaming
 *
 * Provides PartialObjectStreamer for incremental JSON object streaming
 * during structured output generation. Enables real-time UI updates
 * as the JSON object is being built by the AI model.
 *
 * @module streaming/structuredStreaming
 */

import type { JsonValue } from "../types/common.js";
import type { ObjectDeltaPayload, ObjectCompletePayload } from "./types.js";
import { logger } from "../utils/logger.js";

// ============================================
// CONFIGURATION
// ============================================

/**
 * Configuration for partial object streaming
 */
export type PartialObjectStreamerConfig = {
  /** JSON Schema for validation (optional) */
  schema?: JSONSchemaDefinition;
  /** Emit events on partial parse failures */
  emitOnParseError?: boolean;
  /** Maximum buffer size before force-emit */
  maxBufferSize?: number;
  /** Track path changes */
  trackPaths?: boolean;
  /** Emit partial objects at regular intervals (ms) */
  throttleMs?: number;
};

/**
 * JSON Schema definition (simplified)
 */
export type JSONSchemaDefinition = {
  type?: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: Record<string, JSONSchemaDefinition>;
  required?: string[];
  items?: JSONSchemaDefinition;
  description?: string;
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PartialObjectStreamerConfig = {
  emitOnParseError: false,
  maxBufferSize: 50000,
  trackPaths: true,
  throttleMs: 0,
};

// ============================================
// PARTIAL OBJECT STREAMER
// ============================================

/**
 * PartialObjectStreamer - Incrementally builds and validates JSON objects
 *
 * Processes JSON text deltas during structured output streaming and emits
 * partial object events as the JSON is being built. Uses auto-closing
 * bracket technique to parse incomplete JSON.
 *
 * @example Basic usage
 * ```typescript
 * const streamer = new PartialObjectStreamer();
 *
 * for await (const chunk of textStream) {
 *   const event = streamer.processJsonDelta(chunk);
 *   if (event) {
 *     console.log("Partial:", event.partialObject);
 *   }
 * }
 *
 * const final = streamer.finalize();
 * console.log("Complete:", final?.object);
 * ```
 *
 * @example With schema validation
 * ```typescript
 * const streamer = new PartialObjectStreamer({
 *   schema: {
 *     type: "object",
 *     properties: {
 *       name: { type: "string" },
 *       age: { type: "number" },
 *     },
 *     required: ["name"],
 *   },
 * });
 * ```
 */
export class PartialObjectStreamer {
  private readonly config: PartialObjectStreamerConfig;
  private buffer: string = "";
  private seqCounter: number = 0;
  private currentPath: string = "";
  private partialObject: JsonValue | null = null;
  private lastEmitTime: number = 0;
  private pathStack: string[] = [];

  constructor(config: PartialObjectStreamerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process a JSON text delta and emit partial object events
   */
  processJsonDelta(delta: string): ObjectDeltaPayload | null {
    this.buffer += delta;

    // Check throttling
    if (this.config.throttleMs && this.config.throttleMs > 0) {
      const now = Date.now();
      if (now - this.lastEmitTime < this.config.throttleMs) {
        return null;
      }
      this.lastEmitTime = now;
    }

    // Try to parse partial JSON
    const parsed = this.tryPartialParse(this.buffer);

    if (parsed.success && parsed.value !== undefined) {
      this.partialObject = parsed.value;
      this.currentPath = parsed.currentPath || "";

      return {
        type: "object:delta",
        seq: this.seqCounter++,
        timestamp: Date.now(),
        partialObject: parsed.value,
        currentPath: this.currentPath,
        jsonTextDelta: delta,
      };
    }

    // Check buffer overflow
    if (this.buffer.length > (this.config.maxBufferSize || 50000)) {
      logger.warn("Partial object buffer overflow, attempting recovery");
      // Try to recover by finding last valid JSON position
      const recovered = this.attemptBufferRecovery();
      if (!recovered) {
        this.buffer = "";
      }
    }

    // Emit on parse error if configured
    if (this.config.emitOnParseError && this.partialObject !== null) {
      return {
        type: "object:delta",
        seq: this.seqCounter++,
        timestamp: Date.now(),
        partialObject: this.partialObject,
        currentPath: this.currentPath,
        jsonTextDelta: delta,
      };
    }

    return null;
  }

  /**
   * Finalize the object and emit completion event
   */
  finalize(): ObjectCompletePayload | null {
    // Try final parse without auto-closing
    try {
      const finalValue = JSON.parse(this.buffer);
      this.partialObject = finalValue;
    } catch {
      // Use last successful partial parse
    }

    if (this.partialObject === null) {
      return null;
    }

    const validation = this.validateObject(this.partialObject);

    const event: ObjectCompletePayload = {
      type: "object:complete",
      seq: this.seqCounter++,
      timestamp: Date.now(),
      object: this.partialObject,
      valid: validation.valid,
      validationErrors:
        validation.errors.length > 0 ? validation.errors : undefined,
    };

    // Reset state
    this.reset();

    return event;
  }

  /**
   * Get the current partial object
   */
  get current(): JsonValue | null {
    return this.partialObject;
  }

  /**
   * Get the current buffer
   */
  get currentBuffer(): string {
    return this.buffer;
  }

  /**
   * Get the current path being built
   */
  get currentJsonPath(): string {
    return this.currentPath;
  }

  /**
   * Check if parsing is in progress
   */
  get isActive(): boolean {
    return this.buffer.length > 0;
  }

  /**
   * Reset the streamer state
   */
  reset(): void {
    this.buffer = "";
    this.seqCounter = 0;
    this.currentPath = "";
    this.partialObject = null;
    this.lastEmitTime = 0;
    this.pathStack = [];
  }

  // ============================================
  // PRIVATE PARSING METHODS
  // ============================================

  /**
   * Try to parse partial JSON with auto-closing brackets
   */
  private tryPartialParse(json: string): {
    success: boolean;
    value?: JsonValue;
    currentPath?: string;
  } {
    // Remove leading/trailing whitespace
    const trimmed = json.trim();

    if (!trimmed) {
      return { success: false };
    }

    // Try direct parse first
    try {
      const value = JSON.parse(trimmed);
      return { success: true, value };
    } catch {
      // Continue with auto-closing
    }

    // Count brackets and braces
    const counts = this.countBrackets(trimmed);

    // Build closing sequence
    const closing = this.buildClosingSequence(counts, trimmed);

    // Handle incomplete strings
    let adjustedJson = trimmed;
    if (this.isInString(trimmed)) {
      adjustedJson = this.closeIncompleteString(trimmed);
    }

    // Handle trailing commas
    adjustedJson = this.removeTrailingComma(adjustedJson);

    // Handle incomplete key-value pairs
    adjustedJson = this.fixIncompleteKeyValue(adjustedJson);

    try {
      const value = JSON.parse(adjustedJson + closing);
      const path = this.config.trackPaths
        ? this.extractCurrentPath(trimmed)
        : "";
      return { success: true, value, currentPath: path };
    } catch {
      // Try alternative repairs
      return this.tryAlternativeRepairs(trimmed, counts);
    }
  }

  /**
   * Count open and close brackets/braces
   */
  private countBrackets(json: string): {
    openBraces: number;
    closeBraces: number;
    openBrackets: number;
    closeBrackets: number;
  } {
    let openBraces = 0;
    let closeBraces = 0;
    let openBrackets = 0;
    let closeBrackets = 0;
    let inString = false;
    let escaped = false;

    for (const char of json) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) {
        continue;
      }

      switch (char) {
        case "{":
          openBraces++;
          break;
        case "}":
          closeBraces++;
          break;
        case "[":
          openBrackets++;
          break;
        case "]":
          closeBrackets++;
          break;
      }
    }

    return { openBraces, closeBraces, openBrackets, closeBrackets };
  }

  /**
   * Build closing sequence for brackets
   */
  private buildClosingSequence(
    counts: {
      openBraces: number;
      closeBraces: number;
      openBrackets: number;
      closeBrackets: number;
    },
    json: string,
  ): string {
    const missingBrackets = counts.openBrackets - counts.closeBrackets;
    const missingBraces = counts.openBraces - counts.closeBraces;

    // Build closing sequence in correct order by tracking nesting
    let closing = "";
    const stack: string[] = [];
    let inString = false;
    let escaped = false;

    for (const char of json) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) {
        continue;
      }

      if (char === "{" || char === "[") {
        stack.push(char === "{" ? "}" : "]");
      } else if (char === "}" || char === "]") {
        stack.pop();
      }
    }

    // Build closing from stack (reverse order)
    for (let i = stack.length - 1; i >= 0; i--) {
      closing += stack[i];
    }

    // Fallback if stack doesn't match
    if (closing.length !== missingBrackets + missingBraces) {
      closing = "";
      for (let i = 0; i < missingBrackets; i++) {
        closing = "]" + closing;
      }
      for (let i = 0; i < missingBraces; i++) {
        closing = "}" + closing;
      }
    }

    return closing;
  }

  /**
   * Check if we're inside an unclosed string
   */
  private isInString(json: string): boolean {
    let inString = false;
    let escaped = false;

    for (const char of json) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
      }
    }

    return inString;
  }

  /**
   * Close incomplete string
   */
  private closeIncompleteString(json: string): string {
    // Find the last unclosed quote and close it
    let lastQuotePos = -1;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < json.length; i++) {
      const char = json[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        if (inString) {
          lastQuotePos = i;
        }
      }
    }

    if (inString && lastQuotePos !== -1) {
      // Remove incomplete escape sequences at the end
      let trimmedJson = json;
      if (trimmedJson.endsWith("\\")) {
        trimmedJson = trimmedJson.slice(0, -1);
      }
      return trimmedJson + '"';
    }

    return json;
  }

  /**
   * Remove trailing comma
   */
  private removeTrailingComma(json: string): string {
    return json.replace(/,\s*$/, "");
  }

  /**
   * Fix incomplete key-value pairs
   */
  private fixIncompleteKeyValue(json: string): string {
    // Pattern: {"key": (incomplete - needs a value)
    const incompleteKeyValue = /:\s*$/;
    if (incompleteKeyValue.test(json)) {
      return json + "null";
    }

    // Pattern: {"key" (incomplete - needs colon and value)
    const incompleteKey = /"[^"]*"\s*$/;
    const beforeBracket = json.lastIndexOf("{");
    if (beforeBracket !== -1) {
      const afterBracket = json.slice(beforeBracket);
      if (incompleteKey.test(afterBracket) && !afterBracket.includes(":")) {
        return json + ": null";
      }
    }

    return json;
  }

  /**
   * Try alternative JSON repairs
   */
  private tryAlternativeRepairs(
    json: string,
    _counts: {
      openBraces: number;
      closeBraces: number;
      openBrackets: number;
      closeBrackets: number;
    },
  ): { success: boolean; value?: JsonValue; currentPath?: string } {
    const repairs = [
      // Try removing last incomplete property
      () => json.replace(/,\s*"[^"]*"?\s*:?\s*[^,}\]]*$/, ""),
      // Try removing partial array element
      () => json.replace(/,\s*[^,}\]]*$/, ""),
      // Try removing everything after last complete value
      () => {
        const lastComplete = Math.max(
          json.lastIndexOf("}"),
          json.lastIndexOf("]"),
          json.lastIndexOf('"'),
        );
        return lastComplete > 0 ? json.slice(0, lastComplete + 1) : json;
      },
    ];

    for (const repair of repairs) {
      try {
        let repaired = repair();
        repaired = this.removeTrailingComma(repaired);

        const repairedCounts = this.countBrackets(repaired);
        const closing = this.buildClosingSequence(repairedCounts, repaired);

        const value = JSON.parse(repaired + closing);
        return { success: true, value };
      } catch {
        continue;
      }
    }

    return { success: false };
  }

  /**
   * Attempt buffer recovery on overflow
   */
  private attemptBufferRecovery(): boolean {
    // Find last successfully parsed position
    for (let i = this.buffer.length - 1; i > 0; i--) {
      const slice = this.buffer.slice(0, i);
      const result = this.tryPartialParse(slice);
      if (result.success) {
        this.buffer = slice;
        this.partialObject = result.value ?? null;
        return true;
      }
    }
    return false;
  }

  /**
   * Extract the current JSON path being built
   */
  private extractCurrentPath(json: string): string {
    const paths: string[] = [];
    let inString = false;
    let escaped = false;
    let currentKey = "";
    let buildingKey = false;
    let depth = 0;
    let arrayIndex = 0;
    const arrayIndices: number[] = [];

    for (let i = 0; i < json.length; i++) {
      const char = json[i];

      if (escaped) {
        escaped = false;
        if (buildingKey) {
          currentKey += char;
        }
        continue;
      }

      if (char === "\\") {
        escaped = true;
        if (buildingKey) {
          currentKey += char;
        }
        continue;
      }

      if (char === '"') {
        if (!inString) {
          inString = true;
          buildingKey = true;
          currentKey = "";
        } else {
          inString = false;
          buildingKey = false;
          // Check if this is a key (followed by :)
          const rest = json.slice(i + 1).trimStart();
          if (rest.startsWith(":")) {
            paths[depth] = currentKey;
          }
        }
        continue;
      }

      if (inString) {
        if (buildingKey) {
          currentKey += char;
        }
        continue;
      }

      if (char === "{") {
        depth++;
        arrayIndices[depth] = -1; // Not in array
      } else if (char === "[") {
        depth++;
        arrayIndex = 0;
        arrayIndices[depth] = arrayIndex;
      } else if (char === "}" || char === "]") {
        depth--;
        if (depth >= 0) {
          paths.length = depth + 1;
        }
      } else if (char === ",") {
        if (arrayIndices[depth] !== undefined && arrayIndices[depth] >= 0) {
          arrayIndices[depth]++;
          paths[depth] = String(arrayIndices[depth]);
        }
      }
    }

    return paths.filter((p) => p !== undefined).join(".");
  }

  /**
   * Validate object against schema
   */
  private validateObject(obj: JsonValue): { valid: boolean; errors: string[] } {
    if (!this.config.schema) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    this.validateAgainstSchema(obj, this.config.schema, "", errors);

    return { valid: errors.length === 0, errors };
  }

  /**
   * Recursive schema validation
   */
  private validateAgainstSchema(
    value: JsonValue,
    schema: JSONSchemaDefinition,
    path: string,
    errors: string[],
  ): void {
    const pathPrefix = path ? `${path}.` : "";

    // Type validation
    if (schema.type) {
      const actualType = this.getJsonType(value);
      if (actualType !== schema.type) {
        errors.push(
          `${path || "root"}: expected ${schema.type}, got ${actualType}`,
        );
        return;
      }
    }

    // Object validation
    if (
      schema.type === "object" &&
      typeof value === "object" &&
      value !== null
    ) {
      const objValue = value as Record<string, JsonValue>;

      // Required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in objValue)) {
            errors.push(`${pathPrefix}${field}: required field missing`);
          }
        }
      }

      // Property validation
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in objValue) {
            this.validateAgainstSchema(
              objValue[key],
              propSchema,
              `${pathPrefix}${key}`,
              errors,
            );
          }
        }
      }
    }

    // Array validation
    if (schema.type === "array" && Array.isArray(value) && schema.items) {
      for (let i = 0; i < value.length; i++) {
        this.validateAgainstSchema(
          value[i],
          schema.items,
          `${path}[${i}]`,
          errors,
        );
      }
    }
  }

  /**
   * Get JSON type of value
   */
  private getJsonType(
    value: JsonValue,
  ): "object" | "array" | "string" | "number" | "boolean" | "null" {
    if (value === null) {
      return "null";
    }
    if (Array.isArray(value)) {
      return "array";
    }
    return typeof value as "object" | "string" | "number" | "boolean";
  }
}

// ============================================
// STREAMING HELPERS
// ============================================

/**
 * Create a partial object stream from text deltas
 */
export async function* createPartialObjectStream<T = JsonValue>(
  textDeltas: AsyncIterable<string>,
  config?: PartialObjectStreamerConfig,
): AsyncGenerator<{
  partial: T | null;
  final: T | null;
  event: ObjectDeltaPayload | ObjectCompletePayload | null;
}> {
  const streamer = new PartialObjectStreamer(config);

  for await (const delta of textDeltas) {
    const event = streamer.processJsonDelta(delta);
    if (event) {
      yield {
        partial: event.partialObject as T | null,
        final: null,
        event,
      };
    }
  }

  const finalEvent = streamer.finalize();
  if (finalEvent) {
    yield {
      partial: null,
      final: finalEvent.object as T,
      event: finalEvent,
    };
  }
}

/**
 * Collect partial object stream to final result
 */
export async function collectPartialObjectStream<T = JsonValue>(
  stream: AsyncIterable<{ partial: T | null; final: T | null }>,
): Promise<T | null> {
  let result: T | null = null;

  for await (const { partial, final } of stream) {
    if (final !== null) {
      result = final;
    } else if (partial !== null) {
      result = partial;
    }
  }

  return result;
}

/**
 * Subscribe to partial object updates with callback
 */
export async function subscribeToPartialObject<T = JsonValue>(
  textDeltas: AsyncIterable<string>,
  onPartial: (partial: T) => void,
  onComplete: (final: T, valid: boolean) => void,
  config?: PartialObjectStreamerConfig,
): Promise<void> {
  const streamer = new PartialObjectStreamer(config);

  for await (const delta of textDeltas) {
    const event = streamer.processJsonDelta(delta);
    if (event && event.partialObject !== null) {
      onPartial(event.partialObject as T);
    }
  }

  const finalEvent = streamer.finalize();
  if (finalEvent) {
    onComplete(finalEvent.object as T, finalEvent.valid);
  }
}
