import type { ToolEventPayload } from "../types/index.js";

export type { ToolEventPayload };

export function createToolEventPayload(
  toolName: string,
  payload: Omit<ToolEventPayload, "tool" | "toolName"> = {},
): ToolEventPayload {
  return {
    ...payload,
    tool: toolName,
    toolName,
  };
}
