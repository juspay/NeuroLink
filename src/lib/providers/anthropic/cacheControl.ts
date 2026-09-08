import type Anthropic from "@anthropic-ai/sdk";

/**
 * Default the tool cache boundary to the last tool, unless the caller chose one.
 *
 * Tool definitions sit between the system prompt and the conversation and
 * rarely change, so with no breakpoint closing that prefix the whole tools
 * block is re-billed as fresh input every turn.
 *
 * Call it after every tool mutation — including any appended `final_result`
 * tool — and before counting markers for the remaining history budget.
 * Explicit caller markers are preserved, including a non-last boundary.
 * Both generate and stream apply the same default.
 *
 * Pure — returns a new array. A tool that already carries a breakpoint wins.
 */
export const withLastToolCacheBreakpoint = (
  tools: Anthropic.Messages.Tool[] | undefined,
): Anthropic.Messages.Tool[] | undefined => {
  if (!tools || tools.length === 0) {
    return tools;
  }
  // Read the ASSEMBLED wire field. An earlier version asked `cacheControlOf`,
  // which looks at `providerOptions.anthropic.cacheControl` — a shape these
  // tools no longer have by this point — so the check never fired and a
  // caller-marked tool got a second, redundant marker.
  if (tools.some((t) => t.cache_control !== undefined)) {
    return [...tools];
  }
  const last = tools[tools.length - 1];
  return [
    ...tools.slice(0, -1),
    { ...last, cache_control: { type: "ephemeral" as const } },
  ];
};

/**
 * Read an Anthropic cache breakpoint from a message/part/tool carrier that
 * still carries `providerOptions.anthropic.cacheControl` — i.e. BEFORE
 * conversion to the Anthropic wire shape. MessageBuilder marks system messages
 * that way. Tools are marked after conversion, by
 * `withLastToolCacheBreakpoint`, which reads the wire-shaped `cache_control`
 * instead; do not use this reader on an assembled tool.
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
