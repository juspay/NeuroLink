/**
 * Content Type Exports Test
 *
 * Tests to verify that content.ts exports all type guards from multimodal.ts
 * for backward compatibility.
 *
 * Issue TD-011: isMultimodalMessageContent was missing from content.ts exports
 */

import { describe, it, expect } from "vitest";
import * as contentExports from "../../src/lib/types/content.js";
import * as multimodalExports from "../../src/lib/types/multimodal.js";

describe("content.ts exports completeness", () => {
  it("should export all 8 type guard functions", () => {
    const requiredTypeGuards = [
      "isTextContent",
      "isImageContent",
      "isCSVContent",
      "isPDFContent",
      "isAudioContent",
      "isVideoContent",
      "isMultimodalInput",
      "isMultimodalMessageContent",
    ];

    for (const guardName of requiredTypeGuards) {
      expect(
        contentExports,
        `content.ts should export ${guardName}`,
      ).toHaveProperty(guardName);
      expect(
        typeof (contentExports as Record<string, unknown>)[guardName],
        `${guardName} should be a function`,
      ).toBe("function");
    }
  });

  it("should re-export the same functions as multimodal.ts", () => {
    const typeGuardNames = [
      "isTextContent",
      "isImageContent",
      "isCSVContent",
      "isPDFContent",
      "isAudioContent",
      "isVideoContent",
      "isMultimodalInput",
      "isMultimodalMessageContent",
    ];

    for (const guardName of typeGuardNames) {
      const contentFn = (contentExports as Record<string, unknown>)[guardName];
      const multimodalFn = (multimodalExports as Record<string, unknown>)[
        guardName
      ];

      expect(
        contentFn,
        `content.ts should export ${guardName} from multimodal.ts`,
      ).toBe(multimodalFn);
    }
  });

  it("should correctly identify text content", () => {
    const textContent = { type: "text", text: "Hello" };
    expect(contentExports.isTextContent(textContent as never)).toBe(true);
    expect(contentExports.isImageContent(textContent as never)).toBe(false);
  });

  it("should correctly identify image content", () => {
    const imageContent = { type: "image", data: Buffer.from("test") };
    expect(contentExports.isImageContent(imageContent as never)).toBe(true);
    expect(contentExports.isTextContent(imageContent as never)).toBe(false);
  });

  it("should correctly identify CSV content", () => {
    const csvContent = { type: "csv", data: "col1,col2\nval1,val2" };
    expect(contentExports.isCSVContent(csvContent as never)).toBe(true);
    expect(contentExports.isTextContent(csvContent as never)).toBe(false);
  });

  it("should correctly identify PDF content", () => {
    const pdfContent = { type: "pdf", data: Buffer.from("pdf-data") };
    expect(contentExports.isPDFContent(pdfContent as never)).toBe(true);
    expect(contentExports.isTextContent(pdfContent as never)).toBe(false);
  });

  it("should correctly identify audio content", () => {
    const audioContent = { type: "audio", data: Buffer.from("audio-data") };
    expect(contentExports.isAudioContent(audioContent as never)).toBe(true);
    expect(contentExports.isTextContent(audioContent as never)).toBe(false);
  });

  it("should correctly identify video content", () => {
    const videoContent = { type: "video", data: Buffer.from("video-data") };
    expect(contentExports.isVideoContent(videoContent as never)).toBe(true);
    expect(contentExports.isTextContent(videoContent as never)).toBe(false);
  });

  it("should correctly identify multimodal input", () => {
    const multimodalInput = {
      text: "Analyze this",
      images: [Buffer.from("image")],
    };
    expect(contentExports.isMultimodalInput(multimodalInput)).toBe(true);
    expect(contentExports.isMultimodalInput({ text: "Just text" })).toBe(false);
  });

  it("should correctly identify multimodal message content (array)", () => {
    const messageContentArray = [
      { type: "text", text: "Hello" },
      { type: "image", image: "data:image/png;base64,..." },
    ];
    expect(contentExports.isMultimodalMessageContent(messageContentArray)).toBe(
      true,
    );
    expect(contentExports.isMultimodalMessageContent("plain string")).toBe(
      false,
    );
  });
});
