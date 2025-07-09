/**
 * Default value helper functions for NeuroLink
 * Centralized logic for applying defaults across the system
 */

import {
	DEFAULT_MAX_TOKENS,
	DEFAULT_TEMPERATURE,
	ENV_DEFAULTS,
} from "./constants.js";

/**
 * Apply default values to options object
 * User-provided values take precedence over defaults
 */
export function applyDefaults(options: any): any {
	return {
		maxTokens: ENV_DEFAULTS.maxTokens,
		temperature: ENV_DEFAULTS.temperature,
		...options, // User overrides take precedence
	};
}

/**
 * Get default max tokens for a specific provider
 * Can be extended for provider-specific overrides in the future
 */
export function getDefaultMaxTokens(provider?: string): number {
	return ENV_DEFAULTS.maxTokens;
}

/**
 * Get default temperature for a specific use case
 */
export function getDefaultTemperature(useCase?: string): number {
	return ENV_DEFAULTS.temperature;
}
