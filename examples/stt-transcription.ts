/**
 * Speech-to-Text (STT) Transcription Examples for NeuroLink
 * Demonstrates various audio transcription capabilities using Google Cloud STT v1
 *
 * Prerequisites:
 * - Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file path
 * - Service account must have roles/speech.client permission
 * - Audio files in examples/audio/ directory (create test files with any audio content)
 *
 * Run with: npx tsx examples/stt-transcription.ts
 *
 * Note: If you don't have Google Cloud credentials, the system will automatically
 * fall back to OpenAI Whisper if OPENAI_API_KEY is set.
 */

import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

/**
 * Example 1: Basic Audio Transcription with AI Summary
 * Transcribes audio and lets AI summarize the content
 */
async function basicTranscriptionWithAI() {
  console.log("=== Example 1: Basic Transcription with AI Summary ===\n");

  try {
    const result = await neurolink.generate({
      input: {
        text: "Summarize the key points from this audio recording",
        files: ["./examples/audio/meeting.wav"], // Replace with your audio file
      },
      provider: "google-ai",
      sttOptions: {
        language: "en-IN",
        model: "default",
      },
      maxTokens: 500,
    });

    console.log("AI Summary:");
    console.log(result.content);
    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "Make sure GOOGLE_APPLICATION_CREDENTIALS is set or OPENAI_API_KEY for fallback\n",
    );
  }
}

/**
 * Example 2: Direct Transcription (No AI Processing)
 * Returns raw transcript without AI analysis
 */
async function directTranscription() {
  console.log("=== Example 2: Direct Transcription (Raw Text) ===\n");

  try {
    const result = await neurolink.generate({
      input: {
        text: "", // Can be empty in direct mode
        files: ["./examples/audio/sample.wav"], // Replace with your audio file
      },
      provider: "google-ai",
      sttOptions: {
        language: "en-US",
        model: "default",
        useAIResponse: false, // Direct mode - return raw transcript
      },
    });

    console.log("Raw Transcript:");
    console.log(result.content);
    console.log("\nProvider:", result.provider);
    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Example 3: Long-Form Audio (Meetings, Interviews)
 * Uses latest_long model optimized for extended recordings
 */
async function longFormTranscription() {
  console.log("=== Example 3: Long-Form Audio Transcription ===\n");

  try {
    const result = await neurolink.generate({
      input: {
        text: "Extract action items and key decisions from this meeting",
        files: ["./examples/audio/meeting.wav"], // Replace with your audio file
      },
      provider: "google-ai",
      sttOptions: {
        language: "en-IN",
        model: "latest_long", // Optimized for long recordings
        enableAutomaticPunctuation: true,
      },
      maxTokens: 800,
    });

    console.log("Meeting Analysis:");
    console.log(result.content);
    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Example 4: Voice Command Processing
 * Uses command_and_search model for short voice commands
 */
async function voiceCommandProcessing() {
  console.log("=== Example 4: Voice Command Processing ===\n");

  try {
    const result = await neurolink.generate({
      input: {
        text: "Parse the voice command and extract the intent and parameters",
        files: ["./examples/audio/sample.wav"], // Replace with your audio file
      },
      provider: "google-ai",
      sttOptions: {
        language: "en-US",
        model: "command_and_search", // Optimized for commands
      },
      maxTokens: 200,
    });

    console.log("Command Analysis:");
    console.log(result.content);
    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Example 5: Multi-Language Transcription
 * Demonstrates transcribing audio in different languages
 */
async function multiLanguageTranscription() {
  console.log("=== Example 5: Multi-Language Transcription ===\n");

  const languages = [
    { code: "hi-IN", file: "./examples/audio/sample.wav", name: "Hindi" },
    { code: "es-ES", file: "./examples/audio/sample.wav", name: "Spanish" },
    { code: "en-IN", file: "./examples/audio/sample.wav", name: "English" },
  ];

  for (const lang of languages) {
    try {
      console.log(`\nTranscribing ${lang.name} audio...`);

      const result = await neurolink.generate({
        input: {
          text: "Translate and summarize in English",
          files: [lang.file], // Replace with your audio files
        },
        provider: "google-ai",
        sttOptions: {
          language: lang.code,
          model: "default",
        },
        maxTokens: 300,
      });

      console.log(`${lang.name} Summary:`);
      console.log(result.content);
      console.log("-".repeat(60));
    } catch (error) {
      console.error(
        `Error processing ${lang.name}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

// /**
//  * Example 6: Batch Audio Processing
//  * Process multiple audio files sequentially
//  */
// async function batchTranscription() {
//   console.log("=== Example 6: Batch Audio Processing ===\n");

//   const audioFiles = [
//     "./examples/audio/sample.wav",
//     "./examples/audio/meeting.wav",
//   ]; // Replace with your audio files

//   const results = [];

//   for (const [index, file] of audioFiles.entries()) {
//     try {
//       console.log(`Processing ${index + 1}/${audioFiles.length}: ${file}`);

//       const result = await neurolink.generate({
//         input: {
//           text: "Provide a brief summary",
//           files: [file],
//         },
//         provider: "google-ai",
//         sttOptions: {
//           language: "en-IN",
//           model: "default",
//         },
//         maxTokens: 200,
//       });

//       results.push({
//         file,
//         summary: result.content,
//       });

//       console.log("✓ Processed successfully\n");
//     } catch (error) {
//       console.error(`✗ Error processing ${file}:`, error instanceof Error ? error.message : String(error));
//     }
//   }

//   console.log("\n📊 Batch Processing Complete:");
//   console.log(`✓ Successfully processed: ${results.length}/${audioFiles.length} files\n`);

//   results.forEach((r, i) => {
//     console.log(`${i + 1}. ${r.file}`);
//     console.log(`   ${r.summary.slice(0, 100)}...`);
//     console.log();
//   });

//   console.log("=".repeat(60) + "\n");
// }

// /**
//  * Example 7: Audio with Other File Types
//  * Process audio alongside PDFs and images
//  */
// async function mixedMediaProcessing() {
//   console.log("=== Example 7: Mixed Media Processing ===\n");

//   try {
//     const result = await neurolink.generate({
//       input: {
//         text: "Compare the audio discussion with the written proposal in the PDF. What are the main differences?",
//         files: [
//           "./examples/audio/discussion.mp3", // Audio discussion
//           "./examples/data/proposal.pdf",     // Written proposal
//         ],
//       },
//       provider: "google-ai",
//       sttOptions: {
//         language: "en-IN",
//         model: "latest_long",
//       },
//       maxTokens: 600,
//     });

//     console.log("Comparison Analysis:");
//     console.log(result.content);
//     console.log("\n" + "=".repeat(60) + "\n");
//   } catch (error) {
//     console.error("Error:", error instanceof Error ? error.message : String(error));
//   }
// }

// /**
//  * Example 8: Custom STT Configuration
//  * Demonstrates advanced STT options
//  */
// async function advancedSTTConfiguration() {
//   console.log("=== Example 8: Advanced STT Configuration ===\n");

//   try {
//     const result = await neurolink.generate({
//       input: {
//         text: "Analyze the sentiment and key topics discussed",
//         files: ["./examples/audio/interview.wav"], // Replace with your audio file
//       },
//       provider: "google-ai",
//       sttOptions: {
//         language: "en-US",
//         model: "latest_long",
//         enableAutomaticPunctuation: true,  // Add punctuation
//         profanityFilter: true,              // Filter profanity
//         sampleRateHertz: 16000,             // Specify sample rate
//       },
//       maxTokens: 500,
//     });

//     console.log("Advanced Analysis:");
//     console.log(result.content);
//     console.log("\n" + "=".repeat(60) + "\n");
//   } catch (error) {
//     console.error("Error:", error instanceof Error ? error.message : String(error));
//   }
// }

// /**
//  * Example 9: Error Handling Pattern
//  * Demonstrates robust error handling for STT
//  */
// async function errorHandlingExample() {
//   console.log("=== Example 9: Error Handling Pattern ===\n");

//   async function transcribeWithRetry(
//     audioFile: string,
//     maxRetries: number = 3
//   ): Promise<{ success: boolean; content?: string; error?: string }> {
//     for (let attempt = 1; attempt <= maxRetries; attempt++) {
//       try {
//         console.log(`Attempt ${attempt}/${maxRetries}: ${audioFile}`);

//         const result = await neurolink.generate({
//           input: {
//             text: "Transcribe this audio",
//             files: [audioFile],
//           },
//           provider: "google-ai",
//           sttOptions: {
//             language: "en-IN",
//           },
//         });

//         console.log("✓ Transcription successful\n");
//         return { success: true, content: result.content };
//       } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : String(error);
//         console.error(`✗ Attempt ${attempt} failed: ${errorMessage}`);

//         // Check if it's a fatal error (no retry needed)
//         if (
//           errorMessage.includes("GOOGLE_APPLICATION_CREDENTIALS") ||
//           errorMessage.includes("Invalid language code") ||
//           errorMessage.includes("Invalid STT model")
//         ) {
//           console.error("Fatal error - not retrying\n");
//           return { success: false, error: errorMessage };
//         }

//         // Wait before retry (exponential backoff)
//         if (attempt < maxRetries) {
//           const waitTime = Math.pow(2, attempt) * 1000;
//           console.log(`Waiting ${waitTime}ms before retry...\n`);
//           await new Promise(resolve => setTimeout(resolve, waitTime));
//         }
//       }
//     }

//     return { success: false, error: `Failed after ${maxRetries} attempts` };
//   }

//   // Test error handling
//   const result = await transcribeWithRetry("./examples/audio/test.mp3");

//   if (result.success) {
//     console.log("Final Result:");
//     console.log(result.content);
//   } else {
//     console.log("Failed to transcribe:");
//     console.log(result.error);
//   }

//   console.log("\n" + "=".repeat(60) + "\n");
// }

/**
 * Main function - runs all examples sequentially
 */
async function main() {
  console.log("\n🎤 NeuroLink Speech-to-Text (STT) Examples\n");
  console.log(
    "This demonstrates audio transcription with Google Cloud STT v1\n",
  );
  console.log("=".repeat(60) + "\n");

  // Check credentials
  if (
    !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    !process.env.OPENAI_API_KEY
  ) {
    console.warn(
      "⚠️  WARNING: Neither GOOGLE_APPLICATION_CREDENTIALS nor OPENAI_API_KEY is set.",
    );
    console.warn(
      "Set one of these environment variables to enable audio transcription.\n",
    );
    console.warn("Examples will fail without credentials.\n");
  }

  try {
    // Run Example 1
    await basicTranscriptionWithAI();

    // Run Example 2
    await directTranscription();

    // Run Example 3
    await longFormTranscription();

    // Run Example 4
    await voiceCommandProcessing();

    // Run Example 5
    await multiLanguageTranscription();

    // // Run Example 6
    // await batchTranscription();

    // // Run Example 7
    // await mixedMediaProcessing();

    // // Run Example 8
    // await advancedSTTConfiguration();

    // // Run Example 9
    // await errorHandlingExample();

    console.log("✅ All STT examples completed!\n");
    console.log("💡 Tips:");
    console.log("   - Use 'latest_long' for meetings/interviews");
    console.log("   - Use 'latest_short' for commands/queries");
    console.log("   - Use 'command_and_search' for voice assistants");
    console.log("   - Set useAIResponse: false for raw transcripts");
    console.log("   - Always specify the correct language code\n");
  } catch (error) {
    console.error("❌ Error running examples:");
    console.error(error);
    process.exit(1);
  }
}

// Run all examples
main().catch(console.error);
