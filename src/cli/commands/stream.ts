/**
 * Stream CLI Commands for NeuroLink
 *
 * Implements streaming-related CLI commands including:
 * - `neurolink stream test` - Test streaming connection
 * - Support for `--stream` flag on generate command
 *
 * @module cli/commands/stream
 */

import type { CommandModule, Argv, Arguments } from "yargs";
import chalk from "chalk";
import ora from "ora";
import { logger } from "../../lib/utils/logger.js";

/**
 * Stream command arguments
 */
export type StreamCommandArgs = {
  provider?: string;
  model?: string;
  timeout?: number;
  debug?: boolean;
  quiet?: boolean;
  format?: "text" | "json" | "events";
  prompt?: string;
  showEvents?: boolean;
  showUsage?: boolean;
};

/**
 * Stream test result
 */
type StreamTestResult = {
  success: boolean;
  provider: string;
  model: string;
  firstTokenLatency: number;
  totalTime: number;
  chunkCount: number;
  totalCharacters: number;
  error?: string;
};

/**
 * Stream CLI command factory
 */
export class StreamCommandFactory {
  /**
   * Create the main stream command with subcommands
   */
  static createStreamCommands(): CommandModule {
    return {
      command: "stream <subcommand>",
      describe: "Streaming utilities and diagnostics",
      builder: (yargs) => {
        return yargs
          .command(
            "test",
            "Test streaming connection and latency",
            (yargs: Argv) => this.buildTestOptions(yargs),
            (argv) => this.executeTest(argv as Arguments<StreamCommandArgs>),
          )
          .command(
            "benchmark",
            "Benchmark streaming performance across providers",
            (yargs: Argv) => this.buildBenchmarkOptions(yargs),
            (argv) =>
              this.executeBenchmark(argv as Arguments<StreamCommandArgs>),
          )
          .option("format", {
            choices: ["text", "json", "events"] as const,
            default: "text",
            description: "Output format",
          })
          .option("quiet", {
            type: "boolean",
            alias: "q",
            default: false,
            description: "Suppress non-essential output",
          })
          .option("debug", {
            type: "boolean",
            default: false,
            description: "Enable debug output",
          })
          .demandCommand(1, "Please specify a stream subcommand")
          .help();
      },
      handler: () => {
        // No-op handler as subcommands handle everything
      },
    };
  }

  /**
   * Build options for test command
   */
  private static buildTestOptions(yargs: Argv): Argv {
    return yargs
      .option("provider", {
        type: "string",
        alias: "p",
        description: "Provider to test (default: auto-select)",
      })
      .option("model", {
        type: "string",
        alias: "m",
        description: "Model to test",
      })
      .option("timeout", {
        type: "number",
        default: 30,
        description: "Timeout in seconds",
      })
      .option("prompt", {
        type: "string",
        default: "Say hello in exactly 10 words.",
        description: "Test prompt to use",
      })
      .option("showEvents", {
        type: "boolean",
        default: false,
        description: "Show all stream events",
      })
      .option("showUsage", {
        type: "boolean",
        default: true,
        description: "Show token usage",
      })
      .example("neurolink stream test", "Test streaming with default provider")
      .example(
        "neurolink stream test -p openai -m gpt-4o",
        "Test specific provider and model",
      )
      .example(
        'neurolink stream test --prompt "Count to 5"',
        "Test with custom prompt",
      );
  }

  /**
   * Build options for benchmark command
   */
  private static buildBenchmarkOptions(yargs: Argv): Argv {
    return yargs
      .option("providers", {
        type: "array",
        description: "Providers to benchmark (default: all available)",
      })
      .option("iterations", {
        type: "number",
        default: 3,
        description: "Number of iterations per provider",
      })
      .option("prompt", {
        type: "string",
        default: "Explain what streaming is in AI in 50 words.",
        description: "Benchmark prompt to use",
      })
      .option("timeout", {
        type: "number",
        default: 60,
        description: "Timeout per provider in seconds",
      })
      .example(
        "neurolink stream benchmark",
        "Benchmark all available providers",
      )
      .example(
        "neurolink stream benchmark --providers openai anthropic",
        "Benchmark specific providers",
      );
  }

  /**
   * Execute stream test command
   */
  private static async executeTest(
    argv: Arguments<StreamCommandArgs>,
  ): Promise<void> {
    const spinner = ora();
    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    try {
      // Dynamic import to avoid circular dependencies
      const { NeuroLink } = await import("../../lib/neurolink.js");

      const provider = argv.provider || "auto";
      const model = argv.model;

      if (!argv.quiet) {
        spinner.start(
          chalk.cyan(
            `Testing streaming with ${provider}${model ? ` (${model})` : ""}...`,
          ),
        );
      }

      const sdk = new NeuroLink({});

      // Determine the provider to use
      const resolvedProvider = provider !== "auto" ? provider : undefined;

      // Stream test
      const result = await sdk.stream({
        input: { text: argv.prompt || "Say hello in exactly 10 words." },
        provider: resolvedProvider,
        model: model,
        timeout: (argv.timeout || 30) * 1000,
        disableTools: true, // Disable tools for clean test
      });

      // Collect stream results
      let fullText = "";
      let chunkCount = 0;
      const events: Array<{ type: string; timestamp: number }> = [];

      for await (const chunk of result.stream) {
        // Track first token time
        if (firstTokenTime === null) {
          firstTokenTime = Date.now();
          if (!argv.quiet) {
            spinner.text = chalk.cyan("Receiving stream...");
          }
        }

        if ("content" in chunk) {
          fullText += chunk.content;
          chunkCount++;

          // Show events if requested
          if (argv.showEvents && !argv.quiet) {
            events.push({ type: "text", timestamp: Date.now() });
          }
        }
      }

      const totalTime = Date.now() - startTime;
      const firstTokenLatency = firstTokenTime
        ? firstTokenTime - startTime
        : totalTime;

      // Build result
      const testResult: StreamTestResult = {
        success: true,
        provider: result.provider || provider,
        model: result.model || model || "default",
        firstTokenLatency,
        totalTime,
        chunkCount,
        totalCharacters: fullText.length,
      };

      if (!argv.quiet) {
        spinner.succeed(chalk.green("Stream test completed successfully!"));
      }

      // Output results
      const resolvedUsage =
        result.usage instanceof Promise ? await result.usage : result.usage;
      this.outputTestResult(testResult, fullText, resolvedUsage, argv);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (!argv.quiet) {
        spinner.fail(chalk.red(`Stream test failed: ${errorMessage}`));
      }

      if (argv.format === "json") {
        logger.always(
          JSON.stringify(
            {
              success: false,
              error: errorMessage,
              totalTime: Date.now() - startTime,
            },
            null,
            2,
          ),
        );
      }

      if (argv.debug) {
        logger.error("Stream test error:", error);
      }

      process.exit(1);
    }
  }

  /**
   * Execute stream benchmark command
   */
  private static async executeBenchmark(
    argv: Arguments<StreamCommandArgs>,
  ): Promise<void> {
    const spinner = ora();

    try {
      // Dynamic import
      const { NeuroLink } = await import("../../lib/neurolink.js");
      const { getAvailableProviders } = await import(
        "../../lib/models/modelRegistry.js"
      );

      // Get providers to benchmark
      const providers =
        (argv.providers as string[] | undefined) || getAvailableProviders();
      const iterations = (argv as { iterations?: number }).iterations || 3;
      const timeout = (argv.timeout || 60) * 1000;
      const prompt =
        argv.prompt || "Explain what streaming is in AI in 50 words.";

      if (!argv.quiet) {
        logger.always(chalk.cyan("\nStreaming Benchmark"));
        logger.always(chalk.gray("=".repeat(50)));
        logger.always(chalk.gray(`Providers: ${providers.join(", ")}`));
        logger.always(chalk.gray(`Iterations: ${iterations}`));
        logger.always(chalk.gray(`Prompt: "${prompt.slice(0, 50)}..."`));
        logger.always();
      }

      const results: Map<
        string,
        {
          success: number;
          failed: number;
          avgFirstTokenLatency: number;
          avgTotalTime: number;
          avgChunks: number;
        }
      > = new Map();

      for (const provider of providers) {
        if (!argv.quiet) {
          spinner.start(chalk.cyan(`Testing ${provider}...`));
        }

        const providerResults = {
          success: 0,
          failed: 0,
          totalFirstTokenLatency: 0,
          totalTime: 0,
          totalChunks: 0,
        };

        for (let i = 0; i < iterations; i++) {
          try {
            const sdk = new NeuroLink({});
            const startTime = Date.now();
            let firstTokenTime: number | null = null;
            let chunkCount = 0;

            const result = await sdk.stream({
              input: { text: prompt },
              provider,
              timeout,
              disableTools: true,
            });

            for await (const chunk of result.stream) {
              if (firstTokenTime === null) {
                firstTokenTime = Date.now();
              }
              if ("content" in chunk) {
                chunkCount++;
              }
            }

            providerResults.success++;
            providerResults.totalFirstTokenLatency += firstTokenTime
              ? firstTokenTime - startTime
              : Date.now() - startTime;
            providerResults.totalTime += Date.now() - startTime;
            providerResults.totalChunks += chunkCount;
          } catch {
            providerResults.failed++;
          }
        }

        if (providerResults.success > 0) {
          results.set(provider, {
            success: providerResults.success,
            failed: providerResults.failed,
            avgFirstTokenLatency:
              providerResults.totalFirstTokenLatency / providerResults.success,
            avgTotalTime: providerResults.totalTime / providerResults.success,
            avgChunks: providerResults.totalChunks / providerResults.success,
          });
          if (!argv.quiet) {
            spinner.succeed(chalk.green(`${provider}: completed`));
          }
        } else {
          results.set(provider, {
            success: 0,
            failed: providerResults.failed,
            avgFirstTokenLatency: 0,
            avgTotalTime: 0,
            avgChunks: 0,
          });
          if (!argv.quiet) {
            spinner.fail(chalk.red(`${provider}: all iterations failed`));
          }
        }
      }

      // Output benchmark results
      this.outputBenchmarkResults(results, argv);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (!argv.quiet) {
        spinner.fail(chalk.red(`Benchmark failed: ${errorMessage}`));
      }

      if (argv.debug) {
        logger.error("Benchmark error:", error);
      }

      process.exit(1);
    }
  }

  /**
   * Output test result
   */
  private static outputTestResult(
    result: StreamTestResult,
    text: string,
    usage: { input: number; output: number; total: number } | undefined,
    argv: Arguments<StreamCommandArgs>,
  ): void {
    if (argv.format === "json") {
      logger.always(
        JSON.stringify(
          {
            ...result,
            text,
            usage,
          },
          null,
          2,
        ),
      );
      return;
    }

    // Text format
    logger.always();
    logger.always(chalk.cyan("Stream Test Results"));
    logger.always(chalk.gray("-".repeat(40)));
    logger.always(chalk.white(`Provider: ${chalk.bold(result.provider)}`));
    logger.always(chalk.white(`Model: ${chalk.bold(result.model)}`));
    logger.always();

    logger.always(chalk.cyan("Performance Metrics:"));
    logger.always(
      chalk.white(
        `  First Token Latency: ${chalk.yellow(result.firstTokenLatency + "ms")}`,
      ),
    );
    logger.always(
      chalk.white(`  Total Time: ${chalk.yellow(result.totalTime + "ms")}`),
    );
    logger.always(
      chalk.white(`  Chunks Received: ${chalk.yellow(result.chunkCount)}`),
    );
    logger.always(
      chalk.white(
        `  Total Characters: ${chalk.yellow(result.totalCharacters)}`,
      ),
    );

    if (result.chunkCount > 0) {
      const avgChunkSize = Math.round(
        result.totalCharacters / result.chunkCount,
      );
      const throughput = Math.round(
        (result.totalCharacters / result.totalTime) * 1000,
      );
      logger.always(
        chalk.white(
          `  Avg Chunk Size: ${chalk.yellow(avgChunkSize + " chars")}`,
        ),
      );
      logger.always(
        chalk.white(`  Throughput: ${chalk.yellow(throughput + " chars/sec")}`),
      );
    }

    if (argv.showUsage && usage) {
      logger.always();
      logger.always(chalk.cyan("Token Usage:"));
      logger.always(chalk.white(`  Input Tokens: ${chalk.yellow(usage.input)}`));
      logger.always(
        chalk.white(`  Output Tokens: ${chalk.yellow(usage.output)}`),
      );
      logger.always(chalk.white(`  Total Tokens: ${chalk.yellow(usage.total)}`));
    }

    logger.always();
    logger.always(chalk.cyan("Response:"));
    logger.always(chalk.gray(text));
    logger.always();
  }

  /**
   * Output benchmark results
   */
  private static outputBenchmarkResults(
    results: Map<
      string,
      {
        success: number;
        failed: number;
        avgFirstTokenLatency: number;
        avgTotalTime: number;
        avgChunks: number;
      }
    >,
    argv: Arguments<StreamCommandArgs>,
  ): void {
    if (argv.format === "json") {
      const jsonResults: Record<string, unknown> = {};
      for (const [provider, data] of results) {
        jsonResults[provider] = data;
      }
      logger.always(JSON.stringify(jsonResults, null, 2));
      return;
    }

    // Text format
    logger.always();
    logger.always(chalk.cyan("Benchmark Results"));
    logger.always(chalk.gray("=".repeat(80)));
    logger.always(
      chalk.gray(
        `${"Provider".padEnd(20)} ${"Success".padEnd(10)} ${"TTFT (ms)".padEnd(12)} ${"Total (ms)".padEnd(12)} ${"Chunks".padEnd(10)}`,
      ),
    );
    logger.always(chalk.gray("-".repeat(80)));

    // Sort by first token latency
    const sortedResults = Array.from(results.entries()).sort((a, b) => {
      if (a[1].success === 0 && b[1].success === 0) {
        return 0;
      }
      if (a[1].success === 0) {
        return 1;
      }
      if (b[1].success === 0) {
        return -1;
      }
      return a[1].avgFirstTokenLatency - b[1].avgFirstTokenLatency;
    });

    for (const [provider, data] of sortedResults) {
      if (data.success === 0) {
        logger.always(
          chalk.red(
            `${provider.padEnd(20)} ${`0/${data.failed}`.padEnd(10)} ${"N/A".padEnd(12)} ${"N/A".padEnd(12)} ${"N/A".padEnd(10)}`,
          ),
        );
      } else {
        const successRate = `${data.success}/${data.success + data.failed}`;
        logger.always(
          chalk.white(
            `${provider.padEnd(20)} ${successRate.padEnd(10)} ${Math.round(data.avgFirstTokenLatency).toString().padEnd(12)} ${Math.round(data.avgTotalTime).toString().padEnd(12)} ${Math.round(data.avgChunks).toString().padEnd(10)}`,
          ),
        );
      }
    }

    logger.always();

    // Show winner
    const winner = sortedResults.find(([, data]) => data.success > 0);
    if (winner) {
      logger.always(
        chalk.green(
          `Fastest First Token: ${chalk.bold(winner[0])} (${Math.round(winner[1].avgFirstTokenLatency)}ms)`,
        ),
      );
    }

    logger.always();
  }
}

/**
 * Create stream commands for CLI integration
 */
export function createStreamCommands(): CommandModule {
  return StreamCommandFactory.createStreamCommands();
}
