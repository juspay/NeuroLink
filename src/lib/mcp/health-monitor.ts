/**
 * NeuroLink MCP Health Monitoring System
 * Provides periodic health checks, connection status tracking, and auto-recovery
 * Based on health monitoring patterns from Cline
 */

import type { MCPRegistry } from "./registry.js";
import type { NeuroLinkExecutionContext } from "./factory.js";
import { ErrorManager, ErrorCategory, ErrorSeverity } from "./error-manager.js";

/**
 * Connection status states
 */
export enum ConnectionStatus {
	DISCONNECTED = "DISCONNECTED",
	CONNECTING = "CONNECTING",
	CONNECTED = "CONNECTED",
	CHECKING = "CHECKING",
	ERROR = "ERROR",
	RECOVERING = "RECOVERING",
}

/**
 * Health check result
 */
export interface HealthCheckResult {
	success: boolean;
	status: ConnectionStatus;
	message?: string;
	latency?: number;
	error?: Error;
	timestamp: number;
}

/**
 * Server health information
 */
export interface ServerHealth {
	serverId: string;
	status: ConnectionStatus;
	lastCheck?: HealthCheckResult;
	checkCount: number;
	errorCount: number;
	lastSuccessfulCheck?: number;
	recoveryAttempts: number;
	nextCheckTime?: number;
}

/**
 * Health monitor configuration
 */
export interface HealthMonitorOptions {
	checkInterval?: number; // Default: 30 seconds
	checkTimeout?: number; // Default: 5 seconds
	maxRecoveryAttempts?: number; // Default: 3
	recoveryDelay?: number; // Default: 5 seconds
	enableAutoRecovery?: boolean; // Default: true
}

/**
 * Health check strategy interface
 */
export interface HealthCheckStrategy {
	name: string;
	check(serverId: string, registry: MCPRegistry): Promise<HealthCheckResult>;
}

/**
 * Ping health check - Simple availability check
 */
export class PingHealthCheck implements HealthCheckStrategy {
	name = "ping";

	async check(
		serverId: string,
		registry: MCPRegistry,
	): Promise<HealthCheckResult> {
		const startTime = Date.now();

		try {
			// Try to list tools as a simple ping
			const tools = await registry.listTools();
			const latency = Date.now() - startTime;

			return {
				success: true,
				status: ConnectionStatus.CONNECTED,
				latency,
				timestamp: Date.now(),
			};
		} catch (error) {
			return {
				success: false,
				status: ConnectionStatus.ERROR,
				error: error instanceof Error ? error : new Error(String(error)),
				timestamp: Date.now(),
			};
		}
	}
}

/**
 * Tool list validation check - Ensures tools are accessible
 */
export class ToolListValidationCheck implements HealthCheckStrategy {
	name = "tool-validation";

	async check(
		serverId: string,
		registry: MCPRegistry,
	): Promise<HealthCheckResult> {
		const startTime = Date.now();

		try {
			const tools = await registry.listTools();
			const latency = Date.now() - startTime;

			if (!tools || tools.length === 0) {
				return {
					success: false,
					status: ConnectionStatus.ERROR,
					message: "No tools available from server",
					latency,
					timestamp: Date.now(),
				};
			}

			return {
				success: true,
				status: ConnectionStatus.CONNECTED,
				message: `${tools.length} tools available`,
				latency,
				timestamp: Date.now(),
			};
		} catch (error) {
			return {
				success: false,
				status: ConnectionStatus.ERROR,
				error: error instanceof Error ? error : new Error(String(error)),
				timestamp: Date.now(),
			};
		}
	}
}

/**
 * Performance baseline check - Monitors response times
 */
export class PerformanceCheck implements HealthCheckStrategy {
	name = "performance";
	private performanceThreshold: number;

	constructor(thresholdMs: number = 1000) {
		this.performanceThreshold = thresholdMs;
	}

	async check(
		serverId: string,
		registry: MCPRegistry,
	): Promise<HealthCheckResult> {
		const startTime = Date.now();

		try {
			const tools = await registry.listTools();
			const latency = Date.now() - startTime;

			if (latency > this.performanceThreshold) {
				return {
					success: true, // Still successful, just slow
					status: ConnectionStatus.CONNECTED,
					message: `Performance degraded: ${latency}ms (threshold: ${this.performanceThreshold}ms)`,
					latency,
					timestamp: Date.now(),
				};
			}

			return {
				success: true,
				status: ConnectionStatus.CONNECTED,
				message: `Performance normal: ${latency}ms`,
				latency,
				timestamp: Date.now(),
			};
		} catch (error) {
			return {
				success: false,
				status: ConnectionStatus.ERROR,
				error: error instanceof Error ? error : new Error(String(error)),
				timestamp: Date.now(),
			};
		}
	}
}

/**
 * Health Monitor for MCP connections
 */
export class HealthMonitor {
	private registry: MCPRegistry;
	private errorManager: ErrorManager;
	private serverHealth: Map<string, ServerHealth> = new Map();
	private checkInterval: number;
	private checkTimeout: number;
	private maxRecoveryAttempts: number;
	private recoveryDelay: number;
	private enableAutoRecovery: boolean;
	private checkTimers: Map<string, NodeJS.Timeout> = new Map();
	private strategies: Map<string, HealthCheckStrategy> = new Map();
	private isMonitoring: boolean = false;
	private recoveryCallbacks: Map<string, (serverId: string) => Promise<void>> =
		new Map();

	constructor(
		registry: MCPRegistry,
		errorManager: ErrorManager,
		options: HealthMonitorOptions = {},
	) {
		this.registry = registry;
		this.errorManager = errorManager;
		this.checkInterval = options.checkInterval || 30000; // 30 seconds
		this.checkTimeout = options.checkTimeout || 5000; // 5 seconds
		this.maxRecoveryAttempts = options.maxRecoveryAttempts || 3;
		this.recoveryDelay = options.recoveryDelay || 5000; // 5 seconds
		this.enableAutoRecovery = options.enableAutoRecovery ?? true;

		// Initialize default strategies
		this.strategies.set("ping", new PingHealthCheck());
		this.strategies.set("tool-validation", new ToolListValidationCheck());
		this.strategies.set("performance", new PerformanceCheck());
	}

	/**
	 * Start monitoring all registered servers
	 */
	startMonitoring(): void {
		if (this.isMonitoring) {
			return;
		}

		this.isMonitoring = true;
		const servers = this.registry.listServers();

		if (process.env.NEUROLINK_DEBUG === "true") {
			console.log(
				`[HealthMonitor] Starting monitoring for ${servers.length} servers`,
			);
		}

		// Initialize health tracking for each server
		servers.forEach((serverId: string) => {
			if (!this.serverHealth.has(serverId)) {
				this.serverHealth.set(serverId, {
					serverId,
					status: ConnectionStatus.DISCONNECTED,
					checkCount: 0,
					errorCount: 0,
					recoveryAttempts: 0,
				});
			}

			// Start periodic checks
			this.scheduleHealthCheck(serverId);
		});
	}

	/**
	 * Stop monitoring all servers
	 */
	stopMonitoring(): void {
		this.isMonitoring = false;

		// Clear all timers
		this.checkTimers.forEach((timer) => clearTimeout(timer));
		this.checkTimers.clear();

		if (process.env.NEUROLINK_DEBUG === "true") {
			console.log("[HealthMonitor] Stopped monitoring");
		}
	}

	/**
	 * Perform health check for a specific server
	 *
	 * @param serverId Server to check
	 * @param strategy Strategy name to use (default: "ping")
	 * @returns Health check result
	 */
	async checkServerHealth(
		serverId: string,
		strategy: string = "ping",
	): Promise<HealthCheckResult> {
		const health = this.serverHealth.get(serverId) || {
			serverId,
			status: ConnectionStatus.DISCONNECTED,
			checkCount: 0,
			errorCount: 0,
			recoveryAttempts: 0,
		};

		// Update status to checking
		health.status = ConnectionStatus.CHECKING;
		this.serverHealth.set(serverId, health);

		// Get strategy
		const checkStrategy = this.strategies.get(strategy);
		if (!checkStrategy) {
			return {
				success: false,
				status: ConnectionStatus.ERROR,
				error: new Error(`Unknown health check strategy: ${strategy}`),
				timestamp: Date.now(),
			};
		}

		// Perform check with timeout
		const timeoutPromise = new Promise<HealthCheckResult>((_, reject) => {
			setTimeout(
				() => reject(new Error("Health check timeout")),
				this.checkTimeout,
			);
		});

		try {
			const result = await Promise.race([
				checkStrategy.check(serverId, this.registry),
				timeoutPromise,
			]);

			// Update health status
			health.checkCount++;
			health.lastCheck = result;

			if (result.success) {
				health.status = ConnectionStatus.CONNECTED;
				health.lastSuccessfulCheck = Date.now();
				health.errorCount = 0;
				health.recoveryAttempts = 0;
			} else {
				health.status = ConnectionStatus.ERROR;
				health.errorCount++;

				// Record error
				this.errorManager.recordError(
					result.error || new Error("Health check failed"),
					{
						category: ErrorCategory.NETWORK_ERROR,
						severity: ErrorSeverity.HIGH,
						toolName: `health-check-${serverId}`,
					},
				);
			}

			this.serverHealth.set(serverId, health);

			// Trigger recovery if enabled and failed
			if (
				!result.success &&
				this.enableAutoRecovery &&
				health.recoveryAttempts < this.maxRecoveryAttempts
			) {
				// Schedule recovery after returning result
				setTimeout(() => this.triggerRecovery(serverId), 0);
			}

			return result;
		} catch (error) {
			// Handle timeout or other errors
			const errorResult: HealthCheckResult = {
				success: false,
				status: ConnectionStatus.ERROR,
				error: error instanceof Error ? error : new Error(String(error)),
				timestamp: Date.now(),
			};

			health.status = ConnectionStatus.ERROR;
			health.errorCount++;
			health.lastCheck = errorResult;
			this.serverHealth.set(serverId, health);

			// Record error
			this.errorManager.recordError(error, {
				category: ErrorCategory.TIMEOUT_ERROR,
				severity: ErrorSeverity.HIGH,
				toolName: `health-check-${serverId}`,
			});

			return errorResult;
		}
	}

	/**
	 * Get health status for all servers
	 *
	 * @returns Map of server health information
	 */
	getHealthStatus(): Map<string, ServerHealth> {
		return new Map(this.serverHealth);
	}

	/**
	 * Get health status for a specific server
	 *
	 * @param serverId Server ID
	 * @returns Server health information or null
	 */
	getServerHealth(serverId: string): ServerHealth | null {
		return this.serverHealth.get(serverId) || null;
	}

	/**
	 * Register a recovery callback for a server
	 *
	 * @param serverId Server ID
	 * @param callback Recovery callback function
	 */
	registerRecoveryCallback(
		serverId: string,
		callback: (serverId: string) => Promise<void>,
	): void {
		this.recoveryCallbacks.set(serverId, callback);
	}

	/**
	 * Add a custom health check strategy
	 *
	 * @param strategy Health check strategy
	 */
	addStrategy(strategy: HealthCheckStrategy): void {
		this.strategies.set(strategy.name, strategy);
	}

	/**
	 * Schedule periodic health check for a server
	 *
	 * @private
	 */
	private scheduleHealthCheck(serverId: string): void {
		if (!this.isMonitoring) {
			return;
		}

		// Clear existing timer if any
		const existingTimer = this.checkTimers.get(serverId);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// Schedule next check
		const timer = setTimeout(async () => {
			await this.checkServerHealth(serverId);

			// Reschedule if still monitoring
			if (this.isMonitoring) {
				this.scheduleHealthCheck(serverId);
			}
		}, this.checkInterval);

		this.checkTimers.set(serverId, timer);

		// Update next check time
		const health = this.serverHealth.get(serverId);
		if (health) {
			health.nextCheckTime = Date.now() + this.checkInterval;
			this.serverHealth.set(serverId, health);
		}
	}

	/**
	 * Trigger recovery for a server
	 *
	 * @private
	 */
	private async triggerRecovery(serverId: string): Promise<void> {
		const health = this.serverHealth.get(serverId);
		if (!health) {
			return;
		}

		health.status = ConnectionStatus.RECOVERING;
		health.recoveryAttempts++;
		this.serverHealth.set(serverId, health);

		if (process.env.NEUROLINK_DEBUG === "true") {
			console.log(
				`[HealthMonitor] Triggering recovery for ${serverId} (attempt ${health.recoveryAttempts}/${this.maxRecoveryAttempts})`,
			);
		}

		// Use exponential backoff for recovery delay
		const delay = this.recoveryDelay * Math.pow(2, health.recoveryAttempts - 1);

		setTimeout(async () => {
			// Call custom recovery callback if registered
			const callback = this.recoveryCallbacks.get(serverId);
			if (callback) {
				try {
					await callback(serverId);

					// Perform immediate health check after recovery
					const result = await this.checkServerHealth(serverId);

					if (result.success) {
						if (process.env.NEUROLINK_DEBUG === "true") {
							console.log(
								`[HealthMonitor] Recovery successful for ${serverId}`,
							);
						}
					}
				} catch (error) {
					this.errorManager.recordError(error, {
						category: ErrorCategory.UNKNOWN_ERROR,
						severity: ErrorSeverity.CRITICAL,
						toolName: `recovery-${serverId}`,
					});
				}
			}
		}, delay);
	}

	/**
	 * Generate comprehensive health report
	 *
	 * @returns Health report with server statuses and metrics
	 */
	generateHealthReport(): {
		summary: {
			totalServers: number;
			healthyServers: number;
			unhealthyServers: number;
			recoveringServers: number;
			overallHealth: number; // 0-100 score
		};
		servers: Array<{
			serverId: string;
			status: ConnectionStatus;
			health: number; // 0-100 score
			uptime: number; // percentage
			avgLatency: number;
			lastError?: string;
			metrics: {
				totalChecks: number;
				successfulChecks: number;
				failedChecks: number;
				recoveryAttempts: number;
			};
		}>;
		trends: {
			healthHistory: Array<{ timestamp: number; health: number }>;
			errorRate: number; // errors per hour
			avgRecoveryTime: number; // ms
		};
		recommendations: string[];
	} {
		const servers = Array.from(this.serverHealth.values());
		const now = Date.now();

		// Calculate summary
		const summary = {
			totalServers: servers.length,
			healthyServers: servers.filter(
				(s) => s.status === ConnectionStatus.CONNECTED,
			).length,
			unhealthyServers: servers.filter(
				(s) => s.status === ConnectionStatus.ERROR,
			).length,
			recoveringServers: servers.filter(
				(s) => s.status === ConnectionStatus.RECOVERING,
			).length,
			overallHealth: 0,
		};

		// Calculate server details
		const serverReports = servers.map((server) => {
			const successRate =
				server.checkCount > 0
					? ((server.checkCount - server.errorCount) / server.checkCount) * 100
					: 0;

			const uptime =
				server.lastSuccessfulCheck && server.checkCount > 0
					? ((now - server.lastSuccessfulCheck) /
							(server.checkCount * this.checkInterval)) *
						100
					: 0;

			// Calculate average latency from recent checks
			const avgLatency = server.lastCheck?.latency || 0;

			// Calculate health score (0-100)
			let health = 100;
			health -= server.errorCount * 10; // -10 per error
			health -= server.recoveryAttempts * 5; // -5 per recovery attempt
			if (server.status === ConnectionStatus.ERROR) {
				health -= 50;
			}
			if (server.status === ConnectionStatus.RECOVERING) {
				health -= 25;
			}
			health = Math.max(0, Math.min(100, health));

			return {
				serverId: server.serverId,
				status: server.status,
				health,
				uptime: Math.min(100, uptime),
				avgLatency,
				lastError: server.lastCheck?.error?.message,
				metrics: {
					totalChecks: server.checkCount,
					successfulChecks: server.checkCount - server.errorCount,
					failedChecks: server.errorCount,
					recoveryAttempts: server.recoveryAttempts,
				},
			};
		});

		// Calculate overall health
		summary.overallHealth =
			serverReports.length > 0
				? Math.round(
						serverReports.reduce((sum, s) => sum + s.health, 0) /
							serverReports.length,
					)
				: 100;

		// Generate trends (simplified for now)
		const trends = {
			healthHistory: this.getHealthHistory(),
			errorRate: this.calculateErrorRate(),
			avgRecoveryTime: this.calculateAvgRecoveryTime(),
		};

		// Generate recommendations
		const recommendations = this.generateRecommendations(
			summary,
			serverReports,
		);

		return {
			summary,
			servers: serverReports,
			trends,
			recommendations,
		};
	}

	/**
	 * Get health metrics for monitoring dashboards
	 *
	 * @returns Simplified metrics for real-time monitoring
	 */
	getHealthMetrics(): {
		status: "healthy" | "degraded" | "critical";
		healthScore: number;
		activeAlerts: Array<{
			serverId: string;
			severity: "low" | "medium" | "high" | "critical";
			message: string;
			timestamp: number;
		}>;
		serverStatuses: Record<string, ConnectionStatus>;
		performance: {
			avgLatency: number;
			maxLatency: number;
			successRate: number;
		};
	} {
		const report = this.generateHealthReport();

		// Determine overall status
		let status: "healthy" | "degraded" | "critical";
		if (report.summary.overallHealth >= 80) {
			status = "healthy";
		} else if (report.summary.overallHealth >= 50) {
			status = "degraded";
		} else {
			status = "critical";
		}

		// Generate active alerts
		const activeAlerts: Array<{
			serverId: string;
			severity: "low" | "medium" | "high" | "critical";
			message: string;
			timestamp: number;
		}> = [];

		this.serverHealth.forEach((health, serverId) => {
			if (health.status === ConnectionStatus.ERROR) {
				activeAlerts.push({
					serverId,
					severity: health.errorCount > 5 ? "critical" : "high",
					message: health.lastCheck?.error?.message || "Server unreachable",
					timestamp: health.lastCheck?.timestamp || Date.now(),
				});
			} else if (health.status === ConnectionStatus.RECOVERING) {
				activeAlerts.push({
					serverId,
					severity: "medium",
					message: `Recovery attempt ${health.recoveryAttempts}/${this.maxRecoveryAttempts}`,
					timestamp: Date.now(),
				});
			}
		});

		// Calculate performance metrics
		const latencies = report.servers
			.map((s) => s.avgLatency)
			.filter((l) => l > 0);
		const performance = {
			avgLatency:
				latencies.length > 0
					? Math.round(
							latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
						)
					: 0,
			maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
			successRate:
				report.servers.length > 0
					? (report.summary.healthyServers / report.summary.totalServers) * 100
					: 100,
		};

		// Build server status map
		const serverStatuses: Record<string, ConnectionStatus> = {};
		this.serverHealth.forEach((health, serverId) => {
			serverStatuses[serverId] = health.status;
		});

		return {
			status,
			healthScore: report.summary.overallHealth,
			activeAlerts,
			serverStatuses,
			performance,
		};
	}

	/**
	 * Subscribe to health events
	 *
	 * @param event Event type to subscribe to
	 * @param callback Callback function
	 */
	on(
		event:
			| "health-change"
			| "recovery-started"
			| "recovery-failed"
			| "critical-error",
		callback: (data: any) => void,
	): void {
		// Implementation would use EventEmitter
		// For now, just a placeholder
	}

	/**
	 * Get health history for trend analysis
	 *
	 * @private
	 */
	private getHealthHistory(): Array<{ timestamp: number; health: number }> {
		// In a real implementation, this would track health over time
		// For now, return current snapshot
		const report = this.generateHealthReport();
		return [
			{
				timestamp: Date.now(),
				health: report.summary.overallHealth,
			},
		];
	}

	/**
	 * Calculate error rate
	 *
	 * @private
	 */
	private calculateErrorRate(): number {
		let totalErrors = 0;
		this.serverHealth.forEach((health) => {
			totalErrors += health.errorCount;
		});

		// Errors per hour (simplified)
		const hoursMonitored =
			(Date.now() - (Date.now() - this.checkInterval * 10)) / (1000 * 60 * 60);
		return hoursMonitored > 0 ? totalErrors / hoursMonitored : 0;
	}

	/**
	 * Calculate average recovery time
	 *
	 * @private
	 */
	private calculateAvgRecoveryTime(): number {
		// Simplified - would track actual recovery times
		return this.recoveryDelay * 2; // Assume average of 2 attempts
	}

	/**
	 * Generate health recommendations
	 *
	 * @private
	 */
	private generateRecommendations(summary: any, servers: any[]): string[] {
		const recommendations: string[] = [];

		// Check overall health
		if (summary.overallHealth < 50) {
			recommendations.push(
				"Critical: System health is below 50%. Immediate attention required.",
			);
		}

		// Check unhealthy servers
		if (summary.unhealthyServers > summary.totalServers * 0.3) {
			recommendations.push(
				"Multiple servers are failing. Check network connectivity and server availability.",
			);
		}

		// Check recovery attempts
		const highRecoveryServers = servers.filter(
			(s) => s.metrics.recoveryAttempts > 2,
		);
		if (highRecoveryServers.length > 0) {
			recommendations.push(
				`Servers with repeated recovery attempts: ${highRecoveryServers.map((s) => s.serverId).join(", ")}. Consider manual intervention.`,
			);
		}

		// Check latency
		const highLatencyServers = servers.filter((s) => s.avgLatency > 1000);
		if (highLatencyServers.length > 0) {
			recommendations.push(
				`High latency detected on servers: ${highLatencyServers.map((s) => s.serverId).join(", ")}. Check server load and network conditions.`,
			);
		}

		// Positive feedback
		if (summary.overallHealth >= 90) {
			recommendations.push(
				"System health is excellent. All servers are operating normally.",
			);
		}

		return recommendations;
	}
}

/**
 * Default health monitor instance (to be initialized with registry and error manager)
 */
export let defaultHealthMonitor: HealthMonitor | null = null;

/**
 * Initialize default health monitor
 *
 * @param registry Tool registry
 * @param errorManager Error manager
 * @param options Health monitor options
 * @returns Health monitor instance
 */
export function initializeHealthMonitor(
	registry: MCPRegistry,
	errorManager: ErrorManager,
	options?: HealthMonitorOptions,
): HealthMonitor {
	defaultHealthMonitor = new HealthMonitor(registry, errorManager, options);
	return defaultHealthMonitor;
}
