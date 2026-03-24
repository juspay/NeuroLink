/**
 * WordObfuscator — inserts zero-width characters into sensitive words so
 * that naive string-matching by upstream APIs cannot detect them.
 *
 * For example, "proxy" becomes "p\u200Broxy" (ZWS after the first character),
 * making the text visually identical to humans but different at the byte level.
 */

import type { CloakingPlugin, CloakingContext } from "../../../types/index.js";

/** Unicode zero-width space (U+200B). */
const ZWS = "\u200B";

/**
 * Insert a zero-width space after the first character.
 * This defeats simple substring matching while preserving readability.
 */
function obfuscateWord(word: string): string {
  if (word.length <= 1) {
    return word;
  }
  return word.charAt(0) + ZWS + word.slice(1);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace all case-insensitive occurrences of each sensitive word in `text`
 * with the obfuscated version, preserving original casing.
 *
 * Words are sorted longest-first so that longer matches take priority over
 * shorter substrings (e.g., "load balancer" matches before "load").
 */
function obfuscateText(text: string, sortedWords: string[]): string {
  let result = text;
  for (const word of sortedWords) {
    const pattern = new RegExp(escapeRegExp(word), "gi");
    result = result.replace(pattern, (match) => obfuscateWord(match));
  }
  return result;
}

/** Default sensitive words that might reveal proxy usage. */
const DEFAULT_SENSITIVE_WORDS: readonly string[] = [
  "proxy",
  "neurolink",
  "load balancer",
  "round-robin",
  "failover",
  "multi-account",
];

export function createWordObfuscator(customWords?: string[]): CloakingPlugin {
  const words = customWords ?? [...DEFAULT_SENSITIVE_WORDS];
  // Sort longest-first so longer matches take priority
  const sorted = [...words].sort((a, b) => b.length - a.length);

  return {
    name: "word-obfuscator",
    order: 40,
    enabled: true,

    async transformRequest(ctx: CloakingContext): Promise<CloakingContext> {
      const messages = ctx.request.body.messages.map((msg) => {
        if (typeof msg.content === "string") {
          return { ...msg, content: obfuscateText(msg.content, sorted) };
        }
        if (Array.isArray(msg.content)) {
          const obfuscatedContent = (
            msg.content as Array<Record<string, unknown>>
          ).map((block) => {
            if (block.type === "text" && typeof block.text === "string") {
              return {
                ...block,
                text: obfuscateText(block.text as string, sorted),
              };
            }
            // Obfuscate tool_result content (string or nested blocks)
            if (block.type === "tool_result") {
              if (typeof block.content === "string") {
                return {
                  ...block,
                  content: obfuscateText(block.content as string, sorted),
                };
              }
              if (Array.isArray(block.content)) {
                const obfuscatedBlocks = (
                  block.content as Array<Record<string, unknown>>
                ).map((inner) => {
                  if (inner.type === "text" && typeof inner.text === "string") {
                    return {
                      ...inner,
                      text: obfuscateText(inner.text as string, sorted),
                    };
                  }
                  return inner;
                });
                return { ...block, content: obfuscatedBlocks };
              }
            }
            return block;
          });
          return { ...msg, content: obfuscatedContent };
        }
        return msg;
      });

      // Also obfuscate system prompt if present
      let system: string | Array<{ type: string; text: string }> | undefined =
        ctx.request.body.system;
      if (typeof system === "string") {
        system = obfuscateText(system, sorted);
      } else if (Array.isArray(system)) {
        system = system.map((block) => {
          if (block.type === "text" && typeof block.text === "string") {
            return { ...block, text: obfuscateText(block.text, sorted) };
          }
          return block;
        });
      }

      return {
        ...ctx,
        request: {
          ...ctx.request,
          body: {
            ...ctx.request.body,
            messages,
            ...(system !== undefined ? { system } : {}),
          },
        },
      };
    },
  };
}
