/**
 * SystemPromptInjector — injects Claude Code session context blocks into the
 * system prompt so that the request looks like it originates from a genuine
 * Claude Code session (IDE metadata, session timestamp, etc.).
 *
 * This is designed for "cloaking" proxy requests to appear as native Claude
 * Code interactions. Only applies to OAuth accounts — API key accounts are
 * skipped since they do not need session mimicry.
 */

import type {
  CloakingPlugin,
  CloakingContext,
  SystemPromptInjectorOptions,
} from "../../../types/index.js";

const DEFAULT_OPTIONS: Required<Omit<SystemPromptInjectorOptions, "preamble">> =
  {
    ide: "vscode",
    ideVersion: "1.96.2",
    platform: "darwin",
    cwd: "/Users/user/project",
  };

/** Cached session start timestamp — set once on first call, reused for the process lifetime. */
let cachedSessionStartTs: string | undefined;

function generateSessionBlock(
  opts: Required<Omit<SystemPromptInjectorOptions, "preamble">>,
): string {
  if (!cachedSessionStartTs) {
    cachedSessionStartTs = new Date().toISOString();
  }
  return [
    "<env>",
    `Working directory: ${opts.cwd}`,
    "Is directory a git repo: Yes",
    `Platform: ${opts.platform}`,
    `IDE: ${opts.ide} ${opts.ideVersion}`,
    `Session start: ${cachedSessionStartTs}`,
    "</env>",
  ].join("\n");
}

export function createSystemPromptInjector(
  options: SystemPromptInjectorOptions = {},
): CloakingPlugin {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return {
    name: "system-prompt-injector",
    order: 30,
    enabled: true,

    async transformRequest(ctx: CloakingContext): Promise<CloakingContext> {
      // Only apply to OAuth accounts — API key accounts skip session mimicry
      if (ctx.account.type === "api_key") {
        return ctx;
      }

      const sessionBlock = generateSessionBlock(opts);
      const preamble = (options.preamble ?? "").trim();

      const existingSystem = ctx.request.body.system;

      // Build the injected text from preamble + session block
      const injectedParts: string[] = [];
      if (preamble) {
        injectedParts.push(preamble);
      }
      injectedParts.push(sessionBlock);
      const injectedText = injectedParts.join("\n\n");

      let newSystem: string | Array<{ type: string; text: string }>;

      if (Array.isArray(existingSystem)) {
        // Preserve structured blocks — prepend injected content as a new text block
        const injectedBlock = { type: "text" as const, text: injectedText };
        newSystem = [
          injectedBlock,
          ...(existingSystem as Array<{ type: string; text: string }>),
        ];
      } else {
        // String or undefined — concatenate as before
        const existing =
          typeof existingSystem === "string" ? existingSystem : "";
        const parts: string[] = [injectedText];
        if (existing) {
          parts.push(existing);
        }
        newSystem = parts.join("\n\n");
      }

      return {
        ...ctx,
        request: {
          ...ctx.request,
          body: {
            ...ctx.request.body,
            system: newSystem,
          },
        },
      };
    },
  };
}
