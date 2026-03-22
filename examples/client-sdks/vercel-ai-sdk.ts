#!/usr/bin/env node
/**
 * Vercel AI SDK Integration Example
 *
 * Demonstrates using NeuroLink as a provider for the Vercel AI SDK.
 * Shows drop-in compatibility with all AI SDK functions and React hooks.
 *
 * Features:
 * - generateText with NeuroLink provider
 * - streamText with streaming responses
 * - generateObject with structured output
 * - React hooks (useChat, useCompletion)
 * - Next.js API routes integration
 * - Multi-provider support
 * - Tool calling with AI SDK
 *
 * @usage npx tsx examples/client-sdks/vercel-ai-sdk.ts
 */

import { fileURLToPath } from "url";
import { generateText, streamText, generateObject } from "ai";
import { createNeuroLinkProvider, neurolink } from "@juspay/neurolink/client";
import { z } from "zod";

// =============================================================================
// Provider Setup
// =============================================================================

// Create NeuroLink provider
const neurolinkProvider = createNeuroLinkProvider({
  baseUrl: process.env.NEUROLINK_BASE_URL || "http://localhost:3000",
  apiKey: process.env.NEUROLINK_API_KEY,
  defaultProvider: "openai",
  defaultModel: "gpt-4o",
  headers: {
    "X-Client-Name": "ai-sdk-example",
  },
});

// Alternative: using the neurolink helper
const neuro = neurolink({
  baseUrl: process.env.NEUROLINK_BASE_URL || "http://localhost:3000",
  apiKey: process.env.NEUROLINK_API_KEY,
});

// =============================================================================
// Example 1: Basic Text Generation
// =============================================================================

export async function basicGenerationExample() {
  console.log("=== Basic Text Generation Example ===\n");

  // Generate text with OpenAI via NeuroLink
  const result = await generateText({
    model: neurolinkProvider("gpt-4o"),
    prompt: "Explain quantum computing in simple terms",
    temperature: 0.7,
    maxTokens: 500,
  });

  console.log("Generated text:");
  console.log(result.text);
  console.log("\nUsage:", result.usage);
  console.log("Finish reason:", result.finishReason);
  console.log("\n");
}

// =============================================================================
// Example 2: Multi-Provider Support
// =============================================================================

export async function multiProviderExample() {
  console.log("=== Multi-Provider Example ===\n");

  // OpenAI
  const openaiResult = await generateText({
    model: neurolinkProvider("gpt-4o", { provider: "openai" }),
    prompt: "Write a haiku about coding",
  });

  console.log("OpenAI Response:");
  console.log(openaiResult.text);
  console.log("\n");

  // Anthropic Claude
  const claudeResult = await generateText({
    model: neurolinkProvider("claude-3-5-sonnet", { provider: "anthropic" }),
    prompt: "Write a haiku about coding",
  });

  console.log("Claude Response:");
  console.log(claudeResult.text);
  console.log("\n");

  // Google Gemini
  const geminiResult = await generateText({
    model: neurolinkProvider("gemini-2.0-flash", { provider: "google-ai" }),
    prompt: "Write a haiku about coding",
  });

  console.log("Gemini Response:");
  console.log(geminiResult.text);
  console.log("\n");
}

// =============================================================================
// Example 3: Streaming Text
// =============================================================================

export async function streamingExample() {
  console.log("=== Streaming Text Example ===\n");

  const { textStream, fullStream } = await streamText({
    model: neurolinkProvider("claude-3-5-sonnet", { provider: "anthropic" }),
    prompt: "Write a short story about a robot learning to paint",
    temperature: 0.8,
  });

  console.log("Streaming response:\n");

  // Option 1: Consume text stream
  for await (const chunk of textStream) {
    process.stdout.write(chunk);
  }

  console.log("\n\n");
}

export async function streamingWithMetadataExample() {
  console.log("=== Streaming with Metadata Example ===\n");

  const { fullStream } = await streamText({
    model: neurolinkProvider("gpt-4o"),
    prompt: "Explain machine learning",
  });

  console.log("Streaming with metadata:\n");

  for await (const part of fullStream) {
    if (part.type === "text-delta") {
      process.stdout.write(part.textDelta);
    } else if (part.type === "finish") {
      console.log("\n\nFinish reason:", part.finishReason);
      console.log("Usage:", part.usage);
    }
  }

  console.log("\n");
}

// =============================================================================
// Example 4: Structured Output (generateObject)
// =============================================================================

export async function structuredOutputExample() {
  console.log("=== Structured Output Example ===\n");

  // Define schema
  const recipeSchema = z.object({
    recipe: z.object({
      name: z.string().describe("Name of the recipe"),
      description: z.string().describe("Brief description"),
      ingredients: z
        .array(
          z.object({
            name: z.string(),
            amount: z.string(),
            unit: z.string(),
          }),
        )
        .describe("List of ingredients"),
      steps: z.array(z.string()).describe("Cooking steps"),
      cookingTime: z.number().describe("Total cooking time in minutes"),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
  });

  // Generate structured output
  const result = await generateObject({
    model: neurolinkProvider("gpt-4o"),
    schema: recipeSchema,
    prompt: "Generate a recipe for chocolate chip cookies",
  });

  console.log("Generated Recipe:");
  console.log(JSON.stringify(result.object, null, 2));
  console.log("\nUsage:", result.usage);
  console.log("\n");
}

export async function structuredArrayExample() {
  console.log("=== Structured Array Example ===\n");

  const taskSchema = z.object({
    tasks: z.array(
      z.object({
        id: z.number(),
        title: z.string(),
        description: z.string(),
        priority: z.enum(["low", "medium", "high"]),
        estimatedHours: z.number(),
      }),
    ),
  });

  const result = await generateObject({
    model: neurolinkProvider("gpt-4o"),
    schema: taskSchema,
    prompt:
      "Generate 5 tasks for building a todo app with React and TypeScript",
  });

  console.log("Generated Tasks:");
  result.object.tasks.forEach((task, i) => {
    console.log(`\n${i + 1}. ${task.title}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Estimated: ${task.estimatedHours}h`);
    console.log(`   ${task.description}`);
  });
  console.log("\n");
}

// =============================================================================
// Example 5: Messages & Conversations
// =============================================================================

export async function conversationExample() {
  console.log("=== Conversation Example ===\n");

  const result = await generateText({
    model: neurolinkProvider("claude-3-5-sonnet"),
    messages: [
      {
        role: "user",
        content: "What is React?",
      },
      {
        role: "assistant",
        content:
          "React is a JavaScript library for building user interfaces, particularly web applications. It was developed by Facebook and is maintained by Facebook and a community of developers.",
      },
      {
        role: "user",
        content: "Tell me more about React hooks",
      },
    ],
  });

  console.log("Response:");
  console.log(result.text);
  console.log("\n");
}

export async function systemPromptExample() {
  console.log("=== System Prompt Example ===\n");

  const result = await generateText({
    model: neurolinkProvider("gpt-4o"),
    system:
      "You are a helpful coding assistant who explains concepts using analogies and examples.",
    prompt: "Explain async/await in JavaScript",
  });

  console.log("Response:");
  console.log(result.text);
  console.log("\n");
}

// =============================================================================
// Example 6: Tool Calling (Function Calling)
// =============================================================================

export async function toolCallingExample() {
  console.log("=== Tool Calling Example ===\n");

  const tools = {
    getCurrentWeather: {
      description: "Get the current weather for a location",
      parameters: z.object({
        location: z.string().describe("City and state, e.g. San Francisco, CA"),
        unit: z.enum(["celsius", "fahrenheit"]).optional(),
      }),
      execute: async ({ location, unit = "fahrenheit" }) => {
        console.log(`\n🔧 Calling getCurrentWeather(${location}, ${unit})`);
        // Simulate API call
        return {
          location,
          temperature: Math.floor(Math.random() * 30) + 50,
          unit,
          conditions: "Partly cloudy",
        };
      },
    },
    getLocationInfo: {
      description: "Get information about a location",
      parameters: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        console.log(`\n🔧 Calling getLocationInfo(${location})`);
        return {
          location,
          population: "883,305",
          timezone: "America/Los_Angeles",
          coordinates: { lat: 37.7749, lon: -122.4194 },
        };
      },
    },
  };

  const result = await generateText({
    model: neurolinkProvider("gpt-4o"),
    tools,
    prompt: "What is the weather in San Francisco?",
  });

  console.log("\nFinal Response:");
  console.log(result.text);
  console.log("\n");
}

// =============================================================================
// Example 7: Next.js API Routes
// =============================================================================

/*
// app/api/chat/route.ts (Next.js App Router)
import { StreamingTextResponse, streamText } from 'ai';
import { createNeuroLinkProvider } from '@juspay/neurolink/client';

const neurolink = createNeuroLinkProvider({
  baseUrl: process.env.NEUROLINK_BASE_URL!,
  apiKey: process.env.NEUROLINK_API_KEY!,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: neurolink('gpt-4o'),
    messages,
  });

  return new StreamingTextResponse(result.textStream);
}
*/

/**
 * Next.js Pages Router Example
 */
export const nextjsPagesRouterExample = `
// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { streamText } from 'ai';
import { createNeuroLinkProvider } from '@juspay/neurolink/client';

const neurolink = createNeuroLinkProvider({
  baseUrl: process.env.NEUROLINK_BASE_URL!,
  apiKey: process.env.NEUROLINK_API_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messages } = req.body;

  const result = await streamText({
    model: neurolink('gpt-4o'),
    messages,
  });

  // Stream response
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
  });

  for await (const chunk of result.textStream) {
    res.write(chunk);
  }

  res.end();
}
`;

// =============================================================================
// Example 8: React Hooks Usage
// =============================================================================

/**
 * React useChat Hook Example
 */
export const reactUseChatExample = `
// app/chat/page.tsx
'use client';

import { useChat } from 'ai/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={m.role}>
            {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
`;

/**
 * React useCompletion Hook Example
 */
export const reactUseCompletionExample = `
// app/completion/page.tsx
'use client';

import { useCompletion } from 'ai/react';

export default function CompletionPage() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useCompletion({
    api: '/api/completion',
  });

  return (
    <div>
      <div className="output">
        {completion || 'Start typing to see completion...'}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Start writing..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Complete'}
        </button>
      </form>
    </div>
  );
}
`;

// =============================================================================
// Example 9: Advanced Configuration
// =============================================================================

export async function advancedConfigurationExample() {
  console.log("=== Advanced Configuration Example ===\n");

  // Custom configuration with middleware
  const customProvider = createNeuroLinkProvider({
    baseUrl: process.env.NEUROLINK_BASE_URL || "http://localhost:3000",
    apiKey: process.env.NEUROLINK_API_KEY,
    defaultProvider: "anthropic",
    defaultModel: "claude-3-5-sonnet",
    headers: {
      "X-Client-Name": "advanced-example",
      "X-Client-Version": "1.0.0",
    },
  });

  const result = await generateText({
    model: customProvider("claude-3-5-sonnet"),
    prompt: "Explain the concept of closures in JavaScript",
    temperature: 0.7,
    maxTokens: 500,
    stopSequences: ["\n\n###"],
  });

  console.log("Response:");
  console.log(result.text);
  console.log("\n");
}

// =============================================================================
// Example 10: Error Handling
// =============================================================================

export async function errorHandlingExample() {
  console.log("=== Error Handling Example ===\n");

  try {
    const result = await generateText({
      model: neurolinkProvider("invalid-model"),
      prompt: "This will fail",
    });

    console.log(result.text);
  } catch (error) {
    console.error("Error:", error);

    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
  }

  console.log("\n");
}

// =============================================================================
// Main CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const example = args[0] || "basic";

  console.log(
    "\n╔════════════════════════════════════════════════════════════╗",
  );
  console.log("║      Vercel AI SDK + NeuroLink Integration Examples        ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  try {
    switch (example) {
      case "basic":
        await basicGenerationExample();
        break;
      case "multi-provider":
        await multiProviderExample();
        break;
      case "streaming":
        await streamingExample();
        break;
      case "streaming-metadata":
        await streamingWithMetadataExample();
        break;
      case "structured":
        await structuredOutputExample();
        break;
      case "structured-array":
        await structuredArrayExample();
        break;
      case "conversation":
        await conversationExample();
        break;
      case "system-prompt":
        await systemPromptExample();
        break;
      case "tools":
        await toolCallingExample();
        break;
      case "advanced":
        await advancedConfigurationExample();
        break;
      case "error":
        await errorHandlingExample();
        break;
      case "nextjs":
        console.log("Next.js Pages Router Example:");
        console.log(nextjsPagesRouterExample);
        break;
      case "react-chat":
        console.log("React useChat Example:");
        console.log(reactUseChatExample);
        break;
      case "react-completion":
        console.log("React useCompletion Example:");
        console.log(reactUseCompletionExample);
        break;
      default:
        console.log("Available examples:");
        console.log("  basic              - Basic text generation");
        console.log("  multi-provider     - Multiple AI providers");
        console.log("  streaming          - Streaming responses");
        console.log("  streaming-metadata - Streaming with metadata");
        console.log("  structured         - Structured output (recipe)");
        console.log("  structured-array   - Structured array output (tasks)");
        console.log("  conversation       - Multi-turn conversation");
        console.log("  system-prompt      - Custom system prompt");
        console.log("  tools              - Tool/function calling");
        console.log("  advanced           - Advanced configuration");
        console.log("  error              - Error handling");
        console.log("  nextjs             - Next.js integration");
        console.log("  react-chat         - React useChat hook");
        console.log("  react-completion   - React useCompletion hook");
        console.log("\nUsage: ts-node vercel-ai-sdk.ts [example]");
        process.exit(1);
    }

    console.log("✅ Example completed successfully\n");
  } catch (error) {
    console.error("\n❌ Example failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

// =============================================================================
// Exports
// =============================================================================

export {
  basicGenerationExample,
  multiProviderExample,
  streamingExample,
  streamingWithMetadataExample,
  structuredOutputExample,
  structuredArrayExample,
  conversationExample,
  systemPromptExample,
  toolCallingExample,
  advancedConfigurationExample,
  errorHandlingExample,
};

/*
# Run examples:

# Basic text generation
ts-node vercel-ai-sdk.ts basic

# Multiple providers
ts-node vercel-ai-sdk.ts multi-provider

# Streaming
ts-node vercel-ai-sdk.ts streaming

# Structured output
ts-node vercel-ai-sdk.ts structured

# Tool calling
ts-node vercel-ai-sdk.ts tools

# Next.js integration
ts-node vercel-ai-sdk.ts nextjs

# React hooks
ts-node vercel-ai-sdk.ts react-chat
ts-node vercel-ai-sdk.ts react-completion
*/
