#!/bin/bash
# RAG with generate and stream CLI commands
#
# Copy-paste these commands to test RAG integration.
# Prerequisites:
#   - pnpm run build:cli && pnpm link --global
#   - GOOGLE_API_KEY or VERTEX_AI credentials set
#
# Usage:
#   bash examples/rag-cli-examples.sh
#   # Or copy individual commands below

set -e
echo "=== RAG CLI Examples ==="
echo ""

# ─────────────────────────────────────────────
# Example 1: generate with RAG (single file)
# ─────────────────────────────────────────────
echo "--- Example 1: generate with single file RAG ---"
neurolink generate "What chunking strategies are available?" \
  --provider vertex \
  --model gemini-2.5-flash \
  --rag-files docs/features/rag.md
echo ""

# ─────────────────────────────────────────────
# Example 2: generate with RAG (multiple files)
# ─────────────────────────────────────────────
echo "--- Example 2: generate with multi-file RAG ---"
neurolink generate "How do I configure chunk size and overlap for my documents?" \
  --provider vertex \
  --model gemini-2.5-flash \
  --rag-files docs/features/rag.md docs/rag/CONFIGURATION.md \
  --rag-strategy markdown \
  --rag-chunk-size 512 \
  --rag-top-k 5
echo ""

# ─────────────────────────────────────────────
# Example 3: stream with RAG
# ─────────────────────────────────────────────
echo "--- Example 3: stream with RAG ---"
neurolink stream "Explain hybrid search and how it combines BM25 with vector search" \
  --provider vertex \
  --model gemini-2.5-flash \
  --rag-files docs/features/rag.md
echo ""

# ─────────────────────────────────────────────
# Example 4: RAG with source code files
# ─────────────────────────────────────────────
echo "--- Example 4: RAG with source code ---"
neurolink generate "What does the InMemoryVectorStore class do? List its methods." \
  --provider vertex \
  --model gemini-2.5-flash \
  --rag-files src/lib/rag/retrieval/vectorQueryTool.ts \
  --rag-strategy recursive \
  --rag-chunk-size 800
echo ""

# ─────────────────────────────────────────────
# Example 5: RAG with custom system prompt
# ─────────────────────────────────────────────
echo "--- Example 5: RAG with custom system prompt ---"
neurolink generate "What are the available reranker types?" \
  --provider vertex \
  --model gemini-2.5-flash \
  --system "You are a technical documentation assistant. Answer concisely using bullet points. Always cite the source document." \
  --rag-files docs/features/rag.md docs/rag/CONFIGURATION.md \
  --rag-top-k 8
echo ""

echo "=== All examples complete ==="
