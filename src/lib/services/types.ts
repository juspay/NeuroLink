// Real-time Services Types

export interface StreamingSession {
  id: string;
  connectionId: string;
  provider: string;
  status: "active" | "paused" | "terminated";
  startTime: number;
  lastActivity: number;
  config: StreamingConfig;
  metrics: {
    bytesTransferred: number;
    messagesCount: number;
    averageLatency: number;
    errorCount: number;
  };
}

export interface WebSocketOptions {
  port?: number;
  maxConnections?: number;
  heartbeatInterval?: number;
  enableCompression?: boolean;
  enableBackpressure?: boolean;
  bufferSize?: number;
  timeoutMs?: number;
}

export interface StreamingConfig {
  provider: string;
  model: string;
  streamingMode: "real-time" | "buffered" | "adaptive";
  compressionEnabled: boolean;
  maxChunkSize: number;
  bufferSize: number;
  latencyTarget: number;
}

export interface StreamingPool {
  id: string;
  maxSessions: number;
  activeSessions: Set<string>;
  config: StreamingPoolConfig;
  loadBalancer: LoadBalancingStrategy;
}

export interface StreamingPoolConfig {
  maxConcurrentSessions: number;
  sessionTimeout: number;
  loadBalancing: LoadBalancingStrategy;
  autoScaling: {
    enabled: boolean;
    minSessions: number;
    maxSessions: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
  };
}

export type LoadBalancingStrategy =
  | "round-robin"
  | "least-connections"
  | "weighted"
  | "adaptive";

export interface StreamingChannel {
  id: string;
  connectionId: string;
  type: "ai-response" | "mcp-tool" | "chat" | "notification";
  status: "open" | "closed" | "error";
  buffer: StreamingBuffer;
  onData: (data: any) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

export interface StreamingBuffer {
  data: any[];
  maxSize: number;
  currentSize: number;
  flushThreshold: number;
  lastFlush: number;
}

export interface StreamingMetrics {
  sessionId?: string;
  activeSessions: number;
  totalBytesTransferred: number;
  averageLatency: number;
  throughputBps: number;
  errorRate: number;
  connectionCount: number;
  uptime: number;
}

export interface StreamingHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  activeSessions: number;
  errorRate: number;
  averageLatency: number;
  lastHealthCheck: number;
  issues: string[];
}

export interface WebSocketMessage {
  id: string;
  type:
    | "chat"
    | "ai-response"
    | "tool-result"
    | "system"
    | "heartbeat"
    | "error";
  connectionId: string;
  roomId?: string;
  timestamp: number;
  data: any;
  metadata?: {
    provider?: string;
    model?: string;
    tokens?: number;
    latency?: number;
  };
}

export interface ChatRequest {
  prompt: string;
  sessionId?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    streaming?: boolean;
    enableTools?: boolean;
  };
}

export interface GroupChatRequest extends ChatRequest {
  roomId: string;
  userId?: string;
  broadcastToRoom?: boolean;
}

export interface StreamingChatRequest extends ChatRequest {
  streamingOptions?: {
    chunkSize?: number;
    flushInterval?: number;
    enableCompression?: boolean;
  };
}

export interface MultiModalContent {
  type: "text" | "image" | "audio" | "video" | "file";
  content: string | Buffer;
  metadata?: {
    mimeType?: string;
    size?: number;
    duration?: number;
    dimensions?: { width: number; height: number };
  };
}

export interface BufferConfig {
  maxSize: number;
  flushThreshold: number;
  flushInterval: number;
  compressionEnabled: boolean;
  persistToDisk: boolean;
}

export interface ConnectionInfo {
  id: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  connectedAt: number;
  lastActivity: number;
  rooms: Set<string>;
  subscriptions: Set<string>;
  metadata: Record<string, any>;
}
