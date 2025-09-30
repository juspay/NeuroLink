# 🧠 NeuroLink

[![NPM Version](https://img.shields.io/npm/v/@juspay/neurolink)](https://www.npmjs.com/package/@juspay/neurolink)
[![Downloads](https://img.shields.io/npm/dm/@juspay/neurolink)](https://www.npmjs.com/package/@juspay/neurolink)
[![GitHub Stars](https://img.shields.io/github/stars/juspay/neurolink)](https://github.com/juspay/neurolink/stargazers)
[![License](https://img.shields.io/npm/l/@juspay/neurolink)](https://github.com/juspay/neurolink/blob/release/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![CI](https://github.com/juspay/neurolink/workflows/CI/badge.svg)](https://github.com/juspay/neurolink/actions)

Enterprise AI development platform with unified provider access, production-ready tooling, and an opinionated factory architecture. NeuroLink ships as both a TypeScript SDK and a professional CLI so teams can build, operate, and iterate on AI features quickly.

## What's New (Q4 2025)

- **Human-in-the-loop workflows** – Pause generation for user approval/input before tool execution or continuing. → [`docs/features/hitl.md`](docs/features/hitl.md)
- **Guardrails middleware** – Block PII, profanity, and unsafe content with built-in content filtering. → [`docs/features/guardrails.md`](docs/features/guardrails.md)
- **Context summarization** – Automatic conversation compression for long-running sessions with memory. → [`docs/features/context-summarization.md`](docs/features/context-summarization.md)
- **Redis conversation export** – Export full session history as JSON for analytics and debugging. → [`docs/features/conversation-history.md`](docs/features/conversation-history.md)

> **Q3 highlights** (multimodal chat, auto-evaluation, loop sessions, orchestration) are now in [Platform Capabilities](#platform-capabilities-at-a-glance) below.

## Get Started in Two Steps

```bash
# 1. Run the interactive setup wizard (select providers, validate keys)
pnpm dlx @juspay/neurolink setup

# 2. Start generating with automatic provider selection
npx @juspay/neurolink generate "Write a launch plan for multimodal chat"
```

Need a persistent workspace? Launch loop mode:

```bash
npx @juspay/neurolink loop --enable-conversation-memory
```

Skip the wizard and configure manually? See [`docs/getting-started/provider-setup.md`](docs/getting-started/provider-setup.md).

## CLI & SDK Essentials

`neurolink` CLI mirrors the SDK so teams can script experiments and codify them later.

```bash
# Discover available providers and models
npx @juspay/neurolink status
npx @juspay/neurolink models list --provider google-ai

# Route to a specific provider/model
npx @juspay/neurolink generate "Summarize customer feedback" \
  --provider azure --model gpt-4o-mini

# Turn on analytics + evaluation for observability
npx @juspay/neurolink generate "Draft release notes" \
  --enable-analytics --enable-evaluation --format json
```

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink({
  conversationMemory: {
    enabled: true,
    store: "redis",
  },
  enableOrchestration: true,
});

const result = await neurolink.generate({
  input: {
    text: "Create a multimodal onboarding script",
    images: ["./diagrams/architecture.png"],
  },
  enableEvaluation: true,
  region: "us-east-1",
});

console.log(result.content);
console.log(result.evaluation?.overallScore);
```

Full command and API breakdown lives in [`docs/cli/commands.md`](docs/cli/commands.md) and [`docs/sdk/api-reference.md`](docs/sdk/api-reference.md).

## Platform Capabilities at a Glance

| Capability               | Highlights                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **Provider unification** | 12+ providers with automatic fallback, cost-aware routing, provider orchestration (Q3).       |
| **Multimodal pipeline**  | Stream images + text across providers with local/remote assets (Q3 2025).                     |
| **Quality & governance** | Auto-evaluation engine (Q3), guardrails middleware (Q4), HITL workflows (Q4), audit logging.  |
| **Memory & context**     | Conversation memory, Mem0 integration, Redis history export (Q4), context summarization (Q4). |
| **CLI tooling**          | Loop sessions (Q3), setup wizard, config validation, Redis auto-detect, JSON output.          |
| **Enterprise ops**       | Proxy support, regional routing (Q3), telemetry hooks, configuration management.              |
| **Tool ecosystem**       | MCP auto discovery, LiteLLM hub access, SageMaker custom deployment, web search.              |

## Documentation Map

| Area            | When to Use                                     | Link                                                             |
| --------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| Getting started | Install, configure, run first prompt            | [`docs/getting-started/index.md`](docs/getting-started/index.md) |
| Feature guides  | Understand new functionality front-to-back      | [`docs/features/index.md`](docs/features/index.md)               |
| CLI reference   | Command syntax, flags, loop sessions            | [`docs/cli/index.md`](docs/cli/index.md)                         |
| SDK reference   | Classes, methods, options                       | [`docs/sdk/index.md`](docs/sdk/index.md)                         |
| Integrations    | LiteLLM, SageMaker, MCP, Mem0                   | [`docs/LITELLM-INTEGRATION.md`](docs/LITELLM-INTEGRATION.md)     |
| Operations      | Configuration, troubleshooting, provider matrix | [`docs/reference/index.md`](docs/reference/index.md)             |
| Visual demos    | Screens, GIFs, interactive tours                | [`docs/demos/index.md`](docs/demos/index.md)                     |

## Integrations

- **LiteLLM 100+ model hub** – Unified access to third-party models via LiteLLM routing. → [`docs/LITELLM-INTEGRATION.md`](docs/LITELLM-INTEGRATION.md)
- **Amazon SageMaker** – Deploy and call custom endpoints directly from NeuroLink CLI/SDK. → [`docs/SAGEMAKER-INTEGRATION.md`](docs/SAGEMAKER-INTEGRATION.md)
- **Mem0 conversational memory** – Persistent semantic memory with vector store support. → [`docs/MEM0_INTEGRATION.md`](docs/MEM0_INTEGRATION.md)
- **Enterprise proxy & security** – Configure outbound policies and compliance posture. → [`docs/ENTERPRISE-PROXY-SETUP.md`](docs/ENTERPRISE-PROXY-SETUP.md)
- **Configuration automation** – Manage environments, regions, and credentials safely. → [`docs/CONFIGURATION-MANAGEMENT.md`](docs/CONFIGURATION-MANAGEMENT.md)
- **MCP tool ecosystem** – Auto-discover Model Context Protocol tools and extend workflows. → [`docs/advanced/mcp-integration.md`](docs/advanced/mcp-integration.md)

## Contributing & Support

- Bug reports and feature requests → [GitHub Issues](https://github.com/juspay/neurolink/issues)
- Development workflow, testing, and pull request guidelines → [`docs/development/contributing.md`](docs/development/contributing.md)
- Documentation improvements → open a PR referencing the [documentation matrix](docs/tracking/FEATURE-DOC-MATRIX.md).

---

NeuroLink is built with ❤️ by Juspay. Contributions, questions, and production feedback are always welcome.
