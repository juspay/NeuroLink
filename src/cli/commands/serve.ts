/**
 * Serve CLI Commands for NeuroLink
 * Simplified HTTP server management commands for Server Adapters feature
 *
 * Usage:
 *   neurolink serve --framework <hono|express|fastify|koa> --port <n>
 *   neurolink serve --config <file>
 *   neurolink serve --cors --rate-limit
 *   neurolink serve status
 */

import type { CommandModule, Argv } from "yargs";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { logger } from "../../lib/utils/logger.js";
import { NeuroLink } from "../../lib/neurolink.js";
import { withTimeout } from "../../lib/utils/errorHandling.js";
import type {
  ServerFramework,
  ServerAdapterConfig,
} from "../../lib/server/types.js";
import {
  isProcessRunning,
  formatUptime,
  StateFileManager,
} from "../utils/serverUtils.js";
import {
  ConfigurationError,
  ServerStartError,
} from "../../lib/server/errors.js";

// ============================================
// Types
// ============================================

/**
 * Serve command arguments
 */
type ServeCommandArgs = {
  port?: number;
  host?: string;
  framework?: ServerFramework;
  basePath?: string;
  cors?: boolean;
  rateLimit?: number;
  swagger?: boolean;
  config?: string;
  watch?: boolean;
  quiet?: boolean;
  debug?: boolean;
  format?: "text" | "json";
};

/**
 * Server configuration file format
 */
type ServerConfigFile = {
  port?: number;
  host?: string;
  framework?: ServerFramework;
  basePath?: string;
  cors?: {
    enabled?: boolean;
    origins?: string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
  };
  rateLimit?: {
    enabled?: boolean;
    windowMs?: number;
    maxRequests?: number;
    message?: string;
    skipPaths?: string[];
  };
  bodyParser?: {
    enabled?: boolean;
    maxSize?: string;
    jsonLimit?: string;
    urlEncoded?: boolean;
  };
  logging?: {
    enabled?: boolean;
    level?: "debug" | "info" | "warn" | "error";
    includeBody?: boolean;
    includeResponse?: boolean;
  };
  timeout?: number;
  enableMetrics?: boolean;
  enableSwagger?: boolean;
};

/**
 * Server state stored in state file
 */
type ServeState = {
  pid: number;
  port: number;
  host: string;
  framework: string;
  startTime: string;
  basePath: string;
  configFile?: string;
};

// ============================================
// State Management
// ============================================

// Use StateFileManager for serve state persistence
const serveStateManager = new StateFileManager<ServeState>("serve-state.json");

function saveServeState(state: ServeState): void {
  serveStateManager.save(state);
}

function loadServeState(): ServeState | null {
  return serveStateManager.load();
}

function clearServeState(): void {
  serveStateManager.clear();
}

function loadConfigFile(configPath: string): ServerConfigFile {
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(absolutePath)) {
    throw new ConfigurationError(`Config file not found: ${absolutePath}`, {
      configPath,
      absolutePath,
    });
  }

  const content = fs.readFileSync(absolutePath, "utf8");

  // Support both JSON and JS/TS module format (for JSON only at runtime)
  if (absolutePath.endsWith(".json")) {
    return JSON.parse(content) as ServerConfigFile;
  }

  throw new ConfigurationError(
    "Only JSON config files are supported. Use .json extension.",
    { configPath, absolutePath },
  );
}

// ============================================
// Watch Mode Utilities
// ============================================

/**
 * Directories to watch for changes in watch mode
 */
const WATCH_DIRS = ["src", "lib"];

/**
 * File extensions to watch for changes
 */
const WATCH_EXTENSIONS = [".ts", ".js", ".json"];

/**
 * Debounce time for file changes (ms)
 */
const WATCH_DEBOUNCE_MS = 500;

/**
 * Create a file watcher for watch mode
 * Returns a cleanup function to stop watching
 */
function createFileWatcher(
  onRestart: () => Promise<void>,
  quiet: boolean,
): () => void {
  const watchers: fs.FSWatcher[] = [];
  let debounceTimer: NodeJS.Timeout | null = null;
  let isRestarting = false;

  const handleChange = (eventType: string, filename: string | null) => {
    // Skip if no filename or if it doesn't match our extensions
    if (!filename) {
      return;
    }
    const ext = path.extname(filename);
    if (!WATCH_EXTENSIONS.includes(ext)) {
      return;
    }

    // Debounce rapid changes
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      if (isRestarting) {
        return;
      }
      isRestarting = true;

      if (!quiet) {
        logger.always("");
        logger.always(
          chalk.yellow(`File changed: ${filename}. Restarting server...`),
        );
      }

      try {
        await onRestart();
      } finally {
        isRestarting = false;
      }
    }, WATCH_DEBOUNCE_MS);
  };

  // Watch each directory
  const cwd = process.cwd();
  for (const dir of WATCH_DIRS) {
    const watchPath = path.join(cwd, dir);
    if (fs.existsSync(watchPath)) {
      try {
        const watcher = fs.watch(watchPath, { recursive: true }, handleChange);
        watchers.push(watcher);
      } catch {
        // Ignore errors for directories that can't be watched
      }
    }
  }

  // Return cleanup function
  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    for (const watcher of watchers) {
      watcher.close();
    }
  };
}

// ============================================
// Serve Command Factory
// ============================================

/**
 * Serve CLI command factory
 */
export class ServeCommandFactory {
  /**
   * Create the main serve command
   */
  static createServeCommands(): CommandModule {
    return {
      command: "serve [subcommand]",
      describe: "Start NeuroLink HTTP server with server adapters",
      builder: (yargs) => {
        return yargs
          .command(
            "status",
            "Show server status",
            (yargs) => this.buildStatusOptions(yargs),
            (argv) => this.executeStatus(argv as ServeCommandArgs),
          )
          .option("port", {
            type: "number",
            alias: "p",
            default: 3000,
            description: "Port to listen on",
          })
          .option("host", {
            type: "string",
            alias: "H",
            default: "0.0.0.0",
            description: "Host to bind to",
          })
          .option("framework", {
            type: "string",
            alias: "f",
            choices: ["hono", "express", "fastify", "koa"] as ServerFramework[],
            default: "hono" as ServerFramework,
            description: "Web framework to use (hono recommended)",
          })
          .option("basePath", {
            type: "string",
            alias: "b",
            default: "/api",
            description: "Base path for all routes",
          })
          .option("cors", {
            type: "boolean",
            default: true,
            description: "Enable CORS middleware",
          })
          .option("rate-limit", {
            type: "number",
            alias: "rateLimit",
            default: 100,
            description:
              "Rate limit (requests per 15 min window, 0 to disable)",
          })
          .option("swagger", {
            type: "boolean",
            default: false,
            description: "Enable OpenAPI/Swagger documentation",
          })
          .option("config", {
            type: "string",
            alias: "c",
            description: "Path to server config file (JSON)",
          })
          .option("watch", {
            type: "boolean",
            alias: "w",
            default: false,
            description: "Watch mode (restart server on file changes)",
          })
          .option("quiet", {
            type: "boolean",
            alias: "q",
            default: false,
            description: "Suppress non-essential output",
          })
          .option("debug", {
            type: "boolean",
            alias: "d",
            default: false,
            description: "Enable debug output",
          })
          .example(
            "neurolink serve",
            "Start server with default settings (Hono on port 3000)",
          )
          .example(
            "neurolink serve --framework express --port 8080",
            "Start Express server on port 8080",
          )
          .example(
            "neurolink serve --config server.config.json",
            "Start server with config file",
          )
          .example(
            "neurolink serve --cors --rate-limit 50",
            "Start server with CORS and rate limiting (50 req/15min)",
          )
          .example(
            "neurolink serve --swagger",
            "Start server with OpenAPI documentation enabled",
          )
          .example(
            "neurolink serve --watch",
            "Start server in watch mode (restart on changes)",
          )
          .example("neurolink serve status", "Show server status")
          .help();
      },
      handler: async (argv) => {
        // If subcommand is provided (like 'status'), it will be handled by the subcommand
        // Otherwise, start the server
        if (!argv.subcommand || argv.subcommand === "serve") {
          await this.executeServe(argv as ServeCommandArgs);
        }
      },
    };
  }

  private static buildStatusOptions(yargs: Argv): Argv {
    return yargs
      .option("format", {
        type: "string",
        choices: ["text", "json"],
        default: "text",
        description: "Output format",
      })
      .option("quiet", {
        type: "boolean",
        alias: "q",
        default: false,
        description: "Suppress non-essential output",
      })
      .example("neurolink serve status", "Show server status")
      .example("neurolink serve status --format json", "Show status as JSON");
  }

  // ============================================
  // Command Executors
  // ============================================

  private static async executeServe(argv: ServeCommandArgs): Promise<void> {
    const spinner = argv.quiet
      ? null
      : ora("Starting NeuroLink server...").start();

    try {
      // Check if server is already running
      const existingState = loadServeState();
      if (existingState && isProcessRunning(existingState.pid)) {
        if (spinner) {
          spinner.fail(
            chalk.red(
              `Server already running on port ${existingState.port} (PID: ${existingState.pid})`,
            ),
          );
        }
        logger.always(
          chalk.yellow(
            "Use 'neurolink server stop' or kill the process to stop it first",
          ),
        );
        process.exit(1);
      }

      // Load config file if provided
      let fileConfig: ServerConfigFile = {};
      if (argv.config) {
        try {
          fileConfig = loadConfigFile(argv.config);
          if (spinner) {
            spinner.text = `Loading config from ${argv.config}...`;
          }
        } catch (configError) {
          if (spinner) {
            spinner.fail(chalk.red("Failed to load config file"));
          }
          logger.error(
            chalk.red(
              `Error: ${configError instanceof Error ? configError.message : String(configError)}`,
            ),
          );
          process.exit(1);
        }
      }

      // Merge CLI args with file config (CLI takes precedence)
      const port = argv.port ?? fileConfig.port ?? 3000;
      const host = argv.host ?? fileConfig.host ?? "0.0.0.0";
      const framework = argv.framework ?? fileConfig.framework ?? "hono";
      const basePath = argv.basePath ?? fileConfig.basePath ?? "/api";
      const corsEnabled = argv.cors ?? fileConfig.cors?.enabled ?? true;

      // Rate limit: argv.rateLimit is a number (0 to disable, >0 for max requests)
      const rateLimitValue =
        argv.rateLimit ?? fileConfig.rateLimit?.maxRequests ?? 100;
      const rateLimitEnabled = rateLimitValue > 0;

      // Swagger/OpenAPI documentation
      const swaggerEnabled = argv.swagger ?? fileConfig.enableSwagger ?? false;

      // Create NeuroLink instance
      const neurolink = new NeuroLink();

      // Dynamically import server module
      const { createServer, registerAllRoutes } = await import(
        "../../lib/server/index.js"
      );

      // Build server adapter config
      // Default config values
      const defaultConfig = {
        cors: { enabled: true },
        rateLimit: { enabled: true, maxRequests: 100 },
      };

      const serverConfig: ServerAdapterConfig = {
        port,
        host,
        basePath,
        cors: {
          ...defaultConfig.cors,
          ...(fileConfig.cors || {}),
          // CLI flag should override config file
          enabled:
            argv.cors !== undefined
              ? argv.cors
              : (fileConfig.cors?.enabled ?? defaultConfig.cors.enabled),
        },
        rateLimit: {
          ...defaultConfig.rateLimit,
          ...(fileConfig.rateLimit || {}),
          // CLI flags should override config file
          enabled:
            argv.rateLimit !== undefined
              ? argv.rateLimit > 0
              : (fileConfig.rateLimit?.enabled ??
                defaultConfig.rateLimit.enabled),
          maxRequests:
            argv.rateLimit !== undefined
              ? argv.rateLimit
              : (fileConfig.rateLimit?.maxRequests ??
                defaultConfig.rateLimit.maxRequests),
        },
        bodyParser: fileConfig.bodyParser,
        logging: fileConfig.logging,
        timeout: fileConfig.timeout,
        enableMetrics: fileConfig.enableMetrics ?? true,
        enableSwagger:
          argv.swagger !== undefined
            ? argv.swagger
            : (fileConfig.enableSwagger ?? false),
        disableBuiltInHealth: true, // We register health routes separately
      };

      if (spinner) {
        spinner.text = `Creating ${framework} server...`;
      }

      // Create server using ServerAdapterFactory
      // Use a mutable reference wrapper so signal handlers always access the current server
      // This is necessary because watch mode replaces the server on restart
      const serverRef: { current: Awaited<ReturnType<typeof createServer>> } = {
        current: await createServer(neurolink, {
          framework: framework as ServerFramework,
          config: serverConfig,
        }),
      };

      // Register all routes
      registerAllRoutes(serverRef.current, basePath);

      if (spinner) {
        spinner.text = "Initializing server...";
      }

      // Initialize and start with timeout
      await withTimeout(
        serverRef.current.initialize(),
        30000,
        new ServerStartError(
          "Server initialization timed out after 30 seconds",
          undefined,
          port,
          host,
        ),
      );
      await withTimeout(
        serverRef.current.start(),
        30000,
        new ServerStartError(
          "Server startup timed out after 30 seconds",
          undefined,
          port,
          host,
        ),
      );

      // Save state
      const state: ServeState = {
        pid: process.pid,
        port,
        host,
        framework,
        startTime: new Date().toISOString(),
        basePath,
        configFile: argv.config,
      };
      saveServeState(state);

      if (spinner) {
        spinner.succeed(chalk.green("NeuroLink server started successfully"));
      }

      const url = `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;

      logger.always("");
      logger.always(chalk.bold.cyan("NeuroLink Server"));
      logger.always(chalk.gray("=".repeat(50)));
      logger.always("");
      logger.always(`  ${chalk.bold("URL:")}        ${chalk.cyan(url)}`);
      logger.always(`  ${chalk.bold("Framework:")}  ${chalk.cyan(framework)}`);
      logger.always(`  ${chalk.bold("Base Path:")}  ${chalk.cyan(basePath)}`);
      logger.always(`  ${chalk.bold("PID:")}        ${chalk.cyan(state.pid)}`);
      if (argv.config) {
        logger.always(
          `  ${chalk.bold("Config:")}     ${chalk.cyan(argv.config)}`,
        );
      }
      logger.always("");

      logger.always(chalk.bold("Middleware:"));
      logger.always(
        `  CORS:        ${corsEnabled ? chalk.green("enabled") : chalk.yellow("disabled")}`,
      );
      logger.always(
        `  Rate Limit:  ${rateLimitEnabled ? chalk.green(`enabled (${rateLimitValue} req/15min)`) : chalk.yellow("disabled")}`,
      );
      logger.always(
        `  Swagger:     ${swaggerEnabled ? chalk.green("enabled") : chalk.yellow("disabled")}`,
      );
      if (argv.watch) {
        logger.always(`  Watch Mode:  ${chalk.green("enabled")}`);
      }
      logger.always("");

      logger.always(chalk.bold("Available Endpoints:"));
      logger.always(chalk.gray("  Health & Monitoring:"));
      logger.always(`    ${chalk.green("GET")}  ${basePath}/health`);
      logger.always(`    ${chalk.green("GET")}  ${basePath}/ready`);
      logger.always(`    ${chalk.green("GET")}  ${basePath}/metrics`);
      logger.always("");
      logger.always(chalk.gray("  Agent API:"));
      logger.always(`    ${chalk.blue("POST")} ${basePath}/agent/execute`);
      logger.always(`    ${chalk.blue("POST")} ${basePath}/agent/stream`);
      logger.always(`    ${chalk.green("GET")}  ${basePath}/agent/providers`);
      logger.always("");
      logger.always(chalk.gray("  Tools & MCP:"));
      logger.always(`    ${chalk.green("GET")}  ${basePath}/tools`);
      logger.always(
        `    ${chalk.blue("POST")} ${basePath}/tools/:name/execute`,
      );
      logger.always(`    ${chalk.green("GET")}  ${basePath}/mcp/servers`);
      logger.always("");
      logger.always(chalk.gray("  Memory:"));
      logger.always(`    ${chalk.green("GET")}  ${basePath}/memory/sessions`);
      logger.always(
        `    ${chalk.green("GET")}  ${basePath}/memory/sessions/:id`,
      );

      if (swaggerEnabled) {
        logger.always("");
        logger.always(chalk.gray("  OpenAPI Documentation:"));
        logger.always(`    ${chalk.green("GET")}  ${basePath}/openapi.json`);
        logger.always(
          `    ${chalk.cyan("INFO")} Swagger UI available at ${url}${basePath}/docs`,
        );
      }
      logger.always("");

      logger.always(chalk.gray("Press Ctrl+C to stop the server"));
      logger.always("");

      // Set up watch mode if enabled
      let stopWatcher: (() => void) | null = null;
      if (argv.watch) {
        const restartServer = async () => {
          try {
            // Stop current server with timeout
            await withTimeout(
              serverRef.current.stop(),
              30000,
              new ServerStartError(
                "Server stop timed out during restart",
                undefined,
                port,
                host,
              ),
            );

            // Re-import server module with cache busting for watch mode
            // Append timestamp query to force ESM to re-evaluate the module
            const timestamp = Date.now();
            const {
              createServer: createNewServer,
              registerAllRoutes: registerNewRoutes,
            } = await import(`../../lib/server/index.js?t=${timestamp}`);

            // Create new server
            const newServer = await createNewServer(new NeuroLink(), {
              framework: framework as ServerFramework,
              config: serverConfig,
            });

            registerNewRoutes(newServer, basePath);

            // Initialize and start with timeouts
            await withTimeout(
              newServer.initialize(),
              30000,
              new ServerStartError(
                "Server initialization timed out during restart",
                undefined,
                port,
                host,
              ),
            );
            await withTimeout(
              newServer.start(),
              30000,
              new ServerStartError(
                "Server startup timed out during restart",
                undefined,
                port,
                host,
              ),
            );

            // Update the reference so signal handlers use the new server instance
            serverRef.current = newServer;

            logger.always(chalk.green("Server restarted successfully"));
          } catch (restartError) {
            logger.error(
              chalk.red(
                `Error restarting server: ${restartError instanceof Error ? restartError.message : String(restartError)}`,
              ),
            );
          }
        };

        stopWatcher = createFileWatcher(restartServer, argv.quiet ?? false);
        logger.always(
          chalk.gray("Watching for file changes in src/ and lib/..."),
        );
        logger.always("");
      }

      // Keep process running and handle graceful shutdown
      // Signal handlers access serverRef.current to always get the latest server instance
      process.on("SIGINT", async () => {
        logger.always("");
        logger.always(chalk.yellow("Shutting down server..."));
        try {
          // Stop file watcher if active
          if (stopWatcher) {
            stopWatcher();
          }
          await serverRef.current.stop();
          clearServeState();
          logger.always(chalk.green("Server stopped gracefully"));
          process.exit(0);
        } catch (error) {
          logger.error(
            chalk.red(
              `Error stopping server: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
          process.exit(1);
        }
      });

      process.on("SIGTERM", async () => {
        try {
          if (stopWatcher) {
            stopWatcher();
          }
          await withTimeout(
            serverRef.current.stop(),
            30000,
            new Error("Server stop timed out during SIGTERM"),
          );
          clearServeState();
          process.exit(0);
        } catch (error) {
          logger.error(
            chalk.red(
              `Error stopping server: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
          clearServeState();
          process.exit(1);
        }
      });
    } catch (error) {
      if (spinner) {
        spinner.fail(chalk.red("Failed to start server"));
      }
      logger.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );

      if (argv.debug && error instanceof Error && error.stack) {
        logger.error(chalk.gray(error.stack));
      }

      logger.always("");
      logger.always(chalk.bold("Troubleshooting:"));
      logger.always("  1. Check if the port is already in use");
      logger.always(
        "  2. Verify the framework is installed (npm install hono/express/fastify/koa)",
      );
      logger.always("  3. Check your config file format if using --config");
      logger.always("  4. Run with --debug for more information");
      logger.always("");

      process.exit(1);
    }
  }

  private static async executeStatus(argv: ServeCommandArgs): Promise<void> {
    try {
      const state = loadServeState();

      const status = {
        running: false,
        pid: null as number | null,
        port: null as number | null,
        host: null as string | null,
        framework: null as string | null,
        basePath: null as string | null,
        uptime: null as number | null,
        startTime: null as string | null,
        configFile: null as string | null,
        url: null as string | null,
      };

      if (state && isProcessRunning(state.pid)) {
        status.running = true;
        status.pid = state.pid;
        status.port = state.port;
        status.host = state.host;
        status.framework = state.framework;
        status.basePath = state.basePath;
        status.startTime = state.startTime;
        status.uptime = Date.now() - new Date(state.startTime).getTime();
        status.configFile = state.configFile ?? null;
        status.url = `http://${state.host === "0.0.0.0" ? "localhost" : state.host}:${state.port}`;
      }

      if (argv.format === "json") {
        logger.always(JSON.stringify(status, null, 2));
        return;
      }

      // Text format
      logger.always("");
      logger.always(chalk.bold.cyan("NeuroLink Server Status"));
      logger.always(chalk.gray("=".repeat(50)));
      logger.always("");

      if (status.running) {
        logger.always(
          `  ${chalk.bold("Status:")}     ${chalk.green("RUNNING")}`,
        );
        logger.always(
          `  ${chalk.bold("PID:")}        ${chalk.cyan(status.pid)}`,
        );
        logger.always(
          `  ${chalk.bold("URL:")}        ${chalk.cyan(status.url)}`,
        );
        logger.always(
          `  ${chalk.bold("Framework:")}  ${chalk.cyan(status.framework)}`,
        );
        logger.always(
          `  ${chalk.bold("Base Path:")}  ${chalk.cyan(status.basePath)}`,
        );
        logger.always(
          `  ${chalk.bold("Started:")}    ${chalk.cyan(status.startTime)}`,
        );
        logger.always(
          `  ${chalk.bold("Uptime:")}     ${chalk.cyan(formatUptime(status.uptime ?? 0))}`,
        );
        if (status.configFile) {
          logger.always(
            `  ${chalk.bold("Config:")}     ${chalk.cyan(status.configFile)}`,
          );
        }
      } else {
        logger.always(
          `  ${chalk.bold("Status:")}     ${chalk.yellow("NOT RUNNING")}`,
        );
        logger.always("");
        logger.always(chalk.gray("  Start the server with: neurolink serve"));
        logger.always(
          chalk.gray(
            "  Or with custom options: neurolink serve --port 8080 --framework express",
          ),
        );
      }

      logger.always("");
    } catch (error) {
      logger.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
      process.exit(1);
    }
  }
}

export default ServeCommandFactory;
