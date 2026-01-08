# NeuroLink Chat Application Example

A complete chat application demonstrating NeuroLink SDK integration with streaming.

## Features

- Real-time streaming responses
- Provider auto-selection
- Express.js backend
- Simple web UI
- Error handling

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:

   ```bash
   cp .env.example .env
   # Add your API keys
   ```

3. Run:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Project Structure

- `src/index.ts` - Entry point
- `src/server.ts` - Express server
- `src/routes/chat.ts` - Chat API routes
- `src/services/ai.service.ts` - NeuroLink service
- `public/index.html` - Chat UI

## Key Concepts

- SDK initialization with multiple providers
- Streaming responses with SSE
- Error handling patterns

## API Endpoints

### POST /api/chat

Standard chat completion endpoint.

**Request:**

```json
{
  "message": "Hello, how are you?",
  "provider": "openai",
  "model": "gpt-4o"
}
```

**Response:**

```json
{
  "response": "I'm doing well, thank you for asking!",
  "provider": "openai",
  "model": "gpt-4o"
}
```

### POST /api/chat/stream

Streaming chat endpoint using Server-Sent Events.

**Request:**

```json
{
  "message": "Write a short story",
  "provider": "anthropic"
}
```

**Response:** Server-Sent Events stream with text chunks.

## Environment Variables

| Variable          | Description                 | Required |
| ----------------- | --------------------------- | -------- |
| OPENAI_API_KEY    | OpenAI API key              | No       |
| ANTHROPIC_API_KEY | Anthropic API key           | No       |
| GOOGLE_AI_API_KEY | Google AI Studio API key    | No       |
| PORT              | Server port (default: 3000) | No       |

At least one API key is required for the application to function.

## Customization

### Adding More Providers

Edit `src/services/ai.service.ts` to configure additional providers:

```typescript
this.neurolink = new NeuroLink({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    mistral: { apiKey: process.env.MISTRAL_API_KEY },
  },
});
```

### Custom System Prompts

Modify the system prompt in `ai.service.ts`:

```typescript
async chat(message: string, options?: ChatOptions) {
  return this.neurolink.generate({
    prompt: message,
    system: "You are a helpful assistant specialized in...",
    ...options,
  });
}
```
