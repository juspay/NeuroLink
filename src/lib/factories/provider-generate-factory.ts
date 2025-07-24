import type {
  GenerateOptions,
  GenerateResult,
  EnhancedProvider,
} from "../types/generate-types.js";
import type {
  AIProvider,
  TextGenerationOptions,
  EnhancedGenerateResult,
} from "../core/types.js";
import { CompatibilityConversionFactory } from "./compatibility-factory.js";

/**
 * Factory for enhancing providers with generate() capability using Proxy pattern
 * Maintains 100% backward compatibility while adding new generate method
 */
export class ProviderGenerateFactory {
  /**
   * Enhance any provider with generate() method using TypeScript Proxy
   */
  static enhanceProvider<T extends AIProvider>(
    provider: T,
  ): T & EnhancedProvider {
    return new Proxy(provider, {
      get(target, prop, receiver) {
        if (prop === "generate") {
          return ProviderGenerateFactory.createGenerateMethod(target);
        }
        return Reflect.get(target, prop, receiver);
      },

      has(target, prop) {
        if (prop === "generate") {
          return true;
        }
        return Reflect.has(target, prop);
      },
    }) as T & EnhancedProvider;
  }

  /**
   * Create the generate() method that internally uses generateText for performance parity
   */
  private static createGenerateMethod(provider: AIProvider) {
    return async (options: GenerateOptions): Promise<GenerateResult> => {
      // Validate input
      if (!options.input?.text) {
        throw new Error("Generate options must include input.text");
      }

      // Convert GenerateOptions to TextGenerationOptions
      const textOptions: TextGenerationOptions =
        CompatibilityConversionFactory.convertGenerateToText_Options(options);

      try {
        // Use existing generate method for identical performance
        const textResult: EnhancedGenerateResult | null =
          await provider.generate(textOptions);

        if (!textResult) {
          throw new Error("Generate method returned null result");
        }

        // Convert back to GenerateResult format with type safety
        const generateResult: GenerateResult = {
          content: textResult.content || "",
          outputs: { text: textResult.content || "" },
          provider: textResult.provider,
          model: textResult.model,
          usage: textResult.usage
            ? {
                inputTokens: textResult.usage.inputTokens || 0,
                outputTokens: textResult.usage.outputTokens || 0,
                totalTokens: textResult.usage.totalTokens || 0,
              }
            : undefined,
          responseTime: textResult.responseTime,
          toolsUsed: textResult.toolsUsed,
          toolExecutions: textResult.toolExecutions?.map((te) => {
            const toolExecution = te as unknown as {
              toolName?: string;
              name?: string;
              input?: Record<string, unknown>;
              output?: unknown;
              result?: unknown;
              executionTime?: number;
              duration?: number;
            };
            return {
              name: toolExecution.toolName || toolExecution.name || "",
              input: toolExecution.input || {},
              output: toolExecution.output || toolExecution.result,
              duration:
                toolExecution.executionTime || toolExecution.duration || 0,
            };
          }),
          enhancedWithTools: textResult.enhancedWithTools,
          availableTools: textResult.availableTools?.map((at) => ({
            name: at.name || "",
            description: at.description || "",
            parameters: at.parameters || {},
          })),
          analytics: textResult.analytics,
          evaluation: textResult.evaluation,
        };

        return generateResult;
      } catch (error) {
        throw new Error(`Generate method failed: ${error}`);
      }
    };
  }

  /**
   * Enhance all providers from a registry
   */
  static enhanceAllProviders(
    providers: Map<string, AIProvider>,
  ): Map<string, AIProvider & EnhancedProvider> {
    const enhancedProviders = new Map<string, AIProvider & EnhancedProvider>();

    for (const [name, provider] of providers) {
      enhancedProviders.set(name, this.enhanceProvider(provider));
    }

    return enhancedProviders;
  }
}
