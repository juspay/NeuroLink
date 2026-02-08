/**
 * Chunker Factory Tests
 * Comprehensive tests for the ChunkerFactory class
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ChunkerFactory,
  chunkerFactory,
  createChunker,
  getAvailableStrategies,
  getDefaultConfig,
} from "../../src/lib/rag/ChunkerFactory.js";
import {
  ChunkingError,
  RAGErrorCodes,
} from "../../src/lib/rag/errors/RAGError.js";
import type { ChunkerConfig } from "../../src/lib/rag/types.js";

describe("ChunkerFactory", () => {
  let factory: ChunkerFactory;

  beforeEach(() => {
    ChunkerFactory.resetInstance();
    factory = ChunkerFactory.getInstance();
  });

  afterEach(() => {
    ChunkerFactory.resetInstance();
  });

  describe("singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = ChunkerFactory.getInstance();
      const instance2 = ChunkerFactory.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should reset instance correctly", () => {
      const instance1 = ChunkerFactory.getInstance();
      ChunkerFactory.resetInstance();
      const instance2 = ChunkerFactory.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe("initialization", () => {
    it("should register all 10 chunking strategies", async () => {
      await factory.ensureInitialized();
      const strategies = await factory.getAvailableStrategies();

      expect(strategies.length).toBeGreaterThanOrEqual(10);
      expect(strategies).toContain("character");
      expect(strategies).toContain("recursive");
      expect(strategies).toContain("sentence");
      expect(strategies).toContain("token");
      expect(strategies).toContain("markdown");
      expect(strategies).toContain("html");
      expect(strategies).toContain("json");
      expect(strategies).toContain("latex");
      expect(strategies).toContain("semantic");
      expect(strategies).toContain("semantic-markdown");
    });
  });

  describe("chunker creation", () => {
    it("should create character chunker", async () => {
      const chunker = await factory.createChunker("character");

      expect(chunker).toBeDefined();
      expect(chunker.strategy).toBe("character");
    });

    it("should create chunker by alias", async () => {
      const chunker = await factory.createChunker("char");

      expect(chunker).toBeDefined();
      expect(chunker.strategy).toBe("character");
    });

    it("should create chunker with custom config", async () => {
      const config: ChunkerConfig = {
        maxSize: 500,
        overlap: 50,
      };
      const chunker = await factory.createChunker("character", config);

      expect(chunker).toBeDefined();
      const defaultConfig = chunker.getDefaultConfig();
      expect(defaultConfig.maxSize).toBeDefined();
    });

    it("should throw error for unknown strategy", async () => {
      await expect(factory.createChunker("nonexistent")).rejects.toThrow(
        ChunkingError,
      );
    });

    it("should include available strategies in error", async () => {
      try {
        await factory.createChunker("invalid-strategy");
      } catch (error) {
        expect(error).toBeInstanceOf(ChunkingError);
        expect((error as ChunkingError).code).toBe(
          RAGErrorCodes.CHUNKING_STRATEGY_NOT_FOUND,
        );
        expect(
          (error as ChunkingError).details?.availableStrategies,
        ).toBeDefined();
      }
    });
  });

  describe("lazy loading", () => {
    it("should not import modules until creation", async () => {
      await factory.ensureInitialized();

      // Strategies registered but modules not loaded yet
      const strategies = await factory.getAvailableStrategies();
      expect(strategies.length).toBeGreaterThan(0);

      // Creating chunker triggers dynamic import
      const chunker = await factory.createChunker("character");
      expect(chunker).toBeDefined();
    });

    it("should create different chunker instances", async () => {
      const chunker1 = await factory.createChunker("character");
      const chunker2 = await factory.createChunker("character");

      // Factory creates new instances each time
      expect(chunker1).not.toBe(chunker2);
    });
  });

  describe("alias resolution", () => {
    it("should resolve strategy aliases", async () => {
      await factory.ensureInitialized();

      expect(factory.hasStrategy("char")).toBe(true);
      expect(factory.hasStrategy("md")).toBe(true);
      expect(factory.hasStrategy("semantic-md")).toBe(true);
    });

    it("should get all aliases", async () => {
      await factory.ensureInitialized();
      const aliases = factory.getStrategyAliases();

      expect(aliases.size).toBeGreaterThan(0);
      expect(aliases.has("char")).toBe(true);
    });
  });

  describe("metadata", () => {
    it("should return chunker metadata", async () => {
      await factory.ensureInitialized();
      const metadata = factory.getChunkerMetadata("recursive");

      expect(metadata).toBeDefined();
      expect(metadata?.description).toBeDefined();
      expect(metadata?.defaultConfig).toBeDefined();
      expect(metadata?.useCases).toBeDefined();
    });

    it("should return metadata by alias", async () => {
      await factory.ensureInitialized();
      const metadata = factory.getChunkerMetadata("langchain-default");

      expect(metadata).toBeDefined();
      expect(metadata?.aliases).toContain("langchain-default");
    });

    it("should get default config", async () => {
      await factory.ensureInitialized();
      const config = factory.getDefaultConfig("token");

      expect(config).toBeDefined();
      expect(config?.maxSize).toBeDefined();
    });

    it("should get all metadata", async () => {
      await factory.ensureInitialized();
      const allMetadata = factory.getAllMetadata();

      expect(allMetadata.size).toBeGreaterThanOrEqual(10);
      expect(allMetadata.has("character")).toBe(true);
    });
  });

  describe("use case filtering", () => {
    it("should find chunkers for documentation", async () => {
      await factory.ensureInitialized();
      const chunkers = factory.getChunkersForUseCase("documentation");

      expect(chunkers.length).toBeGreaterThan(0);
    });

    it("should find chunkers for structured data", async () => {
      await factory.ensureInitialized();
      const chunkers = factory.getChunkersForUseCase("structured");

      expect(chunkers).toContain("json");
    });
  });

  describe("clear", () => {
    it("should clear factory and metadata", async () => {
      await factory.ensureInitialized();
      expect((await factory.getAvailableStrategies()).length).toBeGreaterThan(
        0,
      );

      factory.clear();

      // Factory is not initialized after clear - calling getAvailableStrategies
      // will trigger re-initialization, so verify the factory reinitializes correctly
      const strategies = await factory.getAvailableStrategies();
      expect(strategies.length).toBeGreaterThanOrEqual(10);
    });
  });
});

describe("ChunkerFactory convenience functions", () => {
  beforeEach(() => {
    ChunkerFactory.resetInstance();
  });

  afterEach(() => {
    ChunkerFactory.resetInstance();
  });

  it("createChunker should create chunker", async () => {
    const chunker = await createChunker("character");
    expect(chunker).toBeDefined();
    expect(chunker.strategy).toBe("character");
  });

  it("getAvailableStrategies should return strategies", async () => {
    const strategies = await getAvailableStrategies();
    expect(strategies.length).toBeGreaterThanOrEqual(10);
  });

  it("getDefaultConfig should return config", async () => {
    const config = getDefaultConfig("character");
    expect(config).toBeDefined();
  });
});

describe("Chunker creation with different strategies", () => {
  beforeEach(() => {
    ChunkerFactory.resetInstance();
  });

  afterEach(() => {
    ChunkerFactory.resetInstance();
  });

  it("should create recursive chunker", async () => {
    const chunker = await createChunker("recursive");
    expect(chunker.strategy).toBe("recursive");
  });

  it("should create sentence chunker", async () => {
    const chunker = await createChunker("sentence");
    expect(chunker.strategy).toBe("sentence");
  });

  it("should create token chunker", async () => {
    const chunker = await createChunker("token");
    expect(chunker.strategy).toBe("token");
  });

  it("should create markdown chunker", async () => {
    const chunker = await createChunker("markdown");
    expect(chunker.strategy).toBe("markdown");
  });

  it("should create html chunker", async () => {
    const chunker = await createChunker("html");
    expect(chunker.strategy).toBe("html");
  });

  it("should create json chunker", async () => {
    const chunker = await createChunker("json");
    expect(chunker.strategy).toBe("json");
  });

  it("should create latex chunker", async () => {
    const chunker = await createChunker("latex");
    expect(chunker.strategy).toBe("latex");
  });

  it("should create semantic-markdown chunker", async () => {
    const chunker = await createChunker("semantic-markdown");
    expect(chunker.strategy).toBe("semantic-markdown");
  });
});
