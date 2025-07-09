/**
 * NeuroLink MCP Health Monitor Tests
 * Comprehensive test suite for health monitoring and auto-recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	HealthMonitor,
	ConnectionStatus,
	PingHealthCheck,
	ToolListValidationCheck,
	PerformanceCheck,
	initializeHealthMonitor,
	type HealthCheckResult,
	type ServerHealth,
} from "../lib/mcp/health-monitor.js";
import { MCPRegistry } from "../lib/mcp/registry.js";
import { ErrorManager } from "../lib/mcp/error-manager.js";

describe("HealthMonitor", () => {
	let healthMonitor: HealthMonitor;
	let mockRegistry: MCPRegistry;
	let mockErrorManager: ErrorManager;
	let timers: ReturnType<typeof vi.useFakeTimers>;

	beforeEach(() => {
		timers = vi.useFakeTimers();
		mockRegistry = new MCPRegistry();
		mockErrorManager = new ErrorManager();

		// Mock registry methods
		vi.spyOn(mockRegistry, "listServers").mockReturnValue([
			"server1",
			"server2",
		]);
		vi.spyOn(mockRegistry, "listTools").mockResolvedValue([
			{
				name: "tool1",
				description: "Tool 1",
				serverId: "server1",
				category: "general",
			},
			{
				name: "tool2",
				description: "Tool 2",
				serverId: "server1",
				category: "general",
			},
		]);

		healthMonitor = new HealthMonitor(mockRegistry, mockErrorManager, {
			checkInterval: 5000, // 5 seconds for testing
			checkTimeout: 1000, // 1 second timeout
			maxRecoveryAttempts: 3,
			recoveryDelay: 1000,
			enableAutoRecovery: true,
		});
	});

	afterEach(() => {
		healthMonitor.stopMonitoring();
		vi.clearAllTimers();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe("Health Monitoring", () => {
		it("should start monitoring all registered servers", () => {
			healthMonitor.startMonitoring();

			expect(mockRegistry.listServers).toHaveBeenCalled();
			const status = healthMonitor.getHealthStatus();

			expect(status.size).toBe(2);
			expect(status.has("server1")).toBe(true);
			expect(status.has("server2")).toBe(true);
		});

		it("should not start monitoring twice", () => {
			healthMonitor.startMonitoring();
			const firstCallCount = (mockRegistry.listServers as any).mock.calls
				.length;

			healthMonitor.startMonitoring();
			const secondCallCount = (mockRegistry.listServers as any).mock.calls
				.length;

			expect(secondCallCount).toBe(firstCallCount);
		});

		it("should schedule periodic health checks", async () => {
			healthMonitor.startMonitoring();

			// Fast-forward to first check
			await timers.advanceTimersByTimeAsync(5000);

			expect(mockRegistry.listTools).toHaveBeenCalled();
		});

		it("should stop monitoring and clear timers", () => {
			healthMonitor.startMonitoring();
			const statusBefore = healthMonitor.getHealthStatus();
			expect(statusBefore.size).toBe(2);

			healthMonitor.stopMonitoring();

			// Advance time and verify no more checks
			const callCount = (mockRegistry.listTools as any).mock.calls.length;
			timers.advanceTimersByTime(10000);
			expect((mockRegistry.listTools as any).mock.calls.length).toBe(callCount);
		});
	});

	describe("Health Check Strategies", () => {
		describe("PingHealthCheck", () => {
			it("should return success when server responds", async () => {
				const strategy = new PingHealthCheck();
				const result = await strategy.check("server1", mockRegistry);

				expect(result.success).toBe(true);
				expect(result.status).toBe(ConnectionStatus.CONNECTED);
				expect(result.latency).toBeDefined();
				expect(result.latency).toBeGreaterThanOrEqual(0);
			});

			it("should return error when server fails", async () => {
				vi.spyOn(mockRegistry, "listTools").mockRejectedValueOnce(
					new Error("Connection failed"),
				);

				const strategy = new PingHealthCheck();
				const result = await strategy.check("server1", mockRegistry);

				expect(result.success).toBe(false);
				expect(result.status).toBe(ConnectionStatus.ERROR);
				expect(result.error).toBeDefined();
				expect(result.error?.message).toBe("Connection failed");
			});
		});

		describe("ToolListValidationCheck", () => {
			it("should return success with tool count", async () => {
				const strategy = new ToolListValidationCheck();
				const result = await strategy.check("server1", mockRegistry);

				expect(result.success).toBe(true);
				expect(result.status).toBe(ConnectionStatus.CONNECTED);
				expect(result.message).toBe("2 tools available");
			});

			it("should return error when no tools available", async () => {
				vi.spyOn(mockRegistry, "listTools").mockResolvedValueOnce([]);

				const strategy = new ToolListValidationCheck();
				const result = await strategy.check("server1", mockRegistry);

				expect(result.success).toBe(false);
				expect(result.status).toBe(ConnectionStatus.ERROR);
				expect(result.message).toBe("No tools available from server");
			});
		});

		describe("PerformanceCheck", () => {
			it("should return success for normal performance", async () => {
				const strategy = new PerformanceCheck(100); // 100ms threshold
				const result = await strategy.check("server1", mockRegistry);

				expect(result.success).toBe(true);
				expect(result.status).toBe(ConnectionStatus.CONNECTED);
				expect(result.message).toContain("Performance normal");
			});

			it("should detect degraded performance", async () => {
				// Use real timers for this test
				vi.useRealTimers();

				// Mock slow response
				vi.spyOn(mockRegistry, "listTools").mockImplementation(async () => {
					await new Promise((resolve) => setTimeout(resolve, 150));
					return [
						{
							name: "tool1",
							description: "Tool 1",
							serverId: "server1",
							category: "general",
						},
					];
				});

				const strategy = new PerformanceCheck(100); // 100ms threshold
				const result = await strategy.check("server1", mockRegistry);

				expect(result.success).toBe(true); // Still successful, just slow
				expect(result.status).toBe(ConnectionStatus.CONNECTED);
				expect(result.message).toContain("Performance degraded");
				expect(result.latency).toBeGreaterThan(100);

				// Restore fake timers
				vi.useFakeTimers();
			});
		});
	});

	describe("Server Health Tracking", () => {
		it("should track health check results", async () => {
			const result = await healthMonitor.checkServerHealth("server1");

			expect(result.success).toBe(true);

			const health = healthMonitor.getServerHealth("server1");
			expect(health).toBeDefined();
			expect(health?.checkCount).toBe(1);
			expect(health?.status).toBe(ConnectionStatus.CONNECTED);
			expect(health?.lastCheck).toEqual(result);
			expect(health?.errorCount).toBe(0);
		});

		it("should track error counts", async () => {
			vi.spyOn(mockRegistry, "listTools").mockRejectedValueOnce(
				new Error("Connection failed"),
			);

			await healthMonitor.checkServerHealth("server1");

			const health = healthMonitor.getServerHealth("server1");
			expect(health?.errorCount).toBe(1);
			expect(health?.status).toBe(ConnectionStatus.ERROR);
		});

		it("should reset error count on successful check", async () => {
			// First fail
			vi.spyOn(mockRegistry, "listTools").mockRejectedValueOnce(
				new Error("Connection failed"),
			);
			await healthMonitor.checkServerHealth("server1");

			let health = healthMonitor.getServerHealth("server1");
			expect(health?.errorCount).toBe(1);

			// Then succeed
			await healthMonitor.checkServerHealth("server1");

			health = healthMonitor.getServerHealth("server1");
			expect(health?.errorCount).toBe(0);
			expect(health?.status).toBe(ConnectionStatus.CONNECTED);
		});

		it("should handle unknown health check strategy", async () => {
			const result = await healthMonitor.checkServerHealth(
				"server1",
				"unknown-strategy",
			);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain("Unknown health check strategy");
		});
	});

	describe("Auto-Recovery", () => {
		it("should trigger recovery on health check failure", async () => {
			const recoveryCallback = vi.fn().mockResolvedValue(undefined);
			healthMonitor.registerRecoveryCallback("server1", recoveryCallback);

			vi.spyOn(mockRegistry, "listTools").mockRejectedValueOnce(
				new Error("Connection failed"),
			);

			await healthMonitor.checkServerHealth("server1");

			// Advance time to trigger recovery
			await timers.advanceTimersByTimeAsync(1000);

			expect(recoveryCallback).toHaveBeenCalledWith("server1");
		});

		it("should use exponential backoff for recovery attempts", async () => {
			const recoveryCallback = vi.fn().mockResolvedValue(undefined);
			healthMonitor.registerRecoveryCallback("server1", recoveryCallback);

			// Always fail health checks
			vi.spyOn(mockRegistry, "listTools").mockRejectedValue(
				new Error("Connection failed"),
			);

			// First failure
			await healthMonitor.checkServerHealth("server1");
			await timers.advanceTimersByTimeAsync(1000); // 1 second delay
			expect(recoveryCallback).toHaveBeenCalledTimes(1);

			// Second failure
			await healthMonitor.checkServerHealth("server1");
			await timers.advanceTimersByTimeAsync(2000); // 2 second delay (exponential)
			expect(recoveryCallback).toHaveBeenCalledTimes(2);

			// Third failure
			await healthMonitor.checkServerHealth("server1");
			await timers.advanceTimersByTimeAsync(4000); // 4 second delay (exponential)
			expect(recoveryCallback).toHaveBeenCalledTimes(3);
		});

		it("should respect max recovery attempts", async () => {
			const recoveryCallback = vi.fn().mockResolvedValue(undefined);
			healthMonitor.registerRecoveryCallback("server1", recoveryCallback);

			// Always fail health checks
			vi.spyOn(mockRegistry, "listTools").mockRejectedValue(
				new Error("Connection failed"),
			);

			// Exhaust recovery attempts
			for (let i = 0; i < 3; i++) {
				await healthMonitor.checkServerHealth("server1");
				await timers.advanceTimersByTimeAsync(10000);
			}

			expect(recoveryCallback).toHaveBeenCalledTimes(3);

			// Fourth failure should not trigger recovery
			await healthMonitor.checkServerHealth("server1");
			await timers.advanceTimersByTimeAsync(10000);

			expect(recoveryCallback).toHaveBeenCalledTimes(3); // Still 3
		});

		it("should check health immediately after recovery", async () => {
			const checkSpy = vi.spyOn(healthMonitor, "checkServerHealth");
			const recoveryCallback = vi.fn().mockResolvedValue(undefined);
			healthMonitor.registerRecoveryCallback("server1", recoveryCallback);

			// First check fails
			vi.spyOn(mockRegistry, "listTools")
				.mockRejectedValueOnce(new Error("Connection failed"))
				.mockResolvedValue([
					{
						name: "tool1",
						description: "Tool 1",
						serverId: "server1",
						category: "general",
					},
				]);

			await healthMonitor.checkServerHealth("server1");
			const callCount = checkSpy.mock.calls.length;

			// Trigger recovery
			await timers.advanceTimersByTimeAsync(1000);

			// Should have called checkServerHealth again
			expect(checkSpy.mock.calls.length).toBe(callCount + 1);
		});
	});

	describe("Custom Strategies", () => {
		it("should allow adding custom health check strategies", async () => {
			const customStrategy = {
				name: "custom",
				check: vi.fn().mockResolvedValue({
					success: true,
					status: ConnectionStatus.CONNECTED,
					message: "Custom check passed",
					timestamp: Date.now(),
				}),
			};

			healthMonitor.addStrategy(customStrategy);

			const result = await healthMonitor.checkServerHealth("server1", "custom");

			expect(customStrategy.check).toHaveBeenCalledWith(
				"server1",
				mockRegistry,
			);
			expect(result.message).toBe("Custom check passed");
		});
	});

	describe("Health Status Reporting", () => {
		it("should return complete health status", async () => {
			healthMonitor.startMonitoring();

			// Perform some checks
			await healthMonitor.checkServerHealth("server1");
			vi.spyOn(mockRegistry, "listTools").mockRejectedValueOnce(
				new Error("Failed"),
			);
			await healthMonitor.checkServerHealth("server2");

			const status = healthMonitor.getHealthStatus();

			expect(status.size).toBe(2);

			const server1Health = status.get("server1");
			expect(server1Health?.status).toBe(ConnectionStatus.CONNECTED);
			expect(server1Health?.checkCount).toBe(1);
			expect(server1Health?.errorCount).toBe(0);

			const server2Health = status.get("server2");
			expect(server2Health?.status).toBe(ConnectionStatus.ERROR);
			expect(server2Health?.checkCount).toBe(1);
			expect(server2Health?.errorCount).toBe(1);
		});

		it("should track next check time", () => {
			healthMonitor.startMonitoring();

			const status = healthMonitor.getHealthStatus();
			status.forEach((health) => {
				expect(health.nextCheckTime).toBeDefined();
				expect(health.nextCheckTime).toBeGreaterThan(Date.now());
			});
		});
	});

	describe("Health Check Timeout", () => {
		it("should timeout long-running health checks", async () => {
			// Mock a slow health check
			vi.spyOn(mockRegistry, "listTools").mockImplementation(() => {
				return new Promise((resolve) => {
					setTimeout(() => resolve([]), 2000); // 2 seconds
				});
			});

			const resultPromise = healthMonitor.checkServerHealth("server1");

			// Advance time past timeout
			await timers.advanceTimersByTimeAsync(1100);

			const result = await resultPromise;

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain("timeout");
		});
	});

	describe("Initialization", () => {
		it("should initialize default health monitor", () => {
			const monitor = initializeHealthMonitor(mockRegistry, mockErrorManager);

			expect(monitor).toBeInstanceOf(HealthMonitor);
		});
	});
});
