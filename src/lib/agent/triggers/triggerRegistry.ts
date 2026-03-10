import type { TriggerAdapter } from "./triggerAdapter.js";
import { TimerTrigger, type TimerTriggerConfig } from "./timerTrigger.js";

export type TriggerAdapterFactory = (config: unknown) => TriggerAdapter;

/**
 * TriggerRegistry — follows the NeuroLink Factory + Registry pattern
 * (ProviderRegistry, ChunkerRegistry, RerankerRegistry, ProcessorRegistry).
 *
 * Users register custom triggers the same way they register custom providers.
 */
export class TriggerRegistry {
  private static readonly _adapters = new Map<string, TriggerAdapterFactory>();

  /** Register a new trigger type */
  static register(type: string, factory: TriggerAdapterFactory): void {
    this._adapters.set(type, factory);
  }

  /** Create a trigger adapter by type */
  static create(type: string, config: unknown): TriggerAdapter {
    const factory = this._adapters.get(type);
    if (!factory) {
      const available = [...this._adapters.keys()].join(", ");
      throw new Error(
        `Unknown trigger type: "${type}". Available: ${available || "none"}`,
      );
    }
    return factory(config);
  }

  /** List available trigger types */
  static available(): string[] {
    return [...this._adapters.keys()];
  }
}

// ─── Built-in registrations ──────────────────────────────────────────────────

TriggerRegistry.register(
  "timer",
  (config) => new TimerTrigger(config as TimerTriggerConfig),
);
