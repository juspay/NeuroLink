import { Router, Request, Response } from "express";
import { NeuroLink } from "@juspay/neurolink";
import { RedisService } from "../services/redis.service.js";
import { getApprovalRoutes } from "../middleware/hitl.middleware.js";
import { complianceAudit } from "../middleware/audit.middleware.js";

export function createApiRoutes(
  neurolink: NeuroLink,
  redisService: RedisService,
): Router {
  const router = Router();
  const approvalRoutes = getApprovalRoutes();

  // Rate limit configuration
  const RATE_LIMIT = 100; // requests
  const RATE_WINDOW = 60; // seconds

  // Rate limiting middleware
  router.use(async (req: Request, res: Response, next) => {
    const userId = (req as any).userId || req.ip || "anonymous";
    const rateLimit = await redisService.checkRateLimit(
      userId,
      RATE_LIMIT,
      RATE_WINDOW,
    );

    res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
    res.setHeader("X-RateLimit-Remaining", rateLimit.remaining);
    res.setHeader("X-RateLimit-Reset", rateLimit.resetAt);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      });
    }

    next();
  });

  // Create new conversation session
  router.post("/sessions", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId || "anonymous";
      const sessionId = await redisService.createSession(
        userId,
        req.body.metadata,
      );

      (req as any).audit.log("session_created", { sessionId });

      res.json({ sessionId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get session details
  router.get("/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const session = await redisService.getSession(req.params.sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat endpoint with HITL support
  router.post("/chat", async (req: Request, res: Response) => {
    try {
      const { sessionId, message, options } = req.body;
      const hitl = (req as any).hitl;

      if (!sessionId || !message) {
        return res
          .status(400)
          .json({ error: "sessionId and message are required" });
      }

      // Add user message to session
      await redisService.addMessage(sessionId, {
        role: "user",
        content: message,
      });

      // Get conversation history
      const messages = await redisService.getMessages(sessionId, 20);

      // Check cache for similar queries
      const cacheKey = `${sessionId}:${message.substring(0, 50)}`;
      const cachedResponse = await redisService.getCachedResponse(cacheKey);

      if (cachedResponse && !options?.skipCache) {
        (req as any).audit.log("cache_hit", { cacheKey });
        return res.json({ ...cachedResponse, cached: true });
      }

      // Generate response
      const result = await neurolink.generate({
        prompt: message,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        ...options,
      });

      // Check if response includes tool calls requiring approval
      if (result.toolCalls && result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          if (hitl.requiresApproval(toolCall.name)) {
            const approvalId = await hitl.requestApproval(
              toolCall.name,
              toolCall.arguments,
              (req as any).userId || "anonymous",
            );

            (req as any).audit.log("hitl_approval_requested", {
              toolName: toolCall.name,
              approvalId,
            });

            return res.json({
              status: "pending_approval",
              approvalId,
              message: `Action "${toolCall.name}" requires human approval`,
              toolCall,
            });
          }
        }
      }

      // Store assistant response
      const responseText = result.text || "";
      await redisService.addMessage(sessionId, {
        role: "assistant",
        content: responseText,
      });

      // Cache response
      await redisService.cacheResponse(cacheKey, { text: responseText }, 300);

      (req as any).audit.log("chat_completed", {
        sessionId,
        tokensUsed: result.usage?.totalTokens,
      });

      res.json({
        text: responseText,
        usage: result.usage,
        sessionId,
      });
    } catch (error: any) {
      (req as any).audit.log("chat_error", { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // HITL approval endpoints
  router.get("/approvals", approvalRoutes.listPending);
  router.post("/approvals/:id/approve", approvalRoutes.approve);
  router.post("/approvals/:id/reject", approvalRoutes.reject);

  // Execute approved action
  router.post("/approvals/:id/execute", async (req: Request, res: Response) => {
    try {
      const hitl = (req as any).hitl;
      const status = hitl.checkApproval(req.params.id);

      if (status !== "approved") {
        return res.status(400).json({
          error: `Cannot execute action with status: ${status}`,
        });
      }

      (req as any).audit.log("approved_action_executed", {
        approvalId: req.params.id,
      });

      // Execute the approved action
      // Implementation depends on the specific tool
      res.json({ success: true, message: "Action executed" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Compliance endpoints
  router.post(
    "/compliance/data-request",
    async (req: Request, res: Response) => {
      const { requestType, subjectId } = req.body;

      complianceAudit.logDataSubjectRequest(req, requestType, subjectId);

      res.json({
        message: "Data subject request logged",
        requestId: (req as any).audit.requestId,
      });
    },
  );

  return router;
}
