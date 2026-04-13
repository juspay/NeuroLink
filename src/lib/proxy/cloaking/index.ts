/**
 * CloakingPipeline — runs an ordered chain of CloakingPlugin instances
 * against each proxied request (and optionally its response).
 *
 * Usage:
 *   const pipeline = new CloakingPipeline();
 *   pipeline.use(createHeaderScrubber());
 *   pipeline.use(createSessionIdentity());
 *   const ctx = await pipeline.processRequest(ctx);
 *
 * NOTE: The pipeline is currently used for unit testing and is ready for
 * integration into the proxy request flow. Callers should instantiate a
 * CloakingPipeline from ProxyConfigFile.cloaking, register plugins based
 * on the config, and call processRequest/processResponse around the
 * upstream fetch in claudeProxyRoutes.ts / oauthFetch.ts.
 */

import type { CloakingPlugin, CloakingContext } from "../../types/index.js";

export class CloakingPipeline {
  private plugins: CloakingPlugin[] = [];

  /** Register a plugin. Plugins run in `order` field order during processRequest. */
  use(plugin: CloakingPlugin): this {
    this.plugins.push(plugin);
    return this;
  }

  /** Remove a plugin by name. */
  remove(name: string): void {
    this.plugins = this.plugins.filter((p) => p.name !== name);
  }

  /**
   * Run every enabled plugin's `transformRequest` sorted by `order` (ascending).
   *
   * Mode dispatch:
   * - "never": skip all plugins, return context unchanged
   * - "always": always run all enabled plugins
   * - "auto": only run plugins if account.type === "oauth"
   */
  async processRequest(ctx: CloakingContext): Promise<CloakingContext> {
    // Mode dispatch
    if (ctx.config.mode === "never") {
      return ctx;
    }
    if (ctx.config.mode === "auto" && ctx.account.type !== "oauth") {
      return ctx;
    }

    let current = ctx;
    const sorted = [...this.plugins].sort((a, b) => a.order - b.order);
    for (const plugin of sorted) {
      if (!plugin.enabled) {
        continue;
      }
      current = await plugin.transformRequest(current);
    }
    return current;
  }

  /**
   * Run every enabled plugin's `transformResponse` (if defined) in REVERSE order.
   *
   * Mode dispatch follows the same rules as processRequest.
   */
  async processResponse(ctx: CloakingContext): Promise<CloakingContext> {
    // Mode dispatch
    if (ctx.config.mode === "never") {
      return ctx;
    }
    if (ctx.config.mode === "auto" && ctx.account.type !== "oauth") {
      return ctx;
    }

    let current = ctx;
    for (const plugin of [...this.plugins]
      .sort((a, b) => a.order - b.order)
      .reverse()) {
      if (!plugin.enabled || !plugin.transformResponse) {
        continue;
      }
      current = await plugin.transformResponse(current);
    }
    return current;
  }

  /** Return the number of registered plugins. */
  get size(): number {
    return this.plugins.length;
  }

  /** List registered plugin names (useful for diagnostics). */
  get pluginNames(): string[] {
    return this.plugins.map((p) => p.name);
  }
}

// Re-export types for convenience
