/**
 * Content type definitions for multimodal support
 * Supports text and image content with provider-specific formatting
 */

/**
 * Text content type for multimodal messages
 */
export type TextContent = {
  type: "text";
  text: string;
};

/**
 * Image content type for multimodal messages
 */
export type ImageContent = {
  type: "image";
  data: Buffer | string; // Buffer, base64, URL, or data URI
  mediaType?:
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp"
    | "image/bmp"
    | "image/tiff";
  metadata?: {
    description?: string;
    quality?: "low" | "high" | "auto";
    dimensions?: { width: number; height: number };
    filename?: string;
  };
};

/**
 * CSV content type for multimodal messages
 */
export type CSVContent = {
  type: "csv";
  data: Buffer | string;
  metadata?: {
    filename?: string;
    maxRows?: number;
    formatStyle?: "raw" | "markdown" | "json";
    description?: string;
  };
};

/**
 * PDF document content type for multimodal messages
 */
export type PDFContent = {
  type: "pdf";
  data: Buffer | string;
  metadata?: {
    filename?: string;
    pages?: number;
    version?: string;
    description?: string;
  };
};

/**
 * Union type for all content types
 */
export type Content = TextContent | ImageContent | CSVContent | PDFContent;

/**
 * Vision capability information for providers
 */
export type VisionCapability = {
  provider: string;
  supportedModels: string[];
  maxImageSize?: number; // in bytes
  supportedFormats: string[];
  maxImagesPerRequest?: number;
};

/**
 * Provider-specific image format requirements
 */
export type ProviderImageFormat = {
  provider: string;
  format: "data_uri" | "base64" | "inline_data" | "source";
  requiresPrefix?: boolean;
  mimeTypeField?: string;
  dataField?: string;
};

/**
 * Image processing result
 */
export type ProcessedImage = {
  data: string;
  mediaType: string;
  size: number;
  format: "data_uri" | "base64" | "inline_data" | "source";
};

/**
 * Multimodal message structure for provider adapters
 */
export type MultimodalMessage = {
  role: "user" | "assistant" | "system";
  content: Content[];
};

/**
 * Multimodal input type for options that may contain images or content arrays
 */
export type MultimodalInput = {
  text: string;
  images?: Array<Buffer | string>;
  content?: Array<TextContent | ImageContent>;
  csvFiles?: Array<Buffer | string>;
  pdfFiles?: Array<Buffer | string>;
  files?: Array<Buffer | string>;
};

/**
 * Provider-specific multimodal payload
 */
export type ProviderMultimodalPayload = {
  provider: string;
  model: string;
  messages?: MultimodalMessage[];
  contents?: unknown[]; // Google AI format
  [key: string]: unknown; // Allow provider-specific fields
};
