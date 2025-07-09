/**
 * NeuroLink MCP Semaphore Manager
 * Prevents race conditions in concurrent tool executions using a robust semaphore pattern
 * Based on proven patterns from 1MCP reference implementation
 */

import type { NeuroLinkExecutionContext } from "./factory.js";

/**
 * Semaphore operation result
 */
export interface SemaphoreResult<T> {
	success: boolean;
	result?: T;
	error?: Error;
	waitTime: number;
	executionTime: number;
	queueDepth: number;
}

/**
 * Semaphore statistics
 */
export interface SemaphoreStats {
	activeOperations: number;
	queuedOperations: number;
	totalOperations: number;
	totalWaitTime: number;
	averageWaitTime: number;
	peakQueueDepth: number;
	lastActivity: number;
}

/**
 * Queued operation
 */
interface QueuedOperation {
	resolve: () => void;
	reject: (error: Error) => void;
}

/**
 * Semaphore Manager for concurrent operation control
 * Implements the proven semaphore pattern from 1MCP to prevent race conditions
 */
export class SemaphoreManager {
	private locks: Map<string, Promise<void>> = new Map();
	private queues: Map<string, QueuedOperation[]> = new Map();
	private stats: Map<string, SemaphoreStats> = new Map();
	private globalStats: SemaphoreStats = {
		activeOperations: 0,
		queuedOperations: 0,
		totalOperations: 0,
		totalWaitTime: 0,
		averageWaitTime: 0,
		peakQueueDepth: 0,
		lastActivity: Date.now(),
	};

	/**
	 * Acquire a semaphore and execute an operation
	 * Ensures exclusive access to resources identified by the key
	 *
	 * @param key Unique identifier for the resource
	 * @param operation Async operation to execute with exclusive access
	 * @param context Optional execution context for enhanced tracking
	 * @returns Result of the operation with timing metrics
	 */
	async acquire<T>(
		key: string,
		operation: () => Promise<T>,
		context?: NeuroLinkExecutionContext,
	): Promise<SemaphoreResult<T>> {
		const startTime = Date.now();
		let waitTime = 0;
		let executionTime = 0;
		let queueDepth = 0;

		// Get or create queue for this key
		const queue = this.queues.get(key) || [];
		queueDepth = queue.length;

		// Check if there's an active lock
		const existingLock = this.locks.get(key);
		if (existingLock) {
			// Add to queue and wait
			queueDepth++;
			this.updateQueueDepth(key, queueDepth);

			const waitPromise = new Promise<void>((resolve, reject) => {
				queue.push({ resolve, reject });
				this.queues.set(key, queue);
			});

			if (process.env.NEUROLINK_DEBUG === "true") {
				console.log(
					`[Semaphore] Operation waiting in queue for key: ${key} (depth: ${queueDepth})`,
				);
			}

			// Wait for existing lock and our turn in queue
			await existingLock;
			await waitPromise;
			waitTime = Date.now() - startTime;
		}

		// Create new lock for this operation
		let lockResolve: (() => void) | undefined;
		const lockPromise = new Promise<void>((resolve) => {
			lockResolve = resolve;
		});
		this.locks.set(key, lockPromise);

		// Update statistics
		this.incrementActiveOperations(key);

		// Execute the operation
		const executionStartTime = Date.now();

		if (process.env.NEUROLINK_DEBUG === "true") {
			console.log(`[Semaphore] Executing operation for key: ${key}`);
		}

		try {
			const result = await operation();
			executionTime = Math.max(1, Date.now() - executionStartTime); // Ensure at least 1ms

			// Update statistics
			this.updateStats(key, waitTime, executionTime);

			if (process.env.NEUROLINK_DEBUG === "true") {
				console.log(
					`[Semaphore] Operation completed successfully for key: ${key}`,
				);
			}

			return {
				success: true,
				result,
				waitTime,
				executionTime,
				queueDepth,
			};
		} catch (error) {
			executionTime = Math.max(1, Date.now() - executionStartTime); // Ensure at least 1ms
			const errorObj =
				error instanceof Error ? error : new Error(String(error));

			// Update statistics even for errors
			this.updateStats(key, waitTime, executionTime);

			if (process.env.NEUROLINK_DEBUG === "true") {
				console.error(
					`[Semaphore] Operation failed for key: ${key}`,
					errorObj.message,
				);
			}

			return {
				success: false,
				error: errorObj,
				waitTime,
				executionTime,
				queueDepth,
			};
		} finally {
			// Release the lock
			this.locks.delete(key);
			if (lockResolve) {
				lockResolve();
			}

			// Process queue
			const queue = this.queues.get(key) || [];
			if (queue.length > 0) {
				const next = queue.shift()!;
				if (queue.length === 0) {
					this.queues.delete(key);
				} else {
					this.queues.set(key, queue);
				}
				// Allow next operation to proceed
				next.resolve();
			}

			// Update statistics
			this.decrementActiveOperations(key);

			if (process.env.NEUROLINK_DEBUG === "true") {
				console.log(`[Semaphore] Released lock for key: ${key}`);
			}
		}
	}

	/**
	 * Try to acquire a semaphore without waiting
	 * Returns immediately if the resource is locked
	 *
	 * @param key Unique identifier for the resource
	 * @param operation Async operation to execute if lock is available
	 * @param context Optional execution context
	 * @returns Result of the operation or null if resource is locked
	 */
	async tryAcquire<T>(
		key: string,
		operation: () => Promise<T>,
		context?: NeuroLinkExecutionContext,
	): Promise<SemaphoreResult<T> | null> {
		// Check if there's an active lock or queue
		if (this.locks.has(key) || (this.queues.get(key) || []).length > 0) {
			if (process.env.NEUROLINK_DEBUG === "true") {
				console.log(`[Semaphore] tryAcquire failed - resource locked: ${key}`);
			}
			return null;
		}

		// No lock, proceed with normal acquire
		return this.acquire(key, operation, context);
	}

	/**
	 * Check if a resource is currently locked
	 *
	 * @param key Resource identifier
	 * @returns True if the resource is locked
	 */
	isLocked(key: string): boolean {
		return this.locks.has(key);
	}

	/**
	 * Get the current queue depth for a resource
	 *
	 * @param key Resource identifier
	 * @returns Number of operations waiting for this resource
	 */
	getQueueDepth(key: string): number {
		const queue = this.queues.get(key) || [];
		const hasLock = this.locks.has(key);
		return queue.length + (hasLock ? 1 : 0);
	}

	/**
	 * Get statistics for a specific resource or global stats
	 *
	 * @param key Optional resource identifier
	 * @returns Semaphore statistics
	 */
	getStats(key?: string): SemaphoreStats {
		if (key) {
			return (
				this.stats.get(key) || {
					activeOperations: 0,
					queuedOperations: 0,
					totalOperations: 0,
					totalWaitTime: 0,
					averageWaitTime: 0,
					peakQueueDepth: 0,
					lastActivity: 0,
				}
			);
		}
		return { ...this.globalStats };
	}

	/**
	 * Clear all semaphores (use with caution)
	 * This will reject all pending operations
	 */
	clearAll(): void {
		console.warn(
			"[Semaphore] Clearing all semaphores - pending operations will be rejected",
		);

		// Reject all queued operations
		for (const [key, queue] of this.queues) {
			for (const op of queue) {
				op.reject(new Error("Semaphore cleared"));
			}
		}

		// Clear all data structures
		this.locks.clear();
		this.queues.clear();
		this.stats.clear();

		// Reset global stats
		this.globalStats = {
			activeOperations: 0,
			queuedOperations: 0,
			totalOperations: this.globalStats.totalOperations,
			totalWaitTime: this.globalStats.totalWaitTime,
			averageWaitTime: this.globalStats.averageWaitTime,
			peakQueueDepth: this.globalStats.peakQueueDepth,
			lastActivity: Date.now(),
		};
	}

	/**
	 * Update queue depth statistics
	 *
	 * @private
	 */
	private updateQueueDepth(key: string, depth: number): void {
		const keyStats = this.stats.get(key) || this.createEmptyStats();

		if (depth > keyStats.peakQueueDepth) {
			keyStats.peakQueueDepth = depth;
		}

		keyStats.queuedOperations = depth;
		this.stats.set(key, keyStats);

		// Update global stats
		this.globalStats.queuedOperations = Array.from(this.stats.values()).reduce(
			(total, stats) => total + stats.queuedOperations,
			0,
		);

		// Update global peak
		if (depth > this.globalStats.peakQueueDepth) {
			this.globalStats.peakQueueDepth = depth;
		}
	}

	/**
	 * Increment active operations counter
	 *
	 * @private
	 */
	private incrementActiveOperations(key: string): void {
		const keyStats = this.stats.get(key) || this.createEmptyStats();
		keyStats.activeOperations++;
		keyStats.totalOperations++;
		keyStats.lastActivity = Date.now();
		this.stats.set(key, keyStats);

		this.globalStats.activeOperations++;
		this.globalStats.totalOperations++;
		this.globalStats.lastActivity = Date.now();
	}

	/**
	 * Decrement active operations counter
	 *
	 * @private
	 */
	private decrementActiveOperations(key: string): void {
		const keyStats = this.stats.get(key);
		if (keyStats && keyStats.activeOperations > 0) {
			keyStats.activeOperations--;
			keyStats.lastActivity = Date.now();
		}

		if (this.globalStats.activeOperations > 0) {
			this.globalStats.activeOperations--;
		}
		this.globalStats.lastActivity = Date.now();
	}

	/**
	 * Update timing statistics
	 *
	 * @private
	 */
	private updateStats(
		key: string,
		waitTime: number,
		executionTime: number,
	): void {
		const keyStats = this.stats.get(key) || this.createEmptyStats();

		keyStats.totalWaitTime += waitTime;
		keyStats.averageWaitTime =
			keyStats.totalOperations > 0
				? keyStats.totalWaitTime / keyStats.totalOperations
				: 0;
		keyStats.lastActivity = Date.now();

		this.stats.set(key, keyStats);

		// Update global stats
		this.globalStats.totalWaitTime += waitTime;
		this.globalStats.averageWaitTime =
			this.globalStats.totalOperations > 0
				? this.globalStats.totalWaitTime / this.globalStats.totalOperations
				: 0;
	}

	/**
	 * Create empty statistics object
	 *
	 * @private
	 */
	private createEmptyStats(): SemaphoreStats {
		return {
			activeOperations: 0,
			queuedOperations: 0,
			totalOperations: 0,
			totalWaitTime: 0,
			averageWaitTime: 0,
			peakQueueDepth: 0,
			lastActivity: Date.now(),
		};
	}
}

/**
 * Default semaphore manager instance
 */
export const defaultSemaphoreManager = new SemaphoreManager();

/**
 * Utility function to acquire semaphore with default manager
 *
 * @param key Resource identifier
 * @param operation Operation to execute
 * @param context Optional execution context
 * @returns Operation result with metrics
 */
export async function acquireSemaphore<T>(
	key: string,
	operation: () => Promise<T>,
	context?: NeuroLinkExecutionContext,
): Promise<SemaphoreResult<T>> {
	return defaultSemaphoreManager.acquire(key, operation, context);
}

/**
 * Utility function to try acquiring semaphore without waiting
 *
 * @param key Resource identifier
 * @param operation Operation to execute
 * @param context Optional execution context
 * @returns Operation result or null if locked
 */
export async function tryAcquireSemaphore<T>(
	key: string,
	operation: () => Promise<T>,
	context?: NeuroLinkExecutionContext,
): Promise<SemaphoreResult<T> | null> {
	return defaultSemaphoreManager.tryAcquire(key, operation, context);
}
