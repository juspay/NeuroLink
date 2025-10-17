/**
 * Direct Tool Definitions for NeuroLink CLI Agent
 * Simple, reliable tools that work immediately with Vercel AI SDK
 */

import { tool } from "ai";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../utils/logger.js";
import { VertexAI } from "@google-cloud/vertexai";
import { CSVProcessor } from "../utils/csvProcessor.js";

/**
 * File size limits for safe file reading
 * Extracted as constants for maintainability and easy tuning
 */
const FILE_SIZE_LIMITS = {
  TINY_FILE: 50 * 1024, // 50KB - safe to read entirely
  SMALL_FILE: 200 * 1024, // 200KB - read with caution
  MEDIUM_FILE: 1 * 1024 * 1024, // 1MB - use streaming/chunking
  LARGE_FILE: 10 * 1024 * 1024, // 10MB - preview mode only
  MAXIMUM_SAFE: 100 * 1024 * 1024, // 100MB - absolute limit
} as const;

/**
 * Binary content detection pattern
 * Detects non-printable characters that indicate binary files
 */
// eslint-disable-next-line no-control-regex
const BINARY_CONTENT_PATTERN = /[\x00-\x08\x0E-\x1F\x7F-\xFF]/;

// Runtime Google Search tool creation - bypasses TypeScript strict typing
function createGoogleSearchTools() {
  const searchTool = {};
  // Dynamically assign google_search property at runtime
  Object.defineProperty(searchTool, "google_search", {
    value: {},
    enumerable: true,
    configurable: true,
  });
  return [searchTool];
}
/**
 * Direct tool definitions that work immediately with Gemini/AI SDK
 * These bypass MCP complexity and provide reliable agent functionality
 */
export const directAgentTools = {
  getCurrentTime: tool({
    description: "Get the current date and time",
    parameters: z.object({
      timezone: z
        .string()
        .optional()
        .describe(
          'Timezone (e.g., "America/New_York", "Asia/Kolkata"). Defaults to system local time.',
        ),
    }),
    execute: async ({ timezone }) => {
      try {
        const now = new Date();
        if (timezone) {
          return {
            success: true,
            time: now.toLocaleString("en-US", { timeZone: timezone }),
            timezone: timezone,
            iso: now.toISOString(),
          };
        }
        return {
          success: true,
          time: now.toLocaleString(),
          iso: now.toISOString(),
          timestamp: now.getTime(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  }),

  readFile: tool({
    description:
      "Read the contents of a file from the filesystem. Intelligently handles large files with safe reading strategies and provides processing recommendations.",
    parameters: z.object({
      path: z.string().describe("File path to read (relative or absolute)"),
    }),
    execute: async ({ path: filePath }) => {
      try {
        // Security check - prevent reading outside current directory for relative paths
        const resolvedPath = path.resolve(filePath);
        const cwd = process.cwd();

        if (!resolvedPath.startsWith(cwd) && !path.isAbsolute(filePath)) {
          return {
            success: false,
            error: `Access denied: Cannot read files outside current directory`,
          };
        }

        // INTELLIGENT ENHANCEMENT: Check file metadata first
        if (!fs.existsSync(resolvedPath)) {
          return {
            success: false,
            error: `File does not exist: ${resolvedPath}`,
            path: filePath,
          };
        }

        const stats = fs.statSync(resolvedPath);

        // INTELLIGENT ENHANCEMENT: Handle directories
        if (stats.isDirectory()) {
          return {
            success: false,
            error: `Cannot read directory as file: ${resolvedPath}. Use listDirectory instead.`,
            path: filePath,
          };
        }

        // INTELLIGENT ENHANCEMENT: File size analysis and safe reading
        const fileSize = stats.size;

        // INTELLIGENT ENHANCEMENT: Binary file detection
        const extension = path.extname(resolvedPath).toLowerCase();
        const BINARY_EXTENSIONS = new Set([
          ".exe",
          ".bin",
          ".dll",
          ".so",
          ".dylib",
          ".app",
          ".zip",
          ".tar",
          ".gz",
          ".rar",
          ".7z",
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".bmp",
          ".webp",
          ".mp4",
          ".avi",
          ".mov",
          ".wmv",
          ".flv",
          ".mkv",
          ".mp3",
          ".wav",
          ".flac",
          ".aac",
          ".ogg",
          ".pdf",
          ".doc",
          ".docx",
          ".xls",
          ".xlsx",
          ".ppt",
          ".pptx",
          ".dmg",
          ".iso",
          ".img",
        ]);

        if (BINARY_EXTENSIONS.has(extension)) {
          return {
            success: false,
            error: `Cannot read binary file as text: ${resolvedPath}. File appears to be binary based on extension ${extension}.`,
            path: filePath,
          };
        }

        // INTELLIGENT ENHANCEMENT: Size-based processing with safe limits
        if (fileSize > FILE_SIZE_LIMITS.MAXIMUM_SAFE) {
          return {
            success: false,
            error: `File too large to read safely (${(fileSize / (1024 * 1024)).toFixed(2)}MB). Maximum safe size is 100MB. Use chunkDocument for large file processing.`,
            path: filePath,
            size: fileSize,
            lastModified: stats.mtime.toISOString(),
            recommendation:
              "Use chunkDocument tool for large file processing with intelligent chunking",
          };
        }

        let content: string;
        let processingStrategy: string;
        const warnings: string[] = [];

        if (fileSize <= FILE_SIZE_LIMITS.TINY_FILE) {
          // Direct read for tiny files only
          content = fs.readFileSync(resolvedPath, "utf-8");
          processingStrategy = "direct_read";
        } else if (fileSize <= FILE_SIZE_LIMITS.SMALL_FILE) {
          // Buffered read for small files
          const buffer = fs.readFileSync(resolvedPath);
          content = buffer.toString("utf-8");
          processingStrategy = "buffered_read";
          warnings.push("Small file - using buffered read for safety.");
        } else if (fileSize <= FILE_SIZE_LIMITS.MEDIUM_FILE) {
          // Streaming read for medium files
          const chunks: string[] = [];
          const stream = fs.createReadStream(resolvedPath, {
            encoding: "utf-8",
            highWaterMark: 64 * 1024, // 64KB chunks
          });

          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          content = chunks.join("");
          processingStrategy = "streaming_read";
          warnings.push(
            "Medium file - using streaming read for memory efficiency.",
          );
        } else {
          // Large file preview mode
          const previewSize = 10 * 1024; // 10KB preview
          const buffer = Buffer.alloc(previewSize);
          const fd = fs.openSync(resolvedPath, "r");
          const bytesRead = fs.readSync(fd, buffer, 0, previewSize, 0);
          fs.closeSync(fd);

          // Check for binary content on buffer BEFORE converting to string
          // This is more memory efficient for large files
          const previewBuffer = buffer.subarray(0, Math.min(1000, bytesRead));
          if (BINARY_CONTENT_PATTERN.test(previewBuffer.toString("utf-8"))) {
            return {
              success: false,
              error: `Binary content detected in file: ${resolvedPath}. This appears to be a binary file that cannot be read as text.`,
              path: filePath,
              size: fileSize,
              lastModified: stats.mtime.toISOString(),
            };
          }
          
          content = buffer.subarray(0, bytesRead).toString("utf-8");
          processingStrategy = "preview_mode";
          warnings.push(
            `Large file detected (${(fileSize / (1024 * 1024)).toFixed(2)}MB). Showing first 10KB preview only. Use chunkDocument for full processing.`,
          );
        }

        // Binary check for non-preview files (already read into memory)
        if (processingStrategy !== "preview_mode" && BINARY_CONTENT_PATTERN.test(content.substring(0, 1000))) {
          return {
            success: false,
            error: `Binary content detected in file: ${resolvedPath}. This appears to be a binary file that cannot be read as text.`,
            path: filePath,
            size: fileSize,
            lastModified: stats.mtime.toISOString(),
          };
        }
        const result: {
          success: boolean;
          content: string;
          size: number;
          path: string;
          lastModified: string;
          metadata?: Record<string, unknown>;
        } = {
          success: true,
          content,
          size: fileSize,
          path: resolvedPath,
          lastModified: stats.mtime.toISOString(),
        };
        // INTELLIGENT ENHANCEMENT: Always provide processing recommendations
        const sizeCategory =
          fileSize <= FILE_SIZE_LIMITS.TINY_FILE
            ? "tiny"
            : fileSize <= FILE_SIZE_LIMITS.SMALL_FILE
              ? "small"
              : fileSize <= FILE_SIZE_LIMITS.MEDIUM_FILE
                ? "medium"
                : "large";

        // Generate intelligent recommendations based on file characteristics
        let recommendation = "";
        let suggestedTools = [];

        if (fileSize <= FILE_SIZE_LIMITS.SMALL_FILE) {
          recommendation =
            "File is small enough for direct analysis. You can proceed with reading and analyzing the content.";
          suggestedTools = ["direct_analysis"];
        } else if (fileSize <= FILE_SIZE_LIMITS.MEDIUM_FILE) {
          recommendation =
            "File is medium-sized. For comprehensive analysis, use chunkDocument tool to break it into manageable pieces, then summarizeChunks for overview.";
          suggestedTools = ["chunkDocument", "summarizeChunks"];
        } else if (fileSize <= FILE_SIZE_LIMITS.LARGE_FILE) {
          recommendation =
            "Large file detected. This preview shows first 10KB only. Use chunkDocument with smaller chunk sizes (e.g., 50000) for systematic processing.";
          suggestedTools = ["chunkDocument"];
        } else {
          recommendation =
            "Very large file. Use chunkDocument tool with appropriate chunk sizes for systematic processing. Consider processing in smaller sections.";
          suggestedTools = ["chunkDocument"];
        }

        result.metadata = {
          processingStrategy,
          fileType: extension || "unknown",
          sizeCategory,
          sizeMB: (fileSize / (1024 * 1024)).toFixed(2),
          recommendation,
          suggestedTools,
          ...(warnings.length > 0 && { warnings }),
          ...(processingStrategy === "preview_mode" && {
            isPreview: true,
            remainingSize: fileSize - content.length,
            fullFileSize: fileSize,
            previewPercentage: ((content.length / fileSize) * 100).toFixed(1),
          }),
        };
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          path: filePath,
        };
      }
    },
  }),

  listDirectory: tool({
    description: "List files and directories in a specified directory",
    parameters: z.object({
      path: z
        .string()
        .describe("Directory path to list (relative or absolute)"),
      includeHidden: z
        .boolean()
        .optional()
        .default(false)
        .describe("Include hidden files (starting with .)"),
    }),
    execute: async ({ path: dirPath, includeHidden }) => {
      try {
        const resolvedPath = path.resolve(dirPath);
        const items = fs.readdirSync(resolvedPath);

        const filteredItems = includeHidden
          ? items
          : items.filter((item) => !item.startsWith("."));

        const itemDetails = filteredItems.map((item) => {
          const itemPath = path.join(resolvedPath, item);
          const stats = fs.statSync(itemPath);

          return {
            name: item,
            type: stats.isDirectory() ? "directory" : "file",
            size: stats.isFile() ? stats.size : undefined,
            lastModified: stats.mtime.toISOString(),
          };
        });

        return {
          success: true,
          path: resolvedPath,
          items: itemDetails,
          count: itemDetails.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          path: dirPath,
        };
      }
    },
  }),

  calculateMath: tool({
    description: "Perform mathematical calculations safely",
    parameters: z.object({
      expression: z
        .string()
        .describe(
          'Mathematical expression to evaluate (e.g., "2 + 2", "Math.sqrt(16)")',
        ),
      precision: z
        .number()
        .optional()
        .describe("Number of decimal places for result")
        .default(2),
    }),
    execute: async ({ expression, precision }) => {
      try {
        // Simple safe evaluation - only allow basic math operations
        const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, "");

        if (sanitizedExpression !== expression) {
          // Try Math functions for more complex operations
          const allowedMathFunctions = [
            "Math.abs",
            "Math.ceil",
            "Math.floor",
            "Math.round",
            "Math.sqrt",
            "Math.pow",
            "Math.sin",
            "Math.cos",
            "Math.tan",
            "Math.log",
            "Math.exp",
            "Math.PI",
            "Math.E",
          ];

          let safeExpression = expression;
          for (const func of allowedMathFunctions) {
            safeExpression = safeExpression.replace(
              new RegExp(func, "g"),
              func,
            );
          }

          // Remove remaining non-safe characters except Math functions
          const mathSafe =
            /^[0-9+\-*/().\s]|Math\.(abs|ceil|floor|round|sqrt|pow|sin|cos|tan|log|exp|PI|E)/g;
          if (
            !safeExpression
              .split("")
              .every(
                (char) =>
                  mathSafe.test(char) ||
                  char === "(" ||
                  char === ")" ||
                  char === "," ||
                  char === " ",
              )
          ) {
            return {
              success: false,
              error: `Unsafe expression: Only basic math operations and Math functions are allowed`,
            };
          }
        }

        // Use Function constructor for safe evaluation
        const result = new Function(`'use strict'; return (${expression})`)();
        const roundedResult =
          typeof result === "number"
            ? Number(result.toFixed(precision))
            : result;

        return {
          success: true,
          expression,
          result: roundedResult,
          type: typeof result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          expression,
        };
      }
    },
  }),

  writeFile: tool({
    description: "Write content to a file (use with caution)",
    parameters: z.object({
      path: z.string().describe("File path to write to"),
      content: z.string().describe("Content to write to the file"),
      mode: z
        .enum(["create", "overwrite", "append"])
        .default("create")
        .describe("Write mode"),
    }),
    execute: async ({ path: filePath, content, mode }) => {
      try {
        const resolvedPath = path.resolve(filePath);
        const cwd = process.cwd();

        // Security check
        if (!resolvedPath.startsWith(cwd) && !path.isAbsolute(filePath)) {
          return {
            success: false,
            error: `Access denied: Cannot write files outside current directory`,
          };
        }

        // Check if file exists for create mode
        if (mode === "create" && fs.existsSync(resolvedPath)) {
          return {
            success: false,
            error: `File already exists. Use 'overwrite' or 'append' mode to modify existing files.`,
          };
        }

        let finalContent = content;
        if (mode === "append" && fs.existsSync(resolvedPath)) {
          const existingContent = fs.readFileSync(resolvedPath, "utf-8");
          finalContent = existingContent + content;
        }

        fs.writeFileSync(resolvedPath, finalContent, "utf-8");
        const stats = fs.statSync(resolvedPath);

        return {
          success: true,
          path: resolvedPath,
          mode,
          size: stats.size,
          written: content.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          path: filePath,
        };
      }
    },
  }),

  searchFiles: tool({
    description: "Search for files by name pattern in a directory",
    parameters: z.object({
      directory: z.string().describe("Directory to search in"),
      pattern: z
        .string()
        .describe(
          "File name pattern to search for (supports wildcards like *.js)",
        ),
      recursive: z
        .boolean()
        .optional()
        .default(true)
        .describe("Search recursively in subdirectories"),
    }),
    execute: async ({ directory, pattern, recursive }) => {
      try {
        const resolvedDir = path.resolve(directory);

        if (!fs.existsSync(resolvedDir)) {
          return {
            success: false,
            error: `Directory does not exist: ${resolvedDir}`,
          };
        }

        const matches: Array<{
          name: string;
          path: string;
          size: number;
          lastModified: string;
        }> = [];

        const searchDir = (dir: string, depth = 0) => {
          if (!recursive && depth > 0) {
            return;
          }

          const items = fs.readdirSync(dir);

          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
              if (recursive && depth < 10) {
                // Prevent infinite recursion
                searchDir(itemPath, depth + 1);
              }
            } else if (stats.isFile()) {
              // Simple pattern matching (convert * to regex)
              const regexPattern = pattern
                .replace(/\*/g, ".*")
                .replace(/\?/g, ".");
              const regex = new RegExp(`^${regexPattern}$`, "i");

              if (regex.test(item)) {
                matches.push({
                  name: item,
                  path: itemPath,
                  size: stats.size,
                  lastModified: stats.mtime.toISOString(),
                });
              }
            }
          }
        };

        searchDir(resolvedDir);

        return {
          success: true,
          directory: resolvedDir,
          pattern,
          matches,
          count: matches.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          directory,
          pattern,
        };
      }
    },
  }),
  analyzeCSV: tool({
    description:
      "Analyze CSV files with operations like count_by_column, sum_by_column, average_by_column, min_max_by_column, or describe. REQUIRED PARAMETERS: filePath (string), operation (string). OPTIONAL: column (string, required for all operations except 'describe'), maxRows (number). For operations 'count_by_column', 'sum_by_column', 'average_by_column', and 'min_max_by_column', you MUST provide the column parameter. For 'describe', column is not needed. EXAMPLE: {filePath: 'data.csv', operation: 'min_max_by_column', column: 'price'} finds min and max prices. The tool reads files directly. IMPORTANT: After calling this tool, you MUST explain the results to the user in natural language.",
    parameters: z.object({
      filePath: z
        .string()
        .refine(
          (inputPath) => {
            const resolvedPath = path.resolve(inputPath);
            const normalizedPath = resolvedPath
              .toLowerCase()
              .replace(/\\/g, "/");

            const sensitivePatterns = [
              "/etc/",
              "/sys/",
              "/proc/",
              "/dev/",
              "/root/",
              "/.ssh/",
              "/private/etc/",
              "/private/var/",
              "c:/windows/",
              "c:/program files/",
              "c:/programdata/",
            ];

            return !sensitivePatterns.some((pattern) =>
              normalizedPath.startsWith(pattern),
            );
          },
          {
            message:
              "Invalid file path: access to system directories is not allowed",
          },
        )
        .describe(
          "Path to the CSV file to analyze (e.g., 'test/data.csv' or '/absolute/path/file.csv')",
        ),
      operation: z
        .enum([
          "count_by_column",
          "sum_by_column",
          "average_by_column",
          "min_max_by_column",
          "describe",
        ])
        .describe("Type of analysis to perform"),
      column: z
        .string()
        .optional()
        .default("")
        .describe(
          "Column name for the operation (required for most operations)",
        ),
      maxRows: z
        .number()
        .optional()
        .default(1000)
        .describe("Maximum rows to process (default: 1000)"),
    }),
    execute: async ({ filePath, operation, column, maxRows = 1000 }) => {
      const startTime = Date.now();
      logger.info(
        `[analyzeCSV] 🚀 START: file=${filePath}, operation=${operation}, column=${column}, maxRows=${maxRows}`,
      );

      try {
        // Resolve file path
        logger.debug(`[analyzeCSV] Resolving file: ${filePath}`);
        const path = await import("path");

        // Resolve path (support both relative and absolute)
        const resolvedPath = path.isAbsolute(filePath)
          ? filePath
          : path.resolve(process.cwd(), filePath);

        logger.debug(`[analyzeCSV] Resolved path: ${resolvedPath}`);

        // Parse CSV using streaming from disk (memory efficient)
        logger.info(
          `[analyzeCSV] Starting CSV parsing (max ${maxRows} rows)...`,
        );
        const rows = (await CSVProcessor.parseCSVFile(
          resolvedPath,
          maxRows,
        )) as Array<Record<string, string>>;
        logger.info(
          `[analyzeCSV] ✅ CSV parsing complete: ${rows.length} rows`,
        );

        if (rows.length === 0) {
          logger.warn(`[analyzeCSV] No data rows found`);
          return {
            success: false,
            error: "No data rows found in CSV",
          };
        }

        // Log column names
        const columnNames = rows.length > 0 ? Object.keys(rows[0]) : [];
        logger.info(
          `[analyzeCSV] Found ${rows.length} rows with columns:`,
          columnNames,
        );
        logger.info(`[analyzeCSV] Executing operation: ${operation}`);
        let result: unknown;

        switch (operation) {
          case "count_by_column": {
            logger.info(`[analyzeCSV] count_by_column: column=${column}`);
            if (!column) {
              return {
                success: false,
                error: "Column name required for count_by_column operation",
              };
            }

            // Count occurrences of each value in the column
            const counts: Record<string, number> = {};
            logger.debug(`[analyzeCSV] Counting rows...`);
            for (const row of rows) {
              const value = row[column];
              if (value !== undefined) {
                counts[value] = (counts[value] || 0) + 1;
              }
            }
            logger.debug(
              `[analyzeCSV] Found ${Object.keys(counts).length} unique values`,
            );

            // Sort by count descending
            logger.debug(`[analyzeCSV] Sorting results...`);
            result = Object.fromEntries(
              Object.entries(counts).sort(([, a], [, b]) => b - a),
            );
            logger.info(
              `[analyzeCSV] ✅ count_by_column complete. Result:`,
              result,
            );
            break;
          }

          case "sum_by_column": {
            logger.info(`[analyzeCSV] sum_by_column: column=${column}`);
            if (!column) {
              return {
                success: false,
                error: "Column name required for sum_by_column operation",
              };
            }

            // Sum numeric values from the target column itself for each group
            const groups: Record<string, number> = {};
            logger.debug(
              `[analyzeCSV] Grouping and summing ${rows.length} rows...`,
            );
            let processedRows = 0;
            let totalNumericValuesFound = 0;

            for (const row of rows) {
              const key = row[column];
              if (!key) {
                continue;
              }

              // Parse numeric value from the target column
              const value = row[column];
              if (value === undefined || value === null || value === "") {
                continue;
              }

              const num = parseFloat(value);
              if (isNaN(num)) {
                continue;
              }

              if (!groups[key]) {
                groups[key] = 0;
              }
              groups[key] += num;
              totalNumericValuesFound++;

              processedRows++;
              if (processedRows % 10 === 0) {
                logger.debug(
                  `[analyzeCSV] Processed ${processedRows}/${rows.length} rows`,
                );
              }
            }

            // Fail fast if no numeric data found in the requested column
            if (totalNumericValuesFound === 0) {
              return {
                success: false,
                error: `No numeric data found in column "${column}" for sum_by_column operation`,
              };
            }

            logger.debug(
              `[analyzeCSV] Calculated sums for ${Object.keys(groups).length} groups (${totalNumericValuesFound} numeric values)`,
            );

            result = groups;
            logger.info(`[analyzeCSV] ✅ sum_by_column complete`);
            break;
          }

          case "average_by_column": {
            logger.info(`[analyzeCSV] average_by_column: column=${column}`);
            if (!column) {
              return {
                success: false,
                error: "Column name required for average_by_column operation",
              };
            }

            // Average numeric values from the target column itself for each group
            const groups: Record<string, { sum: number; count: number }> = {};
            logger.debug(
              `[analyzeCSV] Grouping and averaging ${rows.length} rows...`,
            );
            let processedRows = 0;
            let totalNumericValuesFound = 0;

            for (const row of rows) {
              const key = row[column];
              if (!key) {
                continue;
              }

              // Parse numeric value from the target column
              const value = row[column];
              if (value === undefined || value === null || value === "") {
                continue;
              }

              const num = parseFloat(value);
              if (isNaN(num)) {
                continue;
              }

              if (!groups[key]) {
                groups[key] = { sum: 0, count: 0 };
              }
              groups[key].sum += num;
              groups[key].count++;
              totalNumericValuesFound++;

              processedRows++;
              if (processedRows % 10 === 0) {
                logger.debug(
                  `[analyzeCSV] Processed ${processedRows}/${rows.length} rows`,
                );
              }
            }

            // Fail fast if no numeric data found in the requested column
            if (totalNumericValuesFound === 0) {
              return {
                success: false,
                error: `No numeric data found in column "${column}" for average_by_column operation`,
              };
            }

            logger.debug(
              `[analyzeCSV] Calculated averages for ${Object.keys(groups).length} groups (${totalNumericValuesFound} numeric values)`,
            );

            result = Object.fromEntries(
              Object.entries(groups).map(([k, v]) => [
                k,
                v.count > 0 ? v.sum / v.count : 0,
              ]),
            );
            logger.info(`[analyzeCSV] ✅ average_by_column complete`);
            break;
          }

          case "min_max_by_column": {
            if (!column) {
              return {
                success: false,
                error: "Column name required for min_max_by_column operation",
              };
            }

            const values = rows
              .map((row) => row[column])
              .filter((v) => v !== undefined && v !== "");

            const numericValues = values
              .map((v) => parseFloat(v))
              .filter((n) => !isNaN(n));

            if (numericValues.length === 0) {
              return {
                success: false,
                error: `No numeric data found in column "${column}" for min_max_by_column operation`,
              };
            }

            result = {
              min: Math.min(...numericValues),
              max: Math.max(...numericValues),
              numericCount: numericValues.length,
              totalCount: values.length,
            };
            break;
          }

          case "describe": {
            const columnNames = rows.length > 0 ? Object.keys(rows[0]) : [];
            result = {
              total_rows: rows.length,
              columns: columnNames,
              column_count: columnNames.length,
            };
            break;
          }

          default:
            return {
              success: false,
              error: `Unknown operation: ${operation}`,
            };
        }

        const duration = Date.now() - startTime;
        logger.info(
          `[analyzeCSV] 🏁 COMPLETE: ${operation} took ${duration}ms`,
        );

        const response = {
          success: true,
          operation,
          column,
          result: result, // Return structured data directly
          rowCount: rows.length,
        };

        logger.debug(
          `[analyzeCSV] 📤 RETURNING TO LLM:`,
          JSON.stringify(response, null, 2),
        );
        return response;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          operation,
          column,
        };
      }
    },
  }),

  chunkDocument: tool({
    description:
      "Split a large document into manageable chunks for processing. Intelligently handles large files by breaking them into smaller pieces with sentence-preserving logic. Use this when you need to process files larger than 200KB. Returns an array of text chunks that can be processed individually or summarized together.",
    parameters: z.object({
      filePath: z.string().describe("Path to the document file to chunk"),
      chunkSize: z
        .number()
        .optional()
        .default(100000)
        .describe(
          "Size of each chunk in characters (default: 100000, recommended: 50000-200000)",
        ),
      overlap: z
        .number()
        .optional()
        .default(2000)
        .describe(
          "Number of characters to overlap between chunks for context continuity (default: 2000)",
        ),
      preserveSentences: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          "Whether to preserve sentence boundaries when chunking (default: true)",
        ),
    }),
    execute: async ({
      filePath,
      chunkSize = 100000,
      overlap = 2000,
      preserveSentences = true,
    }) => {
      try {
        // Read the file
        const resolvedPath = path.resolve(filePath);

        if (!fs.existsSync(resolvedPath)) {
          return {
            success: false,
            error: `File does not exist: ${resolvedPath}`,
          };
        }

        const stats = fs.statSync(resolvedPath);
        if (stats.isDirectory()) {
          return {
            success: false,
            error: `Cannot chunk directory: ${resolvedPath}. Provide a file path.`,
          };
        }

        // Validate overlap to prevent infinite loops
        if (overlap >= chunkSize) {
          return {
            success: false,
            error: `Overlap (${overlap}) must be less than chunkSize (${chunkSize}) to prevent infinite loops`,
          };
        }

        // Read file content asynchronously for better performance
        const content = await fs.promises.readFile(resolvedPath, "utf-8");

        // Chunk the content with sentence preservation
        const chunks: Array<{ content: string; index: number }> = [];
        let currentIndex = 0;

        while (currentIndex < content.length) {
          const remainingText = content.substring(currentIndex);
          let endIndex = Math.min(chunkSize, remainingText.length);

          if (remainingText.length <= chunkSize) {
            chunks.push({ content: remainingText, index: chunks.length });
            break;
          }

          let splitPosition = -1;
          if (preserveSentences) {
            const potentialSplitArea = remainingText.substring(0, endIndex);

            // Look for sentence endings
            for (const boundary of [".", "!", "?"]) {
              const pos = potentialSplitArea.lastIndexOf(boundary);
              if (pos > splitPosition) {
                splitPosition = pos;
              }
            }

            // Fall back to space if no sentence boundary found
            if (splitPosition === -1) {
              const spacePos = potentialSplitArea.lastIndexOf(" ");
              if (spacePos !== -1) {
                splitPosition = spacePos;
              }
            }
          }

          // If no good split position found, use the end index
          if (splitPosition === -1) {
            splitPosition = endIndex - 1;
          }

          endIndex = splitPosition + 1;
          const chunkContent = remainingText.substring(0, endIndex);
          chunks.push({ content: chunkContent, index: chunks.length });

          // Explicitly handle pathological overlap
          if (overlap >= endIndex) {
            logger.warn(
              `Overlap (${overlap}) >= endIndex (${endIndex}) at chunk ${chunks.length}. Forcing overlap to 0 to avoid infinite/slow loop.`
            );
            currentIndex += endIndex; // Advance by full chunk
          } else {
            currentIndex += Math.max(1, endIndex - overlap);
          }
        }

        return {
          success: true,
          filePath: resolvedPath,
          totalSize: content.length,
          chunkSize,
          overlap,
          preserveSentences,
          chunks: chunks.map((c) => c.content),
          chunkCount: chunks.length,
          metadata: {
            fileSize: stats.size,
            fileName: path.basename(resolvedPath),
            chunksCreated: chunks.length,
            averageChunkSize: chunks.length > 0
              ? Math.floor(
                  chunks.reduce((sum, c) => sum + c.content.length, 0) /
                    chunks.length
                )
              : 0,
            sentencePreserved: preserveSentences,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          filePath,
        };
      }
    },
  }),

  summarizeChunks: tool({
    description:
      "Summarize multiple text chunks into a cohesive overview. Use this after chunkDocument to create a comprehensive summary of a large document. Combines individual chunk summaries into a unified understanding with optional focus areas.",
    parameters: z.object({
      chunks: z.array(z.string()).describe("Array of text chunks to summarize"),
      summaryLength: z
        .enum(["brief", "detailed", "comprehensive"])
        .optional()
        .default("detailed")
        .describe(
          "Length of summary: brief (1-2 sentences per chunk), detailed (paragraph per chunk), comprehensive (full analysis)",
        ),
      focusAreas: z
        .array(z.string())
        .optional()
        .describe(
          "Specific areas to focus on in the summary (e.g., ['technical details', 'business impact', 'key findings'])",
        ),
    }),
    execute: async ({ chunks, summaryLength = "detailed", focusAreas }) => {
      try {
        if (!chunks || chunks.length === 0) {
          return {
            success: false,
            error: "No chunks provided to summarize",
          };
        }

        // Create summaries for each chunk
        const chunkSummaries = chunks.map((chunk, index) => {
          const words = chunk.split(/\s+/).length;
          const chars = chunk.length;

          // Extract key information (first and last sentences for context)
          const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [];
          const preview =
            sentences.length > 0
              ? sentences.slice(0, 2).join(" ")
              : chunk.substring(0, 200);

          return {
            chunkIndex: index + 1,
            wordCount: words,
            charCount: chars,
            preview:
              preview.substring(0, 200) + (preview.length > 200 ? "..." : ""),
            keyPoints: sentences.slice(0, 3).map((s) => s.trim()),
          };
        });

        // Create overall summary based on length preference
        let overallSummary = "";
        const totalWords = chunks.reduce(
          (sum, chunk) => sum + chunk.split(/\s+/).length,
          0,
        );
        const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

        switch (summaryLength) {
          case "brief":
            overallSummary = `Document contains ${chunks.length} chunks with ${totalWords} total words. Key content spans ${totalChars} characters.`;
            break;
          case "detailed":
            overallSummary = `Analyzed ${chunks.length} chunks totaling ${totalWords} words (${totalChars} characters). Each chunk averages ${Math.floor(totalWords / chunks.length)} words. Content is structured across multiple sections for comprehensive coverage.`;
            break;
          case "comprehensive":
            overallSummary = `Comprehensive analysis of ${chunks.length} document chunks:\n- Total words: ${totalWords}\n- Total characters: ${totalChars}\n- Average chunk size: ${Math.floor(totalWords / chunks.length)} words\n- Content distribution: ${chunks.length} sections\n- Processing recommendation: Review individual chunk summaries for detailed insights`;
            break;
        }

        // Add focus areas to summary if provided
        let focusAreasSummary = "";
        if (focusAreas && focusAreas.length > 0) {
          focusAreasSummary = `\n\nFocus Areas:\n${focusAreas.map((area) => `- ${area}`).join("\n")}`;
        }

        return {
          success: true,
          chunkCount: chunks.length,
          totalWords,
          totalChars,
          summaryLength,
          focusAreas: focusAreas || [],
          overallSummary: overallSummary + focusAreasSummary,
          chunkSummaries,
          metadata: {
            averageWordsPerChunk: Math.floor(totalWords / chunks.length),
            averageCharsPerChunk: Math.floor(totalChars / chunks.length),
            processingTime: new Date().toISOString(),
            hasFocusAreas: !!(focusAreas && focusAreas.length > 0),
            focusAreasCount: focusAreas?.length || 0,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  }),

  websearchGrounding: tool({
    description:
      "Search the web for current information using Google Search grounding. Returns raw search data for AI processing.",
    parameters: z.object({
      query: z.string().describe("Search query to find information about"),
      maxResults: z
        .number()
        .optional()
        .default(3)
        .describe("Maximum number of search results to return (1-5)"),
      maxWords: z
        .number()
        .optional()
        .default(50)
        .describe("Maximum number of words in the response 50"),
    }),
    execute: async ({ query, maxResults = 3, maxWords = 50 }) => {
      try {
        const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const hasProjectId = process.env.GOOGLE_VERTEX_PROJECT;
        const projectLocation =
          process.env.GOOGLE_VERTEX_LOCATION || "us-central1";

        if (!hasCredentials || !hasProjectId) {
          return {
            success: false,
            error:
              "Google Vertex AI credentials not configured. Please set GOOGLE_APPLICATION_CREDENTIALS and GOOGLE_VERTEX_PROJECT environment variables.",
            requiredEnvVars: [
              "GOOGLE_APPLICATION_CREDENTIALS",
              "GOOGLE_VERTEX_PROJECT",
            ],
          };
        }

        const limitedResults = Math.min(Math.max(maxResults, 1), 5);
        const vertex_ai = new VertexAI({
          project: hasProjectId,
          location: projectLocation,
        });

        const websearchModel = "gemini-2.5-flash-lite";

        const model = vertex_ai.getGenerativeModel({
          model: websearchModel,
          tools: createGoogleSearchTools(),
        });

        // Search query with word limit constraint
        const searchPrompt = `Search for: "${query}". Provide a concise summary in no more than ${maxWords} words.`;

        const startTime = Date.now();
        const response = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: searchPrompt }],
            },
          ],
        });

        const responseTime = Date.now() - startTime;

        // Extract grounding metadata and search results
        const result = response.response;
        const candidates = result.candidates;

        if (!candidates || candidates.length === 0) {
          return {
            success: false,
            error: "No search results returned",
            query,
          };
        }

        const content = candidates[0].content;
        if (!content || !content.parts || content.parts.length === 0) {
          return {
            success: false,
            error: "No search content found",
            query,
          };
        }

        // Extract raw search content
        const searchContent = content.parts[0].text || "";

        // Extract grounding sources if available
        const groundingMetadata = candidates[0]?.groundingMetadata;
        const searchResults = [];

        if (groundingMetadata?.groundingChunks) {
          for (const chunk of groundingMetadata.groundingChunks.slice(
            0,
            limitedResults,
          )) {
            if (chunk.web) {
              searchResults.push({
                title: chunk.web.title || "No title",
                url: chunk.web.uri || "",
                snippet: searchContent, // Use full content since maxWords already limits length
                domain: chunk.web.uri
                  ? new URL(chunk.web.uri).hostname
                  : "unknown",
              });
            }
          }
        }

        // If no grounding metadata, create basic result structure
        if (searchResults.length === 0) {
          searchResults.push({
            title: `Search results for: ${query}`,
            url: "",
            snippet: searchContent,
            domain: "google-search",
          });
        }

        return {
          success: true,
          query,
          searchResults,
          rawContent: searchContent,
          totalResults: searchResults.length,
          provider: "google-search-grounding",
          model: websearchModel,
          responseTime,
          timestamp: startTime,
          grounded: true,
        };
      } catch (error) {
        logger.error("Web search grounding error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          query,
          provider: "google-search-grounding",
        };
      }
    },
  }),
};

/**
 * Type aliases for specific tool categories
 */
export type BasicToolsMap = {
  getCurrentTime: typeof directAgentTools.getCurrentTime;
  calculateMath: typeof directAgentTools.calculateMath;
};

export type FilesystemToolsMap = {
  readFile: typeof directAgentTools.readFile;
  listDirectory: typeof directAgentTools.listDirectory;
  writeFile: typeof directAgentTools.writeFile;
  searchFiles: typeof directAgentTools.searchFiles;
};

export type UtilityToolsMap = {
  getCurrentTime: typeof directAgentTools.getCurrentTime;
  calculateMath: typeof directAgentTools.calculateMath;
  listDirectory: typeof directAgentTools.listDirectory;
};

export type AllToolsMap = typeof directAgentTools;

/**
 * Get a subset of tools for specific use cases with improved type safety
 */

export function getToolsForCategory(category: "basic"): BasicToolsMap;
// eslint-disable-next-line no-redeclare
export function getToolsForCategory(category: "filesystem"): FilesystemToolsMap;
// eslint-disable-next-line no-redeclare
export function getToolsForCategory(category: "utility"): UtilityToolsMap;
// eslint-disable-next-line no-redeclare
export function getToolsForCategory(category: "all"): AllToolsMap;
// eslint-disable-next-line no-redeclare
export function getToolsForCategory(
  category: "basic" | "filesystem" | "utility" | "all" = "all",
): BasicToolsMap | FilesystemToolsMap | UtilityToolsMap | AllToolsMap {
  switch (category) {
    case "basic":
      return {
        getCurrentTime: directAgentTools.getCurrentTime,
        calculateMath: directAgentTools.calculateMath,
      };
    case "filesystem":
      return {
        readFile: directAgentTools.readFile,
        listDirectory: directAgentTools.listDirectory,
        writeFile: directAgentTools.writeFile,
        searchFiles: directAgentTools.searchFiles,
      };
    case "utility":
      return {
        getCurrentTime: directAgentTools.getCurrentTime,
        calculateMath: directAgentTools.calculateMath,
        listDirectory: directAgentTools.listDirectory,
      };
    case "all":
    default:
      return directAgentTools;
  }
}

/**
 * Get tool names for validation
 */
export function getAvailableToolNames(): string[] {
  return Object.keys(directAgentTools);
}

/**
 * Validate that all tools have proper structure
 */
export function validateToolStructure(): boolean {
  try {
    for (const [name, tool] of Object.entries(directAgentTools)) {
      if (!tool.description || typeof tool.description !== "string") {
        logger.error(`❌ Tool ${name} missing description`);
        return false;
      }
      if (!tool.parameters) {
        logger.error(`❌ Tool ${name} missing parameters`);
        return false;
      }
      if (!tool.execute || typeof tool.execute !== "function") {
        logger.error(`❌ Tool ${name} missing execute function`);
        return false;
      }
    }
    logger.info("✅ All tools have valid structure");
    return true;
  } catch (error) {
    logger.error("❌ Tool validation failed:", error);
    return false;
  }
}
