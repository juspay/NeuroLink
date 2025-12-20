/**
 * Conversation Memory Configuration
 * Provides default values for conversation memory feature with environment variable support
 */

import type { ConversationMemoryConfig } from "../types/conversation.js";

/**
 * Default maximum number of turns per session
 */
export const DEFAULT_MAX_TURNS_PER_SESSION = 50;

/**
 * Default maximum number of sessions
 */
export const DEFAULT_MAX_SESSIONS = 50;

/**
 * Number of messages per conversation turn (user + assistant)
 */
export const MESSAGES_PER_TURN = 2;

/**
 * Conversation instructions for ongoing conversations
 * Used to enhance system prompts when conversation history exists
 */
export const CONVERSATION_INSTRUCTIONS = `

IMPORTANT: You are continuing an ongoing conversation. The previous messages in this conversation contain important context including:
- Names, personal information, and preferences shared by the user
- Projects, tasks, and topics discussed previously  
- Any decisions, agreements, or conclusions reached

Always reference and build upon this conversation history when relevant. If the user asks about information mentioned earlier in the conversation, refer to those previous messages to provide accurate, contextual responses.`;

/**
 * Structured output instructions for JSON/structured output mode
 * Used to ensure AI providers output only valid JSON without conversational filler
 * This addresses the issue where models add text like "Excellent!" before JSON output
 * and the case where tools are used but final output must still be pure JSON
 */
export const STRUCTURED_OUTPUT_INSTRUCTIONS = `
Output ONLY valid JSON. No markdown, text, or decorations—ever.

FORBIDDEN: markdown code blocks, text before/after JSON, explanations, preambles, summaries, conversational text about tools.

REQUIRED: response starts with { and ends with }, valid JSON only, no additional characters.

IF YOU CALLED TOOLS: Incorporate data directly into the JSON structure. Do NOT explain what you did.

WRONG: \`\`\`json
{"field": "value"}
\`\`\`
WRONG: Based on the data, here's the result: {"field": "value"}
CORRECT: {"field": "value"}

Your entire response = raw JSON object. Nothing else.`;

/**
 * Get default configuration values for conversation memory
 * Reads environment variables when called (not at module load time)
 */
export function getConversationMemoryDefaults(): ConversationMemoryConfig {
  return {
    enabled: process.env.NEUROLINK_MEMORY_ENABLED === "true",
    maxSessions:
      Number(process.env.NEUROLINK_MEMORY_MAX_SESSIONS) || DEFAULT_MAX_SESSIONS,
    maxTurnsPerSession:
      Number(process.env.NEUROLINK_MEMORY_MAX_TURNS_PER_SESSION) ||
      DEFAULT_MAX_TURNS_PER_SESSION,
    enableSummarization: process.env.NEUROLINK_SUMMARIZATION_ENABLED === "true",
    summarizationThresholdTurns:
      Number(process.env.NEUROLINK_SUMMARIZATION_THRESHOLD_TURNS) || 20,
    summarizationTargetTurns:
      Number(process.env.NEUROLINK_SUMMARIZATION_TARGET_TURNS) || 10,
    summarizationProvider:
      process.env.NEUROLINK_SUMMARIZATION_PROVIDER || "vertex",
    summarizationModel:
      process.env.NEUROLINK_SUMMARIZATION_MODEL || "gemini-2.5-flash",
  };
}
