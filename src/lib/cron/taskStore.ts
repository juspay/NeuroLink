/**
 * Task Persistence Stores for NeuroLink Cron System
 *
 * Provides two implementations:
 * - InMemoryTaskStore: Default, Map-based in-memory storage
 * - RedisTaskStore: Optional Redis-backed persistence for production use
 */

import type {
  ScheduledTask,
  TaskFilter,
  TaskRunResult,
  TaskStatus,
  TaskStore,
} from "./types.js";

/**
 * In-memory task store using Map.
 * Tasks are lost on process restart. Suitable for development
 * and session-scoped scheduling.
 */
export class InMemoryTaskStore implements TaskStore {
  private tasks: Map<string, ScheduledTask> = new Map();

  async save(task: ScheduledTask): Promise<void> {
    this.tasks.set(task.id, { ...task });
  }

  async get(taskId: string): Promise<ScheduledTask | undefined> {
    const task = this.tasks.get(taskId);
    return task ? { ...task } : undefined;
  }

  async list(filter?: TaskFilter): Promise<ScheduledTask[]> {
    let tasks = Array.from(this.tasks.values());

    if (filter?.status) {
      tasks = tasks.filter((t) => t.status === filter.status);
    }
    if (filter?.sessionMode) {
      tasks = tasks.filter((t) => t.sessionMode === filter.sessionMode);
    }
    if (filter?.limit) {
      tasks = tasks.slice(0, filter.limit);
    }

    return tasks.map((t) => ({ ...t }));
  }

  async delete(taskId: string): Promise<boolean> {
    return this.tasks.delete(taskId);
  }

  async updateStatus(taskId: string, status: TaskStatus): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.updatedAt = Date.now();
    }
  }

  async addRunResult(taskId: string, run: TaskRunResult): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.runs.unshift(run);
      // Trim run history
      if (task.runs.length > task.maxRunHistory) {
        task.runs = task.runs.slice(0, task.maxRunHistory);
      }
      task.updatedAt = Date.now();
    }
  }

  async incrementRunCountIfUnderLimit(taskId: string, maxRuns: number): Promise<number | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }
    if (task.runCount >= maxRuns) {
      return undefined;
    }
    task.runCount = task.runCount + 1;
    task.updatedAt = Date.now();
    return task.runCount;
  }

  async shutdown(): Promise<void> {
    this.tasks.clear();
  }
}

/**
 * Redis-backed task store for production persistence.
 * Tasks survive process restarts. Uses the existing Redis config pattern.
 */
export class RedisTaskStore implements TaskStore {
  private keyPrefix: string;
  private redisClient: RedisLikeClient | null = null;
  private config: RedisTaskStoreConfig;

  constructor(config: RedisTaskStoreConfig) {
    this.config = config;
    this.keyPrefix = config.keyPrefix || "neurolink:cron:";
  }

  private async getClient(): Promise<RedisLikeClient> {
    if (this.redisClient) {
      return this.redisClient;
    }

    // Dynamic import to avoid requiring redis as a dependency
    const { createClient } = await import("redis");

    const url =
      this.config.url ||
      `redis://${this.config.host || "localhost"}:${this.config.port || 6379}`;

    this.redisClient = createClient({
      url,
      password: this.config.password,
    }) as unknown as RedisLikeClient;

    await this.redisClient.connect();
    return this.redisClient;
  }

  private taskKey(taskId: string): string {
    return `${this.keyPrefix}task:${taskId}`;
  }

  private indexKey(): string {
    return `${this.keyPrefix}task-index`;
  }

  async save(task: ScheduledTask): Promise<void> {
    const client = await this.getClient();
    const key = this.taskKey(task.id);
    await client.set(key, JSON.stringify(task));
    await client.sAdd(this.indexKey(), task.id);
  }

  async get(taskId: string): Promise<ScheduledTask | undefined> {
    const client = await this.getClient();
    const data = await client.get(this.taskKey(taskId));
    return data ? (JSON.parse(data) as ScheduledTask) : undefined;
  }

  async list(filter?: TaskFilter): Promise<ScheduledTask[]> {
    const client = await this.getClient();
    const ids = await client.sMembers(this.indexKey());
    const tasks: ScheduledTask[] = [];

    for (const id of ids) {
      const data = await client.get(this.taskKey(id));
      if (data) {
        const task = JSON.parse(data) as ScheduledTask;
        if (filter?.status && task.status !== filter.status) {
          continue;
        }
        if (filter?.sessionMode && task.sessionMode !== filter.sessionMode) {
          continue;
        }
        tasks.push(task);
      }
    }

    if (filter?.limit) {
      return tasks.slice(0, filter.limit);
    }
    return tasks;
  }

  async delete(taskId: string): Promise<boolean> {
    const client = await this.getClient();
    const deleted = await client.del(this.taskKey(taskId));
    await client.sRem(this.indexKey(), taskId);
    return deleted > 0;
  }

  async updateStatus(taskId: string, status: TaskStatus): Promise<void> {
    const task = await this.get(taskId);
    if (task) {
      task.status = status;
      task.updatedAt = Date.now();
      await this.save(task);
    }
  }

  async addRunResult(taskId: string, run: TaskRunResult): Promise<void> {
    const task = await this.get(taskId);
    if (task) {
      task.runs.unshift(run);
      if (task.runs.length > task.maxRunHistory) {
        task.runs = task.runs.slice(0, task.maxRunHistory);
      }
      task.updatedAt = Date.now();
      await this.save(task);
    }
  }

  async incrementRunCountIfUnderLimit(taskId: string, maxRuns: number): Promise<number | undefined> {
    // For Redis, this is a read-modify-write. In a multi-process environment,
    // consider using Redis WATCH/MULTI for true atomicity.
    const task = await this.get(taskId);
    if (!task) {
      return undefined;
    }
    if (task.runCount >= maxRuns) {
      return undefined;
    }
    task.runCount = task.runCount + 1;
    task.updatedAt = Date.now();
    await this.save(task);
    return task.runCount;
  }

  async shutdown(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}

/**
 * Minimal Redis client interface to avoid tight coupling to any specific Redis library
 */
interface RedisLikeClient {
  connect(): Promise<void>;
  quit(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  del(key: string): Promise<number>;
  sAdd(key: string, member: string): Promise<number>;
  sRem(key: string, member: string): Promise<number>;
  sMembers(key: string): Promise<string[]>;
}

/**
 * Redis task store configuration
 */
type RedisTaskStoreConfig = {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  keyPrefix?: string;
};
