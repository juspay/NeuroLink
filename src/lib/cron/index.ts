/**
 * NeuroLink Cron/Scheduling System
 *
 * Provides scheduled task execution for AI prompts with support for:
 * - Three schedule types: one-shot ("at"), interval ("every"), cron expressions ("cron")
 * - Two session modes: isolated (fresh context) and same-session (shared context)
 * - Pluggable scheduler backends (Node.js timeout default, extensible for RabbitMQ, webhooks)
 * - Pluggable persistence (in-memory default, optional Redis)
 * - AI-callable tools for task management (create, list, cancel, status)
 */

// Core manager
export { CronManager } from "./cronManager.js";

// Scheduler backends
export { NodeTimeoutScheduler, parseInterval } from "./schedulerBackend.js";

// Task stores
export { InMemoryTaskStore, RedisTaskStore } from "./taskStore.js";

// Tool factory
export { createCronTools } from "./cronTools.js";

// Types
export type {
  CronManagerConfig,
  CreateTaskOptions,
  ScheduledTask,
  Schedule,
  ScheduleType,
  SchedulerBackend,
  SessionMode,
  TaskExecutor,
  TaskFilter,
  TaskRunResult,
  TaskStatus,
  TaskStore,
  RunStatus,
} from "./types.js";
