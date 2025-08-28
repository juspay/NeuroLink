/**
 * AWS Credential Testing Utilities for NeuroLink
 *
 * Provides comprehensive validation and debugging capabilities for AWS credentials
 * to ensure compatibility with Bedrock-MCP-Connector authentication patterns.
 */

import { AWSCredentialProvider } from "./credentialProvider.js";
import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { logger } from "../../utils/logger.js";
import type {
  AWSCredentialConfig,
  CredentialValidationResult,
  ServiceConnectivityResult,
} from "../../types/providers.js";

/**
 * Interface for AWS error objects to safely extract error information
 * Enhanced to support multiple AWS SDK error formats and patterns
 */
interface AWSError {
  // Error codes (various formats across SDK versions)
  Code?: string;
  code?: string;
  errorCode?: string;
  ErrorCode?: string;

  // Error names and types
  name?: string;
  errorType?: string;
  ErrorType?: string;

  // Error messages (various formats)
  message?: string;
  Message?: string;
  errorMessage?: string;

  // Metadata (various patterns)
  $metadata?: {
    httpStatusCode?: number;
    statusCode?: number;
    status?: number;
    requestId?: string;
    RequestId?: string;
    request_id?: string;
    "x-amzn-requestid"?: string;
  };
  metadata?: unknown;
  $response?: unknown;

  // Nested/wrapped errors (AWS SDK v3 patterns)
  cause?: unknown;
  $fault?: unknown;

  // Constructor for fallback name extraction
  constructor?: {
    name?: string;
  };
}

/**
 * Comprehensive AWS error information extraction result
 */
interface AWSErrorInfo {
  code?: string;
  name?: string;
  message?: string;
  statusCode?: number;
  requestId?: string;
}

/**
 * Helper function to safely extract comprehensive error information from AWS errors
 * This centralizes error extraction and captures AWS SDK v3 name, statusCode, and requestId
 * Enhanced to handle multiple AWS SDK error formats and edge cases
 */
function extractAwsErrorInfo(error: unknown): AWSErrorInfo {
  const result: AWSErrorInfo = {};

  if (typeof error === "object" && error !== null) {
    const awsError = error as AWSError; // Use AWSError interface to handle various error shapes

    // Extract error code with comprehensive fallbacks
    // AWS SDK v2: error.code, error.Code
    // AWS SDK v3: error.name, error.Code, error.code
    // Some services: error.errorCode, error.ErrorCode
    result.code =
      awsError.Code ||
      awsError.code ||
      awsError.errorCode ||
      awsError.ErrorCode ||
      awsError.name; // AWS SDK v3 often uses name as error code

    // Extract error name with fallbacks
    // AWS SDK v3: error.name is primary
    // Some errors: error.errorType, error.ErrorType
    // Fallback to constructor name
    result.name =
      awsError.name ||
      awsError.errorType ||
      awsError.ErrorType ||
      awsError.constructor?.name;

    // Extract error message with fallbacks
    // Standard: error.message
    // Some services: error.Message, error.errorMessage
    result.message =
      awsError.message ||
      awsError.Message ||
      awsError.errorMessage ||
      String(error); // Last resort stringification

    // Extract metadata with multiple patterns
    // AWS SDK v3: error.$metadata
    // Some services: error.metadata, error.$response
    const metadata =
      awsError.$metadata || awsError.metadata || awsError.$response;
    if (metadata && typeof metadata === "object") {
      const metadataObj = metadata as Record<string, unknown>;
      result.statusCode =
        (metadataObj.httpStatusCode as number) ||
        (metadataObj.statusCode as number) ||
        (metadataObj.status as number);
      result.requestId =
        (metadataObj.requestId as string) ||
        (metadataObj.RequestId as string) ||
        (metadataObj.request_id as string) ||
        (metadataObj["x-amzn-requestid"] as string); // Common response header
    }

    // Handle wrapped errors (common in AWS SDK v3)
    // Sometimes the actual error is nested in error.cause or error.$fault
    if (!result.code && (awsError.cause || awsError.$fault)) {
      const nestedError = awsError.cause || awsError.$fault;
      const nestedInfo = extractAwsErrorInfo(nestedError);
      // Merge nested error info, preferring current level
      result.code = result.code || nestedInfo.code;
      result.name = result.name || nestedInfo.name;
      result.message = result.message || nestedInfo.message;
      result.statusCode = result.statusCode || nestedInfo.statusCode;
      result.requestId = result.requestId || nestedInfo.requestId;
    }
  }

  // Handle primitive error types (strings, etc.)
  if (!result.message && error) {
    result.message = String(error);
  }

  return result;
}

/**
 * Credential testing and validation utility class
 */
export class CredentialTester {
  /**
   * Validate AWS credentials and detect their source
   */
  static async validateCredentials(
    provider: AWSCredentialProvider,
  ): Promise<CredentialValidationResult> {
    const startTime = Date.now();

    try {
      // Get credentials from provider
      const credentials = await provider.getCredentials();
      const config = provider.getConfig();

      // Detect credential source based on available information
      const credentialSource = await this.detectCredentialSource(
        credentials,
        config,
      );

      const result: CredentialValidationResult = {
        isValid: true,
        credentialSource,
        region: config.region,
        hasExpiration: !!credentials.expiration,
        expirationTime: credentials.expiration,
        debugInfo: {
          accessKeyId: credentials.accessKeyId.substring(0, 8) + "***",
          hasSessionToken: !!credentials.sessionToken,
          providerConfig: config,
        },
      };

      logger.debug("Credential validation successful", {
        source: credentialSource,
        region: config.region,
        validationTimeMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Credential validation failed", {
        error: errorMessage,
        validationTimeMs: Date.now() - startTime,
      });

      return {
        isValid: false,
        credentialSource: "unknown",
        region: provider.getConfig().region,
        hasExpiration: false,
        error: errorMessage,
        debugInfo: {
          accessKeyId: "unavailable",
          hasSessionToken: false,
          providerConfig: provider.getConfig(),
        },
      };
    }
  }

  /**
   * Test AWS Bedrock service connectivity
   */
  static async testBedrockConnectivity(
    provider: AWSCredentialProvider,
    region?: string,
  ): Promise<ServiceConnectivityResult> {
    const startTime = Date.now();
    const testRegion = region || provider.getConfig().region;

    logger.debug("Starting Bedrock connectivity test", {
      region: testRegion,
      providerConfig: provider.getConfig(),
    });

    try {
      // First, get credentials to see what we're working with
      const credentials = await provider.getCredentials();
      logger.debug("Got credentials for Bedrock test", {
        accessKeyId: credentials.accessKeyId.substring(0, 8) + "***",
        hasSessionToken: !!credentials.sessionToken,
        hasExpiration: !!credentials.expiration,
        expiration: credentials.expiration?.toISOString(),
        credentialType: credentials.accessKeyId?.startsWith("ASIA")
          ? "temporary"
          : "long-term",
      });

      // Create Bedrock client with credential provider (use BedrockClient for listing models)
      logger.debug("Creating BedrockClient", {
        region: testRegion,
        credentialProviderType: typeof provider.getCredentialProvider(),
      });

      const bedrockClient = new BedrockClient({
        region: testRegion,
        credentials: provider.getCredentialProvider(),
        maxAttempts: provider.getConfig().maxAttempts || 3,
      });

      logger.debug(
        "BedrockClient created, sending ListFoundationModelsCommand",
      );

      // Test connectivity by listing foundation models
      const command = new ListFoundationModelsCommand({});
      const ctrl = new AbortController();
      const timeoutId = setTimeout(
        () => ctrl.abort(),
        provider.getConfig().timeout || 15000, // Default 15 second timeout
      );
      let response;
      try {
        response = await bedrockClient.send(command, {
          abortSignal: ctrl.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      logger.debug("ListFoundationModelsCommand response received", {
        hasModelSummaries: !!response.modelSummaries,
        modelCount: response.modelSummaries?.length || 0,
        responseMetadata: response.$metadata,
      });

      const models = response.modelSummaries || [];
      const responseTime = Date.now() - startTime;

      const result: ServiceConnectivityResult = {
        bedrockAccessible: true,
        availableModels: models.length,
        responseTimeMs: responseTime,
        sampleModels: models
          .slice(0, 5)
          .map((model: { modelId?: string }) => model.modelId || "unknown"),
      };

      logger.debug("Bedrock connectivity test successful", {
        region: testRegion,
        modelsFound: models.length,
        responseTimeMs: responseTime,
        sampleModels: result.sampleModels,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const responseTime = Date.now() - startTime;

      const { code, statusCode, requestId } = extractAwsErrorInfo(error);
      logger.error("Bedrock connectivity test failed", {
        region: testRegion,
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : "unknown",
        errorCode: code,
        statusCode,
        requestId,
        stack: error instanceof Error ? error.stack : "no stack trace",
        responseTimeMs: responseTime,
      });

      return {
        bedrockAccessible: false,
        availableModels: 0,
        responseTimeMs: responseTime,
        error: errorMessage,
        sampleModels: [],
      };
    }
  }

  /**
   * Perform comprehensive credential and service testing
   */
  static async runComprehensiveTest(
    provider: AWSCredentialProvider,
    testRegions: string[] = ["us-east-1", "us-west-2"],
  ): Promise<{
    credentialValidation: CredentialValidationResult;
    connectivityTests: Array<{
      region: string;
      result: ServiceConnectivityResult;
    }>;
    overallStatus: "success" | "partial" | "failed";
    summary: string;
  }> {
    logger.debug("Starting comprehensive AWS credential and connectivity test");

    // Test credential validation
    const credentialValidation = await this.validateCredentials(provider);

    // Test connectivity across multiple regions (in parallel)
    const connectivityTests = await Promise.all(
      testRegions.map(async (region) => {
        try {
          const result = await this.testBedrockConnectivity(provider, region);
          return { region, result };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            region,
            result: {
              bedrockAccessible: false,
              availableModels: 0,
              responseTimeMs: 0,
              error: errorMessage,
              sampleModels: [],
            },
          };
        }
      }),
    );

    // Determine overall status
    let overallStatus: "success" | "partial" | "failed";
    let summary: string;

    if (!credentialValidation.isValid) {
      overallStatus = "failed";
      summary = `Credential validation failed: ${credentialValidation.error}`;
    } else {
      const successfulConnections = connectivityTests.filter(
        (test) => test.result.bedrockAccessible,
      ).length;

      if (successfulConnections === testRegions.length) {
        overallStatus = "success";
        summary = `All tests passed. Credentials valid, Bedrock accessible in ${successfulConnections}/${testRegions.length} regions.`;
      } else if (successfulConnections > 0) {
        overallStatus = "partial";
        summary = `Partial success. Credentials valid, Bedrock accessible in ${successfulConnections}/${testRegions.length} regions.`;
      } else {
        overallStatus = "failed";
        summary = `Credentials valid but Bedrock inaccessible in all tested regions.`;
      }
    }

    logger.info("Comprehensive test completed", {
      overallStatus,
      credentialSource: credentialValidation.credentialSource,
      successfulConnections: connectivityTests.filter(
        (test) => test.result.bedrockAccessible,
      ).length,
      totalRegionsTested: testRegions.length,
    });

    return {
      credentialValidation,
      connectivityTests,
      overallStatus,
      summary,
    };
  }

  /**
   * Detect the source of AWS credentials based on credential properties and environment
   */
  private static async detectCredentialSource(
    credentials: AwsCredentialIdentity,
    config: Readonly<Required<AWSCredentialConfig>>,
  ): Promise<string> {
    // Check for environment variables (static creds)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return credentials.sessionToken
        ? "Environment Variables (with session token)"
        : "Environment Variables";
    }

    // Explicit env‐based sources first
    if (process.env.AWS_WEB_IDENTITY_TOKEN_FILE) {
      return "Web Identity Token";
    }
    if (process.env.AWS_CREDENTIAL_PROCESS) {
      return "Credential Process";
    }

    // Check for role‐based credentials (temporary credentials with session token)
    if (credentials.sessionToken && credentials.expiration) {
      // Prefer explicit hints first
      if (config.roleArn) {
        return "STS Assume Role";
      }

      // Enhanced container detection
      if (
        process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
        process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI
      ) {
        // Detect specific container environments
        if (process.env.AWS_EXECUTION_ENV === "AWS_ECS_FARGATE") {
          return "Container Credentials (ECS Fargate)";
        }
        if (process.env.AWS_EXECUTION_ENV === "AWS_ECS_EC2") {
          return "Container Credentials (ECS)";
        }
        return "Container Credentials (ECS)";
      }

      // Enhanced Lambda detection
      if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
        return "Lambda Execution Role";
      }

      // Enhanced EC2 detection
      if (process.env.AWS_EXECUTION_ENV?.includes("EC2")) {
        return "Instance Metadata (EC2)";
      }

      // Enhanced EKS detection
      if (process.env.KUBERNETES_SERVICE_HOST) {
        return "Service Account (EKS)";
      }

      return "Temporary Credentials (IAM Role)";
    }

    // SSO (env‐configured)
    if (process.env.AWS_SSO_START_URL || process.env.AWS_SSO_REGION) {
      return "AWS SSO";
    }

    // Check for profile‐based credentials
    if (config.profile !== "default") {
      return `AWS Profile (${config.profile})`;
    }
    if (process.env.AWS_PROFILE) {
      return `AWS Profile (${process.env.AWS_PROFILE})`;
    }

    // Default fallback
    return "AWS Credentials File";
  }

  /**
   * Get credential source name for debugging
   */
  static async getCredentialSource(
    provider: AWSCredentialProvider,
  ): Promise<string> {
    try {
      const credentials = await provider.getCredentials();
      const config = provider.getConfig();
      return await this.detectCredentialSource(credentials, config);
    } catch {
      return "Unable to determine credential source";
    }
  }

  /**
   * Test credential refresh functionality
   */
  static async testCredentialRefresh(provider: AWSCredentialProvider): Promise<{
    refreshSuccessful: boolean;
    refreshTimeMs: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      await provider.refreshCredentials();
      const refreshTime = Date.now() - startTime;

      logger.debug("Credential refresh test successful", {
        refreshTimeMs: refreshTime,
      });

      return {
        refreshSuccessful: true,
        refreshTimeMs: refreshTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const refreshTime = Date.now() - startTime;

      logger.error("Credential refresh test failed", {
        error: errorMessage,
        refreshTimeMs: refreshTime,
      });

      return {
        refreshSuccessful: false,
        refreshTimeMs: refreshTime,
        error: errorMessage,
      };
    }
  }
}
