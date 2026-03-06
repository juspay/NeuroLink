---
id: tara
title: Tara
sidebar_label: Tara
---

# Tara

**Status:** ✅ Production
**Type:** Engineering assistant · Self-improving AI agent
**Stack:** Slack Bolt + NeuroLink SDK + Vertex AI + Redis + PostgreSQL

## Purpose

Tara is a Slack-native AI assistant for engineering teams. She receives messages and file attachments in Slack, routes them through NeuroLink's pipe with full MCP tool access (Bitbucket, JIRA, GitHub, Figma, OpenObserve), and responds with streaming answers or structured PDF reports. Each Slack thread gets its own isolated NeuroLink instance with Redis-backed conversation memory.

## Stream Types

| Stream            | Direction    | Description                                                           |
| ----------------- | ------------ | --------------------------------------------------------------------- |
| Slack DM messages | → Pipe       | User text + file attachments via Slack Assistant API                  |
| @mention events   | → Pipe       | Channel messages where user mentions @tara                            |
| Attached files    | → Pipe       | PDFs, images, code files, CSV, Word — 16+ types via ProcessorRegistry |
| Streaming tokens  | Pipe →       | Real-time token stream posted to Slack thread                         |
| PDF reports       | Pipe →       | Structured JSON → PDF, uploaded to Slack                              |
| Tool results      | Pipe → Slack | PR data, JIRA tickets, code search, Figma assets                      |

## Input / Output Contract

### Input (Slack Events)

```typescript
{
  // User message
  text: string,
  user: string,          // Slack user ID
  channel: string,       // Channel or DM ID
  ts: string,            // Thread timestamp
  thread_ts?: string,    // Parent thread if reply

  // Optional file attachments
  files?: Array<{
    name: string,
    mimetype: string,    // Auto-detected by FileDetector
    url_private: string  // Slack download URL
  }>
}
```

### Output (Slack messages)

```typescript
// Streaming response — posted progressively
{
  text: string,          // Accumulated tokens
  blocks: Block[],       // Slack block kit UI
  thread_ts: string      // Always threaded
}

// PDF report (for complex analysis)
{
  filename: "tara-report-{timestamp}.pdf",
  content: Buffer,       // PDF binary
  initial_comment: string  // Summary message
}
```

## NeuroLink Integration

```typescript
import { NeuroLink } from "@juspay/neurolink";

// Per-thread instance — LRU pool, max 100 concurrent
const neurolink = new NeuroLink({
  defaultProvider: "vertex",
  memory: {
    type: "redis",
    prefix: `thread:${sessionId}:`,
  },
  observability: {
    langfuse: { enabled: true },
  },
});

// Streaming response
for await (const token of neurolink.stream({
  prompt: userMessage,
  files: attachedFiles, // Processed by FileDetector + ProcessorRegistry
  tools: { ...mcpTools }, // Bitbucket, JIRA, GitHub, Figma, OpenObserve
  memory: { enabled: true },
})) {
  await slackClient.chat.update({ text: accumulated });
}
```

**Features used:**

- `neurolink.stream()` — streaming Slack responses
- `neurolink.generate()` — structured JSON for PDF reports
- Redis conversation memory (per-thread isolation)
- Multimodal file processing (FileDetector + ProcessorRegistry — 16+ file types)
- MCP servers: Bitbucket Server, JIRA, GitHub, Figma, OpenObserve
- Langfuse observability with session/user/conversation context enrichment

## MCP Tools

| Server           | Tools Available                                         |
| ---------------- | ------------------------------------------------------- |
| Bitbucket Server | PR review, branch ops, code search, file content, diffs |
| JIRA             | Ticket ops, issue search, project queries               |
| GitHub           | Repository data                                         |
| Figma            | Design files, component inspection                      |
| OpenObserve      | Traces, logs, metrics queries                           |

## Gateway Unlocked

Tara gives engineering teams:

- **Codebase Q&A** — ask questions, get answers with code references
- **PR assistance** — review PRs, generate descriptions, search context
- **JIRA integration** — create, update, query tickets from Slack
- **Autonomous tasks** — multi-step coding tasks via tool loops
- **PDF reports** — long-form analysis delivered as downloadable documents

## Operational Notes

- **Latency:** 6.9s–70.3s — exceeds Slack's 3s ACK deadline. Handled via `unhandledRequestHandler` returning 200 immediately, then posting response when ready
- **Concurrency:** LRU pool of 100 NeuroLink instances, one per active Slack thread
- **File processing:** All files downloaded and processed locally before sending to AI — unsupported formats return helpful error messages
- **Async tasks:** BullMQ task queue for long-running operations (title generation, DB sync)
- **Session persistence:** Thread titles auto-generated and stored in PostgreSQL; conversation state in Redis
- **Observability:** Full OpenTelemetry traces, Langfuse AI spans with userId + sessionId + conversationId context
