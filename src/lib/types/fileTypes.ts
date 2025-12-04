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
 * Video metadata containing technical information
 */
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
  size: number;
}

/**
 * Extracted frame from video processing
 */
export interface ExtractedFrame {
  buffer: Buffer;
  timestamp: number;
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
  provider?: string;
  frameCount?: number;
  format?: "jpeg" | "png";
  quality?: number;
  transcribe?: boolean;
  transcriptionModel?: string;
}

/**
 * Video provider configuration for different AI providers
 */
export interface VideoProviderConfig {
  maxSizeMB: number;
  maxDurationSec: number;
  supportsNativeVideo: boolean;
  supportsAudio: boolean;
  recommendedFrameCount: number;
  apiType: VideoAPIType;
}
