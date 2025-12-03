import { describe, it, expect, beforeEach } from "vitest";
import { SentenceBuffer } from "../../../src/lib/utils/sentenceBuffer.js";

describe("SentenceBuffer", () => {
  let buffer: SentenceBuffer;

  beforeEach(() => {
    buffer = new SentenceBuffer();
  });

  describe("add()", () => {
    it("should add text to buffer", () => {
      buffer.add("Hello world");
      expect(buffer.peek()).toBe("Hello world");
    });

    it("should accumulate multiple text chunks", () => {
      buffer.add("Hello ");
      buffer.add("world");
      expect(buffer.peek()).toBe("Hello world");
    });

    it("should handle empty strings", () => {
      buffer.add("");
      expect(buffer.peek()).toBe("");
    });

    it("should convert non-string input to string", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buffer.add(123 as any);
      expect(buffer.peek()).toBe("123");
    });

    it("should handle special characters", () => {
      buffer.add("Hello! @#$%^&*()");
      expect(buffer.peek()).toBe("Hello! @#$%^&*()");
    });
  });

  describe("hasCompleteSentence()", () => {
    it("should return false for empty buffer", () => {
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should return false for incomplete sentence", () => {
      buffer.add("Hello world");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should return true for sentence ending with period", () => {
      buffer.add("Hello world.");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });

    it("should return true for sentence ending with exclamation", () => {
      buffer.add("Hello world!");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });

    it("should return true for sentence ending with question mark", () => {
      buffer.add("Hello world?");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });

    it("should return true for sentence ending with period and space", () => {
      buffer.add("Hello world. ");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });

    it("should return true for sentence followed by another sentence", () => {
      buffer.add("Hello world. This is a test.");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });

    it("should handle multiple exclamation marks", () => {
      buffer.add("Hello world!!");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });

    it("should handle multiple question marks", () => {
      buffer.add("Hello world??");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });

    it("should handle mixed punctuation", () => {
      buffer.add("Hello world!?");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });
  });

  describe("hasCompleteSentence() - abbreviation edge cases", () => {
    it("should not treat Dr. as sentence boundary in middle of sentence", () => {
      buffer.add("I visited Dr. Smith");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should treat Dr. as part of complete sentence when followed by new sentence", () => {
      buffer.add("I visited Dr. Smith. He was helpful.");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });

    it("should handle Mr. abbreviation", () => {
      buffer.add("Hello Mr. Johnson");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle Mrs. abbreviation", () => {
      buffer.add("Hello Mrs. Johnson");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle Ms. abbreviation", () => {
      buffer.add("Hello Ms. Johnson");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle Jr. abbreviation", () => {
      buffer.add("John Smith Jr. is here");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle Sr. abbreviation", () => {
      buffer.add("John Smith Sr. is here");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle etc. abbreviation", () => {
      buffer.add("We have apples, oranges, etc. in stock");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle vs. abbreviation", () => {
      buffer.add("Compare A vs. B");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle e.g. abbreviation", () => {
      buffer.add("Use fruits e.g. apples");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle i.e. abbreviation", () => {
      buffer.add("Use citrus i.e. oranges");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle Ph.D. abbreviation", () => {
      buffer.add("She has a Ph.D. in computer science");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle a.m. abbreviation", () => {
      buffer.add("Meeting at 9 a.m. tomorrow");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle p.m. abbreviation", () => {
      buffer.add("Meeting at 5 p.m. today");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle U.S. abbreviation", () => {
      buffer.add("Located in U.S. territory");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle Inc. abbreviation", () => {
      buffer.add("Apple Inc. makes devices");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle Ltd. abbreviation", () => {
      buffer.add("Acme Ltd. produces goods");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should handle Co. abbreviation", () => {
      buffer.add("Johnson & Co. partners");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should detect sentence after abbreviation with capital letter", () => {
      buffer.add("Visit Dr. Smith. Then go home.");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });
  });

  describe("hasCompleteSentence() - numeric edge cases", () => {
    it("should not treat decimal numbers as sentence boundary", () => {
      buffer.add("The price is $99.99");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should not treat decimal in middle as sentence boundary", () => {
      buffer.add("Pi equals 3.14159");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should detect sentence after decimal number", () => {
      buffer.add("The price is $99.99. That's expensive!");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });
  });

  describe("hasCompleteSentence() - ellipsis edge cases", () => {
    it("should not treat ellipsis as sentence boundary", () => {
      buffer.add("Wait... I'm thinking");
      expect(buffer.hasCompleteSentence()).toBe(false);
    });

    it("should detect sentence ending with ellipsis at end", () => {
      buffer.add("I was thinking...");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });

    it("should detect sentence after ellipsis", () => {
      buffer.add("Wait... Never mind. Let's go.");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });
  });

  describe("extractSentence()", () => {
    it("should return empty string for empty buffer", () => {
      expect(buffer.extractSentence()).toBe("");
    });

    it("should return empty string for incomplete sentence", () => {
      buffer.add("Hello world");
      expect(buffer.extractSentence()).toBe("");
    });

    it("should extract and remove complete sentence", () => {
      buffer.add("Hello world. More text.");
      const sentence = buffer.extractSentence();
      expect(sentence).toBe("Hello world.");
      expect(buffer.peek()).toBe("More text.");
    });

    it("should extract sentence and leave remaining text in buffer", () => {
      buffer.add("First sentence. Second incomplete");
      const sentence = buffer.extractSentence();
      expect(sentence).toBe("First sentence.");
      expect(buffer.peek()).toBe("Second incomplete");
    });

    it("should extract sentence ending with exclamation", () => {
      buffer.add("Hello world! More text");
      const sentence = buffer.extractSentence();
      expect(sentence).toBe("Hello world!");
      expect(buffer.peek()).toBe("More text");
    });

    it("should extract sentence ending with question mark", () => {
      buffer.add("Hello world? More text");
      const sentence = buffer.extractSentence();
      expect(sentence).toBe("Hello world?");
      expect(buffer.peek()).toBe("More text");
    });

    it("should handle multiple consecutive sentences", () => {
      buffer.add("First. Second. Third.");
      expect(buffer.extractSentence()).toBe("First.");
      expect(buffer.extractSentence()).toBe("Second.");
      expect(buffer.extractSentence()).toBe("Third.");
      expect(buffer.peek()).toBe("");
    });

    it("should trim whitespace from extracted sentence", () => {
      buffer.add("  Hello world.  More text");
      const sentence = buffer.extractSentence();
      expect(sentence).toBe("Hello world.");
    });

    it("should handle sentence with no trailing text", () => {
      buffer.add("Hello world.");
      const sentence = buffer.extractSentence();
      expect(sentence).toBe("Hello world.");
      expect(buffer.peek()).toBe("");
    });

    it("should extract only first sentence when multiple exist", () => {
      buffer.add("First. Second. Third.");
      const sentence = buffer.extractSentence();
      expect(sentence).toBe("First.");
      expect(buffer.hasCompleteSentence()).toBe(true);
    });
  });

  describe("hasRemainingText()", () => {
    it("should return false for empty buffer", () => {
      expect(buffer.hasRemainingText()).toBe(false);
    });

    it("should return true for buffer with text", () => {
      buffer.add("Hello world");
      expect(buffer.hasRemainingText()).toBe(true);
    });

    it("should return true for complete sentence", () => {
      buffer.add("Hello world.");
      expect(buffer.hasRemainingText()).toBe(true);
    });

    it("should return false after extracting all sentences", () => {
      buffer.add("Hello world.");
      buffer.extractSentence();
      expect(buffer.hasRemainingText()).toBe(false);
    });

    it("should return true after extracting partial sentences", () => {
      buffer.add("Hello world. More text");
      buffer.extractSentence();
      expect(buffer.hasRemainingText()).toBe(true);
    });

    it("should ignore whitespace-only buffer", () => {
      buffer.add("   ");
      expect(buffer.hasRemainingText()).toBe(false);
    });
  });

  describe("flush()", () => {
    it("should return empty string for empty buffer", () => {
      expect(buffer.flush()).toBe("");
    });

    it("should return all text and clear buffer", () => {
      buffer.add("Hello world incomplete");
      const flushed = buffer.flush();
      expect(flushed).toBe("Hello world incomplete");
      expect(buffer.peek()).toBe("");
    });

    it("should return complete sentence", () => {
      buffer.add("Hello world.");
      const flushed = buffer.flush();
      expect(flushed).toBe("Hello world.");
      expect(buffer.peek()).toBe("");
    });

    it("should return multiple sentences", () => {
      buffer.add("First. Second. Third.");
      const flushed = buffer.flush();
      expect(flushed).toBe("First. Second. Third.");
      expect(buffer.peek()).toBe("");
    });

    it("should trim whitespace", () => {
      buffer.add("  Hello world  ");
      const flushed = buffer.flush();
      expect(flushed).toBe("Hello world");
    });

    it("should clear buffer after flush", () => {
      buffer.add("Hello world");
      buffer.flush();
      expect(buffer.hasRemainingText()).toBe(false);
    });

    it("should return remaining text after extracting sentences", () => {
      buffer.add("First. Incomplete");
      buffer.extractSentence();
      const flushed = buffer.flush();
      expect(flushed).toBe("Incomplete");
    });
  });

  describe("peek()", () => {
    it("should return empty string for empty buffer", () => {
      expect(buffer.peek()).toBe("");
    });

    it("should return current buffer content", () => {
      buffer.add("Hello world");
      expect(buffer.peek()).toBe("Hello world");
    });

    it("should not modify buffer", () => {
      buffer.add("Hello world");
      buffer.peek();
      expect(buffer.peek()).toBe("Hello world");
    });

    it("should show accumulated text", () => {
      buffer.add("Hello ");
      buffer.add("world");
      expect(buffer.peek()).toBe("Hello world");
    });
  });

  describe("clear()", () => {
    it("should clear empty buffer", () => {
      buffer.clear();
      expect(buffer.peek()).toBe("");
    });

    it("should clear buffer with text", () => {
      buffer.add("Hello world");
      buffer.clear();
      expect(buffer.peek()).toBe("");
    });

    it("should allow adding text after clear", () => {
      buffer.add("Hello");
      buffer.clear();
      buffer.add("World");
      expect(buffer.peek()).toBe("World");
    });
  });

  describe("length()", () => {
    it("should return 0 for empty buffer", () => {
      expect(buffer.length()).toBe(0);
    });

    it("should return correct length for text", () => {
      buffer.add("Hello");
      expect(buffer.length()).toBe(5);
    });

    it("should return accumulated length", () => {
      buffer.add("Hello ");
      buffer.add("world");
      expect(buffer.length()).toBe(11);
    });

    it("should update after extraction", () => {
      buffer.add("Hello world. More");
      buffer.extractSentence();
      expect(buffer.length()).toBe(4); // "More"
    });

    it("should return 0 after flush", () => {
      buffer.add("Hello world");
      buffer.flush();
      expect(buffer.length()).toBe(0);
    });
  });

  describe("integration scenarios", () => {
    it("should handle streaming text with sentence boundaries", () => {
      // Simulate streaming text chunks
      buffer.add("Hello ");
      expect(buffer.hasCompleteSentence()).toBe(false);

      buffer.add("world. ");
      expect(buffer.hasCompleteSentence()).toBe(true);

      const sentence1 = buffer.extractSentence();
      expect(sentence1).toBe("Hello world.");

      buffer.add("This is ");
      buffer.add("a test. ");
      expect(buffer.hasCompleteSentence()).toBe(true);

      const sentence2 = buffer.extractSentence();
      expect(sentence2).toBe("This is a test.");

      buffer.add("Incomplete");
      expect(buffer.hasCompleteSentence()).toBe(false);

      const remaining = buffer.flush();
      expect(remaining).toBe("Incomplete");
    });

    it("should handle complex text with abbreviations and punctuation", () => {
      buffer.add("Dr. Smith visited at 9 a.m. today. ");
      expect(buffer.hasCompleteSentence()).toBe(true);

      const sentence1 = buffer.extractSentence();
      expect(sentence1).toBe("Dr. Smith visited at 9 a.m. today.");

      buffer.add("The price was $99.99. That's expensive!");
      expect(buffer.hasCompleteSentence()).toBe(true);

      const sentence2 = buffer.extractSentence();
      expect(sentence2).toBe("The price was $99.99.");

      expect(buffer.hasCompleteSentence()).toBe(true);
      const sentence3 = buffer.extractSentence();
      expect(sentence3).toBe("That's expensive!");
    });

    it("should handle multiple extractions in sequence", () => {
      buffer.add("One. Two. Three. Four.");

      const sentences: string[] = [];
      while (buffer.hasCompleteSentence()) {
        sentences.push(buffer.extractSentence());
      }

      expect(sentences).toEqual(["One.", "Two.", "Three.", "Four."]);
      expect(buffer.peek()).toBe("");
    });

    it("should handle TTS-like streaming scenario", () => {
      // Simulate AI model streaming response
      const chunks = [
        "Welcome to ",
        "our service. ",
        "We're glad ",
        "you're here! ",
        "Let me explain",
        " how this works.",
      ];

      const extractedSentences: string[] = [];

      for (const chunk of chunks) {
        buffer.add(chunk);
        while (buffer.hasCompleteSentence()) {
          extractedSentences.push(buffer.extractSentence());
        }
      }

      // Get remaining incomplete sentence
      const remaining = buffer.flush();
      if (remaining) {
        extractedSentences.push(remaining);
      }

      expect(extractedSentences).toEqual([
        "Welcome to our service.",
        "We're glad you're here!",
        "Let me explain how this works.",
      ]);
    });
  });
});
