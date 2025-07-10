/**
 * Phase 3: SSE Chat Utilities
 * Main chat module exports
 */
import { SSEChatHandler } from "./sse-handler.js";
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
export async function createSSEChat(provider: any, options?: any) {
  const { SSEChatHandler } = await import("./sse-handler.js");
  return new SSEChatHandler(provider, options);
}

/**
 * Quick setup helper for chat session
 */
export async function createChatSession(sessionId: string, options?: any) {
  const { ChatSession } = await import("./session.js");
  return new ChatSession(sessionId, options);
}

// Real-time Services (Phase 4) - Temporarily disabled for testing
// export { WebSocketChatHandler } from './websocket-chat-handler.js';
// export { NeuroLinkWebSocketServer } from '../services/websocket/websocket-server.js';
// export { StreamingManager } from '../services/streaming/streaming-manager.js';
// export * from '../services/types.js';

/**
 * Enhanced factory function for real-time chat
 */
export async function createEnhancedChatService(options: {
  provider: any;
  enableSSE?: boolean;
  enableWebSocket?: boolean;
  streamingConfig?: any;
}) {
  if (options.enableWebSocket) {
    const { WebSocketChatHandler } = await import(
      "./websocket-chat-handler.js"
    );
    return new WebSocketChatHandler(options.provider, {
      sseOptions: options.enableSSE ? {} : undefined,
      wsOptions: options.streamingConfig,
    });
  }

  return new SSEChatHandler(options.provider);
}
