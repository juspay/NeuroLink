/**
 * FFmpeg wrapper using Node.js child_process
 * High-level methods: convertVideo, extractAudio, extractThumbnail, trimVideo
 * Low-level methods: run, exec, probe
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

const DEFAULT_SIMPLE_TIMEOUT_MS = 30 * 1000;
const TIMEOUT_MULTIPLIER_PER_SECOND = 3000;
const MIN_TIMEOUT_MS = 30 * 1000;
const MAX_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const DEFAULT_MAX_BUFFER = 50 * 1024 * 1024;

// ============================================================================
// PRESET TO FFMPEG VALUE MAPPINGS
// ============================================================================

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

const AUDIO_FORMAT_TO_CODEC: Record<AudioFormat, string> = {
  MP3: "libmp3lame",
  AAC: "aac",
  WAV: "pcm_s16le",
  FLAC: "flac",
  OGG: "libvorbis",
};

const STREAM_CODEC_TYPE_TO_LOWERCASE: Record<StreamCodecType, string> = {
  VIDEO: "video",
  AUDIO: "audio",
  SUBTITLE: "subtitle",
  DATA: "data",
};

const LOWERCASE_TO_STREAM_CODEC_TYPE: Record<string, StreamCodecType> = {
  video: "VIDEO",
  audio: "AUDIO",
  subtitle: "SUBTITLE",
  data: "DATA",
};

/**
 * FFmpeg wrapper for executing commands via child_process
 * @example
 * const available = await FFmpegWrapper.isAvailable();
 * const result = await FFmpegWrapper.run(['-i', 'input.mp4', '-c', 'copy', 'out.mp4']);
 * const info = await FFmpegWrapper.probe('video.mp4');
 */
export class FFmpegWrapper {
  private static ffmpegPath = "ffmpeg";
  private static ffprobePath = "ffprobe";

  static setFFmpegPath(path: string): void {
    FFmpegWrapper.ffmpegPath = path;
  }

  static setFFprobePath(path: string): void {
    FFmpegWrapper.ffprobePath = path;
  }

  static async isAvailable(): Promise<boolean> {
    try {
      const result = await FFmpegWrapper.run(["-version"], { timeout: 10000 });
      return result.success;
    } catch {
      return false;
    }
  }

  static async getVersion(): Promise<FFmpegVersion | null> {
    try {
      const result = await FFmpegWrapper.run(["-version"], { timeout: 10000 });
      if (!result.success) return null;

      const versionMatch = result.stdout.match(/ffmpeg version (\S+)/);
      const version = versionMatch ? versionMatch[1] : "unknown";

      return { version, fullOutput: result.stdout };
    } catch {
      return null;
    }
  }

  /** Execute ffmpeg command */
  static async run(
    args: string[],
    options: FFmpegOptions = {},
  ): Promise<FFmpegResult> {
    const startTime = Date.now();
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

  /** Analyze media file with ffprobe */
  static async probe(
    inputPath: string,
    options: FFmpegOptions = {},
  ): Promise<FFprobeResult | null> {
    const timeout = options.timeout ?? 30000;

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

  /** Execute raw ffmpeg or ffprobe command (advanced) */
  static async exec(
    command: "ffmpeg" | "ffprobe",
    args: string[],
    options: FFmpegOptions = {},
  ): Promise<FFmpegResult> {
    const startTime = Date.now();
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
  // HIGH-LEVEL OPERATIONS
  // ============================================================================

  /** Estimate timeout based on media duration (complexity: 1=copy, 2=transcode, 3=filter) */
  static estimateTimeout(
    durationSeconds: number,
    complexityMultiplier: number = 2,
  ): number {
    const estimated =
      durationSeconds * TIMEOUT_MULTIPLIER_PER_SECOND * complexityMultiplier;
    return Math.max(MIN_TIMEOUT_MS, Math.min(estimated, MAX_TIMEOUT_MS));
  }

  /** Convert video format with codec/quality control */
  static async convertVideo(
    inputPath: string,
    outputPath: string,
    options: VideoConvertOptions = {},
  ): Promise<FFmpegResult> {
    const probeResult = await FFmpegWrapper.probe(inputPath);
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

  /** Extract audio from video file */
  static async extractAudio(
    inputPath: string,
    outputPath: string,
    options: AudioExtractOptions = {},
  ): Promise<FFmpegResult> {
    const probeResult = await FFmpegWrapper.probe(inputPath);
    const rawDuration = probeResult?.format?.duration;
    const duration =
      typeof rawDuration === "number" && !isNaN(rawDuration) ? rawDuration : 60;

    const args: string[] = ["-i", inputPath, "-vn", "-y"];

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

  /** Extract thumbnail from video at specific time */
  static async extractThumbnail(
    inputPath: string,
    outputPath: string,
    options: ThumbnailOptions = {},
  ): Promise<FFmpegResult> {
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

    if (options.resolution) {
      const resolutionStr = `${options.resolution.width}x${options.resolution.height}`;
      args.push("-s", resolutionStr);
    }

    if (options.quality && outputPath.toLowerCase().endsWith(".jpg")) {
      args.push("-q:v", options.quality.toString());
    }

    args.push(outputPath);

    const timeout = options.baseOptions?.timeout ?? DEFAULT_SIMPLE_TIMEOUT_MS;

    return FFmpegWrapper.run(args, {
      ...options.baseOptions,
      timeout,
    });
  }

  /** Trim/clip video segment */
  static async trimVideo(
    inputPath: string,
    outputPath: string,
    options: TrimOptions,
  ): Promise<FFmpegResult> {
    const startTimeStr = options.startTime.toString();
    const args: string[] = ["-ss", startTimeStr, "-i", inputPath, "-y"];

    if (options.endTime !== undefined) {
      args.push("-to", options.endTime.toString());
    } else if (options.duration !== undefined) {
      args.push("-t", options.duration.toString());
    }

    if (options.reencode) {
      args.push("-c:v", "libx264", "-c:a", "aac");
    } else {
      args.push("-c", "copy");
    }

    args.push(outputPath);

    let outputDuration = 60;
    if (options.duration) {
      outputDuration = options.duration;
    } else if (options.endTime !== undefined) {
      outputDuration = options.endTime - options.startTime;
    }

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

/** @deprecated Time parsing helper (internal use only) */
function parseTimeToSeconds(time: string): number {
  if (!time || typeof time !== "string") return 0;

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
