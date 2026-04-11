/**
 * Typewriter animation for CLI streaming output.
 * Writes text character-by-character with a configurable delay.
 * @module cli/utils/typewriter
 */

const DEFAULT_CHAR_DELAY_MS = 8;

/**
 * Write text to stdout with a per-character typewriter animation.
 * Falls back to raw write when delay is 0 or negative.
 */
export async function typewriterWrite(
  text: string,
  delayMs: number = DEFAULT_CHAR_DELAY_MS,
): Promise<void> {
  if (!text) {
    return;
  }
  if (delayMs <= 0) {
    process.stdout.write(text);
    return;
  }
  // Use Array.from to handle surrogate pairs / emoji correctly
  for (const ch of Array.from(text)) {
    process.stdout.write(ch);
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

/** Whether typewriter animation should be used for the current process. */
export function shouldAnimate(): boolean {
  return Boolean(process.stdout.isTTY);
}

/**
 * Write text to stdout with animation when stdout is a TTY, otherwise
 * fall back to a raw write. Use this from CLI streaming code paths to
 * keep the behaviour consistent in one place.
 */
export async function animatedWrite(text: string): Promise<void> {
  if (shouldAnimate()) {
    await typewriterWrite(text);
  } else {
    process.stdout.write(text);
  }
}
