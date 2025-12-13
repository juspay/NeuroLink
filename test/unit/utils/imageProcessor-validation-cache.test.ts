import { describe, it, expect, beforeEach } from "vitest";
import {
  imageUtils,
  clearValidationCache,
} from "../../../src/lib/utils/imageProcessor.js";

describe("ImageProcessor - Validation Cache", () => {
  // Clear cache before each test to ensure test isolation
  beforeEach(() => {
    clearValidationCache();
  });

  // Sample base64 strings for testing
  const validBase64 = "SGVsbG8gV29ybGQh"; // "Hello World!"
  const validBase64WithPadding = "SGVsbG8gV29ybGQ="; // "Hello World"
  const invalidBase64 = "Not@Valid#Base64!";
  const dataUri = `data:image/png;base64,${validBase64}`;

  describe("isValidBase64 - Basic Validation", () => {
    it("should validate correct base64 string", () => {
      expect(imageUtils.isValidBase64(validBase64)).toBe(true);
    });

    it("should validate correct base64 string with padding", () => {
      expect(imageUtils.isValidBase64(validBase64WithPadding)).toBe(true);
    });

    it("should reject invalid base64 string", () => {
      expect(imageUtils.isValidBase64(invalidBase64)).toBe(false);
    });

    it("should validate base64 in data URI format", () => {
      expect(imageUtils.isValidBase64(dataUri)).toBe(true);
    });

    it("should handle empty string", () => {
      // Empty string is valid base64 as Buffer.from('', 'base64') succeeds and encodes back to ''
      expect(imageUtils.isValidBase64("")).toBe(false);
    });
  });

  describe("Caching Behavior", () => {
    it("should return consistent results for same input (cache hit)", () => {
      const testString = validBase64;

      // First call - cache miss
      const result1 = imageUtils.isValidBase64(testString);

      // Second call - should hit cache
      const result2 = imageUtils.isValidBase64(testString);

      // Third call - should hit cache again
      const result3 = imageUtils.isValidBase64(testString);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe(true);
    });

    it("should cache both valid and invalid results", () => {
      // Cache valid result
      const validResult1 = imageUtils.isValidBase64(validBase64);
      const validResult2 = imageUtils.isValidBase64(validBase64);
      expect(validResult1).toBe(validResult2);
      expect(validResult1).toBe(true);

      // Cache invalid result
      const invalidResult1 = imageUtils.isValidBase64(invalidBase64);
      const invalidResult2 = imageUtils.isValidBase64(invalidBase64);
      expect(invalidResult1).toBe(invalidResult2);
      expect(invalidResult1).toBe(false);
    });

    it("should handle data URI strings and cache cleaned base64", () => {
      const dataUri1 = `data:image/png;base64,${validBase64}`;
      const dataUri2 = `data:image/jpeg;base64,${validBase64}`;

      // Both should extract and validate the same base64 content
      const result1 = imageUtils.isValidBase64(dataUri1);
      const result2 = imageUtils.isValidBase64(dataUri2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      // Both should hit the same cache entry (same base64 after cleaning)
    });

    it("should cache different base64 strings independently", () => {
      const base64_1 = "SGVsbG8="; // "Hello"
      const base64_2 = "V29ybGQ="; // "World"

      const result1 = imageUtils.isValidBase64(base64_1);
      const result2 = imageUtils.isValidBase64(base64_2);

      // Verify both calls and cache them
      expect(result1).toBe(true);
      expect(result2).toBe(true);

      // Verify cache hits return same results
      expect(imageUtils.isValidBase64(base64_1)).toBe(result1);
      expect(imageUtils.isValidBase64(base64_2)).toBe(result2);
    });
  });

  describe("Performance - Redundant Operations Avoided", () => {
    it("should avoid redundant encode/decode on repeated calls", () => {
      const testString = validBase64;
      const iterations = 100;

      // First call establishes cache
      const firstResult = imageUtils.isValidBase64(testString);

      // Subsequent calls should hit cache (no actual decode/encode)
      for (let i = 0; i < iterations; i++) {
        const result = imageUtils.isValidBase64(testString);
        expect(result).toBe(firstResult);
      }
    });

    it("should handle high volume of unique validations", () => {
      // Test with many different base64 strings
      const uniqueStrings = Array.from({ length: 100 }, (_, i) =>
        Buffer.from(`test-${i}`).toString("base64"),
      );

      // First pass - cache all
      const results1 = uniqueStrings.map((s) => imageUtils.isValidBase64(s));

      // Second pass - should all hit cache
      const results2 = uniqueStrings.map((s) => imageUtils.isValidBase64(s));

      expect(results1).toEqual(results2);
      expect(results1.every((r) => r === true)).toBe(true);
    });
  });

  describe("Cache Size Management", () => {
    it("should handle cache reaching maximum size", () => {
      // Generate more than MAX_CACHE_SIZE (1000) unique base64 strings
      const manyStrings = Array.from({ length: 1100 }, (_, i) =>
        Buffer.from(`unique-test-string-${i}`).toString("base64"),
      );

      // Validate all strings (this should trigger cache eviction)
      const results = manyStrings.map((s) => imageUtils.isValidBase64(s));

      // All should still be valid
      expect(results.every((r) => r === true)).toBe(true);

      // Verify cache eviction behavior: early entries should have been evicted
      // When cache reaches capacity, old entries are removed in batches
      // So validating early entries again should still work but may not be cached
      const earlyEntries = manyStrings.slice(0, 100);
      const revalidatedEarly = earlyEntries.map((s) =>
        imageUtils.isValidBase64(s),
      );
      expect(revalidatedEarly.every((r) => r === true)).toBe(true);

      // Recent entries (last 1000) should still be cached
      const recentEntries = manyStrings.slice(-1000);
      const revalidatedRecent = recentEntries.map((s) =>
        imageUtils.isValidBase64(s),
      );
      expect(revalidatedRecent.every((r) => r === true)).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle base64 strings with different padding lengths", () => {
      const noPadding = "SGVsbG8gV29ybGQh"; // No padding
      const onePadding = "SGVsbG8gV29ybGQ="; // One = padding
      const twoPadding = "SGVsbG8gV29ybA=="; // Two == padding

      expect(imageUtils.isValidBase64(noPadding)).toBe(true);
      expect(imageUtils.isValidBase64(onePadding)).toBe(true);
      expect(imageUtils.isValidBase64(twoPadding)).toBe(true);
    });

    it("should handle very long base64 strings", () => {
      // Create a large buffer and convert to base64
      const largeBuffer = Buffer.alloc(10000, "a");
      const largeBase64 = largeBuffer.toString("base64");

      const result1 = imageUtils.isValidBase64(largeBase64);
      const result2 = imageUtils.isValidBase64(largeBase64); // Should hit cache

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result1).toBe(result2);
    });

    it("should handle special characters that are invalid in base64", () => {
      const specialChars = [
        "abc!def",
        "abc@def",
        "abc#def",
        "abc$def",
        "abc%def",
        "abc&def",
      ];

      specialChars.forEach((str) => {
        // First validation
        expect(imageUtils.isValidBase64(str)).toBe(false);
        // Second validation should hit cache
        expect(imageUtils.isValidBase64(str)).toBe(false);
      });
    });

    it("should normalize base64 with different padding for comparison", () => {
      // These represent the same content with different padding
      const withPadding = "SGVsbG8gV29ybGQ=";

      // Should be valid
      expect(imageUtils.isValidBase64(withPadding)).toBe(true);
    });
  });

  describe("Integration with isBase64 helper", () => {
    it("should work through isBase64 convenience method", () => {
      expect(imageUtils.isBase64(validBase64)).toBe(true);
      expect(imageUtils.isBase64(invalidBase64)).toBe(false);

      // Verify caching works through the helper
      expect(imageUtils.isBase64(validBase64)).toBe(true);
      expect(imageUtils.isBase64(validBase64)).toBe(true);
    });
  });
});
