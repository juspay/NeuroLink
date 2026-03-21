/**
 * Bridge between auth providers and NeuroLink's server middleware.
 * Converts an auth provider's authenticateToken() into the validate
 * callback expected by the existing createAuthMiddleware.
 */

import type { MastraAuthProvider } from "../types/authTypes.js";

/**
 * Create a validate function for server auth middleware from an auth provider.
 */
export function createAuthValidatorFromProvider(
  provider: MastraAuthProvider,
): (
  token: string,
  ctx: unknown,
) => Promise<{ id: string; email?: string; roles?: string[] } | null> {
  return async (token: string) => {
    const result = await provider.authenticateToken(token);
    if (!result.valid || !result.user) {
      return null;
    }
    return {
      id: result.user.id,
      email: result.user.email,
      roles: result.user.roles,
    };
  };
}
