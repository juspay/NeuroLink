/**
 * Mem0 Memory Initializer
 * Simple initialization logic for mem0ai cloud API integration
 */

import { MemoryClient } from "mem0ai";
import type { Memory } from "mem0ai";
import { logger } from "../utils/logger.js";
import type { Mem0Memory } from "../types/utilities.js";

/**
 * Mem0 cloud API configuration
 */
export interface Mem0Config {
  apiKey: string;
  orgId?: string;
  projectId?: string;
}

/**
 * Initialize mem0 memory instance with cloud API
 */
export async function initializeMem0(
  mem0Config: Mem0Config,
): Promise<Mem0Memory | null> {
  logger.debug("[mem0Initializer] Starting mem0 cloud API initialization");

  try {
    // Create MemoryClient instance with cloud API
    const client = new MemoryClient({
      apiKey: mem0Config.apiKey,
      ...(mem0Config.orgId && { org_id: mem0Config.orgId }),
      ...(mem0Config.projectId && { project_id: mem0Config.projectId }),
    });

    logger.info("[mem0Initializer] Mem0 cloud API initialized successfully");

    return client as Mem0Memory;
  } catch (error) {
    logger.warn(
      "[mem0Initializer] Failed to initialize mem0 cloud API, using fallback",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return createFallbackMemory();
  }
}

/**
 * Create fallback memory implementation
 */
function createFallbackMemory(): Mem0Memory {
  return {
    search: async () => [],
    add: async () => [],
    get: async () =>
      ({
        id: "",
        memory: "",
        user_id: "",
        created_at: new Date(),
        updated_at: new Date(),
      }) as unknown as Memory,
    update: async () => [],
    delete: async () => ({
      message: "Fallback memory does not support deletion",
    }),
    getAll: async () => [],
  };
}
