/**
 * NeuroLink Chat Application - Entry Point
 *
 * This is the main entry point for the chat application.
 * It loads environment variables and starts the Express server.
 */

import dotenv from "dotenv";
import { createServer } from "./server.js";

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);

async function main() {
  try {
    const app = await createServer();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║           NeuroLink Chat Application Started               ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT.toString().padEnd(23)}║
║  API endpoints:                                            ║
║    POST /api/chat        - Standard chat                   ║
║    POST /api/chat/stream - Streaming chat                  ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
