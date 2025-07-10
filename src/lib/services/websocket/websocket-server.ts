import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import type {
  WebSocketOptions,
  ConnectionInfo,
  WebSocketMessage,
  StreamingChannel,
} from "../types.js";

export class NeuroLinkWebSocketServer extends EventEmitter {
  private wss: WebSocketServer;
  private connections = new Map<string, WebSocket>();
  private connectionInfo = new Map<string, ConnectionInfo>();
  private rooms = new Map<string, Set<string>>();
  private streamingChannels = new Map<string, StreamingChannel>();
  private heartbeatInterval?: NodeJS.Timeout;
  private options: Required<WebSocketOptions>;

  constructor(options: WebSocketOptions = {}) {
    super();

    this.options = {
      port: options.port || 8080,
      maxConnections: options.maxConnections || 1000,
      heartbeatInterval: options.heartbeatInterval || 30000,
      enableCompression: options.enableCompression ?? true,
      enableBackpressure: options.enableBackpressure ?? true,
      bufferSize: options.bufferSize || 8192,
      timeoutMs: options.timeoutMs || 30000,
    };

    this.wss = new WebSocketServer({
      port: this.options.port,
      perMessageDeflate: this.options.enableCompression,
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private setupEventHandlers(): void {
    this.wss.on("connection", (ws, request) => {
      this.handleConnection(ws, request);
    });

    this.wss.on("error", (error) => {
      console.error("[WebSocket Server] Error:", error);
      this.emit("error", error);
    });
  }

  private handleConnection(ws: WebSocket, request: any): void {
    if (this.connections.size >= this.options.maxConnections) {
      ws.close(1013, "Server at capacity");
      return;
    }

    const connectionId = randomUUID();
    const userAgent = request.headers["user-agent"];
    const ipAddress = request.socket.remoteAddress;

    // Store connection
    this.connections.set(connectionId, ws);
    this.connectionInfo.set(connectionId, {
      id: connectionId,
      userAgent,
      ipAddress,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      rooms: new Set(),
      subscriptions: new Set(),
      metadata: {},
    });

    // Setup WebSocket event handlers
    ws.on("message", (data) => {
      this.handleMessage(connectionId, data);
    });

    ws.on("close", () => {
      this.handleDisconnection(connectionId);
    });

    ws.on("error", (error) => {
      console.error(`[WebSocket] Connection ${connectionId} error:`, error);
      this.handleDisconnection(connectionId);
    });

    // Send connection confirmation
    this.sendMessage(connectionId, {
      id: randomUUID(),
      type: "system",
      connectionId,
      timestamp: Date.now(),
      data: {
        event: "connected",
        connectionId,
        serverInfo: {
          version: "3.0.1",
          features: ["streaming", "rooms", "tools"],
        },
      },
    });

    console.log(
      `[WebSocket] New connection: ${connectionId} (${this.connections.size}/${this.options.maxConnections})`,
    );
    this.emit("connection", { connectionId, userAgent, ipAddress });
  }

  private handleMessage(connectionId: string, data: any): void {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;
      this.updateLastActivity(connectionId);

      switch (message.type) {
        case "heartbeat":
          this.handleHeartbeat(connectionId);
          break;
        case "chat":
          this.handleChatMessage(connectionId, message);
          break;
        default:
          this.emit("message", { connectionId, message });
      }
    } catch (error) {
      console.error(`[WebSocket] Invalid message from ${connectionId}:`, error);
      this.sendError(connectionId, "Invalid message format");
    }
  }

  private handleDisconnection(connectionId: string): void {
    const connection = this.connectionInfo.get(connectionId);
    if (!connection) {
      return;
    }

    // Leave all rooms
    connection.rooms.forEach((roomId) => {
      this.leaveRoom(connectionId, roomId);
    });

    // Close streaming channels
    this.streamingChannels.forEach((channel, channelId) => {
      if (channel.connectionId === connectionId) {
        channel.onClose();
        this.streamingChannels.delete(channelId);
      }
    });

    // Clean up
    this.connections.delete(connectionId);
    this.connectionInfo.delete(connectionId);

    console.log(
      `[WebSocket] Disconnected: ${connectionId} (${this.connections.size}/${this.options.maxConnections})`,
    );
    this.emit("disconnection", { connectionId });
  }

  // Room Management
  joinRoom(connectionId: string, roomId: string): boolean {
    const connection = this.connectionInfo.get(connectionId);
    if (!connection) {
      return false;
    }

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    this.rooms.get(roomId)!.add(connectionId);
    connection.rooms.add(roomId);

    this.sendMessage(connectionId, {
      id: randomUUID(),
      type: "system",
      connectionId,
      roomId,
      timestamp: Date.now(),
      data: {
        event: "room_joined",
        roomId,
        memberCount: this.rooms.get(roomId)!.size,
      },
    });

    console.log(`[WebSocket] ${connectionId} joined room ${roomId}`);
    return true;
  }

  leaveRoom(connectionId: string, roomId: string): boolean {
    const connection = this.connectionInfo.get(connectionId);
    if (!connection) {
      return false;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    room.delete(connectionId);
    connection.rooms.delete(roomId);

    if (room.size === 0) {
      this.rooms.delete(roomId);
    }

    this.sendMessage(connectionId, {
      id: randomUUID(),
      type: "system",
      connectionId,
      roomId,
      timestamp: Date.now(),
      data: {
        event: "room_left",
        roomId,
        memberCount: room.size,
      },
    });

    console.log(`[WebSocket] ${connectionId} left room ${roomId}`);
    return true;
  }

  broadcastToRoom(roomId: string, message: WebSocketMessage): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    room.forEach((connectionId) => {
      this.sendMessage(connectionId, { ...message, roomId });
    });
  }

  // Streaming Support
  createStreamingChannel(
    connectionId: string,
    channelId: string,
  ): StreamingChannel {
    const channel: StreamingChannel = {
      id: channelId,
      connectionId,
      type: "ai-response",
      status: "open",
      buffer: {
        data: [],
        maxSize: this.options.bufferSize,
        currentSize: 0,
        flushThreshold: Math.floor(this.options.bufferSize * 0.8),
        lastFlush: Date.now(),
      },
      onData: (data) => this.handleChannelData(channelId, data),
      onError: (error) => this.handleChannelError(channelId, error),
      onClose: () => this.handleChannelClose(channelId),
    };

    this.streamingChannels.set(channelId, channel);
    return channel;
  }

  destroyStreamingChannel(channelId: string): void {
    const channel = this.streamingChannels.get(channelId);
    if (channel) {
      channel.status = "closed";
      channel.onClose();
      this.streamingChannels.delete(channelId);
    }
  }

  // Helper methods
  private sendMessage(
    connectionId: string,
    message: WebSocketMessage,
  ): boolean {
    const ws = this.connections.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(
        `[WebSocket] Failed to send message to ${connectionId}:`,
        error,
      );
      return false;
    }
  }

  private sendError(connectionId: string, errorMessage: string): void {
    this.sendMessage(connectionId, {
      id: randomUUID(),
      type: "error",
      connectionId,
      timestamp: Date.now(),
      data: { error: errorMessage },
    });
  }

  private updateLastActivity(connectionId: string): void {
    const connection = this.connectionInfo.get(connectionId);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }

  private handleHeartbeat(connectionId: string): void {
    this.sendMessage(connectionId, {
      id: randomUUID(),
      type: "heartbeat",
      connectionId,
      timestamp: Date.now(),
      data: { pong: true },
    });
  }

  private handleChatMessage(
    connectionId: string,
    message: WebSocketMessage,
  ): void {
    this.emit("chat-message", { connectionId, message });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((ws, connectionId) => {
        if (ws.readyState === WebSocket.OPEN) {
          const connection = this.connectionInfo.get(connectionId);
          if (
            connection &&
            Date.now() - connection.lastActivity > this.options.timeoutMs
          ) {
            console.log(`[WebSocket] Timeout for connection ${connectionId}`);
            ws.terminate();
          }
        }
      });
    }, this.options.heartbeatInterval);
  }

  // Public getters
  getConnectionCount(): number {
    return this.connections.size;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getActiveChannels(): number {
    return this.streamingChannels.size;
  }

  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }

  private handleChannelData(channelId: string, data: any): void {
    // Implementation for channel data handling
  }

  private handleChannelError(channelId: string, error: Error): void {
    console.error(`[Streaming Channel] ${channelId} error:`, error);
  }

  private handleChannelClose(channelId: string): void {
    console.log(`[Streaming Channel] ${channelId} closed`);
  }
}
