/**
 * Shared helpers for the `continuous-test-suite-mcp-*.ts` family.
 *
 * Extracted from `continuous-test-suite-mcp.ts` during the May 2026 mcp.ts
 * split. All cross-Part state lives here so the Part-specific files
 * (mcp-sdk.ts, mcp-cli.ts, mcp-infra.ts, …) can stay single-purpose.
 *
 * **Side effects on import:**
 *   - Reads `process.argv` once for `--provider=` / `--model=` flags.
 *   - Reads provider/model env vars (TEST_PROVIDER, TEST_MODEL,
 *     <PROVIDER>_MODEL).
 *
 * This is intentional — every importer in this family must see the same
 * provider/model selection regardless of import order. The trade-off is
 * that mutating `process.env` / `process.argv` after import has no effect
 * on the resolved `TEST_CONFIG`. Callers needing fresh per-call
 * resolution should instead parse argv themselves (the per-suite harness
 * in `harness.ts` already does that). Don't import this module from a
 * unit test that mocks env mid-run.
 */

const PROVIDER_MAX_TOKENS: Record<string, number> = {
  anthropic: 8192,
  vertex: 10000,
  "google-ai-studio": 10000,
  openai: 16384,
  bedrock: 8192,
  ollama: 4096,
  openrouter: 4096,
  // OpenAI-compat providers added 2026
  deepseek: 4096,
  "nvidia-nim": 8192,
  "lm-studio": 1024,
  llamacpp: 1024,
  or: 4096,
  litellm: 16384,
};

const PROVIDER_MODEL_ENV_MAP: Record<string, string> = {
  litellm: "LITELLM_MODEL",
  openai: "OPENAI_MODEL",
  vertex: "VERTEX_MODEL",
  bedrock: "BEDROCK_MODEL",
  "google-ai-studio": "GOOGLE_AI_MODEL",
  "google-ai": "GOOGLE_AI_MODEL",
  azure: "AZURE_OPENAI_MODEL",
  anthropic: "ANTHROPIC_MODEL",
  mistral: "MISTRAL_MODEL",
  ollama: "OLLAMA_MODEL",
};

function parseCliArgs(): { provider?: string; model?: string } {
  const args = process.argv.slice(2);
  let provider: string | undefined;
  let model: string | undefined;
  for (const arg of args) {
    if (arg.startsWith("--provider=")) {
      provider = arg.split("=")[1];
    }
    if (arg.startsWith("--model=")) {
      model = arg.split("=")[1];
    }
  }
  return { provider, model };
}

function resolveTestModel(
  provider: string,
  cliModel: string | undefined,
): string | undefined {
  if (cliModel) {
    return cliModel;
  }
  if (process.env.TEST_MODEL) {
    return process.env.TEST_MODEL;
  }
  const envKey = PROVIDER_MODEL_ENV_MAP[provider];
  return envKey ? process.env[envKey] : undefined;
}

const cli = parseCliArgs();

export type McpTestConfig = {
  provider: string;
  model?: string;
  maxTokens: number;
  timeout: number;
};

export const TEST_CONFIG: McpTestConfig = (() => {
  const provider = cli.provider || process.env.TEST_PROVIDER || "vertex";
  // Match the suite-wide default used in the other continuous-test-suite-*
  // files: fall back to 1024 (not 4096) for unmapped providers. Keeps token
  // budgets consistent across suites and avoids zeroing out the input budget
  // on small-context-window providers.
  const maxTokens = PROVIDER_MAX_TOKENS[provider] || 1024;
  return {
    provider,
    model: resolveTestModel(provider, cli.model),
    maxTokens,
    timeout: 60000,
  };
})();

/**
 * Inter-test pause used between real-API calls to dodge per-minute rate
 * limits. OpenAI's free-tier limits demand a minute; everything else gets
 * 10 seconds.
 */
export const INTER_TEST_DELAY_MS =
  TEST_CONFIG.provider === "openai" ? 60000 : 10000;

/** Build the minimal SDK options bag for a generate()/stream() call. */
export function buildBaseSDKOptions(): { provider: string; model?: string } {
  const options: { provider: string; model?: string } = {
    provider: TEST_CONFIG.provider,
  };
  if (TEST_CONFIG.model) {
    options.model = TEST_CONFIG.model;
  }
  return options;
}

/** Sleep for `ms` milliseconds. Returns a Promise. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
