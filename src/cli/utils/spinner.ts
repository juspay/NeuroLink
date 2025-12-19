/**
 * CLI Spinner Utility
 * Provides progress indicators for file processing operations
 */

import ora, { type Ora } from "ora";
import chalk from "chalk";
import { basename } from "path";

/**
 * File type to emoji mapping for visual indicators
 */
const FILE_TYPE_EMOJI: Record<string, string> = {
  docx: "📄",
  pptx: "📊",
  xlsx: "📈",
  pdf: "📕",
  csv: "📋",
  image: "🖼️",
  video: "🎬",
  audio: "🎵",
};

/**
 * Get appropriate emoji for file extension
 */
function getFileEmoji(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return FILE_TYPE_EMOJI[ext || ""] || "📁";
}

/**
 * Extract filename from path or URL
 */
function extractFilename(input: string | Buffer): string {
  if (Buffer.isBuffer(input)) {
    return "buffer";
  }

  // Handle URLs
  if (input.startsWith("http://") || input.startsWith("https://")) {
    try {
      const url = new URL(input);
      const path = url.pathname;
      return basename(path) || "remote-file";
    } catch {
      return "remote-file";
    }
  }

  // Handle file paths
  return basename(input);
}

/**
 * Get file type label from extension
 */
function getFileTypeLabel(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  const labels: Record<string, string> = {
    docx: "DOCX",
    pptx: "PPTX",
    xlsx: "XLSX",
    pdf: "PDF",
    csv: "CSV",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    mp4: "video",
    webm: "video",
    mov: "video",
    avi: "video",
    mkv: "video",
  };

  return labels[ext || ""] || "file";
}

/**
 * Show processing spinner for a file
 *
 * @param file - File path, URL, or Buffer
 * @param quiet - Whether to suppress spinner output
 * @returns Spinner instance or null if quiet mode
 *
 * @example
 * ```typescript
 * const spinner = showProcessingSpinner("document.docx");
 * try {
 *   // Process file...
 *   spinner?.succeed("Processed document.docx");
 * } catch (error) {
 *   spinner?.fail("Failed to process document.docx");
 * }
 * ```
 */
export function showProcessingSpinner(
  file: string | Buffer,
  quiet: boolean = false,
): Ora | null {
  if (quiet) {
    return null;
  }

  const filename = extractFilename(file);
  const emoji = getFileEmoji(filename);
  const fileType = getFileTypeLabel(filename);

  return ora(
    `${emoji} Processing ${fileType}... ${chalk.dim(filename)}`,
  ).start();
}

/**
 * Show processing spinner for multiple files
 *
 * @param files - Array of file paths, URLs, or Buffers
 * @param quiet - Whether to suppress spinner output
 * @returns Object with methods to update progress
 *
 * @example
 * ```typescript
 * const progress = showMultiFileSpinner(["doc1.docx", "doc2.pptx"]);
 *
 * progress.updateFile("doc1.docx", "success");
 * progress.updateFile("doc2.pptx", "error", "Invalid format");
 * progress.complete();
 * ```
 */
export function showMultiFileSpinner(
  files: Array<string | Buffer>,
  quiet: boolean = false,
): {
  updateFile: (
    file: string | Buffer,
    status: "success" | "error",
    message?: string,
  ) => void;
  complete: () => void;
  spinner: Ora | null;
} {
  if (quiet || files.length === 0) {
    return {
      updateFile: () => {},
      complete: () => {},
      spinner: null,
    };
  }

  const fileCount = files.length;
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;

  const spinner = ora(
    `Processing ${fileCount} file${fileCount > 1 ? "s" : ""}...`,
  ).start();

  return {
    spinner,
    updateFile: (
      file: string | Buffer,
      status: "success" | "error",
      message?: string,
    ) => {
      processedCount++;

      if (status === "success") {
        successCount++;
      } else {
        errorCount++;
      }

      const filename = extractFilename(file);
      const emoji = getFileEmoji(filename);
      const fileType = getFileTypeLabel(filename);

      if (status === "success") {
        spinner.text =
          `${emoji} ✓ ${fileType}: ${chalk.dim(filename)}\n` +
          `Processing ${fileCount} file${fileCount > 1 ? "s" : ""}... ` +
          chalk.dim(`[${processedCount}/${fileCount}]`);
      } else {
        const errorMsg = message ? `: ${message}` : "";
        spinner.text =
          `${emoji} ✗ ${fileType}: ${chalk.dim(filename)}${chalk.red(errorMsg)}\n` +
          `Processing ${fileCount} file${fileCount > 1 ? "s" : ""}... ` +
          chalk.dim(`[${processedCount}/${fileCount}]`);
      }
    },
    complete: () => {
      if (errorCount === 0) {
        spinner.succeed(
          chalk.green(
            `✅ Processed ${successCount} file${successCount !== 1 ? "s" : ""} successfully`,
          ),
        );
      } else if (successCount === 0) {
        spinner.fail(
          chalk.red(
            `❌ Failed to process ${errorCount} file${errorCount !== 1 ? "s" : ""}`,
          ),
        );
      } else {
        spinner.warn(
          chalk.yellow(
            `⚠️ Processed ${successCount} file${successCount !== 1 ? "s" : ""}, ` +
              `${errorCount} failed`,
          ),
        );
      }
    },
  };
}

/**
 * Show processing spinner for office documents specifically
 * Convenience wrapper for DOCX, PPTX, XLSX files
 *
 * @param file - Office file path, URL, or Buffer
 * @param quiet - Whether to suppress spinner output
 * @returns Spinner instance or null if quiet mode
 */
export function showOfficeFileSpinner(
  file: string | Buffer,
  quiet: boolean = false,
): Ora | null {
  return showProcessingSpinner(file, quiet);
}
