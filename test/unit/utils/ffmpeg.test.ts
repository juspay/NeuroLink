import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";

// Mock child_process
vi.mock("child_process", () => ({
  spawn: vi.fn(),
}));

// Import after mocking
import { FFmpegWrapper } from "../../../src/lib/utils/ffmpegWrapper.js";
import type {
  FFmpegResult,
  FFmpegVersion,
  FFprobeResult,
} from "../../../src/lib/types/ffmpegTypes.js";

// Helper to create a mock child process
function createMockChildProcess(): {
  process: Partial<ChildProcess> & EventEmitter;
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: EventEmitter;
} {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const stdin = new EventEmitter();

  const mockProcess = new EventEmitter() as Partial<ChildProcess> &
    EventEmitter;
  mockProcess.stdout = stdout as ChildProcess["stdout"];
  mockProcess.stderr = stderr as ChildProcess["stderr"];
  mockProcess.stdin = stdin as ChildProcess["stdin"];
  mockProcess.killed = false;
  mockProcess.kill = vi.fn(() => {
    (mockProcess as { killed: boolean }).killed = true;
    return true;
  });

  return { process: mockProcess, stdout, stderr, stdin };
}

describe("FFmpegWrapper", () => {
  const mockSpawn = spawn as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset paths to defaults
    FFmpegWrapper.setFFmpegPath("ffmpeg");
    FFmpegWrapper.setFFprobePath("ffprobe");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("setFFmpegPath / setFFprobePath", () => {
    it("should allow setting custom ffmpeg path", () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      FFmpegWrapper.setFFmpegPath("/usr/local/bin/ffmpeg");

      // Trigger a run to verify the path is used
      const runPromise = FFmpegWrapper.run(["-version"]);

      // Emit success
      stdout.emit("data", Buffer.from("ffmpeg version 6.0"));
      process.emit("close", 0, null);

      expect(mockSpawn).toHaveBeenCalledWith(
        "/usr/local/bin/ffmpeg",
        ["-version"],
        expect.any(Object),
      );
    });

    it("should allow setting custom ffprobe path", () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      FFmpegWrapper.setFFprobePath("/usr/local/bin/ffprobe");

      // Trigger a probe to verify the path is used
      const probePromise = FFmpegWrapper.probe("test.mp4");

      // Emit success with valid JSON
      stdout.emit(
        "data",
        Buffer.from(JSON.stringify({ format: { filename: "test.mp4" } })),
      );
      process.emit("close", 0, null);

      expect(mockSpawn).toHaveBeenCalledWith(
        "/usr/local/bin/ffprobe",
        expect.arrayContaining(["-v", "quiet"]),
        expect.any(Object),
      );
    });
  });

  describe("isAvailable", () => {
    it("should return true when ffmpeg is available", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const availablePromise = FFmpegWrapper.isAvailable();

      // Emit version info and success
      stdout.emit("data", Buffer.from("ffmpeg version 6.0"));
      process.emit("close", 0, null);

      const result = await availablePromise;
      expect(result).toBe(true);
    });

    it("should return false when ffmpeg is not available", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const availablePromise = FFmpegWrapper.isAvailable();

      // Emit error
      process.emit("error", new Error("spawn ffmpeg ENOENT"));

      const result = await availablePromise;
      expect(result).toBe(false);
    });

    it("should return false when ffmpeg exits with non-zero code", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const availablePromise = FFmpegWrapper.isAvailable();

      // Emit failure
      process.emit("close", 1, null);

      const result = await availablePromise;
      expect(result).toBe(false);
    });
  });

  describe("getVersion", () => {
    it("should return version information when ffmpeg is available", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const versionPromise = FFmpegWrapper.getVersion();

      const versionOutput =
        "ffmpeg version 6.0-full_build Copyright (c) 2000-2023 FFmpeg developers";
      stdout.emit("data", Buffer.from(versionOutput));
      process.emit("close", 0, null);

      const result = await versionPromise;
      expect(result).not.toBeNull();
      expect(result?.version).toBe("6.0-full_build");
      expect(result?.fullOutput).toContain("ffmpeg version");
    });

    it("should return null when ffmpeg is not available", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const versionPromise = FFmpegWrapper.getVersion();

      process.emit("error", new Error("spawn ffmpeg ENOENT"));

      const result = await versionPromise;
      expect(result).toBeNull();
    });
  });

  describe("run", () => {
    it("should execute ffmpeg command and return result", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const runPromise = FFmpegWrapper.run([
        "-i",
        "input.mp4",
        "-c",
        "copy",
        "output.mp4",
      ]);

      // FFmpeg typically outputs to stderr
      stderr.emit(
        "data",
        Buffer.from("frame=  100 fps=50 q=-1.0 Lsize=   1000kB"),
      );
      process.emit("close", 0, null);

      const result = await runPromise;
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain("frame=");
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("should handle ffmpeg command failure", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const runPromise = FFmpegWrapper.run([
        "-i",
        "nonexistent.mp4",
        "output.mp4",
      ]);

      stderr.emit(
        "data",
        Buffer.from("nonexistent.mp4: No such file or directory"),
      );
      process.emit("close", 1, null);

      const result = await runPromise;
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("No such file or directory");
    });

    it("should respect custom cwd option", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const runPromise = FFmpegWrapper.run(["-version"], { cwd: "/tmp" });

      stdout.emit("data", Buffer.from("ffmpeg version 6.0"));
      process.emit("close", 0, null);

      await runPromise;

      expect(mockSpawn).toHaveBeenCalledWith("ffmpeg", ["-version"], {
        cwd: "/tmp",
        env: expect.any(Object),
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should merge custom env variables", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const runPromise = FFmpegWrapper.run(["-version"], {
        env: { CUSTOM_VAR: "value" },
      });

      stdout.emit("data", Buffer.from("ffmpeg version 6.0"));
      process.emit("close", 0, null);

      await runPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        "ffmpeg",
        ["-version"],
        expect.objectContaining({
          env: expect.objectContaining({ CUSTOM_VAR: "value" }),
        }),
      );
    });

    it("should handle spawn error", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const runPromise = FFmpegWrapper.run(["-version"]);

      process.emit("error", new Error("spawn ffmpeg ENOENT"));

      await expect(runPromise).rejects.toMatchObject({
        message: "spawn ffmpeg ENOENT",
      });
    });

    it("should timeout and kill process after specified duration", async () => {
      vi.useFakeTimers();
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const runPromise = FFmpegWrapper.run(["-i", "input.mp4", "output.mp4"], {
        timeout: 1000,
      });

      // Advance timers to trigger timeout
      vi.advanceTimersByTime(1100);

      // Process should be killed
      expect(process.kill).toHaveBeenCalledWith("SIGTERM");

      // Emit close after kill
      process.emit("close", null, "SIGTERM");

      await expect(runPromise).rejects.toMatchObject({
        message: expect.stringContaining("timed out"),
      });

      vi.useRealTimers();
    });

    it("should respect maxBuffer limit", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const maxBuffer = 100;
      const runPromise = FFmpegWrapper.run(["-version"], { maxBuffer });

      // Emit more data than maxBuffer
      const largeData = Buffer.alloc(200, "x");
      stdout.emit("data", largeData);
      process.emit("close", 0, null);

      const result = await runPromise;
      // Result should be truncated to maxBuffer
      expect(result.stdout.length).toBeLessThanOrEqual(maxBuffer);
    });
  });

  describe("probe", () => {
    it("should return probe result for valid media file", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const probePromise = FFmpegWrapper.probe("test.mp4");

      const probeOutput = JSON.stringify({
        format: {
          filename: "test.mp4",
          duration: "120.5",
          size: "10000000",
          bit_rate: "1000000",
          format_name: "mov,mp4,m4a,3gp,3g2,mj2",
          format_long_name: "QuickTime / MOV",
        },
        streams: [
          {
            index: 0,
            codec_name: "h264",
            codec_type: "video",
            width: 1920,
            height: 1080,
            duration: "120.5",
            bit_rate: "900000",
            r_frame_rate: "30/1",
          },
          {
            index: 1,
            codec_name: "aac",
            codec_type: "audio",
            sample_rate: "48000",
            channels: 2,
          },
        ],
      });

      stdout.emit("data", Buffer.from(probeOutput));
      process.emit("close", 0, null);

      const result = await probePromise;
      expect(result).not.toBeNull();
      expect(result?.format?.filename).toBe("test.mp4");
      expect(result?.format?.duration).toBe(120.5);
      expect(result?.format?.formatName).toBe("mov,mp4,m4a,3gp,3g2,mj2");
      expect(result?.streams).toHaveLength(2);
      expect(result?.streams?.[0].index).toBe(0);
      expect(result?.streams?.[0].codecType).toBe("VIDEO");
      expect(result?.streams?.[0].resolution).toEqual({
        width: 1920,
        height: 1080,
      });
      expect(result?.streams?.[1].index).toBe(1);
      expect(result?.streams?.[1].codecType).toBe("AUDIO");
    });

    it("should return null when probe fails", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const probePromise = FFmpegWrapper.probe("nonexistent.mp4");

      stderr.emit(
        "data",
        Buffer.from("nonexistent.mp4: No such file or directory"),
      );
      process.emit("close", 1, null);

      const result = await probePromise;
      expect(result).toBeNull();
    });

    it("should return null when probe output is invalid JSON", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const probePromise = FFmpegWrapper.probe("test.mp4");

      stdout.emit("data", Buffer.from("not valid json"));
      process.emit("close", 0, null);

      const result = await probePromise;
      expect(result).toBeNull();
    });

    it("should use correct ffprobe arguments", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const probePromise = FFmpegWrapper.probe("test.mp4");

      stdout.emit("data", Buffer.from(JSON.stringify({ format: {} })));
      process.emit("close", 0, null);

      await probePromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        "ffprobe",
        [
          "-v",
          "quiet",
          "-print_format",
          "json",
          "-show_format",
          "-show_streams",
          "test.mp4",
        ],
        expect.any(Object),
      );
    });
  });

  describe("exec", () => {
    it("should execute ffmpeg command via exec", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const execPromise = FFmpegWrapper.exec("ffmpeg", ["-version"]);

      stdout.emit("data", Buffer.from("ffmpeg version 6.0"));
      process.emit("close", 0, null);

      const result = await execPromise;
      expect(result.success).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith(
        "ffmpeg",
        ["-version"],
        expect.any(Object),
      );
    });

    it("should execute ffprobe command via exec", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const execPromise = FFmpegWrapper.exec("ffprobe", ["-version"]);

      stdout.emit("data", Buffer.from("ffprobe version 6.0"));
      process.emit("close", 0, null);

      const result = await execPromise;
      expect(result.success).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith(
        "ffprobe",
        ["-version"],
        expect.any(Object),
      );
    });
  });

  describe("estimateTimeout", () => {
    it("should calculate timeout based on duration and complexity", () => {
      // 60 seconds * 3000ms per second * complexity 2 = 360000ms
      const timeout = FFmpegWrapper.estimateTimeout(60, 2);
      expect(timeout).toBe(360000);
    });

    it("should respect minimum timeout", () => {
      // Very short duration should still return min timeout (30s)
      const timeout = FFmpegWrapper.estimateTimeout(1, 1);
      expect(timeout).toBe(30000); // MIN_TIMEOUT_MS
    });

    it("should respect maximum timeout", () => {
      // Very long duration should cap at max timeout (2 hours)
      const timeout = FFmpegWrapper.estimateTimeout(10000, 3);
      expect(timeout).toBe(7200000); // MAX_TIMEOUT_MS = 2 hours
    });
  });

  describe("convertVideo", () => {
    it("should convert video with default settings", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      // First call is for probe
      const probeProcess = createMockChildProcess();
      mockSpawn.mockReturnValueOnce(probeProcess.process);

      const convertPromise = FFmpegWrapper.convertVideo(
        "input.mp4",
        "output.mp4",
      );

      // Probe completes
      probeProcess.stdout.emit(
        "data",
        Buffer.from(JSON.stringify({ format: { duration: "60" } })),
      );
      probeProcess.process.emit("close", 0, null);

      // Wait for next tick to allow the conversion to start
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Conversion completes
      stderr.emit("data", Buffer.from("frame= 100"));
      process.emit("close", 0, null);

      const result = await convertPromise;
      expect(result.success).toBe(true);
    });

    it("should use WebM codecs for WebM output", async () => {
      const probeProcess = createMockChildProcess();
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValueOnce(probeProcess.process);
      mockSpawn.mockReturnValueOnce(process);

      const convertPromise = FFmpegWrapper.convertVideo(
        "input.mp4",
        "output.webm",
      );

      // Probe completes
      probeProcess.stdout.emit(
        "data",
        Buffer.from(JSON.stringify({ format: { duration: "60" } })),
      );
      probeProcess.process.emit("close", 0, null);

      await new Promise((resolve) => setTimeout(resolve, 10));

      stderr.emit("data", Buffer.from("frame= 100"));
      process.emit("close", 0, null);

      await convertPromise;

      // Check that WebM codecs were used
      expect(mockSpawn).toHaveBeenLastCalledWith(
        "ffmpeg",
        expect.arrayContaining(["-c:v", "libvpx-vp9", "-c:a", "libopus"]),
        expect.any(Object),
      );
    });
  });

  describe("extractAudio", () => {
    it("should extract audio as MP3 by default", async () => {
      const probeProcess = createMockChildProcess();
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValueOnce(probeProcess.process);
      mockSpawn.mockReturnValueOnce(process);

      const extractPromise = FFmpegWrapper.extractAudio(
        "video.mp4",
        "audio.mp3",
      );

      // Probe completes
      probeProcess.stdout.emit(
        "data",
        Buffer.from(JSON.stringify({ format: { duration: "120" } })),
      );
      probeProcess.process.emit("close", 0, null);

      await new Promise((resolve) => setTimeout(resolve, 10));

      stderr.emit("data", Buffer.from("size= 1000kB"));
      process.emit("close", 0, null);

      const result = await extractPromise;
      expect(result.success).toBe(true);

      // Check that MP3 codec was used and -vn flag included
      expect(mockSpawn).toHaveBeenLastCalledWith(
        "ffmpeg",
        expect.arrayContaining(["-vn", "-c:a", "libmp3lame"]),
        expect.any(Object),
      );
    });
  });

  describe("extractThumbnail", () => {
    it("should extract thumbnail at specified time", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const thumbPromise = FFmpegWrapper.extractThumbnail(
        "video.mp4",
        "thumb.jpg",
        {
          time: 10,
        },
      );

      stderr.emit("data", Buffer.from(""));
      process.emit("close", 0, null);

      const result = await thumbPromise;
      expect(result.success).toBe(true);

      // Check arguments
      expect(mockSpawn).toHaveBeenCalledWith(
        "ffmpeg",
        expect.arrayContaining(["-ss", "10", "-vframes", "1"]),
        expect.any(Object),
      );
    });

    it("should use resolution when specified", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const thumbPromise = FFmpegWrapper.extractThumbnail(
        "video.mp4",
        "thumb.jpg",
        {
          time: 5,
          resolution: { width: 320, height: 240 },
        },
      );

      process.emit("close", 0, null);

      await thumbPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        "ffmpeg",
        expect.arrayContaining(["-s", "320x240"]),
        expect.any(Object),
      );
    });
  });

  describe("trimVideo", () => {
    it("should trim video with copy codec by default", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const trimPromise = FFmpegWrapper.trimVideo("input.mp4", "output.mp4", {
        startTime: 10,
        endTime: 30,
      });

      stderr.emit("data", Buffer.from(""));
      process.emit("close", 0, null);

      const result = await trimPromise;
      expect(result.success).toBe(true);

      // Check that copy codec was used
      expect(mockSpawn).toHaveBeenCalledWith(
        "ffmpeg",
        expect.arrayContaining(["-ss", "10", "-to", "30", "-c", "copy"]),
        expect.any(Object),
      );
    });

    it("should re-encode when reencode option is true", async () => {
      const { process, stdout, stderr } = createMockChildProcess();
      mockSpawn.mockReturnValue(process);

      const trimPromise = FFmpegWrapper.trimVideo("input.mp4", "output.mp4", {
        startTime: 0,
        duration: 60,
        reencode: true,
      });

      process.emit("close", 0, null);

      await trimPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        "ffmpeg",
        expect.arrayContaining(["-c:v", "libx264", "-c:a", "aac"]),
        expect.any(Object),
      );
    });
  });
});
