/**
 * Grok Build client configurator.
 *
 * Grok Build (`grok`, xAI's terminal agent) is a Codex-shaped TOML client
 * that speaks three wire formats. Built-in `grok-4.6` / `grok-4.5` stay on
 * xAI (`cli-chat-proxy.grok.com`, Responses API, 500k window). This writer
 * does not remap those. It adds the proxy's advertised catalog as extra
 * picker entries so Grok can send Claude traffic through `/v1/messages`
 * (passthrough) and Gemini/OpenAI traffic through `/v1/chat/completions`
 * (translation), each with a `context_window` that Grok's own compaction
 * will honour — the proxy does not truncate.
 *
 * Snapshot lives in `~/.neurolink/`, following Codex, never inside
 * `config.toml`. Grok's TOML parser is not a closed schema, but putting
 * bookkeeping keys in the user's file is how OpenCode was bricked, and new
 * writers do not rely on tolerance.
 *
 * Adaptive thinking: Grok's global `default_reasoning_effort = "xhigh"`
 * becomes Anthropic `thinking.type = "adaptive"`. Haiku 4.5 rejects that
 * with 400. Only Claude Opus/Sonnet 4.6 and 5.x keep reasoning enabled.
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { logger } from "../../lib/utils/logger.js";
import { getContextWindowSize } from "../../lib/constants/contextWindows.js";
import { DEFAULT_PROXY_MODEL_IDS } from "../../lib/constants/proxyModels.js";
import {
  defaultProxyConfigPath,
  parseProxyConfigString,
} from "../../lib/proxy/proxyConfig.js";
import type {
  CliGrokProxyModelSpec,
  CliGrokSnapshot,
  CliProxyClientApplyOptions,
  CliProxyClientConfigurator,
  ModelMapping,
} from "../../lib/types/index.js";
import {
  isUsableSnapshot,
  shouldCaptureSnapshot,
  writeFileAtomic,
} from "./snapshot.js";

const GROK_BLOCK_BEGIN = "# >>> neurolink-proxy (managed) >>>";
const GROK_BLOCK_END = "# <<< neurolink-proxy (managed) <<<";
const PLACEHOLDER_KEY = "neurolink-proxy";
const ANTHROPIC_VERSION = "2023-06-01";

function getGrokConfigDir(): string {
  const env = process.env.GROK_HOME;
  return env !== undefined && env.trim().length > 0
    ? env.trim()
    : join(homedir(), ".grok");
}

function getGrokConfigPath(): string {
  return join(getGrokConfigDir(), "config.toml");
}

function getGrokSnapshotPath(): string {
  return join(homedir(), ".neurolink", "grok-proxy-snapshot.json");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tomlKey(id: string): string {
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : JSON.stringify(id);
}

function displayNameFor(id: string): string {
  const base = id.replace(/-\d{8}$/, "");
  const pretty = base
    .split("-")
    .map((part) =>
      /^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ")
    .replace(/(\d) (\d)/g, "$1.$2");
  return `${pretty} (NeuroLink)`;
}

function providerForModelId(id: string): "anthropic" | "vertex" | "openai" {
  if (id.startsWith("claude-")) {
    return "anthropic";
  }
  if (id.startsWith("gemini-")) {
    return "vertex";
  }
  return "openai";
}

function providerFromMapping(
  provider: string,
  fallbackId: string,
): "anthropic" | "vertex" | "openai" {
  const normalized = provider.trim().toLowerCase();
  if (normalized === "anthropic" || normalized === "claude") {
    return "anthropic";
  }
  if (normalized === "openai") {
    return "openai";
  }
  if (
    normalized === "vertex" ||
    normalized === "google" ||
    normalized === "google-ai" ||
    normalized === "gemini"
  ) {
    return "vertex";
  }
  return providerForModelId(fallbackId);
}

function isMissingFileError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }
  return error.code === "ENOENT";
}

/**
 * Anthropic `thinking.type = "adaptive"` is what Grok emits for `xhigh`.
 * Measured: Haiku 4.5 returns 400 "adaptive thinking is not supported".
 * Opus/Sonnet 4.6 and the 5-series accept it.
 */
function supportsAdaptiveThinking(id: string): boolean {
  return (
    /^claude-(opus|sonnet)-4-6$/.test(id) || /^claude-(opus|sonnet)-5/.test(id)
  );
}

function classifyGrokProxyModel(
  id: string,
  mapping?: ModelMapping,
): CliGrokProxyModelSpec {
  const classifyId =
    mapping && mapping.to.trim().length > 0 ? mapping.to.trim() : id;
  const provider = mapping
    ? providerFromMapping(mapping.provider, classifyId)
    : providerForModelId(id);
  const windowProvider =
    mapping && mapping.provider.trim().length > 0
      ? mapping.provider.trim()
      : provider;
  const apiBackend = provider === "anthropic" ? "messages" : "chat_completions";
  const contextWindow = getContextWindowSize(windowProvider, classifyId);
  return {
    id,
    name: displayNameFor(id),
    apiBackend,
    contextWindow,
    maxCompletionTokens: contextWindow >= 1_000_000 ? 16_384 : 8_192,
    supportsReasoningEffort: supportsAdaptiveThinking(classifyId),
  };
}

async function loadRoutedMappings(
  configPath?: string,
): Promise<ModelMapping[]> {
  const resolvedPath = configPath ?? defaultProxyConfigPath();
  try {
    const config = await parseProxyConfigString(
      readFileSync(resolvedPath, "utf8"),
    );
    return (config.routing?.modelMappings ?? []).filter(
      (mapping) => mapping.from.trim().length > 0,
    );
  } catch {
    return [];
  }
}

async function loadRoutedModelIds(configPath?: string): Promise<string[]> {
  return (await loadRoutedMappings(configPath)).map((mapping) =>
    mapping.from.trim(),
  );
}

async function catalogGrokSpecs(
  configPath?: string,
): Promise<CliGrokProxyModelSpec[]> {
  const seen = new Set<string>();
  const specs: CliGrokProxyModelSpec[] = [];
  const routed = await loadRoutedMappings(configPath);
  const routedByFrom = new Map(
    routed.map((mapping) => [mapping.from.trim(), mapping]),
  );
  for (const id of [
    ...DEFAULT_PROXY_MODEL_IDS,
    ...routed.map((mapping) => mapping.from.trim()),
  ]) {
    if (id.startsWith("grok-") || seen.has(id)) {
      continue;
    }
    seen.add(id);
    specs.push(classifyGrokProxyModel(id, routedByFrom.get(id)));
  }
  return specs;
}

async function catalogModelIds(configPath?: string): Promise<string[]> {
  return (await catalogGrokSpecs(configPath)).map((spec) => spec.id);
}

function buildGrokModelBlock(
  spec: CliGrokProxyModelSpec,
  baseUrl: string,
): string {
  const lines = [
    `[model.${tomlKey(spec.id)}]`,
    `model = ${JSON.stringify(spec.id)}`,
    `name = ${JSON.stringify(spec.name)}`,
    `base_url = ${JSON.stringify(baseUrl)}`,
    `api_backend = ${JSON.stringify(spec.apiBackend)}`,
    `context_window = ${spec.contextWindow}`,
    `auto_compact_threshold_percent = 80`,
    `max_completion_tokens = ${spec.maxCompletionTokens}`,
    `supports_backend_search = false`,
  ];
  if (!spec.supportsReasoningEffort) {
    lines.push("supports_reasoning_effort = false");
  }
  if (spec.apiBackend === "messages") {
    lines.push(
      `extra_headers = { "x-api-key" = ${JSON.stringify(PLACEHOLDER_KEY)}, "anthropic-version" = ${JSON.stringify(ANTHROPIC_VERSION)} }`,
    );
  } else {
    lines.push(`api_key = ${JSON.stringify(PLACEHOLDER_KEY)}`);
  }
  return lines.join("\n");
}

async function buildGrokManagedBlock(
  baseUrl: string,
  configPath?: string,
): Promise<string> {
  const specs = await catalogGrokSpecs(configPath);
  const body = specs
    .map((spec) => buildGrokModelBlock(spec, baseUrl))
    .join("\n\n");
  return [
    GROK_BLOCK_BEGIN,
    "# Proxy catalog. Built-in grok-4.6 / grok-4.5 stay on xAI.",
    "# context_window is Grok's compaction limit and must be <= upstream.",
    "",
    body,
    GROK_BLOCK_END,
    "",
  ].join("\n");
}

function stripGrokManagedBlock(text: string): string {
  const blockRe = new RegExp(
    `\\n?${escapeRegExp(GROK_BLOCK_BEGIN)}[\\s\\S]*?${escapeRegExp(
      GROK_BLOCK_END,
    )}\\n?`,
    "g",
  );
  return text.replace(blockRe, "\n");
}

function extractManagedBaseUrl(text: string): string | undefined {
  const match = text.match(
    new RegExp(
      `${escapeRegExp(GROK_BLOCK_BEGIN)}[\\s\\S]*?base_url\\s*=\\s*"([^"]*)"`,
    ),
  );
  return match?.[1];
}

async function readGrokSnapshot(): Promise<CliGrokSnapshot | null> {
  const fs = await import("fs");
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(getGrokSnapshotPath(), "utf8"));
  } catch {
    return null;
  }
  if (!isUsableSnapshot(parsed, "originalExisted")) {
    logger.debug(
      "[proxy] Grok: ignoring a malformed snapshot rather than treating it as empty",
    );
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const originalExisted = record.originalExisted;
  const writtenBaseUrl = record.writtenBaseUrl;
  if (typeof originalExisted !== "boolean") {
    return null;
  }
  if (typeof writtenBaseUrl !== "string") {
    return null;
  }
  return { originalExisted, writtenBaseUrl };
}

export async function setGrokProxySettings(
  baseUrl: string,
  options?: CliProxyClientApplyOptions,
): Promise<boolean> {
  const fs = await import("fs");
  try {
    fs.accessSync(getGrokConfigDir());
  } catch {
    return false;
  }

  let original: string | null;
  try {
    original = fs.readFileSync(getGrokConfigPath(), "utf8");
  } catch (error) {
    if (!isMissingFileError(error)) {
      logger.warn(
        "[proxy] Grok: unable to read config.toml; leaving it untouched",
      );
      return false;
    }
    original = null;
  }

  const existingSnapshot = await readGrokSnapshot();
  if (existingSnapshot === null && fs.existsSync(getGrokSnapshotPath())) {
    logger.warn(
      "[proxy] Grok: snapshot file is unreadable; leaving config.toml untouched rather than overwriting with no way back",
    );
    return false;
  }

  const currentBlock = original
    ? original.includes(GROK_BLOCK_BEGIN)
      ? original.slice(
          original.indexOf(GROK_BLOCK_BEGIN),
          original.indexOf(GROK_BLOCK_END) === -1
            ? original.length
            : original.indexOf(GROK_BLOCK_END) + GROK_BLOCK_END.length,
        )
      : undefined
    : undefined;

  if (
    existingSnapshot === null ||
    shouldCaptureSnapshot({
      hasSnapshot: existingSnapshot !== null,
      written: existingSnapshot?.writtenBaseUrl,
      current: extractManagedBaseUrl(original ?? "") ?? currentBlock,
    })
  ) {
    fs.mkdirSync(join(homedir(), ".neurolink"), { recursive: true });
    await writeFileAtomic(
      getGrokSnapshotPath(),
      JSON.stringify(
        {
          originalExisted:
            existingSnapshot?.originalExisted ?? original !== null,
          writtenBaseUrl: baseUrl,
        } satisfies CliGrokSnapshot,
        null,
        2,
      ),
      0o600,
    );
  }

  const withoutBlock = original ? stripGrokManagedBlock(original) : "";
  const trimmed = withoutBlock.replace(/\s*$/, "\n");
  const next = `${trimmed}\n${await buildGrokManagedBlock(baseUrl, options?.configPath)}`;
  await writeFileAtomic(
    getGrokConfigPath(),
    next.startsWith("\n") && original === null
      ? next.replace(/^\n+/, "")
      : next,
    original === null ? 0o600 : undefined,
  );
  return true;
}

export async function clearGrokProxySettings(
  expectedBaseUrl?: string,
): Promise<boolean> {
  const fs = await import("fs");
  let current: string;
  try {
    current = fs.readFileSync(getGrokConfigPath(), "utf8");
  } catch {
    return false;
  }

  if (!current.includes(GROK_BLOCK_BEGIN)) {
    return false;
  }

  const configuredUrl = extractManagedBaseUrl(current);
  if (
    expectedBaseUrl &&
    configuredUrl !== undefined &&
    configuredUrl !== expectedBaseUrl
  ) {
    logger.debug(
      "[proxy] Grok clear: base URL is not the one we wrote, leaving it intact",
    );
    return false;
  }

  const snapshot = await readGrokSnapshot();
  if (snapshot === null) {
    logger.warn(
      "[proxy] Grok clear: no usable snapshot, leaving config.toml untouched rather than stripping a block we cannot prove we own",
    );
    return false;
  }

  const remainder = stripGrokManagedBlock(current).replace(/\s*$/, "\n");
  if (!snapshot.originalExisted && remainder.trim().length === 0) {
    fs.rmSync(getGrokConfigPath(), { force: true });
  } else {
    await writeFileAtomic(getGrokConfigPath(), remainder);
  }

  try {
    fs.rmSync(getGrokSnapshotPath(), { force: true });
  } catch {
    // next apply overwrites
  }
  return true;
}

export const grokConfigurator: CliProxyClientConfigurator = {
  id: "grok",
  displayName: "Grok Build",
  detect: async () => {
    const fs = await import("fs");
    try {
      fs.accessSync(getGrokConfigDir());
      return true;
    } catch {
      return false;
    }
  },
  // Grok appends `/messages` or `/chat/completions` to `base_url`, so it
  // takes the `/v1` door rather than the proxy root.
  apply: (proxyBaseUrl, options) =>
    setGrokProxySettings(`${proxyBaseUrl}/v1`, options),
  restore: (proxyBaseUrl) => clearGrokProxySettings(`${proxyBaseUrl}/v1`),
};

/** Test-only export (CLAUDE.md rule 15 determinism exception). See openCode.ts. */
export const __grokTestHooks = {
  getGrokConfigDir,
  getGrokConfigPath,
  getGrokSnapshotPath,
  setGrokProxySettings,
  clearGrokProxySettings,
  classifyGrokProxyModel,
  loadRoutedModelIds,
  catalogModelIds,
  buildGrokManagedBlock,
};
