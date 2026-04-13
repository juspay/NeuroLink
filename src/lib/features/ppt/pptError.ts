/**
 * PPT Generation Error Class & Codes
 *
 * Defined in the feature directory (not src/lib/types/) because PPTError is a
 * runtime class extending NeuroLinkError. Putting runtime classes in
 * src/lib/types/ creates a circular dependency: NeuroLinkError lives in
 * utils/errorHandling.ts which imports from the types barrel, which would
 * then re-export ppt.ts which extends NeuroLinkError → TDZ at runtime.
 *
 * Follows the same pattern as VideoError in vertexVideoHandler.ts.
 */

import { ErrorCategory, ErrorSeverity } from "../../constants/enums.js";
import { NeuroLinkError } from "../../utils/errorHandling.js";

/**
 * PPT generation error codes
 */
export const PPT_ERROR_CODES = {
  /** Content planning AI call failed */
  PLANNING_FAILED: "PPT_PLANNING_FAILED",
  /** AI returned invalid/unparseable response */
  INVALID_AI_RESPONSE: "PPT_INVALID_AI_RESPONSE",
  /** Image generation for slide failed */
  IMAGE_GENERATION_FAILED: "PPT_IMAGE_GENERATION_FAILED",
  /** PPTX file assembly failed */
  ASSEMBLY_FAILED: "PPT_ASSEMBLY_FAILED",
  /** File system write failed */
  FILE_WRITE_FAILED: "PPT_FILE_WRITE_FAILED",
  /** Invalid input options */
  INVALID_INPUT: "PPT_INVALID_INPUT",
  /** Generation timeout */
  TIMEOUT: "PPT_TIMEOUT",
} as const;

/**
 * PPT generation error class.
 * Extends NeuroLinkError for consistent error handling (follows VideoError pattern).
 */
export class PPTError extends NeuroLinkError {
  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
    originalError?: Error,
  ) {
    super({
      code,
      message,
      category: ErrorCategory.EXECUTION,
      severity: ErrorSeverity.HIGH,
      retriable: false,
      context: {
        ...context,
        originalMessage: originalError?.message,
      },
      originalError,
    });
    this.name = "PPTError";
  }
}
