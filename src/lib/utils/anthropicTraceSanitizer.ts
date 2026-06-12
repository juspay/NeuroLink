import type { VertexAnthropicMessage } from "../types/index.js";

/**
 * Strips base64 image/PDF payloads from Anthropic messages before they go on a
 * trace attribute — one screenshot would otherwise be megabytes on a span.
 * Other block types pass through; the serializer still applies its length cap.
 */
export function sanitizeAnthropicMessagesForTrace(
  messages: VertexAnthropicMessage[],
): Array<Record<string, unknown>> {
  return messages.map((message) => {
    if (typeof message.content === "string") {
      return { role: message.role, content: message.content };
    }
    return {
      role: message.role,
      content: message.content.map((block) => {
        if (block.type === "image" || block.type === "document") {
          return {
            type: block.type,
            media_type: block.source.media_type,
            base64_chars: block.source.data.length,
          };
        }
        return block;
      }),
    };
  });
}
