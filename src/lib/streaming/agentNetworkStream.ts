/**
 * Agent Network Stream
 *
 * Provides streaming support for multi-agent orchestration scenarios where
 * multiple agents collaborate to accomplish tasks. Uses the standard
 * StreamResult pattern for input and output.
 *
 * Each orchestration mode takes agent factories that return StreamResult
 * and produces a combined StreamResult as output.
 *
 * @module streaming/agentNetworkStream
 */

import { nanoid } from "nanoid";
import type { TokenUsage } from "../types/analytics.js";
import type { StreamResult } from "../types/streamTypes.js";
import { logger } from "../utils/logger.js";

// ============================================
// AGENT NETWORK TYPES
// ============================================

/**
 * An agent in the network, defined by a name and a factory
 * that produces a StreamResult when invoked.
 */
export type AgentEntry = {
  /** Agent name (used for identification in metadata) */
  name: string;
  /** Factory function that returns a StreamResult when called */
  factory: () => Promise<StreamResult>;
};

/**
 * Agent execution result (internal tracking)
 */
export type AgentResult = {
  /** Agent name */
  agentName: string;
  /** Result text accumulated from the stream */
  text: string;
  /** Token usage (if reported by the agent's StreamResult) */
  usage: TokenUsage | null;
  /** Finish reason */
  finishReason: string;
  /** Execution time in ms */
  executionTime: number;
  /** Error if any */
  error?: Error;
};

/**
 * Network orchestration mode
 */
export type OrchestrationMode =
  | "sequential" // Agents run one after another
  | "parallel" // Agents run simultaneously
  | "hierarchical" // Main agent delegates to sub-agents
  | "round-robin" // Agents take turns
  | "voting"; // Agents vote on best response

/**
 * Agent network configuration
 */
export type AgentNetworkConfig = {
  /** Network ID */
  networkId?: string;
  /** Orchestration mode */
  mode: OrchestrationMode;
  /** Maximum rounds of communication (for round-robin) */
  maxRounds?: number;
  /** Aggregation function for parallel/voting results */
  aggregator?: (results: AgentResult[]) => string;
  /** Custom router for hierarchical mode - returns indices of agents to use */
  router?: (agents: AgentEntry[]) => number[];
};

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK_CONFIG: AgentNetworkConfig = {
  mode: "sequential",
  maxRounds: 3,
};

// ============================================
// MASTRA AGENT NETWORK STREAM
// ============================================

/**
 * MastraAgentNetworkStream - Multi-agent orchestration returning StreamResult
 *
 * @example Sequential agent chain
 * ```typescript
 * const network = new MastraAgentNetworkStream({ mode: "sequential" });
 *
 * const result = await network.execute([
 *   { name: "researcher", factory: () => neurolink.stream({ input: { text: "Research AI" } }) },
 *   { name: "writer", factory: () => neurolink.stream({ input: { text: "Write about AI" } }) },
 * ]);
 *
 * for await (const chunk of result.stream) {
 *   process.stdout.write(chunk.content);
 * }
 * ```
 *
 * @example Parallel execution
 * ```typescript
 * const network = new MastraAgentNetworkStream({ mode: "parallel" });
 * const result = await network.execute(agents);
 * // result.stream yields { content } chunks from all agents
 * // result.metadata.agents has per-agent details
 * ```
 */
export class MastraAgentNetworkStream {
  private readonly config: AgentNetworkConfig;
  private readonly networkId: string;
  private results: AgentResult[] = [];

  constructor(config: Partial<AgentNetworkConfig> = {}) {
    this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };
    this.networkId = this.config.networkId ?? nanoid();
  }

  /**
   * Execute the agent network and return a StreamResult.
   *
   * @param agents - Array of agent entries with name and factory
   * @returns StreamResult with combined stream from all agents
   */
  async execute(agents: AgentEntry[]): Promise<StreamResult> {
    if (agents.length === 0) {
      return this.emptyResult();
    }

    this.results = [];

    switch (this.config.mode) {
      case "sequential":
        return this.executeSequential(agents);
      case "parallel":
        return this.executeParallel(agents);
      case "hierarchical":
        return this.executeHierarchical(agents);
      case "round-robin":
        return this.executeRoundRobin(agents);
      case "voting":
        return this.executeVoting(agents);
      default:
        return this.executeSequential(agents);
    }
  }

  /**
   * Get network ID
   */
  getNetworkId(): string {
    return this.networkId;
  }

  /**
   * Get all results after execution
   */
  getResults(): AgentResult[] {
    return [...this.results];
  }

  /**
   * Reset network state
   */
  reset(): void {
    this.results = [];
  }

  // ============================================
  // EXECUTION MODES
  // ============================================

  /**
   * Sequential execution - agents run one after another.
   * The output stream yields { content } chunks from each agent in order.
   */
  private async executeSequential(agents: AgentEntry[]): Promise<StreamResult> {
    const self = this;

    const stream = (async function* () {
      for (const agent of agents) {
        const startTime = Date.now();
        let accumulatedText = "";
        let agentFinishReason = "stop";
        let agentUsage: TokenUsage | null = null;

        try {
          const agentResult = await agent.factory();
          agentFinishReason =
            typeof agentResult.finishReason === "string"
              ? agentResult.finishReason
              : ((await agentResult.finishReason) ?? "stop");

          for await (const chunk of agentResult.stream) {
            if ("content" in chunk && typeof chunk.content === "string") {
              accumulatedText += chunk.content;
              yield { content: chunk.content };
            }
          }

          if (agentResult.usage) {
            agentUsage =
              agentResult.usage instanceof Promise
                ? await agentResult.usage
                : agentResult.usage;
          }
        } catch (error) {
          agentFinishReason = "error";
          logger.error(`Agent ${agent.name} failed in sequential execution`, {
            error,
          });
        }

        self.results.push({
          agentName: agent.name,
          text: accumulatedText,
          usage: agentUsage,
          finishReason: agentFinishReason,
          executionTime: Date.now() - startTime,
        });
      }
    })();

    return this.buildResult(stream, agents);
  }

  /**
   * Parallel execution - agents run simultaneously.
   * All agent factories are invoked at once, then their streams
   * are interleaved in the output.
   */
  private async executeParallel(agents: AgentEntry[]): Promise<StreamResult> {
    const self = this;

    // Launch all agent factories concurrently
    const agentStreamResults = await Promise.all(
      agents.map(async (agent) => {
        const startTime = Date.now();
        try {
          const result = await agent.factory();
          return { agent, result, startTime, error: null as Error | null };
        } catch (error) {
          return {
            agent,
            result: null as StreamResult | null,
            startTime,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      }),
    );

    const stream = (async function* () {
      // Build iterators for all successful agents
      const iterators: Array<{
        agent: AgentEntry;
        iterator: AsyncIterator<Record<string, unknown>>;
        done: boolean;
        accumulated: string;
        startTime: number;
        result: StreamResult;
      }> = [];

      for (const entry of agentStreamResults) {
        if (entry.error || !entry.result) {
          self.results.push({
            agentName: entry.agent.name,
            text: "",
            usage: null,
            finishReason: "error",
            executionTime: Date.now() - entry.startTime,
            error: entry.error ?? new Error("No result"),
          });
          continue;
        }

        const iterable = entry.result.stream as AsyncIterable<
          Record<string, unknown>
        >;
        iterators.push({
          agent: entry.agent,
          iterator: iterable[Symbol.asyncIterator](),
          done: false,
          accumulated: "",
          startTime: entry.startTime,
          result: entry.result,
        });
      }

      // Round-robin through all iterators
      while (iterators.some((it) => !it.done)) {
        for (const it of iterators) {
          if (it.done) {
            continue;
          }

          const next = await it.iterator.next();
          if (next.done) {
            it.done = true;

            let agentUsage: TokenUsage | null = null;
            if (it.result.usage) {
              agentUsage =
                it.result.usage instanceof Promise
                  ? await it.result.usage
                  : it.result.usage;
            }

            self.results.push({
              agentName: it.agent.name,
              text: it.accumulated,
              usage: agentUsage,
              finishReason: "stop",
              executionTime: Date.now() - it.startTime,
            });
            continue;
          }

          const chunk = next.value;
          if ("content" in chunk && typeof chunk.content === "string") {
            it.accumulated += chunk.content;
            yield { content: chunk.content };
          }
        }
      }
    })();

    return this.buildResult(stream, agents);
  }

  /**
   * Hierarchical execution - first agent is orchestrator, rest are workers.
   * The orchestrator runs first, then selected workers run.
   */
  private async executeHierarchical(
    agents: AgentEntry[],
  ): Promise<StreamResult> {
    if (agents.length <= 1) {
      return this.executeSequential(agents);
    }

    const orchestrator = agents[0];
    const workers = agents.slice(1);

    // Determine which workers to use
    const selectedWorkers = this.config.router
      ? this.config
          .router(workers)
          .map((i) => workers[i])
          .filter(Boolean)
      : workers;

    // Execute orchestrator first, then selected workers
    const orderedAgents = [orchestrator, ...selectedWorkers];
    return this.executeSequential(orderedAgents);
  }

  /**
   * Round-robin execution - agents take turns for maxRounds rounds.
   */
  private async executeRoundRobin(agents: AgentEntry[]): Promise<StreamResult> {
    const self = this;
    const maxRounds = this.config.maxRounds ?? 3;

    const stream = (async function* () {
      for (let round = 0; round < maxRounds; round++) {
        for (const agent of agents) {
          const startTime = Date.now();
          let accumulatedText = "";
          let agentFinishReason = "stop";
          let agentUsage: TokenUsage | null = null;

          try {
            const agentResult = await agent.factory();
            agentFinishReason =
              typeof agentResult.finishReason === "string"
                ? agentResult.finishReason
                : ((await agentResult.finishReason) ?? "stop");

            for await (const chunk of agentResult.stream) {
              if ("content" in chunk && typeof chunk.content === "string") {
                accumulatedText += chunk.content;
                yield { content: chunk.content };
              }
            }

            if (agentResult.usage) {
              agentUsage =
                agentResult.usage instanceof Promise
                  ? await agentResult.usage
                  : agentResult.usage;
            }
          } catch (error) {
            agentFinishReason = "error";
            logger.error(
              `Agent ${agent.name} failed in round-robin execution`,
              { error },
            );
          }

          self.results.push({
            agentName: agent.name,
            text: accumulatedText,
            usage: agentUsage,
            finishReason: agentFinishReason,
            executionTime: Date.now() - startTime,
          });
        }
      }
    })();

    return this.buildResult(stream, agents);
  }

  /**
   * Voting execution - all agents run in parallel, then the best result
   * is selected via the aggregator (or default: longest response wins).
   */
  private async executeVoting(agents: AgentEntry[]): Promise<StreamResult> {
    // First, run all agents in parallel and collect full results
    const parallelResult = await this.executeParallel(agents);

    // Consume the parallel stream to populate this.results

    for await (const _chunk of parallelResult.stream) {
      // drain
    }

    // Aggregate results
    const aggregatedText = this.config.aggregator
      ? this.config.aggregator(this.results)
      : this.defaultAggregator(this.results);

    // Build a new stream with the aggregated text
    const stream = (async function* () {
      yield { content: aggregatedText };
    })();

    return this.buildResult(stream, agents);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Default result aggregator: picks the longest response.
   */
  private defaultAggregator(results: AgentResult[]): string {
    if (results.length === 0) {
      return "";
    }
    if (results.length === 1) {
      return results[0].text;
    }

    return results.reduce((best, current) =>
      current.text.length > best.text.length ? current : best,
    ).text;
  }

  /**
   * Build a StreamResult from an async iterable stream and agent list.
   */
  private buildResult(
    stream: AsyncIterable<{ content: string }>,
    agents: AgentEntry[],
  ): StreamResult {
    return {
      stream,
      provider: "agent-network",
      model: `network-${this.config.mode}`,
      metadata: {
        streamId: this.networkId,
        startTime: Date.now(),
        agents: agents.map((a) => a.name),
        mode: this.config.mode,
      } as StreamResult["metadata"] & {
        agents: string[];
        mode: string;
      },
    };
  }

  /**
   * Return an empty StreamResult.
   */
  private emptyResult(): StreamResult {
    return {
      stream: (async function* () {
        /* empty */
      })(),
      provider: "agent-network",
      model: `network-${this.config.mode}`,
      metadata: {
        streamId: this.networkId,
        startTime: Date.now(),
      },
    };
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create an agent network stream
 */
export function createAgentNetworkStream(
  config?: Partial<AgentNetworkConfig>,
): MastraAgentNetworkStream {
  return new MastraAgentNetworkStream(config);
}
