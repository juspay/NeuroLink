/**
 * Default heuristic request router.
 *
 * `createDefaultRequestRouter` produces a `RequestRouter` function that maps
 * lightweight request characteristics to a provider/model/region override.
 * It is entirely optional — hosts may supply their own `RequestRouter` function
 * instead, or disable routing entirely by not passing either.
 *
 * This PR adds `requestRouter` (and `modelPool`) as NeuroLink constructor
 * options. The router is skipped only when BOTH options.provider AND
 * options.model are explicitly set by the caller — a partial pin (e.g. only
 * provider) still allows the router to run.
 *
 * Decision logic (checked in order):
 * 1. Vision request        → visionTier
 * 2. Large input or tools  → largeTier
 * 3. Default               → smallTier (only when config.smallTier is provided)
 *
 * When none of the configured tiers matches (or when the tier is not
 * configured), the router returns `{}` which is a no-op — the caller keeps
 * whatever provider/model was set by the user.
 */

import type {
  DefaultRequestRouterConfig,
  ModelTierEntry,
  RequestRouter,
  RequestRouterDecision,
  RouterInputContext,
} from "../types/index.js";

/** Token threshold above which we treat a request as "large". */
const DEFAULT_LARGE_TOKEN_THRESHOLD = 32_000;

/**
 * Built-in defaults for each tier.
 * These are intentionally conservative — hosts should override them to match
 * their provider credentials and preferred models.
 */
const DEFAULT_VISION_TIER: ModelTierEntry = {
  provider: "vertex",
  model: "gemini-2.5-flash",
};

const DEFAULT_LARGE_TIER: ModelTierEntry = {
  provider: "anthropic",
  model: "claude-sonnet-4-5",
};

const DEFAULT_SMALL_TIER: ModelTierEntry = {
  provider: "anthropic",
  model: "claude-haiku-3-5",
};

function tierToDecision(
  tier: ModelTierEntry,
  reason: string,
): RequestRouterDecision {
  return {
    provider: tier.provider,
    model: tier.model,
    region: tier.region,
    reason,
  };
}

/**
 * Creates a heuristic `RequestRouter` from a `DefaultRequestRouterConfig`.
 *
 * @param config — optional tier overrides; built-in defaults apply when omitted.
 * @returns a synchronous `RequestRouter` function (satisfies the async signature).
 */
export function createDefaultRequestRouter(
  config?: DefaultRequestRouterConfig,
): RequestRouter {
  const largeTokenThreshold =
    config?.largeInputTokenThreshold ?? DEFAULT_LARGE_TOKEN_THRESHOLD;
  const visionTier = config?.visionTier ?? DEFAULT_VISION_TIER;
  const largeTier = config?.largeTier ?? DEFAULT_LARGE_TIER;
  const smallTier = config?.smallTier ?? DEFAULT_SMALL_TIER;

  return function defaultRequestRouter(
    ctx: RouterInputContext,
  ): RequestRouterDecision {
    // 1. Vision
    if (ctx.requiresVision) {
      return tierToDecision(visionTier, "vision request detected");
    }

    // 2. Large input or tool-heavy
    const tokenCount = ctx.estimatedInputTokens ?? 0;
    if (tokenCount >= largeTokenThreshold || ctx.hasTools) {
      return tierToDecision(
        largeTier,
        ctx.hasTools ? "tool-enabled request" : "large input detected",
      );
    }

    // 3. Default small/fast tier — only when config.smallTier is explicitly
    //    provided. When not configured, return {} (no-op) so callers that did
    //    not opt into a small tier see no surprise provider override.
    if (config?.smallTier !== undefined) {
      return tierToDecision(smallTier, "default small tier");
    }

    // No override — let the caller keep its own provider/model.
    return {};
  };
}
