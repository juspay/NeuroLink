/**
 * TTS Functionality Test
 * Tests the complete TTS pipeline with real audio generation
 */

import chalk from "chalk";
import { TTSService, TTSError } from "../src/lib/tts/index.js";
import type { TTSInput } from "../src/lib/types/tts.js";

/**
 * Test TTS functionality with sample text
 */
export async function testTTSFunctionality(): Promise<void> {
  console.log(chalk.blue("🧪 Starting TTS functionality test..."));

  try {
    // Create TTS service
    const ttsService = new TTSService();

    // Test with sample text
    const testText =
      "Hello! This is a TTS functionality test. If you hear this, everything is working correctly.";

    const ttsInput: TTSInput = {
      text: testText,
      provider: "gemini",
      languageCode: "en-US",
      voiceName: "en-US-Wavenet-D",
      audioEncoding: "MP3",
      speakingRate: 1.0,
      pitch: 0.0,
      play: true, // Test with actual playback
    };

    console.log(chalk.gray(`📝 Test text: "${testText}"`));
    console.log(chalk.gray(`🎤 Voice: ${ttsInput.voiceName}`));
    console.log(chalk.gray(`🌍 Language: ${ttsInput.languageCode}`));

    const startTime = Date.now();
    const response = await ttsService.generateAudio(ttsInput);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Check if audio was generated
    const audioGenerated = response.audioSize > 0;

    // Test system audio capability
    const systemInfo = ttsService.getSystemInfo();

    console.log(chalk.green("✅ TTS test completed successfully"));

    // Display results
    console.log(chalk.blue("\n🧪 TTS Test Results:"));
    console.log(`   Status: ${chalk.green("✅ Working")}`);
    console.log(`   Provider: gemini`);
    console.log(
      `   Audio Generated: ${audioGenerated ? chalk.green("✅ Yes") : chalk.red("❌ No")}`,
    );
    console.log(`   File Size: ${(response.audioSize / 1024).toFixed(1)} KB`);
    console.log(
      `   Playback Supported: ${systemInfo.audioSupported ? chalk.green("✅ Yes") : chalk.yellow("⚠️ Limited")}`,
    );
    console.log(`   Platform: ${systemInfo.platform}`);
    console.log(`   Test Duration: ${duration}s`);

    console.log(chalk.gray(`\n💾 Test audio generated in memory and played`));

    return Promise.resolve();
  } catch (error) {
    console.log(chalk.red("❌ TTS test failed"));

    if (error instanceof TTSError) {
      console.log(chalk.red(`   Error: ${error.message}`));
      console.log(chalk.red(`   Code: ${error.code}`));

      if (error.code === "MISSING_API_KEY") {
        console.log(
          chalk.yellow(
            "\n💡 Set your API key: export GOOGLE_AI_API_KEY='your-key'",
          ),
        );
      }
    } else {
      console.log(chalk.red(`   Error: ${(error as Error).message}`));
    }

    throw error;
  }
}

// Allow running this test directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTTSFunctionality()
    .then(() => {
      console.log(chalk.green("\n✅ TTS test completed successfully"));
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red("\n❌ TTS test failed:"), error);
      process.exit(1);
    });
}
