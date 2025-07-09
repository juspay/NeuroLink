/**
 * Transport Manager for MCP connections
 * Supports stdio, SSE, and HTTP transports with reconnection logic
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";
import { ErrorManager } from "./error-manager.js";
import { ErrorCategory, ErrorSeverity } from "./error-manager.js";

// Transport configuration schemas
export const TransportConfigSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("stdio"),
		command: z.string(),
		args: z.array(z.string()).optional(),
		cwd: z.string().optional(),
		env: z.record(z.string()).optional(),
	}),
	z.object({
		type: z.literal("sse"),
		url: z.string().url(),
		headers: z.record(z.string()).optional(),
		timeout: z.number().min(5).default(30),
		maxRetryTime: z.number().default(5000),
		withCredentials: z.boolean().default(false),
	}),
	z.object({
		type: z.literal("http"),
		url: z.string().url(),
		headers: z.record(z.string()).optional(),
		timeout: z.number().min(5).default(30),
	}),
]);

export type TransportConfig = z.infer<typeof TransportConfigSchema>;

export interface TransportStatus {
	connected: boolean;
	type: "stdio" | "sse" | "http";
	lastConnected?: Date;
	lastError?: Error;
	reconnectAttempts: number;
}

export interface TransportManagerOptions {
	autoReconnect?: boolean;
	maxReconnectAttempts?: number;
	reconnectDelay?: number;
	healthCheckInterval?: number;
	jitterEnabled?: boolean; // Enable/disable jitter for testing
	maxJitter?: number; // Maximum jitter in ms (default: 1000)
}

/**
 * Manages MCP transport connections with automatic reconnection and health monitoring
 */
export class TransportManager {
	private client?: Client;
	private config?: TransportConfig;
	private status: TransportStatus;
	private reconnectTimer?: NodeJS.Timeout;
	private healthCheckTimer?: NodeJS.Timeout;
	private reconnectPromise?: Promise<void>;

	constructor(
		private errorManager: ErrorManager,
		private options: TransportManagerOptions = {},
	) {
		// Initialize default options
		this.options = {
			jitterEnabled: true,
			maxJitter: 1000,
			...this.options,
		};

		this.status = {
			connected: false,
			type: "stdio",
			reconnectAttempts: 0,
		};

		// Apply defaults
		this.options = {
			autoReconnect: true,
			maxReconnectAttempts: 5,
			reconnectDelay: 1000,
			healthCheckInterval: 30000,
			...options,
		};
	}

	/**
	 * Connect to MCP server using specified transport
	 */
	async connect(config: TransportConfig): Promise<Client> {
		try {
			// Validate configuration
			const validatedConfig = TransportConfigSchema.parse(config);
			this.config = validatedConfig;
			this.status.type = validatedConfig.type;

			// Disconnect existing client if any
			if (this.client) {
				await this.disconnect();
			}

			// Create transport based on type
			const transport = await this.createTransport(validatedConfig);

			// Create MCP client
			this.client = new Client(
				{
					name: "neurolink-mcp-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			// Connect client
			await this.client.connect(transport);

			// Update status
			this.status.connected = true;
			this.status.lastConnected = new Date();
			this.status.reconnectAttempts = 0;

			// Set up health monitoring if enabled
			if (
				this.options.healthCheckInterval &&
				this.options.healthCheckInterval > 0
			) {
				this.setupHealthMonitoring();
			}

			return this.client;
		} catch (error) {
			this.handleConnectionError(error);
			throw error;
		}
	}

	/**
	 * Create transport based on configuration
	 */
	async createTransport(config: TransportConfig): Promise<any> {
		switch (config.type) {
			case "stdio":
				return this.createStdioTransport(config);
			case "sse":
				return this.createSSETransport(config);
			case "http":
				return this.createHTTPTransport(config);
			default:
				throw new Error(`Unsupported transport type: ${(config as any).type}`);
		}
	}

	/**
	 * Create stdio transport
	 */
	private createStdioTransport(
		config: Extract<TransportConfig, { type: "stdio" }>,
	) {
		// Filter out undefined values from process.env
		const envWithoutUndefined = Object.fromEntries(
			Object.entries(process.env).filter(([_, value]) => value !== undefined),
		) as Record<string, string>;

		// StdioClientTransport handles process creation internally
		return new StdioClientTransport({
			command: config.command,
			args: config.args ?? [],
			env: { ...envWithoutUndefined, ...config.env },
			cwd: config.cwd,
		});
	}

	/**
	 * Create SSE transport with reconnection support
	 */
	private async createSSETransport(
		config: Extract<TransportConfig, { type: "sse" }>,
	) {
		// Dynamically import SSE transport
		const { SSEClientTransport } = await import(
			"@modelcontextprotocol/sdk/client/sse.js"
		);

		// Use ReconnectingEventSource for reliability
		const ReconnectingEventSource = await import(
			"reconnecting-eventsource"
		).then((m) => m.default);

		return new SSEClientTransport(new URL(config.url), {
			requestInit: {
				headers: config.headers,
				...(config.timeout && { timeout: config.timeout }),
			},
			eventSourceInit: {
				eventSource: ReconnectingEventSource,
				max_retry_time: config.maxRetryTime,
				withCredentials: config.withCredentials,
			} as any,
		});
	}

	/**
	 * Create HTTP transport
	 */
	private async createHTTPTransport(
		config: Extract<TransportConfig, { type: "http" }>,
	) {
		// Dynamically import HTTP transport
		const httpModule = await import(
			"@modelcontextprotocol/sdk/client/streamableHttp.js"
		);
		const HTTPClientTransport =
			(httpModule as any).default || (httpModule as any).HTTPClientTransport;

		return new HTTPClientTransport(new URL(config.url), {
			requestInit: {
				headers: config.headers,
				timeout: config.timeout * 1000, // Convert seconds to milliseconds
			},
		});
	}

	/**
	 * Set up health monitoring
	 */
	private setupHealthMonitoring(): void {
		if (!this.client) {
			return;
		}

		// Clear any existing health check timer
		if (this.healthCheckTimer) {
			clearInterval(this.healthCheckTimer);
		}

		// Set up periodic health checks
		this.healthCheckTimer = setInterval(async () => {
			if (!this.client) {
				return;
			}

			try {
				// Simple health check - list tools
				await this.client.request(
					{ method: "tools/list" },
					z.object({ tools: z.array(z.any()) }),
				);
			} catch (error) {
				// Health check failed, trigger reconnection if enabled
				if (this.options.autoReconnect && this.config) {
					this.handleConnectionError(error);
				}
			}
		}, this.options.healthCheckInterval!);
	}

	/**
	 * Handle connection errors
	 */
	private handleConnectionError(error: unknown): void {
		const err = error instanceof Error ? error : new Error(String(error));
		this.status.connected = false;
		this.status.lastError = err;

		// Record error
		this.errorManager.recordError(err, {
			category: ErrorCategory.CONNECTION_ERROR,
			severity: ErrorSeverity.HIGH,
			toolName: "transport-manager",
			parameters: {
				transport: this.status.type,
				reconnectAttempts: this.status.reconnectAttempts,
			},
		});

		// Attempt reconnection if enabled
		if (
			this.options.autoReconnect &&
			this.status.reconnectAttempts < this.options.maxReconnectAttempts!
		) {
			// Schedule reconnection attempt
			this.scheduleReconnect();
		}
	}

	/**
	 * Schedule reconnection attempt
	 */
	private scheduleReconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}

		// Increment attempts BEFORE calculating delay (uses updated attempt count)
		this.status.reconnectAttempts++;
		const delay = this.calculateReconnectDelay();
		this.reconnectTimer = setTimeout(() => {
			this.reconnect().catch((error) => {
				console.error("Reconnection failed:", error);
			});
		}, delay);
	}

	/**
	 * Calculate reconnect delay with exponential backoff
	 */
	private calculateReconnectDelay(): number {
		const baseDelay = this.options.reconnectDelay || 1000;
		const maxDelay = 30000; // 30 seconds max
		const delay = Math.min(
			baseDelay * Math.pow(2, this.status.reconnectAttempts),
			maxDelay,
		);

		// Add configurable jitter to prevent thundering herd
		if (this.options.jitterEnabled === true) {
			const maxJitter = this.options.maxJitter || 1000;
			return delay + Math.random() * maxJitter;
		}

		return delay;
	}

	/**
	 * Reconnect to server
	 */
	async reconnect(): Promise<void> {
		// Prevent concurrent reconnection attempts
		if (this.reconnectPromise) {
			return this.reconnectPromise;
		}

		this.reconnectPromise = this._reconnect();
		try {
			await this.reconnectPromise;
		} finally {
			this.reconnectPromise = undefined;
		}
	}

	private async _reconnect(): Promise<void> {
		if (!this.config) {
			throw new Error("No configuration available for reconnection");
		}

		try {
			await this.connect(this.config);
			console.log(
				`Reconnected successfully after ${this.status.reconnectAttempts} attempts`,
			);
		} catch (error) {
			if (this.status.reconnectAttempts >= this.options.maxReconnectAttempts!) {
				throw new Error(
					`Max reconnection attempts (${this.options.maxReconnectAttempts}) reached`,
				);
			}
			throw error;
		}
	}

	/**
	 * Disconnect from server
	 */
	async disconnect(): Promise<void> {
		// Clear reconnection timer
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = undefined;
		}

		// Stop health monitoring
		if (this.healthCheckTimer) {
			clearInterval(this.healthCheckTimer);
			this.healthCheckTimer = undefined;
		}

		// Close client connection
		if (this.client) {
			await this.client.close();
			this.client = undefined;
		}

		// Update status
		this.status.connected = false;
	}

	/**
	 * Get current transport status
	 */
	getStatus(): TransportStatus {
		return { ...this.status };
	}

	/**
	 * Get connected client
	 */
	getClient(): Client | undefined {
		return this.client;
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.status.connected && this.client !== undefined;
	}

	/**
	 * Reset reconnection attempts
	 */
	resetReconnectAttempts(): void {
		this.status.reconnectAttempts = 0;
	}
}
