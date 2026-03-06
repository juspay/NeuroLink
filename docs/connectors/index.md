---
id: connectors-index
title: Connector Catalog
sidebar_label: Connectors
---

# Connector Catalog

Connectors are applications built on NeuroLink that open a specific gateway — a new way for people or systems to access and experience AI.

Every connector follows the same pattern:

```
Input Event → NeuroLink Pipe → AI Processing → Output Action
```

The pipe handles provider dispatch, context building, tool execution, and memory. The connector decides what flows through it and what happens at each end.

---

## Production Connectors

| Connector                               | Status        | Gateway                                   | Provider                |
| --------------------------------------- | ------------- | ----------------------------------------- | ----------------------- |
| [Automatic](/docs/connectors/automatic) | ✅ Production | Consumer intelligence · Operations risk   | NeuroLink SDK           |
| [Tara](/docs/connectors/tara)           | ✅ Production | Engineering assistance · Self-improvement | Vertex AI via NeuroLink |
| [Yama](/docs/connectors/yama)           | ✅ Production | Code quality · Automated governance       | LiteLLM via NeuroLink   |

---

## Building Your Own Connector

Any application that imports NeuroLink and connects it to a data source or action surface is a connector. Study the production connectors above — then build yours.

Start with: [Quick Start →](/docs/getting-started/quick-start)
