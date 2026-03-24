/**
 * Promise-based async mutex for serializing concurrent async operations.
 * No external dependencies — uses a simple FIFO queue of pending resolvers.
 */
export class AsyncMutex {
  /** Default timeout for lock-held operations: 30 seconds */
  private static readonly DEFAULT_TIMEOUT_MS = 30_000;

  private _locked = false;
  private _queue: Array<() => void> = [];

  isLocked(): boolean {
    return this._locked;
  }

  async runExclusive<T>(
    fn: () => Promise<T>,
    timeoutMs: number = AsyncMutex.DEFAULT_TIMEOUT_MS,
  ): Promise<T> {
    await this._acquire();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Store fn()'s promise so we can ensure it settles before releasing the lock,
    // even when the timeout fires first.
    const fnPromise = fn();
    try {
      return await Promise.race([
        fnPromise,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  `AsyncMutex: lock-held operation timed out after ${timeoutMs}ms`,
                ),
              ),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      // Wait for fn() to settle before releasing the lock.
      // If the timeout fired, fn() may still be running — we must not
      // let another caller acquire the lock until fn() completes.
      await fnPromise.catch((_settleErr) => {
        // Intentionally swallowed — we only await settlement to keep
        // the lock held until fn() finishes. The caller already received
        // the timeout rejection from Promise.race above.
      });
      this._release();
    }
  }

  private _acquire(): Promise<void> {
    if (!this._locked) {
      this._locked = true;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this._queue.push(resolve);
    });
  }

  private _release(): void {
    const next = this._queue.shift();
    if (next) {
      next();
    } else {
      this._locked = false;
    }
  }
}
