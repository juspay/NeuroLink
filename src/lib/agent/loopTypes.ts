/**
 * Heartbeat Loop Type Definitions
 *
 * All types for the autonomous long-running agent loop system.
 * @see docs/design/heartbeat-loop-design.md
 */

import type { GenerateOptions, GenerateResult } from "../types/generateTypes.js";

// ─── Context Modes ─────────────────────────────────────────────────────────

export type ContextMode =
  | { type: "continuation"; conversationId?: string }
  | { type: "isolated"; summaryFromCheckpoint?: boolean };

// ─── Trigger Config (shorthand for TriggerAdapter resolution) ───────────────

export type TriggerConfig =
  | { type: "timer"; intervalMs?: number; initialDelayMs?: number }
  | { type: "rabbitmq"; connectionUrl: string; queue: string; prefetch?: number }
  | { type: "cron"; schedule: string; timezone?: string }
  | { type: "webhook"; port: number; path?: string; secret?: string }
  | { type: "process-watcher"; target: number | string; event: string; pollIntervalMs?: number }
  | { type: string; [key: string]: unknown };

// ─── Goal Evaluation ────────────────────────────────────────────────────────

export type GoalEvaluation = {
  isComplete: boolean;
  confidence: number; // 0–1
  progressSummary: string;
};

export interface GoalEvaluator {
  evaluate(
    goal: string,
    lastResult: GenerateResult,
    state: LoopSnapshot,
  ): Promise<GoalEvaluation>;
}

// ─── Iteration Result ────────────────────────────────────────────────────────

export type IterationResult = {
  iteration: number;
  result: GenerateResult;
  snapshot: LoopSnapshot;
};

// ─── Loop Snapshot (checkpoint state) ───────────────────────────────────────

export type LoopSnapshot = {
  loopId: string;
  goalText: string;
  status: "running" | "paused" | "completed" | "failed" | "cancelled";

  // Trigger info
  triggerType: string;

  // Context mode
  contextMode: ContextMode["type"];

  // Progress
  iteration: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  elapsedMs: number;
  startedAt: string; // ISO 8601
  lastCheckpointAt: string;
  lastIterationAt: string;

  // Conversation state (continuation mode)
  conversationId?: string;

  // Isolated mode state
  iterationSummary?: string;

  // Last output
  lastAssistantMessage: string;

  // Error tracking
  consecutiveErrors: number;
  errorLog: Array<{ iteration: number; error: string; timestamp: string }>;

  // Goal progress
  goalProgress?: string;
  goalConfidence?: number;

  // Serialized config (for resume) — excludes non-serializable fields
  config: SerializableLoopConfig;
};

/** Serializable subset of HeartbeatLoopConfig stored in checkpoints */
export type SerializableLoopConfig = {
  goal: string;
  contextMode?: ContextMode;
  maxIterations?: number;
  maxDurationMs?: number;
  maxTotalTokens?: number;
  maxTotalCostUsd?: number;
  maxStepsPerIteration?: number;
  maxConsecutiveErrors?: number;
  heartbeatIntervalMs?: number;
  checkpointIntervalMs?: number;
  trigger?: TriggerConfig;
  stepOptions?: Partial<GenerateOptions>;
  hitl?: HeartbeatLoopConfig["hitl"];
};

// ─── Loop Result ─────────────────────────────────────────────────────────────

export type LoopResult = {
  loopId: string;
  status: LoopSnapshot["status"];
  iterations: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  elapsedMs: number;
  goalProgress?: string;
  goalConfidence?: number;
  lastAssistantMessage: string;
  errorLog: LoopSnapshot["errorLog"];
};

// ─── Main Config ─────────────────────────────────────────────────────────────

export type HeartbeatLoopConfig = {
  // ─── WHAT TO DO ───────────────────────────────────────

  /** Natural language goal — the "north star" for every iteration */
  goal: string;

  /** Custom stop condition. Default: LLM-based goal evaluator. null = skip evaluation */
  goalEvaluator?: GoalEvaluator | null;

  /** Context mode: continuation (default) or isolated (future) */
  contextMode?: ContextMode;

  /** Base options for each generate() call */
  stepOptions?: Partial<GenerateOptions>;

  /** Tool steps within each generate() call (default: 20) */
  maxStepsPerIteration?: number;

  // ─── WHEN TO DO ───────────────────────────────────────

  /** Trigger mechanism. Default: TimerTrigger with intervalMs: 0 (back-to-back) */
  trigger?: import("./triggers/triggerAdapter.js").TriggerAdapter | TriggerConfig;

  // ─── BUDGETS & BOUNDS ─────────────────────────────────

  maxIterations?: number;    // Hard cap (default: 1000)
  maxDurationMs?: number;    // Wall-clock timeout (default: 4 hours)
  maxTotalTokens?: number;   // Total token budget across all steps
  maxTotalCostUsd?: number;  // Dollar cost cap

  // ─── HEARTBEAT & OBSERVABILITY ────────────────────────

  heartbeatIntervalMs?: number;  // Event emission interval (default: 30s)
  onHeartbeat?: (state: LoopSnapshot) => void;
  onIterationComplete?: (result: IterationResult) => void | Promise<void>;

  // ─── RESILIENCE ───────────────────────────────────────

  checkpointStore?: import("./checkpoints/checkpointStore.js").CheckpointStore;
  checkpointIntervalMs?: number;    // How often to checkpoint (default: 60s)
  maxConsecutiveErrors?: number;    // Errors before pause (default: 3)

  // ─── HUMAN ESCALATION ─────────────────────────────────

  hitl?: {
    enabled: boolean;
    escalateAfterErrors?: number;
    escalateOnUncertainty?: boolean;
    approvalRequired?: string[];
  };

  // ─── CONTROL ──────────────────────────────────────────

  abortSignal?: AbortSignal;
};
