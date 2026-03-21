# Auth Providers Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make auth providers actually work — connect them to NeuroLink's server/generate/stream/tools/memory pipeline so consumers can protect endpoints and flow user identity through AI operations.

**Architecture:** Keep all 11 existing provider implementations (they pass tests). Add integration glue: constructor wiring, server middleware bridge, requestContext/auth options on generate/stream, route handler threading, and rewrite the continuous test suite. Follow Mastra's pattern — small core, big impact.

**Tech Stack:** TypeScript, Hono (server adapter), jose (JWT), existing NeuroLink server middleware system

**Spec:** `docs/superpowers/specs/2026-03-16-auth-providers-redesign.md`
**Test Suite:** `test/continuous-test-suite-auth.ts` (75 tests, 13 sections)

---

## File Structure

### Files to CREATE

- `src/lib/auth/RequestContext.ts` — Type-safe Map wrapper with reserved keys (~100 lines)
- `src/lib/auth/serverBridge.ts` — Bridge auth providers to server middleware validate callback (~60 lines)

### Files to MODIFY

- `src/lib/neurolink.ts` — Constructor reads `config.auth`, generate/stream accept `requestContext` and `auth: { token }`
- `src/lib/types/configTypes.ts` — Already has `NeuroLinkAuthConfig`, verify constructor uses it
- `src/lib/types/generateTypes.ts` — Add `requestContext` and `auth` to `GenerateOptions`
- `src/lib/types/streamTypes.ts` — Add `requestContext` and `auth` to `StreamOptions`
- `src/lib/auth/AuthProviderFactory.ts` — Add static convenience methods (`create`, `getAvailableProviders`)
- `src/lib/auth/index.ts` — Ensure all needed exports exist (createAuthenticatedContext, createRequestContext, etc.)
- `src/lib/server/routes/agentRoutes.ts` — Thread `ctx.user` into generate/stream context
- `src/lib/server/index.ts` — Export server auth bridge utilities
- `src/lib/mcp/toolRegistry.ts` — Populate ExecutionContext with auth from requestContext
- `test/continuous-test-suite-auth.ts` — Already written, may need import path fixes after implementation

### Files to DELETE

- `test/unit/auth/` — All vitest tests (replaced by continuous test suite)
- `test/auth/` — All vitest tests (replaced by continuous test suite)
- `test/integration/auth/` — Vitest integration tests (replaced)

---

## Chunk 1: Core Infrastructure

### Task 1: Create RequestContext class

**Files:**

- Create: `src/lib/auth/RequestContext.ts`

- [ ] **Step 1: Create RequestContext.ts**

```typescript
// src/lib/auth/RequestContext.ts
/**
 * Type-safe Map wrapper for request-scoped context.
 * Flows from auth middleware through generate/stream/tools/memory.
 * Reserved keys (prefixed neurolink__) cannot be overridden by client code.
 */

export const NEUROLINK_RESOURCE_ID_KEY = "neurolink__resourceId";
export const NEUROLINK_THREAD_ID_KEY = "neurolink__threadId";

const RESERVED_PREFIX = "neurolink__";

export class RequestContext<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  private registry = new Map<string, unknown>();

  constructor(initial?: Partial<T> | [string, unknown][]) {
    if (Array.isArray(initial)) {
      for (const [key, value] of initial) {
        this.registry.set(key, value);
      }
    } else if (initial) {
      for (const [key, value] of Object.entries(initial)) {
        this.registry.set(key, value);
      }
    }
  }

  set<K extends string>(key: K, value: unknown): void {
    this.registry.set(key, value);
  }

  get<K extends string>(key: K): unknown {
    return this.registry.get(key);
  }

  has(key: string): boolean {
    return this.registry.has(key);
  }

  delete(key: string): boolean {
    return this.registry.delete(key);
  }

  get size(): number {
    return this.registry.size;
  }

  /**
   * Merge client-provided values, but SKIP reserved keys that are already set.
   * This prevents clients from overriding auth middleware values.
   */
  mergeClientContext(clientContext: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(clientContext)) {
      if (key.startsWith(RESERVED_PREFIX) && this.registry.has(key)) {
        continue; // Server-set reserved keys cannot be overridden
      }
      if (!this.registry.has(key)) {
        this.registry.set(key, value);
      }
    }
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.registry.entries()) {
      if (this.isSerializable(value)) {
        result[key] = value;
      }
    }
    return result;
  }

  private isSerializable(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    const type = typeof value;
    if (type === "function" || type === "symbol") return false;
    try {
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 2: Export from auth/index.ts**

Add to `src/lib/auth/index.ts`:

```typescript
export {
  RequestContext,
  NEUROLINK_RESOURCE_ID_KEY,
  NEUROLINK_THREAD_ID_KEY,
} from "./RequestContext.js";
```

- [ ] **Step 3: Build and verify no type errors**

Run: `pnpm run check`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/RequestContext.ts src/lib/auth/index.ts
git commit -m "feat(auth): add RequestContext class with reserved keys"
```

### Task 2: Add static convenience methods to AuthProviderFactory

**Files:**

- Modify: `src/lib/auth/AuthProviderFactory.ts`

The continuous test suite expects `AuthProviderFactory.create()` and `AuthProviderFactory.getAvailableProviders()` as static methods.

- [ ] **Step 1: Add static create method**

Add to `AuthProviderFactory` class:

```typescript
/**
 * Static convenience method for creating a provider.
 * Delegates to singleton getInstance().create().
 */
static async create(
  type: string,
  config: AuthProviderConfig,
): Promise<MastraAuthProvider> {
  const factory = AuthProviderFactory.getInstance();
  return factory.create(type, config);
}

/**
 * Static convenience method to list available providers.
 */
static getAvailableProviders(): string[] {
  const factory = AuthProviderFactory.getInstance();
  return factory.getAvailableProviders();
}
```

- [ ] **Step 2: Build and verify**

Run: `pnpm run check`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/AuthProviderFactory.ts
git commit -m "feat(auth): add static create/getAvailableProviders to AuthProviderFactory"
```

### Task 3: Wire constructor to read auth config

**Files:**

- Modify: `src/lib/neurolink.ts`

- [ ] **Step 1: Store auth config in constructor for lazy init**

In the constructor (line ~678), after existing initialization, add:

```typescript
// Store auth config for lazy initialization
if (config?.auth) {
  this.pendingAuthConfig = config.auth;
}
```

Add private field:

```typescript
private pendingAuthConfig?: NeuroLinkAuthConfig;
```

- [ ] **Step 2: Initialize auth provider lazily on first use**

Add private method:

```typescript
private async ensureAuthProvider(): Promise<void> {
  if (this.authProvider || !this.pendingAuthConfig) return;
  await this.setAuthProvider(this.pendingAuthConfig);
  this.pendingAuthConfig = undefined;
}
```

- [ ] **Step 3: Build and verify**

Run: `pnpm run check`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/neurolink.ts
git commit -m "feat(auth): wire constructor to accept auth config with lazy init"
```

### Task 4: Add requestContext and auth options to generate/stream types

**Files:**

- Modify: `src/lib/types/generateTypes.ts`
- Modify: `src/lib/types/streamTypes.ts`

- [ ] **Step 1: Add to GenerateOptions**

In `src/lib/types/generateTypes.ts`, add to the `GenerateOptions` type:

```typescript
/** Pre-validated user context for the request */
requestContext?: Record<string, unknown>;

/** Raw auth token — validated by configured auth provider */
auth?: { token: string };
```

- [ ] **Step 2: Add to StreamOptions**

In `src/lib/types/streamTypes.ts`, add the same fields to `StreamOptions`.

- [ ] **Step 3: Build and verify**

Run: `pnpm run check`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/types/generateTypes.ts src/lib/types/streamTypes.ts
git commit -m "feat(auth): add requestContext and auth options to generate/stream types"
```

---

## Chunk 2: Generate/Stream Integration

### Task 5: Handle requestContext and auth in generate()

**Files:**

- Modify: `src/lib/neurolink.ts`

- [ ] **Step 1: Add auth token validation in generate()**

Near the top of the `generate()` method, after options parsing:

```typescript
// Handle per-call auth token validation
if (enhancedOptions.auth?.token) {
  await this.ensureAuthProvider();
  if (!this.authProvider) {
    throw new Error(
      "No auth provider configured. Set auth in constructor or via setAuthProvider().",
    );
  }
  const result = await this.authProvider.authenticateToken(
    enhancedOptions.auth.token,
  );
  if (!result.valid) {
    const { InvalidTokenError } = await import("./auth/authErrors.js");
    throw new InvalidTokenError(
      result.error || "Token validation failed",
      this.authProvider.type,
    );
  }
  // Merge validated user into context
  if (result.user) {
    enhancedOptions.context = {
      ...enhancedOptions.context,
      userId: result.user.id,
      userEmail: result.user.email,
      userRoles: result.user.roles,
    };
  }
}

// Handle pre-validated requestContext
if (enhancedOptions.requestContext) {
  enhancedOptions.context = {
    ...enhancedOptions.context,
    ...enhancedOptions.requestContext,
  };
}
```

- [ ] **Step 2: Do the same in stream()**

Apply the same pattern at the top of the `stream()` method.

- [ ] **Step 3: Build and verify**

Run: `pnpm run check`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/neurolink.ts
git commit -m "feat(auth): handle requestContext and auth token in generate/stream"
```

### Task 6: Create server auth bridge

**Files:**

- Create: `src/lib/auth/serverBridge.ts`

- [ ] **Step 1: Create bridge function**

```typescript
// src/lib/auth/serverBridge.ts
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
    if (!result.valid || !result.user) return null;
    return {
      id: result.user.id,
      email: result.user.email,
      roles: result.user.roles,
    };
  };
}
```

- [ ] **Step 2: Export from auth/index.ts and server/index.ts**

- [ ] **Step 3: Build and verify**

Run: `pnpm run check`

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/serverBridge.ts src/lib/auth/index.ts src/lib/server/index.ts
git commit -m "feat(auth): add server bridge to connect providers to middleware"
```

### Task 7: Thread ctx.user into route handlers

**Files:**

- Modify: `src/lib/server/routes/agentRoutes.ts`

- [ ] **Step 1: Update execute route handler**

In the POST `/api/agent/execute` handler, change context creation to prefer authenticated user:

```typescript
context: {
  ...request.context,
  userId: ctx.user?.id ?? request.userId,
  sessionId: ctx.session?.id ?? request.sessionId,
  userEmail: ctx.user?.email,
  userRoles: ctx.user?.roles,
  requestId: ctx.requestId,
},
```

- [ ] **Step 2: Update stream route handler**

Same change for the POST `/api/agent/stream` handler.

- [ ] **Step 3: Build and verify**

Run: `pnpm run check`

- [ ] **Step 4: Commit**

```bash
git add src/lib/server/routes/agentRoutes.ts
git commit -m "feat(auth): thread authenticated user from middleware into generate/stream"
```

---

## Chunk 3: Tool Execution and Exports

### Task 8: Populate tool ExecutionContext with auth

**Files:**

- Modify: `src/lib/mcp/toolRegistry.ts`

- [ ] **Step 1: Import getAuthContext**

```typescript
import { getAuthContext } from "../auth/authContext.js";
```

- [ ] **Step 2: Enrich ExecutionContext in executeTool()**

In the `executeTool()` method, where `execContext` is created (~line 378), add:

```typescript
const authCtx = getAuthContext();
const execContext: ExecutionContext = {
  ...context,
  sessionId: context?.sessionId ?? randomUUID(),
  userId: context?.userId ?? authCtx?.user?.id,
};
```

- [ ] **Step 3: Build and verify**

Run: `pnpm run check`

- [ ] **Step 4: Commit**

```bash
git add src/lib/mcp/toolRegistry.ts
git commit -m "feat(auth): populate tool ExecutionContext with authenticated user"
```

### Task 9: Ensure all exports are correct

**Files:**

- Modify: `src/lib/auth/index.ts`
- Modify: `src/lib/server/index.ts`
- Modify: `src/lib/index.ts`

- [ ] **Step 1: Verify auth/index.ts exports match test imports**

The test imports these from `../dist/lib/auth/index.js`:

- Auth0Provider, AuthContextHolder, AuthError, AuthProviderFactory, BetterAuthProvider, ClerkProvider, CustomAuthProvider, FirebaseAuthProvider
- InsufficientPermissionsError, InvalidConfigurationError, InvalidTokenError
- MemoryRateLimitStorage, MemorySessionStorage, MissingTokenError, ProviderInitializationError
- SessionExpiredError, SessionManager, SessionNotFoundError, SupabaseAuthProvider
- TokenExpiredError, UserRateLimiter, WorkOSProvider
- createAuthenticatedContext, getAuthContext, getCurrentSession, getCurrentUser
- hasPermission, hasRole, isAuthError, isAuthenticated, isAuthenticationError
- isPermissionError, isSessionError, isTokenError, requireAuth, requirePermission, requireRole
- runWithAuthContext, RequestContext

Check each one exists in `src/lib/auth/index.ts`. Add any missing.

- [ ] **Step 2: Verify server/index.ts exports**

The test imports: `createServer, registerAllRoutes, createHealthRoutes, createAuthMiddleware, createRoleMiddleware, createAgentRoutes, AuthorizationError`

Verify these exist in `src/lib/server/index.ts`.

- [ ] **Step 3: Build full project**

Run: `pnpm run build`

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/index.ts src/lib/server/index.ts src/lib/index.ts
git commit -m "feat(auth): ensure all exports match continuous test suite expectations"
```

---

## Chunk 4: Test Suite and Cleanup

### Task 10: Build and run continuous test suite

- [ ] **Step 1: Full build**

Run: `pnpm run build`

- [ ] **Step 2: Run continuous test suite**

Run: `node --experimental-strip-types test/continuous-test-suite-auth.ts`

- [ ] **Step 3: Fix any import errors**

If imports fail, fix the export paths. Rebuild. Rerun.

- [ ] **Step 4: Fix any test failures**

For each failing test, check if it's an implementation bug or a test bug. Fix the implementation to match the consumer API contract defined by the test.

- [ ] **Step 5: Iterate until sections 1, 2, 9, 10, 11, 12, 13 pass**

These sections (provider config, token validation, auth context, multiple providers, errors, sessions, rate limiting) should pass with the existing provider code + our new wiring.

- [ ] **Step 6: Commit passing tests**

```bash
git add -A
git commit -m "feat(auth): continuous test suite sections passing"
```

### Task 11: Fix server auth tests (sections 3-4)

These require the server middleware bridge to work.

- [ ] **Step 1: Verify server bridge wiring**

Ensure the Hono adapter auto-registers auth middleware when NeuroLink has an auth provider configured.

- [ ] **Step 2: Run sections 3-4 tests**

Focus on: no token → 401, valid token → 200, invalid → 401, RBAC → 403

- [ ] **Step 3: Fix implementation to match**

- [ ] **Step 4: Commit**

### Task 12: Fix per-call auth tests (sections 5-6)

- [ ] **Step 1: Verify generate/stream accept requestContext**

- [ ] **Step 2: Verify auth token validation in generate**

- [ ] **Step 3: Run sections 5-6, fix any failures**

- [ ] **Step 4: Commit**

### Task 13: Delete old broken tests

**Files:**

- Delete: `test/unit/auth/` (entire directory)
- Delete: `test/auth/` (entire directory)
- Delete: `test/integration/auth/` (entire directory)

- [ ] **Step 1: Remove old test directories**

```bash
rm -rf test/unit/auth/ test/auth/ test/integration/auth/
```

- [ ] **Step 2: Verify remaining tests still pass**

Run: `pnpm test` (ensure no other tests break)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(auth): remove broken vitest tests, replaced by continuous test suite"
```

### Task 14: Final verification

- [ ] **Step 1: Full build**

Run: `pnpm run build`
Expected: Success

- [ ] **Step 2: Type check**

Run: `pnpm run check`
Expected: 0 errors

- [ ] **Step 3: Run full continuous test suite**

Run: `node --experimental-strip-types test/continuous-test-suite-auth.ts`
Expected: All non-provider-dependent tests pass, provider-dependent tests skip gracefully

- [ ] **Step 4: Run existing test suite**

Run: `pnpm test`
Expected: No regressions

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(auth): complete auth providers integration with server/generate/stream pipeline"
```
