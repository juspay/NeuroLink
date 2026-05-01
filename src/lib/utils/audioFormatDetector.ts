/**
 * Shared utility: infer a `TTSAudioFormat` from a file path.
 *
 * Used by the CLI generate/stream handlers (m2) to set `stt.format` so
 * `STTProcessor.transcribe()` can fail fast on incompatible provider/format
 * combinations (e.g. MP3 to azure-stt). Pulled into a single helper to
 * avoid duplicating the 11-element format list across two CLI handlers.
 */

import type { TTSAudioFormat } from "../types/index.js";

const VALID_FORMATS: ReadonlyArray<TTSAudioFormat> = [
  "mp3",
  "wav",
  "ogg",
  "opus",
  "m4a",
  "flac",
  "webm",
  "mp4",
  "mpeg",
  "mpga",
  "pcm16",
];

/**
 * Returns the `TTSAudioFormat` that matches the file extension of `path`,
 * or `undefined` when the path is missing or its extension isn't a known
 * audio format. The check is case-insensitive.
 */
export function inferAudioFormatFromPath(
  path: string | undefined,
): TTSAudioFormat | undefined {
  if (!path) {
    return undefined;
  }
  const ext = path.toLowerCase().split(".").pop() as TTSAudioFormat | undefined;
  return ext && VALID_FORMATS.includes(ext) ? ext : undefined;
}
