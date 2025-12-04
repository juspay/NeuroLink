/**
 * File detection and processing types for unified file handling
 */

/**
 * Supported file types for multimodal input
 */
export type FileType = "csv" | "image" | "pdf" | "text" | "video" | "unknown";

/**
 * File input can be Buffer or string (path/URL/data URI)
 */
export type FileInput = Buffer | string;

/**
 * File source type for tracking input origin
 */
export type FileSource = "url" | "path" | "buffer" | "datauri";

/**
 * File detection result with confidence scoring
 */
export type FileDetectionResult = {
  type: FileType;
  mimeType: string;
  extension: string | null;
  source: FileSource;
  metadata: {
    size?: number;
    filename?: string;
    confidence: number; // 0-100
  };
};

/**
 * File processing result after detection and conversion
 */
export type FileProcessingResult = {
  type: FileType;
  content: string | Buffer;
  mimeType: string;
  metadata: {
    confidence: number;
    size?: number;
    filename?: string;
    // CSV-specific metadata
    rowCount?: number;
    columnCount?: number;
    columnNames?: string[];
    sampleData?: string;
    hasEmptyColumns?: boolean;
    // PDF-specific metadata
    version?: string;
    estimatedPages?: number | null;
    provider?: string;
    apiType?: PDFAPIType;
  };
};

/**
 * CSV processor options
 */
export type CSVProcessorOptions = {
  maxRows?: number;
  formatStyle?: "raw" | "markdown" | "json";
  includeHeaders?: boolean;
};

/**
 * PDF API types for different providers
 */
export type PDFAPIType = "document" | "files-api" | "unsupported";

/**
 * PDF provider configuration
 */
export type PDFProviderConfig = {
  maxSizeMB: number;
  maxPages: number;
  supportsNative: boolean;
  requiresCitations: boolean | "auto";
  apiType: PDFAPIType;
};

/**
 * PDF processor options
 */
export type PDFProcessorOptions = {
  provider?: string;
  model?: string;
  maxSizeMB?: number;
  bedrockApiMode?: "converse" | "invokeModel";
};

/**
 * File detector options
 */
export type FileDetectorOptions = {
  maxSize?: number;
  timeout?: number;
  allowedTypes?: FileType[];
  csvOptions?: CSVProcessorOptions;
  confidenceThreshold?: number;
  provider?: string;
};

/**
 * Google AI Studio Files API types
 */
export type GoogleFilesAPIUploadResult = {
  file: {
    name: string;
    displayName: string;
    mimeType: string;
    sizeBytes: string;
    createTime: string;
    updateTime: string;
    expirationTime: string;
    sha256Hash: string;
    uri: string;
  };
};

/**
 * Video API types for different providers
 */
export type VideoAPIType = "files-api" | "frame-extraction";

/**
 * Video metadata containing technical information about a video file
 */
export interface VideoMetadata {
  /** Duration of the video in seconds */
  duration: number;
  /** Width of the video in pixels */
  width: number;
  /** Height of the video in pixels */
  height: number;
  /** Video codec (e.g., 'h264', 'hevc', 'vp9') */
  codec: string;
  /** Frames per second */
  fps: number;
  /** File size in bytes */
  size: number;
}

/**
 * Extracted frame from video processing
 */
export interface ExtractedFrame {
  /** Raw image data as a Buffer */
  buffer: Buffer;
  /** Timestamp in seconds where the frame was extracted */
  timestamp: number;
  /** Zero-based index of the frame in the extraction sequence */
  index: number;
}

/**
 * Video content structure for multimodal input (file processing)
 * Note: This is distinct from VideoContent in multimodal.ts which is for API content.
 */
export interface ProcessedVideoContent {
  type: "video";
  frames?: ExtractedFrame[];
  content?: string; // base64 for native video
  transcription?: string;
  metadata: VideoMetadata;
}

/**
 * Video processor options for configuring video handling
 */
export interface VideoProcessorOptions {
  /** AI provider to use for video processing (e.g., 'openai', 'anthropic', 'google') */
  provider?: string;
  /** Number of frames to extract from the video (default varies by provider) */
  frameCount?: number;
  /** Output format for extracted frames */
  format?: "jpeg" | "png";
  /** Image quality for extracted frames (1-100, only applies to jpeg) */
  quality?: number;
  /** Whether to transcribe audio from the video */
  transcribe?: boolean;
  /** Model to use for audio transcription (e.g., 'whisper-1') */
  transcriptionModel?: string;
}

/**
 * Video provider configuration for different AI providers
 */
export interface VideoProviderConfig {
  /** Maximum video file size in megabytes */
  maxSizeMB: number;
  /** Maximum video duration in seconds */
  maxDurationSec: number;
  /** Whether the provider supports native video input (vs frame extraction) */
  supportsNativeVideo: boolean;
  /** Whether the provider supports audio analysis from videos */
  supportsAudio: boolean;
  /** Recommended number of frames to extract for this provider */
  recommendedFrameCount: number;
  /** API type used by the provider for video processing */
  apiType: VideoAPIType;
}
