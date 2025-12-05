/**
 * Image processing utilities for multimodal support
 * Handles format conversion for different AI providers
 */

import { logger } from "./logger.js";
import type { ProcessedImage } from "../types/multimodal.js";
import type { FileProcessingResult } from "../types/fileTypes.js";

/**
 * Image processor class for handling provider-specific image formatting
 */
export class ImageProcessor {
  /**
   * Process image Buffer (unified interface)
   * Matches CSVProcessor.process() signature for consistency
   *
   * @param content - Image file as Buffer
   * @param options - Processing options (unused for now)
   * @returns Processed image as data URI
   */
  static async process(
    content: Buffer,
    _options?: unknown,
  ): Promise<FileProcessingResult> {
    const mediaType = this.detectImageType(content);
    const base64 = content.toString("base64");
    const dataUri = `data:${mediaType};base64,${base64}`;

    return {
      type: "image",
      content: dataUri,
      mimeType: mediaType,
      metadata: {
        confidence: 100,
        size: content.length,
      },
    } satisfies FileProcessingResult;
  }

  /**
   * Process image for OpenAI (requires data URI format)
   */
  static processImageForOpenAI(image: Buffer | string): string {
    try {
      if (typeof image === "string") {
        // Handle URLs
        if (image.startsWith("http")) {
          return image;
        }
        // Handle data URIs
        if (image.startsWith("data:")) {
          return image;
        }
        // Handle base64 - convert to data URI
        return `data:image/jpeg;base64,${image}`;
      }

      // Handle Buffer - convert to data URI
      const base64 = image.toString("base64");
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      logger.error("Failed to process image for OpenAI:", error);
      throw new Error(
        `Image processing failed for OpenAI: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process image for Google AI (requires base64 without data URI prefix)
   */
  static processImageForGoogle(image: Buffer | string): {
    mimeType: string;
    data: string;
  } {
    try {
      let base64Data: string;
      let mimeType = "image/jpeg"; // Default

      if (typeof image === "string") {
        if (image.startsWith("data:")) {
          // Extract mime type and base64 from data URI
          const match = image.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          } else {
            base64Data = image.split(",")[1] || image;
          }
        } else {
          base64Data = image;
        }
      } else {
        base64Data = image.toString("base64");
      }

      return {
        mimeType,
        data: base64Data, // Google wants base64 WITHOUT data URI prefix
      };
    } catch (error) {
      logger.error("Failed to process image for Google AI:", error);
      throw new Error(
        `Image processing failed for Google AI: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process image for Anthropic (requires base64 without data URI prefix)
   */
  static processImageForAnthropic(image: Buffer | string): {
    mediaType: string;
    data: string;
  } {
    try {
      let base64Data: string;
      let mediaType = "image/jpeg"; // Default

      if (typeof image === "string") {
        if (image.startsWith("data:")) {
          // Extract mime type and base64 from data URI
          const match = image.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mediaType = match[1];
            base64Data = match[2];
          } else {
            base64Data = image.split(",")[1] || image;
          }
        } else {
          base64Data = image;
        }
      } else {
        base64Data = image.toString("base64");
      }

      return {
        mediaType,
        data: base64Data, // Anthropic wants base64 WITHOUT data URI prefix
      };
    } catch (error) {
      logger.error("Failed to process image for Anthropic:", error);
      throw new Error(
        `Image processing failed for Anthropic: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process image for Vertex AI (model-specific routing)
   */
  static processImageForVertex(
    image: Buffer | string,
    model: string,
  ): { mimeType?: string; mediaType?: string; data: string } {
    try {
      // Route based on model type
      if (model.includes("gemini")) {
        // Use Google AI format for Gemini models
        return ImageProcessor.processImageForGoogle(image);
      } else if (model.includes("claude")) {
        // Use Anthropic format for Claude models
        return ImageProcessor.processImageForAnthropic(image);
      } else {
        // Default to Google format
        return ImageProcessor.processImageForGoogle(image);
      }
    } catch (error) {
      logger.error("Failed to process image for Vertex AI:", error);
      throw new Error(
        `Image processing failed for Vertex AI: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Detect image type from filename or data
   */
  static detectImageType(input: string | Buffer): string {
    try {
      if (typeof input === "string") {
        // Check if it's a data URI
        if (input.startsWith("data:")) {
          const match = input.match(/^data:([^;]+);/);
          return match ? match[1] : "image/jpeg";
        }

        // Check if it's a filename
        const extension = input.toLowerCase().split(".").pop();
        const imageTypes: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          bmp: "image/bmp",
          tiff: "image/tiff",
          tif: "image/tiff",
          svg: "image/svg+xml",
          avif: "image/avif",
        };
        return imageTypes[extension || ""] || "image/jpeg";
      }

      // For Buffer, try to detect from magic bytes
      if (input.length >= 4) {
        const header = input.subarray(0, 4);

        // PNG: 89 50 4E 47
        if (
          header[0] === 0x89 &&
          header[1] === 0x50 &&
          header[2] === 0x4e &&
          header[3] === 0x47
        ) {
          return "image/png";
        }

        // JPEG: FF D8 FF
        if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
          return "image/jpeg";
        }

        // GIF: 47 49 46 38
        if (
          header[0] === 0x47 &&
          header[1] === 0x49 &&
          header[2] === 0x46 &&
          header[3] === 0x38
        ) {
          return "image/gif";
        }

        // WebP: check for RIFF and WEBP
        if (input.length >= 12) {
          const riff = input.subarray(0, 4);
          const webp = input.subarray(8, 12);
          if (riff.toString() === "RIFF" && webp.toString() === "WEBP") {
            return "image/webp";
          }
        }

        // SVG: check for "<svg" or "<?xml" at start (text-based)
        if (input.length >= 4) {
          const start = input.subarray(0, 4).toString();
          if (start === "<svg" || start === "<?xm") {
            return "image/svg+xml";
          }
        }

        // AVIF: check for "ftypavif" signature at bytes 4-11
        if (input.length >= 12) {
          const ftyp = input.subarray(4, 8).toString();
          const brand = input.subarray(8, 12).toString();
          if (ftyp === "ftyp" && brand === "avif") {
            return "image/avif";
          }
        }
      }

      return "image/jpeg"; // Default fallback
    } catch (error) {
      logger.warn("Failed to detect image type, using default:", error);
      return "image/jpeg";
    }
  }

  /**
   * Validate image size (default 10MB limit)
   */
  static validateImageSize(
    data: Buffer | string,
    maxSize: number = 10 * 1024 * 1024,
  ): boolean {
    try {
      const size =
        typeof data === "string"
          ? Buffer.byteLength(data, "base64")
          : data.length;
      return size <= maxSize;
    } catch (error) {
      logger.warn("Failed to validate image size:", error);
      return false;
    }
  }

  /**
   * Validate image format
   */
  static validateImageFormat(mediaType: string): boolean {
    const supportedFormats = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
      "image/avif",
    ];
    return supportedFormats.includes(mediaType.toLowerCase());
  }

  /**
   * EXIF orientation values and their meanings:
   * 1: Normal (no rotation needed)
   * 2: Flipped horizontally
   * 3: Rotated 180 degrees
   * 4: Flipped vertically
   * 5: Rotated 90 CW and flipped horizontally
   * 6: Rotated 90 CW (width/height need to be swapped)
   * 7: Rotated 90 CCW and flipped horizontally
   * 8: Rotated 90 CCW (width/height need to be swapped)
   */
  static readonly ORIENTATION_REQUIRES_SWAP = [5, 6, 7, 8];

  /**
   * Parse EXIF orientation tag from JPEG buffer
   * Returns orientation value (1-8) or null if not found
   *
   * @param buffer - JPEG image buffer
   * @returns EXIF orientation value (1-8) or null if not found/not JPEG
   */
  static getExifOrientation(buffer: Buffer): number | null {
    try {
      // Check for JPEG magic bytes
      if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
        return null;
      }

      let offset = 2;

      // Scan through JPEG segments to find APP1 (EXIF)
      while (offset < buffer.length - 4) {
        // Each segment starts with 0xFF followed by marker type
        if (buffer[offset] !== 0xff) {
          break;
        }

        const marker = buffer[offset + 1];

        // Skip padding bytes (0xFF)
        if (marker === 0xff) {
          offset++;
          continue;
        }

        // SOS (Start of Scan) or EOI (End of Image) - stop searching
        if (marker === 0xda || marker === 0xd9) {
          break;
        }

        // Get segment length (big-endian, includes the 2 length bytes)
        if (offset + 4 > buffer.length) {
          break;
        }
        const segmentLength = buffer.readUInt16BE(offset + 2);

        // APP1 marker (0xE1) - contains EXIF data
        if (marker === 0xe1) {
          const segmentStart = offset + 4;
          const segmentEnd = offset + 2 + segmentLength;

          if (segmentEnd > buffer.length) {
            break;
          }

          // Check for EXIF header ("Exif\0\0")
          const exifHeader = buffer.subarray(segmentStart, segmentStart + 6);
          if (exifHeader.toString("ascii").startsWith("Exif")) {
            const tiffOffset = segmentStart + 6;
            return this.parseTiffOrientation(buffer, tiffOffset, segmentEnd);
          }
        }

        // Move to next segment
        offset = offset + 2 + segmentLength;
      }

      return null;
    } catch (error) {
      logger.warn("Failed to parse EXIF orientation:", error);
      return null;
    }
  }

  /**
   * Parse TIFF header to find orientation tag
   */
  private static parseTiffOrientation(
    buffer: Buffer,
    tiffOffset: number,
    maxOffset: number,
  ): number | null {
    try {
      if (tiffOffset + 8 > maxOffset) {
        return null;
      }

      // Check byte order (II = little-endian, MM = big-endian)
      const byteOrder = buffer.subarray(tiffOffset, tiffOffset + 2).toString();
      const isLittleEndian = byteOrder === "II";

      // Read function based on endianness
      const readUInt16 = isLittleEndian
        ? (pos: number) => buffer.readUInt16LE(pos)
        : (pos: number) => buffer.readUInt16BE(pos);

      const readUInt32 = isLittleEndian
        ? (pos: number) => buffer.readUInt32LE(pos)
        : (pos: number) => buffer.readUInt32BE(pos);

      // Verify TIFF magic number (42)
      const tiffMagic = readUInt16(tiffOffset + 2);
      if (tiffMagic !== 42) {
        return null;
      }

      // Get offset to first IFD
      const ifdOffset = readUInt32(tiffOffset + 4);
      const ifdStart = tiffOffset + ifdOffset;

      if (ifdStart + 2 > maxOffset) {
        return null;
      }

      // Read number of directory entries
      const numEntries = readUInt16(ifdStart);

      // Scan IFD entries for orientation tag (0x0112)
      for (let i = 0; i < numEntries; i++) {
        const entryOffset = ifdStart + 2 + i * 12;

        if (entryOffset + 12 > maxOffset) {
          break;
        }

        const tagId = readUInt16(entryOffset);

        // Orientation tag
        if (tagId === 0x0112) {
          const tagType = readUInt16(entryOffset + 2);
          // Type 3 = SHORT (2 bytes)
          if (tagType === 3) {
            const orientation = readUInt16(entryOffset + 8);
            if (orientation >= 1 && orientation <= 8) {
              return orientation;
            }
          }
        }
      }

      return null;
    } catch (error) {
      logger.warn("Failed to parse TIFF orientation:", error);
      return null;
    }
  }

  /**
   * Get rotation angle in degrees based on EXIF orientation
   *
   * @param orientation - EXIF orientation value (1-8)
   * @returns Rotation angle in degrees (0, 90, 180, 270)
   */
  static getRotationFromOrientation(orientation: number): number {
    switch (orientation) {
      case 1:
      case 2:
        return 0;
      case 3:
      case 4:
        return 180;
      case 5:
      case 6:
        return 90;
      case 7:
      case 8:
        return 270;
      default:
        return 0;
    }
  }

  /**
   * Check if dimensions need to be swapped based on EXIF orientation
   *
   * @param orientation - EXIF orientation value (1-8)
   * @returns true if width and height should be swapped
   */
  static shouldSwapDimensions(orientation: number): boolean {
    return this.ORIENTATION_REQUIRES_SWAP.includes(orientation);
  }

  /**
   * Get orientation-adjusted dimensions from image buffer
   * Accounts for EXIF orientation to return the displayed dimensions
   *
   * @param buffer - Image buffer
   * @returns Adjusted dimensions or null if dimensions cannot be determined
   */
  static getOrientationAdjustedDimensions(
    buffer: Buffer,
  ): { width: number; height: number; orientation: number | null } | null {
    const rawDimensions = this.getRawImageDimensions(buffer);
    if (!rawDimensions) {
      return null;
    }

    const orientation = this.getExifOrientation(buffer);

    if (orientation && this.shouldSwapDimensions(orientation)) {
      return {
        width: rawDimensions.height,
        height: rawDimensions.width,
        orientation,
      };
    }

    return {
      width: rawDimensions.width,
      height: rawDimensions.height,
      orientation,
    };
  }

  /**
   * Get raw image dimensions from Buffer without EXIF adjustment
   */
  static getRawImageDimensions(
    buffer: Buffer,
  ): { width: number; height: number } | null {
    try {
      // PNG dimension extraction
      if (
        buffer.length >= 24 &&
        buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
      ) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }

      // JPEG dimension extraction
      if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
        return this.getJpegDimensions(buffer);
      }

      return null;
    } catch (error) {
      logger.warn("Failed to extract raw image dimensions:", error);
      return null;
    }
  }

  /**
   * Extract dimensions from JPEG buffer by scanning for SOF markers
   */
  private static getJpegDimensions(
    buffer: Buffer,
  ): { width: number; height: number } | null {
    try {
      let offset = 2;

      while (offset < buffer.length - 9) {
        // Each segment starts with 0xFF
        if (buffer[offset] !== 0xff) {
          break;
        }

        const marker = buffer[offset + 1];

        // Skip padding bytes
        if (marker === 0xff) {
          offset++;
          continue;
        }

        // SOF markers (Start of Frame) contain image dimensions
        // SOF0 (0xC0) - Baseline DCT
        // SOF1 (0xC1) - Extended sequential DCT
        // SOF2 (0xC2) - Progressive DCT
        if (
          marker === 0xc0 ||
          marker === 0xc1 ||
          marker === 0xc2 ||
          marker === 0xc3
        ) {
          if (offset + 9 > buffer.length) {
            break;
          }
          // SOF segment: length (2) + precision (1) + height (2) + width (2)
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }

        // SOS or EOI - stop searching
        if (marker === 0xda || marker === 0xd9) {
          break;
        }

        // Get segment length and move to next segment
        if (offset + 4 > buffer.length) {
          break;
        }
        const segmentLength = buffer.readUInt16BE(offset + 2);
        offset = offset + 2 + segmentLength;
      }

      return null;
    } catch (error) {
      logger.warn("Failed to extract JPEG dimensions:", error);
      return null;
    }
  }

  /**
   * Get image dimensions from Buffer (EXIF-aware)
   * This method now accounts for EXIF orientation and returns the
   * dimensions as the image would appear when displayed correctly
   */
  static getImageDimensions(
    buffer: Buffer,
  ): { width: number; height: number } | null {
    const adjusted = this.getOrientationAdjustedDimensions(buffer);
    if (adjusted) {
      return { width: adjusted.width, height: adjusted.height };
    }
    return null;
  }

  /**
   * Convert image to ProcessedImage format
   */
  static processImage(
    image: Buffer | string,
    provider: string,
    model?: string,
  ): ProcessedImage {
    try {
      const mediaType = ImageProcessor.detectImageType(image);
      const size =
        typeof image === "string"
          ? Buffer.byteLength(image, "base64")
          : image.length;

      let data: string;
      let format: ProcessedImage["format"];

      switch (provider.toLowerCase()) {
        case "openai":
          data = ImageProcessor.processImageForOpenAI(image);
          format = "data_uri";
          break;

        case "google-ai":
        case "google": {
          const googleResult = ImageProcessor.processImageForGoogle(image);
          data = googleResult.data;
          format = "base64";
          break;
        }

        case "anthropic": {
          const anthropicResult =
            ImageProcessor.processImageForAnthropic(image);
          data = anthropicResult.data;
          format = "base64";
          break;
        }

        case "vertex": {
          const vertexResult = ImageProcessor.processImageForVertex(
            image,
            model || "",
          );
          data = vertexResult.data;
          format = "base64";
          break;
        }

        default:
          // Default to base64
          if (typeof image === "string") {
            data = image.startsWith("data:")
              ? image.split(",")[1] || image
              : image;
          } else {
            data = image.toString("base64");
          }
          format = "base64";
      }

      return {
        data,
        mediaType,
        size,
        format,
      };
    } catch (error) {
      logger.error(`Failed to process image for ${provider}:`, error);
      throw new Error(
        `Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

/**
 * Utility functions for image handling
 */
export const imageUtils = {
  /**
   * Check if a string is a valid data URI
   */
  isDataUri: (str: string): boolean => {
    return (
      typeof str === "string" &&
      str.startsWith("data:") &&
      str.includes("base64,")
    );
  },

  /**
   * Check if a string is a valid URL
   */
  isUrl: (str: string): boolean => {
    try {
      new URL(str);
      return str.startsWith("http://") || str.startsWith("https://");
    } catch {
      return false;
    }
  },

  /**
   * Check if a string is base64 encoded
   */
  isBase64: (str: string): boolean => imageUtils.isValidBase64(str),

  /**
   * Extract file extension from filename or URL
   */
  getFileExtension: (filename: string): string | null => {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : null;
  },

  /**
   * Convert file size to human readable format
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Convert Buffer to base64 string
   */
  bufferToBase64: (buffer: Buffer): string => {
    return buffer.toString("base64");
  },

  /**
   * Convert base64 string to Buffer
   */
  base64ToBuffer: (base64: string): Buffer => {
    // Remove data URI prefix if present
    const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    return Buffer.from(cleanBase64, "base64");
  },

  /**
   * Convert file path to base64 data URI
   */
  fileToBase64DataUri: async (
    filePath: string,
    maxBytes: number = 10 * 1024 * 1024,
  ): Promise<string> => {
    try {
      const fs = await import("fs/promises");

      // File existence and type validation
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        throw new Error("Not a file");
      }

      // Size check before reading - prevent memory exhaustion
      if (stat.size > maxBytes) {
        throw new Error(
          `File too large: ${stat.size} bytes (max: ${maxBytes} bytes)`,
        );
      }

      const buffer = await fs.readFile(filePath);

      // Enhanced MIME detection: try buffer content first, fallback to filename
      const mimeType =
        ImageProcessor.detectImageType(buffer) ||
        ImageProcessor.detectImageType(filePath);

      const base64 = buffer.toString("base64");
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      throw new Error(
        `Failed to convert file to base64: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  /**
   * Convert URL to base64 data URI by downloading the image
   */
  urlToBase64DataUri: async (
    url: string,
    { timeoutMs = 15000, maxBytes = 10 * 1024 * 1024 } = {},
  ): Promise<string> => {
    try {
      // Basic protocol whitelist
      if (!/^https?:\/\//i.test(url)) {
        throw new Error("Unsupported protocol");
      }

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!/^image\//i.test(contentType)) {
          throw new Error(
            `Unsupported content-type: ${contentType || "unknown"}`,
          );
        }

        const len = Number(response.headers.get("content-length") || 0);
        if (len && len > maxBytes) {
          throw new Error(`Content too large: ${len} bytes`);
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > maxBytes) {
          throw new Error(
            `Downloaded content too large: ${buffer.byteLength} bytes`,
          );
        }

        const base64 = Buffer.from(buffer).toString("base64");
        return `data:${contentType || "image/jpeg"};base64,${base64}`;
      } finally {
        clearTimeout(t);
      }
    } catch (error) {
      throw new Error(
        `Failed to download and convert URL to base64: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  /**
   * Extract base64 data from data URI
   */
  extractBase64FromDataUri: (dataUri: string): string => {
    if (!dataUri.includes(",")) {
      return dataUri; // Already just base64
    }
    return dataUri.split(",")[1];
  },

  /**
   * Extract MIME type from data URI
   */
  extractMimeTypeFromDataUri: (dataUri: string): string => {
    const match = dataUri.match(/^data:([^;]+);base64,/);
    return match ? match[1] : "image/jpeg";
  },

  /**
   * Create data URI from base64 and MIME type
   */
  createDataUri: (base64: string, mimeType: string = "image/jpeg"): string => {
    // Remove data URI prefix if already present
    const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    return `data:${mimeType};base64,${cleanBase64}`;
  },

  /**
   * Validate base64 string format
   */
  isValidBase64: (str: string): boolean => {
    try {
      // Remove data URI prefix if present
      const cleanBase64 = str.includes(",") ? str.split(",")[1] : str;

      // Check if it's valid base64
      const decoded = Buffer.from(cleanBase64, "base64");
      const reencoded = decoded.toString("base64");

      // Remove padding for comparison (base64 can have different padding)
      const normalizeBase64 = (b64: string) => b64.replace(/=+$/, "");
      return normalizeBase64(cleanBase64) === normalizeBase64(reencoded);
    } catch {
      return false;
    }
  },

  /**
   * Get base64 string size in bytes
   */
  getBase64Size: (base64: string): number => {
    // Remove data URI prefix if present
    const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    return Buffer.byteLength(cleanBase64, "base64");
  },

  /**
   * Compress base64 image by reducing quality (basic implementation)
   * Note: This is a placeholder - for production use, consider using sharp or similar
   */
  compressBase64: (base64: string, _quality: number = 0.8): string => {
    // This is a basic implementation that just returns the original
    // In a real implementation, you'd use an image processing library
    logger.warn("Base64 compression not implemented - returning original");
    return base64;
  },
};
