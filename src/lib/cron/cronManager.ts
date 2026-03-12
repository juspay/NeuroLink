/**
 * CronManager - Core orchestrator for NeuroLink scheduled tasks
 *
 * Manages task lifecycle: creation, scheduling, execution, and cleanup.
 * Executes tasks by calling a TaskExecutor (typically neurolink.generate()).
 * Supports isolated and same-session execution modes.
 */

import { randomBytes } from "crypto";
import pLimit from "p-limit";
import { logger } from "../utils/logger.js";
import { NodeTimeoutScheduler } from "./schedulerBackend.js";
import { InMemoryTaskStore, RedisTaskStore } from "./taskStore.js";
import type {
  CreateTaskOptions,
  CronManagerConfig,
  ScheduledTask,
  SchedulerBackend,
  TaskExecutor,
  TaskFilter,
  TaskRunResult,
  TaskStore,
} from "./types.js";

/**
 * CronManager orchestrates all scheduled task operations.
 *
 * Lifecycle:
 * 1. User/AI creates a task via createTask()
 * 2. Task is persisted in the TaskStore
 * 3. Task is registered with the SchedulerBackend
 * 4. When triggered, the TaskExecutor runs the prompt via generate()
 * 5. Results are stored in the task's run history
 */
export class CronManager {
  private store: TaskStore;
  private scheduler: SchedulerBackend;
  private executor: TaskExecutor | null = null;
  private concurrencyLimit: ReturnType<typeof pLimit>;
  private config: Required<
    Pick<CronManagerConfig, "enabled" | "maxConcurrentRuns" | "maxRunHistory">
  > &
    CronManagerConfig;
  private isShutdown = false;

  constructor(config?: CronManagerConfig) {
    this.config = {
      enabled: config?.enabled ?? true,
      maxConcurrentRuns: config?.maxConcurrentRuns ?? 3,
      maxRunHistory: config?.maxRunHistory ?? 50,
      ...config,
    };

    this.concurrencyLimit = pLimit(this.config.maxConcurrentRuns);

    // Initialize store
    if (this.config.store === "redis" && this.config.redisConfig) {
      this.store = new RedisTaskStore(this.config.redisConfig);
    } else {
      this.store = new InMemoryTaskStore();
    }

    // Initialize scheduler (Node.js timeout by default)
    this.scheduler = new NodeTimeoutScheduler();

    logger.debug("[CronManager] Initialized", {
      enabled: this.config.enabled,
      store: this.config.store || "memory",
      maxConcurrent: this.config.maxConcurrentRuns,
    });
  }

  /**
   * Set the task executor function.
   * This is called by NeuroLink after construction to wire up generate().
   */
  setExecutor(executor: TaskExecutor): void {
    this.executor = executor;
  }

  /**
   * Create and schedule a new task.
   */
  async createTask(options: CreateTaskOptions): Promise<ScheduledTask> {
    if (!this.config.enabled) {
      throw new Error("Cron system is disabled");
    }
    if (this.isShutdown) {
      throw new Error("CronManager is shut down");
    }

    const task: ScheduledTask = {
      id: generateTaskId(),
      name: options.name || `task-${Date.now()}`,
      schedule: options.schedule,
      prompt: options.prompt,
      sessionMode: options.sessionMode || "isolated",
      provider: options.provider,
      model: options.model,
      maxRuns: options.maxRuns,
      status: "active",
      creatorSessionId: options.creatorSessionId,
      runCount: 0,
      runs: [],
      maxRunHistory: this.config.maxRunHistory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Compute next run time
    task.nextRunAt = this.scheduler.getNextRunTime(task);

    // Persist
    await this.store.save(task);

    // Schedule
    this.scheduler.schedule(task, () => this.executeTask(task.id));

    logger.info("[CronManager] Task created", {
      taskId: task.id,
      name: task.name,
      scheduleType: task.schedule.type,
      sessionMode: task.sessionMode,
      nextRunAt: task.nextRunAt
        ? new Date(task.nextRunAt).toISOString()
        : "immediate",
    });

    return task;
  }

  /**
   * Cancel a scheduled task.
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = await this.store.get(taskId);
    if (!task) {
      return false;
    }

    this.scheduler.cancel(taskId);
    await this.store.updateStatus(taskId, "cancelled");

    logger.info("[CronManager] Task cancelled", { taskId, name: task.name });
    return true;
  }

  /**
   * Get a task by ID.
   */
  async getTask(taskId: string): Promise<ScheduledTask | undefined> {
    const task = await this.store.get(taskId);
    if (task) {
      // Refresh next run time
      task.nextRunAt = this.scheduler.getNextRunTime(task);
    }
    return task;
  }

  /**
   * List tasks with optional filtering.
   */
  async listTasks(filter?: TaskFilter): Promise<ScheduledTask[]> {
    const tasks = await this.store.list(filter);
    // Refresh next run times
    for (const task of tasks) {
      if (task.status === "active") {
        task.nextRunAt = this.scheduler.getNextRunTime(task);
      }
    }
    return tasks;
  }

  /**
   * Gracefully shutdown the cron manager.
   */
  async shutdown(): Promise<void> {
    this.isShutdown = true;
    this.scheduler.shutdown();
    await this.store.shutdown();
    logger.debug("[CronManager] Shutdown complete");
  }

  // --- Private execution logic ---

  private async executeTask(taskId: string): Promise<void> {
    await this.concurrencyLimit(async () => {
      const task = await this.store.get(taskId);
      if (!task || task.status !== "active") {
        return;
      }

      if (!this.executor) {
        logger.warn("[CronManager] No executor set, skipping task", { taskId });
        return;
      }

      // Atomic check-and-increment for maxRuns to prevent race conditions
      // where concurrent executions both pass the limit check.
      if (task.maxRuns !== undefined) {
        const newRunCount = await this.store.incrementRunCountIfUnderLimit(taskId, task.maxRuns);
        if (newRunCount === undefined) {
          this.scheduler.cancel(taskId);
          await this.store.updateStatus(taskId, "completed");
          logger.info("[CronManager] Task completed (maxRuns reached)", {
            taskId,
            runCount: task.runCount,
            maxRuns: task.maxRuns,
          });
          return;
        }
      }

      const runNumber = task.runCount + 1;
      const sessionId =
        task.sessionMode === "isolated"
          ? `cron:${taskId}:${runNumber}`
          : task.creatorSessionId || `cron:${taskId}`;

      const run: TaskRunResult = {
        runId: `${taskId}-run-${runNumber}`,
        runNumber,
        startedAt: Date.now(),
        status: "running",
        sessionId,
      };

      logger.info("[CronManager] Executing task", {
        taskId,
        name: task.name,
        runNumber,
        sessionMode: task.sessionMode,
        sessionId,
      });

      try {
        const result = await this.executor(task, sessionId);

        run.status = "completed";
        run.completedAt = Date.now();
        run.durationMs = run.completedAt - run.startedAt;
        run.responseText = result.responseText;
        run.tokenUsage = result.tokenUsage;

        logger.info("[CronManager] Task run completed", {
          taskId,
          runNumber,
          durationMs: run.durationMs,
        });
      } catch (error) {
        run.status = "failed";
        run.completedAt = Date.now();
        run.durationMs = run.completedAt - run.startedAt;
        run.error = error instanceof Error ? error.message : String(error);

        logger.error("[CronManager] Task run failed", {
          taskId,
          runNumber,
          error: run.error,
        });
      }

      // Store run result
      await this.store.addRunResult(taskId, run);

      // Update next run time
      const updatedTask = await this.store.get(taskId);
      if (updatedTask) {
        updatedTask.nextRunAt = this.scheduler.getNextRunTime(updatedTask);
        await this.store.save(updatedTask);
      }

      // For "at" (one-shot) tasks, mark as completed after execution
      if (task.schedule.type === "at") {
        await this.store.updateStatus(taskId, "completed");
      }

      // Check if maxRuns reached after this run (using fresh data from store)
      if (task.maxRuns !== undefined && updatedTask) {
        if (updatedTask.runCount >= task.maxRuns) {
          this.scheduler.cancel(taskId);
          await this.store.updateStatus(taskId, "completed");
        }
      }
    });
  }
}

/**
 * Generate a cryptographically secure unique task ID.
 * Uses crypto.randomBytes() instead of Math.random() for security.
 */
function generateTaskId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(6).toString("hex");
  return `cron_${timestamp}_${random}`;
}
