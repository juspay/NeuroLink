import type { ExtractedToolExecution } from "./types.js";
import type { ToolCall, ToolResult } from "../types/streamTypes.js";
import type { GenerateResult } from "../types/generateTypes.js";

export class ToolExecutionExtractor {
  extract(result: GenerateResult): ExtractedToolExecution[] {
    const executions: ExtractedToolExecution[] = [];

    // Extract from toolExecutions if available
    if (result.toolExecutions && Array.isArray(result.toolExecutions)) {
      result.toolExecutions.forEach((execution, index) => {
        executions.push(this.parseToolExecution(execution, index));
      });
    }

    // Also check toolCalls and toolResults for additional data
    if (result.toolCalls && result.toolResults) {
      const additionalExecutions = this.correlateCallsAndResults(
        result.toolCalls as ToolCall[],
        result.toolResults as ToolResult[],
      );
      executions.push(...additionalExecutions);
    }

    return this.deduplicateExecutions(executions);
  }

  private parseToolExecution(
    execution: unknown,
    sequenceNumber: number,
  ): ExtractedToolExecution {
    const exec = execution as Record<string, unknown>;
    const startTime = (exec.startTime as number) || Date.now();
    const endTime = (exec.endTime as number) || Date.now();

    return {
      toolName: (exec.toolName as string) || "unknown",
      toolCallId:
        (exec.toolCallId as string) || `tool-${Date.now()}-${sequenceNumber}`,
      input: this.sanitizeInput(exec.args || exec.input || {}),
      output: this.sanitizeOutput(exec.result || exec.output),
      duration: endTime - startTime,
      success: exec.success !== false,
      error: exec.error as string | undefined,
      metadata: {
        timestamp: startTime,
        sequenceNumber,
        retryCount: (exec.retryCount as number) || 0,
      },
    };
  }

  private correlateCallsAndResults(
    toolCalls: ToolCall[],
    toolResults: ToolResult[],
  ): ExtractedToolExecution[] {
    const executions: ExtractedToolExecution[] = [];
    const resultMap = new Map(toolResults.map((r) => [r.id || r.toolName, r]));

    toolCalls.forEach((call, index) => {
      const result = resultMap.get(call.toolCallId || call.id || call.toolName);

      executions.push({
        toolName: call.toolName,
        toolCallId: call.toolCallId || call.id || `tool-${index}`,
        input: this.sanitizeInput(call.parameters || call.args),
        output: result ? this.sanitizeOutput(result.output) : null,
        duration: result?.executionTime || 0,
        success: result ? result.status === "success" : false,
        error: result?.error,
        metadata: {
          timestamp: Date.now(),
          sequenceNumber: index,
          retryCount: 0,
        },
      });
    });

    return executions;
  }

  private sanitizeInput(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== "object") {
      return {};
    }

    // Remove sensitive data patterns
    const sanitized = { ...input } as Record<string, unknown>;
    const sensitiveKeys = ["password", "token", "secret", "key", "credential"];

    Object.keys(sanitized).forEach((key) => {
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        sanitized[key] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  private sanitizeOutput(output: unknown): unknown {
    if (typeof output === "string" && output.length > 1000) {
      return output.substring(0, 1000) + "... [truncated]";
    }

    if (output && typeof output === "object") {
      // Handle large arrays
      if (Array.isArray(output) && output.length > 10) {
        return [
          ...output.slice(0, 10),
          `... and ${output.length - 10} more items`,
        ];
      }

      // Handle large objects
      const outputObj = output as Record<string, unknown>;
      const keys = Object.keys(outputObj);
      if (keys.length > 20) {
        const truncated: Record<string, unknown> = {};
        keys.slice(0, 20).forEach((key) => {
          truncated[key] = outputObj[key];
        });
        truncated["..."] = `and ${keys.length - 20} more properties`;
        return truncated;
      }
    }

    return output;
  }

  private deduplicateExecutions(
    executions: ExtractedToolExecution[],
  ): ExtractedToolExecution[] {
    const seen = new Set<string>();
    return executions.filter((execution) => {
      const key = `${execution.toolName}-${execution.toolCallId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Utility method to calculate tool effectiveness metrics
  calculateMetrics(executions: ExtractedToolExecution[]): {
    totalExecutions: number;
    successRate: number;
    averageDuration: number;
    toolUsageDistribution: Record<string, number>;
    failureReasons: string[];
  } {
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter((e) => e.success).length;
    const totalDuration = executions.reduce((sum, e) => sum + e.duration, 0);

    const toolUsageDistribution: Record<string, number> = {};
    const failureReasons: string[] = [];

    executions.forEach((execution) => {
      // Count tool usage
      toolUsageDistribution[execution.toolName] =
        (toolUsageDistribution[execution.toolName] || 0) + 1;

      // Collect failure reasons
      if (!execution.success && execution.error) {
        failureReasons.push(`${execution.toolName}: ${execution.error}`);
      }
    });

    return {
      totalExecutions,
      successRate:
        totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      averageDuration:
        totalExecutions > 0 ? totalDuration / totalExecutions : 0,
      toolUsageDistribution,
      failureReasons,
    };
  }
}
