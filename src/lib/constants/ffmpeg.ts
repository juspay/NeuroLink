/**
 * FFmpeg constants and common configuration values
 */

import type { Resolution } from "../types/ffmpegTypes.js";

/**
 * Common video resolutions
 * Provides pre-defined resolution objects for standard video formats
 */
export const CommonResolutions: Record<string, Resolution> = {
  /** 8K Ultra HD - 7680x4320 */
  UHD_8K: { width: 7680, height: 4320 },
  /** 4K Ultra HD - 3840x2160 */
  UHD_4K: { width: 3840, height: 2160 },
  /** Quad HD - 2560x1440 */
  QHD: { width: 2560, height: 1440 },
  /** Full HD 1080p - 1920x1080 */
  FHD: { width: 1920, height: 1080 },
  /** HD 720p - 1280x720 */
  HD: { width: 1280, height: 720 },
  /** Standard Definition - 854x480 */
  SD: { width: 854, height: 480 },
  /** VGA - 640x480 */
  VGA: { width: 640, height: 480 },
} as const;
