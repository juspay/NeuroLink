/**
 * Client Integration Patterns
 *
 * Provides utilities for integrating NeuroLink streams with various client
 * environments including Node.js, browsers, and frameworks like React/Next.js.
 *
 * All functions work with the existing StreamResult.stream shape:
 *   AsyncIterable<{ content: string }>
 *
 * @module streaming/clientIntegration
 */

import { Readable } from "node:stream";

// ============================================
// STREAM CONSUMER TYPES
// ============================================

/**
 * Callback for text delta events
 */
export type OnTextDeltaCallback = (delta: string, accumulated: string) => void;

/**
 * Callback for completion
 */
export type OnCompleteCallback = (text: string) => void;

/**
 * Callback for errors
 */
export type OnErrorCallback = (error: Error) => void;

/**
 * Stream consumer options
 */
export type StreamConsumerOptions = {
  /** Callback for each text delta */
  onTextDelta?: OnTextDeltaCallback;
  /** Callback on completion */
  onComplete?: OnCompleteCallback;
  /** Callback on error */
  onError?: OnErrorCallback;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
};

// ============================================
// STREAM CONSUMER
// ============================================

/**
 * Consume a stream with callbacks.
 * Works with StreamResult.stream (AsyncIterable<{ content: string }>).
 *
 * @example Basic usage
 * ```typescript
 * const result = await neurolink.stream({ prompt: "Hello" });
 * await consumeStream(result.stream, {
 *   onTextDelta: (delta) => process.stdout.write(delta),
 *   onComplete: (text) => console.log("\nDone!"),
 * });
 * ```
 */
export async function consumeStream(
  stream: AsyncIterable<{ content: string } | Record<string, unknown>>,
  options: StreamConsumerOptions = {},
): Promise<{ text: string }> {
  let accumulatedText = "";

  try {
    for await (const chunk of stream) {
      // Check for abort
      if (options.signal?.aborted) {
        throw new Error("Stream aborted");
      }

      // Extract text content from chunk
      if ("content" in chunk && typeof chunk.content === "string") {
        accumulatedText += chunk.content;
        options.onTextDelta?.(chunk.content, accumulatedText);
      }
    }

    options.onComplete?.(accumulatedText);
    return { text: accumulatedText };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    options.onError?.(err);
    throw err;
  }
}

// ============================================
// REACT/HOOKS HELPERS
// ============================================

/**
 * State for React-compatible streaming
 */
export type StreamState = {
  /** Current text content */
  text: string;
  /** Is currently streaming */
  isStreaming: boolean;
  /** Error if any */
  error: Error | null;
  /** Chunk count */
  chunkCount: number;
};

/**
 * Create initial stream state
 * Note: isStreaming is true by default since this is called at the start of a streaming operation
 */
export function createInitialStreamState(): StreamState {
  return {
    text: "",
    isStreaming: true,
    error: null,
    chunkCount: 0,
  };
}

/**
 * State updater type for React-compatible streaming
 */
export type StreamStateUpdater = (state: Partial<StreamState>) => void;

/**
 * Consume stream with state updates (React-friendly).
 * Works with StreamResult.stream (AsyncIterable<{ content: string }>).
 *
 * @example React usage
 * ```typescript
 * const [state, setState] = useState(createInitialStreamState());
 *
 * const handleSubmit = async (message: string) => {
 *   const result = await neurolink.stream({ prompt: message });
 *   await consumeStreamWithState(result.stream, (update) => {
 *     setState((prev) => ({ ...prev, ...update }));
 *   });
 * };
 * ```
 */
export async function consumeStreamWithState(
  stream: AsyncIterable<{ content: string } | Record<string, unknown>>,
  updateState: StreamStateUpdater,
  signal?: AbortSignal,
): Promise<string> {
  let accumulatedText = "";
  let chunkCount = 0;

  updateState({ isStreaming: true, error: null, text: "" });

  try {
    for await (const chunk of stream) {
      if (signal?.aborted) {
        break;
      }

      if ("content" in chunk && typeof chunk.content === "string") {
        accumulatedText += chunk.content;
        chunkCount++;
        updateState({ text: accumulatedText, chunkCount });
      }
    }
  } catch (err) {
    updateState({
      error: err instanceof Error ? err : new Error(String(err)),
    });
  } finally {
    updateState({ isStreaming: false });
  }

  return accumulatedText;
}

// ============================================
// NODEJS STREAM ADAPTERS
// ============================================

/**
 * Convert any async iterable to Node.js Readable stream (JSON-line format)
 */
export function toNodeReadable<T>(
  stream: AsyncIterable<T>,
): NodeJS.ReadableStream {
  return Readable.from(
    (async function* () {
      for await (const item of stream) {
        yield JSON.stringify(item) + "\n";
      }
    })(),
  );
}

/**
 * Convert a content stream to text-only Node.js Readable.
 * Extracts `content` field from each chunk.
 */
export function toTextNodeReadable(
  stream: AsyncIterable<{ content: string } | Record<string, unknown>>,
): NodeJS.ReadableStream {
  return Readable.from(
    (async function* () {
      for await (const chunk of stream) {
        if ("content" in chunk && typeof chunk.content === "string") {
          yield chunk.content;
        }
      }
    })(),
  );
}

/**
 * Pipe stream text content to Node.js writable (e.g., process.stdout)
 */
export async function pipeToWritable(
  stream: AsyncIterable<{ content: string } | Record<string, unknown>>,
  writable: NodeJS.WritableStream,
  textOnly: boolean = true,
): Promise<void> {
  for await (const chunk of stream) {
    if (textOnly) {
      if ("content" in chunk && typeof chunk.content === "string") {
        writable.write(chunk.content);
      }
    } else {
      writable.write(JSON.stringify(chunk) + "\n");
    }
  }
}

// ============================================
// WEB STREAM ADAPTERS
// ============================================

/**
 * Convert any async iterable to Web ReadableStream
 */
export function toWebReadableStream<T>(
  stream: AsyncIterable<T>,
): ReadableStream<T> {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const item of stream) {
          controller.enqueue(item);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/**
 * Convert a content stream to text-only Web ReadableStream.
 * Extracts `content` field from each chunk.
 */
export function toTextWebReadableStream(
  stream: AsyncIterable<{ content: string } | Record<string, unknown>>,
): ReadableStream<string> {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if ("content" in chunk && typeof chunk.content === "string") {
            controller.enqueue(chunk.content);
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// ============================================
// ITERATOR UTILITIES
// ============================================

/**
 * Create an async iterator from a stream with timeout
 */
export async function* withTimeout<T>(
  stream: AsyncIterable<T>,
  timeoutMs: number,
): AsyncGenerator<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Stream timeout")), timeoutMs);
  });

  const iterator = stream[Symbol.asyncIterator]();

  try {
    while (true) {
      const result = await Promise.race([iterator.next(), timeoutPromise]);
      if (result.done) {
        break;
      }
      yield result.value;
    }
  } finally {
    await iterator.return?.();
  }
}

/**
 * Buffer stream events and emit in batches
 */
export async function* bufferStream<T>(
  stream: AsyncIterable<T>,
  bufferSize: number,
  flushIntervalMs: number = 100,
): AsyncGenerator<T[]> {
  const buffer: T[] = [];
  let lastFlush = Date.now();

  for await (const item of stream) {
    buffer.push(item);

    const shouldFlush =
      buffer.length >= bufferSize || Date.now() - lastFlush >= flushIntervalMs;

    if (shouldFlush && buffer.length > 0) {
      yield [...buffer];
      buffer.length = 0;
      lastFlush = Date.now();
    }
  }

  // Flush remaining items
  if (buffer.length > 0) {
    yield buffer;
  }
}

/**
 * Debounce stream events
 */
export async function* debounceStream<T>(
  stream: AsyncIterable<T>,
  delayMs: number,
): AsyncGenerator<T> {
  let lastItem: T | undefined;
  let lastEmitTime = 0;

  for await (const item of stream) {
    lastItem = item;
    const now = Date.now();

    if (now - lastEmitTime >= delayMs) {
      yield item;
      lastEmitTime = now;
    }
  }

  // Always emit the last item
  if (lastItem !== undefined && Date.now() - lastEmitTime < delayMs) {
    yield lastItem;
  }
}

/**
 * Throttle stream to maximum events per second
 */
export async function* throttleStream<T>(
  stream: AsyncIterable<T>,
  eventsPerSecond: number,
): AsyncGenerator<T> {
  const minInterval = 1000 / eventsPerSecond;
  let lastEmitTime = 0;

  for await (const item of stream) {
    const now = Date.now();
    const elapsed = now - lastEmitTime;

    if (elapsed < minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, minInterval - elapsed),
      );
    }

    yield item;
    lastEmitTime = Date.now();
  }
}

// ============================================
// STREAM MULTIPLEXING
// ============================================

/**
 * Tee a stream into multiple consumers
 */
export function teeStream<T>(
  stream: AsyncIterable<T>,
  count: number = 2,
): AsyncIterable<T>[] {
  const queues: Array<Array<{ value: T; done: boolean }>> = Array.from(
    { length: count },
    () => [],
  );
  const resolvers: Array<(() => void) | null> = Array.from(
    { length: count },
    () => null,
  );
  let sourceExhausted = false;
  let sourceError: Error | null = null;

  // Start consuming the source
  (async () => {
    try {
      for await (const value of stream) {
        for (let i = 0; i < count; i++) {
          queues[i].push({ value, done: false });
          resolvers[i]?.();
        }
      }
    } catch (err) {
      sourceError = err instanceof Error ? err : new Error(String(err));
    } finally {
      sourceExhausted = true;
      for (let i = 0; i < count; i++) {
        queues[i].push({ value: undefined as unknown as T, done: true });
        resolvers[i]?.();
      }
    }
  })();

  // Create consumers
  return Array.from({ length: count }, (_, index) => ({
    [Symbol.asyncIterator]: () => ({
      async next(): Promise<IteratorResult<T>> {
        while (queues[index].length === 0 && !sourceExhausted) {
          await new Promise<void>((resolve) => {
            resolvers[index] = resolve;
          });
          resolvers[index] = null;
        }

        if (sourceError) {
          throw sourceError;
        }

        const item = queues[index].shift();
        if (!item || item.done) {
          return { done: true, value: undefined };
        }
        return { done: false, value: item.value };
      },
    }),
  }));
}

/**
 * Merge multiple streams into one
 */
export async function* mergeStreams<T>(
  streams: AsyncIterable<T>[],
): AsyncGenerator<T> {
  const iterators = streams.map((s) => s[Symbol.asyncIterator]());
  const pending = new Set(
    iterators.map((it, i) => ({ iterator: it, index: i })),
  );

  while (pending.size > 0) {
    const promises = Array.from(pending).map(async ({ iterator, index }) => {
      const result = await iterator.next();
      return { result, index };
    });

    const { result, index } = await Promise.race(promises);

    if (result.done) {
      const entry = Array.from(pending).find((p) => p.index === index);
      if (entry) {
        pending.delete(entry);
      }
    } else {
      yield result.value;
    }
  }
}
