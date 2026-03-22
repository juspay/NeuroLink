#!/usr/bin/env node
/**
 * WebSocket Real-Time Example
 *
 * Demonstrates real-time bidirectional communication with NeuroLink using WebSocket.
 *
 * Features:
 * - WebSocket connection management
 * - Automatic reconnection with exponential backoff
 * - Channel-based subscriptions
 * - Message queuing when disconnected
 * - Heartbeat/ping-pong for connection health
 * - Real-time collaborative chat
 * - Real-time agent execution
 * - Live notifications and updates
 *
 * @usage npx tsx examples/client-sdks/websocket-realtime.ts
 */

import {
  createWebSocketClient,
  NeuroLinkWebSocket,
  type WebSocketMessage,
  type StreamEvent,
} from "@juspay/neurolink/client";
import { fileURLToPath } from "url";

// =============================================================================
// Configuration
// =============================================================================

const WS_URL = process.env.NEUROLINK_WS_URL || "ws://localhost:3000/ws";
const API_KEY = process.env.NEUROLINK_API_KEY || "";

// =============================================================================
// Basic WebSocket Connection
// =============================================================================

export function basicWebSocketExample() {
  console.log("=== Basic WebSocket Example ===\n");

  // Create WebSocket client
  const wsClient = createWebSocketClient({
    baseUrl: WS_URL,
    apiKey: API_KEY,
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    heartbeatInterval: 30000, // 30 second heartbeat
    queueSize: 100, // Buffer up to 100 messages when disconnected
  });

  // Connect with event handlers
  wsClient.connect({
    onOpen: () => {
      console.log("✅ WebSocket connected");
      console.log("State:", wsClient.getState());

      // Send a test message
      wsClient.send({
        type: "message",
        channel: "test-channel",
        payload: {
          text: "Hello from WebSocket!",
        },
      });
    },

    onMessage: (event: StreamEvent) => {
      console.log("\n📨 Message received:", event.type);
      console.log("Content:", event);
    },

    onClose: (code: number, reason: string) => {
      console.log(`\n❌ WebSocket closed: ${code} - ${reason}`);
    },

    onError: (error: Error) => {
      console.error("\n⚠️ WebSocket error:", error.message);
    },

    onReconnect: (attempt: number) => {
      console.log(`\n🔄 Reconnecting (attempt ${attempt})...`);
    },

    onStateChange: (state) => {
      console.log(`\n📊 State changed: ${state}`);
    },
  });

  // Keep process alive
  process.stdin.resume();

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n👋 Disconnecting...");
    wsClient.disconnect();
    process.exit(0);
  });
}

// =============================================================================
// Channel-Based Communication
// =============================================================================

export function channelBasedExample() {
  console.log("=== Channel-Based Communication Example ===\n");

  const wsClient = new NeuroLinkWebSocket({
    baseUrl: WS_URL,
    apiKey: API_KEY,
    autoReconnect: true,
    heartbeatInterval: 30000,
  });

  wsClient.connect({
    onOpen: () => {
      console.log("✅ Connected to WebSocket server\n");

      // Subscribe to multiple channels
      console.log("Subscribing to channels...\n");

      // Chat channel
      wsClient.subscribe("chat-room-1", {
        onText: (text) => {
          console.log("[Chat] Message:", text);
        },
        onMetadata: (metadata) => {
          console.log("[Chat] Metadata:", metadata);
        },
      });

      // Notifications channel
      wsClient.subscribe("notifications", {
        onText: (text) => {
          showNotification("Notification", text);
        },
      });

      // Agent execution channel
      wsClient.subscribe("agent-executions", {
        onText: (text) => {
          console.log("[Agent] Output:", text);
        },
        onToolCall: (toolCall) => {
          console.log("[Agent] Tool call:", toolCall.name);
        },
        onToolResult: (toolResult) => {
          console.log("[Agent] Tool result:", toolResult);
        },
        onDone: (result) => {
          console.log("[Agent] Execution complete:", result);
        },
      });

      // System events channel
      wsClient.subscribe("system-events", {
        onMetadata: (metadata) => {
          console.log("[System] Event:", metadata);
        },
      });

      console.log("✅ Subscribed to all channels\n");

      // Send a message to chat channel
      wsClient.send({
        type: "message",
        channel: "chat-room-1",
        payload: {
          text: "Hello everyone!",
          userId: "user-123",
          timestamp: Date.now(),
        },
      });

      // Execute an agent via WebSocket
      wsClient.send({
        type: "message",
        channel: "agent-executions",
        payload: {
          agentId: "code-assistant",
          input: "Explain async/await in JavaScript",
          sessionId: "session-456",
        },
      });
    },

    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  // Simulate sending messages periodically
  let messageCount = 0;
  const interval = setInterval(() => {
    if (wsClient.isConnected()) {
      messageCount++;
      wsClient.send({
        type: "message",
        channel: "chat-room-1",
        payload: {
          text: `Message ${messageCount}`,
          userId: "user-123",
          timestamp: Date.now(),
        },
      });

      console.log(`Sent message ${messageCount}\n`);

      if (messageCount >= 5) {
        clearInterval(interval);
        console.log("Finished sending messages\n");

        // Unsubscribe from a channel
        setTimeout(() => {
          console.log("Unsubscribing from chat-room-1...\n");
          wsClient.unsubscribe("chat-room-1");
        }, 2000);

        // Disconnect after 5 seconds
        setTimeout(() => {
          console.log("Disconnecting...\n");
          wsClient.disconnect();
          process.exit(0);
        }, 5000);
      }
    }
  }, 2000);

  // Graceful shutdown
  process.on("SIGINT", () => {
    clearInterval(interval);
    wsClient.disconnect();
    process.exit(0);
  });
}

// =============================================================================
// Real-Time Collaborative Chat
// =============================================================================

export function collaborativeChatExample() {
  console.log("=== Real-Time Collaborative Chat Example ===\n");

  const wsClient = new NeuroLinkWebSocket({
    baseUrl: WS_URL,
    apiKey: API_KEY,
    autoReconnect: true,
  });

  const userId = `user-${Date.now()}`;
  const roomId = "coding-help";

  wsClient.connect({
    onOpen: () => {
      console.log(`✅ Connected as ${userId}\n`);

      // Join chat room
      wsClient.send({
        type: "subscribe",
        channel: roomId,
        payload: {
          userId,
          action: "join",
        },
      });

      // Subscribe to room messages
      wsClient.subscribe(roomId, {
        onText: (text) => {
          console.log(`[${roomId}] ${text}`);
        },
        onMetadata: (metadata: Record<string, unknown>) => {
          if (metadata.action === "join") {
            console.log(`[${roomId}] ${metadata.userId} joined the room`);
          } else if (metadata.action === "leave") {
            console.log(`[${roomId}] ${metadata.userId} left the room`);
          } else if (metadata.type === "typing") {
            console.log(`[${roomId}] ${metadata.userId} is typing...`);
          }
        },
      });

      console.log(`Joined room: ${roomId}\n`);

      // Send a message
      setTimeout(() => {
        sendChatMessage(
          wsClient,
          roomId,
          userId,
          "Hello! Can someone help me with async/await?",
        );
      }, 1000);

      // Simulate typing indicator
      setTimeout(() => {
        sendTypingIndicator(wsClient, roomId, userId, true);
      }, 3000);

      // Send another message
      setTimeout(() => {
        sendTypingIndicator(wsClient, roomId, userId, false);
        sendChatMessage(
          wsClient,
          roomId,
          userId,
          "I am trying to understand Promises",
        );
      }, 5000);

      // Leave room
      setTimeout(() => {
        wsClient.send({
          type: "unsubscribe",
          channel: roomId,
          payload: {
            userId,
            action: "leave",
          },
        });
        console.log(`\nLeft room: ${roomId}`);

        wsClient.disconnect();
        process.exit(0);
      }, 8000);
    },
  });
}

function sendChatMessage(
  wsClient: NeuroLinkWebSocket,
  roomId: string,
  userId: string,
  message: string,
) {
  wsClient.send({
    type: "message",
    channel: roomId,
    payload: {
      userId,
      message,
      timestamp: Date.now(),
    },
  });
}

function sendTypingIndicator(
  wsClient: NeuroLinkWebSocket,
  roomId: string,
  userId: string,
  isTyping: boolean,
) {
  wsClient.send({
    type: "message",
    channel: roomId,
    payload: {
      type: "typing",
      userId,
      isTyping,
    },
  });
}

// =============================================================================
// Message Queuing & Resilience
// =============================================================================

export function messageQueuingExample() {
  console.log("=== Message Queuing & Resilience Example ===\n");

  const wsClient = new NeuroLinkWebSocket({
    baseUrl: WS_URL,
    apiKey: API_KEY,
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 1000,
    queueSize: 100,
  });

  let reconnectCount = 0;

  wsClient.connect({
    onOpen: () => {
      console.log("✅ Connected\n");

      // Send messages continuously
      const sendInterval = setInterval(() => {
        if (wsClient.isConnected()) {
          wsClient.send({
            type: "message",
            payload: {
              text: `Message at ${new Date().toISOString()}`,
            },
          });
          console.log("Sent message");
        } else {
          console.log("⏳ Message queued (disconnected)");
        }
      }, 1000);

      // Simulate disconnection after 5 seconds
      setTimeout(() => {
        console.log("\n⚠️ Simulating disconnection...\n");
        wsClient.disconnect();

        // Messages sent during this time will be queued

        // Reconnect after 3 seconds
        setTimeout(() => {
          console.log("🔄 Reconnecting...\n");
          wsClient.connect({
            onOpen: () => {
              console.log(
                "✅ Reconnected - queued messages will be sent now\n",
              );
            },
          });
        }, 3000);
      }, 5000);

      // Stop after 15 seconds
      setTimeout(() => {
        clearInterval(sendInterval);
        wsClient.disconnect();
        console.log("\n👋 Example complete");
        process.exit(0);
      }, 15000);
    },

    onReconnect: (attempt) => {
      reconnectCount = attempt;
      console.log(`🔄 Reconnection attempt ${attempt}...`);
    },

    onError: (error) => {
      console.error("❌ Error:", error.message);
    },
  });
}

// =============================================================================
// Real-Time Agent Execution
// =============================================================================

export function realTimeAgentExample() {
  console.log("=== Real-Time Agent Execution Example ===\n");

  const wsClient = new NeuroLinkWebSocket({
    baseUrl: WS_URL,
    apiKey: API_KEY,
    autoReconnect: true,
  });

  const agentChannel = "agent-realtime";

  wsClient.connect({
    onOpen: () => {
      console.log("✅ Connected\n");

      // Subscribe to agent execution channel
      wsClient.subscribe(agentChannel, {
        onText: (text) => {
          process.stdout.write(text); // Stream output
        },
        onToolCall: (toolCall) => {
          console.log(`\n\n🔧 Tool: ${toolCall.name}`);
          console.log("Arguments:", toolCall.arguments);
        },
        onToolResult: (toolResult) => {
          console.log("Result:", toolResult);
        },
        onMetadata: (metadata: Record<string, unknown>) => {
          if (metadata.status) {
            console.log(`\n📊 Status: ${metadata.status}`);
          }
        },
        onDone: (result) => {
          console.log("\n\n✅ Agent execution complete!");
          console.log("Usage:", result.usage);
          console.log("\nDisconnecting...");
          wsClient.disconnect();
          process.exit(0);
        },
        onError: (error) => {
          console.error("\n\n❌ Agent error:", error);
        },
      });

      // Execute agent
      console.log("Executing agent...\n");
      wsClient.send({
        type: "message",
        channel: agentChannel,
        payload: {
          agentId: "code-assistant",
          input:
            "Write a TypeScript function to calculate Fibonacci numbers using memoization",
          sessionId: `session-${Date.now()}`,
          tools: {
            enabled: ["readFile", "writeFile"],
            mode: "auto",
          },
        },
      });
    },

    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n👋 Disconnecting...");
    wsClient.disconnect();
    process.exit(0);
  });
}

// =============================================================================
// Live Notifications Dashboard
// =============================================================================

export function liveNotificationsExample() {
  console.log("=== Live Notifications Dashboard Example ===\n");

  const wsClient = new NeuroLinkWebSocket({
    baseUrl: WS_URL,
    apiKey: API_KEY,
    autoReconnect: true,
  });

  wsClient.connect({
    onOpen: () => {
      console.log("✅ Connected to notifications dashboard\n");

      // Subscribe to different notification channels
      const channels = [
        "system-alerts",
        "user-activity",
        "agent-status",
        "workflow-updates",
        "tool-executions",
      ];

      channels.forEach((channel) => {
        wsClient.subscribe(channel, {
          onText: (text) => {
            showNotification(channel, text);
          },
          onMetadata: (metadata) => {
            showNotification(channel, JSON.stringify(metadata, null, 2));
          },
        });
      });

      console.log(`Subscribed to ${channels.length} channels\n`);
      console.log("Listening for notifications...\n");
      console.log("─".repeat(60) + "\n");
    },

    onMessage: (event: StreamEvent) => {
      // Handle all messages
      const timestamp = new Date(event.timestamp).toLocaleTimeString();
      console.log(`[${timestamp}] ${event.type}:`, event.content || event);
    },
  });

  // Keep alive
  process.stdin.resume();

  process.on("SIGINT", () => {
    console.log("\n\n👋 Disconnecting from notifications...");
    wsClient.disconnect();
    process.exit(0);
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

function showNotification(channel: string, message: string) {
  const timestamp = new Date().toLocaleTimeString();
  const border = "─".repeat(60);

  console.log(border);
  console.log(`📢 [${channel}] ${timestamp}`);
  console.log(message);
  console.log(border + "\n");
}

// =============================================================================
// Main CLI
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const example = args[0] || "basic";

  console.log(
    "\n╔════════════════════════════════════════════════════════════╗",
  );
  console.log("║      NeuroLink WebSocket Real-Time Examples                ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  switch (example) {
    case "basic":
      basicWebSocketExample();
      break;
    case "channels":
      channelBasedExample();
      break;
    case "chat":
      collaborativeChatExample();
      break;
    case "queue":
      messageQueuingExample();
      break;
    case "agent":
      realTimeAgentExample();
      break;
    case "notifications":
      liveNotificationsExample();
      break;
    default:
      console.log("Available examples:");
      console.log("  basic         - Basic WebSocket connection");
      console.log("  channels      - Channel-based communication");
      console.log("  chat          - Real-time collaborative chat");
      console.log("  queue         - Message queuing & resilience");
      console.log("  agent         - Real-time agent execution");
      console.log("  notifications - Live notifications dashboard");
      console.log("\nUsage: ts-node websocket-realtime.ts [example]");
      process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

// =============================================================================
// Exports
// =============================================================================

export {
  basicWebSocketExample,
  channelBasedExample,
  collaborativeChatExample,
  messageQueuingExample,
  realTimeAgentExample,
  liveNotificationsExample,
};

/*
# Run examples:

# Basic WebSocket connection
ts-node websocket-realtime.ts basic

# Channel-based communication
ts-node websocket-realtime.ts channels

# Real-time collaborative chat
ts-node websocket-realtime.ts chat

# Message queuing & resilience
ts-node websocket-realtime.ts queue

# Real-time agent execution
ts-node websocket-realtime.ts agent

# Live notifications dashboard
ts-node websocket-realtime.ts notifications
*/
