/**
 * AuthProviderRegistry - Static one-shot registry for authentication providers
 *
 * Matches the ProviderRegistry pattern: static class with a single
 * `registerAllProviders()` entry point that registers all 11 auth
 * providers with AuthProviderFactory using dynamic imports.
 */

import { logger } from "../utils/logger.js";
import { AuthProviderFactory } from "./AuthProviderFactory.js";
import type {
  Auth0Config,
  AuthProviderConfig,
  BaseAuthProviderConfig,
  BetterAuthConfig,
  ClerkConfig,
  CustomAuthConfig,
  FirebaseConfig,
  JWTConfig,
  OAuth2Config,
  SupabaseConfig,
  WorkOSConfig,
} from "../types/index.js";

/**
 * Narrow `AuthProviderConfig` to a specific provider variant.
 *
 * Each factory lambda calls this to assert the config is the expected
 * variant — safe because the factory is only ever invoked with a config
 * whose `type` matches the registered provider key.
 */
function narrowConfig<T>(
  config: AuthProviderConfig,
): BaseAuthProviderConfig & T {
  return config as BaseAuthProviderConfig & T;
}

/**
 * AuthProviderRegistry - registers all auth providers with the factory
 *
 * Call `AuthProviderRegistry.registerAllProviders()` once during
 * application startup. The method is idempotent and concurrency-safe.
 */
export class AuthProviderRegistry {
  private static registered = false;
  private static registrationPromise: Promise<void> | null = null;

  /**
   * Register all auth providers with the factory
   */
  static async registerAllProviders(): Promise<void> {
    if (AuthProviderRegistry.registered) {
      return;
    }
    if (AuthProviderRegistry.registrationPromise) {
      return AuthProviderRegistry.registrationPromise;
    }

    AuthProviderRegistry.registrationPromise =
      AuthProviderRegistry._doRegister();
    try {
      await AuthProviderRegistry.registrationPromise;
      AuthProviderRegistry.registered = true;
    } catch (error) {
      AuthProviderRegistry.registrationPromise = null;
      throw error;
    }
  }

  /**
   * Internal registration implementation
   */
  private static async _doRegister(): Promise<void> {
    // Auth0 Provider
    AuthProviderFactory.registerProvider(
      "auth0",
      async (config: AuthProviderConfig) => {
        const { Auth0Provider } = await import("./providers/auth0.js");
        return new Auth0Provider(narrowConfig<Auth0Config>(config));
      },
      ["auth0-jwt", "auth0-oauth"],
      {
        type: "auth0",
        name: "Auth0",
        description: "Auth0 identity platform integration",
        documentation: "https://auth0.com/docs",
        aliases: ["auth0-jwt", "auth0-oauth"],
      },
    );

    // Clerk Provider
    AuthProviderFactory.registerProvider(
      "clerk",
      async (config: AuthProviderConfig) => {
        const { ClerkProvider } = await import("./providers/clerk.js");
        return new ClerkProvider(narrowConfig<ClerkConfig>(config));
      },
      ["clerk-jwt"],
      {
        type: "clerk",
        name: "Clerk",
        description: "Clerk authentication platform integration",
        documentation: "https://clerk.com/docs",
        aliases: ["clerk-jwt"],
      },
    );

    // Firebase Provider
    AuthProviderFactory.registerProvider(
      "firebase",
      async (config: AuthProviderConfig) => {
        const { FirebaseAuthProvider } =
          await import("./providers/firebase.js");
        return new FirebaseAuthProvider(narrowConfig<FirebaseConfig>(config));
      },
      ["firebase-auth", "google-firebase"],
      {
        type: "firebase",
        name: "Firebase",
        description: "Firebase Authentication integration",
        documentation: "https://firebase.google.com/docs/auth",
        aliases: ["firebase-auth", "google-firebase"],
      },
    );

    // Supabase Provider
    AuthProviderFactory.registerProvider(
      "supabase",
      async (config: AuthProviderConfig) => {
        const { SupabaseAuthProvider } =
          await import("./providers/supabase.js");
        return new SupabaseAuthProvider(narrowConfig<SupabaseConfig>(config));
      },
      ["supabase-auth"],
      {
        type: "supabase",
        name: "Supabase",
        description: "Supabase Auth integration",
        documentation: "https://supabase.com/docs/guides/auth",
        aliases: ["supabase-auth"],
      },
    );

    // AWS Cognito Provider
    AuthProviderFactory.registerProvider(
      "cognito",
      async (config: AuthProviderConfig) => {
        const { CognitoProvider } =
          await import("./providers/CognitoProvider.js");
        return new CognitoProvider(config);
      },
      ["aws-cognito", "amazon-cognito"],
      {
        type: "cognito",
        name: "AWS Cognito",
        description: "Amazon Cognito User Pools integration",
        documentation: "https://docs.aws.amazon.com/cognito",
        aliases: ["aws-cognito", "amazon-cognito"],
      },
    );

    // Keycloak Provider
    AuthProviderFactory.registerProvider(
      "keycloak",
      async (config: AuthProviderConfig) => {
        const { KeycloakProvider } =
          await import("./providers/KeycloakProvider.js");
        return new KeycloakProvider(config);
      },
      ["keycloak-oidc"],
      {
        type: "keycloak",
        name: "Keycloak",
        description: "Keycloak OpenID Connect integration",
        documentation: "https://www.keycloak.org/documentation",
        aliases: ["keycloak-oidc"],
      },
    );

    // Better Auth Provider
    AuthProviderFactory.registerProvider(
      "better-auth",
      async (config: AuthProviderConfig) => {
        const { BetterAuthProvider } =
          await import("./providers/betterAuth.js");
        return new BetterAuthProvider(narrowConfig<BetterAuthConfig>(config));
      },
      ["betterauth", "better_auth"],
      {
        type: "better-auth",
        name: "Better Auth",
        description: "Self-hosted open-source authentication solution",
        documentation: "https://better-auth.com/docs",
        aliases: ["betterauth", "better_auth"],
      },
    );

    // WorkOS Provider
    AuthProviderFactory.registerProvider(
      "workos",
      async (config: AuthProviderConfig) => {
        const { WorkOSProvider } = await import("./providers/workos.js");
        return new WorkOSProvider(narrowConfig<WorkOSConfig>(config));
      },
      ["workos-sso", "work-os"],
      {
        type: "workos",
        name: "WorkOS",
        description: "Enterprise SSO and user management",
        documentation: "https://workos.com/docs",
        aliases: ["workos-sso", "work-os"],
      },
    );

    // OAuth2 Provider
    AuthProviderFactory.registerProvider(
      "oauth2",
      async (config: AuthProviderConfig) => {
        const { OAuth2Provider } = await import("./providers/oauth2.js");
        return new OAuth2Provider(narrowConfig<OAuth2Config>(config));
      },
      ["oauth", "oidc", "openid-connect"],
      {
        type: "oauth2",
        name: "OAuth2",
        description:
          "Generic OAuth2/OIDC provider with JWKS and userinfo support",
        documentation: "https://oauth.net/2/",
        aliases: ["oauth", "oidc", "openid-connect"],
      },
    );

    // JWT Provider
    AuthProviderFactory.registerProvider(
      "jwt",
      async (config: AuthProviderConfig) => {
        const { JWTProvider } = await import("./providers/jwt.js");
        return new JWTProvider(narrowConfig<JWTConfig>(config));
      },
      ["jwt-auth", "jwt-token"],
      {
        type: "jwt",
        name: "JWT",
        description:
          "Generic JWT token validation with symmetric/asymmetric keys",
        documentation: "https://jwt.io/",
        aliases: ["jwt-auth", "jwt-token"],
      },
    );

    // Custom Provider
    AuthProviderFactory.registerProvider(
      "custom",
      async (config: AuthProviderConfig) => {
        const { CustomAuthProvider } = await import("./providers/custom.js");
        return new CustomAuthProvider(narrowConfig<CustomAuthConfig>(config));
      },
      ["custom-auth"],
      {
        type: "custom",
        name: "Custom",
        description:
          "Custom authentication with user-provided validation logic",
        aliases: ["custom-auth"],
      },
    );

    logger.debug("All auth providers registered");
  }

  /**
   * Check if providers are registered
   */
  static isRegistered(): boolean {
    return AuthProviderRegistry.registered;
  }

  /**
   * Clear registrations (for testing)
   */
  static clearRegistrations(): void {
    AuthProviderRegistry.registered = false;
    AuthProviderRegistry.registrationPromise = null;
    AuthProviderFactory.clearRegistrations();
  }
}
