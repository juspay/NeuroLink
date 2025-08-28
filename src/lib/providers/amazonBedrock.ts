import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import type { AmazonBedrockProvider as BedrockProviderType } from "@ai-sdk/amazon-bedrock";
import type { ZodUnknownSchema } from "../types/typeAliases.js";
import { streamText, type LanguageModelV1 } from "ai";
import type { AIProviderName } from "../core/types.js";
import type { StreamOptions, StreamResult } from "../types/streamTypes.js";
import { BaseProvider } from "../core/baseProvider.js";
import { logger } from "../utils/logger.js";
import { createTimeoutController, TimeoutError } from "../utils/timeout.js";
import { DEFAULT_MAX_TOKENS, DEFAULT_MAX_STEPS } from "../core/constants.js";
import {
  validateApiKey,
  createAWSAccessKeyConfig,
  createAWSSecretConfig,
  getAWSRegion,
  getAWSSessionToken,
} from "../utils/providerConfig.js";
import { buildMessagesArray } from "../utils/messageBuilder.js";
import { createProxyFetch } from "../proxy/proxyFetch.js";
import { configureAWSProxySupport as _configureAWSProxySupport } from "../proxy/awsProxyIntegration.js";
import { AWSCredentialProvider } from "./aws/credentialProvider.js";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import type { AWSCredentialConfig } from "../types/providers.js";
import type { NeuroLink } from "../neurolink.js";

// Configuration helpers
const getBedrockModelId = (): string => {
  const model = process.env.BEDROCK_MODEL || process.env.BEDROCK_MODEL_ID;
  if (!model) {
    throw new Error(
      "BEDROCK_MODEL (or BEDROCK_MODEL_ID) is required. Example: 'anthropic.claude-3-haiku-20240307-v1:0' or a valid inference profile ARN.",
    );
  }
  return model;
};

// Configuration helpers - now using consolidated utility
const getAWSAccessKeyId = (): string => {
  return validateApiKey(createAWSAccessKeyConfig());
};

const getAWSSecretAccessKey = (): string => {
  return validateApiKey(createAWSSecretConfig());
};

// Note: getAWSRegion and getAWSSessionToken are now directly imported from consolidated utility

const getAppEnvironment = (): string => {
  return process.env.PUBLIC_APP_ENVIRONMENT || "production";
};

/**
 * Amazon Bedrock Provider v3 - Enhanced Authentication Implementation
 *
 * BEDROCK-MCP-CONNECTOR COMPATIBILITY: Complete AWS SDK credential chain support
 *
 * Features:
 * - Extends BaseProvider for shared functionality
 * - AWS SDK v3 defaultProvider credential chain (9 sources)
 * - Dual access: AI SDK + Direct AWS SDK BedrockRuntimeClient
 * - Full backward compatibility with existing configurations
 * - Enhanced error handling with setup guidance
 * - Bedrock-MCP-Connector compatible authentication patterns
 */
export class AmazonBedrockProvider extends BaseProvider {
  private awsCredentialProvider: AWSCredentialProvider;
  private bedrockClient: BedrockRuntimeClient;
  private bedrock: BedrockProviderType;
  private model: LanguageModelV1;

  constructor(
    modelName?: string,
    credentialConfig?: AWSCredentialConfig,
    neurolink?: NeuroLink,
  ) {
    super(modelName, "bedrock" as AIProviderName, neurolink);

    // Debug: Bedrock initialization started
    logger.debug("[Bedrock] Provider initialization started", {
      requestedModel: modelName || "default",
      environment: getAppEnvironment(),
    });

    // Initialize AWS credential provider with full credential chain support
    const defaultCredentialConfig: AWSCredentialConfig = {
      region: getAWSRegion(),
      enableDebugLogging: getAppEnvironment() === "dev",
      ...credentialConfig,
    };

    // Debug: AWS configuration
    logger.debug("[Bedrock] AWS configuration resolved", {
      region: defaultCredentialConfig.region,
      enableDebugLogging: defaultCredentialConfig.enableDebugLogging,
      credentialConfigProvided: !!credentialConfig,
    });

    this.awsCredentialProvider = new AWSCredentialProvider(
      defaultCredentialConfig,
    );

    // Debug: AWS credential detection status
    logger.debug("[Bedrock] AWS credential detection status", {
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
      hasProfile: !!process.env.AWS_PROFILE,
      credentialChainEnabled: true,
    });

    // Create AWS SDK v3 Bedrock client for direct access (Bedrock-MCP-Connector compatibility)
    // Proxy support will be injected lazily when needed
    this.bedrockClient = new BedrockRuntimeClient({
      region: defaultCredentialConfig.region,
      credentials: this.awsCredentialProvider.getCredentialProvider(),
    });

    // Debug: AWS region and service endpoint
    logger.debug("[Bedrock] AWS service configuration", {
      region: defaultCredentialConfig.region,
      serviceEndpoint: `https://bedrock-runtime.${defaultCredentialConfig.region}.amazonaws.com`,
      credentialProviderType: "AWS SDK v3 defaultProvider chain",
    });

    // For now, use legacy configuration as AI SDK may not support credential providers directly
    // TODO: Update when @ai-sdk/amazon-bedrock supports credential providers
    const legacyAwsConfig = this.createLegacyAWSConfig();

    try {
      this.bedrock = createAmazonBedrock(legacyAwsConfig);
    } catch (error) {
      logger.error("Failed to create AI SDK provider", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to initialize Amazon Bedrock AI SDK: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Pre-initialize model for efficiency
    const resolvedModelId = this.modelName || getBedrockModelId();

    // Debug: Bedrock model validation process
    logger.debug("[Bedrock] Model validation and ARN processing", {
      requestedModel: this.modelName || "from environment",
      resolvedModelId: resolvedModelId,
      isInferenceProfile: resolvedModelId.includes(":inference-profile/"),
      isFoundationModel:
        resolvedModelId.startsWith("anthropic.") ||
        resolvedModelId.startsWith("amazon.") ||
        resolvedModelId.startsWith("meta."),
      modelARNValidation: resolvedModelId.includes("arn:aws:bedrock:")
        ? "Full ARN provided"
        : "Model ID provided",
    });

    this.model = this.bedrock(resolvedModelId);

    logger.debug("Amazon Bedrock Provider v3 initialized", {
      modelName: this.modelName,
      region: defaultCredentialConfig.region,
      credentialProvider: "AWS SDK v3 defaultProvider",
      hasDualAccess: true,
      provider: this.providerName,
    });
  }

  /**
   * Legacy AWS configuration for backward compatibility
   */
  private createLegacyAWSConfig() {
    const awsConfig: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      sessionToken?: string;
      fetch?: typeof fetch;
    } = {
      accessKeyId: getAWSAccessKeyId(),
      secretAccessKey: getAWSSecretAccessKey(),
      region: getAWSRegion(),
      fetch: createProxyFetch(),
    };

    // Add session token for development environment
    if (getAppEnvironment() === "dev") {
      const sessionToken = getAWSSessionToken();
      if (sessionToken) {
        awsConfig.sessionToken = sessionToken;
      }
    }

    return awsConfig;
  }

  protected getProviderName(): AIProviderName {
    return "bedrock" as AIProviderName;
  }

  protected getDefaultModel(): string {
    return getBedrockModelId();
  }

  /**
   * Returns the Vercel AI SDK model instance for AWS Bedrock
   */
  protected getAISDKModel(): LanguageModelV1 {
    return this.model;
  }

  /**
   * Get AWS SDK BedrockRuntimeClient for direct access (Bedrock-MCP-Connector compatibility)
   * This provides the same direct AWS SDK access that Bedrock-MCP-Connector uses
   */
  getBedrockClient(): BedrockRuntimeClient {
    // Note: For synchronous access, proxy support is configured lazily
    // If proxy support is critical, use getBedrockClientWithProxy() instead
    return this.bedrockClient;
  }

  /**
   * Get AWS SDK BedrockRuntimeClient with proxy support ensured
   * Use this method when proxy support is critical for the operation
   */
  async getBedrockClientWithProxy(): Promise<BedrockRuntimeClient> {
    await this.ensureProxySupport();
    return this.bedrockClient;
  }

  /**
   * Get AWS credential provider for advanced credential management
   */
  getCredentialProvider(): AWSCredentialProvider {
    return this.awsCredentialProvider;
  }

  /**
   * Ensure proxy support is configured for AWS SDK client if needed
   */
  private async ensureProxySupport(): Promise<void> {
    try {
      const { createAWSProxyHandler } = await import(
        "../proxy/awsProxyIntegration.js"
      );
      const proxyHandler = await createAWSProxyHandler();

      if (proxyHandler) {
        logger.debug("[Bedrock] Reinitializing client with proxy support");

        // Recreate the client with proxy handler
        this.bedrockClient = new BedrockRuntimeClient({
          region: this.awsCredentialProvider.getConfig().region,
          credentials: this.awsCredentialProvider.getCredentialProvider(),
          requestHandler: proxyHandler,
        });
      }
    } catch (error) {
      logger.warn("[Bedrock] Failed to configure proxy support", { error });
      // Continue without proxy support
    }
  }

  /**
   * Test AWS credentials and Bedrock connectivity
   * Useful for debugging authentication issues
   */
  async testConnectivity(): Promise<{
    credentialsValid: boolean;
    bedrockAccessible: boolean;
    credentialSource: string;
    error?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    try {
      // Ensure proxy support is configured before testing
      await this.ensureProxySupport();

      const { CredentialTester } = await import("./aws/credentialTester.js");

      // Add timeout protection using AbortController
      const timeout = 15000; // 15 second timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, timeout);

      try {
        const [credentialResult, connectivityResult] = await Promise.race([
          Promise.all([
            CredentialTester.validateCredentials(this.awsCredentialProvider),
            CredentialTester.testBedrockConnectivity(
              this.awsCredentialProvider,
            ),
          ]),
          new Promise<never>((_, reject) => {
            abortController.signal.addEventListener("abort", () => {
              reject(new Error("Connectivity test timeout"));
            });
          }),
        ]);

        clearTimeout(timeoutId);

        return {
          credentialsValid: credentialResult.isValid,
          bedrockAccessible: connectivityResult.bedrockAccessible,
          credentialSource: credentialResult.credentialSource,
          error: credentialResult.error || connectivityResult.error,
          responseTime: Date.now() - startTime,
        };
      } catch (timeoutError) {
        clearTimeout(timeoutId);
        throw timeoutError;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        credentialsValid: false,
        bedrockAccessible: false,
        credentialSource: "unknown",
        error: errorMessage,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // executeGenerate removed - BaseProvider handles all generation with tools

  protected async executeStream(
    options: StreamOptions,
    _analysisSchema?: ZodUnknownSchema,
  ): Promise<StreamResult> {
    try {
      this.validateStreamOptions(options);
      const timeout = this.getTimeout(options);
      const timeoutController = createTimeoutController(
        timeout,
        this.providerName,
        "stream",
      );

      // Get tools consistently with generate method (now supports streaming with tools)
      const shouldUseTools = !options.disableTools && this.supportsTools();
      const tools = shouldUseTools ? await this.getAllTools() : {};

      // Build message array from options
      const messages = buildMessagesArray(options);

      const result = streamText({
        model: this.model,
        messages: messages,
        tools,
        maxSteps: options.maxSteps || DEFAULT_MAX_STEPS,
        toolChoice: shouldUseTools ? "auto" : "none",
        maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        abortSignal: timeoutController?.controller.signal,
      });

      const streamResult = {
        stream: (async function* (self: AmazonBedrockProvider) {
          let chunkCount = 0;
          let streamStarted = false;
          let timeoutId: NodeJS.Timeout | null = null;

          try {
            // Create timeout promise for first chunk with proper cleanup
            const timeoutPromise = new Promise<never>((_, reject) => {
              timeoutId = setTimeout(() => {
                if (!streamStarted && chunkCount === 0) {
                  reject(
                    new Error(
                      "❌ Amazon Bedrock Streaming Timeout\n\n" +
                        "Stream failed to produce any content within 5 seconds.\n\n" +
                        "🔧 Common Causes:\n" +
                        "1. Expired AWS credentials - run: aws sts get-caller-identity\n" +
                        "2. Missing Bedrock permissions - need: bedrock:InvokeModelWithResponseStream\n" +
                        "3. Model not available in your region\n" +
                        "4. Network connectivity issues\n\n" +
                        '💡 Try: neurolink generate "test" --provider bedrock\n' +
                        "   (Generate mode provides more detailed error messages)",
                    ),
                  );
                }
              }, 5000);
            });

            // Process stream with timeout handling
            const streamIterator = result.textStream[Symbol.asyncIterator]();
            let timeoutActive = true;

            while (true) {
              let nextResult;

              if (timeoutActive) {
                // Race between next chunk and timeout for first chunk only
                nextResult = await Promise.race([
                  streamIterator.next(),
                  timeoutPromise,
                ]);
              } else {
                // No timeout for subsequent chunks
                nextResult = await streamIterator.next();
              }

              if (nextResult.done) {
                break;
              }

              if (!streamStarted) {
                streamStarted = true;
                timeoutActive = false;
                // Clear the timeout now that we have content
                if (timeoutId) {
                  clearTimeout(timeoutId);
                  timeoutId = null;
                }
              }

              chunkCount++;
              yield { content: nextResult.value };
            }

            // If no chunks received, likely an authentication error
            if (chunkCount === 0) {
              throw new Error(
                "❌ Amazon Bedrock Streaming Error\n\n" +
                  "Stream completed with no content.\n\n" +
                  "🔧 Most Likely Causes:\n" +
                  "1. AWS credentials are expired or invalid\n" +
                  "2. Insufficient Bedrock permissions\n" +
                  "3. Model access not enabled in AWS console\n" +
                  "4. Region mismatch\n\n" +
                  "🔍 Debug Steps:\n" +
                  "1. Check credentials: aws sts get-caller-identity\n" +
                  '2. Test generate mode: neurolink generate "test" --provider bedrock\n' +
                  '3. Verify region: AWS_REGION=us-east-1 neurolink stream "test" --provider bedrock',
              );
            }
          } catch (error) {
            // Clean up timeout on error
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            throw self.handleStreamError
              ? self.handleStreamError(error)
              : error;
          }
        })(this),
        provider: this.providerName,
        model: this.modelName,
      };

      timeoutController?.cleanup();
      return streamResult;
    } catch (error) {
      throw this.handleProviderError(error);
    }
  }

  protected handleStreamError(error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Stream-specific error handling
    if (
      errorMessage.includes("no content") ||
      errorMessage.includes("Streaming Timeout") ||
      errorMessage.includes("Stream failed")
    ) {
      return new Error(errorMessage); // Already formatted in stream logic
    }

    // For other errors, use standard provider error handling
    return this.handleProviderError(error);
  }

  protected handleProviderError(error: unknown): Error {
    if (error instanceof Error && error.name === "TimeoutError") {
      return new TimeoutError(
        `Amazon Bedrock request timed out. Consider increasing timeout or using a lighter model.`,
        this.defaultTimeout,
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("InvalidRequestException")) {
      return new Error(
        `❌ Amazon Bedrock Request Error\n\nThe request was invalid: ${errorMessage}\n\n🔧 Common Solutions:\n1. Check your model ID format\n2. Verify your request parameters\n3. Ensure your AWS account has Bedrock access`,
      );
    }

    if (errorMessage.includes("AccessDeniedException")) {
      return new Error(
        `❌ Amazon Bedrock Access Denied\n\nYour AWS credentials don't have permission to access Bedrock.\n\n🔧 Required Steps:\n1. Ensure your IAM user has bedrock:InvokeModel permission\n2. Check if Bedrock is available in your region\n3. Verify model access is enabled in Bedrock console`,
      );
    }

    if (errorMessage.includes("ValidationException")) {
      return new Error(
        `❌ Amazon Bedrock Validation Error\n\n${errorMessage}\n\n🔧 Check:\n1. Model ID format (should be ARN or model identifier)\n2. Request parameters are within limits\n3. Region configuration is correct`,
      );
    }

    return new Error(
      `❌ Amazon Bedrock Provider Error\n\n${errorMessage || "Unknown error occurred"}\n\n🔧 Troubleshooting:\n1. Check AWS credentials and permissions\n2. Verify model availability\n3. Check network connectivity`,
    );
  }
}

export default AmazonBedrockProvider;
