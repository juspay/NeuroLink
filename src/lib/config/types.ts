/**
 * NeuroLink Configuration Types
 * Industry standard camelCase interfaces for config management
 */

/**
 * Main NeuroLink configuration interface
 */
export interface NeuroLinkConfig {
	providers?: Record<string, ProviderConfig>;
	performance?: PerformanceConfig;
	analytics?: AnalyticsConfig;
	lastUpdated?: number;
	configVersion?: string;
	[key: string]: unknown; // Extensibility for existing config
}

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
	model?: string;
	available?: boolean;
	lastCheck?: number;
	reason?: string;
	apiKey?: string;
	endpoint?: string;
	maxTokens?: number;
	temperature?: number;
	timeout?: number;
	costPerToken?: number;
	features?: string[]; // ['streaming', 'functionCalling', 'vision']
	[key: string]: unknown; // Provider-specific extensions
}

/**
 * Performance and caching configuration
 */
export interface PerformanceConfig {
	cache?: CacheConfig;
	fallback?: FallbackConfig;
	timeoutMs?: number;
	maxConcurrency?: number;
	retryConfig?: RetryConfig;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
	enabled?: boolean;
	ttlMs?: number; // Time to live (milliseconds)
	strategy?: "memory" | "writeThrough" | "cacheAside";
	maxSize?: number; // Maximum cache entries
	persistToDisk?: boolean;
	diskPath?: string;
}

/**
 * Fallback configuration
 */
export interface FallbackConfig {
	enabled?: boolean;
	maxAttempts?: number;
	delayMs?: number;
	circuitBreaker?: boolean;
	commonResponses?: Record<string, string>; // Common fallback responses
	localFallbackPath?: string; // Path to local fallback file
	degradedMode?: boolean; // Allow degraded functionality
}

/**
 * Retry configuration
 */
export interface RetryConfig {
	enabled?: boolean;
	maxAttempts?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	exponentialBackoff?: boolean;
	retryConditions?: string[]; // Error types to retry on
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
	enabled?: boolean;
	trackTokens?: boolean;
	trackCosts?: boolean;
	trackPerformance?: boolean;
	trackErrors?: boolean;
	exportFormat?: "json" | "csv" | "prometheus";
	exportPath?: string;
	retention?: {
		days?: number;
		maxEntries?: number;
	};
}

/**
 * Backup metadata information
 */
export interface BackupInfo {
	filename: string;
	path: string;
	metadata: BackupMetadata;
	config: NeuroLinkConfig;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
	reason: string;
	timestamp: number;
	version: string;
	originalPath: string;
	hash?: string; // Config hash for verification
	size?: number; // File size in bytes
	createdBy?: string; // Who/what created the backup
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	suggestions: string[];
}

/**
 * Configuration update options
 */
export interface ConfigUpdateOptions {
	createBackup?: boolean;
	validate?: boolean;
	merge?: boolean; // Merge with existing vs replace
	reason?: string; // Reason for the update
	silent?: boolean; // Skip console output
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: NeuroLinkConfig = {
	providers: {
		googleAi: {
			model: "gemini-2.5-pro",
			available: true,
			features: ["streaming", "functionCalling"],
		},
	},
	performance: {
		cache: {
			enabled: true,
			ttlMs: 300000, // 5 minutes
			strategy: "memory",
			maxSize: 1000,
		},
		fallback: {
			enabled: true,
			maxAttempts: 3,
			delayMs: 1000,
			circuitBreaker: true,
		},
		timeoutMs: 30000, // 30 seconds
		maxConcurrency: 5,
	},
	analytics: {
		enabled: true,
		trackTokens: true,
		trackCosts: true,
		trackPerformance: true,
		retention: {
			days: 30,
			maxEntries: 10000,
		},
	},
	configVersion: "3.0.1",
};
