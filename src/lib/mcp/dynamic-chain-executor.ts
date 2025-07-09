/**
 * Dynamic AI Tool Chain Executor
 * Allows AI to dynamically decide tool execution sequences based on context and results
 */

import type { MCPOrchestrator } from "./orchestrator.js";
import type { MCPRegistry } from "./registry.js";
import type { NeuroLinkExecutionContext } from "./factory.js";
import { ErrorManager, ErrorCategory, ErrorSeverity } from "./error-manager.js";

/**
 * Tool execution result with metadata
 */
export interface ToolExecutionResult {
	toolName: string;
	success: boolean;
	result?: any;
	error?: Error;
	timestamp: number;
	executionTime: number;
	context?: Record<string, any>;
}

/**
 * Chain execution step
 */
export interface ChainStep {
	stepId: string;
	toolName: string;
	parameters: any;
	reasoning: string;
	confidence: number; // 0-1 scale
	expectedOutcome: string;
}

/**
 * Chain execution context
 */
export interface ChainExecutionContext {
	goal: string;
	currentStep: number;
	totalSteps?: number;
	executionHistory: ToolExecutionResult[];
	accumulatedContext: Record<string, any>;
	userContext?: NeuroLinkExecutionContext;
	maxSteps: number;
	aiModel?: string;
}

/**
 * Chain execution result
 */
export interface ChainExecutionResult {
	success: boolean;
	goal: string;
	totalSteps: number;
	executionTime: number;
	results: ToolExecutionResult[];
	finalResult?: any;
	reasoning: string;
	error?: Error;
	metadata: {
		toolsUsed: string[];
		averageConfidence: number;
		contextEvolution: Record<string, any>[];
	};
}

/**
 * AI Tool Chain Planner interface
 */
export interface AIChainPlanner {
	name: string;
	planNextStep(
		goal: string,
		availableTools: Array<{
			name: string;
			description: string;
			inputSchema: any;
		}>,
		executionHistory: ToolExecutionResult[],
		accumulatedContext: Record<string, any>,
	): Promise<ChainStep | null>;

	evaluateResult(
		step: ChainStep,
		result: ToolExecutionResult,
		goal: string,
	): Promise<{
		goalAchieved: boolean;
		confidence: number;
		nextAction: "continue" | "retry" | "abort" | "complete";
		reasoning: string;
	}>;
}

/**
 * Simple AI Chain Planner using heuristics
 */
export class HeuristicChainPlanner implements AIChainPlanner {
	name = "heuristic";

	async planNextStep(
		goal: string,
		availableTools: Array<{
			name: string;
			description: string;
			inputSchema: any;
		}>,
		executionHistory: ToolExecutionResult[],
		accumulatedContext: Record<string, any>,
	): Promise<ChainStep | null> {
		// Simple heuristic-based planning
		const usedTools = new Set(executionHistory.map((h) => h.toolName));
		const availableUnused = availableTools.filter(
			(t) => !usedTools.has(t.name),
		);

		if (availableUnused.length === 0) {
			return null; // No more tools to try
		}

		// Select tool based on goal keywords and context
		const goalLower = goal.toLowerCase();
		let selectedTool = availableUnused[0];
		let confidence = 0.3;

		// Keyword-based tool selection
		for (const tool of availableUnused) {
			const toolDesc = tool.description.toLowerCase();
			let toolConfidence = 0.3;

			// Check for keyword matches
			if (goalLower.includes("fetch") && toolDesc.includes("fetch")) {
				toolConfidence += 0.4;
			}
			if (goalLower.includes("process") && toolDesc.includes("process")) {
				toolConfidence += 0.4;
			}
			if (goalLower.includes("analyze") && toolDesc.includes("analy")) {
				toolConfidence += 0.4;
			}
			if (goalLower.includes("data") && toolDesc.includes("data")) {
				toolConfidence += 0.3;
			}

			if (toolConfidence > confidence) {
				confidence = toolConfidence;
				selectedTool = tool;
			}
		}

		// Generate parameters based on context and previous results
		const parameters = this.generateParameters(
			selectedTool,
			accumulatedContext,
			executionHistory,
		);

		return {
			stepId: `step-${Date.now()}`,
			toolName: selectedTool.name,
			parameters,
			reasoning: `Selected ${selectedTool.name} based on goal keywords and available context`,
			confidence: Math.min(confidence, 0.8),
			expectedOutcome: `Execute ${selectedTool.name} to progress towards: ${goal}`,
		};
	}

	async evaluateResult(
		step: ChainStep,
		result: ToolExecutionResult,
		goal: string,
	): Promise<{
		goalAchieved: boolean;
		confidence: number;
		nextAction: "continue" | "retry" | "abort" | "complete";
		reasoning: string;
	}> {
		if (!result.success) {
			return {
				goalAchieved: false,
				confidence: 0.1,
				nextAction: "retry",
				reasoning: `Tool ${step.toolName} failed: ${result.error?.message}"`,
			};
		}

		// Simple goal completion heuristic
		const goalKeywords = goal.toLowerCase().split(" ");
		const resultString = JSON.stringify(result.result || {}).toLowerCase();

		const matchedKeywords = goalKeywords.filter(
			(keyword) => resultString.includes(keyword) || keyword.length < 3,
		);

		const completionRatio = matchedKeywords.length / goalKeywords.length;
		const goalAchieved = completionRatio > 0.6;

		return {
			goalAchieved,
			confidence: completionRatio,
			nextAction: goalAchieved ? "complete" : "continue",
			reasoning: goalAchieved
				? `Goal appears achieved based on result content`
				: `Goal not yet achieved (${Math.round(completionRatio * 100)}% match), continuing`,
		};
	}

	private generateParameters(
		tool: { name: string; description: string; inputSchema: any },
		context: Record<string, any>,
		history: ToolExecutionResult[],
	): any {
		const params: any = {};

		// Extract useful data from previous results
		const lastResult = history[history.length - 1];
		if (lastResult?.result) {
			// Pass relevant data from previous step
			if (typeof lastResult.result === "object") {
				Object.assign(params, lastResult.result);
			} else if (typeof lastResult.result === "string") {
				params.input = lastResult.result;
			}
		}

		// Add context data
		Object.assign(params, context);

		return params;
	}
}

/**
 * Advanced AI Chain Planner using actual AI model
 */
export class AIModelChainPlanner implements AIChainPlanner {
	name = "ai-model";
	private aiModel: string;

	constructor(aiModel: string = "gpt-4") {
		this.aiModel = aiModel;
	}

	async planNextStep(
		goal: string,
		availableTools: Array<{
			name: string;
			description: string;
			inputSchema: any;
		}>,
		executionHistory: ToolExecutionResult[],
		accumulatedContext: Record<string, any>,
	): Promise<ChainStep | null> {
		const prompt = this.buildPlanningPrompt(
			goal,
			availableTools,
			executionHistory,
			accumulatedContext,
		);

		try {
			// This would integrate with actual AI service
			// For now, return a structured response format
			const aiResponse = await this.callAIModel(prompt);
			return this.parseAIResponse(aiResponse);
		} catch (error) {
			// Fallback to heuristic planning
			console.warn("AI planning failed, falling back to heuristic", error);
			const fallback = new HeuristicChainPlanner();
			return fallback.planNextStep(
				goal,
				availableTools,
				executionHistory,
				accumulatedContext,
			);
		}
	}

	async evaluateResult(
		step: ChainStep,
		result: ToolExecutionResult,
		goal: string,
	): Promise<{
		goalAchieved: boolean;
		confidence: number;
		nextAction: "continue" | "retry" | "abort" | "complete";
		reasoning: string;
	}> {
		const prompt = this.buildEvaluationPrompt(step, result, goal);

		try {
			const aiResponse = await this.callAIModel(prompt);
			return this.parseEvaluationResponse(aiResponse);
		} catch (error) {
			// Fallback to heuristic evaluation
			const fallback = new HeuristicChainPlanner();
			return fallback.evaluateResult(step, result, goal);
		}
	}

	private buildPlanningPrompt(
		goal: string,
		availableTools: Array<{
			name: string;
			description: string;
			inputSchema: any;
		}>,
		executionHistory: ToolExecutionResult[],
		accumulatedContext: Record<string, any>,
	): string {
		return `
You are an AI tool chain planner. Your job is to select the next tool to execute towards achieving a goal.

GOAL: ${goal}

AVAILABLE TOOLS:
${availableTools.map((t) => `- ${t.name}: ${t.description}`).join("\n")}

EXECUTION HISTORY:
${executionHistory.map((h) => `${h.toolName}: ${h.success ? "SUCCESS" : "FAILED"} - ${JSON.stringify(h.result || h.error?.message)}`).join("\n")}

ACCUMULATED CONTEXT:
${JSON.stringify(accumulatedContext, null, 2)}

Select the next tool to execute, or return null if the goal is achieved or no progress can be made.

Respond in JSON format:
{
  "toolName": "tool-name",
  "parameters": { /* tool parameters */ },
  "reasoning": "why this tool was selected",
  "confidence": 0.8,
  "expectedOutcome": "what this step should achieve"
}

If no tool should be executed, return: {"toolName": null}
`;
	}

	private buildEvaluationPrompt(
		step: ChainStep,
		result: ToolExecutionResult,
		goal: string,
	): string {
		return `
Evaluate whether the goal has been achieved after executing a tool.

GOAL: ${goal}

EXECUTED STEP:
Tool: ${step.toolName}
Reasoning: ${step.reasoning}
Expected: ${step.expectedOutcome}

ACTUAL RESULT:
Success: ${result.success}
Result: ${JSON.stringify(result.result || result.error?.message)}

Respond in JSON format:
{
  "goalAchieved": true/false,
  "confidence": 0.8,
  "nextAction": "continue"|"retry"|"abort"|"complete",
  "reasoning": "explanation of evaluation"
}
`;
	}

	private async callAIModel(prompt: string): Promise<string> {
		// Mock AI response for now
		// In real implementation, this would call the actual AI service
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Return mock structured response
		if (prompt.includes("Select the next tool")) {
			return JSON.stringify({
				toolName: "mock-tool",
				parameters: { input: "mock" },
				reasoning: "Mock AI selection",
				confidence: 0.7,
				expectedOutcome: "Mock execution",
			});
		} else {
			return JSON.stringify({
				goalAchieved: false,
				confidence: 0.6,
				nextAction: "continue",
				reasoning: "Mock AI evaluation",
			});
		}
	}

	private parseAIResponse(response: string): ChainStep | null {
		try {
			const parsed = JSON.parse(response);
			if (!parsed.toolName) {
				return null;
			}

			return {
				stepId: `ai-step-${Date.now()}`,
				toolName: parsed.toolName,
				parameters: parsed.parameters || {},
				reasoning: parsed.reasoning || "AI selected tool",
				confidence: parsed.confidence || 0.5,
				expectedOutcome: parsed.expectedOutcome || "Execute tool",
			};
		} catch (error) {
			console.warn("Failed to parse AI response", error);
			return null;
		}
	}

	private parseEvaluationResponse(response: string): {
		goalAchieved: boolean;
		confidence: number;
		nextAction: "continue" | "retry" | "abort" | "complete";
		reasoning: string;
	} {
		try {
			const parsed = JSON.parse(response);
			return {
				goalAchieved: parsed.goalAchieved || false,
				confidence: parsed.confidence || 0.5,
				nextAction: parsed.nextAction || "continue",
				reasoning: parsed.reasoning || "AI evaluation",
			};
		} catch (error) {
			return {
				goalAchieved: false,
				confidence: 0.3,
				nextAction: "continue",
				reasoning: "Failed to parse AI evaluation",
			};
		}
	}
}

/**
 * Dynamic Chain Executor
 */
export class DynamicChainExecutor {
	private orchestrator: MCPOrchestrator;
	private registry: MCPRegistry;
	private errorManager: ErrorManager;
	private planner: AIChainPlanner;

	constructor(
		orchestrator: MCPOrchestrator,
		registry: MCPRegistry,
		errorManager: ErrorManager,
		planner?: AIChainPlanner,
	) {
		this.orchestrator = orchestrator;
		this.registry = registry;
		this.errorManager = errorManager;
		this.planner = planner || new HeuristicChainPlanner();
	}

	/**
	 * Execute dynamic tool chain to achieve a goal
	 *
	 * @param goal The goal to achieve
	 * @param initialContext Initial context data
	 * @param userContext User execution context
	 * @param options Execution options
	 * @returns Chain execution result
	 */
	async executeChain(
		goal: string,
		initialContext: Record<string, any> = {},
		userContext?: NeuroLinkExecutionContext,
		options: {
			maxSteps?: number;
			aiModel?: string;
			timeout?: number;
		} = {},
	): Promise<ChainExecutionResult> {
		const startTime = Date.now();
		const maxSteps = options.maxSteps || 10;

		const executionContext: ChainExecutionContext = {
			goal,
			currentStep: 0,
			executionHistory: [],
			accumulatedContext: { ...initialContext },
			userContext,
			maxSteps,
			aiModel: options.aiModel,
		};

		try {
			const result = await this.executeChainSteps(executionContext);

			return {
				success: true,
				goal,
				totalSteps: result.executionHistory.length,
				executionTime: Date.now() - startTime,
				results: result.executionHistory,
				finalResult:
					result.executionHistory[result.executionHistory.length - 1]?.result,
				reasoning: "Chain execution completed",
				metadata: {
					toolsUsed: [
						...new Set(result.executionHistory.map((h) => h.toolName)),
					],
					averageConfidence: this.calculateAverageConfidence(
						result.executionHistory,
					),
					contextEvolution: this.trackContextEvolution(result.executionHistory),
				},
			};
		} catch (error) {
			await this.errorManager.recordError(error, {
				category: ErrorCategory.TOOL_ERROR,
				severity: ErrorSeverity.HIGH,
				toolName: "dynamic-chain-executor",
				executionContext: userContext,
			});

			return {
				success: false,
				goal,
				totalSteps: executionContext.executionHistory.length,
				executionTime: Date.now() - startTime,
				results: executionContext.executionHistory,
				error: error instanceof Error ? error : new Error(String(error)),
				reasoning: `Chain execution failed: ${error}`,
				metadata: {
					toolsUsed: [
						...new Set(
							executionContext.executionHistory.map((h) => h.toolName),
						),
					],
					averageConfidence: this.calculateAverageConfidence(
						executionContext.executionHistory,
					),
					contextEvolution: this.trackContextEvolution(
						executionContext.executionHistory,
					),
				},
			};
		}
	}

	/**
	 * Execute chain steps iteratively
	 *
	 * @private
	 */
	private async executeChainSteps(
		context: ChainExecutionContext,
	): Promise<ChainExecutionContext> {
		const availableTools = await this.registry.listTools();

		while (context.currentStep < context.maxSteps) {
			// Plan next step
			const nextStep = await this.planner.planNextStep(
				context.goal,
				availableTools.map((tool) => ({
					name: tool.name,
					description: tool.description || "No description available",
					inputSchema: tool.inputSchema || {},
				})),
				context.executionHistory,
				context.accumulatedContext,
			);

			if (!nextStep) {
				// No more steps to execute
				break;
			}

			// Execute the planned step
			const stepResult = await this.executeStep(nextStep, context);
			context.executionHistory.push(stepResult);

			// Update accumulated context
			if (stepResult.success && stepResult.result) {
				this.updateAccumulatedContext(
					context.accumulatedContext,
					stepResult.result,
				);
			}

			// Evaluate if goal is achieved
			const evaluation = await this.planner.evaluateResult(
				nextStep,
				stepResult,
				context.goal,
			);

			if (evaluation.goalAchieved || evaluation.nextAction === "complete") {
				break;
			} else if (evaluation.nextAction === "abort") {
				throw new Error(`Chain execution aborted: ${evaluation.reasoning}`);
			} else if (evaluation.nextAction === "retry" && context.currentStep > 0) {
				// Retry logic could be implemented here
				console.warn(`Step retry suggested: ${evaluation.reasoning}`);
			}

			context.currentStep++;
		}

		return context;
	}

	/**
	 * Execute a single step
	 *
	 * @private
	 */
	private async executeStep(
		step: ChainStep,
		context: ChainExecutionContext,
	): Promise<ToolExecutionResult> {
		const startTime = Date.now();

		try {
			const result = await this.orchestrator.executeTool(
				step.toolName,
				step.parameters,
				context.userContext,
			);

			return {
				toolName: step.toolName,
				success: true,
				result,
				timestamp: Date.now(),
				executionTime: Date.now() - startTime,
				context: {
					stepId: step.stepId,
					reasoning: step.reasoning,
					confidence: step.confidence,
				},
			};
		} catch (error) {
			return {
				toolName: step.toolName,
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
				timestamp: Date.now(),
				executionTime: Date.now() - startTime,
				context: {
					stepId: step.stepId,
					reasoning: step.reasoning,
					confidence: step.confidence,
				},
			};
		}
	}

	/**
	 * Update accumulated context with new result
	 *
	 * @private
	 */
	private updateAccumulatedContext(
		context: Record<string, any>,
		result: any,
	): void {
		if (typeof result === "object" && result !== null) {
			Object.assign(context, result);
		} else {
			context.lastResult = result;
		}

		context.lastUpdated = Date.now();
	}

	/**
	 * Calculate average confidence across execution history
	 *
	 * @private
	 */
	private calculateAverageConfidence(history: ToolExecutionResult[]): number {
		if (history.length === 0) {
			return 0;
		}

		const confidences = history
			.map((h) => h.context?.confidence || 0.5)
			.filter((c) => typeof c === "number");

		return confidences.length > 0
			? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
			: 0.5;
	}

	/**
	 * Track context evolution through execution
	 *
	 * @private
	 */
	private trackContextEvolution(
		history: ToolExecutionResult[],
	): Record<string, any>[] {
		const evolution: Record<string, any>[] = [];

		history.forEach((result) => {
			if (result.success && result.result) {
				evolution.push({
					step: result.toolName,
					timestamp: result.timestamp,
					dataKeys:
						typeof result.result === "object"
							? Object.keys(result.result)
							: ["primitive"],
				});
			}
		});

		return evolution;
	}

	/**
	 * Set AI planner
	 *
	 * @param planner AI chain planner instance
	 */
	setPlanner(planner: AIChainPlanner): void {
		this.planner = planner;
	}

	/**
	 * Get current planner
	 *
	 * @returns Current AI chain planner
	 */
	getPlanner(): AIChainPlanner {
		return this.planner;
	}
}

/**
 * Default dynamic chain executor instance
 */
export let defaultDynamicChainExecutor: DynamicChainExecutor | null = null;

/**
 * Initialize default dynamic chain executor
 *
 * @param orchestrator MCP orchestrator
 * @param registry Tool registry
 * @param errorManager Error manager
 * @param planner Optional AI planner
 * @returns Dynamic chain executor instance
 */
export function initializeDynamicChainExecutor(
	orchestrator: MCPOrchestrator,
	registry: MCPRegistry,
	errorManager: ErrorManager,
	planner?: AIChainPlanner,
): DynamicChainExecutor {
	defaultDynamicChainExecutor = new DynamicChainExecutor(
		orchestrator,
		registry,
		errorManager,
		planner,
	);
	return defaultDynamicChainExecutor;
}
