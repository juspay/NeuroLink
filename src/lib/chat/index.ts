/**
 * Phase 3: SSE Chat Utilities
 * Main chat module exports
 */
import { SSEChatHandler } from "./sse-handler.js";
import type { AIProvider } from "../core/types.js";
import type { JsonValue } from "../types/common.js";

interface SessionOptions {
  [key: string]: JsonValue;
}
export { SSEChatHandler } from "./sse-handler.js";
export { ChatSession } from "./session.js";
export {
  MemorySessionStorage,
  FileSessionStorage,
  RedisSessionStorage,
  SessionStorageFactory,
} from "./session-storage.js";
export { createChatClient, useChatStream } from "./client-utils.js";

export type {
  ChatMessage,
  ChatRequest,
  SSEOptions,
  SessionOptions,
  SSEEvent,
  ChatSessionState,
  StreamingChatResponse,
  SessionStorage,
  ContextManager,
} from "./types.js";

/**
 * Quick setup helper for SSE chat
 */
export async function createSSEChat(provider: unknown, options?: unknown) {
  const { SSEChatHandler } = await import("./sse-handler.js");
  return new SSEChatHandler(provider as AIProvider, options as SessionOptions);
}

/**
 * Quick setup helper for chat session
 */
export async function createChatSession(sessionId: string, options?: unknown) {
  const { ChatSession } = await import("./session.js");
  return new ChatSession(sessionId, options as SessionOptions);
}

// Real-time Services (Phase 4) - Temporarily disabled for testing
// export { WebSocketChatHandler } from './websocket-chat-handler.js';
// export { NeuroLinkWebSocketServer } from '../services/websocket/websocket-server.js';
// export { StreamingManager } from '../services/streaming/streaming-manager.js';
// export * from '../services/types.js';

/**
 * Enhanced factory function for real-time chat
 */
interface WebSocketOptions {
  [key: string]: JsonValue;
}

export async function createEnhancedChatService(options: {
  provider: unknown;
  enableSSE?: boolean;
  enableWebSocket?: boolean;
  streamingConfig?: unknown;
}) {
  if (options.enableWebSocket) {
    const { WebSocketChatHandler } = await import(
      "./websocket-chat-handler.js"
    );
    return new WebSocketChatHandler(options.provider as AIProvider, {
      sseOptions: options.enableSSE ? {} : undefined,
      wsOptions: options.streamingConfig as WebSocketOptions | undefined,
    });
  }

  return new SSEChatHandler(options.provider as AIProvider);
}
