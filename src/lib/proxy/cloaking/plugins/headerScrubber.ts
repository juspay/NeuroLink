/**
 * HeaderScrubber — strips headers that could reveal the presence of a proxy.
 *
 * Removes forwarding headers (x-forwarded-for, via, x-real-ip, etc.) and any
 * custom proxy-fingerprint headers, while preserving legitimate request
 * headers like content-type and authorization.
 */

import type {
  CloakingPlugin,
  CloakingContext,
  HeaderScrubberOptions,
} from "../../../types/index.js";

/** Exact-match headers to strip (all lower-cased). */
const STRIP_HEADERS_EXACT: ReadonlySet<string> = new Set([
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-server",
  "x-forwarded-proto",
  "x-real-ip",
  "x-client-ip",
  "true-client-ip",
  "cf-connecting-ip",
  "fastly-client-ip",
  "x-cluster-client-ip",
  "forwarded",
  "via",
  "sec-ch-ua",
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
  "priority",
  "referer",
  "accept-encoding",
  "x-title",
  "content-length",
  "connection",
  "transfer-encoding",
  "keep-alive",
  "te",
  "trailer",
  "upgrade",
  "host",
]);

/** Prefix-match patterns to strip (all lower-cased). */
const STRIP_HEADERS_PREFIX: readonly string[] = [
  "sec-ch-ua-",
  "x-stainless-",
  "x-forwarded-",
  "proxy-",
];

/** Check whether a lower-cased header name should be stripped. */
function shouldStrip(lower: string, extraSet: ReadonlySet<string>): boolean {
  if (STRIP_HEADERS_EXACT.has(lower)) {
    return true;
  }
  if (extraSet.has(lower)) {
    return true;
  }
  for (const prefix of STRIP_HEADERS_PREFIX) {
    if (lower.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

export function createHeaderScrubber(
  options: HeaderScrubberOptions = {},
): CloakingPlugin {
  const extraSet = new Set(
    (options.extraHeaders ?? []).map((h) => h.toLowerCase()),
  );

  return {
    name: "header-scrubber",
    order: 10,
    enabled: true,

    async transformRequest(ctx: CloakingContext): Promise<CloakingContext> {
      const cleaned: Record<string, string | undefined> = {};

      for (const [key, value] of Object.entries(ctx.request.headers)) {
        const lower = key.toLowerCase();
        if (shouldStrip(lower, extraSet)) {
          continue; // strip
        }
        cleaned[key] = value;
      }

      return {
        ...ctx,
        request: {
          ...ctx.request,
          headers: cleaned,
        },
      };
    },
  };
}
