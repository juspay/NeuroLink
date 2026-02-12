export const snippets = {
  generate: {
    label: "Generate",
    description:
      "Call any AI model with a single function. Switch providers instantly — no code changes required.",
    fullCode: `<span class="text-[#ff7b72]">import</span> <span class="text-[#c9d1d9]">{</span> <span class="text-[#d2a8ff]">NeuroLink</span> <span class="text-[#c9d1d9]">}</span> <span class="text-[#ff7b72]">from</span> <span class="text-[#a5d6ff]">"@juspay/neurolink"</span><span class="text-[#c9d1d9]">;</span>

<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">ai</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">new</span> <span class="text-[#d2a8ff]">NeuroLink</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">provider</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"anthropic"</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#ffa657]">model</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"claude-sonnet-4-20250514"</span><span class="text-[#c9d1d9]">,</span>
<span class="text-[#c9d1d9]">});</span>

<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">result</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">await</span> <span class="text-[#ffa657]">ai</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">generate</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">prompt</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"Analyze this codebase"</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#ffa657]">tools</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#c9d1d9]">[</span><span class="text-[#a5d6ff]">"github"</span><span class="text-[#c9d1d9]">,</span> <span class="text-[#a5d6ff]">"readFile"</span><span class="text-[#c9d1d9]">],</span>
<span class="text-[#c9d1d9]">});</span>`,
    shortCode: `<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">result</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">await</span> <span class="text-[#ffa657]">ai</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">generate</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">prompt</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"Analyze this data"</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#ffa657]">provider</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"anthropic"</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#ffa657]">model</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"claude-sonnet-4-20250514"</span><span class="text-[#c9d1d9]">,</span>
<span class="text-[#c9d1d9]">});</span>`,
  },
  stream: {
    label: "Stream",
    description:
      "Stream responses with built-in backpressure control. Process chunks as they arrive in real-time.",
    fullCode: `<span class="text-[#ff7b72]">import</span> <span class="text-[#c9d1d9]">{</span> <span class="text-[#d2a8ff]">NeuroLink</span> <span class="text-[#c9d1d9]">}</span> <span class="text-[#ff7b72]">from</span> <span class="text-[#a5d6ff]">"@juspay/neurolink"</span><span class="text-[#c9d1d9]">;</span>

<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">ai</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">new</span> <span class="text-[#d2a8ff]">NeuroLink</span><span class="text-[#c9d1d9]">();</span>

<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">stream</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">await</span> <span class="text-[#ffa657]">ai</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">stream</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">prompt</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"Explain quantum computing"</span><span class="text-[#c9d1d9]">,</span>
<span class="text-[#c9d1d9]">});</span>

<span class="text-[#ff7b72]">for await</span> <span class="text-[#c9d1d9]">(</span><span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">chunk</span> <span class="text-[#ff7b72]">of</span> <span class="text-[#ffa657]">stream</span><span class="text-[#c9d1d9]">)</span> <span class="text-[#c9d1d9]">{</span>
  <span class="text-[#ffa657]">process</span><span class="text-[#c9d1d9]">.</span><span class="text-[#ffa657]">stdout</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">write</span><span class="text-[#c9d1d9]">(</span><span class="text-[#ffa657]">chunk</span><span class="text-[#c9d1d9]">.</span><span class="text-[#ffa657]">text</span><span class="text-[#c9d1d9]">);</span>
<span class="text-[#c9d1d9]">}</span>`,
    shortCode: `<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">stream</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">await</span> <span class="text-[#ffa657]">ai</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">stream</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">prompt</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"Explain quantum computing"</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#ffa657]">tools</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#c9d1d9]">[</span><span class="text-[#a5d6ff]">"wikipedia"</span><span class="text-[#c9d1d9]">],</span>
<span class="text-[#c9d1d9]">});</span>

<span class="text-[#ff7b72]">for await</span> <span class="text-[#c9d1d9]">(</span><span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">chunk</span> <span class="text-[#ff7b72]">of</span> <span class="text-[#ffa657]">stream</span><span class="text-[#c9d1d9]">)</span> <span class="text-[#c9d1d9]">{</span>
  <span class="text-[#ffa657]">process</span><span class="text-[#c9d1d9]">.</span><span class="text-[#ffa657]">stdout</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">write</span><span class="text-[#c9d1d9]">(</span><span class="text-[#ffa657]">chunk</span><span class="text-[#c9d1d9]">.</span><span class="text-[#ffa657]">text</span><span class="text-[#c9d1d9]">);</span>
<span class="text-[#c9d1d9]">}</span>`,
  },
  rag: {
    label: "RAG",
    description:
      "Pass files directly to generate or stream. NeuroLink handles chunking, embedding, and retrieval automatically.",
    fullCode: `<span class="text-[#ff7b72]">import</span> <span class="text-[#c9d1d9]">{</span> <span class="text-[#d2a8ff]">NeuroLink</span> <span class="text-[#c9d1d9]">}</span> <span class="text-[#ff7b72]">from</span> <span class="text-[#a5d6ff]">"@juspay/neurolink"</span><span class="text-[#c9d1d9]">;</span>

<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">ai</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">new</span> <span class="text-[#d2a8ff]">NeuroLink</span><span class="text-[#c9d1d9]">();</span>

<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">result</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">await</span> <span class="text-[#ffa657]">ai</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">generate</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">prompt</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"What are the key features?"</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#ffa657]">rag</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#c9d1d9]">{</span>
    <span class="text-[#ffa657]">files</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#c9d1d9]">[</span><span class="text-[#a5d6ff]">"./docs/guide.md"</span><span class="text-[#c9d1d9]">,</span> <span class="text-[#a5d6ff]">"./docs/api.md"</span><span class="text-[#c9d1d9]">],</span>
    <span class="text-[#ffa657]">strategy</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"markdown"</span><span class="text-[#c9d1d9]">,</span>
    <span class="text-[#ffa657]">topK</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#79c0ff]">5</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#c9d1d9]">},</span>
<span class="text-[#c9d1d9]">});</span>`,
    shortCode: `<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">result</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">await</span> <span class="text-[#ffa657]">ai</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">generate</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">prompt</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"Summarize the key points"</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#ffa657]">rag</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#c9d1d9]">{</span>
    <span class="text-[#ffa657]">files</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#c9d1d9]">[</span><span class="text-[#a5d6ff]">"./docs/guide.md"</span><span class="text-[#c9d1d9]">],</span>
    <span class="text-[#ffa657]">strategy</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"markdown"</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#c9d1d9]">},</span>
<span class="text-[#c9d1d9]">});</span>`,
  },
  agents: {
    label: "Agents",
    description:
      "Orchestrate teams of AI agents with routing, message buses, and multiple topology patterns.",
    fullCode: `<span class="text-[#ff7b72]">import</span> <span class="text-[#c9d1d9]">{</span> <span class="text-[#d2a8ff]">Agent</span><span class="text-[#c9d1d9]">,</span> <span class="text-[#d2a8ff]">AgentNetwork</span> <span class="text-[#c9d1d9]">}</span> <span class="text-[#ff7b72]">from</span> <span class="text-[#a5d6ff]">"@juspay/neurolink"</span><span class="text-[#c9d1d9]">;</span>

<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">network</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">new</span> <span class="text-[#d2a8ff]">AgentNetwork</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">agents</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#c9d1d9]">[</span><span class="text-[#ffa657]">researcher</span><span class="text-[#c9d1d9]">,</span> <span class="text-[#ffa657]">writer</span><span class="text-[#c9d1d9]">,</span> <span class="text-[#ffa657]">reviewer</span><span class="text-[#c9d1d9]">],</span>
  <span class="text-[#ffa657]">topology</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"hub-spoke"</span><span class="text-[#c9d1d9]">,</span>
<span class="text-[#c9d1d9]">});</span>

<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">result</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">await</span> <span class="text-[#ffa657]">network</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">execute</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">task</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"Write a technical report"</span><span class="text-[#c9d1d9]">,</span>
<span class="text-[#c9d1d9]">});</span>`,
    shortCode: `<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">network</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">new</span> <span class="text-[#d2a8ff]">AgentNetwork</span><span class="text-[#c9d1d9]">({</span>
  <span class="text-[#ffa657]">agents</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#c9d1d9]">[</span><span class="text-[#ffa657]">researcher</span><span class="text-[#c9d1d9]">,</span> <span class="text-[#ffa657]">writer</span><span class="text-[#c9d1d9]">,</span> <span class="text-[#ffa657]">reviewer</span><span class="text-[#c9d1d9]">],</span>
  <span class="text-[#ffa657]">topology</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#a5d6ff]">"hub-spoke"</span><span class="text-[#c9d1d9]">,</span>
  <span class="text-[#ffa657]">router</span><span class="text-[#c9d1d9]">:</span> <span class="text-[#ff7b72]">new</span> <span class="text-[#d2a8ff]">RoutingAgent</span><span class="text-[#c9d1d9]">(),</span>
<span class="text-[#c9d1d9]">});</span>

<span class="text-[#ff7b72]">const</span> <span class="text-[#ffa657]">result</span> <span class="text-[#8b949e]">=</span> <span class="text-[#ff7b72]">await</span> <span class="text-[#ffa657]">network</span><span class="text-[#c9d1d9]">.</span><span class="text-[#d2a8ff]">execute</span><span class="text-[#c9d1d9]">(</span><span class="text-[#a5d6ff]">"Write a report"</span><span class="text-[#c9d1d9]">);</span>`,
  },
} as const;

export type SnippetKey = keyof typeof snippets;
