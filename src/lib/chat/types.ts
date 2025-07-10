/**
 * Phase 3: SSE Chat Utilities
 * Type definitions for chat infrastructure
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: {
    provider?: string;
    model?: string;
    tokens?: number;
    duration?: number;
  };
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  role?: "user";
  options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    streamResponse?: boolean;
  };
}

export interface SSEOptions {
  maxConnections?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
  enableCors?: boolean;
  corsOrigins?: string[];
}

export interface SessionOptions {
  maxHistory?: number;
  persistenceAdapter?: "memory" | "redis" | "file";
  contextWindowSize?: number;
  autoSave?: boolean;
  ttl?: number; // Time to live in seconds
}

export interface SSEEvent {
  type: "data" | "error" | "progress" | "complete" | "heartbeat";
  data: any;
  id?: string;
  retry?: number;
}

export interface ChatSessionState {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActivity: number;
  metadata?: Record<string, any>;
}

export interface StreamingChatResponse {
  sessionId: string;
  messageId: string;
  stream: ReadableStream;
  response: Response;
}

export interface SessionStorage {
  get(sessionId: string): Promise<ChatSessionState | null>;
  set(sessionId: string, state: ChatSessionState): Promise<void>;
  delete(sessionId: string): Promise<void>;
  list(): Promise<string[]>;
  cleanup(maxAge: number): Promise<number>;
}

export interface ContextManager {
  addMessage(sessionId: string, message: ChatMessage): Promise<void>;
  getHistory(sessionId: string, limit?: number): Promise<ChatMessage[]>;
  trimContext(sessionId: string, maxTokens: number): Promise<number>;
  estimateTokens(messages: ChatMessage[]): number;
}
