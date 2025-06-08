# 📚 API Reference

Complete reference for NeuroLink's TypeScript API.

## Core Functions

### `createBestAIProvider(requestedProvider?, modelName?)`

Creates the best available AI provider based on environment configuration and provider availability.

```typescript
function createBestAIProvider(
  requestedProvider?: string,
  modelName?: string
): AIProvider
```

**Parameters:**
- `requestedProvider` (optional): Preferred provider name (`'openai'`, `'bedrock'`, `'vertex'`, or `'auto'`)
- `modelName` (optional): Specific model to use

**Returns:** `AIProvider` instance

**Examples:**
```typescript
import { createBestAIProvider } from '@juspay/neurolink';

// Auto-select best available provider
const provider = createBestAIProvider();

// Prefer specific provider
const openaiProvider = createBestAIProvider('openai');

// Prefer specific provider and model
const claudeProvider = createBestAIProvider('bedrock', 'claude-3-7-sonnet');
```

### `createAIProviderWithFallback(primary, fallback, modelName?)`

Creates a provider with automatic fallback mechanism.

```typescript
function createAIProviderWithFallback(
  primary: string,
  fallback: string,
  modelName?: string
): { primary: AIProvider; fallback: AIProvider }
```

**Parameters:**
- `primary`: Primary provider name
- `fallback`: Fallback provider name
- `modelName` (optional): Model name for both providers

**Returns:** Object with `primary` and `fallback` provider instances

**Example:**
```typescript
import { createAIProviderWithFallback } from '@juspay/neurolink';

const { primary, fallback } = createAIProviderWithFallback('bedrock', 'openai');

try {
  const result = await primary.generateText({ prompt: "Hello AI!" });
} catch (error) {
  console.log('Primary failed, trying fallback...');
  const result = await fallback.generateText({ prompt: "Hello AI!" });
}
```

## AIProviderFactory

Factory class for creating specific provider instances.

### `createProvider(providerName, modelName?)`

Creates a specific provider instance.

```typescript
static createProvider(
  providerName: string,
  modelName?: string
): AIProvider
```

**Parameters:**
- `providerName`: Provider name (`'openai'`, `'bedrock'`, `'vertex'`)
- `modelName` (optional): Specific model to use

**Returns:** `AIProvider` instance

**Examples:**
```typescript
import { AIProviderFactory } from '@juspay/neurolink';

// Create specific providers
const openai = AIProviderFactory.createProvider('openai', 'gpt-4o');
const bedrock = AIProviderFactory.createProvider('bedrock', 'claude-3-7-sonnet');
const vertex = AIProviderFactory.createProvider('vertex', 'gemini-2.5-flash');

// Use default models
const defaultOpenAI = AIProviderFactory.createProvider('openai');
```

### `createProviderWithFallback(primary, fallback, modelName?)`

Creates provider with fallback (same as standalone function).

```typescript
static createProviderWithFallback(
  primary: string,
  fallback: string,
  modelName?: string
): { primary: AIProvider; fallback: AIProvider }
```

## AIProvider Interface

All providers implement the `AIProvider` interface with these methods:

```typescript
interface AIProvider {
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;
  streamText(options: StreamTextOptions): Promise<StreamTextResult>;
}
```

### `generateText(options)`

Generate text content synchronously.

```typescript
async generateText(options: GenerateTextOptions): Promise<GenerateTextResult>
```

**Parameters:**
```typescript
interface GenerateTextOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  schema?: any; // For structured output
}
```

**Returns:**
```typescript
interface GenerateTextResult {
  text: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTime?: number;
}
```

**Example:**
```typescript
const result = await provider.generateText({
  prompt: "Explain quantum computing in simple terms",
  temperature: 0.7,
  maxTokens: 500,
  systemPrompt: "You are a helpful science teacher"
});

console.log(result.text);
console.log(`Used ${result.usage?.totalTokens} tokens`);
console.log(`Provider: ${result.provider}, Model: ${result.model}`);
```

### `streamText(options)`

Generate text content with streaming responses.

```typescript
async streamText(options: StreamTextOptions): Promise<StreamTextResult>
```

**Parameters:**
```typescript
interface StreamTextOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}
```

**Returns:**
```typescript
interface StreamTextResult {
  textStream: AsyncIterable<string>;
  provider: string;
  model: string;
  toReadableStream(): ReadableStream<Uint8Array>;
}
```

**Example:**
```typescript
const result = await provider.streamText({
  prompt: "Write a story about AI and humanity",
  temperature: 0.8,
  maxTokens: 1000
});

// Stream to console
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

// Or convert to ReadableStream for web APIs
const stream = result.toReadableStream();
return new Response(stream, {
  headers: { 'Content-Type': 'text/plain' }
});
```

## Flexible Parameter Support

NeuroLink supports both object-based and string-based parameters for convenience:

```typescript
// Object format (recommended for complex options)
const result1 = await provider.generateText({
  prompt: "Hello",
  temperature: 0.7,
  maxTokens: 100
});

// String format (convenient for simple prompts)
const result2 = await provider.generateText("Hello");
```

## Supported Models

### OpenAI Models
```typescript
type OpenAIModel =
  | 'gpt-4o'          // Default - Latest multimodal model
  | 'gpt-4o-mini'     // Cost-effective variant
  | 'gpt-4-turbo'     // High-performance model
```

### Amazon Bedrock Models
```typescript
type BedrockModel =
  | 'claude-3-7-sonnet'    // Default - Latest Claude model
  | 'claude-3-5-sonnet'    // Previous generation
  | 'claude-3-haiku'       // Fast, lightweight model
```

**Note:** Bedrock requires full inference profile ARNs in environment variables.

### Google Vertex AI Models
```typescript
type VertexModel =
  | 'gemini-2.5-flash'     // Default - Fast, efficient
  | 'claude-sonnet-4@20250514'  // High-quality reasoning
```

## Environment Configuration

### Required Environment Variables

```typescript
// OpenAI
OPENAI_API_KEY: string

// Amazon Bedrock
AWS_ACCESS_KEY_ID: string
AWS_SECRET_ACCESS_KEY: string
AWS_REGION?: string              // Default: 'us-east-2'
AWS_SESSION_TOKEN?: string       // For temporary credentials
BEDROCK_MODEL?: string           // Inference profile ARN

// Google Vertex AI (choose one authentication method)
GOOGLE_APPLICATION_CREDENTIALS?: string           // Method 1: File path
GOOGLE_SERVICE_ACCOUNT_KEY?: string              // Method 2: JSON string
GOOGLE_AUTH_CLIENT_EMAIL?: string                // Method 3a: Individual vars
GOOGLE_AUTH_PRIVATE_KEY?: string                 // Method 3b: Individual vars
GOOGLE_VERTEX_PROJECT: string                    // Required for all methods
GOOGLE_VERTEX_LOCATION?: string                  // Default: 'us-east5'
```

### Optional Configuration Variables

```typescript
// Provider preferences
DEFAULT_PROVIDER?: 'auto' | 'openai' | 'bedrock' | 'vertex'
FALLBACK_PROVIDER?: 'openai' | 'bedrock' | 'vertex'

// Feature toggles
ENABLE_STREAMING?: 'true' | 'false'
ENABLE_FALLBACK?: 'true' | 'false'

// Debugging
NEUROLINK_DEBUG?: 'true' | 'false'
LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug'
```

## Type Definitions

### Core Types

```typescript
type ProviderName = 'openai' | 'bedrock' | 'vertex';

interface AIProvider {
  generateText(options: GenerateTextOptions | string): Promise<GenerateTextResult>;
  streamText(options: StreamTextOptions | string): Promise<StreamTextResult>;
}

interface GenerateTextOptions {
  prompt: string;
  temperature?: number;        // 0.0 to 1.0, default: 0.7
  maxTokens?: number;          // Default: 500
  systemPrompt?: string;       // System message
  schema?: any;                // For structured output
}

interface StreamTextOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface GenerateTextResult {
  text: string;
  provider: string;
  model: string;
  usage?: TokenUsage;
  responseTime?: number;       // Milliseconds
}

interface StreamTextResult {
  textStream: AsyncIterable<string>;
  provider: string;
  model: string;
  toReadableStream(): ReadableStream<Uint8Array>;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

### Provider-Specific Types

```typescript
// OpenAI specific
interface OpenAIOptions extends GenerateTextOptions {
  user?: string;               // User identifier
  stop?: string | string[];    // Stop sequences
}

// Bedrock specific
interface BedrockOptions extends GenerateTextOptions {
  region?: string;             // AWS region override
}

// Vertex AI specific
interface VertexOptions extends GenerateTextOptions {
  project?: string;            // GCP project override
  location?: string;           // GCP location override
}
```

## Error Handling

### Error Types

```typescript
class AIProviderError extends Error {
  provider: string;
  originalError?: Error;
}

class ConfigurationError extends AIProviderError {
  // Thrown when provider configuration is invalid
}

class AuthenticationError extends AIProviderError {
  // Thrown when authentication fails
}

class RateLimitError extends AIProviderError {
  // Thrown when rate limits are exceeded
  retryAfter?: number; // Seconds to wait before retrying
}

class QuotaExceededError extends AIProviderError {
  // Thrown when usage quotas are exceeded
}
```

### Error Handling Patterns

```typescript
import {
  AIProviderError,
  ConfigurationError,
  AuthenticationError,
  RateLimitError
} from '@juspay/neurolink';

try {
  const result = await provider.generateText({ prompt: "Hello" });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Provider not configured:', error.message);
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limit exceeded. Retry after ${error.retryAfter}s`);
  } else if (error instanceof AIProviderError) {
    console.error(`Provider ${error.provider} failed:`, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Advanced Usage Patterns

### Custom Provider Selection

```typescript
interface ProviderSelector {
  selectProvider(available: ProviderName[]): ProviderName;
}

class CustomSelector implements ProviderSelector {
  selectProvider(available: ProviderName[]): ProviderName {
    // Custom logic for provider selection
    if (available.includes('bedrock')) return 'bedrock';
    if (available.includes('openai')) return 'openai';
    return available[0];
  }
}

// Usage with custom selector
const provider = createBestAIProvider(); // Uses default selection logic
```

### Middleware Support

```typescript
interface AIMiddleware {
  beforeRequest?(options: GenerateTextOptions): GenerateTextOptions;
  afterResponse?(result: GenerateTextResult): GenerateTextResult;
  onError?(error: Error): Error;
}

class LoggingMiddleware implements AIMiddleware {
  beforeRequest(options: GenerateTextOptions): GenerateTextOptions {
    console.log(`Generating text for prompt: ${options.prompt.slice(0, 50)}...`);
    return options;
  }

  afterResponse(result: GenerateTextResult): GenerateTextResult {
    console.log(`Generated ${result.text.length} characters using ${result.provider}`);
    return result;
  }
}

// Note: Middleware is a planned feature for future versions
```

### Batch Processing

```typescript
async function processBatch(prompts: string[], options: GenerateTextOptions = {}) {
  const provider = createBestAIProvider();
  const results = [];

  for (const prompt of prompts) {
    try {
      const result = await provider.generateText({ ...options, prompt });
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({
        success: false,
        prompt,
        error: error.message
      });
    }

    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// Usage
const prompts = [
  "Explain photosynthesis",
  "What is machine learning?",
  "Describe the solar system"
];

const results = await processBatch(prompts, {
  temperature: 0.7,
  maxTokens: 200
});
```

### Response Caching

```typescript
class CachedProvider implements AIProvider {
  private cache = new Map<string, GenerateTextResult>();
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const key = JSON.stringify(options);

    if (this.cache.has(key)) {
      return { ...this.cache.get(key)!, fromCache: true };
    }

    const result = await this.provider.generateText(options);
    this.cache.set(key, result);
    return result;
  }

  async streamText(options: StreamTextOptions): Promise<StreamTextResult> {
    // Streaming responses are not cached
    return this.provider.streamText(options);
  }
}

// Usage
const baseProvider = createBestAIProvider();
const cachedProvider = new CachedProvider(baseProvider);
```

## TypeScript Integration

### Type-Safe Configuration

```typescript
interface NeuroLinkConfig {
  defaultProvider?: ProviderName;
  fallbackProvider?: ProviderName;
  defaultOptions?: Partial<GenerateTextOptions>;
  enableFallback?: boolean;
  enableStreaming?: boolean;
  debug?: boolean;
}

const config: NeuroLinkConfig = {
  defaultProvider: 'openai',
  fallbackProvider: 'bedrock',
  defaultOptions: {
    temperature: 0.7,
    maxTokens: 500
  },
  enableFallback: true,
  debug: false
};
```

### Generic Provider Interface

```typescript
interface TypedAIProvider<TOptions = GenerateTextOptions, TResult = GenerateTextResult> {
  generateText(options: TOptions): Promise<TResult>;
}

// Custom typed provider
interface CustomOptions extends GenerateTextOptions {
  customParameter?: string;
}

interface CustomResult extends GenerateTextResult {
  customData?: any;
}

const typedProvider: TypedAIProvider<CustomOptions, CustomResult> =
  createBestAIProvider() as any;
```

---

[← Back to Main README](../README.md) | [Next: Visual Demos →](./VISUAL-DEMOS.md)
