/**
 * Redis Conversation Memory Manager for NeuroLink
 * Redis-based implementation of conversation storage with same interface as ConversationMemoryManager
 */

import type {
  ConversationMemoryConfig,
  SessionMemory,
  ConversationMemoryStats,
  ChatMessage,
  RedisStorageConfig,
} from "../types/conversation.js";
import { ConversationMemoryError } from "../types/conversation.js";
import {
  DEFAULT_MAX_TURNS_PER_SESSION,
  DEFAULT_MAX_SESSIONS,
  MESSAGES_PER_TURN,
} from "../config/conversationMemory.js";
import { logger } from "../utils/logger.js";
import { NeuroLink } from "../neurolink.js";
import {
  createRedisClient,
  getSessionKey,
  getNormalizedConfig,
  serializeMessages,
  deserializeMessages,
  scanKeys,
} from "../utils/redis.js";

/**
 * Redis-based implementation of the ConversationMemoryManager
 * Uses the same interface but stores data in Redis
 */
export class RedisConversationMemoryManager {
  public config: ConversationMemoryConfig;
  private isInitialized: boolean = false;
  private redisConfig: Required<RedisStorageConfig>;
  private redisClient: Awaited<ReturnType<typeof createRedisClient>> | null =
    null;

  constructor(
    config: ConversationMemoryConfig,
    redisConfig: RedisStorageConfig = {},
  ) {
    this.config = config;
    this.redisConfig = getNormalizedConfig(redisConfig);
  }

  /**
   * Initialize the memory manager with Redis connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug(
        "[RedisConversationMemoryManager] Already initialized, skipping",
      );
      return;
    }

    try {
      logger.debug(
        "[RedisConversationMemoryManager] Initializing with config",
        {
          host: this.redisConfig.host,
          port: this.redisConfig.port,
          keyPrefix: this.redisConfig.keyPrefix,
          ttl: this.redisConfig.ttl,
        },
      );

      this.redisClient = await createRedisClient(this.redisConfig);
      this.isInitialized = true;

      logger.info("RedisConversationMemoryManager initialized", {
        storage: "redis",
        host: this.redisConfig.host,
        port: this.redisConfig.port,
        maxSessions: this.config.maxSessions,
        maxTurnsPerSession: this.config.maxTurnsPerSession,
      });

      logger.debug(
        "[RedisConversationMemoryManager] Redis client created successfully",
        {
          clientType: this.redisClient?.constructor?.name || "unknown",
          isConnected: !!this.redisClient,
        },
      );
    } catch (error) {
      logger.error("[RedisConversationMemoryManager] Failed to initialize", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        config: {
          host: this.redisConfig.host,
          port: this.redisConfig.port,
        },
      });

      throw new ConversationMemoryError(
        "Failed to initialize Redis conversation memory",
        "CONFIG_ERROR",
        { error: error instanceof Error ? error.message : String(error) },
      );
    }
  }

  /**
   * Store a conversation turn for a session
   */
  async storeConversationTurn(
    sessionId: string,
    userId: string | undefined,
    userMessage: string,
    aiResponse: string,
  ): Promise<void> {
    logger.debug("[RedisConversationMemoryManager] Storing conversation turn", {
      sessionId,
      userId,
      userMessageLength: userMessage.length,
      aiResponseLength: aiResponse.length,
    });

    await this.ensureInitialized();

    try {
      if (!this.redisClient) {
        throw new Error("Redis client not initialized");
      }

      // Generate Redis key
      const redisKey = getSessionKey(this.redisConfig, sessionId);

      // Get existing messages
      const messagesData = await this.redisClient.get(redisKey);
      const messages = deserializeMessages(messagesData);
      logger.info("[RedisConversationMemoryManager] Deserialized messages", {
        messageCount: messages.length,
        roles: messages.map((m) => m.role),
      });

      // Add new messages
      messages.push(
        { role: "user", content: userMessage },
        { role: "assistant", content: aiResponse },
      );

      logger.info("[RedisConversationMemoryManager] Added new messages", {
        newMessageCount: messages.length,
        latestMessages: [
          {
            role: messages[messages.length - 2]?.role,
            contentLength: messages[messages.length - 2]?.content.length,
          },
          {
            role: messages[messages.length - 1]?.role,
            contentLength: messages[messages.length - 1]?.content.length,
          },
        ],
      });

      // Handle summarization or message limit
      if (this.config.enableSummarization) {
        const userAssistantCount = messages.filter(
          (msg) => msg.role === "user" || msg.role === "assistant",
        ).length;
        const currentTurnCount = Math.floor(
          userAssistantCount / MESSAGES_PER_TURN,
        );

        logger.debug(
          "[RedisConversationMemoryManager] Checking summarization threshold",
          {
            userAssistantCount,
            currentTurnCount,
            summarizationThreshold:
              this.config.summarizationThresholdTurns || 20,
            shouldSummarize:
              currentTurnCount >=
              (this.config.summarizationThresholdTurns || 20),
          },
        );

        if (
          currentTurnCount >= (this.config.summarizationThresholdTurns || 20)
        ) {
          await this._summarizeMessages(sessionId, userId, messages);
          return;
        }
      } else {
        const maxMessages =
          (this.config.maxTurnsPerSession || DEFAULT_MAX_TURNS_PER_SESSION) *
          MESSAGES_PER_TURN;

        logger.debug(
          "[RedisConversationMemoryManager] Checking message limit",
          {
            currentMessageCount: messages.length,
            maxMessages,
            shouldTrimMessages: messages.length > maxMessages,
          },
        );

        if (messages.length > maxMessages) {
          const trimCount = messages.length - maxMessages;
          logger.debug("[RedisConversationMemoryManager] Trimming messages", {
            beforeCount: messages.length,
            trimCount,
            afterCount: maxMessages,
          });
          messages.splice(0, messages.length - maxMessages);
        }
      }

      // Save updated messages
      const serializedData = serializeMessages(messages);
      logger.debug(
        "[RedisConversationMemoryManager] Saving messages to Redis",
        {
          redisKey,
          messageCount: messages.length,
          serializedDataLength: serializedData.length,
        },
      );

      await this.redisClient.set(redisKey, serializedData);

      // Set TTL if configured
      if (this.redisConfig.ttl > 0) {
        logger.debug("[RedisConversationMemoryManager] Setting Redis TTL", {
          redisKey,
          ttl: this.redisConfig.ttl,
        });
        await this.redisClient.expire(redisKey, this.redisConfig.ttl);
      }

      // Enforce session limit
      await this.enforceSessionLimit();

      logger.debug(
        "[RedisConversationMemoryManager] Successfully stored conversation turn",
        {
          sessionId,
          totalMessages: messages.length,
        },
      );
    } catch (error) {
      throw new ConversationMemoryError(
        `Failed to store conversation turn in Redis for session ${sessionId}`,
        "STORAGE_ERROR",
        {
          sessionId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Build context messages for AI prompt injection
   */
  async buildContextMessages(sessionId: string): Promise<ChatMessage[]> {
    logger.info("[RedisConversationMemoryManager] Building context messages", {
      sessionId,
      method: "buildContextMessages",
    });

    await this.ensureInitialized();

    if (!this.redisClient) {
      logger.warn(
        "[RedisConversationMemoryManager] Redis client not available, returning empty context",
        {
          sessionId,
        },
      );
      return [];
    }

    const redisKey = getSessionKey(this.redisConfig, sessionId);
    logger.info(
      "[RedisConversationMemoryManager] Getting messages from Redis",
      {
        sessionId,
        redisKey,
      },
    );

    const messagesData = await this.redisClient.get(redisKey);
    logger.info(
      "[RedisConversationMemoryManager] Retrieved message data from Redis",
      {
        sessionId,
        redisKey,
        hasData: !!messagesData,
        dataLength: messagesData?.length || 0,
      },
    );

    const messages = deserializeMessages(messagesData);
    logger.info(
      "[RedisConversationMemoryManager] Deserialized messages for context",
      {
        sessionId,
        messageCount: messages.length,
        messageRoles: messages.map((m) => m.role),
        firstMessagePreview: messages[0]?.content?.substring(0, 50),
        lastMessagePreview: messages[messages.length - 1]?.content?.substring(
          0,
          50,
        ),
      },
    );

    return messages;
  }

  /**
   * Get session data
   */
  public async getSession(
    sessionId: string,
  ): Promise<SessionMemory | undefined> {
    logger.debug("[RedisConversationMemoryManager] Getting session", {
      sessionId,
      method: "getSession",
    });

    await this.ensureInitialized();

    if (!this.redisClient) {
      logger.warn(
        "[RedisConversationMemoryManager] Redis client not available",
        {
          sessionId,
        },
      );
      return undefined;
    }

    const redisKey = getSessionKey(this.redisConfig, sessionId);
    logger.debug(
      "[RedisConversationMemoryManager] Getting session data from Redis",
      {
        sessionId,
        redisKey,
      },
    );

    const messagesData = await this.redisClient.get(redisKey);
    logger.debug("[RedisConversationMemoryManager] Retrieved session data", {
      sessionId,
      hasData: !!messagesData,
      dataLength: messagesData?.length || 0,
    });

    if (!messagesData) {
      logger.debug("[RedisConversationMemoryManager] No session data found", {
        sessionId,
        redisKey,
      });
      return undefined;
    }

    const messages = deserializeMessages(messagesData);
    logger.debug(
      "[RedisConversationMemoryManager] Deserialized session messages",
      {
        sessionId,
        messageCount: messages.length,
        messageRoles: messages.map((m) => m.role),
      },
    );

    // We don't store the full SessionMemory object in Redis,
    // just the messages, so we recreate the SessionMemory object here
    const session = {
      sessionId,
      messages,
      createdAt: Date.now(), // We don't have this information
      lastActivity: Date.now(), // We don't have this information
    };

    logger.debug(
      "[RedisConversationMemoryManager] Created session memory object",
      {
        sessionId,
        messageCount: session.messages.length,
      },
    );

    return session;
  }

  /**
   * Create summary system message
   */
  public createSummarySystemMessage(content: string): ChatMessage {
    return {
      role: "system",
      content: `Summary of previous conversation turns:\n\n${content}`,
    };
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
      this.isInitialized = false;
      logger.info("Redis connection closed");
    }
  }

  /**
   * Get statistics about conversation storage
   */
  public async getStats(): Promise<ConversationMemoryStats> {
    await this.ensureInitialized();

    if (!this.redisClient) {
      return { totalSessions: 0, totalTurns: 0 };
    }

    // Get all session keys using SCAN instead of KEYS to avoid blocking
    const pattern = `${this.redisConfig.keyPrefix}*`;
    const keys = await scanKeys(this.redisClient, pattern);

    logger.debug(
      "[RedisConversationMemoryManager] Got session keys with SCAN",
      {
        pattern,
        keyCount: keys.length,
      },
    );

    // Count messages in each session
    let totalTurns = 0;

    for (const key of keys) {
      const messagesData = await this.redisClient.get(key);
      const messages = deserializeMessages(messagesData);
      totalTurns += messages.length / MESSAGES_PER_TURN;
    }

    return {
      totalSessions: keys.length,
      totalTurns,
    };
  }

  /**
   * Clear a specific session
   */
  public async clearSession(sessionId: string): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.redisClient) {
      return false;
    }

    const redisKey = getSessionKey(this.redisConfig, sessionId);
    const result = await this.redisClient.del(redisKey);

    if (result > 0) {
      logger.info("Redis session cleared", { sessionId });
      return true;
    }

    return false;
  }

  /**
   * Clear all sessions
   */
  public async clearAllSessions(): Promise<void> {
    await this.ensureInitialized();

    if (!this.redisClient) {
      return;
    }

    const pattern = `${this.redisConfig.keyPrefix}*`;

    // Use SCAN instead of KEYS to avoid blocking the server
    const keys = await scanKeys(this.redisClient, pattern);
    logger.debug(
      "[RedisConversationMemoryManager] Got session keys with SCAN for clearing",
      {
        pattern,
        keyCount: keys.length,
      },
    );

    if (keys.length > 0) {
      // Process keys in batches to avoid blocking Redis for too long
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await this.redisClient.del(batch);
        logger.debug(
          "[RedisConversationMemoryManager] Cleared batch of sessions",
          {
            batchIndex: Math.floor(i / batchSize) + 1,
            batchSize: batch.length,
            totalProcessed: i + batch.length,
            totalKeys: keys.length,
          },
        );
      }

      logger.info("All Redis sessions cleared", { clearedCount: keys.length });
    }
  }

  /**
   * Summarize messages for a session
   */
  private async _summarizeMessages(
    sessionId: string,
    userId: string | undefined,
    messages: ChatMessage[],
  ): Promise<void> {
    logger.info(
      `[RedisConversationMemory] Summarizing session ${sessionId}...`,
    );

    logger.debug(
      "[RedisConversationMemoryManager] Starting message summarization",
      {
        sessionId,
        userId,
        messageCount: messages.length,
        messageTypes: messages.map((m) => m.role),
      },
    );

    const targetTurns = this.config.summarizationTargetTurns || 10;
    const splitIndex = Math.max(
      0,
      messages.length - targetTurns * MESSAGES_PER_TURN,
    );
    const messagesToSummarize = messages.slice(0, splitIndex);
    const recentMessages = messages.slice(splitIndex);

    if (messagesToSummarize.length === 0) {
      return;
    }

    const summarizationPrompt =
      this._createSummarizationPrompt(messagesToSummarize);

    const summarizer = new NeuroLink({
      conversationMemory: { enabled: false },
    });

    try {
      const providerName = this.config.summarizationProvider;

      // Map provider names to correct format
      let mappedProvider = providerName;
      if (providerName === "vertex") {
        mappedProvider = "googlevertex";
      }

      if (!mappedProvider) {
        logger.error(
          `[RedisConversationMemory] Missing summarization provider`,
        );
        return;
      }

      logger.debug(
        `[RedisConversationMemory] Using provider: ${mappedProvider} for summarization`,
      );

      const summaryResult = await summarizer.generate({
        input: { text: summarizationPrompt },
        provider: mappedProvider,
        model: this.config.summarizationModel,
        disableTools: true,
      });

      if (!this.redisClient) {
        throw new Error("Redis client not initialized");
      }

      if (summaryResult.content) {
        const updatedMessages = [
          this.createSummarySystemMessage(summaryResult.content),
          ...recentMessages,
        ];

        const redisKey = getSessionKey(this.redisConfig, sessionId);
        await this.redisClient.set(
          redisKey,
          serializeMessages(updatedMessages),
        );

        // Set TTL if configured
        if (this.redisConfig.ttl > 0) {
          await this.redisClient.expire(redisKey, this.redisConfig.ttl);
        }

        logger.info(
          `[RedisConversationMemory] Summarization complete for session ${sessionId}.`,
        );
      } else {
        logger.warn(
          `[RedisConversationMemory] Summarization failed for session ${sessionId}. History not modified.`,
        );
      }
    } catch (error) {
      logger.error(
        `[RedisConversationMemory] Error during summarization for session ${sessionId}`,
        { error },
      );
    }
  }

  /**
   * Create summarization prompt
   */
  private _createSummarizationPrompt(history: ChatMessage[]): string {
    const formattedHistory = history
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");
    return `
You are a context summarization AI. Your task is to condense the following conversation history for another AI assistant.
The summary must be a concise, third-person narrative that retains all critical information, including key entities, technical details, decisions made, and any specific dates or times mentioned.
Ensure the summary flows logically and is ready to be used as context for the next turn in the conversation.

Conversation History to Summarize:
---
${formattedHistory}
---
`.trim();
  }

  /**
   * Ensure Redis client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    logger.debug("[RedisConversationMemoryManager] Ensuring initialization");
    if (!this.isInitialized) {
      logger.debug(
        "[RedisConversationMemoryManager] Not initialized, initializing now",
      );
      await this.initialize();
    } else {
      logger.debug("[RedisConversationMemoryManager] Already initialized");
    }
  }

  /**
   * Enforce session limit
   *
   * NOTE: This function is maintained only for backward compatibility with the
   * in-memory implementation. In Redis, we do not actually delete sessions based on
   * a global limit, as this could cause race conditions in a distributed environment.
   * Each session is managed independently with its own TTL.
   */
  private async enforceSessionLimit(): Promise<void> {
    logger.debug(
      "[RedisConversationMemoryManager] Enforcing session limit (compatibility function)",
    );

    if (!this.redisClient) {
      logger.debug(
        "[RedisConversationMemoryManager] No Redis client, skipping session limit check",
      );
      return;
    }

    const maxSessions = this.config.maxSessions || DEFAULT_MAX_SESSIONS;
    const pattern = `${this.redisConfig.keyPrefix}*`;

    logger.debug("[RedisConversationMemoryManager] Listing all session keys", {
      pattern,
      maxSessions,
    });

    // Use SCAN instead of KEYS to avoid blocking the server
    const keys = await scanKeys(this.redisClient, pattern);
    logger.debug(
      "[RedisConversationMemoryManager] Found existing sessions using SCAN",
      {
        sessionCount: keys.length,
        maxSessions,
        needsTrimming: keys.length > maxSessions,
      },
    );

    // In the Redis implementation, we intentionally do not delete sessions based on a global limit.
    // Each session is managed independently with its own TTL.
    if (keys.length > maxSessions) {
      logger.info(
        "Redis session count exceeds limit, but not enforcing deletion",
        {
          currentCount: keys.length,
          maxSessions,
          reason: "Redis sessions are managed independently with TTL",
        },
      );
    }
  }
}
