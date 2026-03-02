/**
 * Speech-to-Text (STT) Module
 *
 * Exports Google Cloud Speech-to-Text v1 handler and utilities.
 *
 * @module stt
 */

export {
  hasGoogleCloudCredentials,
  transcribe,
  validateSTTOptions,
} from "./googleSTTHandler.js";
