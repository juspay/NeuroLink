/**
 * Metadata Validation Utilities
 * Provides runtime validation for multimodal content metadata to prevent
 * invalid values like negative dimensions, invalid sample rates, and memory DoS attacks
 *
 * @module utils/metadataValidator
 */

import type {
  ImageContent,
  AudioContent,
  VideoContent,
} from "../types/multimodal.js";
import { ValidationError } from "./parameterValidation.js";
import type { EnhancedValidationResult } from "../types/tools.js";
import type { StringArray } from "../types/typeAliases.js";

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Constraints for image metadata validation
 */
export const IMAGE_CONSTRAINTS = {
  MIN_DIMENSION: 1,
  MAX_DIMENSION: 16384,
  MAX_FILENAME_LENGTH: 255,
} as const;

/**
 * Constraints for audio metadata validation
 */
export const AUDIO_CONSTRAINTS = {
  MIN_DURATION: 0.001, // 1 millisecond
  MAX_DURATION: 86400, // 24 hours
  MIN_SAMPLE_RATE: 8000, // 8 kHz
  MAX_SAMPLE_RATE: 192000, // 192 kHz
  MIN_CHANNELS: 1,
  MAX_CHANNELS: 8,
  MAX_TRANSCRIPTION_LENGTH: 1000000, // 1M characters
  MAX_FILENAME_LENGTH: 255,
  LANGUAGE_PATTERN: /^[a-z]{2}$/,
} as const;

/**
 * Constraints for video metadata validation
 */
export const VIDEO_CONSTRAINTS = {
  MIN_DIMENSION: 1,
  MAX_DIMENSION: 16384,
  MIN_DURATION: 0.001, // 1 millisecond
  MAX_DURATION: 86400, // 24 hours
  MIN_FRAME_RATE: 1,
  MAX_FRAME_RATE: 240,
  MAX_EXTRACTED_FRAMES: 1000,
  MAX_TRANSCRIPTION_LENGTH: 1000000, // 1M characters
  MAX_CODEC_LENGTH: 50,
  MAX_FILENAME_LENGTH: 255,
} as const;

// ============================================================================
// DIMENSION VALIDATION
// ============================================================================

/**
 * Validate image or video dimensions
 */
export function validateDimensions(
  dimensions: { width: number; height: number } | undefined,
  fieldName: string,
  minDim: number,
  maxDim: number,
): ValidationError | null {
  if (!dimensions) {
    return null; // Optional field
  }

  const { width, height } = dimensions;

  // Validate width
  if (typeof width !== "number" || isNaN(width)) {
    return new ValidationError(
      `${fieldName}.width must be a valid number`,
      `${fieldName}.width`,
      "INVALID_TYPE",
      ["Provide a numeric width value"],
    );
  }

  if (width < minDim || width > maxDim) {
    return new ValidationError(
      `${fieldName}.width must be between ${minDim} and ${maxDim}, received ${width}`,
      `${fieldName}.width`,
      "OUT_OF_RANGE",
      [`Use width between ${minDim} and ${maxDim} pixels`],
    );
  }

  // Validate height
  if (typeof height !== "number" || isNaN(height)) {
    return new ValidationError(
      `${fieldName}.height must be a valid number`,
      `${fieldName}.height`,
      "INVALID_TYPE",
      ["Provide a numeric height value"],
    );
  }

  if (height < minDim || height > maxDim) {
    return new ValidationError(
      `${fieldName}.height must be between ${minDim} and ${maxDim}, received ${height}`,
      `${fieldName}.height`,
      "OUT_OF_RANGE",
      [`Use height between ${minDim} and ${maxDim} pixels`],
    );
  }

  return null;
}

/**
 * Validate duration (for audio/video)
 */
export function validateDuration(
  duration: number | undefined,
  fieldName: string,
  minDuration: number,
  maxDuration: number,
): ValidationError | null {
  if (duration === undefined) {
    return null; // Optional field
  }

  if (typeof duration !== "number" || isNaN(duration)) {
    return new ValidationError(
      `${fieldName} must be a valid number`,
      fieldName,
      "INVALID_TYPE",
      ["Provide a numeric duration value in seconds"],
    );
  }

  if (duration < minDuration || duration > maxDuration) {
    return new ValidationError(
      `${fieldName} must be between ${minDuration} and ${maxDuration} seconds, received ${duration}`,
      fieldName,
      "OUT_OF_RANGE",
      [
        `Use duration between ${minDuration}s and ${maxDuration}s`,
        `Maximum is 24 hours (${maxDuration}s)`,
      ],
    );
  }

  return null;
}

/**
 * Validate filename length
 */
export function validateFilename(
  filename: string | undefined,
  fieldName: string,
  maxLength: number,
): ValidationError | null {
  if (!filename) {
    return null; // Optional field
  }

  if (typeof filename !== "string") {
    return new ValidationError(
      `${fieldName} must be a string`,
      fieldName,
      "INVALID_TYPE",
      ["Provide a string filename"],
    );
  }

  if (filename.length > maxLength) {
    return new ValidationError(
      `${fieldName} too long: ${filename.length} characters (max: ${maxLength})`,
      fieldName,
      "MAX_LENGTH",
      [`Keep filename under ${maxLength} characters`],
    );
  }

  return null;
}

// ============================================================================
// IMAGE METADATA VALIDATION
// ============================================================================

/**
 * Validate ImageContent metadata
 *
 * @example
 * ```typescript
 * const result = validateImageMetadata({
 *   type: 'image',
 *   data: buffer,
 *   metadata: {
 *     dimensions: { width: 1920, height: 1080 },
 *     filename: 'photo.jpg'
 *   }
 * });
 *
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateImageMetadata(
  content: ImageContent,
): EnhancedValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: StringArray = [];

  if (!content.metadata) {
    return { isValid: true, errors, warnings, suggestions };
  }

  const { metadata } = content;

  // Validate dimensions
  const dimError = validateDimensions(
    metadata.dimensions,
    "metadata.dimensions",
    IMAGE_CONSTRAINTS.MIN_DIMENSION,
    IMAGE_CONSTRAINTS.MAX_DIMENSION,
  );
  if (dimError) {
    errors.push(dimError);
  }

  // Validate filename
  const filenameError = validateFilename(
    metadata.filename,
    "metadata.filename",
    IMAGE_CONSTRAINTS.MAX_FILENAME_LENGTH,
  );
  if (filenameError) {
    errors.push(filenameError);
  }

  // Validate description length (if present)
  if (metadata.description && metadata.description.length > 10000) {
    warnings.push("Description is very long (>10000 characters)");
    suggestions.push("Consider shortening description for better performance");
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}

// ============================================================================
// AUDIO METADATA VALIDATION
// ============================================================================

/**
 * Validate AudioContent metadata
 *
 * @example
 * ```typescript
 * const result = validateAudioMetadata({
 *   type: 'audio',
 *   data: buffer,
 *   metadata: {
 *     duration: 120.5,
 *     sampleRate: 48000,
 *     channels: 2,
 *     language: 'en'
 *   }
 * });
 * ```
 */
export function validateAudioMetadata(
  content: AudioContent,
): EnhancedValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: StringArray = [];

  if (!content.metadata) {
    return { isValid: true, errors, warnings, suggestions };
  }

  const { metadata } = content;

  // Validate duration
  const durationError = validateDuration(
    metadata.duration,
    "metadata.duration",
    AUDIO_CONSTRAINTS.MIN_DURATION,
    AUDIO_CONSTRAINTS.MAX_DURATION,
  );
  if (durationError) {
    errors.push(durationError);
  }

  // Validate sample rate
  if (metadata.sampleRate !== undefined) {
    if (typeof metadata.sampleRate !== "number" || isNaN(metadata.sampleRate)) {
      errors.push(
        new ValidationError(
          "metadata.sampleRate must be a valid number",
          "metadata.sampleRate",
          "INVALID_TYPE",
          ["Provide a numeric sample rate in Hz (e.g., 44100, 48000)"],
        ),
      );
    } else if (
      metadata.sampleRate < AUDIO_CONSTRAINTS.MIN_SAMPLE_RATE ||
      metadata.sampleRate > AUDIO_CONSTRAINTS.MAX_SAMPLE_RATE
    ) {
      errors.push(
        new ValidationError(
          `metadata.sampleRate must be between ${AUDIO_CONSTRAINTS.MIN_SAMPLE_RATE} and ${AUDIO_CONSTRAINTS.MAX_SAMPLE_RATE} Hz, received ${metadata.sampleRate}`,
          "metadata.sampleRate",
          "OUT_OF_RANGE",
          [
            `Use sample rate between ${AUDIO_CONSTRAINTS.MIN_SAMPLE_RATE} and ${AUDIO_CONSTRAINTS.MAX_SAMPLE_RATE} Hz`,
            "Common rates: 44100 Hz (CD quality), 48000 Hz (professional audio)",
          ],
        ),
      );
    }
  }

  // Validate channels
  if (metadata.channels !== undefined) {
    if (typeof metadata.channels !== "number" || isNaN(metadata.channels)) {
      errors.push(
        new ValidationError(
          "metadata.channels must be a valid number",
          "metadata.channels",
          "INVALID_TYPE",
          ["Provide number of audio channels (1 for mono, 2 for stereo)"],
        ),
      );
    } else if (
      metadata.channels < AUDIO_CONSTRAINTS.MIN_CHANNELS ||
      metadata.channels > AUDIO_CONSTRAINTS.MAX_CHANNELS
    ) {
      errors.push(
        new ValidationError(
          `metadata.channels must be between ${AUDIO_CONSTRAINTS.MIN_CHANNELS} and ${AUDIO_CONSTRAINTS.MAX_CHANNELS}, received ${metadata.channels}`,
          "metadata.channels",
          "OUT_OF_RANGE",
          [
            `Use between ${AUDIO_CONSTRAINTS.MIN_CHANNELS} and ${AUDIO_CONSTRAINTS.MAX_CHANNELS} channels`,
            "Common: 1 (mono), 2 (stereo), 6 (5.1 surround)",
          ],
        ),
      );
    }
  }

  // Validate transcription length
  if (metadata.transcription !== undefined) {
    if (typeof metadata.transcription !== "string") {
      errors.push(
        new ValidationError(
          "metadata.transcription must be a string",
          "metadata.transcription",
          "INVALID_TYPE",
        ),
      );
    } else if (
      metadata.transcription.length > AUDIO_CONSTRAINTS.MAX_TRANSCRIPTION_LENGTH
    ) {
      errors.push(
        new ValidationError(
          `metadata.transcription too long: ${metadata.transcription.length} characters (max: ${AUDIO_CONSTRAINTS.MAX_TRANSCRIPTION_LENGTH})`,
          "metadata.transcription",
          "MAX_LENGTH",
          ["Transcription exceeds 1M character limit"],
        ),
      );
    }
  }

  // Validate language code
  if (metadata.language !== undefined) {
    if (typeof metadata.language !== "string") {
      errors.push(
        new ValidationError(
          "metadata.language must be a string",
          "metadata.language",
          "INVALID_TYPE",
          ['Use ISO 639-1 language code (e.g., "en", "es", "fr")'],
        ),
      );
    } else if (!AUDIO_CONSTRAINTS.LANGUAGE_PATTERN.test(metadata.language)) {
      errors.push(
        new ValidationError(
          `metadata.language must be ISO 639-1 format (2 lowercase letters), received "${metadata.language}"`,
          "metadata.language",
          "INVALID_FORMAT",
          [
            'Use 2-letter ISO 639-1 codes like "en", "es", "fr", "de"',
            "See: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes",
          ],
        ),
      );
    }
  }

  // Validate filename
  const filenameError = validateFilename(
    metadata.filename,
    "metadata.filename",
    AUDIO_CONSTRAINTS.MAX_FILENAME_LENGTH,
  );
  if (filenameError) {
    errors.push(filenameError);
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}

// ============================================================================
// VIDEO METADATA VALIDATION
// ============================================================================

/**
 * Validate VideoContent metadata
 *
 * @example
 * ```typescript
 * const result = validateVideoMetadata({
 *   type: 'video',
 *   data: buffer,
 *   metadata: {
 *     duration: 300,
 *     dimensions: { width: 1920, height: 1080 },
 *     frameRate: 30,
 *     extractedFrames: ['frame1.jpg', 'frame2.jpg']
 *   }
 * });
 * ```
 */
export function validateVideoMetadata(
  content: VideoContent,
): EnhancedValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: StringArray = [];

  if (!content.metadata) {
    return { isValid: true, errors, warnings, suggestions };
  }

  const { metadata } = content;

  // Validate duration
  const durationError = validateDuration(
    metadata.duration,
    "metadata.duration",
    VIDEO_CONSTRAINTS.MIN_DURATION,
    VIDEO_CONSTRAINTS.MAX_DURATION,
  );
  if (durationError) {
    errors.push(durationError);
  }

  // Validate dimensions
  const dimError = validateDimensions(
    metadata.dimensions,
    "metadata.dimensions",
    VIDEO_CONSTRAINTS.MIN_DIMENSION,
    VIDEO_CONSTRAINTS.MAX_DIMENSION,
  );
  if (dimError) {
    errors.push(dimError);
  }

  // Validate frame rate
  if (metadata.frameRate !== undefined) {
    if (typeof metadata.frameRate !== "number" || isNaN(metadata.frameRate)) {
      errors.push(
        new ValidationError(
          "metadata.frameRate must be a valid number",
          "metadata.frameRate",
          "INVALID_TYPE",
          ["Provide numeric frame rate (e.g., 24, 30, 60 fps)"],
        ),
      );
    } else if (
      metadata.frameRate < VIDEO_CONSTRAINTS.MIN_FRAME_RATE ||
      metadata.frameRate > VIDEO_CONSTRAINTS.MAX_FRAME_RATE
    ) {
      errors.push(
        new ValidationError(
          `metadata.frameRate must be between ${VIDEO_CONSTRAINTS.MIN_FRAME_RATE} and ${VIDEO_CONSTRAINTS.MAX_FRAME_RATE} fps, received ${metadata.frameRate}`,
          "metadata.frameRate",
          "OUT_OF_RANGE",
          [
            `Use frame rate between ${VIDEO_CONSTRAINTS.MIN_FRAME_RATE} and ${VIDEO_CONSTRAINTS.MAX_FRAME_RATE} fps`,
            "Common: 24 (cinema), 30 (broadcast), 60 (high frame rate)",
          ],
        ),
      );
    }
  }

  // Validate codec
  if (metadata.codec !== undefined) {
    if (typeof metadata.codec !== "string") {
      errors.push(
        new ValidationError(
          "metadata.codec must be a string",
          "metadata.codec",
          "INVALID_TYPE",
          ['Provide codec name (e.g., "h264", "vp9")'],
        ),
      );
    } else if (metadata.codec.length > VIDEO_CONSTRAINTS.MAX_CODEC_LENGTH) {
      errors.push(
        new ValidationError(
          `metadata.codec too long: ${metadata.codec.length} characters (max: ${VIDEO_CONSTRAINTS.MAX_CODEC_LENGTH})`,
          "metadata.codec",
          "MAX_LENGTH",
          ["Keep codec name under 50 characters"],
        ),
      );
    }
  }

  // Validate extractedFrames array (DoS protection)
  if (metadata.extractedFrames !== undefined) {
    if (!Array.isArray(metadata.extractedFrames)) {
      errors.push(
        new ValidationError(
          "metadata.extractedFrames must be an array",
          "metadata.extractedFrames",
          "INVALID_TYPE",
          ["Provide array of frame URLs or base64 strings"],
        ),
      );
    } else if (
      metadata.extractedFrames.length > VIDEO_CONSTRAINTS.MAX_EXTRACTED_FRAMES
    ) {
      errors.push(
        new ValidationError(
          `metadata.extractedFrames too large: ${metadata.extractedFrames.length} items (max: ${VIDEO_CONSTRAINTS.MAX_EXTRACTED_FRAMES})`,
          "metadata.extractedFrames",
          "MAX_LENGTH",
          [
            `Limit extracted frames to ${VIDEO_CONSTRAINTS.MAX_EXTRACTED_FRAMES}`,
            "This prevents memory DoS attacks",
          ],
        ),
      );
    }

    // Check for non-string entries
    if (
      Array.isArray(metadata.extractedFrames) &&
      metadata.extractedFrames.some((frame) => typeof frame !== "string")
    ) {
      errors.push(
        new ValidationError(
          "metadata.extractedFrames must contain only strings",
          "metadata.extractedFrames",
          "INVALID_TYPE",
          ["Ensure all frames are string URLs or base64 data"],
        ),
      );
    }
  }

  // Validate transcription length
  if (metadata.transcription !== undefined) {
    if (typeof metadata.transcription !== "string") {
      errors.push(
        new ValidationError(
          "metadata.transcription must be a string",
          "metadata.transcription",
          "INVALID_TYPE",
        ),
      );
    } else if (
      metadata.transcription.length > VIDEO_CONSTRAINTS.MAX_TRANSCRIPTION_LENGTH
    ) {
      errors.push(
        new ValidationError(
          `metadata.transcription too long: ${metadata.transcription.length} characters (max: ${VIDEO_CONSTRAINTS.MAX_TRANSCRIPTION_LENGTH})`,
          "metadata.transcription",
          "MAX_LENGTH",
          ["Transcription exceeds 1M character limit"],
        ),
      );
    }
  }

  // Validate filename
  const filenameError = validateFilename(
    metadata.filename,
    "metadata.filename",
    VIDEO_CONSTRAINTS.MAX_FILENAME_LENGTH,
  );
  if (filenameError) {
    errors.push(filenameError);
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}
