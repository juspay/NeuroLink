import type Anthropic from "@anthropic-ai/sdk";

/**
 * Read an Anthropic cache breakpoint from a message/part/tool carrier.
 * MessageBuilder marks system messages with
 * `providerOptions.anthropic.cacheControl`; the Anthropic client marks the last
 * tool definition on the assembled request. This reader is what honors both.
 *
 * Extracted from anthropic/client.ts so `src/lib/core/nativeToolFormat.ts`
 * can share it without importing the provider client (which would create a
 * circular import: client.ts -> core/nativeToolFormat.ts -> client.ts).
 */
export const cacheControlOf = (
  carrier: unknown,
): Anthropic.Messages.CacheControlEphemeral | undefined => {
  const cc = (
    carrier as {
      providerOptions?: { anthropic?: { cacheControl?: { type?: string } } };
    }
  )?.providerOptions?.anthropic?.cacheControl;
  return cc?.type === "ephemeral" ? { type: "ephemeral" } : undefined;
};
