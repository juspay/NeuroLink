/**
 * FFmpeg types for child_process-based execution
 * Operations: convertVideo, extractAudio, extractThumbnail, trimVideo
 */

import { VideoCodecEnum, AudioCodecEnum } from "../constants/enums.js";

/** FFmpeg encoding presets (speed vs compression: ULTRAFAST=fast/large, VERYSLOW=slow/small) */
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

export type VideoFormat = "MP4" | "WEBM" | "MKV" | "AVI" | "MOV";
export type AudioFormat = "MP3" | "AAC" | "WAV" | "FLAC" | "OGG";
export type VideoCodec = keyof typeof VideoCodecEnum;
export type AudioCodec = keyof typeof AudioCodecEnum;
export type StreamCodecType = "VIDEO" | "AUDIO" | "SUBTITLE" | "DATA";

/** Time in seconds */
export type TimeInSeconds = number;

/** Video/image resolution in pixels */
export type Resolution = {
  width: number;
  height: number;
};

/** Base FFmpeg execution options */
export type FFmpegBaseOptions = {
  cwd?: string;
  /** Timeout in ms (default: auto-calculated, 0=disabled) */
  timeout?: number;
  env?: Record<string, string>;
  /** Max stdout/stderr buffer in bytes (default: 50MB) */
  maxBuffer?: number;
};

export type FFmpegOptions = FFmpegBaseOptions;

/** Video quality settings */
export type VideoQualitySettings = {
  /** Video bitrate e.g. '1M', '2500k' (use quality/CRF instead if possible) */
  videoBitrate?: string;
  /** CRF quality 0-51, lower=better (default: 23) */
  quality?: number;
  preset?: FFmpegPreset;
};

/** Audio quality settings */
export type AudioQualitySettings = {
  /** Audio bitrate e.g. '128k', '192k' */
  bitrate?: string;
  /** Sample rate in Hz e.g. 44100, 48000 */
  sampleRate?: number;
  /** Channels: 1=mono, 2=stereo */
  channels?: number;
};

/** Video dimension settings */
export type VideoDimensions = {
  resolution?: Resolution;
  /** Frame rate e.g. 30, 60 */
  frameRate?: number;
};

/** Options for video conversion (format/codec/quality) */
export type VideoConvertOptions = VideoQualitySettings &
  AudioQualitySettings &
  VideoDimensions & {
    videoCodec?: VideoCodec;
    audioCodec?: AudioCodec;
    baseOptions?: FFmpegBaseOptions;
  };

/** Options for audio extraction from video */
export type AudioExtractOptions = AudioQualitySettings & {
  format?: AudioFormat;
  baseOptions?: FFmpegBaseOptions;
};

/** Options for thumbnail extraction */
export type ThumbnailOptions = {
  time?: TimeInSeconds;
  resolution?: Resolution;
  /** JPEG quality 1-31, lower=better */
  quality?: number;
  baseOptions?: FFmpegBaseOptions;
};

/** Options for video trimming/clipping */
export type TrimOptions = {
  startTime: TimeInSeconds;
  endTime?: TimeInSeconds;
  /** Alternative to endTime */
  duration?: TimeInSeconds;
  /** Re-encode output (default: false for fast copy) */
  reencode?: boolean;
  baseOptions?: FFmpegBaseOptions;
};

/** FFmpeg command execution result */
export type FFmpegResult = {
  exitCode: number;
  stdout: string;
  /** FFmpeg outputs progress to stderr */
  stderr: string;
  success: boolean;
  durationMs: number;
};

/** FFmpeg execution error */
export type FFmpegError = {
  message: string;
  exitCode?: number | null;
  stdout?: string | null;
  stderr?: string | null;
  signal?: string | null;
};

/** Format metadata from ffprobe */
export type FFprobeFormat = {
  filename?: string | null;
  duration?: number | null;
  size?: number | null;
  bitRate?: number | null;
  formatName?: string | null;
  formatLongName?: string | null;
};

/** Stream metadata from ffprobe */
export type FFprobeStream = {
  index: number;
  codecName?: string | null;
  codecType?: StreamCodecType | null;
  resolution?: Resolution | null;
  duration?: number | null;
  bitRate?: number | null;
  frameRate?: string | null;
  sampleRate?: number | null;
  channels?: number | null;
};

/** Media probe result from ffprobe */
export type FFprobeResult = {
  format?: FFprobeFormat | null;
  streams?: FFprobeStream[] | null;
};

/** FFmpeg version info */
export type FFmpegVersion = {
  version: string;
  fullOutput: string;
};
