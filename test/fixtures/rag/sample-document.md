# NeuroLink RAG System Documentation

NeuroLink provides a comprehensive RAG (Retrieval-Augmented Generation) system for building intelligent applications.

## Overview

RAG combines the power of large language models with external knowledge retrieval. This approach enables AI systems to:

- Access up-to-date information beyond training data
- Provide more accurate, grounded responses
- Reduce hallucinations through factual grounding
- Support domain-specific knowledge integration

## Chunking Strategies

NeuroLink supports multiple chunking strategies optimized for different document types.

### Character-Based Chunking

Fixed-size chunks based on character count. Best for:

- Uniform text without structure
- Maximum control over chunk size
- Simple preprocessing needs

```typescript
const chunks = await chunker.chunk(text, {
  strategy: "character",
  maxSize: 500,
  overlap: 50,
});
```

### Sentence-Based Chunking

Preserves sentence boundaries for natural text segments. Best for:

- Prose and narrative content
- Legal documents
- News articles

### Markdown-Aware Chunking

Respects markdown structure including headers, code blocks, and lists. Best for:

- Technical documentation
- README files
- Wiki pages

### Semantic Chunking

Groups content by semantic similarity. Best for:

- Mixed-topic documents
- Research papers
- Long-form content

## Vector Search

Vector search enables semantic similarity matching using embeddings.

### Embedding Models

Supported embedding providers:

1. OpenAI (text-embedding-3-small, text-embedding-3-large)
2. Cohere (embed-english-v3.0)
3. Local models via Ollama

### Similarity Metrics

Available metrics:

- **Cosine similarity**: Best for normalized embeddings
- **Euclidean distance**: When magnitude matters
- **Dot product**: Fast computation for normalized vectors

## Hybrid Search

Combines BM25 keyword search with vector similarity for optimal retrieval.

### Reciprocal Rank Fusion (RRF)

RRF combines rankings from multiple retrieval methods:

```
score(d) = Σ 1/(k + rank_i(d))
```

Where k is typically 60 and rank_i is the rank from retrieval method i.

### Linear Combination

Weighted combination of normalized scores:

```
score(d) = α * vector_score(d) + (1-α) * bm25_score(d)
```

## Reranking

Reranking improves retrieval precision by rescoring initial results.

### Simple Reranking

Position and vector score-based reranking without LLM calls.

### LLM Reranking

Uses language models to score relevance:

- More accurate for complex queries
- Higher latency and cost
- Best for critical applications

### Cross-Encoder Reranking

Specialized models trained for relevance scoring:

- ms-marco-MiniLM-L-6-v2
- cross-encoder/ms-marco-TinyBERT-L-2

## API Integration

### Generate with RAG

```typescript
const result = await neurolink.generate({
  messages: [{ role: "user", content: "What is RAG?" }],
  tools: [ragTool],
  toolChoice: "auto",
});
```

### Stream with RAG

```typescript
const stream = await neurolink.stream({
  messages: [{ role: "user", content: "Explain chunking" }],
  tools: [ragTool],
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

## Best Practices

1. **Choose appropriate chunk size**: 200-500 tokens for most use cases
2. **Use overlap**: 10-20% overlap prevents context loss at boundaries
3. **Match chunking to content**: Use markdown chunker for docs, JSON for APIs
4. **Enable reranking**: For critical queries where precision matters
5. **Monitor retrieval quality**: Track relevance scores over time

## Troubleshooting

### Low Retrieval Quality

- Increase topK to retrieve more candidates
- Lower similarity threshold
- Enable hybrid search
- Try different chunking strategies

### High Latency

- Reduce chunk size
- Disable reranking for non-critical queries
- Use faster embedding models
- Cache frequently accessed embeddings

---

This documentation is part of the NeuroLink AI Toolkit.
