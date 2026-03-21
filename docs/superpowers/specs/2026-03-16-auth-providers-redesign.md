# Auth Providers Redesign — Design Spec

## Problem

The current auth providers feature (~18K lines) is disconnected infrastructure. It has 11 provider implementations, a factory/registry, middleware, sessions, and RBAC — but none of it connects to NeuroLink's actual server/generate/stream/tools/memory pipeline. Tests don't pass. The consumer has no way to use it.

## Goal

Make auth useful by connecting it to the AI pipeline. Auth exists for server mode — protecting endpoints and flowing user identity into generate/stream/tools/memory. Following Mastra's pattern: small integration glue, big impact.

## Consumer API Contract

### Level 1: Constructor

```typescript
const neurolink = new NeuroLink({
  auth: new Auth0Provider({ domain: "...", clientId: "..." }),
});
```

### Level 2: Instance method

```typescript
neurolink.setAuthProvider(new Auth0Provider({ ... }));
```

### Level 3a: Per-call with pre-validated user context

```typescript
await neurolink.generate({
  input: { text: "Hello" },
  requestContext: { userId: "alice", roles: ["admin"] },
});
```

### Level 3b: Per-call with raw token

```typescript
await neurolink.generate({
  input: { text: "Hello" },
  auth: { token: "eyJhbG..." },
  // NeuroLink validates via configured provider
});
```

### Server mode: endpoints auto-protected

```typescript
const server = await createServer(neurolink, { framework: "hono" });
// Endpoints require valid Bearer token
// User identity flows into generate/stream/tools/memory
```

## Architecture

### RequestContext

Type-safe Map wrapper that flows through the entire pipeline:

- Auth middleware writes: user, permissions, roles
- Reserved keys (`neurolink__resourceId`, `neurolink__threadId`) can't be overridden by client
- Passed to generate/stream → tools → memory

### Auth Provider Interface

```typescript
interface NeuroLinkAuthProvider<TUser = AuthUser> {
  readonly type: string;
  authenticateToken(token: string): Promise<TokenValidationResult>;
  authorizeUser?(user: TUser): Promise<boolean>;
}
```

### Integration Points

1. **Constructor** reads `config.auth`, stores provider
2. **Server middleware** uses provider's `authenticateToken()` as `validate` callback in existing `createAuthMiddleware`
3. **Route handlers** pass `ctx.user` (from middleware) into generate/stream via `requestContext`
4. **generate/stream** accept `requestContext` and `auth: { token }` options
5. **Tool execution** receives `requestContext` with user identity
6. **Memory** uses `requestContext.userId` for per-user isolation, enforced server-side

### What to Keep/Rework/Delete

**KEEP as-is:** 11 provider implementations (Auth0, Clerk, Firebase, Supabase, WorkOS, BetterAuth, JWT, OAuth2, Custom, Cognito, Keycloak), authErrors, authContext, sessionManager, authProvider base

**REWORK:** AuthProviderFactory (add static methods matching consumer API), auth/index.ts exports, AuthMiddleware (bridge to existing server middleware), configTypes (wire constructor), neurolink.ts (constructor reads auth, generate/stream accept requestContext+auth)

**DELETE:** Broken vitest tests (replaced by continuous test suite), duplicate docs

## Continuous Test Suite Structure

File: `test/continuous-test-suite-auth.ts`
Format: Standalone runner, imports from dist/, ~75 tests across 13 sections

### Sections

1. Auth Provider Configuration (8 tests)
2. Token Validation via Providers (6 tests)
3. Server Auth — Protected Endpoints (8 tests)
4. Server Auth — RBAC (5 tests)
5. Per-Call Auth — Pre-validated Context (5 tests)
6. Per-Call Auth — Token Validation (4 tests)
7. Per-User Memory Isolation (5 tests)
8. Tools Receive Auth Context (4 tests)
9. Auth Context Propagation (6 tests)
10. Multiple Providers (4 tests)
11. Error Handling (8 tests)
12. Session Management (7 tests)
13. Rate Limiting (5 tests)
