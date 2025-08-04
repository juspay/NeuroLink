/**
 * Conversation Memory Configuration
 * Provides default values for conversation memory feature with environment variable support
 */

import type { ConversationMemoryConfig } from "../types/conversationTypes.js";

/**
 * Get default configuration values for conversation memory
 * Reads environment variables when called (not at module load time)
 */
export function getConversationMemoryDefaults(): ConversationMemoryConfig {
  return {
    enabled: process.env.NEUROLINK_MEMORY_ENABLED === "true" ,
    maxSessions: Number(process.env.NEUROLINK_MEMORY_MAX_SESSIONS) || 50,
    maxTurnsPerSession:
      Number(process.env.NEUROLINK_MEMORY_MAX_TURNS_PER_SESSION) || 50,
  };
}
