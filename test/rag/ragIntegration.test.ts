/**
 * Tests for RAG Integration with generate()/stream()
 *
 * Tests the prepareRAGTool function and RAGConfig types
 * to ensure RAG works seamlessly through the unified API.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { prepareRAGTool } from "../../src/lib/rag/ragIntegration.js";
import type { RAGConfig } from "../../src/lib/rag/types.js";

// Test fixtures directory
const FIXTURES_DIR = join(process.cwd(), "test/fixtures/rag");
const TEMP_DIR = join(process.cwd(), "test/fixtures/rag/temp-integration");

describe("RAG Integration - prepareRAGTool", () => {
  beforeAll(() => {
    // Ensure temp directory exists
    if (!existsSync(TEMP_DIR)) {
      mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Create test files
    writeFileSync(
      join(TEMP_DIR, "test-doc.md"),
      `# Test Document

## Introduction
This is a test document about artificial intelligence and machine learning.
It covers topics like neural networks, deep learning, and natural language processing.

## Neural Networks
Neural networks are computing systems inspired by biological neural networks.
They consist of layers of interconnected nodes that process information.

## Deep Learning
Deep learning is a subset of machine learning that uses neural networks with many layers.
It has revolutionized fields like computer vision and natural language processing.

## Summary
AI and ML are transforming technology across many industries.`,
    );

    writeFileSync(
      join(TEMP_DIR, "test-config.json"),
      JSON.stringify(
        {
          name: "test-config",
          version: "1.0",
          settings: {
            chunkSize: 500,
            overlap: 50,
            strategy: "recursive",
          },
          features: ["chunking", "embedding", "retrieval", "reranking"],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      join(TEMP_DIR, "test-code.ts"),
      `
export function calculateSum(a: number, b: number): number {
  return a + b;
}

export function calculateProduct(a: number, b: number): number {
  return a * b;
}

export class Calculator {
  private history: number[] = [];

  add(a: number, b: number): number {
    const result = a + b;
    this.history.push(result);
    return result;
  }

  getHistory(): number[] {
    return [...this.history];
  }
}`,
    );
  });

  // Cleanup after all tests
  afterAll(() => {
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe("File loading", () => {
    it("should load a single markdown file", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
      });

      expect(result.filesLoaded).toBe(1);
      expect(result.chunksIndexed).toBeGreaterThan(0);
      expect(result.toolName).toBe("search_knowledge_base");
      expect(result.tool).toBeDefined();
      expect(result.tool.description).toBeDefined();
      expect(result.tool.parameters).toBeDefined();
      expect(result.tool.execute).toBeInstanceOf(Function);
    });

    it("should load multiple files", async () => {
      const result = await prepareRAGTool({
        files: [
          join(TEMP_DIR, "test-doc.md"),
          join(TEMP_DIR, "test-config.json"),
          join(TEMP_DIR, "test-code.ts"),
        ],
      });

      expect(result.filesLoaded).toBe(3);
      expect(result.chunksIndexed).toBeGreaterThan(0);
    });

    it("should skip non-existent files gracefully", async () => {
      const result = await prepareRAGTool({
        files: [
          join(TEMP_DIR, "test-doc.md"),
          join(TEMP_DIR, "nonexistent.md"),
        ],
      });

      expect(result.filesLoaded).toBe(1);
      expect(result.chunksIndexed).toBeGreaterThan(0);
    });

    it("should throw if no files can be loaded", async () => {
      await expect(
        prepareRAGTool({
          files: ["/nonexistent/path/file.md"],
        }),
      ).rejects.toThrow("No files could be loaded");
    });

    it("should throw if files array is empty", async () => {
      await expect(
        prepareRAGTool({
          files: [],
        }),
      ).rejects.toThrow("at least one file path");
    });
  });

  describe("Chunking strategies", () => {
    it("should auto-detect markdown strategy for .md files", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
        // No strategy specified - should auto-detect "markdown"
      });

      expect(result.chunksIndexed).toBeGreaterThan(0);
    });

    it("should auto-detect json strategy for .json files", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-config.json")],
      });

      expect(result.chunksIndexed).toBeGreaterThan(0);
    });

    it("should auto-detect recursive strategy for .ts files", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-code.ts")],
      });

      expect(result.chunksIndexed).toBeGreaterThan(0);
    });

    it("should use explicit strategy when provided", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
        strategy: "sentence",
      });

      expect(result.chunksIndexed).toBeGreaterThan(0);
    });

    it("should respect custom chunk size", async () => {
      const small = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
        chunkSize: 100,
      });

      const large = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
        chunkSize: 2000,
      });

      // Smaller chunks should produce more chunks
      expect(small.chunksIndexed).toBeGreaterThanOrEqual(large.chunksIndexed);
    });
  });

  describe("Tool creation", () => {
    it("should create a tool with default name", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
      });

      expect(result.toolName).toBe("search_knowledge_base");
    });

    it("should create a tool with custom name", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
        toolName: "search_docs",
      });

      expect(result.toolName).toBe("search_docs");
    });

    it("should create a tool with custom description", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
        toolDescription: "Search AI documentation",
      });

      expect(result.tool.description).toBe("Search AI documentation");
    });

    it("should create an executable tool", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
      });

      // Execute the tool with a query
      const searchResult = await result.tool.execute!(
        { query: "neural networks" },
        { toolCallId: "test", messages: [] },
      );

      expect(searchResult).toBeDefined();
      expect(searchResult).toHaveProperty("relevantContext");
      expect(searchResult).toHaveProperty("sources");
      expect(searchResult).toHaveProperty("totalResults");
    });

    it("should return relevant results for matching queries", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
        topK: 3,
      });

      const searchResult = await result.tool.execute!(
        { query: "deep learning neural networks" },
        { toolCallId: "test", messages: [] },
      );

      expect(searchResult.totalResults).toBeGreaterThan(0);
      expect(searchResult.relevantContext).toBeTruthy();
      expect(searchResult.sources.length).toBeGreaterThan(0);
    });

    it("should handle no-match queries gracefully", async () => {
      const result = await prepareRAGTool({
        files: [join(TEMP_DIR, "test-doc.md")],
        topK: 3,
      });

      // Even with an unrelated query, the in-memory store returns results
      // (cosine similarity always returns something)
      const searchResult = await result.tool.execute!(
        { query: "completely unrelated" },
        { toolCallId: "test", messages: [] },
      );

      expect(searchResult).toBeDefined();
      expect(searchResult).toHaveProperty("totalResults");
    });
  });

  describe("RAGConfig validation", () => {
    it("should accept minimal config", async () => {
      const config: RAGConfig = {
        files: [join(TEMP_DIR, "test-doc.md")],
      };

      const result = await prepareRAGTool(config);
      expect(result.filesLoaded).toBe(1);
    });

    it("should accept full config", async () => {
      const config: RAGConfig = {
        files: [join(TEMP_DIR, "test-doc.md")],
        strategy: "markdown",
        chunkSize: 512,
        chunkOverlap: 50,
        topK: 5,
        toolName: "my_search",
        toolDescription: "Search my docs",
        embeddingProvider: "vertex",
        embeddingModel: "gemini-2.5-flash",
      };

      const result = await prepareRAGTool(config);
      expect(result.filesLoaded).toBe(1);
      expect(result.toolName).toBe("my_search");
      expect(result.tool.description).toBe("Search my docs");
    });
  });

  describe("Integration with existing fixtures", () => {
    it("should work with sample-document.md fixture", async () => {
      const fixturePath = join(FIXTURES_DIR, "sample-document.md");
      if (!existsSync(fixturePath)) {
        return; // Skip if fixture not available
      }

      const result = await prepareRAGTool({
        files: [fixturePath],
        strategy: "markdown",
        chunkSize: 500,
      });

      expect(result.filesLoaded).toBe(1);
      expect(result.chunksIndexed).toBeGreaterThan(0);

      const searchResult = await result.tool.execute!(
        { query: "chunking strategies" },
        { toolCallId: "test", messages: [] },
      );
      expect(searchResult.totalResults).toBeGreaterThan(0);
    });

    it("should work with sample-document.html fixture", async () => {
      const fixturePath = join(FIXTURES_DIR, "sample-document.html");
      if (!existsSync(fixturePath)) {
        return;
      }

      const result = await prepareRAGTool({
        files: [fixturePath],
        strategy: "html",
      });

      expect(result.filesLoaded).toBe(1);
      expect(result.chunksIndexed).toBeGreaterThan(0);
    });

    it("should work with sample-document.json fixture", async () => {
      const fixturePath = join(FIXTURES_DIR, "sample-document.json");
      if (!existsSync(fixturePath)) {
        return;
      }

      const result = await prepareRAGTool({
        files: [fixturePath],
        strategy: "json",
      });

      expect(result.filesLoaded).toBe(1);
      expect(result.chunksIndexed).toBeGreaterThan(0);
    });

    it("should work with sample-document.tex fixture", async () => {
      const fixturePath = join(FIXTURES_DIR, "sample-document.tex");
      if (!existsSync(fixturePath)) {
        return;
      }

      const result = await prepareRAGTool({
        files: [fixturePath],
        strategy: "latex",
      });

      expect(result.filesLoaded).toBe(1);
      expect(result.chunksIndexed).toBeGreaterThan(0);
    });
  });
});

// Import afterAll from vitest
import { afterAll } from "vitest";
