import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import type {
  StreamingSession,
  StreamingConfig,
  StreamingPool,
  StreamingPoolConfig,
  StreamingMetrics,
  StreamingHealthStatus,
  BufferConfig,
  LoadBalancingStrategy,
} from "../types.js";

export class StreamingManager extends EventEmitter {
  private activeSessions = new Map<string, StreamingSession>();
  private streamingPools = new Map<string, StreamingPool>();
  private metrics: StreamingMetrics;
  private healthCheckInterval?: NodeJS.Timeout;
  private startTime: number;

  constructor() {
    super();
    this.startTime = Date.now();
    this.metrics = {
      activeSessions: 0,
      totalBytesTransferred: 0,
      averageLatency: 0,
      throughputBps: 0,
      errorRate: 0,
      connectionCount: 0,
      uptime: 0,
    };

    this.startHealthMonitoring();
  }

  // Stream Lifecycle Management
  async createStreamingSession(
    config: StreamingConfig,
  ): Promise<StreamingSession> {
    const sessionId = randomUUID();
    const session: StreamingSession = {
      id: sessionId,
      connectionId: config.provider, // Temporary, should be actual connection ID
      provider: config.provider,
      status: "active",
      startTime: Date.now(),
      lastActivity: Date.now(),
      config,
      metrics: {
        bytesTransferred: 0,
        messagesCount: 0,
        averageLatency: 0,
        errorCount: 0,
      },
    };

    this.activeSessions.set(sessionId, session);
    this.updateGlobalMetrics();

    console.log(
      `[Streaming Manager] Created session ${sessionId} for provider ${config.provider}`,
    );
    this.emit("session-created", session);

    return session;
  }

  async terminateStreamingSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = "terminated";
    this.activeSessions.delete(sessionId);
    this.updateGlobalMetrics();

    console.log(`[Streaming Manager] Terminated session ${sessionId}`);
    this.emit("session-terminated", session);
  }

  async pauseStreamingSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status === "active") {
      session.status = "paused";
      console.log(`[Streaming Manager] Paused session ${sessionId}`);
      this.emit("session-paused", session);
    }
  }

  async resumeStreamingSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status === "paused") {
      session.status = "active";
      session.lastActivity = Date.now();
      console.log(`[Streaming Manager] Resumed session ${sessionId}`);
      this.emit("session-resumed", session);
    }
  }

  // Stream Optimization
  async optimizeStreamingLatency(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    // Adaptive optimization based on current metrics
    const currentLatency = session.metrics.averageLatency;
    const targetLatency = session.config.latencyTarget;

    if (currentLatency > targetLatency * 1.2) {
      // Increase buffer size for better throughput
      session.config.bufferSize = Math.min(
        session.config.bufferSize * 1.5,
        16384,
      );
      session.config.streamingMode = "buffered";
    } else if (currentLatency < targetLatency * 0.8) {
      // Decrease buffer size for better latency
      session.config.bufferSize = Math.max(
        session.config.bufferSize * 0.8,
        1024,
      );
      session.config.streamingMode = "real-time";
    }

    console.log(
      `[Streaming Manager] Optimized session ${sessionId}: latency=${currentLatency}ms, mode=${session.config.streamingMode}`,
    );
  }

  async enableStreamingCompression(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    session.config.compressionEnabled = true;
    console.log(
      `[Streaming Manager] Enabled compression for session ${sessionId}`,
    );
  }

  async configureStreamingBuffering(
    sessionId: string,
    bufferConfig: BufferConfig,
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    session.config.bufferSize = bufferConfig.maxSize;
    session.config.maxChunkSize = Math.min(
      session.config.maxChunkSize,
      bufferConfig.flushThreshold,
    );

    console.log(
      `[Streaming Manager] Updated buffer config for session ${sessionId}:`,
      bufferConfig,
    );
  }

  // Multi-Stream Coordination
  async createStreamingPool(
    poolId: string,
    config: StreamingPoolConfig,
  ): Promise<void> {
    const pool: StreamingPool = {
      id: poolId,
      maxSessions: config.maxConcurrentSessions,
      activeSessions: new Set(),
      config,
      loadBalancer: config.loadBalancing,
    };

    this.streamingPools.set(poolId, pool);
    console.log(
      `[Streaming Manager] Created pool ${poolId} with max ${config.maxConcurrentSessions} sessions`,
    );
  }

  async balanceStreamingLoad(poolId: string): Promise<void> {
    const pool = this.streamingPools.get(poolId);
    if (!pool) {
      return;
    }

    const activeSessions = Array.from(pool.activeSessions)
      .map((sessionId) => this.activeSessions.get(sessionId))
      .filter((session) => session && session.status === "active");

    // Implement load balancing strategies
    switch (pool.loadBalancer) {
      case "round-robin":
        this.roundRobinBalance(activeSessions);
        break;
      case "least-connections":
        this.leastConnectionsBalance(activeSessions);
        break;
      case "weighted":
        this.weightedBalance(activeSessions);
        break;
      case "adaptive":
        this.adaptiveBalance(activeSessions);
        break;
    }
  }

  async scaleStreamingCapacity(poolId: string, scale: number): Promise<void> {
    const pool = this.streamingPools.get(poolId);
    if (!pool) {
      return;
    }

    const newMaxSessions = Math.max(1, Math.floor(pool.maxSessions * scale));
    pool.maxSessions = newMaxSessions;
    pool.config.maxConcurrentSessions = newMaxSessions;

    console.log(
      `[Streaming Manager] Scaled pool ${poolId} to ${newMaxSessions} max sessions (${scale}x)`,
    );
  }

  // Performance Monitoring
  getStreamingMetrics(sessionId?: string): StreamingMetrics {
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        return {
          sessionId,
          activeSessions: 1,
          totalBytesTransferred: session.metrics.bytesTransferred,
          averageLatency: session.metrics.averageLatency,
          throughputBps:
            session.metrics.bytesTransferred /
            ((Date.now() - session.startTime) / 1000),
          errorRate:
            session.metrics.errorCount /
            Math.max(session.metrics.messagesCount, 1),
          connectionCount: 1,
          uptime: Date.now() - session.startTime,
        };
      }
    }

    return { ...this.metrics, uptime: Date.now() - this.startTime };
  }

  getStreamingHealthStatus(): StreamingHealthStatus {
    const metrics = this.getStreamingMetrics();
    const issues: string[] = [];

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (metrics.errorRate > 0.1) {
      issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
      status = "degraded";
    }

    if (metrics.averageLatency > 1000) {
      issues.push(`High latency: ${metrics.averageLatency}ms`);
      status = status === "healthy" ? "degraded" : "unhealthy";
    }

    if (metrics.activeSessions === 0 && this.activeSessions.size > 0) {
      issues.push("Session count mismatch");
      status = "unhealthy";
    }

    return {
      status,
      activeSessions: metrics.activeSessions,
      errorRate: metrics.errorRate,
      averageLatency: metrics.averageLatency,
      lastHealthCheck: Date.now(),
      issues,
    };
  }

  // Private helper methods
  private updateGlobalMetrics(): void {
    this.metrics.activeSessions = this.activeSessions.size;
    this.metrics.connectionCount = this.activeSessions.size;
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      const health = this.getStreamingHealthStatus();
      if (health.status !== "healthy") {
        console.warn("[Streaming Manager] Health check:", health);
        this.emit("health-warning", health);
      }
    }, 30000); // Check every 30 seconds
  }

  private roundRobinBalance(sessions: (StreamingSession | undefined)[]): void {
    // Round-robin implementation
  }

  private leastConnectionsBalance(
    sessions: (StreamingSession | undefined)[],
  ): void {
    // Least connections implementation
  }

  private weightedBalance(sessions: (StreamingSession | undefined)[]): void {
    // Weighted load balancing implementation
  }

  private adaptiveBalance(sessions: (StreamingSession | undefined)[]): void {
    // Adaptive load balancing implementation
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.activeSessions.clear();
    this.streamingPools.clear();
  }
}
