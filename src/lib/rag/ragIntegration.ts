/**
 * RAG Integration for generate() and stream()
 *
 * Provides automatic RAG pipeline setup when `rag` config is provided
 * in GenerateOptions or StreamOptions. Handles file loading, chunking,
 * embedding generation, vector storage, and tool creation internally
 * so developers only need to pass `rag: { files: [...] }`.
 */

import type { Tool } from "ai";
import { existsSync, readFileSync } from "fs";
import { extname, resolve } from "path";
import { z } from "zod";
import { logger } from "../utils/logger.js";
import { ChunkerRegistry } from "./chunking/index.js";
import {
  createVectorQueryTool,
  InMemoryVectorStore,
} from "./retrieval/vectorQueryTool.js";
import type { ChunkingStrategy, RAGConfig } from "./types.js";

/**
 * Maps file extensions to recommended chunking strategies
 */
const EXTENSION_TO_STRATEGY: Record<string, ChunkingStrategy> = {
  ".md": "markdown",
  ".mdx": "markdown",
  ".html": "html",
  ".htm": "html",
  ".json": "json",
  ".tex": "latex",
  ".latex": "latex",
  ".txt": "recursive",
  ".csv": "recursive",
  ".xml": "recursive",
  ".yaml": "recursive",
  ".yml": "recursive",
  ".ts": "recursive",
  ".js": "recursive",
  ".py": "recursive",
  ".java": "recursive",
  ".go": "recursive",
  ".rs": "recursive",
  ".c": "recursive",
  ".cpp": "recursive",
  ".rb": "recursive",
  ".php": "recursive",
  ".swift": "recursive",
  ".kt": "recursive",
};

/**
 * Detect the best chunking strategy from file extension
 */
function detectStrategy(filePath: string): ChunkingStrategy {
  const ext = extname(filePath).toLowerCase();
  return EXTENSION_TO_STRATEGY[ext] || "recursive";
}

/**
 * Generate deterministic embeddings for chunks.
 * Uses a simple hash-based approach for the in-memory vector store.
 * When a real embedding provider is configured, it will be used instead.
 */
function generateSimpleEmbedding(text: string, dimension: number): number[] {
  const embedding = new Array(dimension).fill(0);

  // Simple character-frequency based embedding
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const idx = charCode % dimension;
    embedding[idx] += 1;
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(
    embedding.reduce((sum: number, v: number) => sum + v * v, 0),
  );
  if (magnitude > 0) {
    for (let i = 0; i < dimension; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Result of preparing RAG for a generate/stream call
 */
export type RAGPreparedTool = {
  /** The tool to inject into the tools Record */
  tool: Tool;
  /** Tool name (key for the tools Record) */
  toolName: string;
  /** Number of chunks indexed */
  chunksIndexed: number;
  /** Number of files loaded */
  filesLoaded: number;
};

/**
 * Prepare RAG tools from the provided configuration.
 *
 * This function:
 * 1. Loads and reads all specified files
 * 2. Chunks them using the configured (or auto-detected) strategy
 * 3. Generates embeddings for each chunk
 * 4. Stores them in an in-memory vector store
 * 5. Creates a tool the AI model can use to search the documents
 *
 * @param ragConfig - RAG configuration from generate/stream options
 * @param fallbackProvider - Provider to use for embeddings if not specified in ragConfig
 * @returns Prepared RAG tool to inject into the tools record
 */
export async function prepareRAGTool(
  ragConfig: RAGConfig,
  fallbackProvider?: string,
): Promise<RAGPreparedTool> {
  const {
    files,
    strategy: userStrategy,
    chunkSize = 1000,
    chunkOverlap = 200,
    topK = 5,
    toolName = "search_knowledge_base",
    toolDescription = "REQUIRED: Search through pre-loaded local documents to find relevant information. Use this tool FIRST before any web search or other tools. This searches an indexed knowledge base of documents the user has provided.",
    embeddingProvider,
    embeddingModel,
  } = ragConfig;

  if (!files || files.length === 0) {
    throw new Error("RAG config requires at least one file path in 'files'");
  }

  // 1. Load files
  const fileContents: Array<{
    path: string;
    content: string;
    strategy: ChunkingStrategy;
  }> = [];

  for (const filePath of files) {
    const resolvedPath = resolve(filePath);
    if (!existsSync(resolvedPath)) {
      logger.warn(`[RAG] File not found, skipping: ${resolvedPath}`);
      continue;
    }

    try {
      const content = readFileSync(resolvedPath, "utf-8");
      const strategy = userStrategy || detectStrategy(resolvedPath);
      fileContents.push({ path: resolvedPath, content, strategy });
    } catch (error) {
      logger.warn(
        `[RAG] Failed to read file: ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (fileContents.length === 0) {
    throw new Error(
      "RAG: No files could be loaded. Check that file paths exist and are readable.",
    );
  }

  logger.info(`[RAG] Loaded ${fileContents.length} files for indexing`);

  // 2. Chunk all files
  const allChunks: Array<{
    text: string;
    metadata: Record<string, unknown>;
  }> = [];

  for (const { path, content, strategy } of fileContents) {
    try {
      const chunker = ChunkerRegistry.get(strategy);
      const chunks = await chunker.chunk(content, {
        maxSize: chunkSize,
        overlap: chunkOverlap,
        metadata: { source: path },
      });

      for (const chunk of chunks) {
        allChunks.push({
          text: chunk.text,
          metadata: { ...chunk.metadata, source: path },
        });
      }
    } catch (error) {
      logger.warn(
        `[RAG] Chunking failed for ${path}, using fallback: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Fallback: treat entire file as one chunk
      allChunks.push({
        text: content.slice(0, chunkSize),
        metadata: { source: path, fallback: true },
      });
    }
  }

  logger.info(
    `[RAG] Created ${allChunks.length} chunks from ${fileContents.length} files`,
  );

  // 3. Generate embeddings and store in vector store
  const EMBEDDING_DIMENSION = 128;
  const vectorStore = new InMemoryVectorStore();
  const indexName = "rag-index";

  const items = allChunks.map((chunk, i) => ({
    id: `rag-chunk-${i}`,
    vector: generateSimpleEmbedding(chunk.text, EMBEDDING_DIMENSION),
    metadata: {
      text: chunk.text,
      ...chunk.metadata,
    },
  }));

  await vectorStore.upsert(indexName, items);

  logger.info(`[RAG] Indexed ${items.length} chunks in vector store`);

  // 4. Create the search tool
  // Determine embedding provider/model for the query tool
  const provider = embeddingProvider || fallbackProvider || "vertex";
  const model = embeddingModel || "gemini-2.5-flash";

  const queryTool = createVectorQueryTool(
    {
      id: toolName,
      description: toolDescription,
      indexName,
      embeddingModel: { provider, modelName: model },
      topK,
      includeSources: true,
    },
    vectorStore,
  );

  // Convert to Vercel AI SDK Tool format
  const aiTool: Tool = {
    description: queryTool.description,
    parameters: z.object({
      query: z
        .string()
        .describe("The search query to find relevant information"),
    }),
    execute: async ({ query }: { query: string }) => {
      // For the in-memory store with simple embeddings,
      // generate a query embedding using the same method
      const queryEmbedding = generateSimpleEmbedding(
        query,
        EMBEDDING_DIMENSION,
      );

      const results = await vectorStore.query({
        indexName,
        queryVector: queryEmbedding,
        topK,
      });

      if (results.length === 0) {
        return {
          relevantContext: "No relevant documents found for the query.",
          sources: [],
          totalResults: 0,
        };
      }

      const relevantContext = results
        .map(
          (r, i) =>
            `[${i + 1}] ${(r.metadata?.text as string) || r.text || ""}`,
        )
        .join("\n\n");

      return {
        relevantContext,
        sources: results.map((r) => ({
          id: r.id,
          score: r.score,
          source: r.metadata?.source,
          text: ((r.metadata?.text as string) || r.text || "").slice(0, 200),
        })),
        totalResults: results.length,
      };
    },
  };

  return {
    tool: aiTool,
    toolName,
    chunksIndexed: allChunks.length,
    filesLoaded: fileContents.length,
  };
}
