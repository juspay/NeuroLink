/**
 * Embedding-retrieval fast-path for pre-call tool routing (ITEM B / L2).
 *
 * For large tool catalogs, ranking by semantic similarity is far cheaper than
 * an LLM router call and benchmarks at sub-10 ms when embedding vectors are
 * cached. This module is intentionally PURE with no provider imports: the
 * caller injects an `embedFn` so the retriever stays testable and free of
 * circular dependencies.
 *
 * Hybrid scoring formula:
 *   score = weights.cosine * cosineSimilarity(queryVec, toolVec)
 *         + weights.bm25   * bm25Score(query, toolText)
 *
 * Both components are independently normalized to [0, 1] before combination
 * so neither scale dominates.
 *
 * Fail-safe contract:
 *   `ToolEmbeddingIndex.rank()` and `selectRelevantToolNames()` propagate any
 *   error thrown by the injected `embedFn`. The CALLER (tool-routing
 *   orchestration) is responsible for catching that error and degrading
 *   gracefully to the LLM-router / server-granularity path.
 *
 * Determinism:
 *   All public functions are deterministic given the same inputs and embedFn.
 *   No Math.random(), no argless Date, no global mutable state outside the
 *   instance-level vector cache (which is keyed by text content).
 */

import { withTimeout } from "../utils/async/index.js";
import type {
  ToolRetrievalItem,
  ToolRetrievalRankedResult,
  ToolRetrievalSelectOptions,
  ToolRetrievalWeights,
  ToolRoutingBm25Doc,
} from "../types/index.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS: ToolRetrievalWeights = { cosine: 0.8, bm25: 0.2 };

/** BM25 free-parameter k1 — controls term-frequency saturation. */
const BM25_K1 = 1.5;

/** BM25 free-parameter b — controls document-length normalisation. */
const BM25_B = 0.75;

// ---------------------------------------------------------------------------
// Primitive helpers (pure, no side-effects)
// ---------------------------------------------------------------------------

/**
 * Tokenise text for BM25/lexical scoring: lowercase, strip punctuation, split
 * on whitespace, drop empty tokens.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Cosine similarity between two vectors.
 *
 * Returns 0 when either vector is zero-length, has zero magnitude, or the
 * lengths differ — all of which indicate the comparison is meaningless.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ---------------------------------------------------------------------------
// BM25 scorer
// ---------------------------------------------------------------------------

/**
 * A minimal, deterministic BM25 corpus over a fixed set of documents.
 * Documents are indexed at construction time; only `score()` is exposed
 * for query-time use.
 *
 * This is a TF-IDF/BM25 hybrid consistent with the InMemoryBM25Index in
 * `src/lib/rag/retrieval/hybridSearch.ts`, adapted for a read-once static
 * corpus (tool descriptions do not change within a turn).
 *
 * `ToolRoutingBm25Doc` is the per-document shape; it lives in
 * `src/lib/types/toolRouting.ts` per Critical Rule 2.
 */
class Bm25Corpus {
  private readonly docs: ToolRoutingBm25Doc[];
  private readonly avgDocLength: number;
  /** IDF per unique token across all documents (computed once). */
  private readonly idf: Map<string, number>;

  constructor(texts: string[]) {
    this.docs = texts.map((text) => {
      const tokens = tokenize(text);
      const tf = new Map<string, number>();
      for (const t of tokens) {
        tf.set(t, (tf.get(t) ?? 0) + 1);
      }
      return { tokens, tf };
    });

    const totalLength = this.docs.reduce((s, d) => s + d.tokens.length, 0);
    this.avgDocLength =
      this.docs.length > 0 ? totalLength / this.docs.length : 1;

    // Precompute IDF for every token that appears in any document.
    const N = this.docs.length;
    const df = new Map<string, number>();
    for (const doc of this.docs) {
      for (const token of doc.tf.keys()) {
        df.set(token, (df.get(token) ?? 0) + 1);
      }
    }

    this.idf = new Map<string, number>();
    for (const [token, docFreq] of df) {
      // Robertson/Sparck-Jones IDF (safe against 0):
      //   log((N - df + 0.5) / (df + 0.5) + 1)
      this.idf.set(token, Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1));
    }
  }

  /**
   * Returns the BM25 score of `docIndex` against `query`.
   * Score is always >= 0. Returns 0 for empty queries or out-of-range indices.
   */
  score(docIndex: number, query: string): number {
    if (docIndex < 0 || docIndex >= this.docs.length) {
      return 0;
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return 0;
    }

    const doc = this.docs[docIndex];
    const docLength = doc.tokens.length;

    let total = 0;
    for (const qt of queryTokens) {
      const tf = doc.tf.get(qt) ?? 0;
      if (tf === 0) {
        continue;
      }
      const idf = this.idf.get(qt) ?? 0;
      // BM25 term contribution
      const numerator = tf * (BM25_K1 + 1);
      const denominator =
        tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / this.avgDocLength));
      total += idf * (numerator / denominator);
    }

    return total;
  }
}

// ---------------------------------------------------------------------------
// Normalisation helper
// ---------------------------------------------------------------------------

/**
 * Min-max normalises an array of non-negative scores to [0, 1].
 * Returns an array of zeros when all scores are identical (range === 0).
 */
function normalizeScores(scores: number[]): number[] {
  if (scores.length === 0) {
    return [];
  }
  let min = scores[0] ?? 0;
  let max = scores[0] ?? 0;
  for (let i = 1; i < scores.length; i++) {
    const s = scores[i] ?? 0;
    if (s < min) {
      min = s;
    }
    if (s > max) {
      max = s;
    }
  }
  const range = max - min;
  if (range === 0) {
    return scores.map(() => 0);
  }
  return scores.map((s) => (s - min) / range);
}

// ---------------------------------------------------------------------------
// ToolEmbeddingIndex
// ---------------------------------------------------------------------------

/**
 * An in-process index that ranks tool catalog items by hybrid semantic +
 * lexical relevance to a query.
 *
 * Embedding vectors for tool descriptions are computed lazily on the first
 * `rank()` call and cached by description text, so subsequent turns that
 * share the same catalog pay only the cost of embedding the query itself.
 *
 * ### Fail-safe
 * Any error thrown by `embedFn` propagates out of `rank()`. The CALLER must
 * catch it and degrade to the LLM-router path; `ToolEmbeddingIndex` itself
 * never silently swallows embedFn errors.
 *
 * ### Thread-safety
 * The internal cache is a plain `Map`. Node.js is single-threaded so there
 * are no data races, but if the same index instance is used concurrently
 * (e.g. two turns in parallel) both calls will race to populate the cache;
 * the last writer wins (same content either way because `embedFn` is
 * deterministic for a given text).
 */
export class ToolEmbeddingIndex {
  private readonly items: ToolRetrievalItem[];
  private readonly embedFn: (texts: string[]) => Promise<number[][]>;
  private bm25CorpusCache?: { key: string; corpus: Bm25Corpus };

  /**
   * Cached embedding vectors keyed by the item's `text` field.
   * Populated on first `rank()` call for texts not yet seen.
   *
   * Callers can share a single Map across multiple index instances (e.g.
   * across turns in the same NeuroLink session) so tool vectors are computed
   * once and reused. Pass the shared Map via the constructor's third argument.
   */
  private readonly vectorCache: Map<string, number[]>;

  constructor(
    items: ToolRetrievalItem[],
    embedFn: (texts: string[]) => Promise<number[][]>,
    /**
     * Optional shared vector cache. When supplied, cached vectors from
     * previous turns are reused and any newly-computed vectors are stored
     * into this same Map, making it warm for the next call.
     */
    sharedVectorCache?: Map<string, number[]>,
  ) {
    this.items = items;
    this.embedFn = embedFn;
    this.vectorCache = sharedVectorCache ?? new Map<string, number[]>();
  }

  /**
   * Returns the top-K catalog items ranked by hybrid score descending.
   *
   * @throws If `embedFn` throws — propagated verbatim so the caller can fail
   *   open. No wrapping, no swallowing.
   */
  async rank(
    query: string,
    opts: { topK: number; weights?: ToolRetrievalWeights; timeoutMs?: number },
  ): Promise<ToolRetrievalRankedResult[]> {
    if (this.items.length === 0) {
      return [];
    }

    const weights = opts.weights ?? DEFAULT_WEIGHTS;

    // Identify which item texts still need embedding vectors.
    const uncachedTexts = [
      ...new Set(
        this.items
          .map((item) => item.text)
          .filter((text) => !this.vectorCache.has(text)),
      ),
    ];

    if (uncachedTexts.length > 0) {
      // embedFn errors propagate — caller is responsible for fail-open.
      const vectors = await withTimeout(
        this.embedFn(uncachedTexts),
        opts.timeoutMs ?? 10000,
        "ToolEmbeddingIndex.embed",
      );
      for (let i = 0; i < uncachedTexts.length; i++) {
        const vec = vectors[i];
        if (vec !== undefined) {
          this.vectorCache.set(uncachedTexts[i], vec);
        }
      }
    }

    // Embed the query (single call; the query is not cached since it changes
    // every turn — caching query vectors is the caller's responsibility if
    // desired, e.g. via ToolRoutingCache).
    const [queryVector] = await withTimeout(
      this.embedFn([query]),
      opts.timeoutMs ?? 10000,
      "ToolEmbeddingIndex.queryEmbed",
    );

    // Build BM25 corpus lazily; rebuild only when the item texts change.
    const corpusKey = this.items.map((item) => item.text).join("\x00");
    if (!this.bm25CorpusCache || this.bm25CorpusCache.key !== corpusKey) {
      this.bm25CorpusCache = {
        key: corpusKey,
        corpus: new Bm25Corpus(this.items.map((item) => item.text)),
      };
    }
    const bm25Corpus = this.bm25CorpusCache.corpus;

    // Compute raw cosine and BM25 scores for each item.
    const rawCosine: number[] = [];
    const rawBm25: number[] = [];

    for (let i = 0; i < this.items.length; i++) {
      const toolVec = this.vectorCache.get(this.items[i].text) ?? [];
      rawCosine.push(cosineSimilarity(queryVector ?? [], toolVec));
      rawBm25.push(bm25Corpus.score(i, query));
    }

    // Normalize each component independently so scales don't interact.
    const normCosine = normalizeScores(rawCosine);
    const normBm25 = normalizeScores(rawBm25);

    // Combine into hybrid score and zip with item names.
    const ranked: ToolRetrievalRankedResult[] = this.items.map((item, i) => ({
      name: item.name,
      score:
        weights.cosine * (normCosine[i] ?? 0) +
        weights.bm25 * (normBm25[i] ?? 0),
    }));

    // Sort descending by score, then by name for a deterministic tie-break.
    ranked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    return ranked.slice(0, opts.topK);
  }
}

// ---------------------------------------------------------------------------
// Convenience wrapper
// ---------------------------------------------------------------------------

/**
 * Selects the most relevant tool names from a catalog given a query.
 *
 * Creates a temporary `ToolEmbeddingIndex`, runs `rank()`, and returns just
 * the tool names. Use `ToolEmbeddingIndex` directly when you want to reuse
 * cached tool vectors across multiple queries (e.g. multiple turns with the
 * same catalog).
 *
 * @throws If `opts.embedFn` throws — propagated so the caller can degrade to
 *   the LLM-router path.
 *
 * @example
 * ```ts
 * const tools = await selectRelevantToolNames(
 *   "show me yesterday's sales",
 *   catalog.flatMap(server => server.toolNames.map(name => ({
 *     name,
 *     text: `${server.description} — ${name}`,
 *   }))),
 *   { topK: 5, embedFn: myEmbedFn },
 * );
 * // => ["analytics_getSales", "analytics_getRevenue", ...]
 * ```
 */
export async function selectRelevantToolNames(
  query: string,
  items: ToolRetrievalItem[],
  opts: ToolRetrievalSelectOptions,
): Promise<string[]> {
  const index = new ToolEmbeddingIndex(items, opts.embedFn, opts.vectorCache);
  const ranked = await index.rank(query, {
    topK: opts.topK,
    weights: opts.weights,
    timeoutMs: opts.timeoutMs,
  });
  return ranked.map((r) => r.name);
}
