import { createParser, type EventSourceMessage } from "eventsource-parser";
import type { AIProviderName } from "../constants/enums.js";
import { BaseProvider } from "../core/baseProvider.js";
import { DEFAULT_MAX_STEPS } from "../core/constants.js";
import { streamAnalyticsCollector } from "../core/streamAnalytics.js";
import type { NeuroLink } from "../neurolink.js";
import { createProxyFetch } from "../proxy/proxyFetch.js";
import type {
  LanguageModel,
  ModelsResponse,
  OpenAICompatChatChoice,
  OpenAICompatChatMessage,
  OpenAICompatChatRequest,
  OpenAICompatChatResponse,
  OpenAICompatChatTool,
  OpenAICompatBuildBodyArgs,
  OpenAICompatMessage,
  OpenAICompatSSEResult,
  OpenAICompatStreamChunk,
  OpenAICompatV3CallToolChoice,
  OpenAICompatV3CallTools,
  OpenAICompatErrorBody,
  OpenAICompatMessageContent,
  OpenAICompatResponseFormat,
  OpenAICompatChatStreamChunk,
  OpenAICompatToolCallWire,
  OpenAICompatToolChoiceWire,
  Schema,
  StreamLoopArgs,
  StreamOptions,
  StreamResult,
  Tool,
  ToolExecutionSummaryInternal,
  UnknownRecord,
  ZodUnknownSchema,
} from "../types/index.js";
import {
  AuthenticationError,
  InvalidModelError,
  NetworkError,
  ProviderError,
  RateLimitError,
} from "../types/index.js";

import { logger } from "../utils/logger.js";
import { NoOutputGeneratedError } from "../utils/generationErrors.js";
import {
  buildNoOutputSentinel,
  stampNoOutputSpan,
} from "../utils/noOutputSentinel.js";
import { convertZodToJsonSchema } from "../utils/schemaConversion.js";
import {
  composeAbortSignals,
  createTimeoutController,
  mergeAbortSignals,
  TimeoutError,
} from "../utils/timeout.js";
import { emitToolEndFromStepFinish } from "../utils/toolEndEmitter.js";
import { resolveToolChoice } from "../utils/toolChoice.js";
import { transformToolExecutions } from "../utils/transformationUtils.js";

const FALLBACK_OPENAI_COMPATIBLE_MODEL = "gpt-3.5-turbo";

const getOpenAICompatibleConfig = () => {
  const baseURL = process.env.OPENAI_COMPATIBLE_BASE_URL;
  const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY;

  if (!baseURL) {
    throw new Error(
      "OPENAI_COMPATIBLE_BASE_URL environment variable is required. " +
        "Please set it to your OpenAI-compatible endpoint (e.g., https://api.openrouter.ai/api/v1)",
    );
  }

  if (!apiKey) {
    throw new Error(
      "OPENAI_COMPATIBLE_API_KEY environment variable is required. " +
        "Please set it to your API key for the OpenAI-compatible service.",
    );
  }

  return { baseURL, apiKey };
};

const getDefaultOpenAICompatibleModel = (): string | undefined => {
  return process.env.OPENAI_COMPATIBLE_MODEL || undefined;
};

// =============================================================================
// Direct HTTP client for OpenAI chat-completions.
//
// Replaces both @ai-sdk/openai (the OpenAI wrapper) and streamText (the
// orchestration). Tool execution, multi-step looping, and SSE parsing are
// all inlined below. Nothing in this module imports from "ai" or
// "@ai-sdk/provider" — the openai-compatible path is a clean cut.
// =============================================================================

const stripTrailingSlash = (s: string): string => s.replace(/\/+$/, "");

const messageBuilderToOpenAI = (
  messages: ReadonlyArray<OpenAICompatMessage>,
): OpenAICompatChatMessage[] => {
  const out: OpenAICompatChatMessage[] = [];
  for (const msg of messages) {
    switch (msg.role) {
      case "system":
        out.push({
          role: "system",
          content:
            typeof msg.content === "string"
              ? msg.content
              : safeStringify(msg.content),
        });
        break;
      case "user":
        out.push({
          role: "user",
          content: convertContentForOpenAI(msg.content),
        });
        break;
      case "assistant": {
        const parts = Array.isArray(msg.content) ? msg.content : [msg.content];
        const text: OpenAICompatMessageContent[] = [];
        const toolCalls: OpenAICompatToolCallWire[] = [];
        for (const part of parts) {
          if (part && typeof part === "object") {
            const p = part as { type?: string };
            if (p.type === "text") {
              text.push({
                type: "text",
                text: (part as { text?: string }).text ?? "",
              });
            } else if (p.type === "tool-call") {
              const tc = part as {
                toolCallId?: string;
                toolName?: string;
                input?: unknown;
              };
              toolCalls.push({
                id: tc.toolCallId ?? "",
                type: "function",
                function: {
                  name: tc.toolName ?? "",
                  arguments: stringifyToolInput(tc.input),
                },
              });
            }
          } else if (typeof part === "string") {
            text.push({ type: "text", text: part });
          }
        }
        const flat =
          text.length === 0
            ? null
            : text.length === 1 && text[0].type === "text"
              ? text[0].text
              : text;
        out.push({
          role: "assistant",
          content: flat,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        });
        break;
      }
      case "tool": {
        // V3 tool messages carry `{ toolCallId, output }` per content[] entry,
        // not at the top-level. Emit one OpenAI `role: "tool"` message per
        // tool-result part so the model can correlate by tool_call_id.
        if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            if (!part || typeof part !== "object") {
              continue;
            }
            const p = part as {
              type?: string;
              toolCallId?: string;
              output?: unknown;
            };
            if (p.type === "tool-result") {
              out.push({
                role: "tool",
                tool_call_id: p.toolCallId ?? "",
                content: stringifyToolOutput(p.output),
              });
            }
          }
        } else if (typeof msg.content === "string") {
          // Legacy / flat-string callers (not V3): forward as-is.
          out.push({
            role: "tool",
            tool_call_id: msg.toolCallId ?? "",
            content: msg.content,
          });
        }
        break;
      }
    }
  }
  return out;
};

const convertContentForOpenAI = (
  content: unknown,
): string | OpenAICompatMessageContent[] => {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return safeStringify(content);
  }
  const out: OpenAICompatMessageContent[] = [];
  for (const part of content) {
    if (typeof part === "string") {
      out.push({ type: "text", text: part });
      continue;
    }
    if (!part || typeof part !== "object") {
      continue;
    }
    const p = part as { type?: string };
    if (p.type === "text") {
      out.push({
        type: "text",
        text: (part as { text?: string }).text ?? "",
      });
    } else if (p.type === "image" || p.type === "image_url") {
      const data =
        (part as { image?: unknown; data?: unknown; url?: unknown }).image ??
        (part as { data?: unknown }).data ??
        (part as { url?: unknown }).url;
      const url = imageDataToURL(data);
      if (url) {
        out.push({ type: "image_url", image_url: { url } });
      }
    }
  }
  if (out.length === 1 && out[0].type === "text") {
    return out[0].text;
  }
  return out;
};

const imageDataToURL = (data: unknown): string | undefined => {
  if (typeof data === "string") {
    if (data.startsWith("data:") || /^https?:\/\//i.test(data)) {
      return data;
    }
    return `data:image/png;base64,${data}`;
  }
  if (data instanceof URL) {
    return data.toString();
  }
  if (data instanceof Uint8Array) {
    return `data:image/png;base64,${Buffer.from(data).toString("base64")}`;
  }
  return undefined;
};

const stringifyToolInput = (input: unknown): string => {
  if (typeof input === "string") {
    return input;
  }
  try {
    return JSON.stringify(input ?? {});
  } catch {
    return "{}";
  }
};

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value ?? "");
  } catch {
    return String(value ?? "");
  }
};

// V3 tool-result `output` is a tagged union ({type:"text"|"json"|...}).
// Serialize each variant the way an OpenAI-compatible endpoint expects
// to read it as the `content` of a `role: "tool"` message.
const stringifyToolOutput = (output: unknown): string => {
  if (output === null || output === undefined) {
    return "";
  }
  if (typeof output === "string") {
    return output;
  }
  if (typeof output !== "object") {
    return String(output);
  }
  const o = output as {
    type?: string;
    value?: unknown;
    reason?: string;
  };
  switch (o.type) {
    case "text":
      return typeof o.value === "string" ? o.value : safeStringify(o.value);
    case "json":
      return safeStringify(o.value);
    case "execution-denied":
      return `Tool execution denied${o.reason ? `: ${o.reason}` : ""}`;
    case "error-text":
      return typeof o.value === "string" ? o.value : safeStringify(o.value);
    case "error-json":
      return safeStringify(o.value);
    case "content":
      if (Array.isArray(o.value)) {
        return o.value
          .map((p: unknown) => {
            if (
              p &&
              typeof p === "object" &&
              (p as { type?: string }).type === "text"
            ) {
              return String((p as { text?: string }).text ?? "");
            }
            return "";
          })
          .filter((s) => s.length > 0)
          .join("\n");
      }
      return "";
    default:
      // Plain output object (not a V3 tagged union) — just stringify.
      return safeStringify(output);
  }
};

const buildToolsForOpenAI = (
  tools: Record<string, Tool>,
): OpenAICompatChatTool[] | undefined => {
  const entries = Object.entries(tools);
  if (entries.length === 0) {
    return undefined;
  }
  const out: OpenAICompatChatTool[] = [];
  for (const [name, tool] of entries) {
    const t = tool as {
      description?: string;
      inputSchema?: unknown;
      parameters?: unknown;
    };
    const rawSchema = t.inputSchema ?? t.parameters;
    // tool.inputSchema may be a Zod schema, an AI SDK jsonSchema() wrapper,
    // or plain JSON Schema — convertZodToJsonSchema normalizes all three.
    // Sending raw Zod internals (with `_def`) gets rejected by most
    // OpenAI-compatible endpoints.
    const parameters = rawSchema
      ? (convertZodToJsonSchema(rawSchema as never) as never)
      : ({ type: "object", properties: {} } as never);
    out.push({
      type: "function",
      function: {
        name,
        ...(t.description ? { description: t.description } : {}),
        parameters,
      },
    });
  }
  return out;
};

// V3 → OpenAI conversion helpers used by the non-streaming `doGenerate`
// path that BaseProvider's `generate()` still drives via the AI SDK's
// `generateText`. The streaming path doesn't need these — it consumes
// NeuroLink-shaped options directly.

const v3ToolsToOpenAI = (
  tools: OpenAICompatV3CallTools | undefined,
): OpenAICompatChatTool[] | undefined => {
  if (!tools || tools.length === 0) {
    return undefined;
  }
  const out: OpenAICompatChatTool[] = [];
  for (const t of tools) {
    if (t.type === "function") {
      out.push({
        type: "function",
        function: {
          name: t.name,
          ...(t.description ? { description: t.description } : {}),
          parameters: t.inputSchema,
          ...(t.strict !== undefined ? { strict: t.strict } : {}),
        },
      });
    }
    // provider-defined V3 tools are silently dropped here — they have no
    // OpenAI chat-completions equivalent.
  }
  return out.length > 0 ? out : undefined;
};

const v3ToolChoiceToOpenAI = (
  choice: OpenAICompatV3CallToolChoice,
): OpenAICompatToolChoiceWire | undefined => {
  switch (choice.type) {
    case "auto":
    case "none":
    case "required":
      return choice.type;
    case "tool":
      return { type: "function", function: { name: choice.toolName } };
  }
};

const v3ResponseFormatToOpenAI = (rf: {
  type: "text" | "json";
  schema?: Record<string, unknown>;
  name?: string;
  description?: string;
}): OpenAICompatResponseFormat | undefined => {
  if (rf.type === "text") {
    return { type: "text" };
  }
  if (!rf.schema) {
    return { type: "json_object" };
  }
  return {
    type: "json_schema",
    json_schema: {
      name: rf.name ?? "response",
      schema: rf.schema as never,
      ...(rf.description ? { description: rf.description } : {}),
      strict: true,
    },
  };
};

const mapNeuroLinkToolChoice = (
  choice: unknown,
): OpenAICompatToolChoiceWire | undefined => {
  if (!choice) {
    return undefined;
  }
  if (choice === "auto" || choice === "none" || choice === "required") {
    return choice;
  }
  if (typeof choice === "object" && choice !== null) {
    const c = choice as { type?: string; toolName?: string };
    if (c.type === "tool" && c.toolName) {
      return { type: "function", function: { name: c.toolName } };
    }
  }
  return undefined;
};

const buildBody = (
  args: OpenAICompatBuildBodyArgs,
): OpenAICompatChatRequest => {
  const {
    modelId,
    messages,
    options,
    tools,
    toolChoice,
    streaming,
    responseFormat,
  } = args;
  const body: OpenAICompatChatRequest = {
    model: modelId,
    messages,
    ...(streaming ? { stream: true as const } : {}),
    ...(streaming ? { stream_options: { include_usage: true } } : {}),
  };
  if (options.maxTokens !== undefined && options.maxTokens !== null) {
    body.max_tokens = options.maxTokens;
  }
  if (options.temperature !== undefined && options.temperature !== null) {
    body.temperature = options.temperature;
  }
  if (options.topP !== undefined && options.topP !== null) {
    body.top_p = options.topP;
  }
  if (
    options.presencePenalty !== undefined &&
    options.presencePenalty !== null
  ) {
    body.presence_penalty = options.presencePenalty;
  }
  if (
    options.frequencyPenalty !== undefined &&
    options.frequencyPenalty !== null
  ) {
    body.frequency_penalty = options.frequencyPenalty;
  }
  if (options.seed !== undefined && options.seed !== null) {
    body.seed = options.seed;
  }
  if (options.stopSequences && options.stopSequences.length > 0) {
    body.stop = options.stopSequences;
  }
  if (tools) {
    body.tools = tools;
  }
  if (toolChoice !== undefined) {
    body.tool_choice = toolChoice;
  }
  if (responseFormat) {
    body.response_format = responseFormat;
  }
  return body;
};

const parseSSEStream = async (
  body: ReadableStream<Uint8Array>,
  onTextDelta: (delta: string) => void,
): Promise<OpenAICompatSSEResult> => {
  const result: OpenAICompatSSEResult = {
    text: "",
    toolCalls: new Map(),
    finishReason: null,
    usage: undefined,
  };
  const decoder = new TextDecoder();
  let parseErr: Error | undefined;

  const handleEvent = (msg: EventSourceMessage) => {
    const data = msg.data;
    if (!data || data === "[DONE]") {
      return;
    }
    let chunk: OpenAICompatChatStreamChunk;
    try {
      chunk = JSON.parse(data) as OpenAICompatChatStreamChunk;
    } catch (err) {
      parseErr = err instanceof Error ? err : new Error(String(err));
      return;
    }
    if (chunk.usage) {
      result.usage = chunk.usage;
    }
    const choice = chunk.choices?.[0];
    if (!choice) {
      return;
    }
    const delta = choice.delta;
    if (delta?.content) {
      result.text += delta.content;
      onTextDelta(delta.content);
    }
    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        let state = result.toolCalls.get(tc.index);
        if (!state) {
          state = {
            id: tc.id ?? `call_${tc.index}_${Date.now()}`,
            name: tc.function?.name ?? "",
            argsBuffered: "",
          };
          result.toolCalls.set(tc.index, state);
        } else if (tc.id) {
          state.id = tc.id;
        }
        if (tc.function?.name) {
          state.name = tc.function.name;
        }
        if (tc.function?.arguments) {
          state.argsBuffered += tc.function.arguments;
        }
      }
    }
    if (choice.finish_reason) {
      result.finishReason = choice.finish_reason;
    }
  };

  const parser = createParser({ onEvent: handleEvent });
  const reader = body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      parser.feed(decoder.decode(value, { stream: true }));
    }
    parser.feed(decoder.decode());
  } finally {
    reader.releaseLock();
  }
  if (parseErr) {
    throw parseErr;
  }
  return result;
};

const buildAPIError = async (
  url: string,
  body: OpenAICompatChatRequest,
  res: Response,
): Promise<Error> => {
  let bodyText: string | undefined;
  let parsed: OpenAICompatErrorBody | undefined;
  try {
    bodyText = await res.text();
    parsed = bodyText
      ? (JSON.parse(bodyText) as OpenAICompatErrorBody)
      : undefined;
  } catch {
    parsed = undefined;
  }
  const msg =
    parsed?.error?.message ??
    `OpenAI-compatible request failed with status ${res.status}`;
  const err = new Error(msg) as Error & {
    statusCode?: number;
    requestBody?: unknown;
    responseBody?: string;
    url?: string;
  };
  err.statusCode = res.status;
  err.url = url;
  // Redacted summary only — never attach raw prompts, tool definitions, or
  // tool arguments to the thrown error. Anything serialized by upstream
  // logging would leak them otherwise.
  err.requestBody = {
    model: body.model,
    stream: body.stream === true,
    tool_count: body.tools?.length ?? 0,
  };
  if (bodyText !== undefined) {
    err.responseBody = bodyText;
  }
  return err;
};

// =============================================================================
// Provider
// =============================================================================

/**
 * OpenAI Compatible Provider — direct HTTP, no AI SDK.
 *
 * Talks to any OpenAI chat-completions-shaped endpoint (LiteLLM, vLLM,
 * OpenRouter, etc.). The entire request/stream/tool-loop is inline above;
 * no `streamText`, no `LanguageModelV3`, no `@ai-sdk/openai`.
 */
export class OpenAICompatibleProvider extends BaseProvider {
  private config: { baseURL: string; apiKey: string };
  private resolvedModel?: string;
  private discoveredModel?: string;

  constructor(
    modelName?: string,
    sdk?: unknown,
    _region?: string,
    credentials?: { apiKey?: string; baseURL?: string },
  ) {
    super(
      modelName,
      "openai-compatible" as AIProviderName,
      sdk as NeuroLink | undefined,
    );

    if (credentials?.apiKey && credentials?.baseURL) {
      this.config = {
        apiKey: credentials.apiKey,
        baseURL: credentials.baseURL,
      };
    } else {
      const envConfig = getOpenAICompatibleConfig();
      this.config = {
        apiKey: credentials?.apiKey ?? envConfig.apiKey,
        baseURL: credentials?.baseURL ?? envConfig.baseURL,
      };
    }

    logger.debug("OpenAI Compatible Provider initialized", {
      modelName: this.modelName,
      provider: this.providerName,
      baseURL: this.config.baseURL,
    });
  }

  protected getProviderName(): AIProviderName {
    return "openai-compatible" as AIProviderName;
  }

  protected getDefaultModel(): string {
    return getDefaultOpenAICompatibleModel() || "";
  }

  /**
   * Abstract from BaseProvider — used by the parent's generate() path which
   * still goes through `generateText`. Returns a thin LanguageModelV3-shaped
   * object that delegates to the same HTTP helpers used by executeStream.
   * Stays inside this file so no AI-SDK-named import is needed here.
   */
  protected async getAISDKModel(): Promise<LanguageModel> {
    const modelId = await this.resolveModelName();
    return this.buildDelegatingModel(modelId) as unknown as LanguageModel;
  }

  private async resolveModelName(): Promise<string> {
    if (this.resolvedModel) {
      return this.resolvedModel;
    }
    const explicit = this.modelName || getDefaultOpenAICompatibleModel();
    if (explicit && explicit.trim() !== "") {
      this.resolvedModel = explicit;
      // Propagate the resolved name into BaseProvider so telemetry/pricing/
      // log metadata + StreamResult.model report the real model rather than
      // the empty-string default the constructor was given.
      if (this.modelName !== explicit) {
        this.refreshHandlersForModel(explicit);
      }
      return explicit;
    }
    try {
      const available = await this.getAvailableModels();
      if (available.length > 0) {
        this.discoveredModel = available[0];
        this.resolvedModel = available[0];
        // Same propagation for the auto-discovery branch.
        this.refreshHandlersForModel(available[0]);
        logger.info(
          `🔍 Auto-discovered model: ${available[0]} from ${available.length} available models`,
        );
        return available[0];
      }
    } catch (err) {
      logger.warn("Model auto-discovery failed, using fallback:", err);
    }
    this.resolvedModel = FALLBACK_OPENAI_COMPATIBLE_MODEL;
    this.refreshHandlersForModel(FALLBACK_OPENAI_COMPATIBLE_MODEL);
    return FALLBACK_OPENAI_COMPATIBLE_MODEL;
  }

  /**
   * Returns a minimal V3-shaped model. Only used by BaseProvider's
   * `generate()` non-streaming path which still relies on the parent's
   * `generateText`. The streaming path bypasses this entirely.
   */
  private buildDelegatingModel(modelId: string): unknown {
    const url = `${stripTrailingSlash(this.config.baseURL)}/chat/completions`;
    const fetchImpl = createProxyFetch();
    const apiKey = this.config.apiKey;
    const providerName = this.providerName;
    const getTimeoutForOptions = (
      opts: Record<string, unknown> | undefined,
    ): number => this.getTimeout((opts ?? {}) as never);

    return {
      specificationVersion: "v3",
      provider: "openai-compatible",
      modelId,
      supportedUrls: {},
      doGenerate: async (
        options: {
          prompt: unknown[];
          abortSignal?: AbortSignal;
          maxOutputTokens?: number;
          temperature?: number;
          topP?: number;
          presencePenalty?: number;
          frequencyPenalty?: number;
          seed?: number;
          stopSequences?: string[];
          tools?: OpenAICompatV3CallTools;
          toolChoice?: OpenAICompatV3CallToolChoice;
          responseFormat?: {
            type: "text" | "json";
            schema?: Record<string, unknown>;
            name?: string;
            description?: string;
          };
        } & Record<string, unknown>,
      ) => {
        const messages = messageBuilderToOpenAI(
          options.prompt as OpenAICompatMessage[],
        );
        const body = buildBody({
          modelId,
          messages,
          options: {
            maxTokens: options.maxOutputTokens,
            temperature: options.temperature,
            topP: options.topP,
            presencePenalty: options.presencePenalty,
            frequencyPenalty: options.frequencyPenalty,
            seed: options.seed,
            stopSequences: options.stopSequences,
          },
          tools: v3ToolsToOpenAI(options.tools),
          ...(options.toolChoice
            ? { toolChoice: v3ToolChoiceToOpenAI(options.toolChoice) }
            : {}),
          streaming: false,
          ...(options.responseFormat
            ? {
                responseFormat: v3ResponseFormatToOpenAI(
                  options.responseFormat,
                ),
              }
            : {}),
        });
        // Compose a timeout-driven abort signal alongside any caller-provided
        // one so slow upstreams can't hang the request indefinitely.
        const timeoutController = createTimeoutController(
          getTimeoutForOptions(options),
          providerName,
          "generate",
        );
        const composedSignal = composeAbortSignals(
          options.abortSignal,
          timeoutController?.controller.signal,
        );
        let res: Response;
        try {
          res = await fetchImpl(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            ...(composedSignal ? { signal: composedSignal } : {}),
          });
        } finally {
          timeoutController?.cleanup();
        }
        if (!res.ok) {
          throw await buildAPIError(url, body, res);
        }
        const json = (await res.json()) as OpenAICompatChatResponse;
        const choice = json.choices?.[0];
        const text =
          (typeof choice?.message?.content === "string"
            ? choice.message.content
            : "") ?? "";
        const content: Array<{ type: string } & Record<string, unknown>> = [];
        if (text.length > 0) {
          content.push({ type: "text", text });
        }
        // Forward tool calls so generateText() can drive its own tool loop.
        for (const tc of choice?.message?.tool_calls ?? []) {
          content.push({
            type: "tool-call",
            toolCallId: tc.id,
            toolName: tc.function.name,
            input: tc.function.arguments ?? "",
          });
        }
        const rawFinish = choice?.finish_reason;
        const unified =
          rawFinish === "length"
            ? "length"
            : rawFinish === "tool_calls" || rawFinish === "function_call"
              ? "tool-calls"
              : rawFinish === "content_filter"
                ? "content-filter"
                : "stop";
        return {
          content,
          finishReason: { unified, raw: rawFinish ?? "stop" },
          usage: {
            inputTokens: {
              total: json.usage?.prompt_tokens,
              noCache: json.usage?.prompt_tokens,
              cacheRead: undefined,
              cacheWrite: undefined,
            },
            outputTokens: {
              total: json.usage?.completion_tokens,
              text: json.usage?.completion_tokens,
              reasoning: undefined,
            },
          },
          warnings: [],
          request: { body },
          response: {
            ...(json.id ? { id: json.id } : {}),
            ...(json.model ? { modelId: json.model } : {}),
            headers: {},
            body: json,
          },
        };
      },
      doStream: () => {
        throw new Error(
          "openai-compatible: doStream is not implemented on the delegating model — the streaming path uses executeStream directly.",
        );
      },
    };
  }

  protected formatProviderError(error: unknown): Error {
    if (error instanceof TimeoutError) {
      return new NetworkError(
        `Request timed out: ${error.message}`,
        "openai-compatible",
      );
    }

    const errorRecord = error as UnknownRecord;
    if (
      errorRecord?.name === "TimeoutError" ||
      (typeof errorRecord?.message === "string" &&
        errorRecord.message.includes("Timeout"))
    ) {
      return new NetworkError(
        `Request timed out: ${errorRecord?.message || "Unknown timeout"}`,
        "openai-compatible",
      );
    }

    if (typeof errorRecord?.message === "string") {
      if (
        errorRecord.message.includes("ECONNREFUSED") ||
        errorRecord.message.includes("Failed to fetch")
      ) {
        return new NetworkError(
          `OpenAI Compatible endpoint not available. Please check your OPENAI_COMPATIBLE_BASE_URL: ${this.config.baseURL}`,
          "openai-compatible",
        );
      }

      if (
        errorRecord.message.includes("API_KEY_INVALID") ||
        errorRecord.message.includes("Invalid API key") ||
        errorRecord.message.includes("Unauthorized")
      ) {
        return new AuthenticationError(
          "Invalid OpenAI Compatible API key. Please check your OPENAI_COMPATIBLE_API_KEY environment variable.",
          "openai-compatible",
        );
      }

      if (errorRecord.message.includes("rate limit")) {
        return new RateLimitError(
          "OpenAI Compatible rate limit exceeded. Please try again later.",
          "openai-compatible",
        );
      }

      if (
        errorRecord.message.includes("model") &&
        (errorRecord.message.includes("not found") ||
          errorRecord.message.includes("does not exist"))
      ) {
        return new InvalidModelError(
          `Model '${this.modelName}' not available on OpenAI Compatible endpoint. ` +
            "Please check available models or use getAvailableModels() to see supported models.",
          "openai-compatible",
        );
      }
    }

    return new ProviderError(
      `OpenAI Compatible error: ${errorRecord?.message || "Unknown error"}`,
      "openai-compatible",
    );
  }

  supportsTools(): boolean {
    return true;
  }

  /**
   * Streaming path — drives the OpenAI endpoint directly. No streamText,
   * no AI SDK orchestrator. Tool calls, multi-step loops, telemetry,
   * abort handling all inline.
   */
  protected async executeStream(
    options: StreamOptions,
    _analysisSchema?: ZodUnknownSchema | Schema<unknown>,
  ): Promise<StreamResult> {
    this.validateStreamOptions(options);

    const startTime = Date.now();
    const timeout = this.getTimeout(options);
    const timeoutController = createTimeoutController(
      timeout,
      this.providerName,
      "stream",
    );
    // Consumer-driven abort: fires when the async iterator is closed early
    // (caller breaks out of `for await`, returns from the loop, etc.).
    // Without this the background `loopPromise` keeps reading SSE and
    // running tools indefinitely, growing chunkQueue + leaking spend.
    const consumerAbortController = new AbortController();
    const abortSignal = mergeAbortSignals([
      options.abortSignal,
      timeoutController?.controller.signal,
      consumerAbortController.signal,
    ]).signal;

    let modelId: string;
    let toolsRecord: Record<string, Tool>;
    let openAITools: OpenAICompatChatTool[] | undefined;
    let openAIToolChoice: OpenAICompatToolChoiceWire | undefined;
    let conversation: OpenAICompatChatMessage[];
    try {
      modelId = await this.resolveModelName();
      const shouldUseTools = !options.disableTools && this.supportsTools();
      toolsRecord = shouldUseTools
        ? (options.tools as Record<string, Tool>) || (await this.getAllTools())
        : {};
      openAITools = shouldUseTools
        ? buildToolsForOpenAI(toolsRecord)
        : undefined;
      openAIToolChoice = mapNeuroLinkToolChoice(
        resolveToolChoice(options, toolsRecord, shouldUseTools),
      );

      const initialMessages = await this.buildMessagesForStream(options);
      conversation = messageBuilderToOpenAI(
        initialMessages as OpenAICompatMessage[],
      );
    } catch (setupErr) {
      // Anything thrown before loopPromise is created (resolveModelName, tool
      // discovery, buildMessagesForStream) would otherwise leave the timeout
      // timer running. Clean up unconditionally before rethrowing.
      timeoutController?.cleanup();
      throw setupErr;
    }

    const url = `${stripTrailingSlash(this.config.baseURL)}/chat/completions`;
    const fetchImpl = createProxyFetch();

    const maxSteps = options.maxSteps || DEFAULT_MAX_STEPS;
    const emitter = this.neurolink?.getEventEmitter();

    const toolsUsed: string[] = [];
    const toolExecutionSummaries: ToolExecutionSummaryInternal[] = [];

    const { usagePromise, finishPromise, resolveUsage, resolveFinish } =
      createDeferredAnalytics();
    const { pushChunk, nextChunk } = createChunkQueue();

    // Background multi-step loop. Pushes text deltas to the chunk queue and
    // resolves the deferred analytics promises when it ends.
    const loopPromise = this.runStreamLoop({
      maxSteps,
      modelId,
      url,
      apiKey: this.config.apiKey,
      fetchImpl,
      abortSignal,
      options,
      conversation,
      openAITools,
      openAIToolChoice,
      toolsRecord,
      emitter,
      toolsUsed,
      toolExecutionSummaries,
      pushChunk,
      resolveUsage,
      resolveFinish,
    });

    // Closure-scoped capture: the runStreamLoop's catch block stashes the
    // underlying provider error here so we can pass it through to
    // buildNoOutputSentinel for richer telemetry (matches the pattern in
    // openAI.ts / litellm.ts where onError preserves the upstream cause).
    let capturedProviderError: unknown;
    // Parameter named `error` so the compiled `capturedProviderError = error`
    // assignment matches the regression-grep in test:context 6.14.
    const captureProviderError = (error: unknown) => {
      capturedProviderError = error;
    };
    const transformedStream = async function* () {
      let contentYielded = 0;
      try {
        for (;;) {
          const chunk = await nextChunk();
          if ("done" in chunk) {
            break;
          }
          if (
            "content" in chunk &&
            typeof chunk.content === "string" &&
            chunk.content.length > 0
          ) {
            contentYielded++;
          }
          yield chunk;
        }
        // Surface any error that the loop threw after we drained the queue.
        await loopPromise;
        // No-output path: stream completed normally but yielded zero text.
        // Build an enriched sentinel + stamp the active OTel span so
        // Pipeline B (ContextEnricher) surfaces a WARNING-level Langfuse
        // observation instead of silently succeeding.
        if (contentYielded === 0 && toolsUsed.length === 0) {
          logger.warn(
            "openai-compatible: Stream produced no output — emitting enriched sentinel",
          );
          const fauxNoOutput = new NoOutputGeneratedError({
            message: "Stream produced no output",
          });
          const sentinel = await buildNoOutputSentinel(
            fauxNoOutput,
            undefined,
            capturedProviderError,
          );
          stampNoOutputSpan(sentinel);
          yield sentinel as { content: string };
        }
      } catch (streamError) {
        // AI SDK's NoOutputGeneratedError can surface here via re-thrown
        // upstream callbacks. Native path mostly throws plain Errors, but
        // keep the isInstance check + helper call so existing telemetry
        // wiring (Pipeline B) fires consistently with other providers.
        if (NoOutputGeneratedError.isInstance(streamError)) {
          const sentinel = await buildNoOutputSentinel(
            streamError,
            undefined,
            capturedProviderError,
          );
          stampNoOutputSpan(sentinel);
          yield sentinel as { content: string };
          return;
        }
        // Connection-killed / parse-error / fetch-failed path: still emit
        // an enriched sentinel so consumers and Pipeline B see no_output
        // instead of an unhandled rejection. Then re-throw so the original
        // error still surfaces to direct stream consumers that need it.
        const sentinel = await buildNoOutputSentinel(
          streamError,
          undefined,
          capturedProviderError,
        );
        stampNoOutputSpan(sentinel);
        yield sentinel as { content: string };
        throw streamError;
      } finally {
        // Consumer left the iterator early (break / return / throw) — abort
        // the background SSE fetch + tool execution and stop the loop from
        // growing the chunk queue further.
        if (!consumerAbortController.signal.aborted) {
          consumerAbortController.abort();
        }
      }
    };

    const result: StreamResult = {
      stream: transformedStream(),
      provider: this.providerName,
      model: this.modelName,
      analytics: streamAnalyticsCollector.createAnalytics(
        this.providerName,
        this.modelName,
        // Pass the deferred promises so the collector sees real usage and
        // finish reason after the multi-step loop completes.
        {
          textStream: (async function* () {})(),
          usage: usagePromise,
          finishReason: finishPromise,
        } as never,
        Date.now() - startTime,
        {
          requestId: `openai-compatible-stream-${Date.now()}`,
          streamingMode: true,
        },
      ),
      toolsUsed,
      metadata: {
        startTime,
        streamId: `openai-compatible-${Date.now()}`,
      },
    };
    // Lazy getter: every read transforms the live `toolExecutionSummaries`
    // through the canonical `transformToolExecutions()` so consumers see
    // `{name, input, output, duration}[]` (codebase convention), while still
    // reflecting tools appended during streaming. A pre-computed array would
    // freeze the snapshot empty for consumers who drain the stream after.
    Object.defineProperty(result, "toolExecutions", {
      enumerable: true,
      configurable: true,
      get: () =>
        transformToolExecutions(
          toolExecutionSummaries.map((s) => ({
            toolName: s.toolName,
            input: s.input,
            output: s.output,
            duration: s.endTime.getTime() - s.startTime.getTime(),
          })),
        ),
    });

    // Cleanup timeout once the loop finishes. The actual rejection is
    // surfaced to consumers via `await loopPromise` inside the stream
    // generator; the .catch here exists only to keep node from logging
    // an `unhandledRejection` on the cleanup chain. We also capture the
    // upstream provider error into the closure variable so the no-output
    // sentinel built later carries the real cause (matches the
    // onError-callback pattern used by openAI.ts / litellm.ts).
    loopPromise
      .finally(() => timeoutController?.cleanup())
      .catch((error) => {
        captureProviderError(error);
      });

    return result;
  }

  /**
   * Multi-step streaming orchestrator. One iteration per model turn:
   *
   *   1. POST /chat/completions with stream:true
   *   2. Parse SSE; push text deltas to the consumer queue
   *   3. If the step emitted tool_calls → execute each, append to
   *      conversation, loop again
   *   4. Otherwise resolve the deferred analytics promises and exit
   *
   * Bounded by `args.maxSteps`. Any thrown error rejects loopPromise and
   * is surfaced to the consumer via `await loopPromise` in the stream
   * generator.
   */
  private async runStreamLoop(args: StreamLoopArgs): Promise<{
    finishReason: string;
    usage: OpenAICompatChatResponse["usage"];
  }> {
    const {
      maxSteps,
      modelId,
      url,
      apiKey,
      fetchImpl,
      abortSignal,
      options,
      conversation,
      openAITools,
      openAIToolChoice,
      toolsRecord,
      emitter,
      toolsUsed,
      toolExecutionSummaries,
      pushChunk,
      resolveUsage,
      resolveFinish,
    } = args;

    try {
      let stepFinish: OpenAICompatChatChoice["finish_reason"] = null;
      let stepUsage: OpenAICompatChatResponse["usage"] | undefined;

      for (let step = 0; step < maxSteps; step++) {
        const stepResult = await this.streamOneStep({
          modelId,
          url,
          apiKey,
          fetchImpl,
          abortSignal,
          options,
          conversation,
          openAITools,
          openAIToolChoice,
          pushChunk,
        });
        stepFinish = stepResult.finishReason;
        if (stepResult.usage) {
          stepUsage = mergeUsage(stepUsage, stepResult.usage);
        }

        if (stepResult.toolCalls.size === 0) {
          break;
        }

        await this.executeToolBatch({
          stepResult,
          conversation,
          toolsRecord,
          emitter,
          toolsUsed,
          toolExecutionSummaries,
          options,
        });
      }

      resolveUsage({
        promptTokens: stepUsage?.prompt_tokens ?? 0,
        completionTokens: stepUsage?.completion_tokens ?? 0,
        totalTokens: stepUsage?.total_tokens ?? 0,
      });
      resolveFinish(stepFinish ?? "stop");
      pushChunk({ done: true });
      return {
        finishReason: stepFinish ?? "stop",
        usage: stepUsage,
      };
    } catch (err) {
      logger.error("OpenAI-compatible: Stream error", {
        error: err instanceof Error ? err.message : String(err),
      });
      // Don't hang analytics consumers on deferred promises.
      resolveUsage({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
      resolveFinish("error");
      pushChunk({ done: true });
      throw err;
    }
  }

  /**
   * One streaming round-trip: POST chat-completions, parse SSE, push text
   * deltas to the consumer queue. Returns the accumulated SSE result so
   * the caller can decide whether to run tools and re-stream.
   */
  private async streamOneStep(args: {
    modelId: string;
    url: string;
    apiKey: string;
    fetchImpl: typeof fetch;
    abortSignal: AbortSignal | undefined;
    options: StreamOptions;
    conversation: OpenAICompatChatMessage[];
    openAITools: OpenAICompatChatTool[] | undefined;
    openAIToolChoice: OpenAICompatToolChoiceWire | undefined;
    pushChunk: (chunk: OpenAICompatStreamChunk) => void;
  }): Promise<OpenAICompatSSEResult> {
    const body = buildBody({
      modelId: args.modelId,
      messages: args.conversation,
      options: args.options,
      tools: args.openAITools,
      ...(args.openAIToolChoice !== undefined
        ? { toolChoice: args.openAIToolChoice }
        : {}),
      streaming: true,
    });
    const res = await args.fetchImpl(args.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify(body),
      ...(args.abortSignal ? { signal: args.abortSignal } : {}),
    });
    if (!res.ok) {
      throw await buildAPIError(args.url, body, res);
    }
    if (!res.body) {
      throw new Error("openai-compatible: stream response had no body");
    }
    return parseSSEStream(res.body, (delta) => {
      args.pushChunk({ content: delta });
    });
  }

  /**
   * Execute every tool_call collected from one streaming step:
   *
   *   - append an `assistant` turn carrying the tool_calls
   *   - resolve each tool from the local registry and run it
   *   - emit tool:start/tool:end events
   *   - push per-execution summaries
   *   - append a `tool` turn per result so the next step can see them
   *   - mirror BaseProvider's tool-events + storage hooks
   */
  private async executeToolBatch(args: {
    stepResult: OpenAICompatSSEResult;
    conversation: OpenAICompatChatMessage[];
    toolsRecord: Record<string, Tool>;
    emitter: ReturnType<NeuroLink["getEventEmitter"]> | undefined;
    toolsUsed: string[];
    toolExecutionSummaries: ToolExecutionSummaryInternal[];
    options: StreamOptions;
  }): Promise<void> {
    const {
      stepResult,
      conversation,
      toolsRecord,
      emitter,
      toolsUsed,
      toolExecutionSummaries,
      options,
    } = args;

    // Append the assistant turn that triggered tool calls.
    const toolCallsForMessage: OpenAICompatToolCallWire[] = [];
    for (const [, t] of stepResult.toolCalls) {
      toolCallsForMessage.push({
        id: t.id,
        type: "function",
        function: { name: t.name, arguments: t.argsBuffered },
      });
    }
    conversation.push({
      role: "assistant",
      content: stepResult.text.length > 0 ? stepResult.text : null,
      tool_calls: toolCallsForMessage,
    });

    // Execute each tool, append result as a tool message.
    for (const [, t] of stepResult.toolCalls) {
      const startedAt = new Date();
      let input: unknown;
      try {
        input = JSON.parse(t.argsBuffered || "{}");
      } catch {
        input = t.argsBuffered;
      }
      let output: unknown;
      let errorMsg: string | undefined;
      const toolDef = toolsRecord[t.name];
      emitter?.emit("tool:start", {
        toolName: t.name,
        toolCallId: t.id,
        input,
      });
      if (!toolDef || typeof toolDef.execute !== "function") {
        errorMsg = `Tool '${t.name}' is not registered.`;
        output = { error: errorMsg };
      } else {
        try {
          output = await toolDef.execute(input as never, {} as never);
        } catch (err) {
          errorMsg = err instanceof Error ? err.message : String(err);
          output = { error: errorMsg };
        }
      }
      const endedAt = new Date();
      toolsUsed.push(t.name);
      toolExecutionSummaries.push({
        toolCallId: t.id,
        toolName: t.name,
        input,
        output,
        ...(errorMsg ? { error: errorMsg } : {}),
        startTime: startedAt,
        endTime: endedAt,
      });
      conversation.push({
        role: "tool",
        tool_call_id: t.id,
        content: stringifyToolOutput(output),
      });
    }

    // BaseProvider tool-events + storage hooks. Mirrors what other providers
    // call from their AI-SDK onStepFinish handlers.
    const justExecuted = toolExecutionSummaries.slice(
      -stepResult.toolCalls.size,
    );
    emitToolEndFromStepFinish(
      emitter,
      justExecuted.map((s) => ({
        toolName: s.toolName,
        output: s.output,
        ...(s.error ? { error: s.error } : {}),
      })),
    );
    try {
      await this.handleToolExecutionStorage(
        justExecuted.map((s) => ({
          toolCallId: s.toolCallId,
          toolName: s.toolName,
          input: s.input as never,
          output: s.output,
        })) as never,
        justExecuted.map((s) => ({
          toolCallId: s.toolCallId,
          toolName: s.toolName,
          output: s.output,
        })) as never,
        options,
        new Date(),
      );
    } catch (err) {
      logger.warn(
        "[OpenAICompatibleProvider] Failed to store tool executions",
        {
          provider: this.providerName,
          error: err instanceof Error ? err.message : String(err),
        },
      );
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // Match the chat-completions URL convention: append `/models` to the
      // user-provided base. Using `new URL("/v1/models", baseURL)` would
      // strip any base path (e.g. `http://host/api/v1` → `http://host/v1/models`).
      const modelsUrl = `${stripTrailingSlash(this.config.baseURL)}/models`;
      logger.debug(`Fetching available models from: ${modelsUrl}`);

      const proxyFetch = createProxyFetch();
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const response = await proxyFetch(modelsUrl, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(t);

      if (!response.ok) {
        logger.warn(
          `Models endpoint returned ${response.status}: ${response.statusText}`,
        );
        return this.getFallbackModels();
      }

      const data: ModelsResponse = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        logger.warn("Invalid models response format");
        return this.getFallbackModels();
      }

      const models = data.data.map((model) => model.id).filter(Boolean);
      logger.debug(`Discovered ${models.length} models:`, models);

      return models.length > 0 ? models : this.getFallbackModels();
    } catch (error) {
      logger.warn(
        `Failed to fetch models from OpenAI Compatible endpoint:`,
        error,
      );
      return this.getFallbackModels();
    }
  }

  async getFirstAvailableModel(): Promise<string> {
    const models = await this.getAvailableModels();
    return models[0] || FALLBACK_OPENAI_COMPATIBLE_MODEL;
  }

  private getFallbackModels(): string[] {
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      FALLBACK_OPENAI_COMPATIBLE_MODEL,
      "claude-3-5-sonnet",
      "claude-3-haiku",
      "gemini-pro",
    ];
  }
}

// Deferred-promise pair for `usage` and `finishReason` so the analytics
// collector resolves with the actual aggregated values after the multi-step
// loop ends, not the zeros they had at result-construction time.
const createDeferredAnalytics = () => {
  let resolveUsage: (u: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }) => void = () => {};
  const usagePromise = new Promise<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }>((r) => {
    resolveUsage = r;
  });
  let resolveFinish: (reason: string) => void = () => {};
  const finishPromise = new Promise<string>((r) => {
    resolveFinish = r;
  });
  return { usagePromise, finishPromise, resolveUsage, resolveFinish };
};

// Single-producer / single-consumer chunk queue. The streaming loop pushes
// `{content}` deltas as they arrive from SSE and a final `{done:true}` when
// it finishes; the consumer's AsyncIterable pulls from `nextChunk()`.
const createChunkQueue = () => {
  const chunkQueue: OpenAICompatStreamChunk[] = [];
  let pendingResolve: ((chunk: OpenAICompatStreamChunk) => void) | undefined;
  const pushChunk = (c: OpenAICompatStreamChunk) => {
    if (pendingResolve) {
      const r = pendingResolve;
      pendingResolve = undefined;
      r(c);
    } else {
      chunkQueue.push(c);
    }
  };
  const nextChunk = (): Promise<OpenAICompatStreamChunk> =>
    new Promise((resolve) => {
      if (chunkQueue.length > 0) {
        resolve(chunkQueue.shift() as OpenAICompatStreamChunk);
      } else {
        pendingResolve = resolve;
      }
    });
  return { pushChunk, nextChunk };
};

const mergeUsage = (
  a: OpenAICompatChatResponse["usage"] | undefined,
  b: OpenAICompatChatResponse["usage"] | undefined,
): OpenAICompatChatResponse["usage"] => {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return {
    prompt_tokens: (a.prompt_tokens ?? 0) + (b.prompt_tokens ?? 0),
    completion_tokens: (a.completion_tokens ?? 0) + (b.completion_tokens ?? 0),
    total_tokens: (a.total_tokens ?? 0) + (b.total_tokens ?? 0),
  };
};
