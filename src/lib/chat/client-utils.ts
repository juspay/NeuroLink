/**
 * Phase 3: SSE Chat Utilities
 * Client-side utilities for SSE chat integration
 */

import type { ChatMessage, SSEEvent } from "./types.js";

export interface ChatClientOptions {
	endpoint: string;
	sessionId: string;
	onMessage?: (message: ChatMessage) => void;
	onError?: (error: Error) => void;
	onConnect?: () => void;
	onDisconnect?: () => void;
	reconnectAttempts?: number;
	reconnectDelay?: number;
}

export interface ChatStreamHook {
	messages: ChatMessage[];
	isConnected: boolean;
	isReconnecting: boolean;
	sendMessage: (content: string) => Promise<void>;
	disconnect: () => void;
	reconnect: () => void;
	clearHistory: () => void;
}

/**
 * Client for SSE chat communication
 */
export class ChatClient {
	private eventSource?: EventSource;
	private options: Required<ChatClientOptions>;
	private messages: ChatMessage[] = [];
	private reconnectCount = 0;
	private isConnected = false;
	private isReconnecting = false;
	private reconnectTimeout?: NodeJS.Timeout;

	constructor(options: ChatClientOptions) {
		this.options = {
			...options,
			onMessage: options.onMessage || (() => {}),
			onError: options.onError || (() => {}),
			onConnect: options.onConnect || (() => {}),
			onDisconnect: options.onDisconnect || (() => {}),
			reconnectAttempts: options.reconnectAttempts ?? 5,
			reconnectDelay: options.reconnectDelay ?? 1000,
		};
	}

	/**
	 * Connect to SSE endpoint
	 */
	connect(): void {
		if (this.eventSource) {
			this.disconnect();
		}

		const url = new URL("/chat/stream", this.options.endpoint);
		url.searchParams.set("sessionId", this.options.sessionId);

		this.eventSource = new EventSource(url.toString());

		this.eventSource.onopen = () => {
			this.isConnected = true;
			this.isReconnecting = false;
			this.reconnectCount = 0;
			this.options.onConnect();
		};

		this.eventSource.onmessage = (event) => {
			try {
				const sseEvent: SSEEvent = JSON.parse(event.data);
				this.handleSSEEvent(sseEvent);
			} catch (error) {
				console.error("Failed to parse SSE event:", error);
			}
		};

		this.eventSource.onerror = (error) => {
			this.isConnected = false;
			this.options.onDisconnect();

			if (this.reconnectCount < this.options.reconnectAttempts) {
				this.isReconnecting = true;
				this.scheduleReconnect();
			} else {
				this.isReconnecting = false;
				this.options.onError(new Error("Max reconnection attempts reached"));
			}
		};

		// Handle specific event types
		this.eventSource.addEventListener("data", (event) => {
			this.handleDataEvent(JSON.parse((event as MessageEvent).data));
		});

		this.eventSource.addEventListener("errMsg", (event) => {
			this.handleErrorEvent(JSON.parse((event as MessageEvent).data));
		});

		this.eventSource.addEventListener("complete", (event) => {
			this.handleCompleteEvent(JSON.parse((event as MessageEvent).data));
		});
	}

	/**
	 * Send message to chat
	 */
	async sendMessage(content: string): Promise<void> {
		if (!this.isConnected) {
			throw new Error("Not connected to chat server");
		}

		try {
			const response = await fetch(`${this.options.endpoint}/chat/send`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					sessionId: this.options.sessionId,
					message: content,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (error) {
			this.options.onError(error as Error);
			throw error;
		}
	}

	/**
	 * Disconnect from SSE endpoint
	 */
	disconnect(): void {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = undefined;
		}

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = undefined;
		}

		this.isConnected = false;
		this.isReconnecting = false;
		this.options.onDisconnect();
	}

	/**
	 * Get message history
	 */
	getMessages(): ChatMessage[] {
		return [...this.messages];
	}

	/**
	 * Clear message history
	 */
	clearMessages(): void {
		this.messages = [];
	}

	/**
	 * Check connection status
	 */
	getConnectionStatus(): {
		connected: boolean;
		reconnecting: boolean;
		reconnectCount: number;
	} {
		return {
			connected: this.isConnected,
			reconnecting: this.isReconnecting,
			reconnectCount: this.reconnectCount,
		};
	}

	private handleSSEEvent(event: SSEEvent): void {
		switch (event.type) {
			case "data":
				this.handleDataEvent(event.data);
				break;
			case "error":
				this.handleErrorEvent(event.data);
				break;
			case "complete":
				this.handleCompleteEvent(event.data);
				break;
			case "heartbeat":
				// Heartbeat received, connection is alive
				break;
		}
	}

	private handleDataEvent(data: any): void {
		if (data.type === "chunk") {
			// Handle streaming response chunk
			const lastMessage = this.messages[this.messages.length - 1];

			if (lastMessage && lastMessage.role === "assistant") {
				// Append to existing assistant message
				lastMessage.content += data.content;
				this.options.onMessage(lastMessage);
			} else {
				// Create new assistant message
				const message: ChatMessage = {
					id: `msg_${Date.now()}_assistant`,
					role: "assistant",
					content: data.content,
					timestamp: Date.now(),
				};

				this.messages.push(message);
				this.options.onMessage(message);
			}
		} else if (data.type === "start") {
			// New conversation started
			const userMessage: ChatMessage = {
				id: data.messageId,
				role: "user",
				content: data.content || "", // Use data content if available
				timestamp: Date.now(),
			};

			this.messages.push(userMessage);
		}
	}

	private handleErrorEvent(data: any): void {
		this.options.onError(new Error(data.message || "Chat error"));
	}

	private handleCompleteEvent(data: any): void {
		// Message completion - final processing
		if (data.totalTokens) {
			const lastMessage = this.messages[this.messages.length - 1];
			if (lastMessage) {
				// Initialize metadata if it doesn't exist
				if (!lastMessage.metadata) {
					lastMessage.metadata = {};
				}
				lastMessage.metadata.tokens = data.totalTokens;
			}
		}
	}

	private scheduleReconnect(): void {
		const delay =
			this.options.reconnectDelay * Math.pow(2, this.reconnectCount);

		this.reconnectTimeout = setTimeout(() => {
			this.reconnectCount++;
			this.reconnectTimeout = undefined;
			this.connect();
		}, delay);
	}
}

/**
 * Create chat client instance
 */
export function createChatClient(options: ChatClientOptions): ChatClient {
	return new ChatClient(options);
}

/**
 * React-style hook for chat streaming (can be adapted for other frameworks)
 */
export function useChatStream(options: ChatClientOptions): ChatStreamHook {
	// This would typically use React hooks or similar framework state management
	// For now, providing a basic implementation that can be extended

	const client = new ChatClient(options);

	// Connect on creation
	client.connect();

	return {
		get messages() {
			return client.getMessages();
		},
		get isConnected() {
			return client.getConnectionStatus().connected;
		},
		get isReconnecting() {
			return client.getConnectionStatus().reconnecting;
		},

		sendMessage: async (content: string) => {
			await client.sendMessage(content);
		},

		disconnect: () => {
			client.disconnect();
		},

		reconnect: () => {
			client.connect();
		},

		clearHistory: () => {
			client.clearMessages();
		},
	};
}

/**
 * Utility for creating SSE EventSource with automatic reconnection
 */
export function createSSEConnection(
	url: string,
	options: {
		onMessage?: (event: MessageEvent) => void;
		onError?: (error: Error) => void;
		onOpen?: () => void;
		reconnect?: boolean;
		maxReconnectAttempts?: number;
	} = {},
): {
	connect: () => void;
	disconnect: () => void;
	isConnected: () => boolean;
} {
	let eventSource: EventSource | null = null;
	let reconnectCount = 0;
	let isConnected = false;

	const maxAttempts = options.maxReconnectAttempts ?? 5;

	const connect = () => {
		if (eventSource) {
			eventSource.close();
		}

		eventSource = new EventSource(url);

		eventSource.onopen = () => {
			isConnected = true;
			reconnectCount = 0;
			options.onOpen?.();
		};

		eventSource.onmessage = (event) => {
			options.onMessage?.(event);
		};

		eventSource.onerror = () => {
			isConnected = false;

			if (options.reconnect && reconnectCount < maxAttempts) {
				setTimeout(
					() => {
						reconnectCount++;
						connect();
					},
					1000 * Math.pow(2, reconnectCount),
				);
			} else {
				options.onError?.(new Error("SSE connection failed"));
			}
		};
	};

	const disconnect = () => {
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}
		isConnected = false;
	};

	return {
		connect,
		disconnect,
		isConnected: () => isConnected,
	};
}
