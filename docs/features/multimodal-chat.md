# Multimodal Chat Experiences

NeuroLink 7.47.0 introduces full multimodal pipelines so you can mix text, URLs, and local images in a single interaction. The CLI, SDK, and loop sessions all use the same message builder, ensuring parity across workflows.

## What You Get

- **Unified CLI flag** – `--image` accepts multiple file paths or HTTPS URLs per request.
- **SDK parity** – pass `input.images` (buffers, file paths, or URLs) and stream structured outputs.
- **Provider fallbacks** – orchestration automatically retries compatible multimodal models.
- **Streaming support** – `neurolink stream` renders partial responses while images upload in the background.

## Supported Providers & Models

| Provider               | Recommended Models                       | Notes                                                     |
| ---------------------- | ---------------------------------------- | --------------------------------------------------------- |
| `google-ai`, `vertex`  | `gemini-2.5-pro`, `gemini-2.5-flash`     | Local files and URLs supported.                           |
| `openai`, `azure`      | `gpt-4o`, `gpt-4o-mini`                  | Requires `OPENAI_API_KEY` or Azure deployment name + key. |
| `anthropic`, `bedrock` | `claude-3.5-sonnet`, `claude-3.7-sonnet` | Bedrock needs region + credentials.                       |
| `litellm`              | Any upstream multimodal model            | Ensure LiteLLM server exposes `vision` capability.        |

> Use `npx @juspay/neurolink models list --capability vision` to see the full list from `config/models.json`.

## Prerequisites

1. Provider credentials with vision/multimodal permissions.
2. Latest CLI (`npm`, `pnpm`, or `npx`) or SDK `>=7.47.0`.
3. Optional: Redis if you want images stored alongside loop-session history.

## CLI Quick Start

```bash
# Attach a local file (auto-converted to base64)
npx @juspay/neurolink generate "Describe this interface" \
  --image ./designs/dashboard.png --provider google-ai

# Reference a remote URL (downloaded on the fly)
npx @juspay/neurolink generate "Summarise these guidelines" \
  --image https://example.com/policy.pdf --provider openai --model gpt-4o

# Mix multiple images and enable analytics/evaluation
npx @juspay/neurolink generate "QA review" \
  --image ./screenshots/before.png \
  --image ./screenshots/after.png \
  --enableAnalytics --enableEvaluation --format json
```

### Streaming & Loop Sessions

```bash
# Stream while uploading a diagram
npx @juspay/neurolink stream "Explain this architecture" \
  --image ./diagrams/system.png

# Persist images inside loop mode (Redis auto-detected when available)
npx @juspay/neurolink loop --enable-conversation-memory
> set provider google-ai
> generate Compare the attached charts --image ./charts/q3.png
```

## SDK Usage

```typescript
import { readFileSync } from "node:fs";
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink({ enableOrchestration: true });

const result = await neurolink.generate({
  input: {
    text: "Provide a marketing summary of these screenshots",
    images: [
      readFileSync("./assets/homepage.png"),
      "https://example.com/reports/nps-chart.png",
    ],
  },
  provider: "google-ai",
  enableEvaluation: true,
  region: "us-east-1",
});

console.log(result.content);
console.log(result.evaluation?.overallScore);
```

Use `stream()` with the same structure when you need incremental tokens:

```typescript
const stream = await neurolink.stream({
  input: {
    text: "Walk through the attached floor plan",
    images: ["./plans/level1.jpg"],
  },
  provider: "openai",
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text ?? "");
}
```

## Configuration & Tuning

- **Image sources** – Local paths are resolved relative to `process.cwd()`. URLs must be HTTPS.
- **Size limits** – Providers cap images at ~20 MB. Resize or compress large assets before sending.
- **Multiple images** – Order matters; the builder interleaves captions in the order provided.
- **Region routing** – Set `region` on each request (e.g., `us-east-1`) for providers that enforce locality.
- **Loop sessions** – Images uploaded during `loop` are cached per session; call `clear session` to reset.

## Best Practices

- Provide short captions in the prompt describing each image (e.g., “see `before.png` on the left”).
- Combine analytics + evaluation to benchmark multimodal quality before rolling out widely.
- Cache remote assets locally if you reuse them frequently to avoid repeated downloads.
- Stream when presenting content to end-users; use `generate` when you need structured JSON output.

## Troubleshooting

| Symptom                            | Action                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `Image not found`                  | Check relative paths from the directory where you invoked the CLI.                |
| `Provider does not support images` | Switch to a model listed in the table above or enable orchestration.              |
| `Error downloading image`          | Ensure the URL responds with status 200 and does not require auth.                |
| `Large response latency`           | Pre-compress images and reduce resolution to under 2 MP when possible.            |
| `Streaming ends early`             | Disable tools (`--disableTools`) to avoid tool calls that may not support vision. |

## Related Features

**Q4 2025 Features:**

- [Guardrails Middleware](guardrails.md) – Content filtering for multimodal outputs
- [Auto Evaluation](auto-evaluation.md) – Quality scoring for vision-based responses

**Documentation:**

- [CLI Commands](../cli/commands.md) – CLI flags & options
- [SDK API Reference](../sdk/api-reference.md) – Generate/stream APIs
- [Troubleshooting](../TROUBLESHOOTING.md) – Extended error catalogue
