/**
 * NeuroLink Chat Application - Express Server Setup
 *
 * Configures the Express server with middleware and routes.
 */

import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { chatRouter } from "./routes/chat.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates and configures the Express application
 */
export async function createServer(): Promise<Express> {
  const app = express();

  // Rate limiting middleware - protects against brute force and DoS attacks
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      error: "Too many requests",
      message: "Please try again later",
    },
  });

  // Apply rate limiting to all routes
  app.use(limiter);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS middleware for development
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }

    next();
  });

  // Static files
  const publicPath = path.join(__dirname, "..", "public");
  app.use(express.static(publicPath));

  // API routes
  app.use("/api/chat", chatRouter);

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve index.html for root
  app.get("/", (_req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  return app;
}
