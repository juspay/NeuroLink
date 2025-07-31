/**
 * Test helper functions and mock implementations
 * Provides type-safe mocks for testing NeuroLink components
 */

import { vi } from "vitest";
import { logger } from "../../lib/utils/logger.js";
import type { UnknownRecord, Unknown } from "../../lib/types/common.js";

// Mock SecureFS implementation
export class MockSecureFS {
  async readFile(path: string): Promise<string> {
    return `mock-content-for-${path}`;
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Mock implementation
  }

  async exists(path: string): Promise<boolean> {
    return true;
  }

  async listDirectory(path: string): Promise<string[]> {
    return [`${path}/file1.txt`, `${path}/file2.txt`];
  }
}

// Mock Logger implementation
export class MockLogger {
  info(message: string, meta?: Unknown): void {
    logger.debug(`[INFO] ${message}`, meta);
  }

  error(message: string, error?: Error, meta?: Unknown): void {
    logger.error(`[ERROR] ${message}`, error, meta);
  }

  warn(message: string, meta?: Unknown): void {
    logger.debug(`[WARN] ${message}`, meta);
  }

  debug(message: string, meta?: Unknown): void {
    logger.debug(`[DEBUG] ${message}`, meta);
  }
}

// Helper function to create complete execution context
export const createMockExecutionContext = (
  overrides: UnknownRecord = {},
): UnknownRecord => ({
  sessionId: "test-session-123",
  userId: "test-user-456",
  secureFS: new MockSecureFS(),
  path: "/test/workspace",
  grantedPermissions: ["read", "write", "execute"],
  log: new MockLogger(),
  aiProvider: "google-ai",
  timestamp: Date.now(),
  permissions: ["filesystem:read", "filesystem:write", "network:fetch"],
  ...overrides,
});
