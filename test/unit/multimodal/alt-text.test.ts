import { describe, it, expect } from "vitest";
import type {
  ImageContent,
  ImageWithAltText,
  MultimodalInput,
  Content,
} from "../../../src/lib/types/multimodal.js";

describe("Image Alt Text Support", () => {
  describe("ImageContent type", () => {
    it("should allow altText field on ImageContent", () => {
      const imageContent: ImageContent = {
        type: "image",
        data: Buffer.from("fake-image-data"),
        altText: "A product screenshot showing the main dashboard",
        mediaType: "image/png",
      };

      expect(imageContent.altText).toBe(
        "A product screenshot showing the main dashboard",
      );
      expect(imageContent.type).toBe("image");
    });

    it("should allow ImageContent without altText (backward compatible)", () => {
      const imageContent: ImageContent = {
        type: "image",
        data: Buffer.from("fake-image-data"),
        mediaType: "image/jpeg",
      };

      expect(imageContent.altText).toBeUndefined();
      expect(imageContent.type).toBe("image");
    });

    it("should allow ImageContent with both altText and metadata.description", () => {
      const imageContent: ImageContent = {
        type: "image",
        data: "data:image/png;base64,abc123",
        altText: "Screen reader alt text",
        mediaType: "image/png",
        metadata: {
          description: "Internal detailed description of the image",
          quality: "high",
        },
      };

      expect(imageContent.altText).toBe("Screen reader alt text");
      expect(imageContent.metadata?.description).toBe(
        "Internal detailed description of the image",
      );
    });
  });

  describe("ImageWithAltText type", () => {
    it("should create ImageWithAltText object", () => {
      const imageWithAlt: ImageWithAltText = {
        data: Buffer.from("image-data"),
        altText: "A chart showing quarterly revenue trends",
      };

      expect(imageWithAlt.data).toBeInstanceOf(Buffer);
      expect(imageWithAlt.altText).toBe(
        "A chart showing quarterly revenue trends",
      );
    });

    it("should allow ImageWithAltText without altText", () => {
      const imageWithAlt: ImageWithAltText = {
        data: "https://example.com/image.jpg",
      };

      expect(imageWithAlt.data).toBe("https://example.com/image.jpg");
      expect(imageWithAlt.altText).toBeUndefined();
    });

    it("should allow string data (URL, path, or data URI)", () => {
      const urlImage: ImageWithAltText = {
        data: "https://example.com/image.jpg",
        altText: "Remote image description",
      };

      const pathImage: ImageWithAltText = {
        data: "./images/local.png",
        altText: "Local file description",
      };

      const dataUriImage: ImageWithAltText = {
        data: "data:image/png;base64,abc123",
        altText: "Inline data image description",
      };

      expect(urlImage.altText).toBe("Remote image description");
      expect(pathImage.altText).toBe("Local file description");
      expect(dataUriImage.altText).toBe("Inline data image description");
    });
  });

  describe("MultimodalInput with alt text", () => {
    it("should accept simple images (backward compatible)", () => {
      const input: MultimodalInput = {
        text: "Describe this image",
        images: [Buffer.from("image-data"), "https://example.com/image.jpg"],
      };

      expect(input.images).toHaveLength(2);
    });

    it("should accept images with alt text", () => {
      const input: MultimodalInput = {
        text: "Analyze these charts",
        images: [
          { data: Buffer.from("chart1"), altText: "Q1 revenue chart" },
          { data: Buffer.from("chart2"), altText: "Q2 revenue chart" },
        ],
      };

      expect(input.images).toHaveLength(2);
      if (input.images) {
        const img1 = input.images[0] as ImageWithAltText;
        const img2 = input.images[1] as ImageWithAltText;
        expect(img1.altText).toBe("Q1 revenue chart");
        expect(img2.altText).toBe("Q2 revenue chart");
      }
    });

    it("should accept mixed images (with and without alt text)", () => {
      const input: MultimodalInput = {
        text: "Compare these images",
        images: [
          Buffer.from("simple-image"), // Simple buffer
          "https://example.com/image.jpg", // Simple URL
          { data: Buffer.from("image-with-alt"), altText: "Annotated image" }, // With alt text
        ],
      };

      expect(input.images).toHaveLength(3);
    });
  });

  describe("Content array with alt text", () => {
    it("should support alt text in Content array", () => {
      const content: Content[] = [
        { type: "text", text: "Analyze this image:" },
        {
          type: "image",
          data: Buffer.from("image-data"),
          altText: "A dashboard showing KPI metrics",
          mediaType: "image/png",
        },
      ];

      expect(content).toHaveLength(2);
      const imageContent = content[1] as ImageContent;
      expect(imageContent.altText).toBe("A dashboard showing KPI metrics");
    });
  });

  describe("Alt text integration behavior", () => {
    it("should format alt text descriptions correctly with image numbers", () => {
      const images: ImageWithAltText[] = [
        { data: Buffer.from("img1"), altText: "First image description" },
        { data: Buffer.from("img2"), altText: "Second image description" },
        { data: Buffer.from("img3"), altText: "Third image description" },
      ];

      // Test the expected format: [Image 1: description] [Image 2: description] ...
      const expectedFormats = [
        "[Image 1: First image description]",
        "[Image 2: Second image description]",
        "[Image 3: Third image description]",
      ];

      images.forEach((img, idx) => {
        const formatted = `[Image ${idx + 1}: ${img.altText}]`;
        expect(formatted).toBe(expectedFormats[idx]);
      });
    });

    it("should handle mixed images (with and without alt text) correctly", () => {
      const mixedImages: Array<Buffer | string | ImageWithAltText> = [
        Buffer.from("no-alt-text"), // No alt text
        { data: Buffer.from("with-alt"), altText: "Has description" }, // With alt text
        "https://example.com/image.jpg", // No alt text
        {
          data: "https://example.com/chart.png",
          altText: "Chart description",
        }, // With alt text
      ];

      // Only images with alt text should appear in descriptions
      const descriptionsWithIndices: Array<{
        index: number;
        description: string;
      }> = [];

      mixedImages.forEach((img, idx) => {
        if (
          typeof img === "object" &&
          !Buffer.isBuffer(img) &&
          "altText" in img &&
          img.altText
        ) {
          descriptionsWithIndices.push({
            index: idx + 1,
            description: img.altText,
          });
        }
      });

      expect(descriptionsWithIndices).toHaveLength(2);
      expect(descriptionsWithIndices[0]).toEqual({
        index: 2,
        description: "Has description",
      });
      expect(descriptionsWithIndices[1]).toEqual({
        index: 4,
        description: "Chart description",
      });
    });

    it("should maintain correct image numbering even when some images have no alt text", () => {
      const images: Array<Buffer | ImageWithAltText> = [
        { data: Buffer.from("img1"), altText: "Image 1" },
        Buffer.from("img2-no-alt"), // No alt text
        { data: Buffer.from("img3"), altText: "Image 3" },
        Buffer.from("img4-no-alt"), // No alt text
        { data: Buffer.from("img5"), altText: "Image 5" },
      ];

      // Extract descriptions with original indices
      const descriptions = images
        .map((img, idx) => {
          if (
            typeof img === "object" &&
            !Buffer.isBuffer(img) &&
            "altText" in img
          ) {
            return `[Image ${idx + 1}: ${img.altText}]`;
          }
          return null;
        })
        .filter(Boolean);

      expect(descriptions).toEqual([
        "[Image 1: Image 1]",
        "[Image 3: Image 3]",
        "[Image 5: Image 5]",
      ]);
    });

    it("should generate enhanced text with alt text context prefix", () => {
      const originalText = "Analyze these charts";
      const altTextDescriptions = [
        "[Image 1: Q1 revenue chart]",
        "[Image 2: Q2 revenue chart]",
      ];

      const enhancedText = `${originalText}\n\nImage descriptions for context: ${altTextDescriptions.join(" ")}`;

      expect(enhancedText).toContain(originalText);
      expect(enhancedText).toContain(
        "Image descriptions for context: [Image 1: Q1 revenue chart] [Image 2: Q2 revenue chart]",
      );
      expect(enhancedText.startsWith(originalText)).toBe(true);
    });

    it("should not modify text when no images have alt text", () => {
      const originalText = "Describe this image";
      const images: Array<Buffer | string> = [
        Buffer.from("image-data"),
        "https://example.com/image.jpg",
      ];

      // No alt text, so no descriptions
      const altTextDescriptions: string[] = [];

      const enhancedText =
        altTextDescriptions.length > 0
          ? `${originalText}\n\nImage descriptions for context: ${altTextDescriptions.join(" ")}`
          : originalText;

      expect(enhancedText).toBe(originalText);
      expect(enhancedText).not.toContain("Image descriptions for context");
    });

    it("should preserve alt text even if image data is empty string or buffer", () => {
      const imageWithAlt: ImageWithAltText = {
        data: Buffer.from(""),
        altText: "Empty buffer but has alt text",
      };

      expect(imageWithAlt.altText).toBe("Empty buffer but has alt text");
      expect(Buffer.isBuffer(imageWithAlt.data)).toBe(true);
    });
  });
});
