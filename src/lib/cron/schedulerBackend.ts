/**
 * Scheduler Backends for NeuroLink Cron System
 *
 * Provides the timer management layer. The default NodeTimeoutScheduler
 * uses native Node.js setTimeout/setInterval. The interface is designed
 * to be extended with RabbitMQ, webhook, or other backends in the future.
 */

import { Cron } from "croner";
import type { ScheduledTask, SchedulerBackend } from "./types.js";

/**
 * Node.js native timeout/interval-based scheduler.
 *
 * - "at": setTimeout to fire at a specific timestamp
 * - "every": setInterval with fixed interval
 * - "cron": croner library for cron expression parsing + setTimeout chain
 */
export class NodeTimeoutScheduler implements SchedulerBackend {
  /** Active timer handles keyed by task ID */
  private timers: Map<string, NodeJS.Timeout> = new Map();
  /** Active croner instances keyed by task ID */
  private cronJobs: Map<string, Cron> = new Map();

  schedule(task: ScheduledTask, callback: () => Promise<void>): void {
    // Cancel any existing timer for this task
    this.cancel(task.id);

    switch (task.schedule.type) {
      case "at":
        this.scheduleAt(task, callback);
        break;
      case "every":
        this.scheduleEvery(task, callback);
        break;
      case "cron":
        this.scheduleCron(task, callback);
        break;
    }
  }

  cancel(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      clearInterval(timer);
      this.timers.delete(taskId);
    }

    const cronJob = this.cronJobs.get(taskId);
    if (cronJob) {
      cronJob.stop();
      this.cronJobs.delete(taskId);
    }
  }

  cancelAll(): void {
    this.timers.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.timers.clear();

    this.cronJobs.forEach((cronJob) => {
      cronJob.stop();
    });
    this.cronJobs.clear();
  }

  getNextRunTime(task: ScheduledTask): number | undefined {
    switch (task.schedule.type) {
      case "at": {
        const targetTime =
          typeof task.schedule.value === "string"
            ? new Date(task.schedule.value).getTime()
            : task.schedule.value;
        return targetTime > Date.now() ? targetTime : undefined;
      }
      case "every": {
        const intervalMs =
          typeof task.schedule.value === "number"
            ? task.schedule.value
            : parseInterval(task.schedule.value);
        return Date.now() + intervalMs;
      }
      case "cron": {
        const cronJob = this.cronJobs.get(task.id);
        if (cronJob) {
          const next = cronJob.nextRun();
          return next ? next.getTime() : undefined;
        }
        // Compute without an active job
        const tempCron = new Cron(String(task.schedule.value), {
          timezone: task.schedule.timezone,
          paused: true,
        });
        const next = tempCron.nextRun();
        tempCron.stop();
        return next ? next.getTime() : undefined;
      }
      default:
        return undefined;
    }
  }

  shutdown(): void {
    this.cancelAll();
  }

  // --- Private scheduling methods ---

  private scheduleAt(
    task: ScheduledTask,
    callback: () => Promise<void>,
  ): void {
    const targetTime =
      typeof task.schedule.value === "string"
        ? new Date(task.schedule.value).getTime()
        : task.schedule.value;

    const delayMs = targetTime - Date.now();
    if (delayMs <= 0) {
      // Already past - execute immediately
      void callback();
      return;
    }

    const timer = setTimeout(() => {
      this.timers.delete(task.id);
      void callback();
    }, delayMs);

    // Prevent the timer from keeping the process alive
    if (timer.unref) {
      timer.unref();
    }
    this.timers.set(task.id, timer);
  }

  private scheduleEvery(
    task: ScheduledTask,
    callback: () => Promise<void>,
  ): void {
    const intervalMs =
      typeof task.schedule.value === "number"
        ? task.schedule.value
        : parseInterval(String(task.schedule.value));

    if (intervalMs <= 0) {
      throw new Error(`Invalid interval: ${task.schedule.value}`);
    }

    const timer = setInterval(() => {
      void callback();
    }, intervalMs);

    if (timer.unref) {
      timer.unref();
    }
    this.timers.set(task.id, timer);
  }

  private scheduleCron(
    task: ScheduledTask,
    callback: () => Promise<void>,
  ): void {
    const cronExpression = String(task.schedule.value);

    const job = new Cron(cronExpression, {
      timezone: task.schedule.timezone,
      protect: true, // Prevent overlapping runs
    }, () => {
      void callback();
    });

    this.cronJobs.set(task.id, job);
  }
}

/**
 * Parse a human-readable interval string to milliseconds.
 * Supports: "30s", "5m", "1h", "1d", or raw milliseconds as string.
 */
export function parseInterval(value: string): number {
  const trimmed = value.trim().toLowerCase();

  // Raw number = milliseconds
  const rawNum = Number(trimmed);
  if (!isNaN(rawNum) && rawNum > 0) {
    return rawNum;
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)$/);
  if (!match) {
    throw new Error(
      `Invalid interval format: "${value}". Use "30s", "5m", "1h", "1d", or milliseconds.`,
    );
  }

  const num = parseFloat(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return num;
    case "s":
      return num * 1000;
    case "m":
      return num * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    case "d":
      return num * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}
