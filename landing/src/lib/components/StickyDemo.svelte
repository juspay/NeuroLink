<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { activeSection } from "$lib/stores/canvasState";

  let sectionEl: HTMLElement;
  let observer: IntersectionObserver;

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) activeSection.set("flow");
      },
      { threshold: 0.4 },
    );
    observer.observe(sectionEl);
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  const STAGES = [
    {
      id: "context",
      label: "1. Context Building",
      tag: "RAG · Memory · Files",
      desc: "RAG retrieval, memory lookup, and file processing merge into the prompt before the model fires.",
      code: `const result = await link.generate({
  prompt: query,
  rag: { files: ['./docs/guide.md'] },
  memory: { enabled: true },
});`,
    },
    {
      id: "budget",
      label: "2. Budget Check",
      tag: "Context Window",
      desc: "BudgetChecker validates the assembled context fits the model's window. Triggers auto-compaction when over 80%.",
      code: `// Automatic — no config needed
// Triggers when context > 80% of window
// 4-stage: prune → dedup → summarize → truncate`,
    },
    {
      id: "dispatch",
      label: "3. Provider Dispatch",
      tag: "13 Stream Sources",
      desc: "ProviderRegistry routes to the correct neuron. Switch providers with one line — the rest of the flow is unchanged.",
      code: `const link = new NeuroLink({ defaultProvider: 'anthropic' });
// Switch instantly — same flow, different neuron:
// defaultProvider: 'openai' | 'gemini' | 'bedrock'`,
    },
    {
      id: "stream",
      label: "4. Stream Emission",
      tag: "Continuous Flow",
      desc: "Tokens flow as an async iterable. generate() is stream() collected — there is only stream().",
      code: `// Everything is a stream
for await (const token of link.stream({ prompt })) {
  process.stdout.write(token); // arrive one by one
}`,
    },
    {
      id: "tools",
      label: "5. Tool Interception",
      tag: "58+ MCP Servers",
      desc: "When the model calls a tool, the stream pauses, the MCP tool executes, the result injects, and the stream continues.",
      code: `await link.addExternalMCPServer('github', {
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
});`,
    },
    {
      id: "observe",
      label: "6. Observability",
      tag: "Langfuse · OpenTelemetry",
      desc: "Every stage emits spans. Full trace: context build → model → tools → memory persistence.",
      code: `const link = new NeuroLink({
  observability: {
    langfuse: { enabled: true, publicKey: '...', secretKey: '...' },
  },
});`,
    },
  ];

  let activeIdx = $state(0);
  let codeVisible = $state(true);

  function setActive(idx: number) {
    if (idx === activeIdx) return;
    codeVisible = false;
    setTimeout(() => {
      activeIdx = idx;
      codeVisible = true;
    }, 180);
  }
</script>

<section
  bind:this={sectionEl}
  data-topology-phase="flow"
  data-flow-section
  class="section-flow py-24 md:py-36"
>
  <div class="max-w-[960px] mx-auto px-6">
    <!-- Section header -->
    <p class="label-eyebrow mb-4">THE FLOW</p>
    <h2 class="headline-section font-display mb-4">
      Six stages.<br />One continuous flow.
    </h2>
    <p class="body-text max-w-lg mb-16">
      Every request follows the same flow. Hover a stage to see how it works.
    </p>

    <!-- Main layout: flow left, code right -->
    <div class="flow-layout">
      <!-- Left: flow diagram -->
      <div class="flow-diagram">
        <!-- Single continuous connector line spanning all stages -->
        <div class="flow-line" aria-hidden="true">
          <div class="flow-signal-dot"></div>
        </div>

        {#each STAGES as stage, i}
          <button
            class="flow-stage"
            class:flow-stage--active={activeIdx === i}
            onclick={() => setActive(i)}
            type="button"
          >
            <div class="flow-stage-inner">
              <div
                class="flow-node"
                class:flow-node--active={activeIdx === i}
              ></div>
              <div class="flow-stage-text">
                <span class="flow-stage-label">{stage.label}</span>
                <span class="flow-stage-tag">{stage.tag}</span>
              </div>
            </div>
          </button>
        {/each}
      </div>

      <!-- Right: code + description panel -->
      <div class="flow-panel" class:flow-panel--visible={codeVisible}>
        <p class="flow-desc">{STAGES[activeIdx].desc}</p>
        <pre class="flow-code"><code>{STAGES[activeIdx].code}</code></pre>
      </div>
    </div>
  </div>
</section>

<style>
  .flow-layout {
    display: flex;
    gap: 4rem;
    align-items: flex-start;
  }

  @media (max-width: 767px) {
    .flow-layout {
      flex-direction: column;
      gap: 2rem;
    }
  }

  /* --- Flow diagram --- */
  .flow-diagram {
    flex-shrink: 0;
    width: 100%;
    max-width: min(380px, 100%);
    position: relative;
  }

  /* Single vertical line spanning from first node centre to last node centre */
  .flow-line {
    position: absolute;
    left: calc(1rem + 5px);
    top: calc(0.875rem + 6px);
    bottom: calc(0.875rem + 6px);
    width: 2px;
    background: rgba(0, 240, 255, 0.2);
    overflow: hidden;
    z-index: 0;
  }

  .flow-stage {
    position: relative;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    z-index: 1;
  }

  .flow-stage-inner {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1rem;
    border: 1px solid transparent;
    border-radius: 8px;
    transition:
      border-color 0.2s,
      background 0.2s;
  }

  .flow-stage:hover .flow-stage-inner,
  .flow-stage--active .flow-stage-inner {
    border-color: rgba(0, 240, 255, 0.45);
    background: rgba(0, 240, 255, 0.08);
    box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.05);
  }

  /* Animated signal dot travelling down the line */
  .flow-signal-dot {
    width: 4px;
    height: 12px;
    border-radius: 4px;
    background: var(--color-nl-sky);
    box-shadow: 0 0 10px var(--color-nl-sky);
    margin-left: -1px;
    animation: signal-flow 2.4s linear infinite;
  }

  @keyframes signal-flow {
    from {
      transform: translateY(-4px);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }

  /* Stage node dot */
  .flow-node {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid rgba(0, 240, 255, 0.4);
    background: rgba(0, 5, 15, 0.8);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .flow-node--active,
  .flow-stage:hover .flow-node {
    border-color: var(--color-nl-sky);
    box-shadow:
      0 0 15px rgba(0, 240, 255, 0.5),
      inset 0 0 8px rgba(0, 240, 255, 0.4);
    background: rgba(0, 240, 255, 0.2);
  }

  .flow-stage-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #ffffff;
    letter-spacing: -0.005em;
  }

  .flow-stage-tag {
    display: block;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-nl-accent-lighter);
    margin-top: 4px;
  }

  /* --- Code / description panel (cross-fade on tab switch only) --- */
  .flow-panel {
    flex: 1;
    opacity: 0;
    transform: translateY(6px);
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .flow-panel--visible {
    opacity: 1;
    transform: translateY(0);
  }

  .flow-desc {
    font-size: 0.9375rem;
    line-height: 1.7;
    color: var(--color-text-body);
    margin-bottom: 1.25rem;
  }

  .flow-code {
    background: var(--color-ds-surface-1);
    border-left: 2px solid var(--color-nl-sky);
    border-radius: 0 12px 12px 0;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    padding: 1.5rem 1.75rem;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.8125rem;
    line-height: 1.65;
    color: var(--color-text-code);
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
    overflow-x: auto;
    white-space: pre;
  }
</style>
