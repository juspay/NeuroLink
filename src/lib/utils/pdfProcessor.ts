/**
 * PDF Processor with Image Fallback Support
 *
 * Handles PDF processing for all providers:
 * - Native PDF support for providers that accept PDF directly (Google AI, Vertex, OpenAI, Anthropic, Bedrock)
 * - PDF → Image conversion for providers that don't support native PDF (Azure, Mistral, Ollama)
 *
 * The conversion uses pdf-to-img package (MuPDF-based) for high-quality conversion.
 */

import type {
  FileProcessingResult,
  PDFProviderConfig,
  PDFProcessorOptions,
  AggregatePDFValidationResult,
  PDFFileInfo,
} from "../types/fileTypes.js";
import { PDF_LIMITS } from "../core/constants.js";
import { logger } from "./logger.js";

/**
 * Provider configurations for PDF handling
 *
 * supportsNative: true = Send PDF as FilePart (mimeType: application/pdf)
 * supportsNative: false = Convert PDF pages to PNG images and send as ImageParts
 */
const PDF_PROVIDER_CONFIGS: Record<string, PDFProviderConfig> = {
  anthropic: {
    maxSizeMB: 5,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "document",
  },
  bedrock: {
    maxSizeMB: 5,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: "auto",
    apiType: "document",
  },
  "google-vertex": {
    maxSizeMB: 5,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "document",
  },
  vertex: {
    maxSizeMB: 5,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "document",
  },
  "google-ai-studio": {
    maxSizeMB: 2000,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "files-api",
  },
  gemini: {
    maxSizeMB: 2000,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "files-api",
  },
  "google-ai": {
    maxSizeMB: 2000,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "files-api",
  },
  openai: {
    maxSizeMB: 10,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "files-api",
  },
  // Azure does NOT support native PDF - must convert to images
  azure: {
    maxSizeMB: 10,
    maxPages: 100,
    supportsNative: false,
    requiresCitations: false,
    apiType: "files-api",
  },
  "azure-openai": {
    maxSizeMB: 10,
    maxPages: 100,
    supportsNative: false,
    requiresCitations: false,
    apiType: "files-api",
  },
  litellm: {
    maxSizeMB: 10,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "files-api",
  },
  "openai-compatible": {
    maxSizeMB: 10,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "files-api",
  },
  mistral: {
    maxSizeMB: 10,
    maxPages: 100,
    supportsNative: false,
    requiresCitations: false,
    apiType: "files-api",
  },
  "hugging-face": {
    maxSizeMB: 10,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "files-api",
  },
  huggingface: {
    maxSizeMB: 10,
    maxPages: 100,
    supportsNative: true,
    requiresCitations: false,
    apiType: "files-api",
  },
};

/**
 * Options for PDF to image conversion
 */
export type PDFImageConversionOptions = {
  /** Scale factor for image quality (1-4, default: 2) */
  scale?: number;
  /** Maximum number of pages to convert (default: 20 from PDF_LIMITS.DEFAULT_MAX_PAGES) */
  maxPages?: number;
  /** Output format (png or jpeg, default: png). Note: pdf-to-img outputs PNG, JPEG conversion would require additional processing */
  format?: "png" | "jpeg";
};

/**
 * Result of PDF to image conversion
 */
export type PDFImageConversionResult = {
  /** Array of base64-encoded PNG images (one per page) */
  images: string[];
  /** Number of pages converted */
  pageCount: number;
  /** Total conversion time in milliseconds */
  conversionTimeMs: number;
  /** Any warnings during conversion */
  warnings?: string[];
};

export class PDFProcessor {
  // PDF magic bytes: %PDF-
  private static readonly PDF_SIGNATURE = Buffer.from("%PDF-", "ascii");

  // ============================================================================
  // PDF Validation & Processing
  // ============================================================================

  static async process(
    content: Buffer,
    options?: PDFProcessorOptions,
  ): Promise<FileProcessingResult> {
    const provider = (options?.provider || "unknown").toLowerCase();
    const config = PDF_PROVIDER_CONFIGS[provider];

    if (!this.isValidPDF(content)) {
      throw new Error(
        "Invalid PDF file format. File must start with %PDF- header.",
      );
    }

    if (!config) {
      const supportedProviders = Object.keys(PDF_PROVIDER_CONFIGS).join(", ");

      throw new Error(
        `PDF files are not configured for ${provider} provider.\n` +
          `Configured providers: ${supportedProviders}\n` +
          `Current provider: ${provider}\n\n` +
          `Options:\n` +
          `1. Switch to a configured provider (--provider openai or --provider vertex)\n` +
          `2. Contact support to add ${provider} PDF configuration`,
      );
    }

    const sizeMB = content.length / (1024 * 1024);
    if (sizeMB > config.maxSizeMB) {
      throw new Error(
        `PDF size ${sizeMB.toFixed(2)}MB exceeds ${config.maxSizeMB}MB limit for ${provider}`,
      );
    }

    const metadata = this.extractBasicMetadata(content);

    if (metadata.estimatedPages && metadata.estimatedPages > config.maxPages) {
      logger.warn(
        `[PDF] PDF appears to have ${metadata.estimatedPages}+ pages. ` +
          `${provider} supports up to ${config.maxPages} pages.`,
      );
    }

    if (provider === "bedrock" && options?.bedrockApiMode === "converse") {
      logger.info(
        "[PDF] Using Bedrock Converse API. " +
          "Visual PDF analysis requires citations enabled. " +
          "Text-only mode: ~1,000 tokens/3 pages. " +
          "Visual mode: ~7,000 tokens/3 pages.",
      );
    }

    logger.info("[PDF] ✅ Validated PDF file", {
      provider,
      size: `${sizeMB.toFixed(2)}MB`,
      version: metadata.version,
      estimatedPages: metadata.estimatedPages,
      apiType: config.apiType,
      supportsNative: config.supportsNative,
    });

    return {
      type: "pdf",
      content,
      mimeType: "application/pdf",
      metadata: {
        confidence: 100,
        size: content.length,
        ...metadata,
        provider,
        apiType: config.apiType,
      },
    };
  }

  /**
   * Check if a provider supports native PDF input
   * @param provider - Provider name
   * @returns true if provider can accept PDF directly, false if requires image conversion
   */
  static supportsNativePDF(provider: string): boolean {
    const normalizedProvider = provider.toLowerCase();
    const config = PDF_PROVIDER_CONFIGS[normalizedProvider];
    return config?.supportsNative ?? false;
  }

  static getProviderConfig(provider: string): PDFProviderConfig | null {
    return PDF_PROVIDER_CONFIGS[provider] || null;
  }

  private static isValidPDF(buffer: Buffer): boolean {
    if (buffer.length < 5) {
      return false;
    }
    return buffer.subarray(0, 5).equals(this.PDF_SIGNATURE);
  }

  private static extractBasicMetadata(buffer: Buffer) {
    const headerSize = Math.min(10000, buffer.length);
    const header = buffer.toString("utf-8", 0, headerSize);

    const versionMatch = header.match(/%PDF-(\d\.\d)/);
    const version = versionMatch ? versionMatch[1] : "unknown";

    const pageMatches = header.match(/\/Type\s*\/Page[^s]/g);
    const estimatedPages = pageMatches ? pageMatches.length : null;

    return {
      version,
      estimatedPages,
      filename: undefined,
    };
  }

  static estimateTokens(
    pageCount: number,
    mode: "text-only" | "visual" = "visual",
  ): number {
    if (mode === "text-only") {
      return Math.ceil((pageCount / 3) * 1000);
    } else {
      return Math.ceil((pageCount / 3) * 7000);
    }
  }

  // ============================================================================
  // PDF → Image Conversion (for providers without native PDF support)
  // ============================================================================

  /**
   * Convert a PDF buffer to an array of base64 PNG images
   *
   * This is used automatically when a provider (like Azure, Mistral, Ollama) doesn't
   * support native PDF input but does support image input. The PDF pages are converted
   * to PNG images and sent as vision content.
   *
   * @param pdfBuffer - PDF file content as Buffer
   * @param options - Conversion options
   * @returns Promise with conversion result including base64 images
   *
   * @example
   * ```typescript
   * // Check if conversion is needed
   * if (!PDFProcessor.supportsNativePDF('azure')) {
   *   const result = await PDFProcessor.convertToImages(pdfBuffer, {
   *     scale: 2,
   *     maxPages: 10
   *   });
   *   // Use images in LLM input instead of PDF
   *   options.input.images = result.images;
   * }
   * ```
   */
  static async convertToImages(
    pdfBuffer: Buffer,
    options?: PDFImageConversionOptions,
  ): Promise<PDFImageConversionResult> {
    const startTime = Date.now();
    const {
      scale = 2,
      maxPages = PDF_LIMITS.DEFAULT_MAX_PAGES,
      format = "png",
    } = options || {};
    const images: string[] = [];
    const warnings: string[] = [];

    // ============================================================================
    // INPUT VALIDATION (Security: Prevent malformed/malicious PDF processing)
    // ============================================================================

    // 0. Validate format is supported and case-sensitive
    const SUPPORTED_FORMATS = ["png", "jpeg"] as const;
    type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];
    if (!SUPPORTED_FORMATS.includes(format as SupportedFormat)) {
      throw new Error(
        `Invalid format: "${format}". Supported formats: "png", "jpeg".`,
      );
    }

    // 1. Validate buffer is not empty or too small
    if (!pdfBuffer || pdfBuffer.length < 5) {
      throw new Error(
        "Invalid PDF: Buffer is too small or empty. " +
          "A valid PDF must be at least 5 bytes (PDF header).",
      );
    }

    // 2. Validate PDF magic bytes (%PDF-)
    if (!this.isValidPDF(pdfBuffer)) {
      throw new Error(
        "Invalid PDF: File must start with %PDF- header. " +
          "The provided buffer does not appear to be a valid PDF file.",
      );
    }

    // 3. Validate maximum buffer size to prevent memory exhaustion
    const sizeMB = pdfBuffer.length / (1024 * 1024);
    if (sizeMB > PDF_LIMITS.MAX_SIZE_MB) {
      throw new Error(
        `PDF too large for image conversion: ${sizeMB.toFixed(2)}MB exceeds ${PDF_LIMITS.MAX_SIZE_MB}MB limit. ` +
          "Consider splitting the PDF or using a provider with native PDF support.",
      );
    }

    logger.debug("[PDF→Image] ✅ PDF validation passed", {
      bufferSize: pdfBuffer.length,
      sizeMB: sizeMB.toFixed(2),
      maxPages,
    });

    try {
      // Dynamic import to avoid loading MuPDF binaries until needed
      const pdfToImgModule = await import("pdf-to-img");
      const pdf = pdfToImgModule.pdf;

      logger.debug("[PDF→Image] Starting PDF to image conversion", {
        bufferSize: pdfBuffer.length,
        scale,
        maxPages: maxPages || "all",
      });

      // Create PDF document iterator
      const document = await pdf(pdfBuffer, { scale });

      let pageIndex = 0;

      // Iterate through pages and convert to base64
      for await (const page of document) {
        // Check if we've reached the max pages limit
        if (maxPages !== undefined && pageIndex >= maxPages) {
          warnings.push(
            `Stopped at page ${pageIndex} (maxPages limit: ${maxPages})`,
          );
          break;
        }

        // Convert PNG buffer to base64
        const base64Image = page.toString("base64");
        images.push(base64Image);
        pageIndex++;

        logger.debug(`[PDF→Image] Converted page ${pageIndex}`, {
          imageSizeBytes: page.length,
          base64Length: base64Image.length,
        });
      }

      // Check for empty PDF (0 pages)
      if (images.length === 0) {
        throw new Error("PDF has 0 pages. Cannot convert empty PDF to images.");
      }

      const conversionTimeMs = Date.now() - startTime;

      logger.info("[PDF→Image] ✅ PDF conversion completed", {
        pageCount: images.length,
        conversionTimeMs,
        totalImageBytes: images.reduce((sum, img) => sum + img.length, 0),
      });

      return {
        images,
        pageCount: images.length,
        conversionTimeMs,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      const conversionTimeMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("[PDF→Image] ❌ PDF conversion failed", {
        error: errorMessage,
        conversionTimeMs,
      });

      throw new Error(`PDF to image conversion failed: ${errorMessage}`);
    }
  }

  /**
   * Convert a PDF file path to an array of base64 PNG images
   *
   * @param pdfPath - Path to the PDF file
   * @param options - Conversion options
   * @returns Promise with conversion result
   */
  static async convertFromPath(
    pdfPath: string,
    options?: PDFImageConversionOptions,
  ): Promise<PDFImageConversionResult> {
    const fs = await import("fs/promises");
    const pdfBuffer = await fs.readFile(pdfPath);
    return this.convertToImages(pdfBuffer, options);
  }

  /**
   * Check if PDF to image conversion is available
   * Useful for feature detection
   *
   * @returns true if pdf-to-img package is available
   */
  static async isImageConversionAvailable(): Promise<boolean> {
    try {
      await import("pdf-to-img");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get estimated memory usage for converting a PDF
   *
   * @param pdfSizeBytes - Size of PDF file in bytes
   * @param pageCount - Estimated number of pages
   * @param scale - Scale factor
   * @returns Estimated memory usage in MB
   */
  static estimateConversionMemoryUsage(
    pdfSizeBytes: number,
    pageCount: number,
    scale: number = 2,
  ): number {
    // Rough estimation:
    // - Each page at scale 2 produces ~1-3MB PNG
    // - MuPDF needs ~2x PDF size for processing
    // - Output images need ~2MB per page on average

    const pdfProcessingMB = (pdfSizeBytes / (1024 * 1024)) * 2;
    const outputImagesMB = pageCount * 2 * scale;

    return Math.ceil(pdfProcessingMB + outputImagesMB);
  }

  /**
   * Get list of providers that require PDF → Image conversion
   */
  static getImageFallbackProviders(): string[] {
    return Object.entries(PDF_PROVIDER_CONFIGS)
      .filter(([_, config]) => !config.supportsNative)
      .map(([name]) => name);
  }

  /**
   * Get list of providers that support native PDF
   */
  static getNativePDFProviders(): string[] {
    return Object.entries(PDF_PROVIDER_CONFIGS)
      .filter(([_, config]) => config.supportsNative)
      .map(([name]) => name);
  }

  // ============================================================================
  // Aggregate PDF Validation (for multiple PDFs in a single request)
  // ============================================================================

  /**
   * Validate aggregate limits across multiple PDFs
   *
   * This prevents users from bypassing per-PDF limits by sending many small PDFs.
   * For example, sending 100 one-page PDFs instead of 1 hundred-page PDF.
   *
   * @param pdfFiles - Array of PDF file info (buffer, filename, pageCount)
   * @param options - Optional configuration for custom limits
   * @returns Validation result with totals, warnings, and any error
   *
   * @example
   * ```typescript
   * const result = PDFProcessor.validateAggregateLimits([
   *   { buffer: pdf1Buffer, filename: 'doc1.pdf', pageCount: 10 },
   *   { buffer: pdf2Buffer, filename: 'doc2.pdf', pageCount: 20 },
   * ]);
   *
   * if (!result.isValid) {
   *   throw new Error(result.error);
   * }
   *
   * // Log warnings if approaching limits
   * result.warnings.forEach(warning => logger.warn(warning));
   * ```
   */
  static validateAggregateLimits(
    pdfFiles: PDFFileInfo[],
    options?: {
      maxTotalSizeMB?: number;
      maxTotalPages?: number;
      warningThreshold?: number;
    },
  ): AggregatePDFValidationResult {
    const maxTotalSizeMB =
      options?.maxTotalSizeMB ?? PDF_LIMITS.AGGREGATE.MAX_TOTAL_SIZE_MB;
    const maxTotalPages =
      options?.maxTotalPages ?? PDF_LIMITS.AGGREGATE.MAX_TOTAL_PAGES;
    const warningThreshold =
      options?.warningThreshold ?? PDF_LIMITS.AGGREGATE.WARNING_THRESHOLD;

    const warnings: string[] = [];
    let totalSizeBytes = 0;
    let totalPages = 0;

    // Calculate aggregates
    for (const pdf of pdfFiles) {
      totalSizeBytes += pdf.buffer.length;
      totalPages += pdf.pageCount ?? 0;
    }

    const totalSizeMB = totalSizeBytes / (1024 * 1024);
    const pdfCount = pdfFiles.length;

    // Check for aggregate size limit violation
    if (totalSizeMB > maxTotalSizeMB) {
      const fileList = pdfFiles
        .map(
          (p) =>
            `  - ${p.filename}: ${(p.buffer.length / (1024 * 1024)).toFixed(2)}MB`,
        )
        .join("\n");

      return {
        isValid: false,
        totalSizeMB,
        totalPages,
        pdfCount,
        warnings,
        error:
          `Aggregate PDF size (${totalSizeMB.toFixed(2)}MB) exceeds the maximum limit of ${maxTotalSizeMB}MB.\n` +
          `You have ${pdfCount} PDF(s) with a combined size that exceeds the limit.\n` +
          `Individual PDF sizes:\n${fileList}\n\n` +
          `Options:\n` +
          `1. Reduce the number of PDFs in a single request\n` +
          `2. Compress or split large PDFs\n` +
          `3. Process PDFs in separate requests`,
      };
    }

    // Check for aggregate page limit violation
    if (totalPages > maxTotalPages) {
      const fileList = pdfFiles
        .map((p) => `  - ${p.filename}: ${p.pageCount ?? "unknown"} pages`)
        .join("\n");

      return {
        isValid: false,
        totalSizeMB,
        totalPages,
        pdfCount,
        warnings,
        error:
          `Aggregate PDF page count (${totalPages}) exceeds the maximum limit of ${maxTotalPages} pages.\n` +
          `You have ${pdfCount} PDF(s) with a combined page count that exceeds the limit.\n` +
          `Individual PDF page counts:\n${fileList}\n\n` +
          `Options:\n` +
          `1. Reduce the number of PDFs in a single request\n` +
          `2. Use PDFs with fewer pages\n` +
          `3. Process PDFs in separate requests`,
      };
    }

    // Check for warning thresholds (approaching limits)
    const sizeRatio = totalSizeMB / maxTotalSizeMB;
    const pageRatio = totalPages / maxTotalPages;

    if (sizeRatio >= warningThreshold) {
      warnings.push(
        `[PDF] ⚠️ Aggregate PDF size (${totalSizeMB.toFixed(2)}MB) is approaching the limit of ${maxTotalSizeMB}MB ` +
          `(${(sizeRatio * 100).toFixed(0)}% used)`,
      );
    }

    if (pageRatio >= warningThreshold && totalPages > 0) {
      warnings.push(
        `[PDF] ⚠️ Aggregate PDF page count (${totalPages}) is approaching the limit of ${maxTotalPages} pages ` +
          `(${(pageRatio * 100).toFixed(0)}% used)`,
      );
    }

    // Log aggregate info for debugging
    logger.debug("[PDF] Aggregate validation passed", {
      pdfCount,
      totalSizeMB: totalSizeMB.toFixed(2),
      totalPages,
      maxTotalSizeMB,
      maxTotalPages,
    });

    return {
      isValid: true,
      totalSizeMB,
      totalPages,
      pdfCount,
      warnings,
    };
  }

  /**
   * Validate and throw if aggregate limits are exceeded
   *
   * Convenience method that throws an error if validation fails.
   * Use this for simple validation where you want to immediately reject invalid requests.
   *
   * @param pdfFiles - Array of PDF file info
   * @param options - Optional configuration for custom limits
   * @throws Error if aggregate limits are exceeded
   */
  static assertAggregateLimits(
    pdfFiles: PDFFileInfo[],
    options?: {
      maxTotalSizeMB?: number;
      maxTotalPages?: number;
      warningThreshold?: number;
    },
  ): void {
    const result = this.validateAggregateLimits(pdfFiles, options);

    // Log warnings even if validation passes
    for (const warning of result.warnings) {
      logger.warn(warning);
    }

    if (!result.isValid && result.error) {
      throw new Error(result.error);
    }

    // Log success for multiple PDFs
    if (result.pdfCount > 1) {
      logger.info(
        `[PDF] ✅ Aggregate validation passed for ${result.pdfCount} PDFs ` +
          `(${result.totalSizeMB.toFixed(2)}MB total, ${result.totalPages} pages)`,
      );
    }
  }
}

// Export PDFImageConverter as an alias for backward compatibility
export const PDFImageConverter = PDFProcessor;
