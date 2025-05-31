# 🚀 Zephyr-Mind Integration Guide

Complete guide for integrating Zephyr-Mind AI toolkit into your applications.

## 📋 Quick Start Checklist

```bash
# 1. Install the library
npm install zephyr-mind ai @ai-sdk/amazon-bedrock @ai-sdk/openai @ai-sdk/google-vertex zod

# 2. Set environment variables (choose one or more providers)
export OPENAI_API_KEY="your-openai-key"
# OR/AND
export AWS_ACCESS_KEY_ID="your-aws-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret"
# OR/AND
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# 3. Use in your app
import { createBestAIProvider } from 'zephyr-mind';
const provider = createBestAIProvider();
const result = await provider.generateText({ prompt: "Hello!" });
```

## 🏗️ Framework-Specific Integration

### **SvelteKit Integration**

#### **Streaming Chat API** (`src/routes/api/chat/+server.ts`)
```typescript
import { createBestAIProvider } from 'zephyr-mind';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { message, options } = await request.json();

    const provider = createBestAIProvider();
    const result = await provider.streamText({
      prompt: message,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 1000
    });

    return new Response(result.toReadableStream(), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

#### **Client-Side Usage** (`src/routes/chat/+page.svelte`)
```svelte
<script lang="ts">
  let message = '';
  let response = '';
  let isLoading = false;

  async function sendMessage() {
    if (!message.trim() || isLoading) return;

    isLoading = true;
    response = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          options: { temperature: 0.7, maxTokens: 500 }
        })
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        response += chunk;
      }
    } catch (error) {
      response = `Error: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="chat-container">
  <input bind:value={message} placeholder="Ask something..." />
  <button on:click={sendMessage} disabled={isLoading}>
    {isLoading ? 'Sending...' : 'Send'}
  </button>

  {#if response}
    <div class="response">{response}</div>
  {/if}
</div>

<style>
  .chat-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .response {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
    white-space: pre-wrap;
  }
</style>
```

### **Next.js Integration**

#### **App Router API** (`app/api/ai/route.ts`)
```typescript
import { createBestAIProvider, AIProviderFactory } from 'zephyr-mind';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, provider: preferredProvider, model, ...options } = await request.json();

    // Use specific provider if requested, otherwise best available
    const provider = preferredProvider
      ? AIProviderFactory.createProvider(preferredProvider, model)
      : createBestAIProvider();

    const result = await provider.generateText({
      prompt,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 1000,
      ...options
    });

    return NextResponse.json({
      text: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

#### **Client Component** (`components/AIChat.tsx`)
```typescript
'use client';
import { useState } from 'react';

interface ChatResponse {
  text: string;
  provider: string;
  model: string;
}

export default function AIChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          temperature: 0.8,
          maxTokens: 500
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResponse(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex gap-2 mb-4">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="flex-1 p-2 border rounded"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {response && (
        <div className="border rounded p-4">
          <div className="text-sm text-gray-500 mb-2">
            Provider: {response.provider} | Model: {response.model}
          </div>
          <div className="whitespace-pre-wrap">{response.text}</div>
        </div>
      )}
    </div>
  );
}
```

### **Express.js Integration**

#### **Complete Server Setup**
```typescript
import express from 'express';
import cors from 'cors';
import { createBestAIProvider, AIProviderFactory } from 'zephyr-mind';

const app = express();
app.use(cors());
app.use(express.json());

// Simple text generation
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;

    const provider = createBestAIProvider();
    const result = await provider.generateText({
      prompt,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 1000
    });

    res.json({
      success: true,
      text: result.text,
      provider: result.provider,
      usage: result.usage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Streaming response
app.post('/api/stream', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;

    const provider = createBestAIProvider();
    const result = await provider.streamText({
      prompt,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 1000
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');

    for await (const chunk of result.textStream) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Provider selection endpoint
app.post('/api/generate/:provider', async (req, res) => {
  try {
    const { provider: providerName } = req.params;
    const { prompt, model, options = {} } = req.body;

    const provider = AIProviderFactory.createProvider(providerName, model);
    const result = await provider.generateText({
      prompt,
      ...options
    });

    res.json({
      success: true,
      text: result.text,
      provider: providerName,
      model: model || 'default'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('AI Server running on http://localhost:3000');
});
```

### **React Hook for Easy Integration**
```typescript
// hooks/useAI.ts
import { useState, useCallback } from 'react';

interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  provider?: string;
  model?: string;
}

interface AIResponse {
  text: string;
  provider: string;
  model: string;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    prompt: string,
    options: AIOptions = {}
  ): Promise<AIResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...options })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI request failed');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error };
}

// Usage in React component:
// const { generate, loading, error } = useAI();
// const result = await generate("What is AI?", { temperature: 0.8 });
```

## 🔧 Advanced Integration Patterns

### **Provider Fallback Strategy**
```typescript
import { AIProviderFactory, createAIProviderWithFallback } from 'zephyr-mind';

// Automatic fallback between providers
const { primary, fallback } = createAIProviderWithFallback('bedrock', 'openai');

async function generateWithFallback(prompt: string) {
  try {
    return await primary.generateText({ prompt });
  } catch (error) {
    console.log('Primary provider failed, using fallback');
    return await fallback.generateText({ prompt });
  }
}
```

### **Environment-Based Configuration**
```typescript
import { createBestAIProvider } from 'zephyr-mind';

// Automatically adapt to environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const getAIProvider = () => {
  if (isDevelopment) {
    // Use cheaper models for development
    return AIProviderFactory.createProvider('openai', 'gpt-4o-mini');
  } else if (isProduction) {
    // Use high-quality models for production
    return AIProviderFactory.createProvider('bedrock', 'claude-3-7-sonnet');
  } else {
    // Auto-select best available
    return createBestAIProvider();
  }
};
```

### **Custom Provider Configuration**
```typescript
import { AIProviderFactory } from 'zephyr-mind';

// Configure specific providers with custom settings
const providers = {
  creative: AIProviderFactory.createProvider('openai', 'gpt-4o'),
  analytical: AIProviderFactory.createProvider('bedrock', 'claude-3-7-sonnet'),
  fast: AIProviderFactory.createProvider('vertex', 'gemini-2.5-flash')
};

async function generateCreativeContent(prompt: string) {
  return await providers.creative.generateText({
    prompt,
    temperature: 0.9,
    maxTokens: 2000
  });
}

async function analyzeData(prompt: string) {
  return await providers.analytical.generateText({
    prompt,
    temperature: 0.1,
    maxTokens: 1000
  });
}
```

## 🚨 Error Handling Best Practices

### **Comprehensive Error Handling**
```typescript
import { createBestAIProvider } from 'zephyr-mind';

async function robustAIGeneration(prompt: string) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const provider = createBestAIProvider();
      const result = await provider.generateText({
        prompt,
        temperature: 0.7,
        maxTokens: 1000
      });

      return {
        success: true,
        text: result.text,
        provider: result.provider,
        attempts: attempts + 1
      };
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed:`, error.message);

      if (attempts >= maxAttempts) {
        return {
          success: false,
          error: `Failed after ${maxAttempts} attempts: ${error.message}`,
          attempts
        };
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
}
```

### **Provider-Specific Error Recovery**
```typescript
import { createBestAIProvider, AIProviderFactory } from 'zephyr-mind';

async function generateWithSmartFallback(prompt: string) {
  const providers = ['bedrock', 'openai', 'vertex'];

  for (const providerName of providers) {
    try {
      const provider = AIProviderFactory.createProvider(providerName);
      const result = await provider.generateText({ prompt });

      return {
        success: true,
        text: result.text,
        usedProvider: providerName
      };
    } catch (error) {
      console.warn(`${providerName} failed: ${error.message}`);

      // Check if it's a configuration issue vs temporary failure
      if (error.message.includes('API key') || error.message.includes('credentials')) {
        console.log(`${providerName} not configured, trying next provider`);
        continue;
      } else {
        console.log(`${providerName} temporary failure, trying next provider`);
        continue;
      }
    }
  }

  return {
    success: false,
    error: 'All providers failed or are not configured'
  };
}
```

## 📊 Performance Optimization

### **Response Caching**
```typescript
const responseCache = new Map<string, { text: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedOrGenerate(prompt: string) {
  const cacheKey = prompt.toLowerCase().trim();
  const cached = responseCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { ...cached, fromCache: true };
  }

  const provider = createBestAIProvider();
  const result = await provider.generateText({ prompt });

  responseCache.set(cacheKey, {
    text: result.text,
    timestamp: Date.now()
  });

  return { text: result.text, fromCache: false };
}
```

### **Batch Processing**
```typescript
import { createBestAIProvider } from 'zephyr-mind';

async function processBatch(prompts: string[]) {
  const provider = createBestAIProvider();
  const results = [];

  // Process in chunks to avoid rate limits
  const chunkSize = 5;
  for (let i = 0; i < prompts.length; i += chunkSize) {
    const chunk = prompts.slice(i, i + chunkSize);

    const chunkResults = await Promise.allSettled(
      chunk.map(prompt =>
        provider.generateText({
          prompt,
          maxTokens: 500
        })
      )
    );

    results.push(...chunkResults);

    // Rate limiting delay
    if (i + chunkSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results.map((result, index) => ({
    prompt: prompts[index],
    success: result.status === 'fulfilled',
    result: result.status === 'fulfilled' ? result.value : result.reason
  }));
}
```

## 🔗 Integration Resources

- **TypeScript Types**: Full type definitions included
- **Environment Variables**: See `.env.example` for complete setup
- **Error Codes**: Detailed error messages with recovery suggestions
- **Provider Documentation**: Links to individual provider docs
- **Community Examples**: Additional integration patterns and use cases

For more integration examples and community contributions, visit the [GitHub repository](https://github.com/juspay/zephyr-mind).
