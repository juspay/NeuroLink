/**
 * NeuroLink MCP Enhanced Error Handling System
 * Provides comprehensive error tracking, categorization, and debugging capabilities
 * Based on error accumulation patterns from Cline
 */

import type { NeuroLinkExecutionContext } from "./factory.js";
import {
	ErrorRecovery,
	defaultErrorRecovery,
	type RecoveryResult,
} from "./error-recovery.js";

/**
 * Error categories for classification
 */
export enum ErrorCategory {
	TOOL_ERROR = "TOOL_ERROR",
	NETWORK_ERROR = "NETWORK_ERROR",
	VALIDATION_ERROR = "VALIDATION_ERROR",
	TIMEOUT_ERROR = "TIMEOUT_ERROR",
	PERMISSION_ERROR = "PERMISSION_ERROR",
	CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
	CONNECTION_ERROR = "CONNECTION_ERROR",
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
	LOW = "LOW",
	MEDIUM = "MEDIUM",
	HIGH = "HIGH",
	CRITICAL = "CRITICAL",
}

/**
 * Enhanced error entry with rich context
 */
export interface ErrorEntry {
	id: string;
	timestamp: number;
	category: ErrorCategory;
	severity: ErrorSeverity;
	error: Error;
	context: {
		sessionId?: string;
		toolName?: string;
		parameters?: any;
		executionContext?: NeuroLinkExecutionContext;
	};
	stackTrace?: string;
	recovery?: {
		attempted: boolean;
		successful?: boolean;
		recovered?: boolean;
		fallbackUsed?: boolean;
		nextAction?: string;
		delay?: number;
		suggestion?: string;
	};
}

/**
 * Error statistics
 */
export interface ErrorStats {
	totalErrors: number;
	errorsByCategory: Record<ErrorCategory, number>;
	errorsBySeverity: Record<ErrorSeverity, number>;
	errorRate: number; // Errors per minute
	lastError?: ErrorEntry;
	mostFrequentError?: {
		message: string;
		count: number;
		category: ErrorCategory;
	};
}

/**
 * Options for error manager configuration
 */
export interface ErrorManagerOptions {
	maxHistorySize?: number;
	enableStackTrace?: boolean;
	autoRecovery?: boolean;
	errorRateWindow?: number; // Time window in ms for error rate calculation
}

/**
 * Enhanced Error Manager with accumulation and analysis capabilities
 */
export class ErrorManager {
	private errorHistory: ErrorEntry[] = [];
	private maxHistorySize: number;
	private enableStackTrace: boolean;
	private autoRecovery: boolean;
	private errorRateWindow: number;
	private errorCounter: number = 0;
	private errorFrequency: Map<string, number> = new Map();
	private categoryCounts: Record<ErrorCategory, number>;
	private severityCounts: Record<ErrorSeverity, number>;
	private errorRecovery: ErrorRecovery;

	constructor(options: ErrorManagerOptions = {}) {
		this.maxHistorySize = options.maxHistorySize || 1000;
		this.enableStackTrace = options.enableStackTrace ?? true;
		this.autoRecovery = options.autoRecovery ?? false;
		this.errorRateWindow = options.errorRateWindow || 60000; // 1 minute default

		// Initialize counters
		this.categoryCounts = Object.values(ErrorCategory).reduce(
			(acc, category) => ({ ...acc, [category]: 0 }),
			{} as Record<ErrorCategory, number>,
		);

		this.severityCounts = Object.values(ErrorSeverity).reduce(
			(acc, severity) => ({ ...acc, [severity]: 0 }),
			{} as Record<ErrorSeverity, number>,
		);

		// Initialize error recovery system
		this.errorRecovery = defaultErrorRecovery;
	}

	/**
	 * Record an error with context
	 *
	 * @param error The error to record
	 * @param context Additional context about the error
	 * @returns The created error entry
	 */
	async recordError(
		error: Error | unknown,
		context: {
			category?: ErrorCategory;
			severity?: ErrorSeverity;
			sessionId?: string;
			toolName?: string;
			parameters?: any;
			executionContext?: NeuroLinkExecutionContext;
		} = {},
	): Promise<ErrorEntry> {
		// Ensure we have an Error object
		let errorObj: Error;

		if (error instanceof Error) {
			errorObj = error;
		} else if (error && typeof error === "object" && "message" in error) {
			// Handle objects with message property
			errorObj = new Error(String((error as any).message));
		} else if (error === null || error === undefined) {
			errorObj = new Error("Unknown error");
		} else {
			// Convert other types to string
			errorObj = new Error(String(error));
		}

		// Determine category and severity
		const category = context.category || this.categorizeError(errorObj);
		const severity =
			context.severity || this.determineSeverity(errorObj, category);

		// Create error entry
		const entry: ErrorEntry = {
			id: this.generateErrorId(),
			timestamp: Date.now(),
			category,
			severity,
			error: errorObj,
			context: {
				sessionId: context.sessionId,
				toolName: context.toolName,
				parameters: context.parameters,
				executionContext: context.executionContext,
			},
		};

		// Add stack trace if enabled
		if (this.enableStackTrace && errorObj.stack) {
			entry.stackTrace = errorObj.stack;
		}

		// Attempt recovery if enabled
		if (this.autoRecovery) {
			entry.recovery = await this.attemptRecovery(entry);
		}

		// Add to history (circular buffer)
		this.addToHistory(entry);

		// Update statistics
		this.updateStatistics(entry);

		// Log if debug mode
		if (process.env.NEUROLINK_DEBUG === "true") {
			console.error(
				`[ErrorManager] ${category} - ${severity}: ${errorObj.message}`,
				context,
			);
		}

		return entry;
	}

	/**
	 * Get error history
	 *
	 * @param filter Optional filter criteria
	 * @returns Filtered error history
	 */
	getErrorHistory(filter?: {
		category?: ErrorCategory;
		severity?: ErrorSeverity;
		sessionId?: string;
		toolName?: string;
		since?: number;
		limit?: number;
	}): ErrorEntry[] {
		let filtered = [...this.errorHistory];

		if (filter) {
			if (filter.category) {
				filtered = filtered.filter((e) => e.category === filter.category);
			}
			if (filter.severity) {
				filtered = filtered.filter((e) => e.severity === filter.severity);
			}
			if (filter.sessionId) {
				filtered = filtered.filter(
					(e) => e.context.sessionId === filter.sessionId,
				);
			}
			if (filter.toolName) {
				filtered = filtered.filter(
					(e) => e.context.toolName === filter.toolName,
				);
			}
			if (filter.since) {
				filtered = filtered.filter((e) => e.timestamp >= filter.since!);
			}
			if (filter.limit) {
				filtered = filtered.slice(-filter.limit);
			}
		}

		return filtered;
	}

	/**
	 * Get error statistics
	 *
	 * @returns Current error statistics
	 */
	getStats(): ErrorStats {
		const recentErrors = this.getErrorHistory({
			since: Date.now() - this.errorRateWindow,
		});

		const errorRate = (recentErrors.length / this.errorRateWindow) * 60000; // Per minute

		// Find most frequent error
		let mostFrequentError: ErrorStats["mostFrequentError"] | undefined;
		if (this.errorFrequency.size > 0) {
			const [message, count] = Array.from(this.errorFrequency.entries()).sort(
				(a, b) => b[1] - a[1],
			)[0];

			const category =
				this.errorHistory.find((e) => e.error.message === message)?.category ||
				ErrorCategory.UNKNOWN_ERROR;

			mostFrequentError = { message, count, category };
		}

		return {
			totalErrors: this.errorCounter,
			errorsByCategory: { ...this.categoryCounts },
			errorsBySeverity: { ...this.severityCounts },
			errorRate,
			lastError: this.errorHistory[this.errorHistory.length - 1],
			mostFrequentError,
		};
	}

	/**
	 * Clear error history
	 */
	clearHistory(): void {
		this.errorHistory = [];
		this.errorFrequency.clear();

		if (process.env.NEUROLINK_DEBUG === "true") {
			console.log("[ErrorManager] Error history cleared");
		}
	}

	/**
	 * Get recovery suggestions for an error
	 *
	 * @param error The error entry
	 * @returns Recovery suggestion
	 */
	getRecoverySuggestion(error: ErrorEntry): string {
		switch (error.category) {
			case ErrorCategory.NETWORK_ERROR:
				return "Check network connectivity and retry the operation";

			case ErrorCategory.TIMEOUT_ERROR:
				return "Increase timeout settings or optimize the operation";

			case ErrorCategory.PERMISSION_ERROR:
				return "Verify API keys and access permissions";

			case ErrorCategory.VALIDATION_ERROR:
				return "Check input parameters and data formats";

			case ErrorCategory.CONFIGURATION_ERROR:
				return "Review configuration settings and environment variables";

			case ErrorCategory.TOOL_ERROR:
				return "Check tool availability and dependencies";

			default:
				return "Review error details and contact support if issue persists";
		}
	}

	/**
	 * Categorize error based on message and type
	 *
	 * @private
	 */
	private categorizeError(error: Error): ErrorCategory {
		const message = error.message.toLowerCase();
		const name = error.name?.toLowerCase() || "";

		if (
			message.includes("network") ||
			message.includes("fetch") ||
			message.includes("connection") ||
			name.includes("network")
		) {
			return ErrorCategory.NETWORK_ERROR;
		}

		if (
			message.includes("timeout") ||
			message.includes("timed out") ||
			name.includes("timeout")
		) {
			return ErrorCategory.TIMEOUT_ERROR;
		}

		if (
			message.includes("permission") ||
			message.includes("unauthorized") ||
			message.includes("forbidden") ||
			message.includes("401") ||
			message.includes("403")
		) {
			return ErrorCategory.PERMISSION_ERROR;
		}

		if (
			message.includes("validation") ||
			message.includes("invalid") ||
			message.includes("required") ||
			name.includes("validation")
		) {
			return ErrorCategory.VALIDATION_ERROR;
		}

		if (
			message.includes("config") ||
			message.includes("configuration") ||
			message.includes("environment")
		) {
			return ErrorCategory.CONFIGURATION_ERROR;
		}

		if (message.includes("tool") || message.includes("execution")) {
			return ErrorCategory.TOOL_ERROR;
		}

		return ErrorCategory.UNKNOWN_ERROR;
	}

	/**
	 * Determine error severity
	 *
	 * @private
	 */
	private determineSeverity(
		error: Error,
		category: ErrorCategory,
	): ErrorSeverity {
		// Critical errors
		if (
			category === ErrorCategory.PERMISSION_ERROR ||
			category === ErrorCategory.CONFIGURATION_ERROR
		) {
			return ErrorSeverity.CRITICAL;
		}

		// High severity
		if (
			category === ErrorCategory.NETWORK_ERROR ||
			error.message.includes("fatal") ||
			error.message.includes("critical")
		) {
			return ErrorSeverity.HIGH;
		}

		// Medium severity
		if (
			category === ErrorCategory.TIMEOUT_ERROR ||
			category === ErrorCategory.TOOL_ERROR
		) {
			return ErrorSeverity.MEDIUM;
		}

		// Low severity
		return ErrorSeverity.LOW;
	}

	/**
	 * Add error to circular buffer
	 *
	 * @private
	 */
	private addToHistory(entry: ErrorEntry): void {
		this.errorHistory.push(entry);

		// Maintain circular buffer size
		if (this.errorHistory.length > this.maxHistorySize) {
			this.errorHistory.shift();
		}
	}

	/**
	 * Update error statistics
	 *
	 * @private
	 */
	private updateStatistics(entry: ErrorEntry): void {
		this.errorCounter++;
		this.categoryCounts[entry.category]++;
		this.severityCounts[entry.severity]++;

		// Update frequency map
		const message = entry.error.message;
		this.errorFrequency.set(
			message,
			(this.errorFrequency.get(message) || 0) + 1,
		);
	}

	/**
	 * Attempt automatic recovery
	 *
	 * @private
	 */
	private async attemptRecovery(
		entry: ErrorEntry,
	): Promise<ErrorEntry["recovery"]> {
		// Use the enhanced error recovery system
		const recoveryResult = await this.errorRecovery.attemptRecovery(
			entry,
			entry.context.executionContext,
		);

		return {
			attempted: true,
			successful: recoveryResult.success,
			recovered: recoveryResult.recovered,
			fallbackUsed: recoveryResult.fallbackUsed,
			nextAction: recoveryResult.nextAction,
			delay: recoveryResult.delay,
			suggestion: recoveryResult.message || this.getRecoverySuggestion(entry),
		};
	}

	/**
	 * Generate unique error ID
	 *
	 * @private
	 */
	private generateErrorId(): string {
		return `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Detect error patterns in recent history
	 *
	 * @param timeWindow Time window to analyze (ms)
	 * @returns Detected patterns with counts and severity
	 */
	detectPatterns(timeWindow: number = 300000): {
		patterns: Array<{
			pattern: string;
			count: number;
			errors: ErrorEntry[];
			severity: ErrorSeverity;
			recommendation: string;
		}>;
		correlations: Array<{
			error1: string;
			error2: string;
			correlation: number;
		}>;
	} {
		const now = Date.now();
		const recentErrors = this.errorHistory.filter(
			(e) => now - e.timestamp <= timeWindow,
		);

		// Detect patterns
		const patterns = this.errorRecovery.detectPatterns(recentErrors);
		const patternResults = patterns.map((pattern) => {
			const matchingErrors = recentErrors.filter((e) => pattern.matcher([e]));

			return {
				pattern: pattern.name,
				count: matchingErrors.length,
				errors: matchingErrors,
				severity: pattern.severity,
				recommendation: pattern.description,
			};
		});

		// Detect correlations
		const correlations = this.detectCorrelations(recentErrors);

		return { patterns: patternResults, correlations };
	}

	/**
	 * Detect correlations between errors
	 *
	 * @private
	 */
	private detectCorrelations(errors: ErrorEntry[]): Array<{
		error1: string;
		error2: string;
		correlation: number;
	}> {
		const correlations: Array<{
			error1: string;
			error2: string;
			correlation: number;
		}> = [];

		// Group errors by message
		const errorGroups = new Map<string, ErrorEntry[]>();
		for (const error of errors) {
			const key = error.error.message;
			if (!errorGroups.has(key)) {
				errorGroups.set(key, []);
			}
			errorGroups.get(key)!.push(error);
		}

		// Find correlations based on temporal proximity
		const keys = Array.from(errorGroups.keys());
		for (let i = 0; i < keys.length; i++) {
			for (let j = i + 1; j < keys.length; j++) {
				const errors1 = errorGroups.get(keys[i])!;
				const errors2 = errorGroups.get(keys[j])!;

				// Calculate correlation based on time proximity
				let proximityCount = 0;
				for (const e1 of errors1) {
					for (const e2 of errors2) {
						const timeDiff = Math.abs(e1.timestamp - e2.timestamp);
						if (timeDiff < 60000) {
							// Within 1 minute
							proximityCount++;
						}
					}
				}

				const correlation =
					proximityCount / Math.max(errors1.length, errors2.length);
				if (correlation > 0.5) {
					correlations.push({
						error1: keys[i],
						error2: keys[j],
						correlation,
					});
				}
			}
		}

		return correlations;
	}

	/**
	 * Get error trends over time
	 *
	 * @param bucketSize Time bucket size in ms (default: 1 minute)
	 * @param timeWindow Total time window to analyze
	 * @returns Error counts per time bucket
	 */
	getErrorTrends(
		bucketSize: number = 60000,
		timeWindow: number = 3600000,
	): Array<{
		timestamp: number;
		count: number;
		categories: Record<ErrorCategory, number>;
	}> {
		const now = Date.now();
		const startTime = now - timeWindow;
		const buckets: Array<{
			timestamp: number;
			count: number;
			categories: Record<ErrorCategory, number>;
		}> = [];

		// Initialize buckets
		for (let time = startTime; time < now; time += bucketSize) {
			buckets.push({
				timestamp: time,
				count: 0,
				categories: Object.values(ErrorCategory).reduce(
					(acc, cat) => ({ ...acc, [cat]: 0 }),
					{} as Record<ErrorCategory, number>,
				),
			});
		}

		// Fill buckets with error counts
		for (const error of this.errorHistory) {
			if (error.timestamp >= startTime && error.timestamp < now) {
				const bucketIndex = Math.floor(
					(error.timestamp - startTime) / bucketSize,
				);
				if (bucketIndex >= 0 && bucketIndex < buckets.length) {
					buckets[bucketIndex].count++;
					buckets[bucketIndex].categories[error.category]++;
				}
			}
		}

		return buckets;
	}

	/**
	 * Get recovery statistics
	 *
	 * @returns Recovery statistics from error recovery system
	 */
	getRecoveryStats() {
		return this.errorRecovery.getRecoveryStats();
	}

	/**
	 * Reset circuit breaker for specific resource
	 *
	 * @param resourceId Resource identifier (usually tool name)
	 */
	resetCircuitBreaker(resourceId: string): void {
		this.errorRecovery.resetCircuitBreaker(resourceId);
	}

	/**
	 * Get error insights and recommendations
	 *
	 * @returns Insights based on error analysis
	 */
	getInsights(): {
		criticalIssues: string[];
		recommendations: string[];
		healthScore: number;
	} {
		const stats = this.getStats();
		const patterns = this.detectPatterns();
		const recoveryStats = this.getRecoveryStats();

		const criticalIssues: string[] = [];
		const recommendations: string[] = [];

		// Check error rate
		if (stats.errorRate > 10) {
			criticalIssues.push(
				`High error rate: ${stats.errorRate.toFixed(1)} errors/minute`,
			);
			recommendations.push(
				"Consider implementing rate limiting or increasing resources",
			);
		}

		// Check critical errors
		const criticalCount = stats.errorsBySeverity[ErrorSeverity.CRITICAL] || 0;
		if (criticalCount > 0) {
			criticalIssues.push(`${criticalCount} critical errors detected`);
			recommendations.push("Review and address critical errors immediately");
		}

		// Check circuit breakers
		const openBreakers = Object.entries(
			recoveryStats.circuitBreakerStates,
		).filter(([_, state]) => state === "OPEN");
		if (openBreakers.length > 0) {
			criticalIssues.push(`${openBreakers.length} circuit breakers are OPEN`);
			recommendations.push(
				`Services unavailable: ${openBreakers.map(([id]) => id).join(", ")}`,
			);
		}

		// Check patterns
		for (const pattern of patterns.patterns) {
			if (pattern.count > 5 && pattern.severity === ErrorSeverity.HIGH) {
				recommendations.push(pattern.recommendation);
			}
		}

		// Calculate health score (0-100)
		let healthScore = 100;
		healthScore -= Math.min(stats.errorRate * 2, 30); // Up to -30 for error rate
		healthScore -= criticalCount * 10; // -10 per critical error
		healthScore -= openBreakers.length * 15; // -15 per open circuit breaker
		healthScore = Math.max(0, healthScore);

		return {
			criticalIssues,
			recommendations: [...new Set(recommendations)], // Remove duplicates
			healthScore,
		};
	}
}

/**
 * Default error manager instance
 */
export const defaultErrorManager = new ErrorManager();

/**
 * Utility function to record error with default manager
 *
 * @param error Error to record
 * @param context Error context
 * @returns Error entry
 */
export async function recordError(
	error: Error | unknown,
	context?: Parameters<ErrorManager["recordError"]>[1],
): Promise<ErrorEntry> {
	return defaultErrorManager.recordError(error, context);
}
