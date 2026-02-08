/**
 * RAG with stream() - Copy-paste runnable example
 *
 * Demonstrates how to use RAG through stream() with zero setup.
 * Same `rag: { files: [...] }` config, but with streaming output.
 *
 * Usage:
 *   npx tsx examples/rag-stream.ts
 *
 * Prerequisites:
 *   - GOOGLE_API_KEY or VERTEX_AI credentials set
 *   - pnpm run build:cli (if not already built)
 */

import { NeuroLink } from "../src/lib/index.js";

async function main() {
  const neurolink = new NeuroLink();

  console.log("=== RAG with stream() ===\n");

  // --- Example 1: Basic streaming RAG ---
  console.log("--- Example 1: Streaming RAG response ---");
  try {
    const result = await neurolink.stream({
      input: {
        text: "Explain the different reranker types available in NeuroLink's RAG system.",
      },
      provider: "vertex",
      model: "gemini-2.5-flash",
      rag: {
        files: ["./docs/features/rag.md"],
        strategy: "markdown",
        topK: 5,
      },
    });

    // Stream the response
    let charCount = 0;
    for await (const chunk of result.stream) {
      if ("content" in chunk) {
        process.stdout.write(chunk.content);
        charCount += chunk.content.length;
      }
    }
    console.log(`\n\n[Streamed ${charCount} characters]\n`);
  } catch (error) {
    console.error("Example 1 error:", (error as Error).message);
  }

  // --- Example 2: Multi-file streaming RAG ---
  console.log("--- Example 2: Multi-file streaming RAG ---");
  try {
    const result = await neurolink.stream({
      input: {
        text: "What are the best practices for configuring chunk size and overlap?",
      },
      provider: "vertex",
      model: "gemini-2.5-flash",
      systemPrompt:
        "You are a RAG configuration expert. Give specific, actionable advice based on the documentation.",
      rag: {
        files: ["./docs/features/rag.md", "./docs/rag/CONFIGURATION.md"],
        chunkSize: 600,
        chunkOverlap: 100,
        topK: 8,
      },
    });

    let charCount = 0;
    for await (const chunk of result.stream) {
      if ("content" in chunk) {
        process.stdout.write(chunk.content);
        charCount += chunk.content.length;
      }
    }
    console.log(`\n\n[Streamed ${charCount} characters]\n`);
  } catch (error) {
    console.error("Example 2 error:", (error as Error).message);
  }

  await neurolink.shutdown();
  console.log("Done!");
}

main().catch(console.error);
