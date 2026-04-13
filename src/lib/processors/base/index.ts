/**
 * Base File Processor Infrastructure
 *
 * Provides the foundation for building file processors in NeuroLink.
 * This module contains:
 * - Abstract base class for file processors (BaseFileProcessor)
 * - ALL type definitions for file processing operations
 * - Constants for defaults and priorities
 *
 * @module processors/base
 */

// =============================================================================
// BASE PROCESSOR CLASS
// =============================================================================

export {
  BaseFileProcessor,
  getDefaultImageMaxSizeMB,
  getDefaultImageTimeout,
  getDefaultTextMaxSizeMB,
  getDefaultTextTimeout,
} from "./BaseFileProcessor.js";

// =============================================================================
// TYPE DEFINITIONS (single source of truth)
// =============================================================================

// =============================================================================
// CONSTANTS
// =============================================================================

export {
  DEFAULT_IMAGE_MAX_SIZE_MB,
  DEFAULT_IMAGE_TIMEOUT_MS,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_TEXT_MAX_SIZE_MB,
  DEFAULT_TEXT_TIMEOUT_MS,
  PROCESSOR_PRIORITIES,
} from "../../types/index.js";
