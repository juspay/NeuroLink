/**
 * Utility functions for AI provider management
 */
/**
 * Get the best available provider based on preferences and availability
 * @param requestedProvider - Optional preferred provider name
 * @returns The best provider name to use
 */
export declare function getBestProvider(requestedProvider?: string): string;
/**
 * Get available provider names
 * @returns Array of available provider names
 */
export declare function getAvailableProviders(): string[];
/**
 * Validate provider name
 * @param provider - Provider name to validate
 * @returns True if provider name is valid
 */
export declare function isValidProvider(provider: string): boolean;
