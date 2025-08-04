/**
 * Message Builder Utility
 * Centralized logic for building message arrays from TextGenerationOptions
 */

import type { ChatMessage } from "../types/conversationTypes.js";
import type { TextGenerationOptions } from "../core/types.js";
import type { StreamOptions } from "../types/streamTypes.js";

/**
 * Build a properly formatted message array for AI providers
 * Combines system prompt, conversation history, and current user prompt
 * Supports both TextGenerationOptions and StreamOptions
 */
export function buildMessagesArray(
  options: TextGenerationOptions | StreamOptions
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  
  // Check if conversation history exists
  const hasConversationHistory = options.conversationMessages && options.conversationMessages.length > 0;
  
  // Build enhanced system prompt
  let systemPrompt = options.systemPrompt?.trim() || "";
  
  // Add conversation-aware instructions when history exists
  if (hasConversationHistory) {
    const conversationInstructions = `

IMPORTANT: You are continuing an ongoing conversation. The previous messages in this conversation contain important context including:
- Names, personal information, and preferences shared by the user
- Projects, tasks, and topics discussed previously  
- Any decisions, agreements, or conclusions reached

Always reference and build upon this conversation history when relevant. If the user asks about information mentioned earlier in the conversation, refer to those previous messages to provide accurate, contextual responses.`;

    systemPrompt = systemPrompt + conversationInstructions;
  }
  
  // Add system message if we have one
  if (systemPrompt.trim()) {
    messages.push({ 
      role: "system", 
      content: systemPrompt.trim()
    });
  }
  
  // Add conversation history if available
  if (hasConversationHistory && options.conversationMessages) {
    messages.push(...options.conversationMessages);
  }
  
  // Add current user prompt (required)
  // Handle both TextGenerationOptions (prompt field) and StreamOptions (input.text field)
  let currentPrompt: string | undefined;
  
  if ('prompt' in options && options.prompt) {
    currentPrompt = options.prompt;
  } else if ('input' in options && options.input?.text) {
    currentPrompt = options.input.text;
  }
  
  if (currentPrompt?.trim()) {
    messages.push({ 
      role: "user", 
      content: currentPrompt.trim() 
    });
  }
  
  return messages;
}
