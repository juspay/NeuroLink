<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { activeSection } from "$lib/stores/canvasState";

  let sectionEl: HTMLElement;
  let observer: IntersectionObserver;

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) activeSection.set("pipe");
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
      code: `const result = await pipe.generate({
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
      desc: "ProviderRegistry routes to the correct neuron. Switch providers with one line — the rest of the pipe is unchanged.",
      code: `const pipe = new NeuroLink({ defaultProvider: 'anthropic' });
// Switch instantly — same pipe, different neuron:
// defaultProvider: 'openai' | 'gemini' | 'bedrock'`,
    },
    {
      id: "stream",
      label: "4. Stream Emission",
      tag: "Continuous Flow",
      desc: "Tokens flow as an async iterable. generate() is stream() collected — there is only stream().",
      code: `// Everything is a stream
for await (const token of pipe.stream({ prompt })) {
  process.stdout.write(token); // arrive one by one
}`,
    },
    {
      id: "tools",
      label: "5. Tool Interception",
      tag: "58+ MCP Servers",
      desc: "When the model calls a tool, the stream pauses, the MCP tool executes, the result injects, and the stream continues.",
      code: `await pipe.addExternalMCPServer('github', {
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
      code: `const pipe = new NeuroLink({
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
  data-topology-phase="pipe"
  data-pipe-section
  class="section-pipe py-20"
>
  <div class="max-w-[960px] mx-auto px-6">
    <!-- Section header -->
    <p class="label-eyebrow mb-4">THE PIPE</p>
    <h2 class="headline-section font-display mb-4">
      Six stages.<br />One continuous flow.
    </h2>
    <p class="body-text max-w-lg mb-16">
      Every request travels the same pipe. Hover a stage to see how it works.
    </p>

    <!-- Main layout: pipeline left, code right -->
    <div class="pipe-layout">
      <!-- Left: pipeline diagram -->
      <div class="pipe-diagram">
        <!-- Single continuous connector line spanning all stages -->
        <div class="pipe-line" aria-hidden="true">
          <div class="pipe-signal-dot"></div>
        </div>

        {#each STAGES as stage, i}
          <button
            class="pipe-stage"
            class:pipe-stage--active={activeIdx === i}
            onclick={() => setActive(i)}
            type="button"
          >
            <div class="pipe-stage-inner">
              <div
                class="pipe-node"
                class:pipe-node--active={activeIdx === i}
              ></div>
              <div class="pipe-stage-text">
                <span class="pipe-stage-label">{stage.label}</span>
                <span class="pipe-stage-tag">{stage.tag}</span>
              </div>
            </div>
          </button>
        {/each}
      </div>

      <!-- Right: code + description panel -->
      <div class="pipe-panel" class:pipe-panel--visible={codeVisible}>
        <p class="pipe-desc">{STAGES[activeIdx].desc}</p>
        <pre class="pipe-code"><code>{STAGES[activeIdx].code}</code></pre>
      </div>
    </div>
  </div>
</section>

<style>
  .pipe-layout {
    display: flex;
    gap: 4rem;
    align-items: flex-start;
  }

  @media (max-width: 767px) {
    .pipe-layout {
      flex-direction: column;
      gap: 2rem;
    }
  }

  /* --- Pipeline diagram --- */
  .pipe-diagram {
    flex-shrink: 0;
    width: 100%;
    max-width: 380px;
    position: relative;
  }

  /* Single vertical line spanning from first node centre to last node centre */
  .pipe-line {
    position: absolute;
    left: calc(1rem + 5px);
    top: calc(0.875rem + 6px);
    bottom: calc(0.875rem + 6px);
    width: 2px;
    background: rgba(0, 240, 255, 0.2);
    overflow: hidden;
    z-index: 0;
  }

  .pipe-stage {
    position: relative;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    z-index: 1;
  }

  .pipe-stage-inner {
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

  .pipe-stage:hover .pipe-stage-inner,
  .pipe-stage--active .pipe-stage-inner {
    border-color: rgba(0, 240, 255, 0.45);
    background: rgba(0, 240, 255, 0.08);
    box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.05);
  }

  /* Animated signal dot travelling down the line */
  .pipe-signal-dot {
    width: 4px;
    height: 12px;
    border-radius: 4px;
    background: var(--color-nl-sky);
    box-shadow: 0 0 10px var(--color-nl-sky);
    margin-left: -1px;
    animation: pipe-flow 2.4s linear infinite;
  }

  @keyframes pipe-flow {
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
  .pipe-node {
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

  .pipe-node--active,
  .pipe-stage:hover .pipe-node {
    border-color: var(--color-nl-sky);
    box-shadow:
      0 0 15px rgba(0, 240, 255, 0.5),
      inset 0 0 8px rgba(0, 240, 255, 0.4);
    background: rgba(0, 240, 255, 0.2);
  }

  .pipe-stage-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #ffffff;
    letter-spacing: -0.005em;
  }

  .pipe-stage-tag {
    display: block;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-nl-accent-lighter);
    margin-top: 4px;
  }

  /* --- Code / description panel (cross-fade on tab switch only) --- */
  .pipe-panel {
    flex: 1;
    opacity: 0;
    transform: translateY(6px);
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .pipe-panel--visible {
    opacity: 1;
    transform: translateY(0);
  }

  .pipe-desc {
    font-size: 0.9375rem;
    line-height: 1.7;
    color: var(--color-text-body);
    margin-bottom: 1.25rem;
  }

  .pipe-code {
    background: var(--color-ds-surface-1);
    backdrop-filter: blur(12px);
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
