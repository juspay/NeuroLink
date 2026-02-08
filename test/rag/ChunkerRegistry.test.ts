/**
 * Chunker Registry Tests
 * Comprehensive tests for the ChunkerRegistry class
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ChunkerRegistry,
  chunkerRegistry,
  getAvailableChunkers,
  getChunker,
  getChunkerMetadata,
} from "../../src/lib/rag/ChunkerRegistry.js";
import {
  ChunkingError,
  RAGErrorCodes,
} from "../../src/lib/rag/errors/RAGError.js";
import type { ChunkingStrategy } from "../../src/lib/rag/types.js";

describe("ChunkerRegistry", () => {
  let registry: ChunkerRegistry;

  beforeEach(() => {
    // Reset the singleton for clean tests
    ChunkerRegistry.resetInstance();
    registry = ChunkerRegistry.getInstance();
  });

  afterEach(() => {
    ChunkerRegistry.resetInstance();
  });

  describe("singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = ChunkerRegistry.getInstance();
      const instance2 = ChunkerRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should reset instance correctly", () => {
      const instance1 = ChunkerRegistry.getInstance();
      ChunkerRegistry.resetInstance();
      const instance2 = ChunkerRegistry.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe("initialization and registration", () => {
    it("should register all 10 chunking strategies on initialization", async () => {
      await registry.ensureInitialized();
      const chunkers = await registry.getAvailableChunkers();

      expect(chunkers.length).toBeGreaterThanOrEqual(10);
      expect(chunkers).toContain("character");
      expect(chunkers).toContain("recursive");
      expect(chunkers).toContain("sentence");
      expect(chunkers).toContain("token");
      expect(chunkers).toContain("markdown");
      expect(chunkers).toContain("html");
      expect(chunkers).toContain("json");
      expect(chunkers).toContain("latex");
      expect(chunkers).toContain("semantic");
      expect(chunkers).toContain("semantic-markdown");
    });

    it("should initialize only once", async () => {
      await registry.ensureInitialized();
      const count1 = (await registry.getAvailableChunkers()).length;

      await registry.ensureInitialized();
      const count2 = (await registry.getAvailableChunkers()).length;

      expect(count1).toBe(count2);
    });
  });

  describe("alias resolution", () => {
    it("should resolve character chunker aliases", async () => {
      await registry.ensureInitialized();

      expect(registry.resolveStrategy("char")).toBe("character");
      expect(registry.resolveStrategy("fixed-size")).toBe("character");
      expect(registry.resolveStrategy("fixed")).toBe("character");
    });

    it("should resolve recursive chunker aliases", async () => {
      await registry.ensureInitialized();

      expect(registry.resolveStrategy("recursive-character")).toBe("recursive");
      expect(registry.resolveStrategy("langchain-default")).toBe("recursive");
    });

    it("should resolve markdown chunker aliases", async () => {
      await registry.ensureInitialized();

      expect(registry.resolveStrategy("md")).toBe("markdown");
      expect(registry.resolveStrategy("markdown-header")).toBe("markdown");
    });

    it("should resolve semantic-markdown chunker aliases", async () => {
      await registry.ensureInitialized();

      expect(registry.resolveStrategy("semantic-md")).toBe("semantic-markdown");
      expect(registry.resolveStrategy("smart-markdown")).toBe(
        "semantic-markdown",
      );
    });

    it("should throw error for unknown strategy", async () => {
      await registry.ensureInitialized();

      expect(() => registry.resolveStrategy("unknown-strategy")).toThrow(
        ChunkingError,
      );
    });

    it("should include available strategies in error message", async () => {
      await registry.ensureInitialized();

      try {
        registry.resolveStrategy("invalid");
      } catch (error) {
        expect(error).toBeInstanceOf(ChunkingError);
        expect((error as ChunkingError).code).toBe(
          RAGErrorCodes.CHUNKING_STRATEGY_NOT_FOUND,
        );
        expect((error as ChunkingError).message).toContain("character");
        expect((error as ChunkingError).message).toContain("recursive");
      }
    });
  });

  describe("chunker retrieval", () => {
    it("should get chunker by strategy name", async () => {
      const chunker = await registry.getChunker("character");

      expect(chunker).toBeDefined();
      expect(chunker.strategy).toBe("character");
    });

    it("should get chunker by alias", async () => {
      const chunker = await registry.getChunker("char");

      expect(chunker).toBeDefined();
      expect(chunker.strategy).toBe("character");
    });

    it("should throw error for unknown chunker", async () => {
      await expect(registry.getChunker("nonexistent")).rejects.toThrow(
        ChunkingError,
      );
    });
  });

  describe("metadata", () => {
    it("should return metadata for chunker", async () => {
      await registry.ensureInitialized();
      const metadata = registry.getChunkerMetadata("character");

      expect(metadata).toBeDefined();
      expect(metadata?.description).toBeDefined();
      expect(metadata?.defaultConfig).toBeDefined();
      expect(metadata?.supportedOptions).toBeDefined();
      expect(metadata?.useCases).toBeDefined();
      expect(metadata?.aliases).toBeDefined();
    });

    it("should return metadata by alias", async () => {
      await registry.ensureInitialized();
      const metadata = registry.getChunkerMetadata("char");

      expect(metadata).toBeDefined();
      expect(metadata?.aliases).toContain("char");
    });

    it("should return default config", async () => {
      await registry.ensureInitialized();
      const config = registry.getDefaultConfig("recursive");

      expect(config).toBeDefined();
      expect(config?.maxSize).toBeDefined();
      expect(config?.overlap).toBeDefined();
    });
  });

  describe("use case filtering", () => {
    it("should find chunkers by use case", async () => {
      await registry.ensureInitialized();
      const chunkers = registry.getChunkersByUseCase("documentation");

      expect(chunkers.length).toBeGreaterThan(0);
      expect(chunkers).toContain("markdown");
    });

    it("should find Q&A related chunkers", async () => {
      await registry.ensureInitialized();
      const chunkers = registry.getChunkersByUseCase("Q&A");

      expect(chunkers).toContain("sentence");
    });

    it("should return empty array for no matches", async () => {
      await registry.ensureInitialized();
      const chunkers = registry.getChunkersByUseCase(
        "nonexistent-use-case-xyz",
      );

      expect(chunkers).toHaveLength(0);
    });
  });

  describe("has/exists checks", () => {
    it("should check if strategy exists", async () => {
      await registry.ensureInitialized();

      expect(registry.hasChunker("character")).toBe(true);
      expect(registry.hasChunker("char")).toBe(true);
      expect(registry.hasChunker("nonexistent")).toBe(false);
    });
  });

  describe("aliases management", () => {
    it("should get aliases for strategy", async () => {
      await registry.ensureInitialized();
      const aliases = registry.getAliasesForStrategy("character");

      expect(aliases).toContain("char");
      expect(aliases).toContain("fixed-size");
    });

    it("should get all aliases", async () => {
      await registry.ensureInitialized();
      const allAliases = registry.getAllAliases();

      expect(allAliases.size).toBeGreaterThan(0);
      expect(allAliases.get("char")).toBe("character");
      expect(allAliases.get("md")).toBe("markdown");
    });
  });

  describe("clear", () => {
    it("should clear all registrations and aliases", async () => {
      await registry.ensureInitialized();
      expect((await registry.getAvailableChunkers()).length).toBeGreaterThan(0);

      registry.clear();

      expect(registry.isInitialized()).toBe(false);
    });
  });
});

describe("ChunkerRegistry convenience functions", () => {
  beforeEach(async () => {
    ChunkerRegistry.resetInstance();
    // Ensure initialized before tests
    await ChunkerRegistry.getInstance().ensureInitialized();
  });

  afterEach(() => {
    ChunkerRegistry.resetInstance();
  });

  it("getAvailableChunkers should return strategies", async () => {
    await chunkerRegistry.ensureInitialized();
    const chunkers = await getAvailableChunkers();
    expect(chunkers.length).toBeGreaterThanOrEqual(10);
  });

  it("getChunkerMetadata should return metadata", async () => {
    await chunkerRegistry.ensureInitialized();
    const metadata = getChunkerMetadata("character");
    expect(metadata).toBeDefined();
  });
});
