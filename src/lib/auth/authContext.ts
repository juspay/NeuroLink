// src/lib/auth/authContext.ts

import type {
  AuthUser,
  AuthSession,
  AuthenticatedContext,
  AuthProviderType,
  AuthRequestContext,
} from "../types/index.js";
import { AsyncLocalStorage } from "async_hooks";
import { AuthError } from "./errors.js";

/**
 * Async local storage for auth context
 *
 * Enables access to authentication context throughout the request lifecycle
 * without explicitly passing it through every function call.
 */
const authContextStorage = new AsyncLocalStorage<AuthenticatedContext>();

/**
 * Run a function with authentication context
 *
 * Sets up async local storage so getAuthContext() can be called
 * from anywhere within the callback's execution.
 *
 * @param context - The authenticated context
 * @param callback - Function to run with context available
 * @returns Result of the callback
 *
 * @example
 * ```typescript
 * await runWithAuthContext(authContext, async () => {
 *   // Inside here, getAuthContext() returns the context
 *   const user = getCurrentUser();
 *   await processRequest();
 * });
 * ```
 */
export function runWithAuthContext<T>(
  context: AuthenticatedContext,
  callback: () => T | Promise<T>,
): T | Promise<T> {
  return authContextStorage.run(context, callback);
}

/**
 * Get the current authentication context
 *
 * Returns the authenticated context for the current request,
 * or undefined if no context is set.
 *
 * @returns Current auth context or undefined
 *
 * @example
 * ```typescript
 * const context = getAuthContext();
 * if (context) {
 *   console.log("Current user:", context.user.email);
 * }
 * ```
 */
export function getAuthContext(): AuthenticatedContext | undefined {
  return authContextStorage.getStore() ?? globalAuthContext.get();
}

/**
 * Get the current authenticated user
 *
 * Convenience function to get just the user from context.
 *
 * @returns Current user or undefined
 *
 * @example
 * ```typescript
 * const user = getCurrentUser();
 * if (user) {
 *   console.log("Hello,", user.name);
 * }
 * ```
 */
export function getCurrentUser(): AuthUser | undefined {
  return (authContextStorage.getStore() ?? globalAuthContext.get())?.user;
}

/**
 * Get the current session
 *
 * Convenience function to get just the session from context.
 *
 * @returns Current session or undefined
 */
export function getCurrentSession(): AuthSession | undefined {
  return (authContextStorage.getStore() ?? globalAuthContext.get())?.session;
}

/**
 * Check if the current request is authenticated
 *
 * @returns True if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return (
    authContextStorage.getStore() !== undefined ||
    globalAuthContext.isAuthenticated()
  );
}

/**
 * Require authentication
 *
 * Throws if no auth context is available.
 *
 * @returns The authenticated context
 * @throws Error if not authenticated
 *
 * @example
 * ```typescript
 * const context = requireAuth();
 * // Safe to use context.user here
 * ```
 */
export function requireAuth(): AuthenticatedContext {
  const context = getAuthContext();
  if (!context) {
    throw AuthError.create("MISSING_TOKEN", "Authentication required");
  }
  return context;
}

/**
 * Require a specific user
 *
 * Throws if no auth context or user doesn't match.
 *
 * @param userId - Expected user ID
 * @returns The authenticated context
 * @throws Error if not authenticated or wrong user
 */
export function requireUser(userId: string): AuthenticatedContext {
  const context = requireAuth();
  if (context.user.id !== userId) {
    throw AuthError.create("ACCESS_DENIED", "User mismatch");
  }
  return context;
}

/**
 * Check if current user has a permission
 *
 * @param permission - Permission to check
 * @returns True if user has permission
 */
export function hasPermission(permission: string): boolean {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }

  // Check direct permission
  if (user.permissions.includes(permission)) {
    return true;
  }

  // Check wildcard
  if (user.permissions.includes("*")) {
    return true;
  }

  // Check permission hierarchy
  const parts = permission.split(":");
  for (let i = parts.length - 1; i > 0; i--) {
    const wildcardPerm = [...parts.slice(0, i), "*"].join(":");
    if (user.permissions.includes(wildcardPerm)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if current user has a role
 *
 * @param role - Role to check
 * @returns True if user has role
 */
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.roles.includes(role) ?? false;
}

/**
 * Check if current user has any of the roles
 *
 * @param roles - Roles to check (any of)
 * @returns True if user has at least one role
 */
export function hasAnyRole(roles: string[]): boolean {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  return roles.some((role) => user.roles.includes(role));
}

/**
 * Check if current user has all permissions
 *
 * @param permissions - Permissions to check (all of)
 * @returns True if user has all permissions
 */
export function hasAllPermissions(permissions: string[]): boolean {
  return permissions.every((perm) => hasPermission(perm));
}

/**
 * Require a permission
 *
 * Throws if user doesn't have the permission.
 *
 * @param permission - Required permission
 * @throws Error if user lacks permission
 *
 * @example
 * ```typescript
 * requirePermission("admin:write");
 * // Safe to proceed with admin write operation
 * ```
 */
export function requirePermission(permission: string): void {
  if (!hasPermission(permission)) {
    throw AuthError.create(
      "INSUFFICIENT_PERMISSIONS",
      `Permission denied: ${permission}`,
    );
  }
}

/**
 * Require a role
 *
 * Throws if user doesn't have the role.
 *
 * @param role - Required role
 * @throws Error if user lacks role
 */
export function requireRole(role: string): void {
  if (!hasRole(role)) {
    throw AuthError.create("INSUFFICIENT_ROLES", `Role required: ${role}`);
  }
}

/**
 * Create an authenticated context
 *
 * Helper to build an AuthenticatedContext object.
 *
 * @param user - The authenticated user
 * @param session - The user's session
 * @param request - The original request context
 * @param provider - The auth provider type
 * @returns Complete authenticated context
 */
export function createAuthenticatedContext(
  user: AuthUser,
  session: AuthSession,
  request: AuthRequestContext,
  provider: AuthProviderType,
): AuthenticatedContext {
  return {
    ...request,
    user,
    session,
    request,
    authenticatedAt: new Date(),
    provider,
  };
}

/**
 * Context holder for non-async-local-storage environments
 *
 * Use this when async local storage is not available.
 */
export class AuthContextHolder {
  private context: AuthenticatedContext | undefined;

  /**
   * Set the auth context
   */
  set(context: AuthenticatedContext): void {
    this.context = context;
  }

  /**
   * Get the auth context
   */
  get(): AuthenticatedContext | undefined {
    return this.context;
  }

  /**
   * Clear the auth context
   */
  clear(): void {
    this.context = undefined;
  }

  /**
   * Get the current user
   */
  getUser(): AuthUser | undefined {
    return this.context?.user;
  }

  /**
   * Get the current session
   */
  getSession(): AuthSession | undefined {
    return this.context?.session;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.context !== undefined;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    const user = this.context?.user;
    if (!user) {
      return false;
    }

    if (
      user.permissions.includes(permission) ||
      user.permissions.includes("*")
    ) {
      return true;
    }

    // Check hierarchy
    const parts = permission.split(":");
    for (let i = parts.length - 1; i > 0; i--) {
      const wildcardPerm = [...parts.slice(0, i), "*"].join(":");
      if (user.permissions.includes(wildcardPerm)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    return this.context?.user.roles.includes(role) ?? false;
  }
}

// Internal: global context holder for non-async environments.
// Exported for use by neurolink.ts; not part of the public API contract.
export const globalAuthContext = new AuthContextHolder();
