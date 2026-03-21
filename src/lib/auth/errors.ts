// src/lib/auth/errors.ts — Unified auth error codes (Phase 1 of auth error redesign)

import { createErrorFactory } from "../core/infrastructure/baseError.js";

export const AuthErrorCodes = {
  // Token errors
  INVALID_TOKEN: "AUTH-001",
  EXPIRED_TOKEN: "AUTH-002",
  MISSING_TOKEN: "AUTH-003",
  TOKEN_DECODE_FAILED: "AUTH-004",
  INVALID_SIGNATURE: "AUTH-005",
  // Session errors
  SESSION_NOT_FOUND: "AUTH-010",
  SESSION_EXPIRED: "AUTH-011",
  SESSION_REVOKED: "AUTH-012",
  // Authorization errors
  INSUFFICIENT_PERMISSIONS: "AUTH-020",
  INSUFFICIENT_ROLES: "AUTH-021",
  ACCESS_DENIED: "AUTH-022",
  // User errors
  USER_NOT_FOUND: "AUTH-030",
  USER_DISABLED: "AUTH-031",
  EMAIL_NOT_VERIFIED: "AUTH-032",
  MFA_REQUIRED: "AUTH-033",
  // Provider errors
  PROVIDER_ERROR: "AUTH-040",
  PROVIDER_NOT_FOUND: "AUTH-041",
  PROVIDER_INIT_FAILED: "AUTH-042",
  CONFIGURATION_ERROR: "AUTH-043",
  // Factory/Registry errors
  CREATION_FAILED: "AUTH-050",
  REGISTRATION_FAILED: "AUTH-051",
  DUPLICATE_REGISTRATION: "AUTH-052",
  // Middleware errors
  MIDDLEWARE_ERROR: "AUTH-060",
  RATE_LIMITED: "AUTH-061",
  // JWKS errors
  JWKS_FETCH_FAILED: "AUTH-070",
  JWKS_KEY_NOT_FOUND: "AUTH-071",
} as const;

export const AuthError = createErrorFactory("Auth", AuthErrorCodes);
