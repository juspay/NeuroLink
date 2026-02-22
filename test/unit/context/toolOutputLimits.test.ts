import { describe, it, expect } from "vitest";
import {
  generateToolOutputPreview,
  DEFAULT_MAX_PREVIEW_LINES,
} from "../../../src/lib/context/toolOutputLimits.js";

describe("Tool Output Limits", () => {
  it("should not truncate small outputs", () => {
    const result = generateToolOutputPreview("Hello, world!");
    expect(result.truncated).toBe(false);
    expect(result.preview).toBe("Hello, world!");
  });

  it("should truncate outputs exceeding byte limit", () => {
    const largeOutput = "x".repeat(100 * 1024); // 100KB
    const result = generateToolOutputPreview(largeOutput);
    expect(result.truncated).toBe(true);
    expect(result.preview.length).toBeLessThan(largeOutput.length);
    expect(result.preview).toContain("bytes omitted");
  });

  it("should truncate outputs exceeding line limit", () => {
    const manyLines = Array.from({ length: 5000 }, (_, i) => `Line ${i}`).join(
      "\n",
    );
    const result = generateToolOutputPreview(manyLines);
    expect(result.truncated).toBe(true);
    // Head/tail preview should be well under original line count
    expect(result.preview.split("\n").length).toBeLessThan(
      manyLines.split("\n").length,
    );
  });

  it("should preserve head lines (first 25%)", () => {
    const manyLines = Array.from({ length: 3000 }, (_, i) => `Line ${i}`).join(
      "\n",
    );
    const result = generateToolOutputPreview(manyLines, {
      maxLines: 100,
    });
    expect(result.truncated).toBe(true);
    expect(result.preview).toContain("Line 0");
    expect(result.preview).toContain("bytes omitted");
  });

  it("should preserve tail lines (last 75%)", () => {
    const manyLines = Array.from({ length: 3000 }, (_, i) => `Line ${i}`).join(
      "\n",
    );
    const result = generateToolOutputPreview(manyLines, {
      maxLines: 100,
    });
    expect(result.truncated).toBe(true);
    expect(result.preview).toContain("Line 2999");
  });

  it("should report original size", () => {
    const content = "x".repeat(100_000);
    const result = generateToolOutputPreview(content);
    expect(result.originalSize).toBe(Buffer.byteLength(content, "utf-8"));
  });

  it("should respect custom maxBytes", () => {
    const content = "x".repeat(10_000);
    const result = generateToolOutputPreview(content, { maxBytes: 5_000 });
    expect(result.truncated).toBe(true);
  });

  it("should respect custom maxLines", () => {
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i}`).join("\n");
    const result = generateToolOutputPreview(lines, { maxLines: 50 });
    expect(result.truncated).toBe(true);
  });
});
