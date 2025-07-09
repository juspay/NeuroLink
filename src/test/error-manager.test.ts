/**
 * NeuroLink MCP Error Manager Tests
 * Comprehensive test suite for error tracking and management
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	ErrorManager,
	ErrorCategory,
	ErrorSeverity,
	type ErrorEntry,
} from "../lib/mcp/error-manager.js";
import type { NeuroLinkExecutionContext } from "../lib/mcp/factory.js";

describe("ErrorManager", () => {
	let errorManager: ErrorManager;
	let mockContext: NeuroLinkExecutionContext;

	beforeEach(() => {
		errorManager = new ErrorManager({
			maxHistorySize: 10,
			enableStackTrace: true,
			autoRecovery: true,
			errorRateWindow: 5000, // 5 seconds for testing
		});

		mockContext = {
			sessionId: "test-session-123",
			userId: "test-user",
			timestamp: Date.now(),
			permissions: ["read", "write"],
		};
	});

	describe("Error Recording", () => {
		it("should record a basic error", () => {
			const error = new Error("Test error");
			const entry = errorManager.recordError(error);

			expect(entry).toBeDefined();
			expect(entry.id).toMatch(/^err-/);
			expect(entry.error.message).toBe("Test error");
			expect(entry.timestamp).toBeLessThanOrEqual(Date.now());
			expect(entry.category).toBe(ErrorCategory.UNKNOWN_ERROR);
		});

		it("should record error with context", () => {
			const error = new Error("Tool execution failed");
			const context = {
				category: ErrorCategory.TOOL_ERROR,
				severity: ErrorSeverity.HIGH,
				sessionId: mockContext.sessionId,
				toolName: "test-tool",
				parameters: { input: "test" },
				executionContext: mockContext,
			};

			const entry = errorManager.recordError(error, context);

			expect(entry.category).toBe(ErrorCategory.TOOL_ERROR);
			expect(entry.severity).toBe(ErrorSeverity.HIGH);
			expect(entry.context.sessionId).toBe(mockContext.sessionId);
			expect(entry.context.toolName).toBe("test-tool");
			expect(entry.context.parameters).toEqual({ input: "test" });
			expect(entry.context.executionContext).toEqual(mockContext);
		});

		it("should include stack trace when enabled", () => {
			const error = new Error("Error with stack");
			const entry = errorManager.recordError(error);

			expect(entry.stackTrace).toBeDefined();
			expect(entry.stackTrace).toContain("Error with stack");
		});

		it("should handle non-Error objects", () => {
			const entry1 = errorManager.recordError("String error");
			expect(entry1.error).toBeInstanceOf(Error);
			expect(entry1.error.message).toBe("String error");

			const entry2 = errorManager.recordError({ message: "Object error" });
			expect(entry2.error).toBeInstanceOf(Error);
			expect(entry2.error.message).toContain("Object error");

			const entry3 = errorManager.recordError(null);
			expect(entry3.error).toBeInstanceOf(Error);
			expect(entry3.error.message).toBe("Unknown error");
		});
	});

	describe("Error Categorization", () => {
		it("should categorize network errors", () => {
			const errors = [
				new Error("Network request failed"),
				new Error("Failed to fetch resource"),
				new Error("Connection timeout"),
			];

			errors.forEach((error) => {
				const entry = errorManager.recordError(error);
				expect(entry.category).toBe(ErrorCategory.NETWORK_ERROR);
			});
		});

		it("should categorize timeout errors", () => {
			const errors = [
				new Error("Operation timed out"),
				new Error("Request timeout exceeded"),
			];

			errors.forEach((error) => {
				const entry = errorManager.recordError(error);
				expect(entry.category).toBe(ErrorCategory.TIMEOUT_ERROR);
			});
		});

		it("should categorize permission errors", () => {
			const errors = [
				new Error("Permission denied"),
				new Error("Unauthorized access"),
				new Error("403 Forbidden"),
				new Error("401 Authentication required"),
			];

			errors.forEach((error) => {
				const entry = errorManager.recordError(error);
				expect(entry.category).toBe(ErrorCategory.PERMISSION_ERROR);
			});
		});

		it("should categorize validation errors", () => {
			const errors = [
				new Error("Validation failed"),
				new Error("Invalid input parameter"),
				new Error("Required field missing"),
			];

			errors.forEach((error) => {
				const entry = errorManager.recordError(error);
				expect(entry.category).toBe(ErrorCategory.VALIDATION_ERROR);
			});
		});
	});

	describe("Error Severity", () => {
		it("should assign critical severity to permission errors", () => {
			const error = new Error("Permission denied");
			const entry = errorManager.recordError(error);

			expect(entry.severity).toBe(ErrorSeverity.CRITICAL);
		});

		it("should assign high severity to network errors", () => {
			const error = new Error("Network connection failed");
			const entry = errorManager.recordError(error);

			expect(entry.severity).toBe(ErrorSeverity.HIGH);
		});

		it("should assign medium severity to timeout errors", () => {
			const error = new Error("Request timeout");
			const entry = errorManager.recordError(error);

			expect(entry.severity).toBe(ErrorSeverity.MEDIUM);
		});

		it("should respect manually set severity", () => {
			const error = new Error("Some error");
			const entry = errorManager.recordError(error, {
				severity: ErrorSeverity.LOW,
			});

			expect(entry.severity).toBe(ErrorSeverity.LOW);
		});
	});

	describe("Error History", () => {
		it("should maintain error history", () => {
			const errors = [
				new Error("Error 1"),
				new Error("Error 2"),
				new Error("Error 3"),
			];

			errors.forEach((error) => errorManager.recordError(error));

			const history = errorManager.getErrorHistory();
			expect(history).toHaveLength(3);
			expect(history[0].error.message).toBe("Error 1");
			expect(history[2].error.message).toBe("Error 3");
		});

		it("should maintain circular buffer limit", () => {
			// Max history size is 10
			for (let i = 0; i < 15; i++) {
				errorManager.recordError(new Error(`Error ${i}`));
			}

			const history = errorManager.getErrorHistory();
			expect(history).toHaveLength(10);
			expect(history[0].error.message).toBe("Error 5"); // First 5 should be dropped
			expect(history[9].error.message).toBe("Error 14");
		});

		it("should filter history by category", () => {
			errorManager.recordError(new Error("Network error"));
			errorManager.recordError(new Error("Validation error"));
			errorManager.recordError(new Error("Another network error"));

			const filtered = errorManager.getErrorHistory({
				category: ErrorCategory.NETWORK_ERROR,
			});

			expect(filtered).toHaveLength(2);
			filtered.forEach((entry) => {
				expect(entry.category).toBe(ErrorCategory.NETWORK_ERROR);
			});
		});

		it("should filter history by session", () => {
			errorManager.recordError(new Error("Error 1"), {
				sessionId: "session-1",
			});
			errorManager.recordError(new Error("Error 2"), {
				sessionId: "session-2",
			});
			errorManager.recordError(new Error("Error 3"), {
				sessionId: "session-1",
			});

			const filtered = errorManager.getErrorHistory({
				sessionId: "session-1",
			});

			expect(filtered).toHaveLength(2);
			expect(filtered[0].context.sessionId).toBe("session-1");
			expect(filtered[1].context.sessionId).toBe("session-1");
		});

		it("should filter history by time range", async () => {
			errorManager.recordError(new Error("Old error"));

			await new Promise((resolve) => setTimeout(resolve, 100));
			const since = Date.now();

			errorManager.recordError(new Error("Recent error 1"));
			errorManager.recordError(new Error("Recent error 2"));

			const filtered = errorManager.getErrorHistory({ since });
			expect(filtered).toHaveLength(2);
			expect(filtered[0].error.message).toBe("Recent error 1");
		});

		it("should limit history results", () => {
			for (let i = 0; i < 5; i++) {
				errorManager.recordError(new Error(`Error ${i}`));
			}

			const limited = errorManager.getErrorHistory({ limit: 2 });
			expect(limited).toHaveLength(2);
			expect(limited[0].error.message).toBe("Error 3");
			expect(limited[1].error.message).toBe("Error 4");
		});
	});

	describe("Error Statistics", () => {
		it("should track error counts", () => {
			errorManager.recordError(new Error("Network error"));
			errorManager.recordError(new Error("Validation error"));
			errorManager.recordError(new Error("Another network error"));

			const stats = errorManager.getStats();
			expect(stats.totalErrors).toBe(3);
			expect(stats.errorsByCategory[ErrorCategory.NETWORK_ERROR]).toBe(2);
			expect(stats.errorsByCategory[ErrorCategory.VALIDATION_ERROR]).toBe(1);
		});

		it("should track error severity counts", () => {
			errorManager.recordError(new Error("Permission denied")); // Critical
			errorManager.recordError(new Error("Network error")); // High
			errorManager.recordError(new Error("Timeout")); // Medium

			const stats = errorManager.getStats();
			expect(stats.errorsBySeverity[ErrorSeverity.CRITICAL]).toBe(1);
			expect(stats.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
			expect(stats.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
		});

		it("should calculate error rate", async () => {
			// Record errors over time
			errorManager.recordError(new Error("Error 1"));
			await new Promise((resolve) => setTimeout(resolve, 1000));
			errorManager.recordError(new Error("Error 2"));
			await new Promise((resolve) => setTimeout(resolve, 1000));
			errorManager.recordError(new Error("Error 3"));

			const stats = errorManager.getStats();
			// 3 errors in ~2 seconds window (5 second window configured)
			// Rate should be (3 / 5000) * 60000 = 36 per minute
			expect(stats.errorRate).toBeCloseTo(36, 0);
		});

		it("should track most frequent error", () => {
			errorManager.recordError(new Error("Common error"));
			errorManager.recordError(new Error("Common error"));
			errorManager.recordError(new Error("Common error"));
			errorManager.recordError(new Error("Rare error"));

			const stats = errorManager.getStats();
			expect(stats.mostFrequentError).toBeDefined();
			expect(stats.mostFrequentError?.message).toBe("Common error");
			expect(stats.mostFrequentError?.count).toBe(3);
		});

		it("should track last error", () => {
			errorManager.recordError(new Error("First error"));
			errorManager.recordError(new Error("Last error"));

			const stats = errorManager.getStats();
			expect(stats.lastError).toBeDefined();
			expect(stats.lastError?.error.message).toBe("Last error");
		});
	});

	describe("Recovery Suggestions", () => {
		it("should provide recovery suggestions", () => {
			const testCases = [
				{
					error: new Error("Network connection failed"),
					expectedSuggestion:
						"Check network connectivity and retry the operation",
				},
				{
					error: new Error("Request timeout"),
					expectedSuggestion:
						"Increase timeout settings or optimize the operation",
				},
				{
					error: new Error("Permission denied"),
					expectedSuggestion: "Verify API keys and access permissions",
				},
				{
					error: new Error("Validation failed"),
					expectedSuggestion: "Check input parameters and data formats",
				},
			];

			testCases.forEach(({ error, expectedSuggestion }) => {
				const entry = errorManager.recordError(error);
				expect(entry.recovery?.suggestion).toBe(expectedSuggestion);
			});
		});
	});

	describe("Clear History", () => {
		it("should clear error history", () => {
			errorManager.recordError(new Error("Error 1"));
			errorManager.recordError(new Error("Error 2"));

			expect(errorManager.getErrorHistory()).toHaveLength(2);

			errorManager.clearHistory();

			expect(errorManager.getErrorHistory()).toHaveLength(0);
			expect(errorManager.getStats().totalErrors).toBe(2); // Total count preserved
		});
	});
});
