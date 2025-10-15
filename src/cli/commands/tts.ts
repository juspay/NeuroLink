import type { CommandModule, Argv } from "yargs";
import chalk from "chalk";
import ora from "ora";
import { TTSService, TTSError } from "../../lib/tts/index.js";
import type {
  TTSInput,
  TTSGenerateArgs,
  TTSVoicesArgs,
} from "../../lib/types/tts.js";
import { handleError } from "../errorHandler.js";
import { logger } from "../../lib/utils/logger.js";

/**
 * TTS Command Factory for text-to-speech functionality
 */
export class TTSCommandFactory {
  // TTS-specific options
  private static readonly ttsCommonOptions = {
    voiceName: {
      type: "string" as const,
      description: "Voice to use (e.g. en-US-Wavenet-D, en-US-Neural2-A)",
      alias: "voice",
    },
    languageCode: {
      type: "string" as const,
      description: "Language code (e.g. en-US, es-ES, fr-FR)",
      alias: "lang",
      default: "en-US",
    },
    audioEncoding: {
      choices: ["MP3", "WAV", "OGG"] as const,
      description: "Audio output format",
      alias: "encoding",
      default: "WAV" as const,
    },
    speakingRate: {
      type: "number" as const,
      description: "Speech speed (0.25 to 4.0)",
      alias: "rate",
      default: 1.0,
    },
    pitch: {
      type: "number" as const,
      description: "Voice pitch (-20.0 to 20.0)",
      default: 0.0,
    },
    format: {
      choices: ["text", "json", "table"] as const,
      default: "text" as const,
      alias: "f",
      description: "Output format",
    },
    quiet: {
      type: "boolean" as const,
      alias: "q",
      default: false,
      description: "Suppress non-essential output",
    },
    debug: {
      type: "boolean" as const,
      alias: "v",
      default: false,
      description: "Enable debug mode with verbose output",
    },
  };

  /**
   * Create TTS commands
   */
  static createTTSCommands(): CommandModule {
    return {
      command: "tts <subcommand>",
      describe: "Text-to-Speech generation and management",
      builder: (yargs) => {
        return yargs
          .command(
            "generate <text>",
            "Generate speech audio from text",
            (y) => this.buildTTSGenerateOptions(y),
            (argv) => this.executeTTSGenerate(argv as TTSGenerateArgs),
          )
          .command(
            "voices [language]",
            "List available TTS voices",
            (y) => this.buildTTSVoicesOptions(y),
            (argv) => this.executeTTSVoices(argv as TTSVoicesArgs),
          )
          .demandCommand(1, "Please specify a TTS subcommand")
          .example(
            '$0 tts generate "Hello, world!"',
            "Generate basic TTS audio",
          )
          .example(
            '$0 tts generate "Bonjour!" --lang fr-FR --voice fr-FR-Wavenet-A',
            "Generate French TTS",
          )
          .example(
            '$0 tts generate "Test audio"',
            "Generate and play TTS audio",
          )
          .example("$0 tts voices", "List all available voices")
          .example("$0 tts voices en-US", "List English voices");
      },
      handler: () => {}, // No-op handler as subcommands handle everything
    };
  }

  /**
   * Build options for TTS generate command
   */
  private static buildTTSGenerateOptions(yargs: Argv) {
    return yargs
      .positional("text", {
        type: "string" as const,
        description: "Text to convert to speech",
        demandOption: true,
      })
      .options(this.ttsCommonOptions);
  }

  /**
   * Build options for TTS voices command
   */
  private static buildTTSVoicesOptions(yargs: Argv) {
    return yargs
      .positional("language", {
        type: "string" as const,
        description: "Language code to filter voices (optional)",
        demandOption: false,
      })
      .options({
        format: this.ttsCommonOptions.format,
        quiet: this.ttsCommonOptions.quiet,
        debug: this.ttsCommonOptions.debug,
      });
  }

  /**
   * Execute TTS generate command
   */
  private static async executeTTSGenerate(argv: TTSGenerateArgs) {
    const spinner = argv.quiet
      ? null
      : ora("🎤 Generating TTS audio...").start();

    try {
      // Create TTS service
      const ttsService = new TTSService();

      // Default to WAV for best quality
      const encoding = argv.audioEncoding || "WAV";

      // Build TTS input
      const ttsInput: TTSInput = {
        text: argv.text,
        provider: "gemini",
        languageCode: argv.languageCode || "en-US",
        voiceName: argv.voiceName || "en-US-Wavenet-D",
        audioEncoding: encoding as "MP3" | "WAV" | "OGG",
        speakingRate: argv.speakingRate || 1.0,
        pitch: argv.pitch || 0.0,
        play: true, // CLI always plays audio
      };

      if (argv.debug) {
        logger.info(chalk.yellow("\n🔍 Debug - TTS Input:"));
        logger.info(JSON.stringify(ttsInput, null, 2));
      }

      // Generate audio
      const response = await ttsService.generateAudio(ttsInput);

      if (spinner) {
        spinner.succeed(chalk.green("✅ TTS audio generated successfully"));
      }

      if (argv.debug) {
        const fileSizeKB = (response.audioSize / 1024).toFixed(1);
        logger.info(chalk.yellow("\n🔍 Debug - Generation Results:"));
        logger.info(`   Audio buffer generated in memory`);
        logger.info(`   Audio size: ${fileSizeKB} KB`);
        logger.info(`   Voice used: ${ttsInput.voiceName}`);
        logger.info(`   Language: ${ttsInput.languageCode}`);
        logger.info(`   Encoding: ${ttsInput.audioEncoding}`);
        logger.info(`   Generation time: ${response.generationTime}ms`);
        logger.info(`   Was played: ${response.wasPlayed}`);
      }
    } catch (error) {
      if (spinner) {
        spinner.fail("TTS generation failed");
      }

      if (error instanceof TTSError) {
        handleError(error, "TTS Generation");
      } else {
        handleError(error as Error, "TTS Generation");
      }
    }
  }

  /**
   * Execute TTS voices command
   */
  // eslint-disable-next-line max-lines-per-function
  private static async executeTTSVoices(argv: TTSVoicesArgs) {
    const spinner = argv.quiet
      ? null
      : ora("🔍 Fetching available TTS voices...").start();

    try {
      // Voice data including Indian English accents
      const allVoices = [
        // US English Voices
        {
          name: "en-US-Wavenet-A",
          language: "en-US",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "en-US-Wavenet-B",
          language: "en-US",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "en-US-Wavenet-C",
          language: "en-US",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "en-US-Wavenet-D",
          language: "en-US",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "en-US-Neural2-A",
          language: "en-US",
          gender: "MALE",
          type: "Neural2",
        },
        {
          name: "en-US-Neural2-C",
          language: "en-US",
          gender: "FEMALE",
          type: "Neural2",
        },

        // Indian English Voices
        {
          name: "en-IN-Wavenet-A",
          language: "en-IN",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "en-IN-Wavenet-B",
          language: "en-IN",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "en-IN-Wavenet-C",
          language: "en-IN",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "en-IN-Wavenet-D",
          language: "en-IN",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "en-IN-Neural2-A",
          language: "en-IN",
          gender: "FEMALE",
          type: "Neural2",
        },
        {
          name: "en-IN-Neural2-B",
          language: "en-IN",
          gender: "MALE",
          type: "Neural2",
        },
        {
          name: "en-IN-Neural2-C",
          language: "en-IN",
          gender: "MALE",
          type: "Neural2",
        },
        {
          name: "en-IN-Neural2-D",
          language: "en-IN",
          gender: "FEMALE",
          type: "Neural2",
        },

        // British English Voices
        {
          name: "en-GB-Wavenet-A",
          language: "en-GB",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "en-GB-Wavenet-B",
          language: "en-GB",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "en-GB-Wavenet-C",
          language: "en-GB",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "en-GB-Wavenet-D",
          language: "en-GB",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "en-GB-Neural2-A",
          language: "en-GB",
          gender: "FEMALE",
          type: "Neural2",
        },
        {
          name: "en-GB-Neural2-B",
          language: "en-GB",
          gender: "MALE",
          type: "Neural2",
        },

        // Australian English Voices
        {
          name: "en-AU-Wavenet-A",
          language: "en-AU",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "en-AU-Wavenet-B",
          language: "en-AU",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "en-AU-Wavenet-C",
          language: "en-AU",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "en-AU-Wavenet-D",
          language: "en-AU",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "en-AU-Neural2-A",
          language: "en-AU",
          gender: "FEMALE",
          type: "Neural2",
        },
        {
          name: "en-AU-Neural2-B",
          language: "en-AU",
          gender: "MALE",
          type: "Neural2",
        },

        // Indian Regional Languages (Verified Google Cloud TTS voices)

        // Hindi Voices (Most widely spoken Indian language)
        {
          name: "hi-IN-Wavenet-A",
          language: "hi-IN",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "hi-IN-Wavenet-B",
          language: "hi-IN",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "hi-IN-Wavenet-C",
          language: "hi-IN",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "hi-IN-Wavenet-D",
          language: "hi-IN",
          gender: "FEMALE",
          type: "WaveNet",
        },

        // Bengali Voices (Second most spoken Indian language)
        {
          name: "bn-IN-Wavenet-A",
          language: "bn-IN",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "bn-IN-Wavenet-B",
          language: "bn-IN",
          gender: "MALE",
          type: "WaveNet",
        },

        // Tamil Voices (Major South Indian language)
        {
          name: "ta-IN-Wavenet-A",
          language: "ta-IN",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "ta-IN-Wavenet-B",
          language: "ta-IN",
          gender: "MALE",
          type: "WaveNet",
        },

        // Gujarati Voices (Major Western Indian language)
        {
          name: "gu-IN-Wavenet-A",
          language: "gu-IN",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "gu-IN-Wavenet-B",
          language: "gu-IN",
          gender: "MALE",
          type: "WaveNet",
        },

        // Other Languages (Spanish, French, etc.)
        {
          name: "es-ES-Wavenet-B",
          language: "es-ES",
          gender: "MALE",
          type: "WaveNet",
        },
        {
          name: "es-ES-Wavenet-C",
          language: "es-ES",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "fr-FR-Wavenet-A",
          language: "fr-FR",
          gender: "FEMALE",
          type: "WaveNet",
        },
        {
          name: "fr-FR-Wavenet-B",
          language: "fr-FR",
          gender: "MALE",
          type: "WaveNet",
        },
      ];

      // Filter by language if specified
      const voices = argv.language
        ? allVoices.filter((voice) =>
            voice.language
              .toLowerCase()
              .includes(argv.language?.toLowerCase() || ""),
          )
        : allVoices;

      if (spinner) {
        spinner.succeed(
          chalk.green(
            `✅ Found ${voices.length} voices${argv.language ? ` for ${argv.language}` : ""}`,
          ),
        );
      }

      // Display results
      if (argv.format === "json") {
        this.handleTTSOutput(voices, argv);
      } else if (argv.format === "table") {
        logger.table(voices);
      } else {
        // Text format
        if (!argv.quiet) {
          logger.always(
            chalk.blue(
              `🎤 Available TTS Voices${argv.language ? ` (${argv.language})` : ""}:`,
            ),
          );
        }

        for (const voice of voices) {
          const genderColor =
            voice.gender === "MALE" ? chalk.cyan : chalk.magenta;
          const typeColor =
            voice.type === "Neural2" ? chalk.green : chalk.yellow;

          logger.always(
            `   ${chalk.bold(voice.name)} - ${genderColor(voice.gender)} ${typeColor(voice.type)} (${voice.language})`,
          );
        }

        if (!argv.quiet && voices.length > 0) {
          logger.always(
            chalk.gray(
              `\n💡 Use with: neurolink tts generate "text" --voice ${voices[0].name}`,
            ),
          );
        }
      }

      if (argv.debug) {
        logger.info(chalk.yellow("\n🔍 Debug - Voice Information:"));
        logger.info(`   Total voices available: ${allVoices.length}`);
        logger.info(`   Filtered voices: ${voices.length}`);
        logger.info(`   Filter applied: ${argv.language || "none"}`);
      }
    } catch (error) {
      if (spinner) {
        spinner.fail("Failed to fetch voices");
      }
      handleError(error as Error, "TTS Voices");
    }
  }

  /**
   * Handle TTS output formatting
   */
  private static handleTTSOutput(
    result: unknown,
    options: {
      format?: "text" | "json" | "table";
      quiet?: boolean;
    },
  ) {
    let output: string;

    if (options.format === "json") {
      output = JSON.stringify(result, null, 2);
    } else if (options.format === "table" && Array.isArray(result)) {
      logger.table(result);
      return;
    } else {
      // For non-JSON formats, display the result appropriately
      if (typeof result === "object" && result !== null) {
        const resultObj = result as Record<string, unknown>;
        if (resultObj.audioSize || resultObj.bufferGenerated) {
          // This is a generate result
          return;
        }
      }
      output = JSON.stringify(result, null, 2);
    }

    logger.always(output);
  }
}
