/**
 * Cross-platform audio player for TTS output
 * Supports macOS, Linux, and Windows
 */

import { execFile } from "child_process";
import { promisify } from "util";
import { platform, tmpdir } from "os";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { TTSError, type AudioEncoding } from "../types/tts.js";

/**
 * Audio player interface
 */
export type AudioPlayer = {
  /** Play audio file on the current platform */
  play(filePath: string): Promise<void>;

  /** Play audio from buffer (creates temporary file) */
  playFromBuffer(audioBuffer: Buffer, encoding?: AudioEncoding): Promise<void>;

  /** Check if audio playback is supported */
  isSupported(): boolean;

  /** Get platform-specific player command */
  getPlayerCommand(): string;
};

const execFileAsync = promisify(execFile);

export class CrossPlatformAudioPlayer implements AudioPlayer {
  private currentPlatform: string;

  constructor() {
    this.currentPlatform = platform();
  }

  /**
   * Play audio from file path
   */
  async play(filePath: string): Promise<void> {
    if (!existsSync(filePath)) {
      throw new TTSError(`Audio file not found: ${filePath}`, "FILE_NOT_FOUND");
    }

    await this.playFromPath(filePath);
  }

  /**
   * Play audio from buffer (creates temporary file)
   */
  async playFromBuffer(
    audioBuffer: Buffer,
    encoding: AudioEncoding = "MP3",
  ): Promise<void> {
    const tempFilePath = this.createTempFile(audioBuffer, encoding);

    try {
      await this.playFromPath(tempFilePath);
    } finally {
      // Clean up temporary file
      this.cleanupTempFile(tempFilePath);
    }
  }

  /**
   * Create temporary file from audio buffer
   */
  private createTempFile(audioBuffer: Buffer, encoding: string): string {
    const extension = this.getFileExtension(encoding);
    const randomSuffix = randomBytes(8).toString("hex");
    const tempFilePath = join(tmpdir(), `tts-${randomSuffix}.${extension}`);
    writeFileSync(tempFilePath, audioBuffer);
    return tempFilePath;
  }

  /**
   * Get file extension for encoding
   */
  private getFileExtension(encoding: string): string {
    switch (encoding.toLowerCase()) {
      case "wav":
      case "linear16":
        return "wav";
      case "ogg":
      case "ogg_opus":
        return "ogg";
      case "mp3":
      default:
        return "mp3";
    }
  }

  /**
   * Clean up temporary file
   */
  private cleanupTempFile(filePath: string): void {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Internal method to play from file path
   */
  private async playFromPath(filePath: string): Promise<void> {
    if (!this.isSupported()) {
      throw new TTSError(
        `Audio playback not supported on platform: ${this.currentPlatform}`,
        "PLATFORM_NOT_SUPPORTED",
      );
    }

    try {
      switch (this.currentPlatform) {
        case "darwin":
          // Use execFile
          await execFileAsync("afplay", [filePath]);
          break;

        case "linux":
          // Try ffplay first, then fall back to aplay (only for WAV files)
          // Use execFile
          try {
            await execFileAsync("ffplay", ["-nodisp", "-autoexit", filePath]);
          } catch (ffplayError: unknown) {
            // aplay only supports WAV/PCM format, not MP3/OGG
            if (filePath.toLowerCase().endsWith(".wav")) {
              await execFileAsync("aplay", [filePath]);
            } else {
              throw new TTSError(
                "ffplay (from ffmpeg) is required to play MP3/OGG on Linux. Please install it with: sudo apt install ffmpeg",
                "PLAYER_NOT_FOUND",
                ffplayError instanceof Error ? ffplayError : undefined,
              );
            }
          }
          break;

        case "win32":
          await this.playOnWindows(filePath);
          break;

        default:
          throw new TTSError(
            `Unsupported platform: ${this.currentPlatform}`,
            "PLATFORM_NOT_SUPPORTED",
          );
      }
    } catch (error: unknown) {
      // Check for ENOENT error code (player not found)
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        throw new TTSError(
          `Audio player not found. Please install: ${this.getPlayerInstallation()}`,
          "PLAYER_NOT_FOUND",
          error instanceof Error ? error : undefined,
        );
      }

      // General playback error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TTSError(
        `Failed to play audio on ${this.currentPlatform}: ${errorMessage}`,
        "PLAYBACK_FAILED",
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Check if audio playback is supported on current platform
   */
  isSupported(): boolean {
    return ["darwin", "linux", "win32"].includes(this.currentPlatform);
  }

  /**
   * Get platform-specific player command
   */
  getPlayerCommand(): string {
    switch (this.currentPlatform) {
      case "darwin": // macOS
        return "afplay";

      case "linux":
        return "ffplay -nodisp -autoexit";

      case "win32": // Windows
        return "powershell SoundPlayer";

      default:
        throw new TTSError(
          `Unsupported platform: ${this.currentPlatform}`,
          "PLATFORM_NOT_SUPPORTED",
        );
    }
  }

  /**
   * Get platform-specific installation instructions
   */
  private getPlayerInstallation(): string {
    switch (this.currentPlatform) {
      case "darwin":
        return "afplay (should be pre-installed on macOS)";

      case "linux":
        return "ffmpeg (sudo apt install ffmpeg) or alsa-utils (sudo apt install alsa-utils)";

      case "win32":
        return "PowerShell (should be pre-installed on Windows)";

      default:
        return "audio player for your platform";
    }
  }

  /**
   * Play audio with Windows-specific PowerShell command
   * Uses proper escaping to avoid injection vulnerabilities
   */
  private async playOnWindows(filePath: string): Promise<void> {
    // Validate WAV format requirement for Windows
    if (!filePath.toLowerCase().endsWith(".wav")) {
      throw new TTSError(
        `Windows audio playback requires WAV format. Received: ${filePath}. Please use audioEncoding: 'WAV' when generating audio for Windows playback.`,
        "UNSUPPORTED_FORMAT",
      );
    }

    // Escape single quotes in the file path for PowerShell
    // In PowerShell, single quotes are escaped by doubling them: ' becomes ''
    const escapedPath = filePath.replace(/'/g, "''");

    // Execute PowerShell command with embedded file path
    // Using -NoProfile for faster startup and -Command for inline execution
    await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      `$player = New-Object System.Media.SoundPlayer; $player.SoundLocation = '${escapedPath}'; $player.PlaySync()`,
    ]);
  }

  /**
   * Test audio playback capability
   */
  async testPlayback(): Promise<boolean> {
    try {
      switch (this.currentPlatform) {
        case "darwin":
          await execFileAsync("which", ["afplay"]);
          break;

        case "linux":
          try {
            await execFileAsync("which", ["ffplay"]);
          } catch {
            await execFileAsync("which", ["aplay"]);
          }
          break;

        case "win32":
          await execFileAsync("powershell", [
            "-Command",
            "Get-Command powershell",
          ]);
          break;
      }

      return true;
    } catch {
      return false;
    }
  }
}
