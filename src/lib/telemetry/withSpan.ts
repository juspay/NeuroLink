import { type Span, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import type { SpanOptions } from "../types/index.js";

export async function withSpan<T>(
  options: SpanOptions,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const { name, tracer, kind = SpanKind.INTERNAL, attributes } = options;
  return tracer.startActiveSpan(name, { kind }, async (span) => {
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined) {
          span.setAttribute(key, value);
        }
      }
    }
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof Error) {
        span.recordException(error);
      }
      throw error;
    } finally {
      span.end();
    }
  });
}

export async function withClientSpan<T>(
  options: Omit<SpanOptions, "kind">,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return withSpan({ ...options, kind: SpanKind.CLIENT }, fn);
}
