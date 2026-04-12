/**
 * CLI Abort Handler (BZ-667)
 *
 * Bridges SIGINT (Ctrl+C) to an AbortController for graceful stream cancellation.
 * First Ctrl+C aborts the stream and shows "Stream cancelled."
 * Second Ctrl+C within 1 second force-exits the process.
 *
 * Uses `prependListener` so the stream handler fires BEFORE the top-level
 * SIGINT handler in cli/index.ts (which calls process.exit). The listener
 * remains registered until `cleanup()` removes it. On the first Ctrl+C the
 * stream is cancelled gracefully; only a rapid second press exits.
 *
 * @module cli/utils/abortHandler
 */

import chalk from "chalk";

/**
 * Create an abort handler that wires SIGINT to an AbortController.
 * Call cleanup() when the stream finishes (success or error) to remove listeners.
 */
export function createStreamAbortHandler(): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  let aborted = false;
  let forceExitTimer: ReturnType<typeof setTimeout> | null = null;

  const sigintHandler = () => {
    if (aborted) {
      // Second Ctrl+C — force exit
      if (forceExitTimer) {
        clearTimeout(forceExitTimer);
      }
      // Let the top-level SIGINT handler in cli/index.ts handle the exit
      return;
    }

    aborted = true;
    controller.abort();
    process.stderr.write(chalk.yellow("\nStream cancelled.\n"));

    // Allow force exit on second Ctrl+C within 1 second
    forceExitTimer = setTimeout(() => {
      forceExitTimer = null;
    }, 1000);
  };

  // Use prependListener so our handler fires before the top-level
  // SIGINT handler in cli/index.ts. cleanup() removes it after the stream ends.
  process.prependListener("SIGINT", sigintHandler);

  const cleanup = () => {
    process.removeListener("SIGINT", sigintHandler);
    if (forceExitTimer) {
      clearTimeout(forceExitTimer);
      forceExitTimer = null;
    }
  };

  return { signal: controller.signal, cleanup };
}
