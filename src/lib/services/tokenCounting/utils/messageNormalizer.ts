/**
 * Message Normalizer
 *
 * Converts CoreMessage arrays to provider-specific formats and generates
 * deterministic hashes for cache key generation.
 */

import type { CoreMessage } from "ai";

/**
 * Generate a deterministic hash from messages
 * Used for cache key generation
 */
export function hashMessages(messages: CoreMessage[]): string {
  // Create a stable string representation of messages
  const normalized = messages.map((msg) => {
    // Extract core properties in a consistent order
    const parts: string[] = [msg.role];

    // Handle content (can be string or array)
    if (typeof msg.content === "string") {
      parts.push(msg.content);
    } else if (Array.isArray(msg.content)) {
      // For arrays, sort by type to ensure consistent ordering
      const sortedContent = [...msg.content].sort((a, b) => {
        const typeA = (a as { type?: string }).type || "";
        const typeB = (b as { type?: string }).type || "";
        return typeA.localeCompare(typeB);
      });

      for (const part of sortedContent) {
        const partObj = part as {
          type?: string;
          text?: string;
          [key: string]: unknown;
        };
        parts.push(partObj.type || "");
        if (partObj.text) {
          parts.push(partObj.text);
        }
      }
    }

    return parts.join("|");
  });

  // Create hash from normalized messages
  const messageString = normalized.join("||");

  // Use a simple but deterministic hash
  // For production, consider using a proper hash function
  let hash = 0;
  for (let i = 0; i < messageString.length; i++) {
    const char = messageString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Normalize messages for token counting
 * Ensures messages have consistent format
 */
export function normalizeMessages(messages: CoreMessage[]): CoreMessage[] {
  // Messages are already in the correct format
  // Just return them as-is since CoreMessage doesn't support id field
  return messages;
}

/**
 * Convert messages to text for estimation
 * Extracts all text content from messages for character-based estimation
 */
export function messagesToText(messages: CoreMessage[]): string {
  const textParts: string[] = [];

  for (const message of messages) {
    // Add role as text
    textParts.push(message.role);

    // Extract content text
    if (typeof message.content === "string") {
      textParts.push(message.content);
    } else if (Array.isArray(message.content)) {
      for (const part of message.content) {
        const partObj = part as {
          type?: string;
          text?: string;
          [key: string]: unknown;
        };
        if (partObj.text) {
          textParts.push(partObj.text);
        }
      }
    }
  }

  return textParts.join("\n");
}

/**
 * Calculate approximate message size in bytes
 * Useful for optimization and debugging
 */
export function calculateMessageSize(messages: CoreMessage[]): number {
  const text = messagesToText(messages);
  // Rough estimation: UTF-8 encoding can use 1-4 bytes per character
  // Use 2 as average for better estimation
  return text.length * 2;
}

/**
 * Validate messages array
 * Ensures messages are in valid format for token counting
 */
export function validateMessages(messages: CoreMessage[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(messages)) {
    return {
      valid: false,
      error: "Messages must be an array",
    };
  }

  if (messages.length === 0) {
    return {
      valid: false,
      error: "Messages array cannot be empty",
    };
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (!msg.role) {
      return {
        valid: false,
        error: `Message at index ${i} missing required 'role' field`,
      };
    }

    if (!msg.content) {
      return {
        valid: false,
        error: `Message at index ${i} missing required 'content' field`,
      };
    }
  }

  return { valid: true };
}
