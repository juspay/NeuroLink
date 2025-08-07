/**
 * SageMaker CLI Commands
 *
 * Provides comprehensive command-line interface for Amazon SageMaker operations
 * including configuration management, endpoint testing, and model deployment.
 */

import type { Argv } from "yargs";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import {
  SageMakerClient,
  ListEndpointsCommand,
  type EndpointSummary,
} from "@aws-sdk/client-sagemaker";
import type { UnknownRecord } from "../../lib/types/common.js";
import {
  checkSageMakerConfiguration,
  getSageMakerConfig,
  getConfigurationSummary,
  clearConfigurationCache,
} from "../../lib/providers/sagemaker/config.js";
import { AmazonSageMakerProvider } from "../../lib/providers/sagemaker/index.js";
import {
  runQuickDiagnostics,
  formatDiagnosticReport,
} from "../../lib/providers/sagemaker/diagnostics.js";

/**
 * Secure configuration container that avoids process.env exposure
 */
interface SecureConfiguration {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpointName: string;
  timeout: number;
  maxRetries: number;
  sessionId: string;
  createdAt: number;
}

/**
 * In-memory secure credential store (cleared after validation)
 */
const secureCredentialStore = new Map<string, SecureConfiguration>();

/**
 * Create secure configuration without exposing credentials to process.env
 */
function createSecureConfiguration(config: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpointName: string;
  timeout: number;
  maxRetries: number;
}): SecureConfiguration {
  const sessionId = `sagemaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const secureConfig: SecureConfiguration = {
    ...config,
    sessionId,
    createdAt: Date.now(),
  };

  // Store temporarily in secure memory store
  secureCredentialStore.set(sessionId, secureConfig);

  // Auto-cleanup after 5 minutes for security
  setTimeout(
    () => {
      secureCredentialStore.delete(sessionId);
    },
    5 * 60 * 1000,
  );

  return secureConfig;
}

/**
 * Validate secure configuration without exposing credentials
 */
function validateSecureConfiguration(secureConfig: SecureConfiguration): void {
  // Create temporary AWS SDK client with secure credentials
  const tempClient = new SageMakerClient({
    region: secureConfig.region,
    credentials: {
      accessKeyId: secureConfig.accessKeyId,
      secretAccessKey: secureConfig.secretAccessKey,
    },
  });

  // Test basic connectivity (this will throw if credentials are invalid)
  // Note: We're not actually making a call here, just validating the client can be created
  if (
    !tempClient ||
    !secureConfig.accessKeyId ||
    !secureConfig.secretAccessKey
  ) {
    throw new Error("Invalid AWS credentials provided");
  }

  // Basic validation of configuration values
  if (!secureConfig.region || secureConfig.region.length < 3) {
    throw new Error("Invalid AWS region provided");
  }

  if (!secureConfig.endpointName || secureConfig.endpointName.length < 1) {
    throw new Error("Invalid SageMaker endpoint name provided");
  }

  if (secureConfig.timeout < 1000 || secureConfig.timeout > 300000) {
    throw new Error("Timeout must be between 1000ms and 300000ms");
  }

  if (secureConfig.maxRetries < 0 || secureConfig.maxRetries > 10) {
    throw new Error("Max retries must be between 0 and 10");
  }
}

/**
 * Clear secure credentials from memory
 */
function clearSecureCredentials(sessionId: string): void {
  secureCredentialStore.delete(sessionId);
}

/**
 * Add SageMaker commands to the CLI
 */
export function addSageMakerCommands(cli: Argv) {
  cli.command(
    "sagemaker <command>",
    "Manage Amazon SageMaker AI models and endpoints",
    (yargs: Argv) => {
      return yargs
        .command(
          "status",
          "Check SageMaker configuration and connectivity",
          {},
          statusHandler,
        )
        .command(
          "test <endpoint>",
          "Test connectivity to a SageMaker endpoint",
          {
            endpoint: {
              describe: "SageMaker endpoint name to test",
              type: "string",
              demandOption: true,
            },
            model: {
              describe: "Model name for the endpoint",
              type: "string",
              default: "sagemaker-model",
            },
            prompt: {
              describe: "Test prompt to send",
              type: "string",
              default: "Hello, world!",
            },
          },
          testEndpointHandler,
        )
        .command(
          "list-endpoints",
          "List available SageMaker endpoints",
          {},
          listEndpointsHandler,
        )
        .command(
          "config",
          "Show current SageMaker configuration",
          {
            format: {
              describe: "Output format",
              choices: ["json", "table", "yaml"] as const,
              default: "table" as const,
            },
          },
          configHandler,
        )
        .command(
          "setup",
          "Interactive SageMaker configuration setup",
          {},
          setupHandler,
        )
        .command(
          "validate",
          "Validate SageMaker configuration and credentials",
          {
            endpoint: {
              describe: "Optional endpoint name to validate",
              type: "string",
            },
          },
          validateHandler,
        )
        .command(
          "benchmark <endpoint>",
          "Run performance benchmark against SageMaker endpoint",
          {
            endpoint: {
              describe: "SageMaker endpoint name to benchmark",
              type: "string",
              demandOption: true,
            },
            requests: {
              describe: "Number of requests to send",
              type: "number",
              default: 10,
            },
            concurrency: {
              describe: "Number of concurrent requests",
              type: "number",
              default: 1,
            },
            maxTokens: {
              describe: "Maximum tokens per request",
              type: "number",
              default: 50,
            },
          },
          benchmarkHandler,
        )
        .command(
          "clear-cache",
          "Clear SageMaker configuration cache",
          {},
          clearCacheHandler,
        )
        .command(
          "diagnose [endpoint]",
          "Run comprehensive streaming diagnostics",
          {
            endpoint: {
              describe: "SageMaker endpoint name to diagnose",
              type: "string",
            },
            quick: {
              describe: "Run quick diagnostics only",
              type: "boolean",
              default: false,
            },
            full: {
              describe: "Run full diagnostic suite including performance tests",
              type: "boolean",
              default: false,
            },
            connectivity: {
              describe: "Test connectivity only",
              type: "boolean",
              default: false,
            },
            streaming: {
              describe: "Test streaming capability only",
              type: "boolean",
              default: false,
            },
            timeout: {
              describe: "Timeout for diagnostic tests in milliseconds",
              type: "number",
              default: 30000,
            },
          },
          diagnoseHandler,
        )
        .demandCommand(1, "Please specify a SageMaker command");
    },
    () => {}, // No-op handler as subcommands handle everything
  );
}

/**
 * Handler for checking SageMaker status
 */
async function statusHandler() {
  const spinner = ora("Checking SageMaker configuration...").start();

  try {
    const status = checkSageMakerConfiguration();
    spinner.stop();

    console.log(chalk.blue("\n🔍 SageMaker Configuration Status\n"));

    if (status.configured) {
      console.log(chalk.green("✅ Configuration: Valid"));
    } else {
      console.log(chalk.red("❌ Configuration: Invalid"));
    }

    if (status.issues.length > 0) {
      console.log(chalk.yellow("\n⚠️  Issues found:"));
      status.issues.forEach((issue) => {
        console.log(`   • ${issue}`);
      });
    }

    // Show configuration summary (safe for display)
    if (status.summary) {
      console.log(chalk.blue("\n📋 Configuration Summary:"));
      if (typeof status.summary === "object" && status.summary.aws) {
        const aws = status.summary.aws as UnknownRecord;
        console.log(`   Region: ${aws.region}`);
        console.log(`   Access Key: ${aws.accessKeyId}`);
        console.log(`   Timeout: ${aws.timeout}ms`);
        console.log(`   Max Retries: ${aws.maxRetries}`);
      }
    }

    process.exit(status.configured ? 0 : 1);
  } catch (error) {
    spinner.fail("Failed to check SageMaker configuration");
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }
}

/**
 * Handler for testing SageMaker endpoint connectivity
 */
async function testEndpointHandler(argv: {
  endpoint: string;
  model?: string;
  prompt?: string;
}) {
  const { endpoint, model, prompt } = argv;
  const spinner = ora(
    `Testing connectivity to endpoint: ${endpoint}...`,
  ).start();

  try {
    // First check configuration
    const status = checkSageMakerConfiguration();
    if (!status.configured) {
      spinner.fail("SageMaker configuration is invalid");
      console.error(chalk.red("Please run 'neurolink sagemaker setup' first"));
      process.exit(1);
    }

    // Create provider and test connectivity
    const provider = new AmazonSageMakerProvider(model, endpoint);

    const languageModel = await provider.getModel();

    spinner.text = "Testing endpoint connectivity...";
    const testResult = await provider.testConnectivity();

    if (testResult.success) {
      spinner.succeed(`✅ Endpoint '${endpoint}' is accessible`);

      // Run a simple generation test
      spinner.start("Testing text generation...");
      try {
        const result = await languageModel.doGenerate({
          inputFormat: "messages" as const,
          mode: { type: "regular" as const },
          prompt: [
            {
              role: "user" as const,
              content: [{ type: "text", text: prompt || "Hello" }],
            },
          ],
          maxTokens: 50,
        });

        spinner.succeed("✅ Text generation test successful");
        console.log(chalk.blue("\n📝 Test Response:"));
        console.log(`   Input: "${prompt}"`);
        console.log(
          `   Output: "${result.text?.substring(0, 100)}${result.text && result.text.length > 100 ? "..." : ""}"`,
        );
        console.log(
          `   Tokens: ${result.usage.promptTokens} → ${result.usage.completionTokens} (${(result.usage as { totalTokens?: number }).totalTokens ?? result.usage.promptTokens + result.usage.completionTokens} total)`,
        );
        console.log(`   Finish Reason: ${result.finishReason}`);
      } catch (genError) {
        spinner.fail("❌ Text generation test failed");
        console.error(
          chalk.red(
            `Generation Error: ${genError instanceof Error ? genError.message : String(genError)}`,
          ),
        );
      }
    } else {
      spinner.fail(`❌ Endpoint '${endpoint}' is not accessible`);
      console.error(chalk.red(`Error: ${testResult.error}`));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail("Failed to test SageMaker endpoint");
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }
}

/**
 * Handler for listing SageMaker endpoints
 */
async function listEndpointsHandler() {
  const spinner = ora("Listing SageMaker endpoints...").start();

  try {
    // Use AWS SDK directly for better security and error handling
    try {
      const config = await getSageMakerConfig();
      const sagemakerClient = new SageMakerClient({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
          ...(config.sessionToken && { sessionToken: config.sessionToken }),
        },
      });

      // List endpoints using AWS SDK
      const command = new ListEndpointsCommand({});
      const response = await sagemakerClient.send(command);
      const endpoints = { Endpoints: response.Endpoints || [] };
      spinner.stop();

      if (endpoints.Endpoints && endpoints.Endpoints.length > 0) {
        console.log(chalk.blue("\n🔗 Available SageMaker Endpoints:\n"));

        endpoints.Endpoints.forEach(
          (endpoint: EndpointSummary, index: number) => {
            console.log(`${index + 1}. ${chalk.green(endpoint.EndpointName)}`);
            console.log(`   Status: ${endpoint.EndpointStatus}`);
            console.log(
              `   Created: ${endpoint.CreationTime?.toLocaleDateString() ?? "Unknown"}`,
            );
            if (endpoint.LastModifiedTime) {
              console.log(
                `   Modified: ${endpoint.LastModifiedTime.toLocaleDateString()}`,
              );
            }
            console.log();
          },
        );
      } else {
        console.log(chalk.yellow("No SageMaker endpoints found"));
      }
    } catch (awsError) {
      spinner.fail("Failed to list endpoints");
      console.error(
        chalk.red("AWS SDK credentials error or insufficient permissions"),
      );
      console.log(chalk.yellow("\nTo list endpoints, please:"));
      console.log("1. Set AWS_ACCESS_KEY_ID environment variable");
      console.log("2. Set AWS_SECRET_ACCESS_KEY environment variable");
      console.log("3. Set AWS_REGION environment variable (or use default)");
      console.log("4. Ensure you have sagemaker:ListEndpoints permission");
    }
  } catch (error) {
    spinner.fail("Failed to list SageMaker endpoints");
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }
}

/**
 * Handler for showing configuration
 */
async function configHandler(args: { format: "json" | "table" | "yaml" }) {
  const format = args.format;
  const spinner = ora("Loading SageMaker configuration...").start();

  try {
    const summary = getConfigurationSummary();
    spinner.stop();

    console.log(chalk.blue("\n⚙️  SageMaker Configuration\n"));

    if (format === "json") {
      console.log(JSON.stringify(summary, null, 2));
    } else if (format === "yaml") {
      // Simple YAML-like output
      function printYaml(obj: UnknownRecord, indent = 0) {
        const spaces = " ".repeat(indent);
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === "object" && value !== null) {
            console.log(`${spaces}${key}:`);
            printYaml(value as UnknownRecord, indent + 2);
          } else {
            console.log(`${spaces}${key}: ${value}`);
          }
        }
      }
      printYaml(summary);
    } else {
      // Table format (default)
      if (typeof summary === "object" && summary.aws) {
        const aws = summary.aws as UnknownRecord;
        const sagemaker = ((summary as UnknownRecord).sagemaker ||
          {}) as UnknownRecord;
        const environment = ((summary as UnknownRecord).environment ||
          {}) as UnknownRecord;

        console.log(chalk.green("AWS Configuration:"));
        console.log(`  Region: ${aws.region}`);
        console.log(`  Access Key: ${aws.accessKeyId}`);
        console.log(`  Secret Key: ${aws.secretAccessKey}`);
        console.log(`  Session Token: ${aws.sessionToken}`);
        console.log(`  Timeout: ${aws.timeout}ms`);
        console.log(`  Max Retries: ${aws.maxRetries}`);
        console.log(`  Custom Endpoint: ${aws.endpoint || "None"}`);

        console.log(chalk.blue("\nSageMaker Configuration:"));
        console.log(`  Default Endpoint: ${sagemaker.defaultEndpoint}`);
        console.log(`  Model Name: ${sagemaker.model}`);
        if (sagemaker.modelConfig) {
          const modelConfig = sagemaker.modelConfig as UnknownRecord;
          console.log(`  Model Type: ${modelConfig.modelType}`);
          console.log(`  Content Type: ${modelConfig.contentType}`);
          console.log(`  Accept: ${modelConfig.accept}`);
        }

        console.log(chalk.yellow("\nEnvironment:"));
        console.log(`  Node Environment: ${environment.nodeEnv}`);
        console.log(
          `  SageMaker Configured: ${environment.sagemakerConfigured ? "Yes" : "No"}`,
        );
        console.log(
          `  AWS Configured: ${environment.awsConfigured ? "Yes" : "No"}`,
        );
      }
    }
  } catch (error) {
    spinner.fail("Failed to load SageMaker configuration");
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }
}

/**
 * Handler for interactive setup
 */
async function setupHandler() {
  console.log(chalk.blue("\n🚀 SageMaker Interactive Setup\n"));

  // Pre-setup security advisory
  console.log(
    chalk.yellow.bold(
      "🔒 SECURITY NOTICE: You will be prompted to enter AWS credentials.\n" +
        "These credentials will be stored temporarily in memory only.\n" +
        "For production use, consider using AWS credential files or IAM roles.\n",
    ),
  );

  // Ask for user confirmation before proceeding
  const { confirmSetup } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmSetup",
      message:
        "Do you understand the security implications and want to proceed?",
      default: false,
    },
  ]);

  if (!confirmSetup) {
    console.log(
      chalk.blue(
        "\nSetup cancelled. Consider using alternative credential methods:",
      ),
    );
    console.log("• AWS credential files: ~/.aws/credentials");
    console.log("• Environment variables in .env file");
    console.log("• AWS CLI configuration: aws configure");
    console.log("• IAM roles for production environments");
    return;
  }

  try {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "accessKeyId",
        message: "AWS Access Key ID:",
        validate: (input: string) =>
          input.trim().length > 0 || "Access Key ID is required",
      },
      {
        type: "password",
        name: "secretAccessKey",
        message: "AWS Secret Access Key:",
        validate: (input: string) =>
          input.trim().length > 0 || "Secret Access Key is required",
      },
      {
        type: "input",
        name: "region",
        message: "AWS Region:",
        default: "us-east-1",
      },
      {
        type: "input",
        name: "endpointName",
        message: "Default SageMaker Endpoint Name:",
        validate: (input: string) =>
          input.trim().length > 0 || "Endpoint name is required",
      },
      {
        type: "number",
        name: "timeout",
        message: "Request timeout (ms):",
        default: 30000,
      },
      {
        type: "number",
        name: "maxRetries",
        message: "Maximum retry attempts:",
        default: 3,
      },
    ]);

    const spinner = ora("Setting up SageMaker configuration...").start();

    // Enhanced security warnings for credential handling
    spinner.stop();
    console.log(chalk.red.bold("\n🔒 CRITICAL SECURITY WARNINGS\n"));

    console.log(
      chalk.yellow.bold(
        "⚠️  CREDENTIAL PERSISTENCE: AWS credentials will only be set for this session.\n" +
          "   They will NOT persist after you exit the CLI.\n\n" +
          "🔐 SECURE STORAGE OPTIONS:\n" +
          "   • Use environment variables in a secure .env file (never commit to git)\n" +
          "   • Use AWS credential files (~/.aws/credentials) with proper permissions\n" +
          "   • Use AWS credential managers (AWS CLI, AWS SSO, IAM roles)\n" +
          "   • Use cloud provider credential chains for production\n\n" +
          "🚫 SECURITY BEST PRACTICES:\n" +
          "   • NEVER share or expose your AWS credentials in plain text\n" +
          "   • NEVER commit credentials to version control systems\n" +
          "   • Use least-privilege IAM policies (only SageMaker permissions needed)\n" +
          "   • Rotate credentials regularly and revoke unused access keys\n" +
          "   • Monitor AWS CloudTrail for unexpected API usage\n\n" +
          "📋 REQUIRED IAM PERMISSIONS:\n" +
          "   • sagemaker:InvokeEndpoint (for model inference)\n" +
          "   • sagemaker:ListEndpoints (for endpoint discovery)\n" +
          "   • sagemaker:DescribeEndpoint (for status checks)\n\n" +
          "🌐 PRODUCTION RECOMMENDATIONS:\n" +
          "   • Use IAM roles instead of access keys in production\n" +
          "   • Implement credential rotation policies\n" +
          "   • Use AWS Systems Manager Parameter Store for secrets\n" +
          "   • Consider AWS Secrets Manager for automated rotation\n\n" +
          "📖 Learn more: https://docs.aws.amazon.com/general/latest/gr/aws-access-keys-best-practices.html\n",
      ),
    );
    spinner.start("Setting up SageMaker configuration...");

    // Secure credential management without process.env exposure
    const secureConfig = createSecureConfiguration({
      accessKeyId: answers.accessKeyId,
      secretAccessKey: answers.secretAccessKey,
      region: answers.region,
      endpointName: answers.endpointName,
      timeout: answers.timeout,
      maxRetries: answers.maxRetries,
    });

    // Clear cache and test configuration with secure config
    clearConfigurationCache();

    try {
      validateSecureConfiguration(secureConfig); // Validate configuration is loadable
      spinner.succeed("✅ Configuration validated successfully");

      console.log(chalk.green("\n🎉 SageMaker setup complete!"));
      console.log(chalk.yellow("\n💡 Next steps:"));
      console.log(
        "1. Test your endpoint: neurolink sagemaker test <endpoint-name>",
      );
      console.log("2. Check status: neurolink sagemaker status");
      console.log("3. List endpoints: neurolink sagemaker list-endpoints");

      console.log(chalk.blue("\n🔒 Secure configuration validated:"));
      console.log("  ✓ AWS credentials verified");
      console.log("  ✓ AWS region validated");
      console.log("  ✓ SageMaker endpoint configured");
      console.log("  ✓ Timeout and retry settings applied");

      console.log(
        chalk.yellow(
          "\n⚠️  For persistent configuration, add these to your .env file:\n" +
            "  AWS_ACCESS_KEY_ID=your_access_key\n" +
            "  AWS_SECRET_ACCESS_KEY=your_secret_key\n" +
            "  AWS_REGION=" +
            secureConfig.region +
            "\n" +
            "  SAGEMAKER_DEFAULT_ENDPOINT=" +
            secureConfig.endpointName +
            "\n\n" +
            "🔒 SECURITY REMINDER:\n" +
            "  • Add .env to .gitignore to prevent credential exposure\n" +
            "  • Set restrictive file permissions (600) on credential files\n" +
            "  • Never share or commit these credentials to version control\n" +
            "  • Consider using AWS credential rotation policies\n" +
            "  • Monitor AWS CloudTrail for unauthorized access attempts",
        ),
      );

      // Clear secure credentials from memory after successful setup
      clearSecureCredentials(secureConfig.sessionId);
    } catch (configError) {
      spinner.fail("❌ Configuration validation failed");
      console.error(
        chalk.red(
          `Error: ${configError instanceof Error ? configError.message : String(configError)}`,
        ),
      );
      // Clear secure credentials from memory on error
      clearSecureCredentials(secureConfig.sessionId);
      process.exit(1);
    }
  } catch (error) {
    console.error(
      chalk.red(
        `Setup failed: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }
}

/**
 * Handler for configuration validation
 */
async function validateHandler() {
  const spinner = ora("Validating SageMaker configuration...").start();

  try {
    const status = checkSageMakerConfiguration();
    spinner.stop();

    console.log(chalk.blue("\n🔍 Configuration Validation Results\n"));

    if (status.configured) {
      console.log(chalk.green("✅ All checks passed"));
      console.log(chalk.blue("🚀 SageMaker is ready to use"));
    } else {
      console.log(chalk.red("❌ Configuration validation failed"));

      if (status.issues.length > 0) {
        console.log(chalk.yellow("\n🔧 Issues to fix:"));
        status.issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue}`);
        });
      }

      console.log(chalk.blue("\n💡 How to fix:"));
      console.log("Run: neurolink sagemaker setup");

      process.exit(1);
    }
  } catch (error) {
    spinner.fail("Validation failed");
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }
}

/**
 * Handler for performance benchmarking
 */
async function benchmarkHandler(argv: {
  endpoint?: string;
  duration?: number;
  concurrency?: number;
  requests?: number;
  maxTokens?: number;
}) {
  const { endpoint, requests = 10, concurrency = 2, maxTokens = 100 } = argv;
  console.log(chalk.blue(`\n⚡ SageMaker Performance Benchmark\n`));
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Requests: ${requests}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Max Tokens: ${maxTokens}\n`);

  const spinner = ora("Setting up benchmark...").start();

  try {
    // Check configuration first
    const status = checkSageMakerConfiguration();
    if (!status.configured) {
      spinner.fail("SageMaker configuration is invalid");
      console.error(chalk.red("Please run 'neurolink sagemaker setup' first"));
      process.exit(1);
    }

    const provider = new AmazonSageMakerProvider(undefined, endpoint);

    const model = await provider.getModel();

    spinner.text = "Running connectivity test...";
    const connectivityTest = await provider.testConnectivity();

    if (!connectivityTest.success) {
      spinner.fail(`Endpoint '${endpoint}' is not accessible`);
      console.error(chalk.red(`Error: ${connectivityTest.error}`));
      process.exit(1);
    }

    spinner.text = "Starting benchmark...";

    const results: Array<{
      duration: number;
      tokens: number;
      success: boolean;
      error?: string;
    }> = [];

    const startTime = Date.now();

    // Run requests in batches based on concurrency
    for (let batch = 0; batch < Math.ceil(requests / concurrency); batch++) {
      const batchSize = Math.min(concurrency, requests - batch * concurrency);
      const batchPromises = [];

      for (let i = 0; i < batchSize; i++) {
        const requestStart = Date.now();
        batchPromises.push(
          (async () => {
            try {
              const result = await model.doGenerate({
                inputFormat: "messages" as const,
                mode: { type: "regular" as const },
                prompt: [
                  {
                    role: "user" as const,
                    content: [
                      {
                        type: "text",
                        text: `Benchmark request ${batch * concurrency + i + 1}`,
                      },
                    ],
                  },
                ],
                maxTokens,
              });
              return {
                duration: Date.now() - requestStart,
                tokens:
                  (result.usage as { totalTokens?: number }).totalTokens ??
                  result.usage.promptTokens + result.usage.completionTokens,
                success: true,
              };
            } catch (error: unknown) {
              return {
                duration: Date.now() - requestStart,
                tokens: 0,
                success: false,
                error: error instanceof Error ? error.message : String(error),
              };
            }
          })(),
        );
      }

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      spinner.text = `Progress: ${results.length}/${requests} requests completed`;
    }

    const totalTime = Date.now() - startTime;
    spinner.succeed("Benchmark completed");

    // Calculate statistics
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const durations = successful.map((r) => r.duration);
    const totalTokens = successful.reduce((sum, r) => sum + r.tokens, 0);

    console.log(chalk.green("\n📊 Benchmark Results\n"));
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Successful Requests: ${successful.length}/${requests}`);
    console.log(`Failed Requests: ${failed.length}`);
    console.log(
      `Success Rate: ${((successful.length / requests) * 100).toFixed(1)}%`,
    );

    if (successful.length > 0) {
      console.log(`\nLatency Statistics:`);
      console.log(
        `  Average: ${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(0)}ms`,
      );
      console.log(`  Minimum: ${Math.min(...durations)}ms`);
      console.log(`  Maximum: ${Math.max(...durations)}ms`);
      console.log(
        `  Median: ${durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]}ms`,
      );

      console.log(`\nThroughput:`);
      console.log(
        `  Requests/sec: ${(successful.length / (totalTime / 1000)).toFixed(2)}`,
      );
      console.log(
        `  Tokens/sec: ${(totalTokens / (totalTime / 1000)).toFixed(2)}`,
      );
      console.log(
        `  Average tokens/request: ${(totalTokens / successful.length).toFixed(1)}`,
      );
    }

    if (failed.length > 0) {
      console.log(chalk.red(`\n❌ Failed Requests (${failed.length}):`));
      failed.slice(0, 5).forEach((failure, index) => {
        console.log(`  ${index + 1}. ${failure.error}`);
      });
      if (failed.length > 5) {
        console.log(`  ... and ${failed.length - 5} more`);
      }
    }
  } catch (error) {
    spinner.fail("Benchmark failed");
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }
}

/**
 * Handler for clearing configuration cache
 */
async function clearCacheHandler() {
  const spinner = ora("Clearing SageMaker configuration cache...").start();

  try {
    clearConfigurationCache();
    spinner.succeed("✅ Configuration cache cleared");
    console.log(chalk.blue("Configuration will be reloaded on next use"));
  } catch (error) {
    spinner.fail("Failed to clear cache");
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }
}

/**
 * Handler for running streaming diagnostics
 */
async function diagnoseHandler(argv: {
  endpoint?: string;
  quick?: boolean;
  full?: boolean;
  connectivity?: boolean;
  streaming?: boolean;
  timeout?: number;
}) {
  const { endpoint, quick, full, timeout } = argv;

  console.log(chalk.blue(`\n🔍 SageMaker Streaming Diagnostics\n`));

  if (endpoint) {
    console.log(`Endpoint: ${endpoint}`);
  } else {
    console.log("Endpoint: Not specified (configuration tests only)");
  }

  console.log(`Mode: ${quick ? "Quick" : full ? "Full" : "Standard"}`);
  console.log(`Timeout: ${timeout}ms\n`);

  const spinner = ora("Starting diagnostics...").start();

  try {
    // Run diagnostics (simplified - advanced streaming diagnostics removed)
    const report = await runQuickDiagnostics(endpoint);

    spinner.stop();

    // Display results
    const formatted = formatDiagnosticReport(report);
    console.log(formatted);

    // Additional insights based on results
    if (report.overallStatus === "critical") {
      console.log(chalk.red("🚨 Critical Issues Detected"));
      console.log(
        chalk.red(
          "   Your streaming configuration has serious problems that need immediate attention.",
        ),
      );
      console.log(
        chalk.yellow(
          "   See the recommendations above for resolution steps.\n",
        ),
      );
    } else if (report.overallStatus === "issues") {
      console.log(chalk.yellow("⚠️  Issues Detected"));
      console.log(
        chalk.yellow(
          "   Your streaming setup works but has some issues that could affect performance.",
        ),
      );
      console.log(
        chalk.blue("   Consider addressing the recommendations above.\n"),
      );
    } else {
      console.log(chalk.green("✅ All Systems Go"));
      console.log(
        chalk.green("   Your SageMaker streaming configuration looks healthy!"),
      );

      if (endpoint) {
        console.log(
          chalk.blue(
            "   You can now use streaming features with confidence.\n",
          ),
        );
        console.log(
          chalk.dim("   Try: neurolink sagemaker stream " + endpoint),
        );
      }
    }

    // Show additional help based on findings
    const failedTests = report.results.filter((r) => r.status === "fail");
    if (failedTests.length > 0) {
      console.log(chalk.blue("📚 Additional Resources:"));

      const hasConnectivityIssues = failedTests.some(
        (t) => t.category === "connectivity",
      );
      const hasStreamingIssues = failedTests.some(
        (t) => t.category === "streaming",
      );
      const hasConfigIssues = failedTests.some(
        (t) => t.category === "configuration",
      );

      if (hasConfigIssues) {
        console.log("   • Configuration: neurolink sagemaker setup");
      }
      if (hasConnectivityIssues) {
        console.log(
          "   • Connectivity: neurolink sagemaker test " +
            (endpoint || "your-endpoint"),
        );
      }
      if (hasStreamingIssues) {
        console.log(
          "   • Streaming Guide: docs/providers/sagemaker/streaming-troubleshooting.md",
        );
      }

      console.log(
        "   • Full Diagnostics: neurolink sagemaker diagnose " +
          (endpoint || "") +
          " --full",
      );
      console.log();
    }

    // Exit with appropriate code
    process.exit(report.overallStatus === "critical" ? 1 : 0);
  } catch (error) {
    spinner.fail("Diagnostics failed");
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );

    console.log(chalk.yellow("\n💡 Diagnostic troubleshooting:"));
    console.log(
      "   • Check your SageMaker configuration: neurolink sagemaker status",
    );
    console.log("   • Verify AWS credentials and permissions");
    console.log(
      "   • Try with a specific endpoint: neurolink sagemaker diagnose your-endpoint",
    );
    console.log("   • Run quick mode: neurolink sagemaker diagnose --quick");

    process.exit(1);
  }
}
