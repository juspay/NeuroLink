/**
 * FFmpeg wrapper using Node.js child_process
 *
 * Provides a clean abstraction layer for executing ffmpeg commands
 * without relying on deprecated third-party packages like fluent-ffmpeg.
 *
 * Features:
 * - High-level methods for common operations (convert, extractAudio, thumbnail, trim)
 * - Dynamic timeout estimation based on media duration and operation type
 * - Direct child_process.spawn execution for better control
 * - Graceful error handling with detailed error information
 * - Returns stdout, stderr, and exit code
 * - Optional ffprobe support for media analysis
 *
 * Design Philosophy:
 * This wrapper provides two API levels:
 * 1. High-level methods (recommended): Safe, validated operations like convertVideo(),
 *    extractAudio(), extractThumbnail(), trimVideo() - ideal for LLM/MCP integration
 * 2. Low-level methods: run() and exec() for advanced users who need full control
 */

import { spawn } from "child_process";
import type {
  FFmpegOptions,
  FFmpegResult,
  FFmpegVersion,
  FFprobeResult,
  VideoConvertOptions,
  AudioExtractOptions,
  ThumbnailOptions,
  TrimOptions,
  Resolution,
  FFmpegPreset,
  VideoCodec,
  AudioCodec,
  AudioFormat,
  StreamCodecType,
} from "../types/ffmpegTypes.js";
import { VideoCodecEnum, AudioCodecEnum } from "../constants/enums.js";
import { logger } from "./logger.js";

/** Default timeout for simple ffmpeg commands (30 seconds) */
const DEFAULT_SIMPLE_TIMEOUT_MS = 30 * 1000;

/** Timeout multiplier per second of media duration (3x real-time for encoding) */
const TIMEOUT_MULTIPLIER_PER_SECOND = 3000;

/** Minimum timeout for any operation (30 seconds) */
const MIN_TIMEOUT_MS = 30 * 1000;

/** Maximum timeout for any operation (2 hours) */
const MAX_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/** Default max buffer size (50MB) */
const DEFAULT_MAX_BUFFER = 50 * 1024 * 1024;

// ============================================================================
// PRESET TO FFMPEG VALUE MAPPINGS
// ============================================================================

/**
 * Map FFmpeg preset type to actual FFmpeg command value
 */
const PRESET_TO_FFMPEG: Record<FFmpegPreset, string> = {
  ULTRAFAST: "ultrafast",
  SUPERFAST: "superfast",
  VERYFAST: "veryfast",
  FASTER: "faster",
  FAST: "fast",
  MEDIUM: "medium",
  SLOW: "slow",
  SLOWER: "slower",
  VERYSLOW: "veryslow",
};

/**
 * Map AudioFormat type to FFmpeg codec
 */
const AUDIO_FORMAT_TO_CODEC: Record<AudioFormat, string> = {
  MP3: "libmp3lame",
  AAC: "aac",
  WAV: "pcm_s16le",
  FLAC: "flac",
  OGG: "libvorbis",
};

/**
 * Map StreamCodecType to lowercase for ffprobe output
 */
const STREAM_CODEC_TYPE_TO_LOWERCASE: Record<StreamCodecType, string> = {
  VIDEO: "video",
  AUDIO: "audio",
  SUBTITLE: "subtitle",
  DATA: "data",
};

/**
 * Map lowercase codec type from ffprobe to type
 */
const LOWERCASE_TO_STREAM_CODEC_TYPE: Record<string, StreamCodecType> = {
  video: "VIDEO",
  audio: "AUDIO",
  subtitle: "SUBTITLE",
  data: "DATA",
};

/**
 * FFmpeg wrapper class for executing ffmpeg commands via child_process
 *
 * @example
 * ```typescript
 * import { FFmpegWrapper } from '@juspay/neurolink';
 *
 * // Check if ffmpeg is available
 * const isAvailable = await FFmpegWrapper.isAvailable();
 *
 * // Run a simple command
 * const result = await FFmpegWrapper.run(['-i', 'input.mp4', '-c', 'copy', 'output.mp4']);
 *
 * // Get media information
 * const info = await FFmpegWrapper.probe('video.mp4');
 * ```
 */
export class FFmpegWrapper {
  /** Path to ffmpeg binary (defaults to 'ffmpeg' expecting it in PATH) */
  private static ffmpegPath = "ffmpeg";

  /** Path to ffprobe binary (defaults to 'ffprobe' expecting it in PATH) */
  private static ffprobePath = "ffprobe";

  /**
   * Set custom path to ffmpeg binary
   * @param path - Path to ffmpeg executable
   */
  static setFFmpegPath(path: string): void {
    FFmpegWrapper.ffmpegPath = path;
  }

  /**
   * Set custom path to ffprobe binary
   * @param path - Path to ffprobe executable
   */
  static setFFprobePath(path: string): void {
    FFmpegWrapper.ffprobePath = path;
  }

  /**
   * Check if ffmpeg is available on the system
   * @returns Promise resolving to true if ffmpeg is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const result = await FFmpegWrapper.run(["-version"], { timeout: 10000 });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get ffmpeg version information
   * @returns Promise resolving to version information or null if unavailable
   */
  static async getVersion(): Promise<FFmpegVersion | null> {
    try {
      const result = await FFmpegWrapper.run(["-version"], { timeout: 10000 });
      if (!result.success) {
        return null;
      }

      // Parse version from output (e.g., "ffmpeg version 6.0 ...")
      const versionMatch = result.stdout.match(/ffmpeg version (\S+)/);
      const version = versionMatch ? versionMatch[1] : "unknown";

      return {
        version,
        fullOutput: result.stdout,
      };
    } catch {
      return null;
    }
  }

  /**
   * Execute an ffmpeg command with the given arguments
   *
   * @param args - Array of command-line arguments to pass to ffmpeg
   * @param options - Execution options (timeout, cwd, env, maxBuffer)
   * @returns Promise resolving to the execution result
   *
   * @example
   * ```typescript
   * // Convert video format
   * const result = await FFmpegWrapper.run([
   *   '-i', 'input.mp4',
   *   '-c:v', 'libx264',
   *   '-c:a', 'aac',
   *   'output.mkv'
   * ]);
   *
   * if (result.success) {
   *   console.log('Conversion completed successfully');
   * } else {
   *   console.error('Conversion failed:', result.stderr);
   * }
   * ```
   */
  static async run(
    args: string[],
    options: FFmpegOptions = {},
  ): Promise<FFmpegResult> {
    const startTime = Date.now();
    // Use simple timeout as default for low-level run command
    const timeout = options.timeout ?? DEFAULT_SIMPLE_TIMEOUT_MS;
    const maxBuffer = options.maxBuffer ?? DEFAULT_MAX_BUFFER;

    return new Promise((resolve, reject) => {
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      let stdoutSize = 0;
      let stderrSize = 0;
      let killed = false;

      logger.debug(
        `[FFmpeg] Running command: ${FFmpegWrapper.ffmpegPath} ${args.join(" ")}`,
      );

      const child = spawn(FFmpegWrapper.ffmpegPath, args, {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Timeout handling
      const timeoutId = setTimeout(() => {
        if (!killed) {
          killed = true;
          child.kill("SIGTERM");
          // Give the process a chance to clean up, then force kill
          setTimeout(() => {
            if (!child.killed) {
              child.kill("SIGKILL");
            }
          }, 5000);
        }
      }, timeout);

      child.stdout?.on("data", (chunk: Buffer) => {
        if (stdoutSize + chunk.length <= maxBuffer) {
          stdoutChunks.push(chunk);
          stdoutSize += chunk.length;
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        if (stderrSize + chunk.length <= maxBuffer) {
          stderrChunks.push(chunk);
          stderrSize += chunk.length;
        }
      });

      child.on("error", (error: Error) => {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;

        logger.error(`[FFmpeg] Process error: ${error.message}`);

        reject({
          message: error.message,
          stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
          stderr: Buffer.concat(stderrChunks).toString("utf-8"),
        });
      });

      child.on("close", (exitCode: number | null, signal: string | null) => {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;

        const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
        const stderr = Buffer.concat(stderrChunks).toString("utf-8");

        if (killed) {
          logger.warn(
            `[FFmpeg] Process killed due to timeout after ${durationMs}ms`,
          );
          reject({
            message: `FFmpeg process timed out after ${timeout}ms`,
            exitCode: exitCode ?? undefined,
            stdout,
            stderr,
            signal: signal ?? "SIGTERM",
          });
          return;
        }

        const actualExitCode = exitCode ?? 1;
        const success = actualExitCode === 0;

        logger.debug(
          `[FFmpeg] Command completed with exit code ${actualExitCode} in ${durationMs}ms`,
        );

        resolve({
          exitCode: actualExitCode,
          stdout,
          stderr,
          success,
          durationMs,
        });
      });
    });
  }

  /**
   * Execute an ffprobe command to analyze media files
   *
   * @param inputPath - Path to the media file to analyze
   * @param options - Execution options
   * @returns Promise resolving to the probe result
   *
   * @example
   * ```typescript
   * const info = await FFmpegWrapper.probe('video.mp4');
   * if (info) {
   *   console.log('Duration:', info.format?.duration, 'seconds');
   *   console.log('Streams:', info.streams?.length);
   * }
   * ```
   */
  static async probe(
    inputPath: string,
    options: FFmpegOptions = {},
  ): Promise<FFprobeResult | null> {
    const timeout = options.timeout ?? 30000; // 30 seconds for probe

    return new Promise((resolve, reject) => {
      const args = [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        inputPath,
      ];

      logger.debug(`[FFprobe] Probing file: ${inputPath}`);

      const child = spawn(FFmpegWrapper.ffprobePath, args, {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      let killed = false;

      const timeoutId = setTimeout(() => {
        if (!killed) {
          killed = true;
          child.kill("SIGTERM");
        }
      }, timeout);

      child.stdout?.on("data", (chunk: Buffer) => {
        stdoutChunks.push(chunk);
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        stderrChunks.push(chunk);
      });

      child.on("error", (error: Error) => {
        clearTimeout(timeoutId);
        logger.error(`[FFprobe] Process error: ${error.message}`);
        reject({
          message: error.message,
        });
      });

      child.on("close", (exitCode: number | null) => {
        clearTimeout(timeoutId);

        if (killed) {
          logger.warn("[FFprobe] Process killed due to timeout");
          resolve(null);
          return;
        }

        if (exitCode !== 0) {
          const stderr = Buffer.concat(stderrChunks).toString("utf-8");
          logger.warn(
            `[FFprobe] Process exited with code ${exitCode}: ${stderr}`,
          );
          resolve(null);
          return;
        }

        try {
          const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
          const data = JSON.parse(stdout);

          const result: FFprobeResult = {
            format: data.format
              ? {
                  filename: data.format.filename,
                  duration: data.format.duration
                    ? parseFloat(data.format.duration)
                    : undefined,
                  size: data.format.size
                    ? parseInt(data.format.size, 10)
                    : undefined,
                  bitRate: data.format.bit_rate
                    ? parseInt(data.format.bit_rate, 10)
                    : undefined,
                  formatName: data.format.format_name,
                  formatLongName: data.format.format_long_name,
                }
              : undefined,
            streams: data.streams?.map((stream: Record<string, unknown>) => {
              // Convert codec type to enum
              const codecType = stream.codec_type
                ? LOWERCASE_TO_STREAM_CODEC_TYPE[stream.codec_type as string] ||
                  undefined
                : undefined;

              // Create resolution from width and height if available
              const width = stream.width as number | undefined;
              const height = stream.height as number | undefined;
              const resolution: Resolution | undefined =
                width && height ? { width, height } : undefined;

              return {
                index:
                  typeof stream.index === "number"
                    ? stream.index
                    : parseInt(stream.index as string, 10) || 0,
                codecName: stream.codec_name as string | undefined,
                codecType,
                resolution,
                duration: stream.duration
                  ? parseFloat(stream.duration as string)
                  : undefined,
                bitRate: stream.bit_rate
                  ? parseInt(stream.bit_rate as string, 10)
                  : undefined,
                frameRate: stream.r_frame_rate as string | undefined,
                sampleRate: stream.sample_rate
                  ? parseInt(stream.sample_rate as string, 10)
                  : undefined,
                channels: stream.channels as number | undefined,
              };
            }),
          };

          logger.debug("[FFprobe] Successfully probed file", {
            format: result.format?.formatName,
            streams: result.streams?.length,
          });

          resolve(result);
        } catch (parseError) {
          logger.error("[FFprobe] Failed to parse output:", parseError);
          resolve(null);
        }
      });
    });
  }

  /**
   * Execute a raw command (ffmpeg or ffprobe) with full control
   * This is a lower-level method for advanced use cases
   *
   * @param command - The command to execute ('ffmpeg' or 'ffprobe')
   * @param args - Array of command-line arguments
   * @param options - Execution options
   * @returns Promise resolving to the execution result
   */
  static async exec(
    command: "ffmpeg" | "ffprobe",
    args: string[],
    options: FFmpegOptions = {},
  ): Promise<FFmpegResult> {
    const startTime = Date.now();
    // Use simple timeout as default for low-level exec command
    const timeout = options.timeout ?? DEFAULT_SIMPLE_TIMEOUT_MS;
    const maxBuffer = options.maxBuffer ?? DEFAULT_MAX_BUFFER;
    const binaryPath =
      command === "ffmpeg"
        ? FFmpegWrapper.ffmpegPath
        : FFmpegWrapper.ffprobePath;

    return new Promise((resolve, reject) => {
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      let stdoutSize = 0;
      let stderrSize = 0;
      let killed = false;

      logger.debug(`[${command}] Running: ${binaryPath} ${args.join(" ")}`);

      const child = spawn(binaryPath, args, {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      const timeoutId = setTimeout(() => {
        if (!killed) {
          killed = true;
          child.kill("SIGTERM");
          setTimeout(() => {
            if (!child.killed) {
              child.kill("SIGKILL");
            }
          }, 5000);
        }
      }, timeout);

      child.stdout?.on("data", (chunk: Buffer) => {
        if (stdoutSize + chunk.length <= maxBuffer) {
          stdoutChunks.push(chunk);
          stdoutSize += chunk.length;
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        if (stderrSize + chunk.length <= maxBuffer) {
          stderrChunks.push(chunk);
          stderrSize += chunk.length;
        }
      });

      child.on("error", (error: Error) => {
        clearTimeout(timeoutId);
        reject({
          message: error.message,
          stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
          stderr: Buffer.concat(stderrChunks).toString("utf-8"),
        });
      });

      child.on("close", (exitCode: number | null, signal: string | null) => {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;

        const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
        const stderr = Buffer.concat(stderrChunks).toString("utf-8");

        if (killed) {
          reject({
            message: `Process timed out after ${timeout}ms`,
            exitCode: exitCode ?? undefined,
            stdout,
            stderr,
            signal: signal ?? "SIGTERM",
          });
          return;
        }

        const actualExitCode = exitCode ?? 1;

        resolve({
          exitCode: actualExitCode,
          stdout,
          stderr,
          success: actualExitCode === 0,
          durationMs,
        });
      });
    });
  }

  // ============================================================================
  // HIGH-LEVEL OPERATIONS (Recommended for LLM/MCP integration)
  // ============================================================================

  /**
   * Estimate appropriate timeout based on media duration and operation complexity.
   * This provides dynamic TTL instead of static timeouts.
   *
   * @param durationSeconds - Duration of the media in seconds
   * @param complexityMultiplier - Operation complexity (1 = copy, 2 = transcode, 3 = complex filter)
   * @returns Estimated timeout in milliseconds
   */
  static estimateTimeout(
    durationSeconds: number,
    complexityMultiplier: number = 2,
  ): number {
    // Base calculation: duration * multiplier * complexity
    const estimated =
      durationSeconds * TIMEOUT_MULTIPLIER_PER_SECOND * complexityMultiplier;
    // Clamp between min and max
    return Math.max(MIN_TIMEOUT_MS, Math.min(estimated, MAX_TIMEOUT_MS));
  }

  /**
   * Convert video to a different format.
   * This is a high-level, safe operation with sensible defaults.
   *
   * @param inputPath - Path to input video file
   * @param outputPath - Path for output video file
   * @param options - Conversion options
   * @returns Promise resolving to the execution result
   *
   * @example
   * ```typescript
   * // Convert MP4 to WebM with default settings
   * const result = await FFmpegWrapper.convertVideo('input.mp4', 'output.webm');
   *
   * // Convert with custom settings
   * const result = await FFmpegWrapper.convertVideo('input.mp4', 'output.mp4', {
   *   videoCodec: 'libx264',
   *   quality: 20,
   *   preset: 'fast'
   * });
   * ```
   */
  static async convertVideo(
    inputPath: string,
    outputPath: string,
    options: VideoConvertOptions = {},
  ): Promise<FFmpegResult> {
    // Probe input to get duration for dynamic timeout
    const probeResult = await FFmpegWrapper.probe(inputPath);
    // Ensure duration is a number (probe already parses it, but be defensive)
    const rawDuration = probeResult?.format?.duration;
    const duration =
      typeof rawDuration === "number" && !isNaN(rawDuration) ? rawDuration : 60;

    // Determine codecs based on output format
    const outputExt = outputPath.split(".").pop()?.toLowerCase();
    const defaultVideoCodec = outputExt === "webm" ? "libvpx-vp9" : "libx264";
    const defaultAudioCodec = outputExt === "webm" ? "libopus" : "aac";

    const args: string[] = ["-i", inputPath, "-y"]; // -y to overwrite

    // Video codec - use enum value directly
    const videoCodecValue = options.videoCodec
      ? VideoCodecEnum[options.videoCodec]
      : defaultVideoCodec;
    args.push("-c:v", videoCodecValue);

    // Audio codec - use enum value directly
    const audioCodecValue = options.audioCodec
      ? AudioCodecEnum[options.audioCodec]
      : defaultAudioCodec;
    args.push("-c:a", audioCodecValue);

    // Video bitrate
    if (options.videoBitrate) {
      args.push("-b:v", options.videoBitrate);
    }

    // Audio bitrate
    if (options.bitrate) {
      args.push("-b:a", options.bitrate);
    }

    // Resolution - convert object to FFmpeg format
    if (options.resolution) {
      const resolutionStr = `${options.resolution.width}x${options.resolution.height}`;
      args.push("-s", resolutionStr);
    }

    // Frame rate
    if (options.frameRate) {
      args.push("-r", options.frameRate.toString());
    }

    // Sample rate (audio)
    if (options.sampleRate) {
      args.push("-ar", options.sampleRate.toString());
    }

    // Channels (audio)
    if (options.channels) {
      args.push("-ac", options.channels.toString());
    }

    // Quality (CRF)
    if (options.quality !== undefined) {
      args.push("-crf", options.quality.toString());
    }

    // Preset - convert type to ffmpeg value
    if (options.preset) {
      const presetValue = PRESET_TO_FFMPEG[options.preset];
      args.push("-preset", presetValue);
    }

    args.push(outputPath);

    // Calculate dynamic timeout (transcoding is complexity 2)
    const timeout =
      options.baseOptions?.timeout ??
      FFmpegWrapper.estimateTimeout(duration, 2);

    return FFmpegWrapper.run(args, {
      ...options.baseOptions,
      timeout,
    });
  }

  /**
   * Extract audio from a video file.
   * This is a high-level, safe operation with sensible defaults.
   *
   * @param inputPath - Path to input video file
   * @param outputPath - Path for output audio file
   * @param options - Extraction options
   * @returns Promise resolving to the execution result
   *
   * @example
   * ```typescript
   * // Extract audio as MP3
   * const result = await FFmpegWrapper.extractAudio('video.mp4', 'audio.mp3');
   *
   * // Extract as high-quality FLAC
   * const result = await FFmpegWrapper.extractAudio('video.mp4', 'audio.flac', {
   *   format: 'flac'
   * });
   * ```
   */
  static async extractAudio(
    inputPath: string,
    outputPath: string,
    options: AudioExtractOptions = {},
  ): Promise<FFmpegResult> {
    // Probe input to get duration for dynamic timeout
    const probeResult = await FFmpegWrapper.probe(inputPath);
    // Ensure duration is a number
    const rawDuration = probeResult?.format?.duration;
    const duration =
      typeof rawDuration === "number" && !isNaN(rawDuration) ? rawDuration : 60;

    const args: string[] = ["-i", inputPath, "-vn", "-y"]; // -vn = no video

    // Determine codec based on format - use mapping
    const format = options.format ?? "MP3";
    const codecValue = AUDIO_FORMAT_TO_CODEC[format];
    args.push("-c:a", codecValue);

    // Bitrate
    if (options.bitrate) {
      args.push("-b:a", options.bitrate);
    }

    // Sample rate
    if (options.sampleRate) {
      args.push("-ar", options.sampleRate.toString());
    }

    // Channels
    if (options.channels) {
      args.push("-ac", options.channels.toString());
    }

    args.push(outputPath);

    // Audio extraction is fast (complexity 1)
    const timeout =
      options.baseOptions?.timeout ??
      FFmpegWrapper.estimateTimeout(duration, 1);

    return FFmpegWrapper.run(args, {
      ...options.baseOptions,
      timeout,
    });
  }

  /**
   * Extract a thumbnail from a video at a specific time.
   * This is a high-level, safe operation with sensible defaults.
   *
   * @param inputPath - Path to input video file
   * @param outputPath - Path for output image file (jpg, png)
   * @param options - Thumbnail options
   * @returns Promise resolving to the execution result
   *
   * @example
   * ```typescript
   * // Extract thumbnail at 10 seconds
   * const result = await FFmpegWrapper.extractThumbnail('video.mp4', 'thumb.jpg', {
   *   time: 10
   * });
   *
   * // Extract thumbnail at 50% with custom size
   * const result = await FFmpegWrapper.extractThumbnail('video.mp4', 'thumb.png', {
   *   time: '00:01:30',
   *   width: 320
   * });
   * ```
   */
  static async extractThumbnail(
    inputPath: string,
    outputPath: string,
    options: ThumbnailOptions = {},
  ): Promise<FFmpegResult> {
    // Time is now standardized as TimeInSeconds (number)
    const time = options.time ?? 0;
    const timeStr = time.toString();

    const args: string[] = [
      "-ss",
      timeStr,
      "-i",
      inputPath,
      "-vframes",
      "1",
      "-y",
    ];

    // Resolution - convert object to FFmpeg format
    if (options.resolution) {
      const resolutionStr = `${options.resolution.width}x${options.resolution.height}`;
      args.push("-s", resolutionStr);
    }

    // Quality for JPEG
    if (options.quality && outputPath.toLowerCase().endsWith(".jpg")) {
      args.push("-q:v", options.quality.toString());
    }

    args.push(outputPath);

    // Thumbnail extraction is very fast (30 seconds max)
    const timeout = options.baseOptions?.timeout ?? DEFAULT_SIMPLE_TIMEOUT_MS;

    return FFmpegWrapper.run(args, {
      ...options.baseOptions,
      timeout,
    });
  }

  /**
   * Trim a video to a specific segment.
   * This is a high-level, safe operation with sensible defaults.
   *
   * @param inputPath - Path to input video file
   * @param outputPath - Path for output video file
   * @param options - Trim options
   * @returns Promise resolving to the execution result
   *
   * @example
   * ```typescript
   * // Trim from 10s to 30s
   * const result = await FFmpegWrapper.trimVideo('input.mp4', 'output.mp4', {
   *   startTime: 10,
   *   endTime: 30
   * });
   *
   * // Trim 60 seconds starting from 1:30
   * const result = await FFmpegWrapper.trimVideo('input.mp4', 'output.mp4', {
   *   startTime: '00:01:30',
   *   duration: 60
   * });
   * ```
   */
  static async trimVideo(
    inputPath: string,
    outputPath: string,
    options: TrimOptions,
  ): Promise<FFmpegResult> {
    // Time is now standardized as TimeInSeconds (number)
    const startTimeStr = options.startTime.toString();

    const args: string[] = ["-ss", startTimeStr, "-i", inputPath, "-y"];

    // End time or duration
    if (options.endTime !== undefined) {
      const endTimeStr = options.endTime.toString();
      args.push("-to", endTimeStr);
    } else if (options.duration !== undefined) {
      args.push("-t", options.duration.toString());
    }

    // Codec selection
    if (options.reencode) {
      // Re-encode with default codecs
      args.push("-c:v", "libx264", "-c:a", "aac");
    } else {
      // Fast copy (no re-encoding)
      args.push("-c", "copy");
    }

    args.push(outputPath);

    // Estimate duration of output for timeout
    let outputDuration = 60; // Default
    if (options.duration) {
      outputDuration = options.duration;
    } else if (options.endTime !== undefined) {
      outputDuration = options.endTime - options.startTime;
    }

    // Copy is fast (1x), re-encode is slower (2x)
    const complexity = options.reencode ? 2 : 1;
    const timeout =
      options.baseOptions?.timeout ??
      FFmpegWrapper.estimateTimeout(outputDuration, complexity);

    return FFmpegWrapper.run(args, {
      ...options.baseOptions,
      timeout,
    });
  }
}

/**
 * Parse time string (HH:MM:SS or MM:SS or SS) to seconds.
 * Returns 0 for invalid input.
 * @deprecated - Time fields are now standardized to use TimeInSeconds (number)
 * This helper remains for internal backward compatibility only.
 */
function parseTimeToSeconds(time: string): number {
  if (!time || typeof time !== "string") {
    return 0;
  }

  const parts = time.split(":").map((p) => {
    const num = Number(p);
    return isNaN(num) ? 0 : num;
  });

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  // SS or single number
  return parts[0] || 0;
}
