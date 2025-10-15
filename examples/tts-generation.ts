/**
 * TTS (Text-to-Speech) Examples
 * Demonstrates various TTS capabilities using Google Cloud Text-to-Speech
 *
 * Requirements:
 * - GOOGLE_TTS_API_KEY environment variable set
 * - Audio playback capability (macOS: afplay, Linux: ffplay/aplay, Windows: PowerShell)
 *
 * Run with: npx tsx examples/tts-generation.ts
 */

import { TTSService } from "../src/lib/tts/index.js";
import type { TTSInput } from "../src/lib/types/tts.js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

// Ensure output directory exists
const OUTPUT_DIR = join(process.cwd(), "examples", "output");
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Example 1: Basic Text-to-Speech
 * Convert simple text to speech and play it
 */
async function example1BasicTTS() {
  console.log("\n=== Example 1: Basic Text-to-Speech ===\n");

  const tts = new TTSService();

  const result = await tts.generateAudio({
    text: "Hello! Welcome to NeuroLink's Text-to-Speech feature.",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-C", // Female voice
    play: true, // Auto-play the audio
  });

  console.log(
    `✓ Generated ${result.audioSize} bytes in ${result.generationTime}ms`,
  );
  console.log(`✓ Audio played: ${result.wasPlayed}`);
  console.log(`✓ Encoding: ${result.encoding}`);
}

/**
 * Example 2: Save Audio to File
 * Generate speech and save to different formats
 */
async function example2SaveToFile() {
  console.log("\n=== Example 2: Save Audio to File ===\n");

  const tts = new TTSService();

  // Generate MP3
  const mp3Result = await tts.generateAudio({
    text: "This is an MP3 audio file with high-quality speech synthesis.",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-A",
    audioEncoding: "MP3",
  });

  const mp3Path = join(OUTPUT_DIR, "example-mp3.mp3");
  writeFileSync(mp3Path, mp3Result.audioBuffer);
  console.log(`✓ Saved MP3: ${mp3Path}`);

  // Generate WAV (highest quality)
  const wavResult = await tts.generateAudio({
    text: "This is a WAV audio file with lossless quality.",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-C",
    audioEncoding: "WAV",
  });

  const wavPath = join(OUTPUT_DIR, "example-wav.wav");
  writeFileSync(wavPath, wavResult.audioBuffer);
  console.log(`✓ Saved WAV: ${wavPath}`);

  // Generate OGG
  const oggResult = await tts.generateAudio({
    text: "This is an OGG audio file with efficient compression.",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Wavenet-D",
    audioEncoding: "OGG",
  });

  const oggPath = join(OUTPUT_DIR, "example-ogg.ogg");
  writeFileSync(oggPath, oggResult.audioBuffer);
  console.log(`✓ Saved OGG: ${oggPath}`);
}

/**
 * Example 3: Voice Customization
 * Adjust speaking rate and pitch for different effects
 */
async function example3VoiceCustomization() {
  console.log("\n=== Example 3: Voice Customization ===\n");

  const tts = new TTSService();

  // Slow and deep voice (announcement style)
  console.log("Speaking slow and deep...");
  await tts.generateAudio({
    text: "This is a slow announcement with a deeper voice.",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-D",
    speakingRate: 0.75, // 75% speed
    pitch: -3.0, // Lower pitch
    play: true,
  });

  // Fast and cheerful voice
  console.log("\nSpeaking fast and cheerful...");
  await tts.generateAudio({
    text: "This is a quick and cheerful message!",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-C",
    speakingRate: 1.25, // 125% speed
    pitch: 4.0, // Higher pitch
    play: true,
  });

  console.log("\n✓ Voice customization complete");
}

/**
 * Example 4: Multi-Language Support
 * Generate speech in different languages
 */
async function example4MultiLanguage() {
  console.log("\n=== Example 4: Multi-Language Support ===\n");

  const tts = new TTSService();

  const languages = [
    {
      text: "Hello, this is English.",
      lang: "en-US",
      voice: "en-US-Neural2-C",
      name: "English (US)",
    },
    {
      text: "Bonjour, c'est le français.",
      lang: "fr-FR",
      voice: "fr-FR-Neural2-A",
      name: "French",
    },
    {
      text: "Hola, esto es español.",
      lang: "es-ES",
      voice: "es-ES-Neural2-A",
      name: "Spanish",
    },
    {
      text: "नमस्ते, यह हिंदी है।",
      lang: "hi-IN",
      voice: "hi-IN-Neural2-A",
      name: "Hindi",
    },
    {
      text: "こんにちは、これは日本語です。",
      lang: "ja-JP",
      voice: "ja-JP-Neural2-B",
      name: "Japanese",
    },
  ];

  for (const lang of languages) {
    console.log(`\nGenerating ${lang.name}...`);
    await tts.generateAudio({
      text: lang.text,
      provider: "gemini",
      languageCode: lang.lang,
      voiceName: lang.voice,
      play: true,
    });
    console.log(`✓ Played ${lang.name}`);
  }
}

/**
 * Example 5: List Available Voices
 * Discover available voices for a language
 */
async function example5ListVoices() {
  console.log("\n=== Example 5: List Available Voices ===\n");

  const tts = new TTSService();

  // List all English (US) voices
  console.log("Fetching English (US) voices...");
  const voices = await tts.getAvailableVoices("en-US");

  console.log(`\nFound ${voices.length} English (US) voices:\n`);

  // Group by type and gender
  const byType: Record<string, typeof voices> = {};
  voices.forEach((voice) => {
    if (!byType[voice.type]) {
      byType[voice.type] = [];
    }
    byType[voice.type].push(voice);
  });

  // Display grouped
  Object.entries(byType).forEach(([type, typeVoices]) => {
    console.log(`\n${type} Voices (${typeVoices.length}):`);
    typeVoices.slice(0, 5).forEach((voice) => {
      console.log(`  - ${voice.name} (${voice.gender})`);
    });
    if (typeVoices.length > 5) {
      console.log(`  ... and ${typeVoices.length - 5} more`);
    }
  });

  // List Hindi voices
  console.log("\n\nFetching Hindi voices...");
  const hindiVoices = await tts.getAvailableVoices("hi-IN");
  console.log(`Found ${hindiVoices.length} Hindi voices:`);
  hindiVoices.slice(0, 5).forEach((voice) => {
    console.log(`  - ${voice.name} (${voice.type}, ${voice.gender})`);
  });
}

/**
 * Example 6: E-Learning Content
 * Generate educational audio with optimal settings
 */
async function example6ELearning() {
  console.log("\n=== Example 6: E-Learning Content ===\n");

  const tts = new TTSService();

  const lessons = [
    {
      title: "Lesson 1: Introduction to AI",
      content:
        "Welcome to Lesson 1. In this lesson, we will explore the fundamentals of Artificial Intelligence and its applications in modern technology.",
    },
    {
      title: "Lesson 2: Machine Learning Basics",
      content:
        "In Lesson 2, we dive into Machine Learning. We'll learn how computers can learn from data without being explicitly programmed.",
    },
    {
      title: "Lesson 3: Neural Networks",
      content:
        "Lesson 3 introduces Neural Networks. These are computing systems inspired by the biological neural networks in animal brains.",
    },
  ];

  for (const [index, lesson] of lessons.entries()) {
    console.log(`\nGenerating ${lesson.title}...`);

    const result = await tts.generateAudio({
      text: lesson.content,
      provider: "gemini",
      languageCode: "en-US",
      voiceName: "en-US-Neural2-A", // Professional male voice
      speakingRate: 0.9, // Slightly slower for learning
      audioEncoding: "WAV", // High quality for archival
    });

    const filePath = join(OUTPUT_DIR, `lesson-${index + 1}.wav`);
    writeFileSync(filePath, result.audioBuffer);
    console.log(`✓ Saved: ${filePath} (${result.audioSize} bytes)`);
  }

  console.log("\n✓ E-learning content generation complete");
}

/**
 * Example 7: Accessibility - Convert Article to Audio
 * Generate audio version of written content
 */
async function example7Accessibility() {
  console.log("\n=== Example 7: Accessibility - Article to Audio ===\n");

  const tts = new TTSService();

  const article = `
    NeuroLink is a universal AI development platform that enables developers to build
    applications with multiple AI providers. It supports 12 major providers including
    OpenAI, Anthropic, Google, and AWS Bedrock. The platform features automatic provider
    fallback, cost optimization, and comprehensive multimodal support including images,
    PDFs, and CSV files. With built-in tools, MCP integration, and enterprise-grade
    security features, NeuroLink makes it easy to build production-ready AI applications.
  `;

  console.log("Converting article to audio...");

  const result = await tts.generateAudio({
    text: article.trim(),
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-C", // Clear female voice
    speakingRate: 0.95, // Slightly slower for comprehension
    audioEncoding: "MP3",
  });

  const filePath = join(OUTPUT_DIR, "article-audio.mp3");
  writeFileSync(filePath, result.audioBuffer);

  console.log(`✓ Article converted to audio`);
  console.log(`✓ Saved: ${filePath}`);
  console.log(`✓ Duration: ${result.generationTime}ms`);
  console.log(`✓ Size: ${(result.audioSize / 1024).toFixed(2)} KB`);
}

/**
 * Example 8: Voice Notifications
 * Generate alerts with different urgency levels
 */
async function example8VoiceNotifications() {
  console.log("\n=== Example 8: Voice Notifications ===\n");

  const tts = new TTSService();

  // Low urgency notification
  console.log("Playing low urgency notification...");
  await tts.generateAudio({
    text: "Your order has been shipped and will arrive in 3 to 5 business days.",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-C",
    speakingRate: 1.0,
    pitch: 0.0,
    play: true,
  });

  // Medium urgency notification
  console.log("\nPlaying medium urgency notification...");
  await tts.generateAudio({
    text: "You have a new message in your inbox. Please check at your earliest convenience.",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-D",
    speakingRate: 1.1,
    pitch: 1.0,
    play: true,
  });

  // High urgency notification
  console.log("\nPlaying high urgency notification...");
  await tts.generateAudio({
    text: "Security alert! Unusual activity detected on your account. Please verify immediately.",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-D",
    speakingRate: 1.2,
    pitch: 3.0,
    play: true,
  });

  console.log("\n✓ Voice notifications complete");
}

/**
 * Example 9: System Information and Testing
 * Check TTS capabilities and system info
 */
async function example9SystemInfo() {
  console.log("\n=== Example 9: System Information ===\n");

  const tts = new TTSService();

  // Get system information
  const info = tts.getSystemInfo();
  console.log("System Information:");
  console.log(`  Platform: ${info.platform}`);
  console.log(`  Audio Supported: ${info.audioSupported}`);
  console.log(`  Player Command: ${info.playerCommand}`);
  console.log(`  Supported Encodings: ${info.supportedEncodings.join(", ")}`);
  console.log(`  Node Version: ${info.nodeVersion}`);

  // Test audio playback
  console.log("\nTesting audio playback capability...");
  const canPlay = await tts.testAudioPlayback();
  console.log(`  Playback Test: ${canPlay ? "✓ Passed" : "✗ Failed"}`);

  // Get supported encodings
  const encodings = tts.getSupportedEncodings();
  console.log(`\nSupported Audio Encodings: ${encodings.join(", ")}`);

  // Get supported platforms
  const platforms = tts.getSupportedPlatforms();
  console.log(`Supported Platforms: ${platforms.join(", ")}`);
}

/**
 * Example 10: Batch Audio Generation
 * Generate multiple audio files efficiently
 */
async function example10BatchGeneration() {
  console.log("\n=== Example 10: Batch Audio Generation ===\n");

  const tts = new TTSService();

  const announcements = [
    "Welcome to Terminal 1.",
    "Flight BA 123 is now boarding at Gate 5.",
    "Please proceed to the boarding area.",
    "Final call for passengers on Flight BA 123.",
    "This is a security announcement.",
  ];

  console.log(`Generating ${announcements.length} audio files...\n`);

  const startTime = Date.now();

  for (const [index, text] of announcements.entries()) {
    const result = await tts.generateAudio({
      text,
      provider: "gemini",
      languageCode: "en-US",
      voiceName: "en-US-Neural2-C",
      audioEncoding: "MP3",
    });

    const filePath = join(OUTPUT_DIR, `announcement-${index + 1}.mp3`);
    writeFileSync(filePath, result.audioBuffer);
    console.log(
      `✓ Generated announcement-${index + 1}.mp3 (${result.generationTime}ms)`,
    );
  }

  const totalTime = Date.now() - startTime;
  console.log(`\n✓ Batch generation complete in ${totalTime}ms`);
  console.log(
    `  Average per file: ${(totalTime / announcements.length).toFixed(0)}ms`,
  );
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log("===============================================");
  console.log("  NeuroLink TTS Examples");
  console.log("===============================================");

  try {
    // Check API key
    if (!process.env.GOOGLE_TTS_API_KEY) {
      console.error(
        "\n❌ Error: GOOGLE_TTS_API_KEY environment variable is required",
      );
      console.log("\nPlease set your Google TTS API key:");
      console.log("  export GOOGLE_TTS_API_KEY=your_api_key_here\n");
      process.exit(1);
    }

    // Run examples
    await example1BasicTTS();
    await example2SaveToFile();
    await example3VoiceCustomization();
    await example4MultiLanguage();
    await example5ListVoices();
    await example6ELearning();
    await example7Accessibility();
    await example8VoiceNotifications();
    await example9SystemInfo();
    await example10BatchGeneration();

    console.log("\n===============================================");
    console.log("  ✓ All examples completed successfully!");
    console.log("  Audio files saved to:", OUTPUT_DIR);
    console.log("===============================================\n");
  } catch (error) {
    console.error("\n❌ Error running examples:");
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

// Export for use in other files
export {
  example1BasicTTS,
  example2SaveToFile,
  example3VoiceCustomization,
  example4MultiLanguage,
  example5ListVoices,
  example6ELearning,
  example7Accessibility,
  example8VoiceNotifications,
  example9SystemInfo,
  example10BatchGeneration,
};
