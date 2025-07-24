/**
 * NeuroLink Logger Utility
 *
 * Provides conditional logging based on NEUROLINK_DEBUG environment variable
 */

export const logger = {
  debug: (...args: unknown[]) => {
    if (process.env.NEUROLINK_DEBUG === "true") {
      console.log(...args);
    }
  },
  info: (...args: unknown[]) => {
    // Completely disabled for clean CLI demo output
  },
  warn: (...args: unknown[]) => {
    // Completely disabled for clean CLI demo output
  },
  error: (...args: unknown[]) => {
    // Always show errors regardless of debug mode
    console.error(...args);
  },
  always: (...args: unknown[]) => {
    console.log(...args);
  },
};
