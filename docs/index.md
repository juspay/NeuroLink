# 🧠 NeuroLink

Enterprise AI development platform with unified provider orchestration, production-grade tooling, and a polished CLI + SDK experience.

## What's New (Q4 2025)

- **Human-in-the-loop workflows** – Pause AI for user approval before risky actions. → [`features/hitl.md`](features/hitl.md)
- **Guardrails middleware** – Content filtering and safety checks for outputs. → [`features/guardrails.md`](features/guardrails.md)
- **Redis conversation export** – Export session history as JSON for analytics. → [`features/conversation-history.md`](features/conversation-history.md)
- **Multimodal chat** – Stream text + images with fallbacks. → [`features/multimodal-chat.md`](features/multimodal-chat.md)
- **Auto evaluation engine** – Automated scoring for every response. → [`features/auto-evaluation.md`](features/auto-evaluation.md)
- **Loop mode for CLI** – Persistent sessions, Redis auto-detect, and conversation memory. → [`features/cli-loop-sessions.md`](features/cli-loop-sessions.md)
- **Provider orchestration brain** – Smarter routing across 12+ providers. → [`features/provider-orchestration.md`](features/provider-orchestration.md)

## Quick Start

### CLI

```bash
# Guided provider onboarding
pnpm dlx @juspay/neurolink setup

# Persistent session with memory support

npx @juspay/neurolink loop
npx @juspay/neurolink stream "Outline a launch plan"
```

### SDK

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink({
  conversationMemory: { enabled: true, store: "redis" },
  enableOrchestration: true,
});

const result = await neurolink.generate({
  input: {
    text: "Summarise customer feedback",
    images: ["./screenshots/ui.png"],
  },
  enableEvaluation: true,
  region: "us-east-1",
});
```

### Configuration

```bash
# Minimal .env for Google AI Studio free tier
echo 'GOOGLE_AI_API_KEY="your-key"' >> .env
npx @juspay/neurolink status
```

## Core Capabilities

- **Multimodal by default** – Stream local or remote images alongside text prompts across supported providers.
- **Quality you can measure** – Auto evaluation, analytics export, guardrails middleware, and telemetry hooks.
- **CLI built for teams** – Loop sessions, setup wizard, config validation, and JSON output for pipelines.
- **Conversation memory everywhere** – Redis-backed session history, Mem0 integration, and export tooling.
- **Smarter orchestration** – Adaptive provider/model routing, regional preferences, and fallback heuristics.
- **Enterprise ready** – Proxy support, configuration management, audit-ready logging, and secure defaults.

## Documentation Map

| Start here                                   | Link                                                   |
| -------------------------------------------- | ------------------------------------------------------ |
| Getting started checklist                    | [`getting-started/index.md`](getting-started/index.md) |
| Feature deep dives                           | [`features/index.md`](features/index.md)               |
| CLI reference & loop mode                    | [`cli/index.md`](cli/index.md)                         |
| SDK API reference                            | [`sdk/index.md`](sdk/index.md)                         |
| Integrations (LiteLLM, SageMaker, MCP, Mem0) | [`LITELLM-INTEGRATION.md`](LITELLM-INTEGRATION.md)     |
| Configuration & troubleshooting              | [`reference/index.md`](reference/index.md)             |

## Next Steps

- Configure providers → [`getting-started/provider-setup.md`](getting-started/provider-setup.md)
- Explore evaluation & analytics → [`advanced/analytics.md`](advanced/analytics.md)
- Add Mem0 memory → [`MEM0_INTEGRATION.md`](MEM0_INTEGRATION.md)
- Join loop sessions guide → [`features/cli-loop-sessions.md`](features/cli-loop-sessions.md)

Need something else? Use the global search or open an issue on [GitHub](https://github.com/juspay/neurolink/issues).
