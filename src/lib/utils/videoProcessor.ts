/**
 * Video processing utilities for multimodal support
 * Handles video format validation and processing
 */

import { logger } from "./logger.js";
import type { FileProcessingResult } from "../types/fileTypes.js";

/**
 * Video processor class for handling video file validation and processing
 */
export class VideoProcessor {
  /**
   * Validate if a buffer contains a valid video file format
   * Checks magic bytes for common video formats:
   * - MP4/MOV: "ftyp" at offset 4
   * - WebM/MKV: EBML signature (0x1A45DFA3)
   * - AVI: "RIFF" + "AVI " signature
   *
   * @param buffer - Buffer to validate
   * @returns true if valid video format detected, false otherwise
   */
  static isValidVideo(buffer: Buffer): boolean {
    // Handle short buffers gracefully
    if (buffer.length < 12) {
      logger.debug(
        `[VideoProcessor] Buffer too short (${buffer.length} bytes) for video format detection`,
      );
      return false;
    }

    // Check MP4/MOV format: "ftyp" at offset 4
    if (this.isMP4OrMOV(buffer)) {
      logger.debug("[VideoProcessor] Detected MP4/MOV format");
      return true;
    }

    // Check WebM/MKV format: EBML signature (0x1A45DFA3)
    if (this.isWebMOrMKV(buffer)) {
      logger.debug("[VideoProcessor] Detected WebM/MKV format");
      return true;
    }

    // Check AVI format: "RIFF" + "AVI " signature
    if (this.isAVI(buffer)) {
      logger.debug("[VideoProcessor] Detected AVI format");
      return true;
    }

    logger.debug("[VideoProcessor] No valid video format detected");
    return false;
  }

  /**
   * Check if buffer is MP4 or MOV format
   * MP4/MOV files have "ftyp" at offset 4
   */
  private static isMP4OrMOV(buffer: Buffer): boolean {
    if (buffer.length < 8) {
      return false;
    }

    // Check for "ftyp" at offset 4
    const ftypSignature = buffer.slice(4, 8).toString("ascii");
    return ftypSignature === "ftyp";
  }

  /**
   * Check if buffer is WebM or MKV format
   * WebM/MKV files start with EBML signature: 0x1A 0x45 0xDF 0xA3
   */
  private static isWebMOrMKV(buffer: Buffer): boolean {
    if (buffer.length < 4) {
      return false;
    }

    // Check for EBML signature
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  /**
   * Check if buffer is AVI format
   * AVI files start with "RIFF" and have "AVI " at offset 8
   */
  private static isAVI(buffer: Buffer): boolean {
    if (buffer.length < 12) {
      return false;
    }

    // Check for "RIFF" at offset 0
    const riffSignature = buffer.slice(0, 4).toString("ascii");
    if (riffSignature !== "RIFF") {
      return false;
    }

    // Check for "AVI " at offset 8
    const aviSignature = buffer.slice(8, 12).toString("ascii");
    return aviSignature === "AVI ";
  }

  /**
   * Process video Buffer (unified interface)
   * Matches other processor signatures for consistency
   *
   * @param content - Video file as Buffer
   * @param _options - Processing options (unused for now)
   * @returns Processed video result
   */
  static async process(
    content: Buffer,
    _options?: unknown,
  ): Promise<FileProcessingResult> {
    // Validate content is non-empty before processing
    if (content.length === 0) {
      logger.error("[VideoProcessor] Empty buffer provided");
      throw new Error("Invalid video processing: buffer is empty");
    }

    // Validate video format
    if (!this.isValidVideo(content)) {
      logger.error("[VideoProcessor] Invalid video format");
      throw new Error("Invalid video format: not a supported video file");
    }

    const mimeType = this.detectVideoType(content);

    return {
      type: "audio", // Using 'audio' as video is not yet in FileType union
      content: content,
      mimeType: mimeType,
      metadata: {
        confidence: 95,
        size: content.length,
      },
    } satisfies FileProcessingResult;
  }

  /**
   * Detect specific video MIME type from buffer
   */
  private static detectVideoType(buffer: Buffer): string {
    if (this.isMP4OrMOV(buffer)) {
      return "video/mp4";
    }
    if (this.isWebMOrMKV(buffer)) {
      return "video/webm";
    }
    if (this.isAVI(buffer)) {
      return "video/x-msvideo";
    }
    return "video/mp4"; // Default fallback
  }
}
