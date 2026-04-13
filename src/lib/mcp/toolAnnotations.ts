/**
 * MCP Tool Annotations System
 *
 * Enhanced tool annotations for MCP tools providing hints to AI models
 * about tool behavior, safety, and execution characteristics.
 *
 * Implements MCP 2024-11-05 specification tool annotations including:
 * - readOnlyHint: Tool only reads data
 * - destructiveHint: Tool performs destructive operations
 * - idempotentHint: Tool can be safely retried
 * - requiresConfirmation: Tool needs user confirmation
 *
 * @module mcp/toolAnnotations
 * @since 8.39.0
 */

import type { MCPServerTool, MCPToolAnnotations } from "../types/index.js";

/**
 * Infer annotations from tool definition
 * Uses heuristics based on tool description and name
 */
export function inferAnnotations(
  tool: Pick<MCPServerTool, "name" | "description">,
): MCPToolAnnotations {
  const name = tool.name;
  const description = tool.description.toLowerCase();

  const annotations: MCPToolAnnotations = {};

  // Helper: match keyword with word boundaries to avoid false positives
  // (e.g., "get" should not match "forget", "together", "target")
  // Also handles underscore/hyphen/camelCase-separated names (e.g., "delete_record", "readFile")
  const matchesKeyword = (text: string, keyword: string): boolean => {
    // Standard word boundary match (works for space-separated text like descriptions)
    if (new RegExp(`\\b${keyword}\\b`, "i").test(text)) {
      return true;
    }
    // Also check underscore/hyphen/camelCase segments (common in tool names)
    const normalized = text
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .toLowerCase();
    return normalized
      .split(/[_-]/)
      .some((segment) => segment === keyword.toLowerCase());
  };

  // Infer read-only from description keywords
  const readOnlyKeywords = [
    "get",
    "list",
    "read",
    "fetch",
    "query",
    "search",
    "find",
    "show",
    "display",
    "view",
    "retrieve",
    "check",
    "inspect",
    "look",
  ];

  if (
    readOnlyKeywords.some(
      (keyword) =>
        matchesKeyword(description, keyword) || matchesKeyword(name, keyword),
    )
  ) {
    annotations.readOnlyHint = true;
  }

  // Infer destructive from description keywords
  const destructiveKeywords = [
    "delete",
    "remove",
    "drop",
    "destroy",
    "clear",
    "purge",
    "erase",
    "wipe",
    "truncate",
    "reset",
  ];

  if (
    destructiveKeywords.some(
      (keyword) =>
        matchesKeyword(description, keyword) || matchesKeyword(name, keyword),
    )
  ) {
    annotations.destructiveHint = true;
    annotations.requiresConfirmation = true;
  }

  // Infer idempotent from description keywords
  const idempotentKeywords = ["set", "update", "put", "upsert", "replace"];

  if (
    idempotentKeywords.some(
      (keyword) =>
        matchesKeyword(description, keyword) || matchesKeyword(name, keyword),
    ) &&
    !annotations.destructiveHint
  ) {
    annotations.idempotentHint = true;
  }

  // Infer complexity from description length and keywords
  const complexKeywords = [
    "complex",
    "analyze",
    "process",
    "generate",
    "transform",
    "compute",
    "calculate",
  ];

  if (
    complexKeywords.some(
      (keyword) =>
        matchesKeyword(description, keyword) || matchesKeyword(name, keyword),
    )
  ) {
    annotations.complexity = "complex";
  } else if (description.length > 100) {
    annotations.complexity = "medium";
  } else {
    annotations.complexity = "simple";
  }

  return annotations;
}

/**
 * Merge multiple annotation objects with precedence
 * Later annotations override earlier ones
 */
export function mergeAnnotations(
  ...annotationSets: (MCPToolAnnotations | undefined)[]
): MCPToolAnnotations {
  const result: MCPToolAnnotations = {};

  for (const annotations of annotationSets) {
    if (annotations) {
      const existingTags = result.tags ? [...result.tags] : [];
      Object.assign(result, annotations);

      // Special handling for arrays (merge instead of replace)
      if (existingTags.length > 0 || annotations.tags) {
        const newTags = annotations.tags ?? [];
        result.tags = [...new Set([...existingTags, ...newTags])];
      }
    }
  }

  return result;
}

/**
 * Validate tool annotations
 * Returns list of validation errors (empty if valid)
 */
export function validateAnnotations(annotations: MCPToolAnnotations): string[] {
  const errors: string[] = [];

  // Check for conflicting annotations
  if (annotations.readOnlyHint && annotations.destructiveHint) {
    errors.push(
      "Tool cannot be both readOnly and destructive - these are conflicting hints",
    );
  }

  // Validate rate limit hint
  if (
    annotations.rateLimitHint !== undefined &&
    (annotations.rateLimitHint < 0 ||
      !Number.isFinite(annotations.rateLimitHint))
  ) {
    errors.push("rateLimitHint must be a non-negative number");
  }

  // Validate estimated duration
  if (
    annotations.estimatedDuration !== undefined &&
    (annotations.estimatedDuration < 0 ||
      !Number.isFinite(annotations.estimatedDuration))
  ) {
    errors.push("estimatedDuration must be a non-negative number");
  }

  // Validate cost hint
  if (
    annotations.costHint !== undefined &&
    (annotations.costHint < 0 || !Number.isFinite(annotations.costHint))
  ) {
    errors.push("costHint must be a non-negative number");
  }

  // Validate tags are strings
  if (annotations.tags) {
    for (const tag of annotations.tags) {
      if (typeof tag !== "string" || tag.length === 0) {
        errors.push("All tags must be non-empty strings");
        break;
      }
    }
  }

  return errors;
}

/**
 * Create a tool with default annotations inferred
 */
export function createAnnotatedTool(
  tool: Omit<MCPServerTool, "annotations"> & {
    annotations?: MCPToolAnnotations;
  },
): MCPServerTool {
  const inferredAnnotations = inferAnnotations(tool);
  const mergedAnnotations = mergeAnnotations(
    inferredAnnotations,
    tool.annotations,
  );

  return {
    ...tool,
    annotations: mergedAnnotations,
  };
}

/**
 * Check if a tool requires confirmation based on annotations
 */
export function requiresConfirmation(tool: MCPServerTool): boolean {
  return !!(
    tool.annotations?.requiresConfirmation || tool.annotations?.destructiveHint
  );
}

/**
 * Check if a tool is safe for automatic retry
 */
export function isSafeToRetry(tool: MCPServerTool): boolean {
  return !!(tool.annotations?.idempotentHint || tool.annotations?.readOnlyHint);
}

/**
 * Get tool safety level based on annotations
 */
export function getToolSafetyLevel(
  tool: MCPServerTool,
): "safe" | "moderate" | "dangerous" {
  if (tool.annotations?.destructiveHint) {
    return "dangerous";
  }

  if (tool.annotations?.readOnlyHint) {
    return "safe";
  }

  if (tool.annotations?.idempotentHint) {
    return "moderate";
  }

  // Default to moderate for unknown tools
  return "moderate";
}

/**
 * Filter tools by annotation predicates
 */
export function filterToolsByAnnotations(
  tools: MCPServerTool[],
  predicate: (annotations: MCPToolAnnotations) => boolean,
): MCPServerTool[] {
  return tools.filter((tool) => {
    const annotations = tool.annotations ?? {};
    return predicate(annotations);
  });
}

/**
 * Get human-readable summary of tool annotations
 */
export function getAnnotationSummary(annotations: MCPToolAnnotations): string {
  const parts: string[] = [];

  if (annotations.title) {
    parts.push(annotations.title);
  }

  if (annotations.readOnlyHint) {
    parts.push("read-only");
  }

  if (annotations.destructiveHint) {
    parts.push("DESTRUCTIVE");
  }

  if (annotations.idempotentHint) {
    parts.push("idempotent");
  }

  if (annotations.requiresConfirmation) {
    parts.push("requires confirmation");
  }

  if (annotations.complexity) {
    parts.push(`${annotations.complexity} complexity`);
  }

  if (annotations.estimatedDuration !== undefined) {
    parts.push(`~${annotations.estimatedDuration}ms`);
  }

  if (annotations.tags?.length) {
    parts.push(`tags: ${annotations.tags.join(", ")}`);
  }

  return parts.length > 0 ? `[${parts.join(" | ")}]` : "[no annotations]";
}
