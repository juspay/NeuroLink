/**
 * FFmpeg wrapper types for child_process-based execution
 * Provides type definitions for ffmpeg command execution and results
 *
 * SUPPORTED OPERATIONS:
 * 1. convertVideo() - Convert video files between formats with codec/quality control
 *    Use cases: Format conversion, quality optimization, codec transcoding
 *
 * 2. extractAudio() - Extract audio tracks from video files
 *    Use cases: Audio extraction, format conversion, podcast/music extraction
 *
 * 3. extractThumbnail() - Generate thumbnail images from video frames
 *    Use cases: Video previews, poster generation, timeline scrubbing
 *
 * 4. trimVideo() - Cut/trim video segments
 *    Use cases: Clip creation, segment extraction, highlight reels
 */

import { VideoCodecEnum, AudioCodecEnum } from "../constants/enums.js";

// ============================================================================
// FFMPEG TYPES - Type definitions for FFmpeg operations
// ============================================================================

/**
 * FFmpeg encoding presets (official FFmpeg x264/x265 presets)
 * Source: FFmpeg libx264 documentation
 * Trade-off: Speed vs Compression
 */
export type FFmpegPreset =
  | "ULTRAFAST"
  | "SUPERFAST"
  | "VERYFAST"
  | "FASTER"
  | "FAST"
  | "MEDIUM"
  | "SLOW"
  | "SLOWER"
  | "VERYSLOW";

/**
 * Supported video output formats
 * Each format has default codecs defined in FFmpegWrapper
 */
export type VideoFormat = "MP4" | "WEBM" | "MKV" | "AVI" | "MOV";

/**
 * Supported audio output formats
 * Each format has a specific codec defined in FFmpegWrapper
 */
export type AudioFormat = "MP3" | "AAC" | "WAV" | "FLAC" | "OGG";

/**
 * Video codec type derived from VideoCodecEnum
 */
export type VideoCodec = keyof typeof VideoCodecEnum;

/**
 * Audio codec type derived from AudioCodecEnum
 */
export type AudioCodec = keyof typeof AudioCodecEnum;

/**
 * Stream codec type for ffprobe output
 */
export type StreamCodecType = "VIDEO" | "AUDIO" | "SUBTITLE" | "DATA";

// ============================================================================
// TIME TYPES - Standardized time representation
// ============================================================================

/**
 * Time in seconds (always a number for consistency)
 * Standardized across all operations to avoid number | string ambiguity
 */
export type TimeInSeconds = number;

// ============================================================================
// RESOLUTION TYPES - Standardized resolution representation
// ============================================================================

/**
 * Video/Image resolution with width and height in pixels
 * Both width and height are required for explicit dimension specification
 */
export type Resolution = {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
};

// ============================================================================
// BASE TYPES - Reusable base configurations
// ============================================================================

/**
 * Base options for all FFmpeg operations
 */
export type FFmpegBaseOptions = {
  /** Working directory for the command */
  cwd?: string;
  /**
   * Timeout in milliseconds.
   * Default: dynamically calculated based on operation and file size.
   * For high-level operations, timeout is estimated based on media duration.
   * Set to 0 to disable timeout (not recommended).
   */
  timeout?: number;
  /** Additional environment variables */
  env?: Record<string, string>;
  /** Maximum buffer size for stdout/stderr in bytes (default: 50MB) */
  maxBuffer?: number;
};

/**
 * Options for FFmpeg command execution (alias for backward compatibility)
 */
export type FFmpegOptions = FFmpegBaseOptions;

/**
 * Video quality settings (shared across operations)
 */
export type VideoQualitySettings = {
  /** Video bitrate (e.g., '1M', '2500k') - optional, can use quality/CRF instead */
  videoBitrate?: string;
  /** CRF quality (0-51, lower = better quality, default: 23) - recommended over bitrate */
  quality?: number;
  /** Encoding preset (speed vs compression trade-off) */
  preset?: FFmpegPreset;
};

/**
 * Audio quality settings (shared across operations)
 */
export type AudioQualitySettings = {
  /** Audio bitrate (e.g., '128k', '192k', '320k') */
  bitrate?: string;
  /** Sample rate in Hz (e.g., 44100, 48000) */
  sampleRate?: number;
  /** Number of audio channels (1 = mono, 2 = stereo) */
  channels?: number;
};

/**
 * Video dimension settings
 */
export type VideoDimensions = {
  /** Output resolution with width and height in pixels */
  resolution?: Resolution;
  /** Frame rate (e.g., 30, 60) */
  frameRate?: number;
};

// ============================================================================
// OPERATION-SPECIFIC TYPES - Extending base types
// ============================================================================

/**
 * Options for video conversion operations
 * Extends base quality and dimension settings
 */
export type VideoConvertOptions = VideoQualitySettings &
  AudioQualitySettings &
  VideoDimensions & {
    /** Video codec (default: based on output format) */
    videoCodec?: VideoCodec;
    /** Audio codec (default: based on output format) */
    audioCodec?: AudioCodec;
    /** Base execution options */
    baseOptions?: FFmpegBaseOptions;
  };

/**
 * Options for audio extraction
 * Extends audio quality settings
 */
export type AudioExtractOptions = AudioQualitySettings & {
  /** Audio format (default: MP3) */
  format?: AudioFormat;
  /** Base execution options */
  baseOptions?: FFmpegBaseOptions;
};

/**
 * Options for thumbnail extraction
 */
export type ThumbnailOptions = {
  /** Time position in seconds (standardized to number only) */
  time?: TimeInSeconds;
  /** Output resolution (optional, can specify resolution or use default) */
  resolution?: Resolution;
  /** Image quality for JPEG (1-31, lower = better) */
  quality?: number;
  /** Base execution options */
  baseOptions?: FFmpegBaseOptions;
};

/**
 * Options for video trimming
 */
export type TrimOptions = {
  /** Start time in seconds (standardized to number only) */
  startTime: TimeInSeconds;
  /** End time in seconds (optional, use duration if not specified) */
  endTime?: TimeInSeconds;
  /** Duration in seconds (alternative to endTime) */
  duration?: TimeInSeconds;
  /** Re-encode the output (default: false for fast copy) */
  reencode?: boolean;
  /** Base execution options */
  baseOptions?: FFmpegBaseOptions;
};

// ============================================================================
// RESULT TYPES - Execution results and errors
// ============================================================================

/**
 * Result of an FFmpeg command execution
 */
export type FFmpegResult = {
  /** Exit code of the process (0 = success) */
  exitCode: number;
  /** Standard output from ffmpeg */
  stdout: string;
  /** Standard error from ffmpeg (ffmpeg outputs progress here) */
  stderr: string;
  /** Whether the command succeeded (exitCode === 0) */
  success: boolean;
  /** Duration of the command execution in milliseconds */
  durationMs: number;
};

/**
 * Error thrown when FFmpeg execution fails
 */
export type FFmpegError = {
  /** Error message */
  message: string;
  /** Exit code if available */
  exitCode?: number;
  /** Standard output if available */
  stdout?: string;
  /** Standard error if available */
  stderr?: string;
  /** Signal that terminated the process if any */
  signal?: string;
};

// ============================================================================
// PROBE TYPES - Media analysis and metadata
// ============================================================================

/**
 * Format information from ffprobe
 */
export type FFprobeFormat = {
  /** File name */
  filename?: string;
  /** Duration in seconds */
  duration?: number;
  /** File size in bytes */
  size?: number;
  /** Bit rate in bits per second */
  bitRate?: number;
  /** Short format name (e.g., "mov,mp4,m4a,3gp,3g2,mj2") */
  formatName?: string;
  /** Long format name (e.g., "QuickTime / MOV") */
  formatLongName?: string;
};

/**
 * Stream information from ffprobe
 */
export type FFprobeStream = {
  /** Stream index */
  index: number;
  /** Codec name (e.g., "h264", "aac") */
  codecName?: string;
  /** Codec type */
  codecType?: StreamCodecType;
  /** Video/image resolution with width and height */
  resolution?: Resolution;
  /** Stream duration in seconds */
  duration?: number;
  /** Bit rate in bits per second */
  bitRate?: number;
  /** Frame rate (e.g., "30/1", "24000/1001") */
  frameRate?: string;
  /** Audio sample rate in Hz */
  sampleRate?: number;
  /** Number of audio channels */
  channels?: number;
};

/**
 * FFmpeg probe information (from ffprobe)
 * Contains format and stream metadata
 */
export type FFprobeResult = {
  /** Format information */
  format?: FFprobeFormat;
  /** Stream information array */
  streams?: FFprobeStream[];
};

/**
 * FFmpeg version information
 */
export type FFmpegVersion = {
  /** Version string (e.g., "6.0") */
  version: string;
  /** Full version output */
  fullOutput: string;
};
