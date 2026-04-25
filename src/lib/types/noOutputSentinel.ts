/**
 * Curator P3-6: shape of the sentinel chunk yielded by every provider's
 * stream-transformation generator when AI SDK throws
 * `NoOutputGeneratedError`. Built by `buildNoOutputSentinel` in
 * `src/lib/utils/noOutputSentinel.ts`.
 */
export type StreamNoOutputSentinel = {
  content: "";
  metadata: {
    noOutput: true;
    errorType: "NoOutputGeneratedError";
    finishReason: unknown;
    usage: unknown;
    providerError: string;
    modelResponseRaw: string | undefined;
  };
};

/**
 * Subset of AI SDK's `StreamTextResult` that the sentinel builder reads.
 * Both fields are Promises in production but typed loosely so callers
 * can pass either the Promise or a resolved value.
 */
export type StreamNoOutputSentinelResultLike = {
  finishReason?: Promise<unknown> | unknown;
  totalUsage?: Promise<unknown> | unknown;
};
