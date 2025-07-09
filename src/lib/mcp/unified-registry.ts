/**
 * Unified MCP Registry - Combines Multiple Registration Sources
 */

import type {
	DiscoveredMCP,
	ExecutionContext,
} from "./contracts/mcp-contract.js";
import { MCPRegistry } from "./registry.js";
import {
	discoverMCPServers,
	autoRegisterMCPServers,
} from "./auto-discovery.js";
import type { DiscoveryOptions } from "./auto-discovery.js";
import { unifiedRegistryLogger } from "./logging.js";
import {
	MCPToolRegistry,
	type ToolInfo,
	type ToolExecutionResult,
} from "./tool-registry.js";
import {
	TransportManager,
	TransportConfigSchema,
} from "./transport-manager.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ErrorManager } from "./error-manager.js";

/**
 * Unified registry combining multiple sources
 */
export class UnifiedMCPRegistry extends MCPToolRegistry {
	private autoDiscoveryEnabled = true;
	private autoDiscoveredServers: DiscoveredMCP[] = [];
	private manualServers: Map<string, any> = new Map();
	private availableServers: Set<string> = new Set();
	private transportManager: TransportManager;
	private activeConnections: Map<string, Client> = new Map();

	constructor(private errorManager: ErrorManager = new ErrorManager()) {
		super();
		this.transportManager = new TransportManager(this.errorManager);
	}

	/**
	 * Initialize with auto-discovery
	 */
	async initialize(options: DiscoveryOptions = {}): Promise<void> {
		unifiedRegistryLogger.info("Initializing unified MCP registry...");

		if (this.autoDiscoveryEnabled) {
			const result = await autoRegisterMCPServers(options);
			unifiedRegistryLogger.info(
				`Auto-discovery complete: ${result.registered} registered, ${result.failed} failed`,
			);

			// Register discovered plugins
			for (const plugin of result.plugins) {
				this.register(plugin as any);
				this.autoDiscoveredServers.push(plugin);
				this.availableServers.add(plugin.metadata.name);
			}
		}
	}

	/**
	 * Enable or disable auto-discovery
	 */
	setAutoDiscovery(enabled: boolean): void {
		this.autoDiscoveryEnabled = enabled;
		unifiedRegistryLogger.info(
			`Auto-discovery ${enabled ? "enabled" : "disabled"}`,
		);
	}

	/**
	 * Refresh discovery
	 */
	async refresh(options: DiscoveryOptions = {}): Promise<void> {
		this.clear();
		this.autoDiscoveredServers = [];
		this.availableServers.clear();
		await this.initialize(options);
	}

	/**
	 * Get total server count
	 */
	getTotalServerCount(): number {
		return this.list().length + this.manualServers.size;
	}

	/**
	 * Get available server count
	 */
	getAvailableServerCount(): number {
		return this.availableServers.size;
	}

	/**
	 * Get auto-discovered servers
	 */
	getAutoDiscoveredServers(): DiscoveredMCP[] {
		return this.autoDiscoveredServers;
	}

	/**
	 * Get manual servers
	 */
	getManualServers(): Map<string, any> {
		return this.manualServers;
	}

	/**
	 * List all tools from all registered plugins
	 */
	async listAllTools(): Promise<ToolInfo[]> {
		const allTools: ToolInfo[] = [];
		const plugins = this.list();

		for (const plugin of plugins) {
			try {
				// Get tools from plugin metadata if available
				const tools = await this.listTools();
				allTools.push(
					...tools.map((tool) => ({
						...tool,
						id: tool.name,
						serverId: tool.serverId || plugin.metadata.name,
						source: "unified",
					})),
				);
			} catch (error) {
				unifiedRegistryLogger.warn(
					`Failed to get tools from ${plugin.metadata.name}:`,
					error,
				);
			}
		}

		return allTools;
	}

	/**
	 * Execute a tool through the registry
	 */
	async executeTool<T = unknown>(
		toolName: string,
		args?: unknown,
		context?: ExecutionContext,
	): Promise<T> {
		unifiedRegistryLogger.info(`Executing tool: ${toolName}`);
		return super.executeTool<T>(toolName, args, context);
	}

	/**
	 * Lazily activate a server by ID
	 */
	async lazyActivateServer(serverId: string): Promise<boolean> {
		unifiedRegistryLogger.info(`Lazy activating server: ${serverId}`);

		// Check if already activated
		if (this.availableServers.has(serverId)) {
			return true;
		}

		// Try to find and activate
		const plugin = this.get(serverId);
		if (plugin) {
			try {
				// Mark as available (initialization happens elsewhere)
				this.availableServers.add(serverId);
				return true;
			} catch (error) {
				unifiedRegistryLogger.error(
					`Failed to activate server ${serverId}:`,
					error,
				);
			}
		}

		return false;
	}

	/**
	 * Register a manual server
	 */
	registerManualServer(id: string, server: any): void {
		this.manualServers.set(id, server);
		this.availableServers.add(id);
	}

	/**
	 * Get registry statistics (override parent method)
	 */
	getStats(): Record<
		string,
		{ count: number; averageTime: number; totalTime: number }
	> {
		// Return execution stats in the expected format
		return super.getStats();
	}

	/**
	 * Get detailed registry statistics
	 */
	async getDetailedStats(): Promise<{
		total: number;
		bySource: Record<string, number>;
		byType: Record<string, number>;
		manual?: { servers: number };
		auto?: { servers: number };
		tools?: number;
	}> {
		const plugins = this.list();
		const bySource: Record<string, number> = {};
		const byType: Record<string, number> = {};

		for (const plugin of plugins) {
			const source = (plugin as any).source || "unknown";
			bySource[source] = (bySource[source] || 0) + 1;

			// Extract type from name or metadata
			const type =
				plugin.metadata.name.split("/")[1]?.split("-")[0] || "unknown";
			byType[type] = (byType[type] || 0) + 1;
		}

		return {
			total: plugins.length,
			bySource,
			byType,
			manual: { servers: this.manualServers.size },
			auto: { servers: this.autoDiscoveredServers.length },
			tools: 0, // Will be populated when tools are registered
		};
	}

	/**
	 * Add external MCP server programmatically
	 *
	 * @param serverId - Unique server identifier
	 * @param config - Server configuration (stdio, sse, or http)
	 */
	async addExternalServer(
		serverId: string,
		config: {
			type: "stdio" | "sse" | "http";
			command?: string;
			args?: string[];
			env?: Record<string, string>;
			cwd?: string;
			url?: string;
			headers?: Record<string, string>;
			timeout?: number;
		},
	): Promise<void> {
		unifiedRegistryLogger.info(
			`Adding external server: ${serverId} (${config.type})`,
		);

		// Create server metadata
		const serverMeta: DiscoveredMCP = {
			metadata: {
				name: serverId,
				version: "1.0.0",
				main: "index.js",
				engine: { neurolink: ">=4.0.0" },
				description: `External ${config.type} server: ${serverId}`,
				permissions: ["network", "filesystem"],
			},
			entryPath: "",
			source: "installed",
			constructor: undefined,
		};

		// Register in internal registry
		this.register(serverMeta as any);
		this.manualServers.set(serverId, config);
		this.availableServers.add(serverId);

		// Establish actual connection to make server immediately reachable
		try {
			// Validate config for stdio transport (most common case)
			if (config.type === "stdio" && !config.command) {
				throw new Error("Command is required for stdio transport");
			}

			// Create transport with proper type validation
			// Validate config shape before creating transport
			const validatedConfig = TransportConfigSchema.parse(config);
			const transport =
				await this.transportManager.createTransport(validatedConfig);
			const client = new Client(
				{
					name: "neurolink-client",
					version: "4.1.0",
				},
				{
					capabilities: {
						tools: {},
						logging: {},
					},
				},
			);

			// Connect the client
			await client.connect(transport);
			this.activeConnections.set(serverId, client);

			unifiedRegistryLogger.info(
				`Successfully connected to external server: ${serverId}`,
			);
			unifiedRegistryLogger.info(
				`Successfully added external server: ${serverId}`,
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			unifiedRegistryLogger.warn(
				`Failed to establish connection to ${serverId}: ${errorMessage}. Server registered but not connected.`,
			);
			unifiedRegistryLogger.info(
				`Successfully registered external server: ${serverId} but connection failed.`,
			);
		}
	}

	/**
	 * Get active connection for a server
	 */
	getConnection(serverId: string): Client | undefined {
		return this.activeConnections.get(serverId);
	}

	/**
	 * Check if server is actively connected
	 */
	isConnected(serverId: string): boolean {
		return this.activeConnections.has(serverId);
	}

	/**
	 * Clear all registries and active connections (synchronous, preserves base API contract)
	 */
	/**
	 * Clear registries without closing connections (internal use)
	 */
	private clearRegistriesOnly(): void {
		super.clear();
		this.autoDiscoveredServers = [];
		this.manualServers.clear();
		this.availableServers.clear();
	}

	/**
	 * Clear all registries and initiate async connection cleanup
	 */
	clear(): void {
		// Close all active connections before clearing registries to prevent resource leaks
		const closePromises: Promise<void>[] = [];
		for (const [serverId, client] of this.activeConnections) {
			closePromises.push(
				client.close().catch((error) => {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					unifiedRegistryLogger.warn(
						`Failed to close connection for ${serverId}: ${errorMessage}`,
					);
				}),
			);
		}

		// Handle async cleanup without blocking synchronous clear()
		Promise.allSettled(closePromises).then(() => {
			this.activeConnections.clear();
		});

		// Clear registries after initiating connection cleanup
		this.clearRegistriesOnly();
	}

	/**
	 * Clear all registries and close active connections asynchronously
	 */
	async clearAsync(): Promise<void> {
		// Close all active connections first
		for (const [serverId, client] of this.activeConnections) {
			try {
				await client.close();
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				unifiedRegistryLogger.warn(
					`Failed to close connection for ${serverId}: ${errorMessage}`,
				);
			}
		}
		this.activeConnections.clear();

		// Clear registries without attempting to close connections again
		this.clearRegistriesOnly();
	}
}

/**
 * Default unified registry instance
 */
export const unifiedRegistry = new UnifiedMCPRegistry();
