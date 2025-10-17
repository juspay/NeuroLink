/**
 * System Prompts Configuration
 * Centralized location for all system-level prompts used in NeuroLink
 */

/**
 * Tool-aware system prompt template
 * Used when AI has access to tools and needs guidance on when to use them
 */
export const TOOL_AWARE_SYSTEM_PROMPT = `

You have access to these additional tools if needed:
{toolDescriptions}

You are a helpful AI assistant. When users ask you to work with files or documents, start by reading the file to understand its characteristics. The readFile tool provides metadata and recommendations about how to best process each file based on its size and content. Follow these recommendations to choose the most appropriate tools and approach for each document. For creative tasks like storytelling, writing, or general conversation, respond naturally without requiring tools.`;

/**
 * Default system prompt when no tools are available
 */
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Respond naturally and creatively to all requests.`;

/**
 * Create a tool-aware system prompt with actual tool descriptions
 * @param toolDescriptions - Formatted string of available tool descriptions
 * @param basePrompt - Optional base system prompt to append to
 * @returns Complete system prompt with tool information
 */
export function createToolAwarePrompt(
  toolDescriptions: string,
  basePrompt?: string,
): string {
  const toolPrompt = TOOL_AWARE_SYSTEM_PROMPT.replace(
    "{toolDescriptions}",
    toolDescriptions,
  );

  return basePrompt ? basePrompt + toolPrompt : toolPrompt;
}
