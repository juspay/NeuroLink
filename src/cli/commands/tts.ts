import type { CommandModule, Argv } from "yargs";
import chalk from "chalk";
import ora from "ora";
import { TTSService, TTSError } from "../../lib/tts/index.js";
import type {
  TTSInput,
  TTSGenerateArgs,
  TTSVoicesArgs,
  AudioEncoding,
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
      description:
        "Audio output format (default: MP3, auto-converted to WAV on Windows)",
      alias: "encoding",
      default: "MP3" as const,
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

      // Default to MP3 for good quality and smaller file size
      const encoding: AudioEncoding = argv.audioEncoding || "MP3";

      // Build TTS input
      const ttsInput: TTSInput = {
        text: argv.text,
        provider: "gemini",
        languageCode: argv.languageCode || "en-US",
        voiceName: argv.voiceName || "en-US-Wavenet-D",
        audioEncoding: encoding,
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

      // Prepare generation summary
      const summary = {
        voice: ttsInput.voiceName,
        language: ttsInput.languageCode,
        encoding: response.encoding,
        audioSizeKB: Number((response.audioSize / 1024).toFixed(1)),
        generationTimeMs: response.generationTime,
        wasPlayed: response.wasPlayed,
      };

      // Output based on format
      if (argv.format && argv.format !== "text") {
        this.handleTTSOutput(summary, argv);
      } else if (!argv.quiet) {
        logger.always(
          chalk.blue(
            `🎧 Generated ${summary.encoding} audio in ${summary.generationTimeMs}ms (voice ${summary.voice})`,
          ),
        );
      }

      if (argv.debug) {
        logger.info(chalk.yellow("\n🔍 Debug - Generation Results:"));
        logger.info(`   Audio buffer generated in memory`);
        logger.info(`   Audio size: ${summary.audioSizeKB} KB`);
        logger.info(`   Voice used: ${summary.voice}`);
        logger.info(`   Language: ${summary.language}`);
        logger.info(`   Encoding: ${summary.encoding}`);
        logger.info(`   Generation time: ${summary.generationTimeMs}ms`);
        logger.info(`   Was played: ${summary.wasPlayed}`);
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
  private static async executeTTSVoices(argv: TTSVoicesArgs) {
    const spinner = argv.quiet
      ? null
      : ora("🔍 Fetching available TTS voices...").start();

    try {
      // Create TTS service
      const ttsService = new TTSService();

      // Fetch voices - already transformed to VoiceOption[] by service
      const voices = await ttsService.getAvailableVoices(argv.language);

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
            voice.type === "NEURAL2" ? chalk.green : chalk.yellow;

          logger.always(
            `   ${chalk.bold(voice.name)} - ${genderColor(voice.gender)} ${typeColor(voice.type)} (${voice.languageCode})`,
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
        logger.info(`   Total voices fetched: ${voices.length}`);
        logger.info(`   Language filter: ${argv.language || "none"}`);
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
    } else if (options.format === "table") {
      // Table format for arrays or single objects
      if (Array.isArray(result)) {
        logger.table(result);
      } else if (typeof result === "object" && result !== null) {
        logger.table([result]);
      }
      return;
    } else {
      // Text format - JSON stringify for structured data
      output = JSON.stringify(result, null, 2);
    }

    logger.always(output);
  }
}
