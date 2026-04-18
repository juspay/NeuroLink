import type {
  FallbackEntry,
  ModelMapping,
  ProxyRoutingConfig,
  RouteResult,
} from "../types/index.js";

export class ModelRouter {
  private readonly mappings: Map<string, ModelMapping>;
  private readonly passthrough: Set<string>;
  private readonly fallback: FallbackEntry[];

  constructor(config: ProxyRoutingConfig) {
    this.mappings = new Map(config.modelMappings.map((m) => [m.from, m]));
    this.passthrough = new Set(config.passthroughModels ?? []);
    this.fallback = config.fallbackChain;
  }

  resolve(requestedModel: string): RouteResult {
    const mapping = this.mappings.get(requestedModel);
    if (mapping) {
      return { provider: mapping.provider, model: mapping.to };
    }
    if (this.passthrough.has(requestedModel)) {
      return { provider: "anthropic", model: requestedModel };
    }
    if (requestedModel.startsWith("gemini-")) {
      return { provider: "vertex", model: requestedModel };
    }
    if (requestedModel.startsWith("claude-")) {
      return { provider: "anthropic", model: requestedModel };
    }
    return { provider: null, model: requestedModel };
  }

  isClaudeTarget(requestedModel: string): boolean {
    return this.resolve(requestedModel).provider === "anthropic";
  }

  getFallbackChain(): FallbackEntry[] {
    return this.fallback;
  }

  /** Return the raw model mapping entries (used by /v1/models). */
  getModelMappings(): ModelMapping[] {
    return Array.from(this.mappings.values());
  }

  /** Return models configured for passthrough (used by /v1/models). */
  getPassthroughModels(): string[] {
    return Array.from(this.passthrough);
  }
}
