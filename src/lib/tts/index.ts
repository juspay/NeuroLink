/**
 * TTS SDK - Text-to-Speech (Google Cloud Text-to-Speech)
 *
 * A comprehensive TypeScript SDK for text-to-speech generation
 * with cross-platform audio playback support.
 */

// Main service class
import { TTSService } from "./tts-service.js";
export { TTSService };

// Provider implementations
export { GeminiTTSProvider } from "./gemini-tts-provider.js";

// Audio playback utilities
export { CrossPlatformAudioPlayer } from "./audio-player.js";
export type { AudioPlayer } from "./audio-player.js";

// Type definitions and interfaces
export type {
  TTSInput,
  TTSResponse,
  TTSConfig,
  VoiceOption,
  GoogleTTSRequest,
  GoogleTTSResponse,
  GoogleVoice,
  GoogleVoicesResponse,
} from "../types/tts.js";

// Error classes
export { TTSError } from "../types/tts.js";

// Convenience exports for common use cases
export const createTTSService = (apiKey?: string) => {
  return TTSService.create(apiKey);
};

// Default export
export default TTSService;
