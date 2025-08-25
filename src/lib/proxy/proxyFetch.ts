/**
 * Proxy-aware fetch implementation for AI SDK providers
 * Implements the proven Vercel AI SDK proxy pattern using undici
 */

import { logger } from "../utils/logger.js";

/**
 * Create a proxy-aware fetch function
 * This implements the community-validated approach for Vercel AI SDK
 */
export function createProxyFetch(): typeof fetch {
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;

  // EXHAUSTIVE LOGGING: Capture ALL proxy-related environment variables BEFORE configuration
  logger.debug("[Proxy Fetch] 🔍 EXHAUSTIVE_PROXY_ENV_BEFORE", {
    // Original proxy config function calls
    proxyHostFunction: "getProxyHost equivalent",
    proxyPortFunction: "getProxyPort equivalent",

    // Raw environment variables BEFORE any changes
    originalHttpProxy: process.env.HTTP_PROXY || "NOT_SET",
    originalHttpsProxy: process.env.HTTPS_PROXY || "NOT_SET",
    originalAllProxy: process.env.ALL_PROXY || "NOT_SET",
    originalNoProxy: process.env.NO_PROXY || "NOT_SET",

    // Node.js specific proxy variables
    originalNodejsHttpProxy: process.env.nodejs_http_proxy || "NOT_SET",
    originalNodejsHttpsProxy: process.env.nodejs_https_proxy || "NOT_SET",

    // All potential proxy-related environment variables
    allProxyRelatedEnvVars: Object.keys(process.env)
      .filter((key) => key.toLowerCase().includes("proxy"))
      .reduce(
        (acc, key) => {
          acc[key] = process.env[key] || "NOT_SET";
          return acc;
        },
        {} as Record<string, string>,
      ),

    message: "EXHAUSTIVE proxy environment capture BEFORE configuration",
  });

  // If no proxy configured, return standard fetch
  if (!httpsProxy && !httpProxy) {
    logger.debug(
      "[Proxy Fetch] No proxy environment variables found - using standard fetch",
    );
    return fetch;
  }

  logger.debug(`[Proxy Fetch] Configuring proxy with undici ProxyAgent`);
  logger.debug(`[Proxy Fetch] HTTP_PROXY: ${httpProxy || "not set"}`);
  logger.debug(`[Proxy Fetch] HTTPS_PROXY: ${httpsProxy || "not set"}`);

  // Return proxy-aware fetch function
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.debug(`[Proxy Fetch] 🚀 EXHAUSTIVE REQUEST START`, {
      requestId,
      input:
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : ((input as unknown as Record<string, unknown>).url as string),
      timestamp: new Date().toISOString(),
      httpProxy: httpProxy || "NOT_SET",
      httpsProxy: httpsProxy || "NOT_SET",
      initHeaders: init?.headers || "NO_HEADERS",
      initMethod: init?.method || "GET",
    });

    try {
      // Dynamic import undici to avoid build issues
      const undici = await import("undici");
      const { ProxyAgent } = undici;

      logger.debug(`[Proxy Fetch] 🔧 EXHAUSTIVE UNDICI IMPORT SUCCESS`, {
        requestId,
        hasUndici: !!undici,
        hasProxyAgent: !!ProxyAgent,
        undiciType: typeof undici,
        proxyAgentType: typeof ProxyAgent,
        timestamp: new Date().toISOString(),
      });

      const url =
        typeof input === "string"
          ? new URL(input)
          : input instanceof URL
            ? input
            : new URL(
                (input as unknown as Record<string, unknown>).url as string,
              );
      const proxyUrl = url.protocol === "https:" ? httpsProxy : httpProxy;

      logger.debug(`[Proxy Fetch] 🔗 EXHAUSTIVE URL ANALYSIS`, {
        requestId,
        urlString: url.href,
        urlHostname: url.hostname,
        urlProtocol: url.protocol,
        urlPort: url.port,
        urlPathname: url.pathname,
        selectedProxyUrl: proxyUrl,
        timestamp: new Date().toISOString(),
      });

      if (proxyUrl) {
        logger.debug(
          `[Proxy Fetch] Creating ProxyAgent for ${url.hostname} via ${proxyUrl}`,
        );

        logger.debug(`[Proxy Fetch] 🎯 EXHAUSTIVE PROXY AGENT CREATION`, {
          requestId,
          proxyUrl,
          targetHostname: url.hostname,
          targetProtocol: url.protocol,
          aboutToCreateProxyAgent: true,
          timestamp: new Date().toISOString(),
        });

        // Create ProxyAgent
        const dispatcher = new ProxyAgent(proxyUrl);

        logger.debug(`[Proxy Fetch] ✅ EXHAUSTIVE PROXY AGENT CREATED`, {
          requestId,
          hasDispatcher: !!dispatcher,
          dispatcherType: typeof dispatcher,
          dispatcherConstructor: dispatcher?.constructor?.name || "unknown",
          timestamp: new Date().toISOString(),
        });

        logger.debug(`[Proxy Fetch] 🌐 EXHAUSTIVE UNDICI FETCH CALL`, {
          requestId,
          aboutToCallUndici: true,
          inputType: typeof input,
          hasInit: !!init,
          hasDispatcher: !!dispatcher,
          timestamp: new Date().toISOString(),
        });

        // Use undici fetch with dispatcher
        // Handle Request objects by extracting URL and merging properties
        let fetchInput: string | URL;
        let fetchInit = { ...init };

        if (input instanceof Request) {
          fetchInput = input.url;
          // Merge Request properties into init
          fetchInit = {
            method: input.method,
            headers: input.headers,
            body: input.body,
            ...init, // Allow init to override Request properties
          };
        } else {
          fetchInput = input;
        }

        const response = await undici.fetch(fetchInput, {
          ...fetchInit,
          dispatcher: dispatcher,
        } as unknown as import("undici").RequestInit);

        logger.debug(`[Proxy Fetch] 🎉 EXHAUSTIVE UNDICI FETCH SUCCESS`, {
          requestId,
          hasResponse: !!response,
          responseStatus: response?.status,
          responseStatusText: response?.statusText,
          responseHeaders: response?.headers
            ? Object.fromEntries(response.headers.entries())
            : "NO_HEADERS",
          responseOk: response?.ok,
          responseType: response?.type,
          responseUrl: response?.url,
          timestamp: new Date().toISOString(),
        });

        logger.debug(
          `[Proxy Fetch] ✅ Request proxied successfully to ${url.hostname}`,
        );
        return response as unknown as Response; // undici.fetch returns compatible Response type
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.debug(`[Proxy Fetch] 💥 EXHAUSTIVE ERROR ANALYSIS`, {
        requestId,
        error: errorMessage,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : undefined,
        errorCode: (error as Record<string, unknown>)?.code || "NO_CODE",
        errorSyscall:
          (error as Record<string, unknown>)?.syscall || "NO_SYSCALL",
        errorAddress:
          (error as Record<string, unknown>)?.address || "NO_ADDRESS",
        errorPort: (error as Record<string, unknown>)?.port || "NO_PORT",
        timestamp: new Date().toISOString(),
      });

      logger.warn(
        `[Proxy Fetch] Proxy failed (${errorMessage}), falling back to direct connection`,
      );
    }

    // Fallback to standard fetch
    logger.debug(`[Proxy Fetch] 🔄 EXHAUSTIVE FALLBACK TO STANDARD FETCH`, {
      requestId,
      fallbackReason: "Either no proxy URL or error occurred",
      timestamp: new Date().toISOString(),
    });

    return fetch(input, init);
  };
}

/**
 * Get proxy status information
 */
export function getProxyStatus() {
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const noProxy = process.env.NO_PROXY || process.env.no_proxy;

  return {
    enabled: !!(httpsProxy || httpProxy),
    httpProxy: httpProxy || null,
    httpsProxy: httpsProxy || null,
    noProxy: noProxy || null,
    method: "undici-proxy-agent",
  };
}
