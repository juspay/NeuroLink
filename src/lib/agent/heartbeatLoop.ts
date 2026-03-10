/**
 * HeartbeatLoop — autonomous long-running agent loop.
 *
 * Key design decisions (from docs/design/heartbeat-loop-design.md):
 * - Trigger/execution separation: trigger decides WHEN, loop decides WHAT
 * - One generate() per iteration (not one token)
 * - Checkpointing is conversation-ID based
 * - Purely additive — no changes to existing NeuroLink APIs
 *
 * Fixes over the design doc:
 * 1. GenerateResult.content (not .text) is the correct field
 * 2. conversationId is passed via context.conversationId, not a top-level field
 * 3. shouldContinue() checks all termination conditions
 * 4. heartbeatTimer emits on neurolink's EventEmitter
 * 5. LoopResult is properly built and returned from run()
 * 6. extractIterationSummary uses a real generate() call
 */

import type { NeuroLink } from "../neurolink.js";
import type { GenerateOptions, GenerateResult } from "../types/generateTypes.js";
import type { CheckpointStore } from "./checkpoints/checkpointStore.js";
import { InMemoryCheckpointStore } from "./checkpoints/memoryCheckpoint.js";
import { CostTracker } from "./costTracker.js";
import { LLMGoalEvaluator } from "./goalEvaluator.js";
import type {
  ContextMode,
  GoalEvaluator,
  HeartbeatLoopConfig,
  IterationResult,
  LoopResult,
  LoopSnapshot,
  SerializableLoopConfig,
  TriggerConfig,
} from "./loopTypes.js";
import type { TriggerAdapter } from "./triggers/triggerAdapter.js";
import { TimerTrigger } from "./triggers/timerTrigger.js";
import { TriggerRegistry } from "./triggers/triggerRegistry.js";

const DEFAULT_MAX_ITERATIONS = 1000;
const DEFAULT_MAX_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours
const DEFAULT_MAX_CONSECUTIVE_ERRORS = 3;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000; // 30s
const DEFAULT_CHECKPOINT_INTERVAL_MS = 60_000; // 60s
const DEFAULT_MAX_STEPS_PER_ITERATION = 20;

function generateLoopId(): string {
  return `hb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export class HeartbeatLoop {
  private readonly _neurolink: NeuroLink;
  private readonly _config: HeartbeatLoopConfig;
  private _state: LoopSnapshot;
  private readonly _trigger: TriggerAdapter;
  private readonly _costTracker: CostTracker;
  private readonly _goalEvaluator: GoalEvaluator | null;
  private readonly _checkpointStore: CheckpointStore;

  private _heartbeatTimer?: ReturnType<typeof setInterval>;
  private _lastCheckpointAt = 0;

  constructor(neurolink: NeuroLink, config: HeartbeatLoopConfig) {
    this._neurolink = neurolink;
    this._config = config;
    this._trigger = this._resolveTrigger(config.trigger);
    this._costTracker = new CostTracker(config);
    this._goalEvaluator =
      config.goalEvaluator === null
        ? null
        : (config.goalEvaluator ?? new LLMGoalEvaluator(neurolink));
    this._checkpointStore =
      config.checkpointStore ?? new InMemoryCheckpointStore();
    this._state = this._initializeState(config);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async run(): Promise<LoopResult> {
    this._state.status = "running";
    this._startHeartbeatTimer();

    try {
      await this._trigger.start(() => this._executeIteration());
    } catch (error) {
      if (this._state.status === "running") {
        this._state.status = "failed";
        this._state.errorLog.push({
          iteration: this._state.iteration,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      this._stopHeartbeatTimer();
      await this._trigger.stop();
      await this._checkpoint(); // Final checkpoint
    }

    return this._buildResult();
  }

  /** Resume from a saved checkpoint */
  static async resume(
    neurolink: NeuroLink,
    loopId: string,
    store: CheckpointStore,
    overrides?: Partial<HeartbeatLoopConfig>,
  ): Promise<LoopResult> {
    const snapshot = await store.load(loopId);
    if (!snapshot) {
      throw new Error(`No checkpoint found for loop "${loopId}"`);
    }

    // Reconstruct config from serialized snapshot config + overrides
    const restoredConfig: HeartbeatLoopConfig = {
      ...snapshot.config,
      ...overrides,
      checkpointStore: store,
    };

    const loop = new HeartbeatLoop(neurolink, restoredConfig);
    // Restore state (status -> running)
    loop._state = { ...snapshot, status: "running" };
    return loop.run();
  }

  /** Pause the loop (trigger stops, state checkpointed) */
  async pause(): Promise<LoopSnapshot> {
    this._state.status = "paused";
    await this._trigger.stop();
    await this._checkpoint();
    this._neurolink.getEventEmitter().emit("heartbeat:paused" as never, this._state as never);
    return { ...this._state };
  }

  /** Cancel the loop permanently */
  async cancel(): Promise<LoopSnapshot> {
    this._state.status = "cancelled";
    await this._trigger.stop();
    await this._checkpoint();
    this._neurolink.getEventEmitter().emit("heartbeat:cancelled" as never, this._state as never);
    return { ...this._state };
  }

  /** Get current snapshot without stopping */
  getSnapshot(): Readonly<LoopSnapshot> {
    return {
      ...this._state,
      elapsedMs: Date.now() - new Date(this._state.startedAt).getTime(),
    };
  }

  // ─── Core iteration logic ────────────────────────────────────────────────────

  private async _executeIteration(): Promise<void> {
    // 0. Should we continue?
    if (!this._shouldContinue()) {
      await this._trigger.stop();
      return;
    }

    this._state.iteration++;
    this._state.lastIterationAt = new Date().toISOString();

    try {
      // 1. Check budgets
      this._costTracker.assertWithinBudget(this._state);

      // 2. Build iteration prompt
      const prompt = this._buildIterationPrompt();

      // 3. Build generate() options
      const generateOptions: GenerateOptions = {
        ...this._config.stepOptions,
        input: { text: prompt },
        maxSteps: this._config.maxStepsPerIteration ?? DEFAULT_MAX_STEPS_PER_ITERATION,
      };

      // FIX: conversationId is passed via context, not as a top-level field
      if (
        this._state.contextMode === "continuation" &&
        this._state.conversationId
      ) {
        generateOptions.context = {
          ...(generateOptions.context ?? {}),
          conversationId: this._state.conversationId,
          sessionId: this._state.conversationId,
        };
      }

      // Propagate abort signal
      if (this._config.abortSignal) {
        generateOptions.abortSignal = this._config.abortSignal;
      }

      // 4. Execute generate()
      const result: GenerateResult = await this._neurolink.generate(generateOptions);

      // 5. Track costs (FIX: use result.analytics?.cost for USD cost)
      this._costTracker.recordUsage(result.usage, result.analytics?.cost);
      this._state.totalTokensUsed = this._costTracker.totalTokens;
      this._state.totalCostUsd = this._costTracker.totalCostUsd;

      // 6. Evaluate goal
      if (this._goalEvaluator) {
        const evaluation = await this._goalEvaluator.evaluate(
          this._state.goalText,
          result,
          this._state,
        );

        this._state.goalProgress = evaluation.progressSummary;
        this._state.goalConfidence = evaluation.confidence;

        if (evaluation.isComplete) {
          this._state.status = "completed";
          this._state.lastAssistantMessage = result.content ?? "";
          this._neurolink.getEventEmitter().emit("heartbeat:complete" as never, this._buildResult() as never);
          await this._trigger.stop();
          return;
        }
      }

      // FIX: GenerateResult uses .content not .text
      this._state.lastAssistantMessage = result.content ?? "";
      this._state.consecutiveErrors = 0;

      // 7. Isolated mode: extract carry-forward summary
      if (this._state.contextMode === "isolated") {
        this._state.iterationSummary = await this._extractIterationSummary(result);
      }

      // 8. Maybe checkpoint
      await this._maybeCheckpoint();

      // 9. Emit iteration event
      const iterationResult: IterationResult = {
        iteration: this._state.iteration,
        result,
        snapshot: { ...this._state },
      };
      this._neurolink.getEventEmitter().emit("heartbeat:iteration" as never, iterationResult as never);

      // 10. User callback
      await this._config.onIterationComplete?.(iterationResult);
    } catch (error) {
      this._state.consecutiveErrors++;
      this._state.errorLog.push({
        iteration: this._state.iteration,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      this._neurolink.getEventEmitter().emit("heartbeat:error" as never, error as never, { ...this._state } as never);

      const maxErrors =
        this._config.maxConsecutiveErrors ?? DEFAULT_MAX_CONSECUTIVE_ERRORS;
      if (this._state.consecutiveErrors >= maxErrors) {
        this._state.status = "paused";
        this._neurolink.getEventEmitter().emit(
          "heartbeat:escalate" as never,
          "max consecutive errors reached" as never,
          { ...this._state } as never,
        );
        await this._checkpoint();
        await this._trigger.stop();
      }
    }
  }

  // ─── Prompt building ────────────────────────────────────────────────────────

  private _buildIterationPrompt(): string {
    const budgetInfo = this._costTracker.getBudgetSummary(this._state);

    if (this._state.contextMode === "isolated") {
      return [
        `## Goal\n${this._state.goalText}`,
        this._state.iterationSummary
          ? `## Previous Progress\n${this._state.iterationSummary}`
          : null,
        `## Iteration ${this._state.iteration}`,
        `## Budget Remaining\n${budgetInfo}`,
        `Continue working toward the goal. When complete, clearly state "GOAL_COMPLETE".`,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    // Continuation mode: conversation history provides context
    return [
      this._state.iteration === 1
        ? `## Goal\n${this._state.goalText}\n\nWork toward this goal step by step. Use available tools as needed. When the goal is complete, clearly state "GOAL_COMPLETE".`
        : `Continue working toward the goal.`,
      this._state.goalProgress
        ? `Progress so far: ${this._state.goalProgress}`
        : null,
      `Budget remaining: ${budgetInfo}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  // ─── Lifecycle helpers ─────────────────────────────────────────────────────

  private _shouldContinue(): boolean {
    if (this._state.status !== "running") return false;

    // Abort signal
    if (this._config.abortSignal?.aborted) {
      this._state.status = "cancelled";
      return false;
    }

    // Max iterations
    const maxIter = this._config.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    if (this._state.iteration >= maxIter) {
      this._state.status = "completed";
      return false;
    }

    // Wall-clock timeout
    const maxDuration = this._config.maxDurationMs ?? DEFAULT_MAX_DURATION_MS;
    const elapsed = Date.now() - new Date(this._state.startedAt).getTime();
    if (elapsed >= maxDuration) {
      this._state.status = "completed";
      return false;
    }

    // Cost budget
    if (
      this._config.maxTotalCostUsd &&
      this._costTracker.totalCostUsd >= this._config.maxTotalCostUsd
    ) {
      this._state.status = "completed";
      return false;
    }

    // Token budget
    if (
      this._config.maxTotalTokens &&
      this._costTracker.totalTokens >= this._config.maxTotalTokens
    ) {
      this._state.status = "completed";
      return false;
    }

    return true;
  }

  private _startHeartbeatTimer(): void {
    const intervalMs =
      this._config.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
    this._heartbeatTimer = setInterval(() => {
      const snapshot = this.getSnapshot();
      this._config.onHeartbeat?.(snapshot);
      this._neurolink.getEventEmitter().emit("heartbeat:tick" as never, snapshot as never);
    }, intervalMs);
  }

  private _stopHeartbeatTimer(): void {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = undefined;
    }
  }

  private async _maybeCheckpoint(): Promise<void> {
    const intervalMs =
      this._config.checkpointIntervalMs ?? DEFAULT_CHECKPOINT_INTERVAL_MS;
    const now = Date.now();
    if (now - this._lastCheckpointAt >= intervalMs) {
      await this._checkpoint();
    }
  }

  private async _checkpoint(): Promise<void> {
    const now = new Date().toISOString();
    this._state.lastCheckpointAt = now;
    this._state.elapsedMs =
      Date.now() - new Date(this._state.startedAt).getTime();
    this._lastCheckpointAt = Date.now();

    try {
      await this._checkpointStore.save({ ...this._state });
      this._neurolink.getEventEmitter().emit("heartbeat:checkpoint" as never, { ...this._state } as never);
    } catch {
      // Non-fatal: checkpoint failure should not stop the loop
    }
  }

  /**
   * Extract a carry-forward summary for isolated context mode.
   * FIX: Design doc left this as a stub — now uses a real (cheap) generate() call.
   */
  private async _extractIterationSummary(
    result: GenerateResult,
  ): Promise<string> {
    try {
      const summaryResult = await this._neurolink.generate({
        input: {
          text: [
            `Summarize the following AI response in 2-3 sentences for carry-forward context:`,
            `---`,
            (result.content ?? "").substring(0, 3000),
          ].join("\n"),
        },
        provider: "openai",
        model: "gpt-4o-mini",
        maxTokens: 200,
        disableTools: true,
      });
      return summaryResult.content ?? "";
    } catch {
      // Fallback: use first 500 chars of the response
      return (result.content ?? "").substring(0, 500);
    }
  }

  // ─── Initialization helpers ────────────────────────────────────────────────

  private _resolveTrigger(
    trigger?: TriggerAdapter | TriggerConfig,
  ): TriggerAdapter {
    if (!trigger) return new TimerTrigger({ intervalMs: 0 });
    // Duck-type check: TriggerAdapter has start() method
    if (typeof (trigger as TriggerAdapter).start === "function") {
      return trigger as TriggerAdapter;
    }
    const cfg = trigger as TriggerConfig;
    return TriggerRegistry.create(cfg.type, cfg);
  }

  private _initializeState(config: HeartbeatLoopConfig): LoopSnapshot {
    const now = new Date().toISOString();
    const contextMode: ContextMode = config.contextMode ?? { type: "continuation" };

    // Build serializable config for checkpoint resume
    const serializableConfig: SerializableLoopConfig = {
      goal: config.goal,
      contextMode: config.contextMode,
      maxIterations: config.maxIterations,
      maxDurationMs: config.maxDurationMs,
      maxTotalTokens: config.maxTotalTokens,
      maxTotalCostUsd: config.maxTotalCostUsd,
      maxStepsPerIteration: config.maxStepsPerIteration,
      maxConsecutiveErrors: config.maxConsecutiveErrors,
      heartbeatIntervalMs: config.heartbeatIntervalMs,
      checkpointIntervalMs: config.checkpointIntervalMs,
      hitl: config.hitl,
      stepOptions: config.stepOptions,
      // Only serialize TriggerConfig (not TriggerAdapter instances)
      trigger:
        config.trigger && typeof (config.trigger as TriggerAdapter).start !== "function"
          ? (config.trigger as TriggerConfig)
          : undefined,
    };

    return {
      loopId: generateLoopId(),
      goalText: config.goal,
      status: "running",
      triggerType: this._trigger.type,
      contextMode: contextMode.type,
      conversationId:
        contextMode.type === "continuation"
          ? (contextMode as { type: "continuation"; conversationId?: string }).conversationId
          : undefined,
      iteration: 0,
      totalTokensUsed: 0,
      totalCostUsd: 0,
      elapsedMs: 0,
      startedAt: now,
      lastCheckpointAt: now,
      lastIterationAt: now,
      lastAssistantMessage: "",
      consecutiveErrors: 0,
      errorLog: [],
      config: serializableConfig,
    };
  }

  private _buildResult(): LoopResult {
    return {
      loopId: this._state.loopId,
      status: this._state.status,
      iterations: this._state.iteration,
      totalTokensUsed: this._state.totalTokensUsed,
      totalCostUsd: this._state.totalCostUsd,
      elapsedMs: Date.now() - new Date(this._state.startedAt).getTime(),
      goalProgress: this._state.goalProgress,
      goalConfidence: this._state.goalConfidence,
      lastAssistantMessage: this._state.lastAssistantMessage,
      errorLog: [...this._state.errorLog],
    };
  }
}
