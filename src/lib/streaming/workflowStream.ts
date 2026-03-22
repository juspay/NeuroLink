/**
 * Workflow Stream
 *
 * Provides streaming support for workflow execution with step-by-step
 * progress tracking, variable management, and conditional branching.
 * Uses StreamResult-compatible patterns instead of custom event types.
 *
 * @module streaming/workflowStream
 */

import { nanoid } from "nanoid";
import type { JsonValue, UnknownRecord } from "../types/common.js";
import type { TokenUsage } from "../types/analytics.js";
import type { StreamResult } from "../types/streamTypes.js";
import { logger } from "../utils/logger.js";

// ============================================
// WORKFLOW TYPES
// ============================================

/**
 * Workflow step definition
 */
export type WorkflowStep = {
  /** Unique step ID */
  id: string;
  /** Step name */
  name: string;
  /** Step type */
  type:
    | "ai"
    | "tool"
    | "condition"
    | "transform"
    | "parallel"
    | "loop"
    | "wait";
  /** AI generation config (for type: "ai") */
  aiConfig?: {
    provider: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
  };
  /** Tool execution config (for type: "tool") */
  toolConfig?: {
    toolName: string;
    parameters: UnknownRecord;
  };
  /** Condition config (for type: "condition") */
  conditionConfig?: {
    expression: string;
    ifTrue: string; // Step ID
    ifFalse: string; // Step ID
  };
  /** Transform config (for type: "transform") */
  transformConfig?: {
    expression: string;
    outputVariable: string;
  };
  /** Parallel config (for type: "parallel") */
  parallelConfig?: {
    steps: string[]; // Step IDs to run in parallel
    waitForAll: boolean;
  };
  /** Loop config (for type: "loop") */
  loopConfig?: {
    steps: string[]; // Steps to loop
    maxIterations: number;
    breakCondition: string;
  };
  /** Wait config (for type: "wait") */
  waitConfig?: {
    durationMs?: number;
    waitForVariable?: string;
  };
  /** Next step ID (for linear flow) */
  nextStep?: string;
  /** Error handler step ID */
  onError?: string;
  /** Timeout in ms */
  timeoutMs?: number;
  /** Retry configuration */
  retry?: {
    maxRetries: number;
    delayMs: number;
  };
};

/**
 * Workflow definition
 */
export type WorkflowDefinition = {
  /** Workflow ID */
  id: string;
  /** Workflow name */
  name: string;
  /** Description */
  description?: string;
  /** Entry point step ID */
  entryPoint: string;
  /** All steps */
  steps: WorkflowStep[];
  /** Initial variables */
  initialVariables?: UnknownRecord;
  /** Global timeout in ms */
  timeoutMs?: number;
  /** On completion callback step ID */
  onComplete?: string;
  /** On error callback step ID */
  onError?: string;
};

/**
 * Workflow execution context
 */
export type WorkflowContext = {
  /** Workflow run ID */
  runId: string;
  /** Current variables */
  variables: UnknownRecord;
  /** Step history */
  stepHistory: StepResult[];
  /** Current step index */
  currentStepIndex: number;
  /** Start time */
  startTime: number;
  /** Is paused */
  isPaused: boolean;
  /** Is cancelled */
  isCancelled: boolean;
};

/**
 * Step execution result
 */
export type StepResult = {
  /** Step ID */
  stepId: string;
  /** Step name */
  stepName: string;
  /** Step type */
  stepType: WorkflowStep["type"];
  /** Status */
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  /** Start time */
  startTime: number;
  /** End time */
  endTime?: number;
  /** Duration in ms */
  duration?: number;
  /** Output value */
  output?: JsonValue;
  /** Error if failed */
  error?: string;
  /** Token usage (for AI steps) */
  usage?: TokenUsage;
  /** Retry count */
  retryCount: number;
};

/**
 * Workflow configuration
 */
export type WorkflowStreamConfig = {
  /** Enable step streaming */
  streamSteps?: boolean;
  /** Emit variable updates */
  emitVariableUpdates?: boolean;
  /** Include step output in events */
  includeStepOutput?: boolean;
  /** Maximum parallel steps */
  maxParallelSteps?: number;
  /** Global timeout in ms */
  timeoutMs?: number;
};

/**
 * Default workflow configuration
 */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowStreamConfig = {
  streamSteps: true,
  emitVariableUpdates: true,
  includeStepOutput: true,
  maxParallelSteps: 5,
  timeoutMs: 300000, // 5 minutes
};

// ============================================
// WORKFLOW STREAM EVENTS
// ============================================

/**
 * Workflow-specific stream events
 */
export type WorkflowStreamEvent =
  | WorkflowStartEvent
  | WorkflowStepStartEvent
  | WorkflowStepDeltaEvent
  | WorkflowStepEndEvent
  | WorkflowVariableEvent
  | WorkflowBranchEvent
  | WorkflowLoopEvent
  | WorkflowEndEvent
  | WorkflowErrorEvent;

/**
 * Workflow start event
 */
export type WorkflowStartEvent = {
  type: "workflow:start";
  seq: number;
  timestamp: number;
  workflowId: string;
  workflowName: string;
  runId: string;
  totalSteps: number;
};

/**
 * Workflow step start event
 */
export type WorkflowStepStartEvent = {
  type: "workflow:step:start";
  seq: number;
  timestamp: number;
  stepId: string;
  stepName: string;
  stepType: WorkflowStep["type"];
  stepIndex: number;
  totalSteps: number;
};

/**
 * Workflow step delta event (for AI streaming)
 */
export type WorkflowStepDeltaEvent = {
  type: "workflow:step:delta";
  seq: number;
  timestamp: number;
  stepId: string;
  delta: string;
};

/**
 * Workflow step end event
 */
export type WorkflowStepEndEvent = {
  type: "workflow:step:end";
  seq: number;
  timestamp: number;
  stepId: string;
  stepName: string;
  status: StepResult["status"];
  duration: number;
  output?: JsonValue;
  usage?: TokenUsage;
  error?: string;
};

/**
 * Workflow variable update event
 */
export type WorkflowVariableEvent = {
  type: "workflow:variable";
  seq: number;
  timestamp: number;
  variableName: string;
  oldValue?: JsonValue;
  newValue: JsonValue;
};

/**
 * Workflow branch event (condition evaluated)
 */
export type WorkflowBranchEvent = {
  type: "workflow:branch";
  seq: number;
  timestamp: number;
  stepId: string;
  condition: string;
  result: boolean;
  nextStep: string;
};

/**
 * Workflow loop event
 */
export type WorkflowLoopEvent = {
  type: "workflow:loop";
  seq: number;
  timestamp: number;
  stepId: string;
  iteration: number;
  maxIterations: number;
  continuing: boolean;
};

/**
 * Workflow end event
 */
export type WorkflowEndEvent = {
  type: "workflow:end";
  seq: number;
  timestamp: number;
  workflowId: string;
  runId: string;
  status: "completed" | "failed" | "cancelled" | "timeout";
  totalDuration: number;
  stepsExecuted: number;
  totalUsage?: TokenUsage;
  finalOutput?: JsonValue;
};

/**
 * Workflow error event
 */
export type WorkflowErrorEvent = {
  type: "workflow:error";
  seq: number;
  timestamp: number;
  stepId?: string;
  error: string;
  recoverable: boolean;
};

// ============================================
// SAFE EXPRESSION EVALUATOR
// ============================================

/**
 * Supported comparison operators for safe expression evaluation
 */
type ComparisonOperator = "===" | "==" | "!==" | "!=" | ">" | "<" | ">=" | "<=";

const COMPARISON_OPERATORS: ComparisonOperator[] = [
  "===",
  "!==",
  "==",
  "!=",
  ">=",
  "<=",
  ">",
  "<",
];

/**
 * Safely resolve a property path against a variables object.
 * Supports simple identifiers ("x") and dotted paths ("a.b.c").
 * Returns undefined for unresolvable paths.
 */
function resolveValue(
  token: string,
  variables: UnknownRecord,
): JsonValue | undefined {
  // Boolean literals
  if (token === "true") {
    return true;
  }
  if (token === "false") {
    return false;
  }
  if (token === "null") {
    return null;
  }
  if (token === "undefined") {
    return undefined;
  }

  // Numeric literal
  if (/^-?\d+(\.\d+)?$/.test(token)) {
    return Number(token);
  }

  // String literal (single or double quoted)
  const stringMatch = token.match(/^(['"])(.*)\1$/);
  if (stringMatch) {
    return stringMatch[2];
  }

  // Variable reference (simple identifier or dotted path)
  const parts = token.split(".");
  let current: unknown = variables;
  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current as JsonValue;
}

/**
 * Compare two values using the given operator.
 */
function compareValues(
  left: JsonValue | undefined,
  operator: ComparisonOperator,
  right: JsonValue | undefined,
): boolean {
  switch (operator) {
    case "===":
    case "==":
      return left === right;
    case "!==":
    case "!=":
      return left !== right;
    case ">":
      return (left as number) > (right as number);
    case "<":
      return (left as number) < (right as number);
    case ">=":
      return (left as number) >= (right as number);
    case "<=":
      return (left as number) <= (right as number);
    default:
      return false;
  }
}

/**
 * Safe expression evaluator that supports only:
 * - Simple property access (variable names, dotted paths)
 * - Comparisons: ===, ==, !==, !=, >, <, >=, <=
 * - Literal values: numbers, booleans, null, quoted strings
 *
 * This replaces `new Function()` to prevent arbitrary code execution.
 */
function safeEvaluateExpression(
  expression: string,
  variables: UnknownRecord,
): JsonValue {
  const trimmed = expression.trim();

  // Try to find a comparison operator
  for (const op of COMPARISON_OPERATORS) {
    const idx = trimmed.indexOf(op);
    if (idx !== -1) {
      const left = trimmed.slice(0, idx).trim();
      const right = trimmed.slice(idx + op.length).trim();
      if (left.length > 0 && right.length > 0) {
        const leftVal = resolveValue(left, variables);
        const rightVal = resolveValue(right, variables);
        return compareValues(leftVal, op, rightVal);
      }
    }
  }

  // No operator found: resolve as a single value (truthy check)
  const resolved = resolveValue(trimmed, variables);
  return resolved !== undefined ? resolved : false;
}

// ============================================
// AI STEP EXECUTOR TYPE
// ============================================

/**
 * AI step executor that returns a StreamResult
 */
export type AIStepExecutor = (prompt: string) => Promise<StreamResult>;

// ============================================
// WORKFLOW STREAM
// ============================================

/**
 * MastraWorkflowStream - Streaming for workflow execution
 *
 * Yields `{ content: string }` chunks compatible with StreamResult.
 * AI steps use an AIStepExecutor that returns StreamResult.
 *
 * @example Basic workflow execution
 * ```typescript
 * const workflow = new MastraWorkflowStream(workflowDefinition, {
 *   streamSteps: true,
 * });
 *
 * const result = workflow.execute(initialVariables, executors);
 * for await (const chunk of result.stream) {
 *   if ("content" in chunk) {
 *     process.stdout.write(chunk.content);
 *   }
 * }
 * ```
 */
export class MastraWorkflowStream {
  private readonly definition: WorkflowDefinition;
  private readonly config: WorkflowStreamConfig;
  private context: WorkflowContext | null = null;
  private seqCounter: number = 0;
  private stepsMap: Map<string, WorkflowStep>;

  constructor(
    definition: WorkflowDefinition,
    config: Partial<WorkflowStreamConfig> = {},
  ) {
    this.definition = definition;
    this.config = { ...DEFAULT_WORKFLOW_CONFIG, ...config };
    this.stepsMap = new Map(definition.steps.map((s) => [s.id, s]));
  }

  /**
   * Execute the workflow and return a StreamResult
   */
  execute(
    initialVariables: UnknownRecord = {},
    executors: WorkflowExecutors,
  ): StreamResult {
    const self = this;

    // Initialize context
    this.context = {
      runId: nanoid(),
      variables: { ...this.definition.initialVariables, ...initialVariables },
      stepHistory: [],
      currentStepIndex: 0,
      startTime: Date.now(),
      isPaused: false,
      isCancelled: false,
    };

    const usagePromise = new Promise<TokenUsage>((resolve) => {
      // This will be resolved after the stream completes
      self._resolveUsage = resolve;
    });

    const stream = self.generateStream(executors);

    return {
      stream,
      provider: "workflow",
      model: `workflow:${this.definition.name}`,
      usage: usagePromise,
      metadata: {
        streamId: this.context.runId,
        startTime: this.context.startTime,
      },
    };
  }

  /** @internal usage resolver, set during execute() */
  private _resolveUsage: ((usage: TokenUsage) => void) | null = null;

  /**
   * Internal generator that yields { content: string } chunks
   */
  private async *generateStream(
    executors: WorkflowExecutors,
  ): AsyncGenerator<{ content: string }> {
    yield { content: `[Workflow:start] ${this.definition.name}\n` };

    try {
      yield* this.executeStep(this.definition.entryPoint, executors);
      yield {
        content: `[Workflow:end] ${this.definition.name} completed\n`,
      };
    } catch (error) {
      logger.error("Workflow execution failed", { error });
      const msg = error instanceof Error ? error.message : String(error);
      yield { content: `[Workflow:error] ${msg}\n` };
      throw error;
    } finally {
      // Resolve usage promise
      const totalUsage = this.calculateTotalUsage();
      if (this._resolveUsage) {
        this._resolveUsage(totalUsage);
      }
    }
  }

  /**
   * Pause workflow execution
   */
  pause(): void {
    if (this.context) {
      this.context.isPaused = true;
    }
  }

  /**
   * Resume workflow execution
   */
  resume(): void {
    if (this.context) {
      this.context.isPaused = false;
    }
  }

  /**
   * Cancel workflow execution
   */
  cancel(): void {
    if (this.context) {
      this.context.isCancelled = true;
    }
  }

  /**
   * Get current context
   */
  getContext(): WorkflowContext | null {
    return this.context;
  }

  /**
   * Get variable value
   */
  getVariable(name: string): JsonValue | undefined {
    return this.context?.variables[name] as JsonValue | undefined;
  }

  /**
   * Set variable value
   */
  setVariable(name: string, value: JsonValue): void {
    if (this.context) {
      this.context.variables[name] = value;
    }
  }

  // ============================================
  // STEP EXECUTION
  // ============================================

  /**
   * Execute a single step, yielding { content: string } chunks
   */
  private async *executeStep(
    stepId: string,
    executors: WorkflowExecutors,
  ): AsyncGenerator<{ content: string }> {
    const step = this.stepsMap.get(stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    // Check for cancellation or pause
    if (this.context?.isCancelled) {
      return;
    }

    while (this.context?.isPaused) {
      await this.sleep(100);
    }

    // Emit step start as content
    if (this.context) {
      this.context.currentStepIndex++;
    }
    yield {
      content: `[Step:start] ${step.name} (${step.type})\n`,
    };

    const startTime = Date.now();
    const result: StepResult = {
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      status: "running",
      startTime,
      retryCount: 0,
    };

    try {
      // Execute based on step type
      switch (step.type) {
        case "ai":
          yield* this.executeAIStep(step, executors, result);
          break;

        case "tool":
          yield* this.executeToolStep(step, executors, result);
          break;

        case "condition":
          yield* this.executeConditionStep(step, executors, result);
          break;

        case "transform":
          yield* this.executeTransformStep(step, result);
          break;

        case "parallel":
          yield* this.executeParallelStep(step, executors, result);
          break;

        case "loop":
          yield* this.executeLoopStep(step, executors, result);
          break;

        case "wait":
          yield* this.executeWaitStep(step, result);
          break;
      }

      result.status = "completed";
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;
    } catch (error) {
      result.status = "failed";
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;
      result.error = error instanceof Error ? error.message : String(error);

      // Handle error
      if (step.onError) {
        yield* this.executeStep(step.onError, executors);
      } else {
        throw error;
      }
    }

    // Store result
    this.context?.stepHistory.push(result);

    // Emit step end as content
    yield {
      content: `[Step:end] ${step.name} (${result.status}, ${result.duration ?? 0}ms)\n`,
    };

    // Execute next step
    if (result.status === "completed" && step.nextStep) {
      yield* this.executeStep(step.nextStep, executors);
    }
  }

  /**
   * Execute AI generation step
   */
  private async *executeAIStep(
    step: WorkflowStep,
    executors: WorkflowExecutors,
    result: StepResult,
  ): AsyncGenerator<{ content: string }> {
    if (!step.aiConfig || !executors.ai) {
      throw new Error("AI config or executor not provided");
    }

    const { prompt } = step.aiConfig;

    // Interpolate variables in prompt
    const interpolatedPrompt = this.interpolateVariables(prompt);

    // Execute AI generation - returns StreamResult
    const streamResult = await executors.ai(interpolatedPrompt);

    let accumulatedText = "";

    // Consume the stream and yield content chunks
    for await (const chunk of streamResult.stream) {
      if ("content" in chunk) {
        accumulatedText += chunk.content;

        if (this.config.streamSteps) {
          yield { content: chunk.content };
        }
      }
    }

    // Get final values
    result.output = accumulatedText;

    // Resolve usage if available
    if (streamResult.usage) {
      try {
        const usage = await Promise.resolve(streamResult.usage);
        result.usage = usage;
      } catch {
        // Usage resolution failed, continue without it
      }
    }

    // Store output in variables
    const outputVar = `${step.id}_output`;
    this.updateVariable(outputVar, accumulatedText);
  }

  /**
   * Execute tool step
   */
  private async *executeToolStep(
    step: WorkflowStep,
    executors: WorkflowExecutors,
    result: StepResult,
  ): AsyncGenerator<{ content: string }> {
    if (!step.toolConfig || !executors.tool) {
      throw new Error("Tool config or executor not provided");
    }

    const { toolName, parameters } = step.toolConfig;

    // Interpolate parameters
    const interpolatedParams = this.interpolateVariablesInObject(parameters);

    // Execute tool
    const toolResult = await executors.tool(toolName, interpolatedParams);

    result.output = toolResult;

    // Store output in variables
    const outputVar = `${step.id}_output`;
    this.updateVariable(outputVar, toolResult);

    yield {
      content: `[Tool:result] ${toolName}: ${JSON.stringify(toolResult)}\n`,
    };
  }

  /**
   * Execute condition step
   */
  private async *executeConditionStep(
    step: WorkflowStep,
    executors: WorkflowExecutors,
    result: StepResult,
  ): AsyncGenerator<{ content: string }> {
    if (!step.conditionConfig) {
      throw new Error("Condition config not provided");
    }

    const { expression, ifTrue, ifFalse } = step.conditionConfig;

    // Evaluate condition safely
    const conditionResult = this.evaluateExpression(expression);
    const boolResult = Boolean(conditionResult);
    const nextStep = boolResult ? ifTrue : ifFalse;

    result.output = conditionResult;

    yield {
      content: `[Condition] ${expression} => ${boolResult}, next: ${nextStep}\n`,
    };

    // Execute next step
    yield* this.executeStep(nextStep, executors);

    // Clear nextStep to prevent double execution
    step.nextStep = undefined;
  }

  /**
   * Execute transform step
   */
  private async *executeTransformStep(
    step: WorkflowStep,
    result: StepResult,
  ): AsyncGenerator<{ content: string }> {
    if (!step.transformConfig) {
      throw new Error("Transform config not provided");
    }

    const { expression, outputVariable } = step.transformConfig;

    // Evaluate transform expression safely
    const transformResult = this.evaluateExpression(expression);

    result.output = transformResult;

    // Store in output variable
    this.updateVariable(outputVariable, transformResult);

    yield {
      content: `[Transform] ${outputVariable} = ${JSON.stringify(transformResult)}\n`,
    };
  }

  /**
   * Execute parallel step
   */
  private async *executeParallelStep(
    step: WorkflowStep,
    executors: WorkflowExecutors,
    result: StepResult,
  ): AsyncGenerator<{ content: string }> {
    if (!step.parallelConfig) {
      throw new Error("Parallel config not provided");
    }

    const { steps: stepIds, waitForAll } = step.parallelConfig;

    // Execute steps in parallel
    const generators: Array<AsyncGenerator<{ content: string }>> = [];

    for (const stepId of stepIds.slice(0, this.config.maxParallelSteps)) {
      generators.push(this.executeStep(stepId, executors));
    }

    // Collect all events
    if (waitForAll) {
      for (const gen of generators) {
        for await (const chunk of gen) {
          yield chunk;
        }
      }
    } else {
      // Race - yield events as they come
      const iterators = generators.map((g) => ({ gen: g, done: false }));

      while (iterators.some((it) => !it.done)) {
        for (const it of iterators) {
          if (it.done) {
            continue;
          }

          const next = await it.gen.next();
          if (next.done) {
            it.done = true;
            continue;
          }

          yield next.value;
        }
      }
    }

    result.output = stepIds;
  }

  /**
   * Execute loop step
   */
  private async *executeLoopStep(
    step: WorkflowStep,
    executors: WorkflowExecutors,
    result: StepResult,
  ): AsyncGenerator<{ content: string }> {
    if (!step.loopConfig) {
      throw new Error("Loop config not provided");
    }

    const { steps: stepIds, maxIterations, breakCondition } = step.loopConfig;

    for (let i = 0; i < maxIterations; i++) {
      // Check break condition
      if (breakCondition && this.evaluateExpression(breakCondition)) {
        yield {
          content: `[Loop] ${step.name} iteration ${i} - break condition met\n`,
        };
        break;
      }

      yield {
        content: `[Loop] ${step.name} iteration ${i}/${maxIterations}\n`,
      };

      // Execute loop steps
      for (const stepId of stepIds) {
        yield* this.executeStep(stepId, executors);
      }
    }

    result.output = { iterations: maxIterations };
  }

  /**
   * Execute wait step
   */
  private async *executeWaitStep(
    step: WorkflowStep,
    result: StepResult,
  ): AsyncGenerator<{ content: string }> {
    if (!step.waitConfig) {
      throw new Error("Wait config not provided");
    }

    const { durationMs, waitForVariable } = step.waitConfig;

    if (durationMs) {
      await this.sleep(durationMs);
    }

    if (waitForVariable) {
      // Poll for variable
      while (!this.context?.variables[waitForVariable]) {
        await this.sleep(100);
        if (this.context?.isCancelled) {
          break;
        }
      }
    }

    result.output = { waited: durationMs ?? 0 };

    yield {
      content: `[Wait] ${durationMs ?? 0}ms\n`,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  interpolateVariables(template: string): string {
    if (!this.context) {
      return template;
    }

    return template.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
      const value = this.context?.variables[varName];
      return value !== undefined ? String(value) : `{{${varName}}}`;
    });
  }

  private interpolateVariablesInObject(obj: UnknownRecord): UnknownRecord {
    const result: UnknownRecord = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        result[key] = this.interpolateVariables(value);
      } else if (typeof value === "object" && value !== null) {
        result[key] = this.interpolateVariablesInObject(value as UnknownRecord);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  evaluateExpression(expression: string): JsonValue {
    // Interpolate template variables first
    const interpolated = this.interpolateVariables(expression);
    const variables = this.context?.variables ?? {};

    try {
      return safeEvaluateExpression(interpolated, variables);
    } catch (error) {
      logger.warn("Expression evaluation failed", { expression, error });
      return false;
    }
  }

  private updateVariable(name: string, value: JsonValue): void {
    if (!this.context) {
      return;
    }

    this.context.variables[name] = value;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateTotalUsage(): TokenUsage {
    let input = 0;
    let output = 0;

    for (const step of this.context?.stepHistory ?? []) {
      if (step.usage) {
        input += step.usage.input;
        output += step.usage.output;
      }
    }

    return { input, output, total: input + output };
  }
}

// ============================================
// EXECUTOR TYPES
// ============================================

/**
 * Workflow executors for different step types
 */
export type WorkflowExecutors = {
  /** AI generation executor - takes a prompt and returns a StreamResult */
  ai?: AIStepExecutor;

  /** Tool execution executor */
  tool?: (toolName: string, parameters: UnknownRecord) => Promise<JsonValue>;
};

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create a workflow stream
 */
export function createWorkflowStream(
  definition: WorkflowDefinition,
  config?: Partial<WorkflowStreamConfig>,
): MastraWorkflowStream {
  return new MastraWorkflowStream(definition, config);
}

/**
 * Type guard for workflow stream events
 */
export function isWorkflowStreamEvent(
  event: unknown,
): event is WorkflowStreamEvent {
  if (typeof event !== "object" || event === null) {
    return false;
  }
  const typed = event as { type?: string };
  return (
    typed.type === "workflow:start" ||
    typed.type === "workflow:step:start" ||
    typed.type === "workflow:step:delta" ||
    typed.type === "workflow:step:end" ||
    typed.type === "workflow:variable" ||
    typed.type === "workflow:branch" ||
    typed.type === "workflow:loop" ||
    typed.type === "workflow:end" ||
    typed.type === "workflow:error"
  );
}

/**
 * Builder for creating workflow definitions
 */
export class WorkflowBuilder {
  private definition: WorkflowDefinition;

  constructor(id: string, name: string) {
    this.definition = {
      id,
      name,
      entryPoint: "",
      steps: [],
    };
  }

  /**
   * Set description
   */
  description(desc: string): this {
    this.definition.description = desc;
    return this;
  }

  /**
   * Add an AI step
   */
  aiStep(
    id: string,
    name: string,
    config: NonNullable<WorkflowStep["aiConfig"]>,
  ): this {
    const step: WorkflowStep = {
      id,
      name,
      type: "ai",
      aiConfig: config,
    };
    this.addStep(step);
    return this;
  }

  /**
   * Add a tool step
   */
  toolStep(
    id: string,
    name: string,
    config: NonNullable<WorkflowStep["toolConfig"]>,
  ): this {
    const step: WorkflowStep = {
      id,
      name,
      type: "tool",
      toolConfig: config,
    };
    this.addStep(step);
    return this;
  }

  /**
   * Add a condition step
   */
  conditionStep(
    id: string,
    name: string,
    config: NonNullable<WorkflowStep["conditionConfig"]>,
  ): this {
    const step: WorkflowStep = {
      id,
      name,
      type: "condition",
      conditionConfig: config,
    };
    this.addStep(step);
    return this;
  }

  /**
   * Add a transform step
   */
  transformStep(
    id: string,
    name: string,
    config: NonNullable<WorkflowStep["transformConfig"]>,
  ): this {
    const step: WorkflowStep = {
      id,
      name,
      type: "transform",
      transformConfig: config,
    };
    this.addStep(step);
    return this;
  }

  /**
   * Add a loop step
   */
  loopStep(
    id: string,
    name: string,
    config: NonNullable<WorkflowStep["loopConfig"]>,
  ): this {
    const step: WorkflowStep = {
      id,
      name,
      type: "loop",
      loopConfig: config,
    };
    this.addStep(step);
    return this;
  }

  /**
   * Add a wait step
   */
  waitStep(
    id: string,
    name: string,
    config: NonNullable<WorkflowStep["waitConfig"]>,
  ): this {
    const step: WorkflowStep = {
      id,
      name,
      type: "wait",
      waitConfig: config,
    };
    this.addStep(step);
    return this;
  }

  /**
   * Add a parallel step
   */
  parallelStep(
    id: string,
    name: string,
    config: NonNullable<WorkflowStep["parallelConfig"]>,
  ): this {
    const step: WorkflowStep = {
      id,
      name,
      type: "parallel",
      parallelConfig: config,
    };
    this.addStep(step);
    return this;
  }

  /**
   * Set entry point
   */
  setEntryPoint(stepId: string): this {
    this.definition.entryPoint = stepId;
    return this;
  }

  /**
   * Connect steps
   */
  connect(fromStepId: string, toStepId: string): this {
    const step = this.definition.steps.find((s) => s.id === fromStepId);
    if (step) {
      step.nextStep = toStepId;
    }
    return this;
  }

  /**
   * Set initial variables
   */
  setInitialVariables(variables: UnknownRecord): this {
    this.definition.initialVariables = variables;
    return this;
  }

  /**
   * Build the workflow definition
   */
  build(): WorkflowDefinition {
    // Auto-set entry point if not set
    if (!this.definition.entryPoint && this.definition.steps.length > 0) {
      this.definition.entryPoint = this.definition.steps[0].id;
    }

    return this.definition;
  }

  private addStep(step: WorkflowStep): void {
    // Link to previous step
    if (this.definition.steps.length > 0) {
      const prevStep = this.definition.steps[this.definition.steps.length - 1];
      if (!prevStep.nextStep) {
        prevStep.nextStep = step.id;
      }
    }

    this.definition.steps.push(step);
  }
}
