import type { TriggerAdapter } from "./triggerAdapter.js";

export type TimerTriggerConfig = {
  /** Interval between iterations in ms. 0 = run as fast as possible (back-to-back). */
  intervalMs?: number;
  /** Initial delay before first tick */
  initialDelayMs?: number;
};

/**
 * v1 Node.js timer-based trigger.
 * - intervalMs === 0 → back-to-back iterations via setImmediate
 * - intervalMs > 0  → fixed interval between iteration completions
 */
export class TimerTrigger implements TriggerAdapter {
  readonly type = "timer";

  private _active = false;
  private _timer?: ReturnType<typeof setTimeout>;
  private _storedOnTick?: () => Promise<void>;
  private _resolveStop?: () => void;

  constructor(private readonly config: TimerTriggerConfig = {}) {}

  async start(onTick: () => Promise<void>): Promise<void> {
    this._active = true;
    this._storedOnTick = onTick;

    // Return a promise that resolves when stop() is called
    return new Promise<void>((resolve) => {
      this._resolveStop = resolve;
      void this._scheduleFirst(onTick);
    });
  }

  private async _scheduleFirst(onTick: () => Promise<void>): Promise<void> {
    if (this.config.initialDelayMs && this.config.initialDelayMs > 0) {
      await new Promise<void>((r) => setTimeout(r, this.config.initialDelayMs));
    }
    await this._tick(onTick);
  }

  private async _tick(onTick: () => Promise<void>): Promise<void> {
    if (!this._active) {
      this._resolveStop?.();
      return;
    }

    await onTick();

    if (!this._active) {
      this._resolveStop?.();
      return;
    }

    const interval = this.config.intervalMs ?? 0;
    if (interval > 0) {
      this._timer = setTimeout(() => {
        void this._tick(onTick);
      }, interval);
    } else {
      // Back-to-back: use setImmediate to avoid starving the event loop
      setImmediate(() => {
        void this._tick(onTick);
      });
    }
  }

  async stop(): Promise<void> {
    this._active = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
    // Resolve the start() promise if it's still pending
    this._resolveStop?.();
  }

  isActive(): boolean {
    return this._active;
  }

  pause(): void {
    this._active = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
  }

  /**
   * Resume after pause. Re-starts the tick loop with the stored onTick callback.
   * FIX: The design doc had resume() as a no-op stub — this is the correct implementation.
   */
  resume(): void {
    if (this._storedOnTick && !this._active) {
      this._active = true;
      void this._tick(this._storedOnTick);
    }
  }
}
