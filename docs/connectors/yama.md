---
id: yama
title: Yama
sidebar_label: Yama
---

# Yama

**Status:** ✅ Production
**Type:** Code review judge · Automated governance
**Stack:** CLI (pnpm yama) + NeuroLink SDK + LiteLLM + Bitbucket Server MCP

## Purpose

Yama is a CLI-driven code review connector. It fetches PR diffs from Bitbucket Server via MCP, routes them through NeuroLink with a LiteLLM provider, and posts structured inline comments grouped by focus area: Security, Runtime Correctness, Performance, and Code Quality. Yama also enhances PR descriptions with structured summaries.

## Stream Types

| Stream          | Direction | Description                                                 |
| --------------- | --------- | ----------------------------------------------------------- |
| PR diffs        | → Pipe    | File-by-file diffs fetched via Bitbucket MCP                |
| Code context    | → Pipe    | Code search, file content, repo structure                   |
| Memory bank     | → Pipe    | Project standards from `memory-bank/*.md`                   |
| Inline comments | Pipe →    | Posted to Bitbucket PR with line references                 |
| PR description  | Pipe →    | Structured summary appended to PR description               |
| Analytics       | Pipe →    | Token usage, tool calls, cost tracked to `.yama/analytics/` |

## Input / Output Contract

### Invocation

```bash
pnpm yama review --branch feature/my-branch
pnpm yama review --pr 1234
```

### Input (from Bitbucket MCP)

```typescript
// PR diff — fetched per file
get_pull_request_diff({
  workspace: "PROJ",
  repository: "my-repo",
  pull_request_id: 1234,
  context_lines: 3,
  exclude_patterns: [
    "*.lock",
    "*.svg",
    "*.min.js",
    "*.map",
    "*.png",
    "*.jpg",
    "package-lock.json",
    "pnpm-lock.yaml",
  ],
});
```

### Output (to Bitbucket via MCP)

```typescript
// Inline comment posted per finding
add_comment({
  workspace: "PROJ",
  repository: "my-repo",
  pull_request_id: 1234,
  comment_text: "[SECURITY][CRITICAL] SQL injection risk...",
  file_path: "src/api/orders.ts",
  line_number: 42,
  line_type: "ADDED",
});
```

### Focus Areas and Severity

| Focus Area          | Priority | What It Checks                                |
| ------------------- | -------- | --------------------------------------------- |
| Security Analysis   | CRITICAL | Injection, auth bypass, data exposure         |
| Runtime Correctness | MAJOR    | Null refs, race conditions, wrong assumptions |
| Performance Review  | MAJOR    | N+1 queries, blocking ops, memory leaks       |
| Code Quality        | MAJOR    | Duplication, naming, maintainability          |

## NeuroLink Integration

```typescript
// yama.config.yaml
provider: litellm
model: private-large
temperature: 0.3
max_tokens: 60000
timeout: 600000  # 10 minutes
retry_attempts: 3
memory:
  enabled: true
  max_turns: 300
```

```typescript
// Yama instantiates NeuroLink with LiteLLM
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink({
  defaultProvider: "litellm",
  defaultModel: "private-large",
});
```

**Features used:**

- LiteLLM provider (NeuroLink's gateway to private model deployments)
- Bitbucket Server MCP (read-only tool set)
- File-based memory bank (`memory-bank/*.md` for project context)
- Knowledge base (`.yama/knowledge-base.md` — max 50 entries, auto-summarized)
- Analytics export to `.yama/analytics/`

## Gateway Unlocked

Yama gives engineering teams:

- **Security gate** — CRITICAL findings block merge (configurable)
- **Consistent reviews** — every PR gets the same analysis, no reviewer fatigue
- **Context-aware** — reads memory bank for project standards before reviewing
- **Low noise** — excludes lock files, images, minified assets automatically
- **Cost-bounded** — hard limits on review duration (15min) and cost ($2)

## Operational Notes

- **File strategy:** Reviews files one-by-one (not the entire diff at once) — more accurate, fits within context limits
- **Smart filtering:** Auto-excludes lock files, images, minified JS, source maps
- **PR guard:** Calls `get_branch()` first — skips review if no open PR or if target branch is not `main`
- **Memory bank:** Reads `memory-bank/project-overview.md`, `architecture.md`, `coding-standards.md`, `security-guidelines.md` before each review
- **Knowledge base:** Accumulates review learnings in `.yama/knowledge-base.md`; auto-summarized when > 50 entries
- **Cost guard:** Warning at $1.50, hard stop at $2.00 per review
- **Analytics:** Tool calls, AI decisions, and token usage exported to `.yama/analytics/` as JSON
