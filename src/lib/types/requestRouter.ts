/**
 * Pluggable pre-call request router types.
 *
 * A RequestRouter is a host-supplied async function that inspects lightweight
 * request characteristics (token estimate, tools, vision, thinking) and
 * returns an optional provider/model/region override.  The router runs only
 * when the host opts in (by passing `requestRouter` or `modelPool` to
 * the NeuroLink constructor) and only when the user did NOT explicitly set
 * BOTH `options.provider` AND `options.model` on the call (a partial pin —
 * e.g. only `options.provider` — still allows the router to run).
 *
 * Everything fails open: if the router throws or returns an empty decision the
 * call proceeds with whatever provider/model was configured by the caller.
 */

/**
 * Lightweight characteristics of the incoming request available to the router
 * without executing the full call.
 */
export type RouterInputContext = {
  /** The text prompt (or first text segment of a multi-modal input). */
  prompt: string;
  /** Rough token estimate for the input, if known by the caller. */
  estimatedInputTokens?: number;
  /** True when the call includes at least one tool definition. */
  hasTools?: boolean;
  /** True when the call includes at least one image/vision attachment. */
  requiresVision?: boolean;
  /** Thinking level passed to the call ("minimal" | "low" | "medium" | "high"). */
  thinkingLevel?: string;
};

/**
 * The router's decision.  Any field that is undefined means "keep whatever the
 * caller already configured" — returning `{}` is a valid no-op.
 */
export type RequestRouterDecision = {
  provider?: string;
  model?: string;
  region?: string;
  /** Optional human-readable reason, emitted at debug log level. */
  reason?: string;
};

/**
 * A pluggable pre-call router function.
 *
 * Receives a lightweight context snapshot and returns provider/model/region
 * overrides.  May be async (e.g. to consult a remote config service).
 */
export type RequestRouter = (
  context: RouterInputContext,
) => RequestRouterDecision | Promise<RequestRouterDecision>;

/**
 * Tier-to-(provider,model) mapping used by `createDefaultRequestRouter`.
 * Each tier is optional; an unmatched tier produces an empty decision.
 */
export type ModelTierEntry = {
  provider: string;
  model: string;
  region?: string;
};

/**
 * Configuration for the built-in heuristic request router produced by
 * `createDefaultRequestRouter`.  All fields are optional; sensible defaults
 * apply when omitted.
 */
export type DefaultRequestRouterConfig = {
  /**
   * Token threshold above which the "large" tier is selected.
   * Default: 32_000.
   */
  largeInputTokenThreshold?: number;
  /** Provider/model to use for vision requests. */
  visionTier?: ModelTierEntry;
  /** Provider/model to use for large inputs or tool-heavy requests. */
  largeTier?: ModelTierEntry;
  /** Provider/model to use for fast/small requests. */
  smallTier?: ModelTierEntry;
};
