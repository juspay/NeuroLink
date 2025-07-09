/**
 * NeuroLink Error Recovery System
 * Implements circuit breaker, retry strategies, and pattern detection
 * Based on resilience patterns from reference implementations
 */

import type {
	ErrorEntry,
	ErrorCategory,
	ErrorSeverity,
} from "./error-manager.js";
import type { NeuroLinkExecutionContext } from "./factory.js";

/**
 * Circuit breaker states
 */
export enum CircuitState {
	CLOSED = "CLOSED", // Normal operation
	OPEN = "OPEN", // Failing, reject requests
	HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
	maxAttempts: number;
	initialDelay: number;
	maxDelay: number;
	backoffMultiplier: number;
	jitter: boolean;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
	failureThreshold: number; // Number of failures to open circuit
	resetTimeout: number; // Time to wait before half-open
	successThreshold: number; // Successes needed to close from half-open
	monitoringPeriod: number; // Time window for failure counting
}

/**
 * Error pattern for detection
 */
export interface ErrorPattern {
	id: string;
	name: string;
	description: string;
	matcher: (errors: ErrorEntry[]) => boolean;
	severity: ErrorSeverity;
	recoveryStrategy: RecoveryStrategy;
}

/**
 * Recovery strategy
 */
export interface RecoveryStrategy {
	type: "retry" | "circuit-breaker" | "fallback" | "manual";
	config?: any;
	action?: (context: RecoveryContext) => Promise<RecoveryResult>;
}

/**
 * Recovery context
 */
export interface RecoveryContext {
	error: ErrorEntry;
	pattern?: ErrorPattern;
	attemptNumber: number;
	totalAttempts: number;
	previousAttempts: RecoveryAttempt[];
	executionContext?: NeuroLinkExecutionContext;
}

/**
 * Recovery attempt record
 */
export interface RecoveryAttempt {
	timestamp: number;
	strategy: string;
	successful: boolean;
	duration: number;
	error?: Error;
}

/**
 * Recovery result
 */
export interface RecoveryResult {
	success: boolean;
	recovered?: boolean;
	fallbackUsed?: boolean;
	nextAction?: "retry" | "fail" | "fallback";
	delay?: number;
	message?: string;
}

/**
 * Circuit breaker instance
 */
class CircuitBreaker {
	private state: CircuitState = CircuitState.CLOSED;
	private failures: number = 0;
	private successes: number = 0;
	private lastFailureTime: number = 0;
	private nextAttemptTime: number = 0;

	constructor(private config: CircuitBreakerConfig) {}

	/**
	 * Check if request should be allowed
	 */
	canExecute(): boolean {
		const now = Date.now();

		switch (this.state) {
			case CircuitState.CLOSED:
				return true;

			case CircuitState.OPEN:
				if (now >= this.nextAttemptTime) {
					this.state = CircuitState.HALF_OPEN;
					this.successes = 0;
					return true;
				}
				return false;

			case CircuitState.HALF_OPEN:
				return true;

			default:
				return false;
		}
	}

	/**
	 * Record success
	 */
	recordSuccess(): void {
		this.failures = 0;

		if (this.state === CircuitState.HALF_OPEN) {
			this.successes++;
			if (this.successes >= this.config.successThreshold) {
				this.state = CircuitState.CLOSED;
			}
		}
	}

	/**
	 * Record failure
	 */
	recordFailure(): void {
		const now = Date.now();

		// Reset failure count if outside monitoring period
		if (now - this.lastFailureTime > this.config.monitoringPeriod) {
			this.failures = 0;
		}

		this.failures++;
		this.lastFailureTime = now;

		if (this.state === CircuitState.HALF_OPEN) {
			this.state = CircuitState.OPEN;
			this.nextAttemptTime = now + this.config.resetTimeout;
		} else if (this.failures >= this.config.failureThreshold) {
			this.state = CircuitState.OPEN;
			this.nextAttemptTime = now + this.config.resetTimeout;
		}
	}

	/**
	 * Get current state
	 */
	getState(): CircuitState {
		return this.state;
	}
}

/**
 * Error Recovery Manager
 */
export class ErrorRecovery {
	private circuitBreakers: Map<string, CircuitBreaker> = new Map();
	private errorPatterns: ErrorPattern[] = [];
	private recoveryHistory: Map<string, RecoveryAttempt[]> = new Map();
	private defaultRetryConfig: RetryConfig = {
		maxAttempts: 3,
		initialDelay: 1000,
		maxDelay: 30000,
		backoffMultiplier: 2,
		jitter: true,
	};
	private defaultCircuitConfig: CircuitBreakerConfig = {
		failureThreshold: 5,
		resetTimeout: 60000,
		successThreshold: 2,
		monitoringPeriod: 60000,
	};

	constructor() {
		this.initializeDefaultPatterns();
	}

	/**
	 * Initialize default error patterns
	 */
	private initializeDefaultPatterns(): void {
		// Network timeout pattern
		this.addPattern({
			id: "network-timeout",
			name: "Network Timeout Pattern",
			description: "Repeated network timeouts indicating connectivity issues",
			matcher: (errors) => {
				const recentErrors = errors.slice(-5);
				return (
					recentErrors.length >= 3 &&
					recentErrors.every((e) => e.category === "TIMEOUT_ERROR")
				);
			},
			severity: "HIGH" as ErrorSeverity,
			recoveryStrategy: {
				type: "retry",
				config: {
					maxAttempts: 5,
					initialDelay: 2000,
					maxDelay: 60000,
					backoffMultiplier: 3,
					jitter: true,
				},
			},
		});

		// Rate limit pattern
		this.addPattern({
			id: "rate-limit",
			name: "Rate Limit Pattern",
			description: "API rate limit errors",
			matcher: (errors) => {
				const lastError = errors[errors.length - 1];
				return (
					lastError &&
					(lastError.error.message.includes("429") ||
						lastError.error.message.toLowerCase().includes("rate limit"))
				);
			},
			severity: "MEDIUM" as ErrorSeverity,
			recoveryStrategy: {
				type: "circuit-breaker",
				config: {
					failureThreshold: 3,
					resetTimeout: 120000, // 2 minutes
					successThreshold: 1,
					monitoringPeriod: 60000,
				},
			},
		});

		// Configuration error pattern
		this.addPattern({
			id: "config-error",
			name: "Configuration Error Pattern",
			description: "Missing or invalid configuration",
			matcher: (errors) => {
				const lastError = errors[errors.length - 1];
				return lastError?.category === "CONFIGURATION_ERROR";
			},
			severity: "CRITICAL" as ErrorSeverity,
			recoveryStrategy: {
				type: "manual",
				action: async (context) => ({
					success: false,
					message:
						"Configuration error requires manual intervention. Check environment variables and config files.",
				}),
			},
		});
	}

	/**
	 * Add error pattern
	 */
	addPattern(pattern: ErrorPattern): void {
		this.errorPatterns.push(pattern);
	}

	/**
	 * Detect patterns in error history
	 */
	detectPatterns(errors: ErrorEntry[]): ErrorPattern[] {
		return this.errorPatterns.filter((pattern) => pattern.matcher(errors));
	}

	/**
	 * Get circuit breaker for resource
	 */
	private getCircuitBreaker(
		resourceId: string,
		config?: CircuitBreakerConfig,
	): CircuitBreaker {
		if (!this.circuitBreakers.has(resourceId)) {
			this.circuitBreakers.set(
				resourceId,
				new CircuitBreaker(config || this.defaultCircuitConfig),
			);
		}
		return this.circuitBreakers.get(resourceId)!;
	}

	/**
	 * Calculate retry delay with exponential backoff
	 */
	private calculateRetryDelay(
		attemptNumber: number,
		config: RetryConfig,
	): number {
		const exponentialDelay =
			config.initialDelay *
			Math.pow(config.backoffMultiplier, attemptNumber - 1);
		const delay = Math.min(exponentialDelay, config.maxDelay);

		if (config.jitter) {
			// Add random jitter (±25%)
			const jitter = delay * 0.25 * (Math.random() * 2 - 1);
			return Math.floor(delay + jitter);
		}

		return delay;
	}

	/**
	 * Attempt recovery for an error
	 */
	async attemptRecovery(
		error: ErrorEntry,
		context?: NeuroLinkExecutionContext,
	): Promise<RecoveryResult> {
		// Detect patterns
		const patterns = this.detectPatterns([error]);
		const pattern = patterns[0]; // Use first matching pattern

		// Get recovery history
		const historyKey = `${error.context.toolName || "unknown"}-${error.category}`;
		const history = this.recoveryHistory.get(historyKey) || [];

		// Build recovery context
		const recoveryContext: RecoveryContext = {
			error,
			pattern,
			attemptNumber: history.length + 1,
			totalAttempts: 0,
			previousAttempts: history,
			executionContext: context,
		};

		// Determine recovery strategy
		const strategy =
			pattern?.recoveryStrategy || this.getDefaultStrategy(error);

		// Execute recovery
		const startTime = Date.now();
		let result: RecoveryResult;

		try {
			switch (strategy.type) {
				case "retry":
					result = await this.executeRetryStrategy(
						recoveryContext,
						strategy.config,
					);
					break;

				case "circuit-breaker":
					result = await this.executeCircuitBreakerStrategy(
						recoveryContext,
						strategy.config,
					);
					break;

				case "fallback":
					result = await this.executeFallbackStrategy(
						recoveryContext,
						strategy.config,
					);
					break;

				case "manual":
					result = strategy.action
						? await strategy.action(recoveryContext)
						: { success: false, message: "Manual intervention required" };
					break;

				default:
					result = {
						success: false,
						message: "No recovery strategy available",
					};
			}
		} catch (recoveryError) {
			result = {
				success: false,
				message: `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : "Unknown error"}`,
			};
		}

		// Record attempt
		const attempt: RecoveryAttempt = {
			timestamp: Date.now(),
			strategy: strategy.type,
			successful: result.success,
			duration: Date.now() - startTime,
			error: result.success
				? undefined
				: new Error(result.message || "Recovery failed"),
		};

		history.push(attempt);
		this.recoveryHistory.set(historyKey, history.slice(-10)); // Keep last 10 attempts

		return result;
	}

	/**
	 * Execute retry strategy
	 */
	private async executeRetryStrategy(
		context: RecoveryContext,
		config?: RetryConfig,
	): Promise<RecoveryResult> {
		const retryConfig = config || this.defaultRetryConfig;

		if (context.attemptNumber > retryConfig.maxAttempts) {
			return {
				success: false,
				message: `Maximum retry attempts (${retryConfig.maxAttempts}) exceeded`,
			};
		}

		const delay = this.calculateRetryDelay(context.attemptNumber, retryConfig);

		return {
			success: true,
			nextAction: "retry",
			delay,
			message: `Retry attempt ${context.attemptNumber}/${retryConfig.maxAttempts} after ${delay}ms`,
		};
	}

	/**
	 * Execute circuit breaker strategy
	 */
	private async executeCircuitBreakerStrategy(
		context: RecoveryContext,
		config?: CircuitBreakerConfig,
	): Promise<RecoveryResult> {
		const resourceId = context.error.context.toolName || "default";
		const circuitBreaker = this.getCircuitBreaker(resourceId, config);

		if (!circuitBreaker.canExecute()) {
			return {
				success: false,
				message: `Circuit breaker OPEN for ${resourceId}. Service temporarily unavailable.`,
			};
		}

		// Record the failure for circuit breaker
		circuitBreaker.recordFailure();

		return {
			success: true,
			nextAction:
				circuitBreaker.getState() === CircuitState.OPEN ? "fail" : "retry",
			message: `Circuit breaker state: ${circuitBreaker.getState()}`,
		};
	}

	/**
	 * Execute fallback strategy
	 */
	private async executeFallbackStrategy(
		context: RecoveryContext,
		config?: any,
	): Promise<RecoveryResult> {
		// In a real implementation, this would execute fallback logic
		// For now, just indicate fallback should be used
		return {
			success: true,
			fallbackUsed: true,
			message: "Fallback strategy activated",
		};
	}

	/**
	 * Get default recovery strategy based on error
	 */
	private getDefaultStrategy(error: ErrorEntry): RecoveryStrategy {
		switch (error.category) {
			case "NETWORK_ERROR":
			case "TIMEOUT_ERROR":
				return {
					type: "retry",
					config: this.defaultRetryConfig,
				};

			case "CONFIGURATION_ERROR":
			case "PERMISSION_ERROR":
				return {
					type: "manual",
				};

			default:
				return {
					type: "retry",
					config: {
						...this.defaultRetryConfig,
						maxAttempts: 2,
					},
				};
		}
	}

	/**
	 * Get recovery statistics
	 */
	getRecoveryStats(): {
		totalAttempts: number;
		successfulRecoveries: number;
		failedRecoveries: number;
		circuitBreakerStates: Record<string, CircuitState>;
		patternMatches: Record<string, number>;
	} {
		let totalAttempts = 0;
		let successfulRecoveries = 0;
		let failedRecoveries = 0;

		// Calculate from history
		for (const attempts of this.recoveryHistory.values()) {
			for (const attempt of attempts) {
				totalAttempts++;
				if (attempt.successful) {
					successfulRecoveries++;
				} else {
					failedRecoveries++;
				}
			}
		}

		// Get circuit breaker states
		const circuitBreakerStates: Record<string, CircuitState> = {};
		for (const [id, breaker] of this.circuitBreakers) {
			circuitBreakerStates[id] = breaker.getState();
		}

		return {
			totalAttempts,
			successfulRecoveries,
			failedRecoveries,
			circuitBreakerStates,
			patternMatches: {}, // TODO: Track pattern matches
		};
	}

	/**
	 * Reset circuit breaker
	 */
	resetCircuitBreaker(resourceId: string): void {
		this.circuitBreakers.delete(resourceId);
	}

	/**
	 * Clear recovery history
	 */
	clearHistory(): void {
		this.recoveryHistory.clear();
	}
}

/**
 * Default error recovery instance
 */
export const defaultErrorRecovery = new ErrorRecovery();
