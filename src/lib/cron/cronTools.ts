/**
 * Cron Tool Definitions for NeuroLink
 *
 * Four AI-callable tools for scheduled task management:
 * - createScheduledTask: Create a new scheduled task
 * - listScheduledTasks: List tasks with optional filtering
 * - cancelScheduledTask: Cancel a scheduled task
 * - getScheduledTaskStatus: Get detailed status of a task
 *
 * These tools follow the same pattern as directTools.ts (Vercel AI SDK tool()).
 * They require a CronManager reference injected at registration time.
 */

import { tool } from "ai";
import { z } from "zod";
import type { CronManager } from "./cronManager.js";
import type { SessionMode, TaskFilter } from "./types.js";

/**
 * Create cron tools bound to a specific CronManager instance.
 * This factory pattern allows tools to reference the manager without global state.
 */
export function createCronTools(getCronManager: () => CronManager | undefined) {
  return {
    createScheduledTask: tool({
      description:
        "Create a new scheduled task that will execute an AI prompt at specified times. " +
        'Supports three schedule types: "at" (one-shot at specific time), "every" (recurring interval), ' +
        'and "cron" (cron expression). Tasks can run in "isolated" mode (fresh context each run) ' +
        'or "same-session" mode (shared conversation context).',
      parameters: z.object({
        scheduleType: z
          .enum(["at", "every", "cron"])
          .describe(
            'Schedule type: "at" for one-shot, "every" for interval, "cron" for cron expression',
          ),
        scheduleValue: z
          .string()
          .describe(
            'Schedule value: ISO 8601 timestamp for "at" (e.g., "2024-12-25T09:00:00Z"), ' +
            'interval for "every" (e.g., "30s", "5m", "1h", or milliseconds), ' +
            'cron expression for "cron" (e.g., "*/5 * * * *" for every 5 minutes, "0 9 * * *" for daily at 9am)',
          ),
        prompt: z
          .string()
          .describe("The AI prompt to execute at each scheduled run"),
        sessionMode: z
          .enum(["isolated", "same-session"])
          .optional()
          .default("isolated")
          .describe(
            '"isolated" = fresh session each run (no history), "same-session" = shared conversation context',
          ),
        taskName: z
          .string()
          .optional()
          .describe("Human-readable name for the task"),
        provider: z
          .string()
          .optional()
          .describe(
            'AI provider override (e.g., "openai", "anthropic", "google")',
          ),
        model: z
          .string()
          .optional()
          .describe('Model override (e.g., "gpt-4o", "claude-sonnet-4-20250514")'),
        maxRuns: z
          .number()
          .optional()
          .describe(
            "Maximum number of executions (omit for unlimited recurring tasks)",
          ),
        timezone: z
          .string()
          .optional()
          .describe(
            'IANA timezone for cron expressions (e.g., "America/New_York", "Asia/Kolkata")',
          ),
      }),
      execute: async ({
        scheduleType,
        scheduleValue,
        prompt,
        sessionMode,
        taskName,
        provider,
        model,
        maxRuns,
        timezone,
      }) => {
        const manager = getCronManager();
        if (!manager) {
          return {
            success: false,
            error:
              "Cron system is not initialized. Ensure NEUROLINK_DISABLE_CRON_TOOLS is not set to true.",
          };
        }

        try {
          // Parse scheduleValue for "every" type - could be number string
          let value: string | number = scheduleValue;
          if (scheduleType === "every") {
            const num = Number(scheduleValue);
            if (!isNaN(num)) {
              value = num;
            }
          }

          const task = await manager.createTask({
            schedule: {
              type: scheduleType,
              value,
              timezone,
            },
            prompt,
            sessionMode: sessionMode as SessionMode,
            name: taskName,
            provider,
            model,
            maxRuns,
          });

          return {
            success: true,
            taskId: task.id,
            name: task.name,
            scheduleType: task.schedule.type,
            scheduleValue: String(task.schedule.value),
            sessionMode: task.sessionMode,
            status: task.status,
            nextRunAt: task.nextRunAt
              ? new Date(task.nextRunAt).toISOString()
              : "immediate",
            message: `Scheduled task "${task.name}" created successfully. Task ID: ${task.id}`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),

    listScheduledTasks: tool({
      description:
        "List all scheduled tasks with optional filtering by status. " +
        "Shows task details including schedule, status, run count, and next execution time.",
      parameters: z.object({
        status: z
          .enum(["active", "paused", "completed", "failed", "cancelled"])
          .optional()
          .describe("Filter tasks by status"),
        limit: z
          .number()
          .optional()
          .default(20)
          .describe("Maximum number of tasks to return (default: 20)"),
      }),
      execute: async ({ status, limit }) => {
        const manager = getCronManager();
        if (!manager) {
          return {
            success: false,
            error: "Cron system is not initialized.",
          };
        }

        try {
          const filter: TaskFilter = { limit };
          if (status) {
            filter.status = status;
          }

          const tasks = await manager.listTasks(filter);

          return {
            success: true,
            count: tasks.length,
            tasks: tasks.map((t) => ({
              taskId: t.id,
              name: t.name,
              scheduleType: t.schedule.type,
              scheduleValue: String(t.schedule.value),
              sessionMode: t.sessionMode,
              status: t.status,
              runCount: t.runCount,
              maxRuns: t.maxRuns,
              nextRunAt: t.nextRunAt
                ? new Date(t.nextRunAt).toISOString()
                : undefined,
              createdAt: new Date(t.createdAt).toISOString(),
              lastRunStatus:
                t.runs.length > 0 ? t.runs[0].status : undefined,
              lastRunAt:
                t.runs.length > 0
                  ? new Date(t.runs[0].startedAt).toISOString()
                  : undefined,
            })),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),

    cancelScheduledTask: tool({
      description:
        "Cancel a scheduled task by its task ID. The task will stop executing and be marked as cancelled.",
      parameters: z.object({
        taskId: z
          .string()
          .describe("The task ID to cancel (returned from createScheduledTask)"),
      }),
      execute: async ({ taskId }) => {
        const manager = getCronManager();
        if (!manager) {
          return {
            success: false,
            error: "Cron system is not initialized.",
          };
        }

        try {
          const cancelled = await manager.cancelTask(taskId);
          if (cancelled) {
            return {
              success: true,
              taskId,
              message: `Task ${taskId} has been cancelled successfully.`,
            };
          } else {
            return {
              success: false,
              error: `Task ${taskId} not found.`,
            };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),

    getScheduledTaskStatus: tool({
      description:
        "Get detailed status of a scheduled task including run history, next execution time, " +
        "and execution results. Use this to monitor task health and review past runs.",
      parameters: z.object({
        taskId: z
          .string()
          .describe("The task ID to get status for"),
        includeRuns: z
          .boolean()
          .optional()
          .default(true)
          .describe("Include run history in response (default: true)"),
        maxRuns: z
          .number()
          .optional()
          .default(5)
          .describe("Maximum number of recent runs to include (default: 5)"),
      }),
      execute: async ({ taskId, includeRuns, maxRuns }) => {
        const manager = getCronManager();
        if (!manager) {
          return {
            success: false,
            error: "Cron system is not initialized.",
          };
        }

        try {
          const task = await manager.getTask(taskId);
          if (!task) {
            return {
              success: false,
              error: `Task ${taskId} not found.`,
            };
          }

          const result: Record<string, unknown> = {
            success: true,
            taskId: task.id,
            name: task.name,
            status: task.status,
            scheduleType: task.schedule.type,
            scheduleValue: String(task.schedule.value),
            timezone: task.schedule.timezone,
            sessionMode: task.sessionMode,
            provider: task.provider,
            model: task.model,
            runCount: task.runCount,
            maxRuns: task.maxRuns,
            nextRunAt: task.nextRunAt
              ? new Date(task.nextRunAt).toISOString()
              : undefined,
            createdAt: new Date(task.createdAt).toISOString(),
            updatedAt: new Date(task.updatedAt).toISOString(),
          };

          if (includeRuns) {
            result.recentRuns = task.runs.slice(0, maxRuns).map((r) => ({
              runId: r.runId,
              runNumber: r.runNumber,
              status: r.status,
              startedAt: new Date(r.startedAt).toISOString(),
              completedAt: r.completedAt
                ? new Date(r.completedAt).toISOString()
                : undefined,
              durationMs: r.durationMs,
              responsePreview: r.responseText
                ? r.responseText.substring(0, 200) +
                  (r.responseText.length > 200 ? "..." : "")
                : undefined,
              error: r.error,
              tokenUsage: r.tokenUsage,
            }));
          }

          return result;
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),
  };
}
