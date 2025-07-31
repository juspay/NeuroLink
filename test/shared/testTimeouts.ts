/**
 * Shared test timeout constants to eliminate duplication across test files
 * This addresses PR comment about duplicate timeout logic in test files
 */

// Standard timeout constants
export const TEST_TIMEOUTS = {
  // Standard test timeout (30 seconds)
  STANDARD: 30000,

  // Quick tests (20 seconds)
  QUICK: 20000,

  // Performance-intensive tests (60 seconds)
  PERFORMANCE: 60000,

  // Long-running tests with AI providers (120 seconds)
  AI_GENERATION: 120000,

  // Process execution timeout (15 seconds)
  PROCESS_EXEC: 15000,
} as const;

// Helper function for timeout with provider-specific adjustments
export const getProviderTimeout = (provider: string): number => {
  // Some providers may need longer timeouts
  switch (provider?.toLowerCase()) {
    case "ollama":
      return TEST_TIMEOUTS.AI_GENERATION; // Local models may be slower
    case "bedrock":
      return TEST_TIMEOUTS.AI_GENERATION; // AWS may have longer latency
    default:
      return TEST_TIMEOUTS.STANDARD;
  }
};

// Helper for creating timeout with description
export const createTimeout = (
  type: keyof typeof TEST_TIMEOUTS,
  description?: string,
) => {
  const timeout = TEST_TIMEOUTS[type];
  if (description) {
    console.log(`⏱️  Setting ${description} timeout: ${timeout}ms`);
  }
  return timeout;
};
