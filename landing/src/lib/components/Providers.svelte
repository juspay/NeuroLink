<script lang="ts">
  import { reveal } from "$lib/actions/reveal";

  const providers = [
    "OpenAI",
    "Anthropic",
    "Google AI",
    "Vertex AI",
    "AWS Bedrock",
    "Azure OpenAI",
    "Mistral",
    "LiteLLM",
    "Ollama",
    "Hugging Face",
    "SageMaker",
    "OpenRouter",
    "OpenAI-Compatible",
  ];
</script>

<section class="max-w-[1200px] mx-auto px-6 py-24">
  <div use:reveal={{ y: 40 }} class="text-center mb-14">
    <p class="eyebrow text-ds-text-muted mb-4">04 — Integrations</p>
    <h2 class="section-headline text-ds-text-primary">
      One API. Every Provider.
    </h2>
    <p class="mt-4 text-lg text-ds-text-tertiary max-w-2xl mx-auto">
      Switch between providers instantly. No code changes, no vendor lock-in.
    </p>
  </div>

  <div
    class="flex flex-wrap justify-center gap-3"
    use:reveal={{ y: 30, stagger: 0.06 }}
  >
    {#each providers as provider}
      <span
        class="px-4 py-2.5 bg-ds-surface-2 border border-ds-border rounded-full text-sm font-medium text-ds-text-tertiary hover:border-nl-accent hover:text-nl-accent transition-all duration-200 cursor-default"
      >
        {provider}
      </span>
    {/each}
  </div>
</section>
