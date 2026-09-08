import type {
  LoopGuardEntry,
  NativeGenerateGuardConfig,
} from "../types/index.js";
import {
  estimateTokens,
  TOKENS_PER_MESSAGE,
} from "../utils/tokenEstimation.js";
import { logger } from "../utils/logger.js";
import { planLoopGuardReclaim } from "./loopGuardCore.js";
import { generateToolOutputPreview } from "./toolOutputLimits.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const partsOf = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const textOf = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "x".repeat(200_000);
  }
};

const previewMessage = (
  message: Record<string, unknown>,
): Record<string, unknown> => ({
  ...message,
  // Do not stringify the whole message: call IDs, result types and metadata
  // must survive the wire conversion. Only the result payload is shortened.
  content: partsOf(message.content).map((part) => {
    if (part.type !== "tool-result") {
      return part;
    }
    const output = part.output;
    const wrapped =
      isRecord(output) &&
      ["text", "json", "error-text", "error-json"].includes(
        String(output.type),
      ) &&
      "value" in output;
    const { preview, truncated } = generateToolOutputPreview(
      textOf(wrapped ? output.value : output),
      { maxBytes: 2048, maxLines: 60 },
    );
    if (!truncated) {
      return part;
    }
    return {
      ...part,
      output: wrapped
        ? {
            ...output,
            type: String(output.type).startsWith("error")
              ? "error-text"
              : "text",
            value: preview,
          }
        : preview,
    };
  }),
});

/** V3-shape adapter for the reclaim policy shared with streaming guards. */
export function createNativeGenerateGuard(config: NativeGenerateGuardConfig) {
  let previousSentEstimate: number | undefined;
  let observedPromptTokens: number | undefined;
  const cost = (message: Record<string, unknown>): number =>
    estimateTokens(textOf(message), config.provider) + TOKENS_PER_MESSAGE;

  return {
    observeUsage(usage: unknown): void {
      const input = isRecord(usage) ? usage.inputTokens : undefined;
      const total = isRecord(input) ? input.total : input;
      observedPromptTokens =
        typeof total === "number" && Number.isFinite(total) && total > 0
          ? total
          : undefined;
    },
    guardConversation(
      conversation: Array<Record<string, unknown>>,
    ): Array<Record<string, unknown>> | undefined {
      // Policy entry zero is protected. Fold the entire initial task prefix
      // into it so leading system messages cannot displace task protection.
      const taskIndex = conversation.findIndex(
        (message) => message.role === "user",
      );
      const prefixLength = Math.max(1, taskIndex + 1);
      const tail = conversation.slice(prefixLength);
      const previews = tail.map(previewMessage);
      const entries: LoopGuardEntry[] = [
        {
          kind: "other",
          tokens: conversation
            .slice(0, prefixLength)
            .reduce((sum, message) => sum + cost(message), 0),
        },
        ...tail.map((message, index): LoopGuardEntry => {
          const parts = partsOf(message.content);
          if (
            message.role === "assistant" &&
            parts.some((part) => part.type === "tool-call")
          ) {
            return { kind: "toolCall", tokens: cost(message) };
          }
          if (
            message.role === "tool" &&
            parts.some((part) => part.type === "tool-result")
          ) {
            return {
              kind: "toolResult",
              tokens: cost(message),
              previewTokens: cost(previews[index]),
            };
          }
          return { kind: "other", tokens: cost(message) };
        }),
      ];
      const overhead = config.getFixedOverheadTokens();
      const calibration =
        observedPromptTokens && previousSentEstimate
          ? Math.min(
              3,
              Math.max(1, observedPromptTokens / previousSentEstimate),
            )
          : 1;
      const plan = planLoopGuardReclaim(entries, {
        availableInputTokens: config.availableInputTokens,
        fixedOverheadTokens: overhead,
        calibration,
      });
      if (!plan.fire) {
        previousSentEstimate =
          overhead + entries.reduce((sum, entry) => sum + entry.tokens, 0);
        return undefined;
      }
      const drop = new Set(plan.drop);
      const truncate = new Set(plan.truncate);
      const result = [...conversation.slice(0, prefixLength)];
      let noted = false;
      tail.forEach((message, index) => {
        const entry = index + 1;
        if (drop.has(entry)) {
          if (!noted) {
            result.push({
              role: "user",
              content:
                "[Earlier tool exchanges were removed to fit the context window.]",
            });
          }
          noted = true;
        } else {
          result.push(truncate.has(entry) ? previews[index] : message);
        }
      });
      previousSentEstimate =
        overhead + result.reduce((sum, message) => sum + cost(message), 0);
      logger.info("[NativeGenerateGuard] Reclaimed context", {
        provider: config.provider,
        truncated: plan.truncate.length,
        dropped: plan.drop.length,
        calibration,
      });
      return result;
    },
  };
}
