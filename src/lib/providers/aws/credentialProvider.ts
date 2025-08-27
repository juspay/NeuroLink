/**
 * AWS Credential Provider for NeuroLink
 *
 * Provides 100% compatibility with Bedrock-MCP-Connector authentication patterns
 * by leveraging AWS SDK v3's official defaultProvider credential chain.
 *
 * Supports all 9 AWS credential sources:
 * 1. Environment Variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 2. AWS Credentials File (~/.aws/credentials)
 * 3. AWS Config File (~/.aws/config)
 * 4. IAM Roles (EC2/ECS/Lambda)
 * 5. AWS SSO
 * 6. STS Assume Role
 * 7. Credential Process
 * 8. Container Credentials
 * 9. Instance Metadata Service (IMDS)
 */

import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { fromEnv } from "@aws-sdk/credential-providers";
import type { AwsCredentialIdentity, Provider } from "@aws-sdk/types";
import { logger } from "../../utils/logger.js";
import type { AWSCredentialConfig } from "../../types/providers.js";

/**
 * AWS Credential Provider class that wraps AWS SDK v3's defaultProvider
 * to provide seamless compatibility with Bedrock-MCP-Connector authentication
 */
export class AWSCredentialProvider {
  private credentialProvider: Provider<AwsCredentialIdentity>;
  private config: Required<AWSCredentialConfig>;
  private isInitialized: boolean = false;
  private lastCredentials: AwsCredentialIdentity | null = null;
  private lastRefresh: number = 0;

  constructor(config: AWSCredentialConfig = {}) {
    // Set default configuration values
    this.config = {
      region: config.region || process.env.AWS_REGION || "us-east-1",
      profile: config.profile || process.env.AWS_PROFILE || "default",
      roleArn: config.roleArn || process.env.AWS_ROLE_ARN || "",
      roleSessionName:
        config.roleSessionName || process.env.AWS_ROLE_SESSION_NAME || "",
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      maxAttempts: config.maxAttempts || config.maxRetries || 3,
      endpoint: config.endpoint || "",
      enableDebugLogging: config.enableDebugLogging || false,
    };

    // Check if environment variables are set - if so, prioritize them
    const hasEnvCredentials = !!(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    );

    if (hasEnvCredentials) {
      // Force use of environment variables when they're explicitly set
      this.credentialProvider = fromEnv();

      if (this.config.enableDebugLogging) {
        logger.debug("AWS Credential Provider: Using environment variables", {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + "***",
          hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
          region: this.config.region,
        });
      }
    } else {
      // Use default provider chain when no environment variables
      this.credentialProvider = defaultProvider({
        profile: this.config.profile,
        roleArn: this.config.roleArn || undefined,
        roleSessionName: this.config.roleSessionName || undefined,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries,
      });

      if (this.config.enableDebugLogging) {
        logger.debug("AWS Credential Provider: Using default provider chain", {
          profile: this.config.profile,
          roleArn: this.config.roleArn ? "***" : "none",
          timeout: this.config.timeout,
          maxRetries: this.config.maxRetries,
        });
      }
    }

    if (this.config.enableDebugLogging) {
      logger.debug("AWS Credential Provider initialized", {
        credentialSource: hasEnvCredentials ? "environment" : "default-chain",
        region: this.config.region,
        profile: this.config.profile,
        roleArn: this.config.roleArn ? "***" : "none",
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries,
      });
    }

    this.isInitialized = true;
  }

  /**
   * Get AWS credentials using the default provider chain
   * Implements caching to avoid unnecessary credential resolution calls
   */
  async getCredentials(): Promise<AwsCredentialIdentity> {
    if (this.config.enableDebugLogging) {
      logger.debug("getCredentials() called", {
        isInitialized: this.isInitialized,
        hasLastCredentials: !!this.lastCredentials,
        config: {
          region: this.config.region,
          profile: this.config.profile,
          roleArn: this.config.roleArn ? "***" : "none",
          timeout: this.config.timeout,
          maxRetries: this.config.maxRetries,
        },
        environment: {
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID
            ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + "***"
            : "not set",
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
            ? "***"
            : "not set",
          AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN ? "set" : "not set",
          AWS_REGION: process.env.AWS_REGION || "not set",
          AWS_PROFILE: process.env.AWS_PROFILE || "not set",
        },
      });
    }

    try {
      if (!this.isInitialized) {
        throw new Error("AWSCredentialProvider not initialized");
      }

      // Check if cached credentials are still valid (within 5 minutes)
      const now = Date.now();
      if (this.lastCredentials && now - this.lastRefresh < 300000) {
        // Check if credentials have expiration and are still valid
        if (
          !this.lastCredentials.expiration ||
          this.lastCredentials.expiration > new Date(now + 60000)
        ) {
          if (this.config.enableDebugLogging) {
            logger.debug("Using cached AWS credentials", {
              cacheAge: now - this.lastRefresh,
              hasExpiration: !!this.lastCredentials.expiration,
              expiration: this.lastCredentials.expiration?.toISOString(),
            });
          }
          return this.lastCredentials;
        } else {
          if (this.config.enableDebugLogging) {
            logger.debug("Cached credentials expired, refreshing", {
              cacheAge: now - this.lastRefresh,
              expiration: this.lastCredentials.expiration?.toISOString(),
            });
          }
        }
      }

      if (this.config.enableDebugLogging) {
        logger.debug("Calling AWS SDK credential provider", {
          providerType: "defaultProvider",
          timeout: this.config.timeout,
          maxRetries: this.config.maxRetries,
        });
      }

      // Resolve credentials using AWS SDK default provider chain
      const credentials = await this.credentialProvider();

      if (this.config.enableDebugLogging) {
        logger.debug("AWS SDK credential provider returned", {
          hasAccessKeyId: !!credentials.accessKeyId,
          accessKeyIdPrefix: credentials.accessKeyId
            ? credentials.accessKeyId.substring(0, 8)
            : "none",
          hasSecretAccessKey: !!credentials.secretAccessKey,
          hasSessionToken: !!credentials.sessionToken,
          hasExpiration: !!credentials.expiration,
          expiration: credentials.expiration?.toISOString() || "none",
          credentialType: credentials.accessKeyId?.startsWith("ASIA")
            ? "temporary"
            : "long-term",
        });
      }

      // Cache the credentials
      this.lastCredentials = credentials;
      this.lastRefresh = now;

      if (this.config.enableDebugLogging) {
        logger.debug("AWS credentials resolved and cached successfully", {
          accessKeyId: credentials.accessKeyId.substring(0, 8) + "***",
          hasSessionToken: !!credentials.sessionToken,
          expiration: credentials.expiration?.toISOString() || "none",
          credentialSource: "AWS SDK defaultProvider chain",
        });
      }

      return credentials;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to resolve AWS credentials", {
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : "unknown",
        stack: error instanceof Error ? error.stack : "no stack trace",
        config: this.config,
        environment: {
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "set" : "not set",
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
            ? "set"
            : "not set",
          AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN ? "set" : "not set",
          AWS_REGION: process.env.AWS_REGION || "not set",
          AWS_PROFILE: process.env.AWS_PROFILE || "not set",
        },
      });

      // Provide helpful error messages for common credential issues
      if (errorMessage.includes("No credentials found")) {
        throw new Error(
          "No AWS credentials found. Please configure one of the following:\n" +
            "1. Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY\n" +
            "2. AWS credentials file: ~/.aws/credentials\n" +
            "3. IAM role (if running on EC2/ECS/Lambda)\n" +
            "4. AWS SSO: aws configure sso\n" +
            "Original error: " +
            errorMessage,
        );
      }

      if (errorMessage.includes("Credential is expired")) {
        throw new Error(
          "AWS credentials have expired. Please refresh your credentials:\n" +
            "1. Re-run aws configure\n" +
            "2. Refresh SSO: aws sso login\n" +
            "3. Assume new role if using temporary credentials\n" +
            "Original error: " +
            errorMessage,
        );
      }

      throw new Error(`AWS credential resolution failed: ${errorMessage}`);
    }
  }

  /**
   * Get the raw credential provider for direct use with AWS SDK clients
   * This allows the credential provider to be passed directly to BedrockRuntimeClient
   */
  getCredentialProvider(): Provider<AwsCredentialIdentity> {
    if (!this.isInitialized) {
      throw new Error("AWSCredentialProvider not initialized");
    }
    return this.credentialProvider;
  }

  /**
   * Force refresh of cached credentials
   * Useful when credentials may have been updated externally
   */
  async refreshCredentials(): Promise<AwsCredentialIdentity> {
    this.lastCredentials = null;
    this.lastRefresh = 0;
    return await this.getCredentials();
  }

  /**
   * Check if credentials are currently available without throwing errors
   */
  async isCredentialsAvailable(): Promise<boolean> {
    try {
      await this.getCredentials();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration information for debugging
   */
  getConfig(): Readonly<Required<AWSCredentialConfig>> {
    return { ...this.config };
  }

  /**
   * Clean up resources and clear cached credentials
   */
  dispose(): void {
    this.lastCredentials = null;
    this.lastRefresh = 0;
    this.isInitialized = false;

    if (this.config.enableDebugLogging) {
      logger.debug("AWS Credential Provider disposed");
    }
  }
}
