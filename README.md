# NeuroLink

**The pipe layer for the AI nervous system.**

AI intelligence flows as streams — tokens, tool calls, memory, voice, documents.
NeuroLink is the vascular layer that carries these streams from where they are
generated (LLM providers: the neurons) to where they are needed (connectors: the organs).

```typescript
import { NeuroLink } from "@juspay/neurolink";

const pipe = new NeuroLink();

// Everything is a stream
const result = await pipe.stream({ input: { text: "Hello" } });
for await (const chunk of result.stream) {
  if ("content" in chunk) {
    process.stdout.write(chunk.content);
  }
}
```

**[→ Docs](https://docs.neurolink.ink) · [→ Quick Start](https://docs.neurolink.ink/docs/getting-started/quick-start) · [→ npm](https://www.npmjs.com/package/@juspay/neurolink)**

---

NeuroLink is built with ❤️ by Juspay. Contributions, questions, and production feedback are always welcome.

Hello
