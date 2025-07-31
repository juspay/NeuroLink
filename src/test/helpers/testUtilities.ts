/**
 * Test utilities for NeuroLink testing
 * Provides helper functions for creating test configurations and mocks
 */

import { vi, expect } from "vitest";
import type { TransportConfig } from "../../lib/mcp/transportManager.js";
import { createMockExecutionContext } from "./testMocks.js";
import type { UnknownRecord } from "../../lib/types/common.js";

// Test utility for async operations
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Test utility for expecting async errors
export const expectAsyncError = async (
  asyncFn: () => Promise<unknown>,
  expectedMessage?: string,
) => {
  try {
    await asyncFn();
    throw new Error("Expected function to throw an error");
  } catch (error) {
    if (expectedMessage && error instanceof Error) {
      expect(error.message).toContain(expectedMessage);
    }
    return error;
  }
};

// Test utility for mocking providers
export const createMockProvider = (
  providerName: string,
  options: UnknownRecord = {},
) => {
  return {
    generate: vi.fn().mockResolvedValue({
      text: `Mock response from ${providerName}`,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: "stop",
      ...options,
    }),
    streamText: vi.fn(),
    name: providerName,
  };
};

// Test utility for transport configs
export const createTestTransportConfigs = () => ({
  stdio: {
    type: "stdio" as const,
    command: "test-command",
    args: ["--test"],
  } satisfies TransportConfig,
  sse: {
    type: "sse" as const,
    url: "https://test.example.com/sse",
    timeout: 10000,
    maxRetryTime: 30000,
    withCredentials: false,
    headers: { Authorization: "Bearer test-token" },
  } satisfies TransportConfig,
  http: {
    type: "http" as const,
    url: "https://test.example.com/api",
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
  } satisfies TransportConfig,
});

// Test utility for MCP registry mocking
export const createMockMCPRegistry = () => ({
  register: vi.fn().mockResolvedValue(undefined),
  registerServer: vi.fn().mockResolvedValue(undefined),
  executeTool: vi.fn().mockResolvedValue({ result: "mock-result" }),
  listTools: vi
    .fn()
    .mockResolvedValue([
      { name: "test-tool", description: "Test tool description" },
    ]),
  listServers: vi.fn().mockResolvedValue(["test-server"]),
  unregister: vi.fn().mockResolvedValue(undefined),
  isRegistered: vi.fn().mockReturnValue(true),
});

// Test utility for error manager mocking
export const createMockErrorManager = () => ({
  recordError: vi.fn().mockResolvedValue({
    id: "err-test-123",
    timestamp: Date.now(),
    error: new Error("Test error"),
    category: "UNKNOWN_ERROR",
    severity: "MEDIUM",
    context: {},
    stackTrace: "Test stack trace",
  }),
  getErrors: vi.fn().mockResolvedValue([]),
  clearErrors: vi.fn().mockResolvedValue(undefined),
});

export { createMockExecutionContext };
export { registerTestTool, registerTestTools } from "./registryHelpers.js";
