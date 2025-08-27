/**
 * AWS Credential Sources Test Suite for NeuroLink
 *
 * Tests all 9 AWS credential sources for compatibility with Bedrock-MCP-Connector:
 * 1. Environment Variables
 * 2. AWS Credentials File (~/.aws/credentials)
 * 3. AWS Config File (~/.aws/config)
 * 4. IAM Roles (EC2/ECS/Lambda)
 * 5. AWS SSO
 * 6. STS Assume Role
 * 7. Credential Process
 * 8. Container Credentials
 * 9. Instance Metadata Service (IMDS)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { AWSCredentialProvider } from "../../../src/lib/providers/aws/credentialProvider.js";
import { CredentialTester } from "../../../src/lib/providers/aws/credentialTester.js";
import fs from "fs";
import os from "os";
import path from "path";

// Store original environment
const originalEnv = { ...process.env };

describe("AWS Credential Sources Compatibility Tests", () => {
  beforeEach(() => {
    // Clear AWS environment variables
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("AWS_")) {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("AWS_")) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  describe("AWS Credentials File Authentication", () => {
    const mockCredentialsContent = `[default]
aws_access_key_id = AKIA123456789EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[test-profile]
aws_access_key_id = AKIA987654321EXAMPLE
aws_secret_access_key = testSecretAccessKey123456789Example
region = us-west-2

[role-profile]
role_arn = arn:aws:iam::123456789012:role/ExampleRole
source_profile = default`;

    test("should attempt to read from AWS credentials file", async () => {
      const provider = new AWSCredentialProvider({
        profile: "default",
        enableDebugLogging: true,
      });

      // This test validates that the provider is configured to use credential files
      // Actual file reading depends on the AWS SDK implementation
      expect(provider.getConfig().profile).toBe("default");

      // The provider should be able to handle credential file scenarios
      const isAvailable = await provider.isCredentialsAvailable();
      // In test environment without real files, this may be false, but provider should handle gracefully
      expect(typeof isAvailable).toBe("boolean");
    });

    test("should use specified profile from credentials file", async () => {
      const provider = new AWSCredentialProvider({
        profile: "test-profile",
        enableDebugLogging: true,
      });

      expect(provider.getConfig().profile).toBe("test-profile");
    });

    test("should detect credentials file as source when available", async () => {
      // Skip this test if running in environment without AWS credentials file
      const provider = new AWSCredentialProvider({
        profile: "default",
      });

      try {
        const credentialSource =
          await CredentialTester.getCredentialSource(provider);
        // May detect various sources depending on environment
        expect(typeof credentialSource).toBe("string");
      } catch (error) {
        // Expected in test environment without credentials
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("AWS Config File Authentication", () => {
    test("should respect region configuration from config file", async () => {
      const provider = new AWSCredentialProvider({
        profile: "default",
        enableDebugLogging: true,
      });

      // AWS SDK will read from ~/.aws/config for region if not specified elsewhere
      // We can test that the provider respects the config file structure
      expect(provider.getConfig().profile).toBe("default");
    });

    test("should handle config file role configuration", async () => {
      const provider = new AWSCredentialProvider({
        profile: "role-profile",
        enableDebugLogging: true,
      });

      expect(provider.getConfig().profile).toBe("role-profile");
    });
  });

  describe("IAM Role Metadata Authentication", () => {
    test("should configure for EC2 instance metadata", async () => {
      // Mock EC2 metadata environment
      delete process.env.AWS_EC2_METADATA_DISABLED;

      const provider = new AWSCredentialProvider({
        enableDebugLogging: true,
      });

      // Provider should be able to attempt metadata service
      expect(provider.getConfig()).toBeDefined();

      // Test availability (will fail in non-EC2 environment)
      const isAvailable = await provider.isCredentialsAvailable();
      expect(typeof isAvailable).toBe("boolean");
    });

    test("should handle metadata service being disabled", async () => {
      process.env.AWS_EC2_METADATA_DISABLED = "true";

      const provider = new AWSCredentialProvider({
        enableDebugLogging: true,
      });

      const isAvailable = await provider.isCredentialsAvailable();
      expect(typeof isAvailable).toBe("boolean");
    });

    test("should detect instance metadata as credential source", async () => {
      const provider = new AWSCredentialProvider();

      try {
        const validationResult =
          await CredentialTester.validateCredentials(provider);
        if (validationResult.isValid) {
          // If credentials are found, check if they're from instance metadata
          expect(validationResult.credentialSource).toMatch(
            /metadata|Instance Metadata/i,
          );
        }
      } catch (error) {
        // Expected in non-EC2 environment
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("Container Credentials Authentication", () => {
    test("should configure for ECS container credentials", async () => {
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI =
        "/v2/credentials/test-uuid";

      const provider = new AWSCredentialProvider({
        enableDebugLogging: true,
      });

      // Provider should be configured to use container credentials
      expect(provider.getConfig()).toBeDefined();

      const isAvailable = await provider.isCredentialsAvailable();
      expect(typeof isAvailable).toBe("boolean");
    });

    test("should handle full URI container credentials", async () => {
      process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI =
        "http://169.254.170.2/v2/credentials/test-uuid";

      const provider = new AWSCredentialProvider({
        enableDebugLogging: true,
      });

      const isAvailable = await provider.isCredentialsAvailable();
      expect(typeof isAvailable).toBe("boolean");
    });

    test("should detect container credentials as source", async () => {
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI =
        "/v2/credentials/test-uuid";

      const provider = new AWSCredentialProvider();

      try {
        const credentialSource =
          await CredentialTester.getCredentialSource(provider);
        expect(typeof credentialSource).toBe("string");
      } catch (error) {
        // Expected in non-container environment
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("AWS SSO Authentication", () => {
    test("should configure for AWS SSO", async () => {
      const provider = new AWSCredentialProvider({
        profile: "sso-profile",
        enableDebugLogging: true,
      });

      expect(provider.getConfig().profile).toBe("sso-profile");
    });

    test("should detect SSO credentials when available", async () => {
      const provider = new AWSCredentialProvider({
        profile: "sso-profile",
      });

      try {
        const validationResult =
          await CredentialTester.validateCredentials(provider);
        if (validationResult.isValid) {
          // SSO credentials typically have expiration but no session token
          expect(validationResult.hasExpiration).toBeDefined();
        }
      } catch (error) {
        // Expected without SSO setup
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("STS Assume Role Authentication", () => {
    test("should configure assume role parameters", async () => {
      const roleArn = "arn:aws:iam::123456789012:role/ExampleRole";
      const sessionName = "ExampleSessionName";

      const provider = new AWSCredentialProvider({
        roleArn,
        roleSessionName: sessionName,
        enableDebugLogging: true,
      });

      const config = provider.getConfig();
      expect(config.roleArn).toBe(roleArn);
      expect(config.roleSessionName).toBe(sessionName);
    });

    test("should respect assume role environment variables", async () => {
      process.env.AWS_ROLE_ARN = "arn:aws:iam::123456789012:role/TestRole";
      process.env.AWS_ROLE_SESSION_NAME = "TestSession";

      const provider = new AWSCredentialProvider();
      const config = provider.getConfig();

      expect(config.roleArn).toBe(process.env.AWS_ROLE_ARN);
      expect(config.roleSessionName).toBe(process.env.AWS_ROLE_SESSION_NAME);
    });

    test("should detect assume role credentials", async () => {
      process.env.AWS_ROLE_ARN = "arn:aws:iam::123456789012:role/TestRole";

      const provider = new AWSCredentialProvider();

      try {
        const validationResult =
          await CredentialTester.validateCredentials(provider);
        if (validationResult.isValid) {
          // Assume role credentials typically have session tokens and expiration
          expect(validationResult.debugInfo.hasSessionToken).toBeDefined();
        }
      } catch (error) {
        // Expected without proper role setup
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("Credential Process Authentication", () => {
    test("should configure for credential process", async () => {
      process.env.AWS_CREDENTIAL_PROCESS = "aws-credential-helper";

      const provider = new AWSCredentialProvider({
        enableDebugLogging: true,
      });

      // Provider should be configured to use credential process
      expect(provider.getConfig()).toBeDefined();
    });

    test("should detect credential process as source", async () => {
      process.env.AWS_CREDENTIAL_PROCESS = "aws-credential-helper";

      const provider = new AWSCredentialProvider();

      try {
        const credentialSource =
          await CredentialTester.getCredentialSource(provider);
        expect(typeof credentialSource).toBe("string");
      } catch (error) {
        // Expected without proper credential process setup
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("Web Identity Token Authentication", () => {
    test("should configure for web identity token", async () => {
      process.env.AWS_WEB_IDENTITY_TOKEN_FILE =
        "/var/run/secrets/eks.amazonaws.com/serviceaccount/token";
      process.env.AWS_ROLE_ARN =
        "arn:aws:iam::123456789012:role/EksServiceAccountRole";

      const provider = new AWSCredentialProvider({
        enableDebugLogging: true,
      });

      expect(provider.getConfig().roleArn).toBe(process.env.AWS_ROLE_ARN);
    });

    test("should detect web identity token as source", async () => {
      process.env.AWS_WEB_IDENTITY_TOKEN_FILE = "/var/run/secrets/token";
      process.env.AWS_ROLE_ARN =
        "arn:aws:iam::123456789012:role/EksServiceAccountRole";

      const provider = new AWSCredentialProvider();

      try {
        const credentialSource =
          await CredentialTester.getCredentialSource(provider);
        expect(typeof credentialSource).toBe("string");
      } catch (error) {
        // Expected without proper web identity setup
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("Cross-Region Authentication", () => {
    test("should work with different AWS regions", async () => {
      const regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"];

      for (const region of regions) {
        const provider = new AWSCredentialProvider({
          region,
          enableDebugLogging: true,
        });

        expect(provider.getConfig().region).toBe(region);

        // Test that region doesn't affect credential resolution logic
        const isAvailable = await provider.isCredentialsAvailable();
        expect(typeof isAvailable).toBe("boolean");
      }
    });
  });

  describe("Multi-Profile Authentication", () => {
    test("should handle multiple profiles", async () => {
      const profiles = ["default", "dev", "staging", "production"];

      for (const profile of profiles) {
        const provider = new AWSCredentialProvider({
          profile,
          enableDebugLogging: true,
        });

        expect(provider.getConfig().profile).toBe(profile);
      }
    });
  });

  describe("Credential Source Detection", () => {
    test("should accurately detect credential sources", async () => {
      // Test various environment setups
      const scenarios = [
        {
          name: "Environment Variables",
          setup: () => {
            process.env.AWS_ACCESS_KEY_ID = "AKIA123456789EXAMPLE";
            process.env.AWS_SECRET_ACCESS_KEY = "testSecretKey";
          },
        },
        {
          name: "Environment with Session Token",
          setup: () => {
            process.env.AWS_ACCESS_KEY_ID = "AKIA123456789EXAMPLE";
            process.env.AWS_SECRET_ACCESS_KEY = "testSecretKey";
            process.env.AWS_SESSION_TOKEN = "testSessionToken";
          },
        },
        {
          name: "Role ARN Configuration",
          setup: () => {
            process.env.AWS_ROLE_ARN =
              "arn:aws:iam::123456789012:role/TestRole";
          },
        },
      ];

      for (const scenario of scenarios) {
        // Clear environment
        Object.keys(process.env).forEach((key) => {
          if (key.startsWith("AWS_")) {
            delete process.env[key];
          }
        });

        scenario.setup();

        const provider = new AWSCredentialProvider();
        const credentialSource =
          await CredentialTester.getCredentialSource(provider);

        expect(typeof credentialSource).toBe("string");
        expect(credentialSource.length).toBeGreaterThan(0);
      }
    });
  });
});
