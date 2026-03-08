<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { activeSection } from "$lib/stores/canvasState";

  let sectionEl: HTMLElement;
  let observer: IntersectionObserver;

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) activeSection.set("streams");
      },
      { threshold: 0.4 },
    );
    observer.observe(sectionEl);
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  const STREAMS = [
    {
      label: "TOKENS",
      items: [
        "anthropic",
        "openai",
        "gemini",
        "bedrock",
        "mistral",
        "vertex",
        "azure",
        "ollama",
        "litellm",
        "hugging face",
        "sagemaker",
        "···",
      ],
    },
    {
      label: "TOOLS",
      items: [
        "github",
        "postgres",
        "slack",
        "google drive",
        "jira",
        "filesystem",
        "web search",
        "notion",
        "linear",
        "stripe",
        "58+ servers",
        "···",
      ],
    },
    {
      label: "MEMORY",
      items: [
        "conversation",
        "semantic recall",
        "working memory",
        "redis",
        "vector index",
        "context window",
        "compaction",
        "summarization",
        "···",
      ],
    },
    {
      label: "KNOWLEDGE",
      items: [
        "pdf",
        "markdown",
        "xlsx",
        "docx",
        "csv",
        "html",
        "mp4",
        "zip",
        "svg",
        "json",
        "50+ formats",
        "···",
      ],
    },
    {
      label: "VOICE",
      items: [
        "text to speech",
        "real-time audio",
        "google tts",
        "stream in",
        "stream out",
        "multimodal",
        "···",
      ],
    },
    {
      label: "REASONING",
      items: [
        "workflows",
        "chains",
        "multi-agent",
        "hitl",
        "checkpointing",
        "reflections",
        "evals",
        "···",
      ],
    },
  ];
</script>

<section
  bind:this={sectionEl}
  data-topology-phase="streams"
  class="section-streams py-24 md:py-36"
>
  <!-- Section header -->
  <div class="max-w-[960px] mx-auto px-6 mb-16">
    <p class="label-eyebrow mb-4">STREAMS</p>
    <h2 class="headline-section font-display">
      Thirteen sources.<br />One stream.
    </h2>
    <p class="body-text max-w-lg mt-5">
      Every type of AI intelligence flows through the same stream layer. Pick your
      sources. Shape the signal. Deliver to any organ.
    </p>
  </div>

  <!-- 6 stream marquee rows -->
  <div>
    {#each STREAMS as stream, i}
      <div class="stream-row">
        <span class="stream-label">{stream.label}</span>
        <div
          class="stream-track"
          style="--dir: {i % 2 === 0 ? 'normal' : 'reverse'}"
        >
          <div class="stream-inner">
            {#each [...stream.items, ...stream.items] as item}
              <span class="stream-item">{item}</span>
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .stream-row {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 1.25rem 0;
    border-top: 1px solid rgba(0, 240, 255, 0.1);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 240, 255, 0.02) 50%,
      transparent
    );
    overflow: hidden;
  }

  .stream-row:last-child {
    border-bottom: 1px solid rgba(0, 240, 255, 0.1);
  }

  .stream-label {
    flex-shrink: 0;
    width: 8rem;
    padding-left: 2rem;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--color-nl-accent-lighter);
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
    text-transform: uppercase;
  }

  @media (max-width: 375px) {
    .stream-label {
      width: 5rem;
      padding-left: 1rem;
      font-size: 0.55rem;
    }
  }

  .stream-track {
    flex: 1;
    overflow: hidden;
    mask-image: linear-gradient(
      to right,
      transparent,
      black 10%,
      black 90%,
      transparent
    );
  }

  .stream-inner {
    display: flex;
    gap: 3.5rem;
    white-space: nowrap;
    animation: marquee 35s linear infinite;
    animation-direction: var(--dir, normal);
  }

  .stream-item {
    font-size: 0.85rem;
    font-weight: 400;
    color: var(--color-text-body);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
</style>
