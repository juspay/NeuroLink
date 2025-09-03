/**
 * Redis Utilities for NeuroLink
 * Helper functions for Redis storage operations
 */

import { createClient, type RedisClientOptions } from "redis";
type RedisClient = ReturnType<typeof createClient>;
import { logger } from "./logger.js";
import type { ChatMessage, RedisStorageConfig } from "../types/conversation.js";

// Redis client type

/**
 * Creates a Redis client with the provided configuration
 */
export async function createRedisClient(
  config: Required<RedisStorageConfig>,
): Promise<RedisClient> {
  const url = `redis://${config.host}:${config.port}/${config.db}`;

  // Create client options
  const clientOptions: RedisClientOptions = {
    url,
    socket: {
      connectTimeout: config.connectionOptions?.connectTimeout,
      reconnectStrategy: (retries: number) => {
        if (retries > (config.connectionOptions?.maxRetriesPerRequest || 3)) {
          logger.error("Redis connection retries exhausted");
          return new Error("Redis connection retries exhausted");
        }
        const delay = Math.min(
          (config.connectionOptions?.retryDelayOnFailover || 100) *
            Math.pow(2, retries),
          10000,
        );
        return delay;
      },
    },
  };

  if (config.password) {
    clientOptions.password = config.password;
  }

  // Create client with secured options
  const client = createClient(clientOptions);

  client.on("error", (err: Error) => {
    const sanitizedMessage = err.message.replace(
      /redis:\/\/.*?@/g,
      "redis://[redacted]@",
    );
    logger.error("Redis client error", { error: sanitizedMessage });
  });

  client.on("connect", () => {
    logger.debug("Redis client connected", {
      host: config.host,
      port: config.port,
      db: config.db,
    });
  });

  client.on("reconnecting", () => {
    logger.debug("Redis client reconnecting");
  });

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

/**
 * Generates a Redis key for session messages
 */
export function getSessionKey(
  config: Required<RedisStorageConfig>,
  sessionId: string,
): string {
  const key = `${config.keyPrefix}${sessionId}`;

  logger.debug("[redisUtils] Generated session key", {
    sessionId,
    keyPrefix: config.keyPrefix,
    fullKey: key,
  });

  return key;
}

/**
 * Serializes messages for Redis storage
 */
export function serializeMessages(messages: ChatMessage[]): string {
  try {
    logger.debug("[redisUtils] Serializing messages", {
      messageCount: messages.length,
      messageTypes: messages.map((m) => m.role),
      firstMessage:
        messages.length > 0
          ? {
              role: messages[0].role,
              contentLength: messages[0].content.length,
              contentPreview: messages[0].content.substring(0, 50),
            }
          : null,
      lastMessage:
        messages.length > 0
          ? {
              role: messages[messages.length - 1].role,
              contentLength: messages[messages.length - 1].content.length,
              contentPreview: messages[messages.length - 1].content.substring(
                0,
                50,
              ),
            }
          : null,
    });

    const serialized = JSON.stringify(messages);

    logger.debug("[redisUtils] Messages serialized successfully", {
      serializedLength: serialized.length,
      messageCount: messages.length,
    });

    return serialized;
  } catch (error) {
    logger.error("[redisUtils] Failed to serialize messages", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      messageCount: messages.length,
    });
    throw error;
  }
}

/**
 * Deserializes messages from Redis storage
 */
export function deserializeMessages(data: string | null): ChatMessage[] {
  if (!data) {
    logger.debug("[redisUtils] No data to deserialize, returning empty array");
    return [];
  }

  try {
    logger.debug("[redisUtils] Deserializing messages", {
      dataLength: data.length,
      dataPreview: data.substring(0, 100) + (data.length > 100 ? "..." : ""),
    });

    // Parse as unknown first, then validate before casting
    const parsedData = JSON.parse(data) as unknown;

    // Check if the parsed data is an array
    if (!Array.isArray(parsedData)) {
      logger.warn("[redisUtils] Deserialized data is not an array", {
        type: typeof parsedData,
        preview: JSON.stringify(parsedData).substring(0, 100),
      });
      return [];
    }

    // Validate each item in the array has the correct ChatMessage structure
    const isValid = parsedData.every(
      (m): m is ChatMessage =>
        typeof m === "object" &&
        m !== null &&
        "role" in m &&
        "content" in m &&
        typeof m.role === "string" &&
        typeof m.content === "string" &&
        (m.role === "user" || m.role === "assistant" || m.role === "system"),
    );

    if (!isValid) {
      logger.warn("[redisUtils] Deserialized data has unexpected structure", {
        isArray: true,
        firstItem: parsedData.length > 0 ? JSON.stringify(parsedData[0]) : null,
      });
      return [];
    }

    // Now that we've validated, we can safely cast
    const messages = parsedData as ChatMessage[];

    logger.debug("[redisUtils] Messages deserialized successfully", {
      messageCount: messages.length,
      messageTypes: messages.map((m) => m.role),
      firstMessage:
        messages.length > 0
          ? {
              role: messages[0].role,
              contentLength: messages[0].content.length,
              contentPreview: messages[0].content.substring(0, 50),
            }
          : null,
      lastMessage:
        messages.length > 0
          ? {
              role: messages[messages.length - 1].role,
              contentLength: messages[messages.length - 1].content.length,
              contentPreview: messages[messages.length - 1].content.substring(
                0,
                50,
              ),
            }
          : null,
    });

    logger.debug("[deserializeMessages] completed");
    return messages;
  } catch (error) {
    logger.error("[redisUtils] Failed to deserialize messages", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      dataLength: data.length,
      dataPreview: "[REDACTED]", // Prevent exposure of potentially sensitive data
    });
    return [];
  }
}

/**
 * Checks if Redis client is healthy
 */
export async function isRedisHealthy(client: RedisClient): Promise<boolean> {
  try {
    const pong = await client.ping();
    return pong === "PONG";
  } catch (error) {
    logger.error("Redis health check failed", { error });
    return false;
  }
}

/**
 * Scan Redis keys matching a pattern without blocking the server
 * This is a non-blocking alternative to the KEYS command
 *
 * @param client Redis client
 * @param pattern Pattern to match keys (e.g. "prefix:*")
 * @param batchSize Number of keys to scan in each iteration (default: 100)
 * @returns Array of keys matching the pattern
 */
export async function scanKeys(
  client: RedisClient,
  pattern: string,
  batchSize: number = 100,
): Promise<string[]> {
  logger.debug("[redisUtils] Starting SCAN operation", {
    pattern,
    batchSize,
  });

  const allKeys: string[] = [];
  let cursor = "0";
  let iterations = 0;
  let totalScanned = 0;

  try {
    do {
      iterations++;
      // Use SCAN instead of KEYS to avoid blocking the server
      const result = await client.scan(cursor, {
        MATCH: pattern,
        COUNT: batchSize,
      });

      // Extract cursor and keys from result
      cursor = result.cursor;
      const keys = result.keys || [];

      // Add keys to result array
      allKeys.push(...keys);
      totalScanned += keys.length;

      logger.debug("[redisUtils] SCAN iteration completed", {
        iteration: iterations,
        currentCursor: cursor,
        keysInBatch: keys.length,
        totalKeysFound: allKeys.length,
      });
    } while (cursor !== "0"); // Continue until cursor is 0

    logger.info("[redisUtils] SCAN operation completed", {
      pattern,
      totalIterations: iterations,
      totalKeysFound: allKeys.length,
      totalScanned,
    });

    return allKeys;
  } catch (error) {
    logger.error("[redisUtils] Error during SCAN operation", {
      pattern,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Get normalized Redis configuration with defaults
 */
export function getNormalizedConfig(
  config: RedisStorageConfig,
): Required<RedisStorageConfig> {
  return {
    host: config.host || "localhost",
    port: config.port || 6379,
    password: config.password || "",
    db: config.db || 0,
    keyPrefix: config.keyPrefix || "neurolink:conversation:",
    ttl: config.ttl || 86400,
    connectionOptions: {
      connectTimeout: 30000,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      ...config.connectionOptions,
    },
  };
}
