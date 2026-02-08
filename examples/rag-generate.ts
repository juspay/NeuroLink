/**
 * RAG with generate() - Copy-paste runnable example
 *
 * Demonstrates how to use RAG through generate() with zero setup.
 * Just pass `rag: { files: [...] }` and NeuroLink handles everything.
 *
 * Usage:
 *   npx tsx examples/rag-generate.ts
 *
 * Prerequisites:
 *   - GOOGLE_API_KEY or VERTEX_AI credentials set
 *   - pnpm run build:cli (if not already built)
 */

import { NeuroLink } from "../src/lib/index.js";

async function main() {
  const neurolink = new NeuroLink();

  console.log("=== RAG with generate() ===\n");

  // --- Example 1: Basic RAG with a single file ---
  console.log("--- Example 1: Single file RAG ---");
  try {
    const result = await neurolink.generate({
      input: {
        text: "What chunking strategies are available in NeuroLink?",
      },
      provider: "vertex",
      model: "gemini-2.5-flash",
      rag: {
        files: ["./docs/features/rag.md"],
      },
    });

    console.log("Response:", result.content.slice(0, 500));
    console.log("\nTool executions:", result.toolExecutions?.length || 0);
    console.log("");
  } catch (error) {
    console.error("Example 1 error:", (error as Error).message);
  }

  // --- Example 2: Multi-file RAG with custom options ---
  console.log("--- Example 2: Multi-file RAG with options ---");
  try {
    const result = await neurolink.generate({
      input: {
        text: "How does hybrid search combine BM25 and vector search in NeuroLink?",
      },
      provider: "vertex",
      model: "gemini-2.5-flash",
      systemPrompt:
        "You are a technical documentation assistant. Answer questions using the search tool. Always cite which document the information came from.",
      rag: {
        files: ["./docs/features/rag.md", "./docs/rag/CONFIGURATION.md"],
        strategy: "markdown",
        chunkSize: 512,
        chunkOverlap: 50,
        topK: 5,
      },
    });

    console.log("Response:", result.content.slice(0, 500));
    console.log("");
  } catch (error) {
    console.error("Example 2 error:", (error as Error).message);
  }

  // --- Example 3: RAG with code files ---
  console.log("--- Example 3: RAG with source code ---");
  try {
    const result = await neurolink.generate({
      input: {
        text: "What does the createVectorQueryTool function do? How is it implemented?",
      },
      provider: "vertex",
      model: "gemini-2.5-flash",
      rag: {
        files: ["./src/lib/rag/retrieval/vectorQueryTool.ts"],
        strategy: "recursive",
        chunkSize: 800,
      },
    });

    console.log("Response:", result.content.slice(0, 500));
    console.log("");
  } catch (error) {
    console.error("Example 3 error:", (error as Error).message);
  }

  await neurolink.shutdown();
  console.log("\nDone!");
}

main().catch(console.error);
