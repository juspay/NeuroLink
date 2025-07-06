/**
 * Phase 2: Enhanced Streaming Infrastructure Tests
 * Testing streaming progress tracking and metadata enhancement
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  StreamingEnhancer,
  StreamingMonitor,
} from "../lib/utils/streaming-utils.js";
import type {
  StreamingProgressData,
  ProgressCallback,
} from "../lib/core/types.js";

describe("Phase 2: Enhanced Streaming Infrastructure", () => {
  beforeEach(() => {
    // Clear any active streams before each test
    StreamingMonitor.getActiveStreams().forEach((stream) => {
      if (stream.streamId) {
        StreamingMonitor.completeStream(stream.streamId);
      }
    });
  });

  describe("StreamingEnhancer", () => {
    it("should add progress tracking to a stream", async () => {
      const progressUpdates: StreamingProgressData[] = [];
      const callback: ProgressCallback = (progress) => {
        progressUpdates.push(progress);
      };

      // Create a mock readable stream
      const chunks = ["chunk1", "chunk2", "chunk3"];
      let chunkIndex = 0;

      const sourceStream = new ReadableStream({
        pull(controller) {
          if (chunkIndex < chunks.length) {
            controller.enqueue(chunks[chunkIndex++]);
          } else {
            controller.close();
          }
        },
      });

      const enhancedStream = StreamingEnhancer.addProgressTracking(
        sourceStream,
        callback,
        { streamId: "test-stream", bufferSize: 1024 },
      );

      // Read the enhanced stream
      const reader = enhancedStream.getReader();
      const results = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          results.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      // Verify stream data integrity
      expect(results).toEqual(chunks);

      // Verify progress tracking
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].phase).toBe("initializing");
      expect(progressUpdates[progressUpdates.length - 1].phase).toBe(
        "complete",
      );
    });

    it("should create streaming configuration", () => {
      const options = {
        prompt: "test",
        enableProgressTracking: true,
        includeStreamingMetadata: true,
        streamingBufferSize: 2048,
        enableStreamingHeaders: true,
      };

      const config = StreamingEnhancer.createStreamingConfig(options);

      expect(config.progressTracking).toBe(true);
      expect(config.metadata).toBe(true);
      expect(config.bufferSize).toBe(2048);
      expect(config.headers).toBe(true);
    });

    it("should add metadata headers to response", () => {
      const mockResponse = new Response("test body", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });

      const stats = {
        totalChunks: 10,
        totalBytes: 1024,
        duration: 2000,
        averageChunkSize: 102.4,
        provider: "test-provider",
        model: "test-model",
      };

      const enhancedResponse = StreamingEnhancer.addMetadataHeaders(
        mockResponse,
        stats,
      );

      expect(enhancedResponse.headers.get("X-Streaming-Chunks")).toBe("10");
      expect(enhancedResponse.headers.get("X-Streaming-Bytes")).toBe("1024");
      expect(enhancedResponse.headers.get("X-Streaming-Provider")).toBe(
        "test-provider",
      );
      expect(enhancedResponse.headers.get("X-Streaming-Model")).toBe(
        "test-model",
      );
    });

    it("should estimate remaining time accurately", () => {
      // Test with sufficient data
      const estimate1 = StreamingEnhancer.estimateRemainingTime(1000, 2000, 5);
      expect(estimate1).toBeTypeOf("number");

      // Test with insufficient data
      const estimate2 = StreamingEnhancer.estimateRemainingTime(100, 500, 1);
      expect(estimate2).toBeUndefined();
    });
  });

  describe("StreamingMonitor", () => {
    it("should register and track active streams", () => {
      const streamId = "monitor-test-stream";

      StreamingMonitor.registerStream(streamId);

      const activeStreams = StreamingMonitor.getActiveStreams();
      expect(activeStreams.length).toBe(1);
      expect(activeStreams[0].streamId).toBe(streamId);
      expect(activeStreams[0].phase).toBe("initializing");
    });

    it("should update stream progress", () => {
      const streamId = "update-test-stream";

      StreamingMonitor.registerStream(streamId);

      const progressUpdate: StreamingProgressData = {
        chunkCount: 5,
        totalBytes: 500,
        chunkSize: 100,
        elapsedTime: 1000,
        streamId,
        phase: "streaming",
      };

      StreamingMonitor.updateStream(streamId, progressUpdate);

      const activeStreams = StreamingMonitor.getActiveStreams();
      expect(activeStreams[0].chunkCount).toBe(5);
      expect(activeStreams[0].phase).toBe("streaming");
    });

    it("should complete and remove streams", () => {
      const streamId = "complete-test-stream";

      StreamingMonitor.registerStream(streamId);
      expect(StreamingMonitor.getActiveStreams().length).toBe(1);

      StreamingMonitor.completeStream(streamId);
      expect(StreamingMonitor.getActiveStreams().length).toBe(0);
    });

    it("should provide stream statistics", () => {
      const streamId1 = "stats-test-stream-1";
      const streamId2 = "stats-test-stream-2";

      StreamingMonitor.registerStream(streamId1);
      StreamingMonitor.registerStream(streamId2);

      StreamingMonitor.updateStream(streamId1, {
        chunkCount: 3,
        totalBytes: 300,
        chunkSize: 100,
        elapsedTime: 1500,
        streamId: streamId1,
        phase: "streaming",
      });

      StreamingMonitor.updateStream(streamId2, {
        chunkCount: 2,
        totalBytes: 200,
        chunkSize: 100,
        elapsedTime: 1000,
        streamId: streamId2,
        phase: "streaming",
      });

      const stats = StreamingMonitor.getStreamStats();

      expect(stats.activeCount).toBe(2);
      expect(stats.totalBytesActive).toBe(500);
      expect(stats.averageProgress).toBe(1250); // (1500 + 1000) / 2
    });
  });

  describe("UI Integration", () => {
    it("should create progress callback for UI", () => {
      const uiUpdates: any[] = [];
      const uiErrors: Error[] = [];
      const uiCompletions: any[] = [];

      const uiHandler = {
        onProgress: (progress: StreamingProgressData) =>
          uiUpdates.push(progress),
        onComplete: (metadata: any) => uiCompletions.push(metadata),
        onError: (error: Error) => uiErrors.push(error),
      };

      const callback = StreamingEnhancer.createProgressCallback(uiHandler);

      // Test progress update
      callback({
        chunkCount: 1,
        totalBytes: 100,
        chunkSize: 100,
        elapsedTime: 500,
        streamId: "ui-test",
        phase: "streaming",
      });

      expect(uiUpdates.length).toBe(1);
      expect(uiUpdates[0].phase).toBe("streaming");

      // Test completion
      callback({
        chunkCount: 3,
        totalBytes: 300,
        chunkSize: 100,
        elapsedTime: 1500,
        streamId: "ui-test",
        phase: "complete",
      });

      expect(uiCompletions.length).toBe(1);
      expect(uiCompletions[0].totalDuration).toBe(1500);
    });
  });

  describe("Integration with AgentEnhancedProvider", () => {
    it("should support enhanced streaming options", () => {
      const options = {
        prompt: "test prompt",
        enableProgressTracking: true,
        progressCallback: vi.fn(),
        includeStreamingMetadata: true,
        streamingBufferSize: 4096,
        enableStreamingHeaders: true,
        customStreamingConfig: {
          chunkDelayMs: 10,
          maxConcurrentChunks: 5,
          compressionEnabled: true,
        },
      };

      const config = StreamingEnhancer.createStreamingConfig(options);

      expect(config.progressTracking).toBe(true);
      expect(config.callback).toBe(options.progressCallback);
      expect(config.metadata).toBe(true);
      expect(config.bufferSize).toBe(4096);
      expect(config.headers).toBe(true);
    });
  });
});
