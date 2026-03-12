/**
 * NeuroLink Cron/Scheduling System - Type Definitions
 *
 * Defines types for scheduled task management including task definitions,
 * scheduler backends, persistence stores, and configuration.
 */

/**
 * Schedule type - how a task is triggered
 * - "at": One-shot execution at a specific time (ISO 8601)
 * - "every": Fixed-interval repetition (milliseconds)
 * - "cron": Standard cron expression (5 or 6 field)
 */
export type ScheduleType = "at" | "every" | "cron";

/**
 * Session mode - how task execution relates to conversation context
 * - "isolated": Fresh session per execution, no conversation history
 * - "same-session": Uses the creating session's conversation context
 */
export type SessionMode = "isolated" | "same-session";

/**
 * Task lifecycle status
 */
export type TaskStatus =
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Individual run status
 */
export type RunStatus = "running" | "completed" | "failed";

/**
 * Schedule definition
 */
export type Schedule = {
  /** Schedule type */
  type: ScheduleType;
  /**
   * Schedule value:
   * - For "at": ISO 8601 timestamp string (e.g., "2024-12-25T09:00:00Z")
   * - For "every": interval in milliseconds (e.g., 60000 for 1 minute)
   * - For "cron": cron expression (e.g., "0 9 * * *" for daily at 9am)
   */
  value: string | number;
  /** IANA timezone for cron expressions (e.g., "America/New_York") */
  timezone?: string;
};

/**
 * Result of a single task execution
 */
export type TaskRunResult = {
  /** Unique run identifier */
  runId: string;
  /** Run number (1-based) */
  runNumber: number;
  /** Start time (Unix ms) */
  startedAt: number;
  /** End time (Unix ms) */
  completedAt?: number;
  /** Duration in ms */
  durationMs?: number;
  /** Run status */
  status: RunStatus;
  /** AI-generated response text */
  responseText?: string;
  /** Token usage for the run */
  tokenUsage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  /** Error message if failed */
  error?: string;
  /** Session ID used for this run */
  sessionId: string;
};

/**
 * Full scheduled task definition
 */
export type ScheduledTask = {
  /** Unique task identifier */
  id: string;
  /** Human-readable task name */
  name: string;
  /** Schedule configuration */
  schedule: Schedule;
  /** Prompt to send to the AI provider */
  prompt: string;
  /** Session execution mode */
  sessionMode: SessionMode;
  /** AI provider override (e.g., "openai", "anthropic") */
  provider?: string;
  /** Model override (e.g., "gpt-4o", "claude-sonnet-4-20250514") */
  model?: string;
  /** Maximum number of runs (undefined = unlimited for recurring) */
  maxRuns?: number;
  /** Current task status */
  status: TaskStatus;
  /** Session ID of the creator (used for same-session mode) */
  creatorSessionId?: string;
  /** Total number of completed runs */
  runCount: number;
  /** Run history (most recent first) */
  runs: TaskRunResult[];
  /** Maximum run history to keep */
  maxRunHistory: number;
  /** Next scheduled execution time (Unix ms) */
  nextRunAt?: number;
  /** Task creation time (Unix ms) */
  createdAt: number;
  /** Last update time (Unix ms) */
  updatedAt: number;
};

/**
 * Options for creating a new scheduled task
 */
export type CreateTaskOptions = {
  /** Schedule configuration */
  schedule: Schedule;
  /** Prompt to send to the AI provider */
  prompt: string;
  /** Session execution mode (default: "isolated") */
  sessionMode?: SessionMode;
  /** Human-readable task name */
  name?: string;
  /** AI provider override */
  provider?: string;
  /** Model override */
  model?: string;
  /** Maximum number of runs */
  maxRuns?: number;
  /** Session ID of the creator */
  creatorSessionId?: string;
};

/**
 * Filter options for listing tasks
 */
export type TaskFilter = {
  /** Filter by status */
  status?: TaskStatus;
  /** Filter by session mode */
  sessionMode?: SessionMode;
  /** Maximum number of results */
  limit?: number;
};

/**
 * Interface for scheduler backends (timer management)
 * Implementations: NodeTimeoutScheduler (default), future: RabbitMQ, webhook
 */
export interface SchedulerBackend {
  /** Schedule a task for execution */
  schedule(task: ScheduledTask, callback: () => Promise<void>): void;
  /** Cancel a scheduled task */
  cancel(taskId: string): void;
  /** Cancel all scheduled tasks */
  cancelAll(): void;
  /** Get next run time for a task (Unix ms) */
  getNextRunTime(task: ScheduledTask): number | undefined;
  /** Shutdown the scheduler backend */
  shutdown(): void;
}

/**
 * Interface for task persistence stores
 * Implementations: InMemoryTaskStore (default), RedisTaskStore (optional)
 */
export interface TaskStore {
  /** Save or update a task */
  save(task: ScheduledTask): Promise<void>;
  /** Get a task by ID */
  get(taskId: string): Promise<ScheduledTask | undefined>;
  /** List tasks with optional filter */
  list(filter?: TaskFilter): Promise<ScheduledTask[]>;
  /** Delete a task */
  delete(taskId: string): Promise<boolean>;
  /** Update task status */
  updateStatus(taskId: string, status: TaskStatus): Promise<void>;
  /** Add a run result to a task */
  addRunResult(taskId: string, run: TaskRunResult): Promise<void>;
  /**
   * Atomically check if runCount < maxRuns and increment runCount.
   * Returns the new runCount if successful, or undefined if the limit was already reached.
   * This prevents race conditions where concurrent executions both pass the maxRuns check.
   */
  incrementRunCountIfUnderLimit(taskId: string, maxRuns: number): Promise<number | undefined>;
  /** Shutdown the store */
  shutdown(): Promise<void>;
}

/**
 * Cron manager configuration
 */
export type CronManagerConfig = {
  /** Enable/disable the cron system (default: true) */
  enabled?: boolean;
  /** Maximum concurrent task executions (default: 3) */
  maxConcurrentRuns?: number;
  /** Store backend: "memory" or "redis" (default: "memory") */
  store?: "memory" | "redis";
  /** Redis configuration (required if store is "redis") */
  redisConfig?: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    keyPrefix?: string;
  };
  /** Maximum run history per task (default: 50) */
  maxRunHistory?: number;
  /** Default provider for task execution */
  defaultProvider?: string;
  /** Default model for task execution */
  defaultModel?: string;
};

/**
 * Task execution callback - called by CronManager to execute a task
 * This is the function that calls neurolink.generate() with the task's prompt
 */
export type TaskExecutor = (
  task: ScheduledTask,
  sessionId: string,
) => Promise<{
  responseText?: string;
  tokenUsage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}>;
