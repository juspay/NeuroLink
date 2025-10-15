/**
 * Cross-platform audio player for TTS output
 * Supports macOS, Linux, and Windows
 */

import { exec } from "child_process";
import { promisify } from "util";
import { platform, tmpdir } from "os";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { TTSError } from "../types/tts.js";

/**
 * Audio player interface
 */
export interface AudioPlayer {
  /** Play audio file on the current platform */
  play(filePath: string): Promise<void>;

  /** Play audio from buffer (creates temporary file) */
  playFromBuffer(audioBuffer: Buffer, encoding?: string): Promise<void>;

  /** Check if audio playback is supported */
  isSupported(): boolean;

  /** Get platform-specific player command */
  getPlayerCommand(): string;
}

const execAsync = promisify(exec);

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
    encoding: string = "mp3",
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
    const tempFilePath = join(tmpdir(), `tts-temp.${extension}`);
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
          await execAsync(`afplay "${filePath}"`);
          break;

        case "linux":
          // Try ffplay first, then fall back to aplay
          try {
            await execAsync(`ffplay -nodisp -autoexit "${filePath}"`);
          } catch {
            await execAsync(`aplay "${filePath}"`);
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
      const errorObj = error as Error;
      if ((error as { code?: string })?.code === "ENOENT") {
        throw new TTSError(
          `Audio player not found. Please install: ${this.getPlayerInstallation()}`,
          "PLAYER_NOT_FOUND",
          errorObj,
        );
      }

      throw new TTSError(
        `Failed to play audio on ${this.currentPlatform}: ${errorObj.message || "Unknown error"}`,
        "PLAYBACK_FAILED",
        errorObj,
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
        return 'powershell -c "(New-Object Media.SoundPlayer';

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
   */
  private async playOnWindows(filePath: string): Promise<void> {
    // Windows PowerShell script to play audio
    const psScript = `
      $player = New-Object System.Media.SoundPlayer
      $player.SoundLocation = "${filePath.replace(/\\/g, "\\\\")}"
      $player.PlaySync()
    `;

    const command = `powershell -Command "${psScript}"`;
    await execAsync(command);
  }

  /**
   * Test audio playback capability
   */
  async testPlayback(): Promise<boolean> {
    try {
      switch (this.currentPlatform) {
        case "darwin":
          await execAsync("which afplay");
          break;

        case "linux":
          try {
            await execAsync("which ffplay");
          } catch {
            await execAsync("which aplay");
          }
          break;

        case "win32":
          await execAsync('powershell -Command "Get-Command powershell"');
          break;
      }

      return true;
    } catch {
      return false;
    }
  }
}
