/**
 * HTTP Transport Demo
 *
 * This demo shows how to use HTTP/Streamable HTTP transport for remote MCP servers.
 * HTTP transport is ideal for:
 * - Cloud-hosted MCP servers
 * - Serverless MCP endpoints
 * - Load-balanced MCP infrastructure
 * - Cross-network MCP communication
 */

import "dotenv/config";
import { NeuroLink } from "@juspay/neurolink";

export async function runHTTPTransportDemo(): Promise<void> {
  console.log("\n🔌 HTTP Transport Demo\n");
  console.log("Use HTTP transport for remote MCP servers.\n");

  // Initialize NeuroLink
  const neurolink = new NeuroLink({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  // Demo 1: Basic HTTP transport configuration
  console.log("━".repeat(50));
  console.log("📡 HTTP Transport Configuration");
  console.log("━".repeat(50));
  console.log(`
HTTP transport connects to remote MCP servers via HTTP/HTTPS:

// Basic HTTP configuration
await neurolink.addExternalMCPServer('remote-api', {
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

// With full options
await neurolink.addExternalMCPServer('remote-api', {
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'X-Custom-Header': 'value'
  },
  timeout: 15000,           // 15 second timeout
  retries: 5,               // Retry failed requests 5 times
  healthCheckInterval: 30000 // Health check every 30 seconds
});
`);

  // Demo 2: Transport comparison
  console.log("\n━".repeat(50));
  console.log("🔄 Transport Comparison");
  console.log("━".repeat(50));

  const transports = [
    {
      type: "stdio",
      useCase: "Local MCP servers",
      pros: ["Low latency", "No network required", "Process isolation"],
      cons: ["Local only", "Resource overhead per server"],
      example: `{
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  transport: 'stdio'
}`,
    },
    {
      type: "http",
      useCase: "Remote HTTP/REST MCP servers",
      pros: ["Works across networks", "Scalable", "Load balancing"],
      cons: ["Network latency", "Requires server infrastructure"],
      example: `{
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: { 'Authorization': 'Bearer TOKEN' }
}`,
    },
    {
      type: "sse",
      useCase: "Server-Sent Events streaming",
      pros: ["Real-time updates", "Unidirectional streaming"],
      cons: ["One-way communication", "Connection overhead"],
      example: `{
  transport: 'sse',
  url: 'https://stream.example.com/mcp/events',
  headers: { 'Authorization': 'Bearer TOKEN' }
}`,
    },
    {
      type: "websocket",
      useCase: "Bidirectional real-time communication",
      pros: ["Full duplex", "Low latency", "Persistent connection"],
      cons: ["Connection state management", "Firewall issues"],
      example: `{
  transport: 'websocket',
  url: 'wss://ws.example.com/mcp',
  headers: { 'Authorization': 'Bearer TOKEN' }
}`,
    },
  ];

  for (const transport of transports) {
    console.log(`\n${transport.type.toUpperCase()}`);
    console.log(`  Use case: ${transport.useCase}`);
    console.log(`  Pros: ${transport.pros.join(", ")}`);
    console.log(`  Cons: ${transport.cons.join(", ")}`);
  }

  // Demo 3: HTTP authentication patterns
  console.log("\n\n━".repeat(50));
  console.log("🔐 HTTP Authentication Patterns");
  console.log("━".repeat(50));
  console.log(`
Various authentication methods for HTTP transport:

// Bearer token authentication
await neurolink.addExternalMCPServer('api', {
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
  }
});

// API key authentication
await neurolink.addExternalMCPServer('api', {
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
});

// Basic authentication
await neurolink.addExternalMCPServer('api', {
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('user:pass').toString('base64')
  }
});

// OAuth2 with custom headers
await neurolink.addExternalMCPServer('api', {
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'X-Client-Id': 'your-client-id',
    'X-Tenant-Id': 'tenant-123'
  }
});
`);

  // Demo 4: Retry and resilience configuration
  console.log("\n━".repeat(50));
  console.log("🛡️ Retry and Resilience");
  console.log("━".repeat(50));
  console.log(`
Configure retry behavior for robust HTTP connections:

await neurolink.addExternalMCPServer('reliable-api', {
  transport: 'http',
  url: 'https://api.example.com/mcp',

  // Timeout configuration
  timeout: 30000,           // 30 second request timeout

  // Retry configuration
  retries: 5,               // Retry up to 5 times

  // Health monitoring
  healthCheckInterval: 60000, // Check health every 60 seconds

  headers: {
    'Authorization': 'Bearer TOKEN'
  }
});

NeuroLink uses exponential backoff for retries:
- 1st retry: ~1000ms delay
- 2nd retry: ~2000ms delay
- 3rd retry: ~4000ms delay
- 4th retry: ~8000ms delay
- 5th retry: ~16000ms delay
`);

  // Demo 5: Rate limiting
  console.log("\n━".repeat(50));
  console.log("⏱️ Rate Limiting");
  console.log("━".repeat(50));
  console.log(`
NeuroLink includes built-in rate limiting for HTTP transport:

// Rate limiting is automatic based on server responses
// 429 responses trigger automatic backoff
// X-RateLimit-* headers are respected

// Custom rate limit configuration (if supported)
await neurolink.addExternalMCPServer('rate-limited-api', {
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: {
    'Authorization': 'Bearer TOKEN'
  },
  // Rate limiting handled automatically
});
`);

  // Demo 6: Session management
  console.log("\n━".repeat(50));
  console.log("🔗 Session Management");
  console.log("━".repeat(50));
  console.log(`
HTTP transport supports MCP session management:

// Session ID is automatically managed via Mcp-Session-Id header
// Sessions persist across multiple requests
// Automatic session recovery on connection issues

await neurolink.addExternalMCPServer('session-api', {
  transport: 'http',
  url: 'https://api.example.com/mcp',
  headers: {
    'Authorization': 'Bearer TOKEN'
  }
});

// Session is established on first tool call
const result = await neurolink.generate({
  prompt: 'Use the remote API to fetch data'
});
// Subsequent calls reuse the same session
`);

  // Demo 7: Example real-world setup
  console.log("\n━".repeat(50));
  console.log("🌍 Real-World Example: GitHub Copilot MCP");
  console.log("━".repeat(50));
  console.log(`
Example connecting to a hypothetical remote MCP server:

// GitHub Copilot MCP (example)
await neurolink.addExternalMCPServer('github-copilot', {
  transport: 'http',
  url: 'https://api.githubcopilot.com/mcp',
  headers: {
    'Authorization': 'Bearer ' + process.env.GITHUB_COPILOT_TOKEN,
    'X-GitHub-Api-Version': '2022-11-28'
  },
  timeout: 15000,
  retries: 3
});

// Self-hosted MCP server
await neurolink.addExternalMCPServer('internal-api', {
  transport: 'http',
  url: 'https://mcp.internal.company.com/v1',
  headers: {
    'Authorization': 'Bearer ' + process.env.INTERNAL_API_TOKEN,
    'X-Request-Id': crypto.randomUUID()
  },
  timeout: 30000,
  retries: 5,
  healthCheckInterval: 120000
});

// Serverless MCP endpoint (AWS Lambda, Cloudflare Workers, etc.)
await neurolink.addExternalMCPServer('serverless-mcp', {
  transport: 'http',
  url: 'https://xyz123.execute-api.us-east-1.amazonaws.com/prod/mcp',
  headers: {
    'x-api-key': process.env.AWS_API_GATEWAY_KEY
  },
  timeout: 29000  // Just under Lambda timeout
});
`);

  // Demo 8: WebSocket transport
  console.log("\n━".repeat(50));
  console.log("🔌 WebSocket Transport");
  console.log("━".repeat(50));
  console.log(`
WebSocket transport for real-time bidirectional communication:

await neurolink.addExternalMCPServer('realtime-api', {
  transport: 'websocket',
  url: 'wss://realtime.example.com/mcp',
  headers: {
    'Authorization': 'Bearer TOKEN'
  }
});

WebSocket is ideal for:
- Long-running tool executions
- Streaming results
- Real-time collaboration features
- Low-latency interactive tools
`);

  // Demo 9: SSE transport
  console.log("\n━".repeat(50));
  console.log("📡 SSE Transport");
  console.log("━".repeat(50));
  console.log(`
Server-Sent Events for server-push scenarios:

await neurolink.addExternalMCPServer('sse-api', {
  transport: 'sse',
  url: 'https://stream.example.com/mcp/events',
  headers: {
    'Authorization': 'Bearer TOKEN'
  }
});

SSE is ideal for:
- Monitoring and alerting tools
- Progress updates for long operations
- Event-driven architectures
- One-way data streaming
`);

  console.log("\n✅ HTTP Transport Demo Complete!");
}

// Run if called directly
const isMain = process.argv[1]?.includes("http-transport");
if (isMain) {
  runHTTPTransportDemo().catch(console.error);
}
