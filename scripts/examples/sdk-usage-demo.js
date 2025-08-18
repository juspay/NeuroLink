// NOTE: This demo showcases how a user would interact with the NeuroLink SDK.
// It only uses the public API exported from the main package entry point.
//
// To run this demo, use the pre-configured npm script:
//
// pnpm run demo:sdk-usage
//

// In a real-world application, you would import from the package name:
// import { createAIProvider, getAvailableProviders } from "@juspay/neurolink";
//
// We are importing from the local build output (`dist`) here to make this demo
// runnable from within the project repository.
import { createAIProvider, getAvailableProviders } from "../../dist/index.js";
import { logger } from "../../src/lib/utils/logger.js";
import chalk from "chalk";

async function runSdkDemo() {
  console.log(chalk.bold.cyan("🚀 Starting NeuroLink SDK Usage Demonstration 🚀\n"));

  // 1. List available providers
  console.log(chalk.bold.magenta("--- 1. Listing Available Providers ---"));
  const providers = getAvailableProviders();
  console.log(chalk.green(`Available providers: ${providers.join(", ")}`));

  // 2. Create a provider instance
  console.log(chalk.bold.magenta("\n--- 2. Creating a Provider Instance ---"));
  try {
    // We'll use a provider that doesn't require an API key for this demo, like Ollama.
    // This assumes Ollama is running locally with a model like 'llama3.1:8b'.
    const providerName = "ollama";
    console.log(`Attempting to create provider: '${providerName}'...`);
    const provider = await createAIProvider(providerName);
    console.log(chalk.green(`Successfully created provider: '${providerName}'`));

    // 3. Generate text
    console.log(chalk.bold.magenta("\n--- 3. Generating Text ---"));
    console.log("Sending a simple prompt...");
    const result = await provider.generate("Why is the sky blue?");
    console.log(chalk.green("Response received:"));
    console.log(result.content);

  } catch (error) {
    const msg = (error && typeof error === "object" && "message" in error)
      ? String(error.message)
      : String(error);
    logger.error(chalk.red(`\n❌ An error occurred during the demo: ${msg}`));
    logger.info(chalk.yellow("Please ensure the selected provider (e.g., Ollama) is running locally to successfully run this demo."));
  }

  console.log(chalk.bold.cyan("\n✅ SDK Usage Demonstration Complete!\n"));
}

runSdkDemo();
