import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ImageProcessingTelemetry,
  type ImageOperation,
} from "../../../src/lib/telemetry/imageProcessingTelemetry.js";

describe("ImageProcessingTelemetry", () => {
  let telemetry: ImageProcessingTelemetry;

  beforeEach(() => {
    telemetry = ImageProcessingTelemetry.getInstance();
    telemetry.reset();
  });

  describe("getInstance", () => {
    it("should return the same instance (singleton)", () => {
      const instance1 = ImageProcessingTelemetry.getInstance();
      const instance2 = ImageProcessingTelemetry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("recordOperation", () => {
    it("should record successful operations", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 10,
        success: true,
        mimeType: "image/png",
      });

      const stats = telemetry.getStats();
      expect(stats.totalProcessed).toBe(1);
      expect(stats.successCount).toBe(1);
      expect(stats.failureCount).toBe(0);
      expect(stats.successRate).toBe(100);
    });

    it("should record failed operations", () => {
      telemetry.recordOperation({
        operation: "processForOpenAI",
        imageSize: 2048,
        processingTimeMs: 5,
        success: false,
        errorType: "ValidationError",
      });

      const stats = telemetry.getStats();
      expect(stats.totalProcessed).toBe(1);
      expect(stats.successCount).toBe(0);
      expect(stats.failureCount).toBe(1);
      expect(stats.successRate).toBe(0);
      expect(stats.errorBreakdown["ValidationError"]).toBe(1);
    });

    it("should track operation breakdown", () => {
      telemetry.recordOperation({
        operation: "processForOpenAI",
        imageSize: 1024,
        processingTimeMs: 5,
        success: true,
      });
      telemetry.recordOperation({
        operation: "processForGoogle",
        imageSize: 2048,
        processingTimeMs: 8,
        success: true,
      });
      telemetry.recordOperation({
        operation: "processForAnthropic",
        imageSize: 3072,
        processingTimeMs: 12,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.operationBreakdown.processForOpenAI).toBe(1);
      expect(stats.operationBreakdown.processForGoogle).toBe(1);
      expect(stats.operationBreakdown.processForAnthropic).toBe(1);
    });

    it("should track provider breakdown", () => {
      telemetry.recordOperation({
        operation: "processForOpenAI",
        provider: "openai",
        imageSize: 1024,
        processingTimeMs: 5,
        success: true,
      });
      telemetry.recordOperation({
        operation: "processForGoogle",
        provider: "google-ai",
        imageSize: 2048,
        processingTimeMs: 8,
        success: true,
      });
      telemetry.recordOperation({
        operation: "processForOpenAI",
        provider: "openai",
        imageSize: 1024,
        processingTimeMs: 3,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.providerBreakdown["openai"]).toBe(2);
      expect(stats.providerBreakdown["google-ai"]).toBe(1);
    });
  });

  describe("size distribution", () => {
    it("should classify tiny images (< 10KB)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 5 * 1024, // 5KB
        processingTimeMs: 1,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.sizeDistribution.tiny).toBe(1);
    });

    it("should classify small images (10KB - 100KB)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 50 * 1024, // 50KB
        processingTimeMs: 1,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.sizeDistribution.small).toBe(1);
    });

    it("should classify medium images (100KB - 500KB)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 300 * 1024, // 300KB
        processingTimeMs: 1,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.sizeDistribution.medium).toBe(1);
    });

    it("should classify large images (500KB - 1MB)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 800 * 1024, // 800KB
        processingTimeMs: 1,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.sizeDistribution.large).toBe(1);
    });

    it("should classify very large images (1MB - 5MB)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 2 * 1024 * 1024, // 2MB
        processingTimeMs: 1,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.sizeDistribution.very_large).toBe(1);
    });

    it("should classify huge images (> 5MB)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 10 * 1024 * 1024, // 10MB
        processingTimeMs: 1,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.sizeDistribution.huge).toBe(1);
    });
  });

  describe("duration distribution", () => {
    it("should classify instant processing (< 1ms)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 0.5,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.durationDistribution.instant).toBe(1);
    });

    it("should classify fast processing (1ms - 10ms)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 5,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.durationDistribution.fast).toBe(1);
    });

    it("should classify normal processing (10ms - 100ms)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 50,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.durationDistribution.normal).toBe(1);
    });

    it("should classify slow processing (100ms - 500ms)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 300,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.durationDistribution.slow).toBe(1);
    });

    it("should classify very slow processing (> 500ms)", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 1000,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.durationDistribution.very_slow).toBe(1);
    });
  });

  describe("getStats", () => {
    it("should calculate averages correctly", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1000,
        processingTimeMs: 10,
        success: true,
      });
      telemetry.recordOperation({
        operation: "process",
        imageSize: 2000,
        processingTimeMs: 20,
        success: true,
      });
      telemetry.recordOperation({
        operation: "process",
        imageSize: 3000,
        processingTimeMs: 30,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.averageProcessingTimeMs).toBe(20);
      expect(stats.averageSizeBytes).toBe(2000);
    });

    it("should calculate success rate correctly", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 5,
        success: true,
      });
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 5,
        success: true,
      });
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 5,
        success: false,
        errorType: "TestError",
      });
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 5,
        success: true,
      });

      const stats = telemetry.getStats();
      expect(stats.successRate).toBe(75);
    });

    it("should handle empty stats", () => {
      const stats = telemetry.getStats();
      expect(stats.totalProcessed).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageProcessingTimeMs).toBe(0);
      expect(stats.averageSizeBytes).toBe(0);
    });
  });

  describe("trackSync", () => {
    it("should track synchronous successful operations", () => {
      const result = telemetry.trackSync(
        "detectImageType",
        1024,
        () => "image/png",
        { mimeType: "image/png" },
      );

      expect(result).toBe("image/png");
      const stats = telemetry.getStats();
      expect(stats.totalProcessed).toBe(1);
      expect(stats.successCount).toBe(1);
      expect(stats.operationBreakdown.detectImageType).toBe(1);
    });

    it("should track synchronous failed operations", () => {
      expect(() => {
        telemetry.trackSync(
          "validateImageSize",
          1024,
          () => {
            throw new Error("Image too large");
          },
          {},
        );
      }).toThrow("Image too large");

      const stats = telemetry.getStats();
      expect(stats.totalProcessed).toBe(1);
      expect(stats.failureCount).toBe(1);
      expect(stats.errorBreakdown["Error"]).toBe(1);
    });
  });

  describe("trackOperation (async)", () => {
    it("should track asynchronous successful operations", async () => {
      const result = await telemetry.trackOperation(
        "process",
        1024,
        async () => "processed",
        { provider: "openai" },
      );

      expect(result).toBe("processed");
      const stats = telemetry.getStats();
      expect(stats.totalProcessed).toBe(1);
      expect(stats.successCount).toBe(1);
      expect(stats.providerBreakdown["openai"]).toBe(1);
    });

    it("should track asynchronous failed operations", async () => {
      await expect(
        telemetry.trackOperation("process", 1024, async () => {
          throw new Error("Processing failed");
        }),
      ).rejects.toThrow("Processing failed");

      const stats = telemetry.getStats();
      expect(stats.totalProcessed).toBe(1);
      expect(stats.failureCount).toBe(1);
    });
  });

  describe("reset", () => {
    it("should reset all statistics", () => {
      telemetry.recordOperation({
        operation: "process",
        imageSize: 1024,
        processingTimeMs: 10,
        success: true,
        provider: "openai",
      });
      telemetry.recordOperation({
        operation: "processForGoogle",
        imageSize: 2048,
        processingTimeMs: 20,
        success: false,
        errorType: "TestError",
      });

      telemetry.reset();

      const stats = telemetry.getStats();
      expect(stats.totalProcessed).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.failureCount).toBe(0);
      expect(Object.keys(stats.providerBreakdown).length).toBe(0);
      expect(Object.keys(stats.errorBreakdown).length).toBe(0);
    });
  });
});
