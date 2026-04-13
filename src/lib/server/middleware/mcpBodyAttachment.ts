/**
 * MCP Body Attachment Middleware for Fastify
 * Attaches parsed body to raw request for MCP SDK compatibility
 */

import type { MiddlewareDefinition, ServerContext } from "../../types/index.js";

/**
 * Create MCP body attachment middleware for Fastify.
 * The MCP SDK reads body from request.raw.body, but Fastify
 * parses body separately. This middleware bridges the gap.
 *
 * @returns Middleware that attaches body to raw request
 *
 * @example
 * ```typescript
 * // In Fastify adapter
 * const mcpBodyMiddleware = createMCPBodyAttachmentMiddleware();
 * server.registerMiddleware(mcpBodyMiddleware);
 * ```
 */
export function createMCPBodyAttachmentMiddleware(): MiddlewareDefinition {
  return {
    name: "mcp-body-attachment",
    order: 10, // After body parsing, before route handlers

    handler: async (ctx: ServerContext, next: () => Promise<unknown>) => {
      attachBodyToRawRequest(ctx);
      return next();
    },
  };
}

/**
 * Attach parsed body to raw request object.
 * Supports Fastify's request structure.
 */
function attachBodyToRawRequest(ctx: ServerContext): void {
  const rawRequest = ctx.rawRequest as
    | {
        raw?: { body?: unknown };
        body?: unknown;
      }
    | undefined;

  if (!rawRequest) {
    return;
  }

  // Fastify structure: request.raw is the Node.js IncomingMessage
  if (rawRequest.raw && rawRequest.body !== undefined) {
    (rawRequest.raw as { body?: unknown }).body = rawRequest.body;
  }
}

/**
 * Fastify-specific preHandler hook.
 * Use this directly with Fastify for optimal integration.
 *
 * This is a lower-level hook that works directly with Fastify
 * request objects rather than the unified ServerContext.
 *
 * @param request - Fastify request object
 * @returns Promise that resolves when body is attached
 *
 * @example
 * ```typescript
 * // In Fastify adapter initialization
 * fastify.addHook('preHandler', fastifyMCPBodyHook);
 * ```
 */
export async function fastifyMCPBodyHook(request: {
  raw: { body?: unknown };
  body?: unknown;
}): Promise<void> {
  if (request.body !== undefined) {
    (request.raw as { body?: unknown }).body = request.body;
  }
}
