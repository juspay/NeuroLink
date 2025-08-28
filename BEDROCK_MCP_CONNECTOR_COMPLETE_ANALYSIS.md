# BEDROCK-MCP-CONNECTOR: COMPLETE IN-DEPTH ANALYSIS

## 100% Feature Replication Blueprint

---

## EXECUTIVE SUMMARY

This document provides an exhaustive, line-by-line analysis of the Bedrock-MCP-Connector library (`@juspay/bedrock-mcp-connector` v1.1.0) to enable 100% feature-complete replacement implementation. Every component, configuration, behavior, and implementation detail has been documented to ensure perfect replication.

**Project Overview:**

- **Name**: @juspay/bedrock-mcp-connector
- **Version**: 1.1.0
- **Type**: ES Module TypeScript Library
- **Purpose**: AWS Bedrock + MCP Server Integration Client
- **Architecture**: Event-driven, modular, storage-agnostic

---

## SECTION 1: PROJECT ARCHITECTURE DEEP DIVE

### 1.1 Directory Structure Analysis

The project follows a strict modular architecture with specific file organization:

```
ROOT/
├── package.json                    # Primary package configuration
├── package-lock.json              # NPM dependency lock (exact versions)
├── pnpm-lock.yaml                 # PNPM lock file (package manager preference)
├── tsconfig.json                  # TypeScript compilation configuration
├── README.md                      # User documentation
├── TESTING.md                     # Testing instructions and setup
├── test-package.js                # Integration test for package functionality
├── test-storage.js                # Storage system validation test
└── src/                           # Source code directory
    ├── index.ts                   # Main library entry point - ALL exports
    ├── bin.ts                     # CLI executable entry point
    ├── types.ts                   # Core type definitions and interfaces
    ├── cli/
    │   └── index.ts              # Complete CLI implementation
    ├── client/
    │   ├── index.ts              # Client module exports
    │   └── BedrockMCPClient.ts   # Main client class implementation
    ├── core/
    │   ├── index.ts              # Core module exports
    │   ├── ConverseAgent.ts      # AWS Bedrock integration agent
    │   └── ToolManager.ts        # Tool registration and execution
    ├── storage/
    │   ├── index.ts              # Storage module exports
    │   ├── types.ts              # Storage-specific type definitions
    │   ├── MessageStorage.ts     # Abstract storage interface
    │   ├── InMemoryMessageStorage.ts  # In-memory storage implementation
    │   └── RedisMessageStorage.ts     # Redis storage implementation
    ├── utils/
    │   ├── index.ts              # Utility module exports
    │   └── logging.ts            # Logging system implementation
    └── examples/
        ├── basic.ts              # Basic usage demonstration
        └── interact.js           # Interactive example (JavaScript)
```

### 1.2 Module Dependency Graph

The library follows a hierarchical dependency structure:

```
index.ts (ROOT)
├── client/BedrockMCPClient.ts (MAIN CLIENT)
│   ├── core/ConverseAgent.ts (AWS INTEGRATION)
│   │   ├── @aws-sdk/client-bedrock-runtime
│   │   ├── utils/logging.ts
│   │   ├── storage/MessageStorage.ts
│   │   └── core/ToolManager.ts
│   ├── core/ToolManager.ts (TOOL MANAGEMENT)
│   │   ├── utils/logging.ts
│   │   └── types.ts
│   ├── storage/InMemoryMessageStorage.ts
│   ├── storage/RedisMessageStorage.ts
│   │   ├── redis (external dependency)
│   │   └── utils/logging.ts
│   ├── utils/logging.ts
│   ├── events (Node.js built-in)
│   └── mcp-client (external dependency)
├── cli/index.ts (CLI INTERFACE)
│   ├── readline (Node.js built-in)
│   ├── client/BedrockMCPClient.ts
│   └── utils/logging.ts
└── types.ts (TYPE DEFINITIONS)
```

### 1.3 Build and Distribution Strategy

**TypeScript Configuration:**

- Target: ES2020
- Module: NodeNext (modern ESM)
- Output: dist/ directory
- Declaration files: Generated for TypeScript consumers
- Strict mode: Enabled

**Package Distribution:**

- Type: "module" (pure ESM)
- Main entry: dist/index.js
- Types entry: dist/index.d.ts
- Binary: dist/bin.js
- Included files: dist/, README.md only

---

## SECTION 2: DEPENDENCY ANALYSIS & EXTERNAL INTEGRATIONS

### 2.1 Production Dependencies

#### @aws-sdk/client-bedrock-runtime (^3.0.0)

**Purpose**: Official AWS SDK for Bedrock Runtime API
**Usage**: Direct integration for Converse API calls
**Key Components Used**:

- `BedrockRuntimeClient`: Main service client
- `ConverseCommand`: Command for conversation API
  **Configuration**: Region-based initialization only
  **Authentication**: Uses AWS SDK default credential chain

#### events (^3.3.0)

**Purpose**: Node.js EventEmitter for client events
**Usage**: Event-driven architecture implementation
**Key Components Used**:

- `EventEmitter`: Base class for typed event emission
  **Events Emitted**: message, error, tool:start, tool:end, response:start/chunk/end, connected, disconnected

#### mcp-client (^1.12.0)

**Purpose**: Model Context Protocol client implementation
**Usage**: Connection to MCP servers for tool discovery
**Key Components Used**:

- `MCPClient`: Main client for MCP server communication
  **Connection Type**: Server-Sent Events (SSE)
  **Features**: Tool discovery, tool execution, connection management

#### redis (^5.8.2)

**Purpose**: Redis client for persistent storage
**Usage**: Optional storage backend for conversation history
**Key Components Used**:

- `createClient`: Redis client factory
- `RedisClientType`: TypeScript types
  **Features**: Connection management, TTL support, health checks

### 2.2 Development Dependencies

#### typescript (^5.8.2)

**Purpose**: TypeScript compiler and type checking
**Configuration**: Strict mode, ES2020 target, NodeNext modules

#### @types/node (^22.13.13)

**Purpose**: Node.js type definitions
**Usage**: Readline, process, buffer type support

#### @types/events (^3.0.3)

**Purpose**: Events module type definitions
**Usage**: Enhanced EventEmitter typing

### 2.3 Node.js Version Requirements

**Minimum**: Node.js 18.0.0
**Reason**: ES modules, modern async/await, recent Node.js APIs
**Package Manager**: PNPM 10.0.0+ (preferred, but npm compatible)

---

## SECTION 3: TYPE SYSTEM COMPREHENSIVE SPECIFICATION

### 3.1 Core Configuration Types (src/types.ts)

```typescript
export interface BedrockMCPClientConfig {
  /** REQUIRED: AWS Bedrock model ID */
  modelId: string;

  /** OPTIONAL: AWS region (default: 'us-east-1') */
  region?: string;

  /** OPTIONAL: System prompt for model context */
  systemPrompt?: string;

  /** OPTIONAL: MCP server URL for tool integration */
  mcpServerUrl?: string;

  /** OPTIONAL: Client identification name */
  clientName?: string;

  /** OPTIONAL: Client version string */
  clientVersion?: string;

  /** OPTIONAL: Max tokens per response (default: 2000) */
  maxTokens?: number;

  /** OPTIONAL: Temperature 0.0-1.0 (default: 0.7) */
  temperature?: number;

  /** OPTIONAL: Response extraction tags [start, end] */
  responseOutputTags?: [string, string];

  /** OPTIONAL: Storage configuration (default: in-memory) */
  storage?: StorageConfig;

  /** OPTIONAL: Session ID (auto-generated if not provided) */
  sessionId?: string;

  /** OPTIONAL: User ID for multi-user scenarios */
  userId?: string;
}
```

### 3.2 Message Content Type System

The library uses a sophisticated union type system for message content:

```typescript
// Base text content
export interface TextContent {
  text: string;
}

// Tool use request content
export interface ToolUseContent {
  toolUse: {
    toolUseId: string; // Unique identifier for this tool use
    name: string; // Tool name to execute
    input?: Record<string, any>; // Tool parameters
  };
}

// Tool execution result content
export interface ToolResultContent {
  toolResult: {
    toolUseId: string; // Matches the toolUse ID
    content: Array<{ text: string }>; // Tool output
    status: "success" | "error"; // Execution status
  };
}

// Union type for all content types
export type MessageContent = TextContent | ToolUseContent | ToolResultContent;

// Complete message structure
export interface Message {
  role: "user" | "assistant" | "system";
  content: MessageContent[]; // Array of content items
}
```

### 3.3 Tool System Type Definitions

```typescript
// Tool specification for Bedrock API
export interface ToolSpec {
  name: string;
  description?: string;
  inputSchema?: {
    json: Record<string, any>; // JSON Schema for tool input
  };
}

// Tool configuration for Bedrock API
export interface ToolConfig {
  tools: Array<{
    toolSpec: ToolSpec;
  }>;
}

// Tool execution request
export interface ToolRequest {
  toolUseId: string;
  name: string;
  input?: Record<string, any>;
}

// Tool execution response
export interface ToolResponse {
  toolUseId: string;
  content: Array<{ text: string }>;
  status: "success" | "error";
}

// Tool handler function signature
export type ToolHandler = (
  name: string,
  input: Record<string, any>,
) => Promise<any>;
```

### 3.4 Event System Type Definitions

```typescript
export interface BedrockMCPClientEvents {
  message: (message: string) => void;
  error: (error: Error) => void;
  "tool:start": (toolName: string, input: Record<string, any>) => void;
  "tool:end": (toolName: string, result: any) => void;
  "response:start": () => void;
  "response:chunk": (chunk: string) => void;
  "response:end": (fullResponse: string) => void;
  connected: () => void;
  disconnected: () => void;
}

// Typed EventEmitter with method overrides
export type BedrockMCPClientEmitter = EventEmitter & {
  on<E extends keyof BedrockMCPClientEvents>(
    event: E,
    listener: BedrockMCPClientEvents[E],
  ): BedrockMCPClientEmitter;

  emit<E extends keyof BedrockMCPClientEvents>(
    event: E,
    ...args: Parameters<BedrockMCPClientEvents[E]>
  ): boolean;
};
```

### 3.5 Storage System Type Definitions

```typescript
// Redis storage configuration
export interface RedisStorageConfig {
  host?: string; // Default: 'localhost'
  port?: number; // Default: 6379
  password?: string; // Optional authentication
  db?: number; // Default: 0
  keyPrefix?: string; // Default: 'bedrock-mcp:conversation:'
  ttl?: number; // Default: 86400 (24 hours)
  connectionOptions?: {
    // Redis client options
    connectTimeout?: number;
    lazyConnect?: boolean;
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
    [key: string]: any;
  };
}

// Storage configuration union type
export type StorageConfig =
  | { type: "memory" }
  | { type: "redis"; config: RedisStorageConfig };

// Session identification
export interface SessionIdentifier {
  sessionId: string; // Required: Unique session ID
  userId?: string; // Optional: User identification
}
```

---

## SECTION 4: CORE COMPONENT IMPLEMENTATION DETAILS

### 4.1 BedrockMCPClient - Main Client Class

**Location**: `src/client/BedrockMCPClient.ts`

#### 4.1.1 Class Properties and State Management

```typescript
export class BedrockMCPClient {
  // Core components
  private agent: ConverseAgent; // AWS Bedrock integration
  private toolManager: ToolManager; // Tool registration/execution
  private messageStorage: MessageStorage; // Conversation persistence

  // MCP integration
  private mcpClient: MCPClient | null = null; // MCP server connection
  private mcpServerUrl: string | null = null; // MCP server endpoint
  private isConnected: boolean = false; // Connection state

  // Client identification
  private clientName: string; // Client name for MCP
  private clientVersion: string; // Client version for MCP

  // Event system
  private emitter: BedrockMCPClientEmitter; // Typed event emitter
}
```

#### 4.1.2 Constructor Implementation Logic

**CRITICAL**: The constructor follows a specific initialization sequence:

1. **Tool Manager Initialization**

```typescript
this.toolManager = new ToolManager();
```

2. **Storage Factory Pattern**

```typescript
this.messageStorage = this.createStorage(config);

private createStorage(config: BedrockMCPClientConfig): MessageStorage {
    if (!config.storage || config.storage.type === 'memory') {
        return new InMemoryMessageStorage();
    } else if (config.storage.type === 'redis') {
        return new RedisMessageStorage(config.storage.config);
    } else {
        throw new Error(`Unsupported storage type: ${(config.storage as any).type}`);
    }
}
```

3. **Session Management**

```typescript
const session: SessionIdentifier = {
    sessionId: config.sessionId || this.generateSessionId(),
    userId: config.userId
};

private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

4. **Agent Configuration**

```typescript
this.agent = new ConverseAgent(config.modelId, {
  region: config.region,
  systemPrompt: config.systemPrompt,
  toolManager: this.toolManager,
  responseOutputTags: config.responseOutputTags,
  maxTokens: config.maxTokens,
  temperature: config.temperature,
  messageStorage: this.messageStorage,
  session: session,
});
```

5. **MCP Configuration Storage**

```typescript
this.mcpServerUrl = config.mcpServerUrl || null;
this.clientName = config.clientName || "BedrockMCPClient";
this.clientVersion = config.clientVersion || "1.0.0";
```

6. **Event System Setup**

```typescript
this.emitter = new EventEmitter() as BedrockMCPClientEmitter;
```

7. **Storage Initialization**

```typescript
this.initializeStorage();  // Async initialization

private async initializeStorage(): Promise<void> {
    try {
        await this.messageStorage.initialize();
    } catch (error) {
        this.emitter.emit("error", new Error(`Failed to initialize storage: ${error instanceof Error ? error.message : String(error)}`));
    }
}
```

#### 4.1.3 MCP Connection Implementation

**CRITICAL**: MCP connection follows exact sequence with specific error handling:

```typescript
async connect(): Promise<void> {
    // Validation
    if (!this.mcpServerUrl) {
        throw new Error("MCP server URL is required to connect");
    }

    try {
        // Event notification
        this.emitter.emit("message", "Connecting to MCP server...");

        // MCP client initialization
        this.mcpClient = new MCPClient({
            name: this.clientName,
            version: this.clientVersion,
        });

        // Connection with specific type
        await this.mcpClient.connect({
            type: "sse",                    // REQUIRED: Server-Sent Events
            url: this.mcpServerUrl
        });

        // Success events
        this.emitter.emit("message", "Connected to MCP server");
        this.emitter.emit("connected");
        this.isConnected = true;

        // Tool discovery and registration
        await this.registerMCPTools();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.emitter.emit("error", new Error(`Error connecting to MCP server: ${errorMessage}`));
        throw error;
    }
}
```

#### 4.1.4 Tool Registration System

**Custom Tool Registration with Event Wrapping:**

```typescript
registerTool(
    name: string,
    handler: ToolHandler,
    description?: string,
    inputSchema?: Record<string, any>
): void {
    // Event wrapping for all tool executions
    const wrappedHandler: ToolHandler = async (name, input) => {
        try {
            this.emitter.emit("tool:start", name, input);
            const result = await handler(name, input);
            this.emitter.emit("tool:end", name, result);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emitter.emit("error", new Error(`Error executing tool ${name}: ${errorMessage}`));
            throw error;
        }
    };

    this.toolManager.registerTool(name, wrappedHandler, description, inputSchema);
}
```

**MCP Tool Discovery and Registration:**

```typescript
private async registerMCPTools(): Promise<void> {
    if (!this.mcpClient) return;

    try {
        // Tool discovery
        const tools = await this.mcpClient.getAllTools();

        if (tools.length === 0) {
            this.emitter.emit("message", "No tools available from MCP server");
            return;
        }

        // Register each discovered tool
        for (const tool of tools) {
            if (!tool.name) {
                this.emitter.emit("message", `Skipping tool with missing name: ${JSON.stringify(tool)}`);
                continue;
            }

            try {
                // Create wrapper function for MCP tool calls
                const toolFunction: ToolHandler = async (name, input) => {
                    try {
                        const formattedInput = input || {};
                        const callToolParams = {
                            name: name,
                            arguments: formattedInput
                        };

                        return await this.mcpClient!.callTool(callToolParams);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this.emitter.emit("error", new Error(`Error calling MCP tool ${name}: ${errorMessage}`));
                        throw error;
                    }
                };

                // Register with default schema if none provided
                this.registerTool(
                    tool.name,
                    toolFunction,
                    tool.description || "",
                    tool.inputSchema || { type: "object", properties: {}, required: [] }
                );

                this.emitter.emit("message", `Registered MCP tool: ${tool.name}`);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.emitter.emit("error", new Error(`Error registering tool ${tool.name}: ${errorMessage}`));
            }
        }

        this.emitter.emit("message", `Registered ${tools.length} MCP tools`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.emitter.emit("error", new Error(`Error getting tools from MCP client: ${errorMessage}`));
    }
}
```

#### 4.1.5 Conversation Management

**Prompt Handling with Event Flow:**

```typescript
async sendPrompt(prompt: string): Promise<string> {
    try {
        this.emitter.emit("response:start");
        this.emitter.emit("message", `Sending prompt to ${this.agent.constructor.name}...`);

        const response = await this.agent.invokeWithPrompt(prompt);

        this.emitter.emit("response:chunk", response);
        this.emitter.emit("response:end", response);

        return response;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.emitter.emit("error", new Error(`Error sending prompt: ${errorMessage}`));
        throw error;
    }
}
```

**Connection Management:**

```typescript
async disconnect(): Promise<void> {
    if (this.mcpClient) {
        try {
            // Note: MCPClient doesn't have a disconnect method in this version
            this.mcpClient = null;
            this.emitter.emit("message", "Disconnected from MCP server");
            this.emitter.emit("disconnected");
            this.isConnected = false;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emitter.emit("error", new Error(`Error disconnecting from MCP server: ${errorMessage}`));
            throw error;
        }
    }

    // Close storage connection
    try {
        await this.messageStorage.close();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.emitter.emit("error", new Error(`Error closing storage: ${errorMessage}`));
    }
}
```

### 4.2 ConverseAgent - AWS Bedrock Integration

**Location**: `src/core/ConverseAgent.ts`

#### 4.2.1 Agent Configuration and Initialization

```typescript
export class ConverseAgent {
  // AWS Bedrock configuration
  private modelId: string; // Bedrock model identifier
  private region: string; // AWS region
  private bedrockClient: BedrockRuntimeClient; // AWS SDK client

  // Conversation management
  private systemPrompt: string; // Model context prompt
  private messageStorage: MessageStorage; // Conversation persistence
  private session: SessionIdentifier; // Session tracking

  // Tool integration
  private toolManager: ToolManager | null; // Tool execution manager

  // Response configuration
  private responseOutputTags: [string, string] | []; // Content extraction tags
  private maxTokens: number; // Response length limit
  private temperature: number; // Response randomness

  // System management
  private logger: Logger; // Logging instance
  private accumulatedToolResults: { name: string; text: string }[] = []; // Tool result cache
}
```

#### 4.2.2 Default System Prompt (EXACT IMPLEMENTATION REQUIRED)

**CRITICAL**: The default system prompt must match exactly:

```typescript
this.systemPrompt =
  options.systemPrompt ||
  `You are a helpful assistant with access to external tools.
                                            - Use available tools **only when necessary** to provide accurate or up-to-date information.
                                            - If a question can be answered based on your knowledge, respond directly **without using tools**.
                                            - If a tool is required:
                                                1. **Check if all necessary parameters are available.** If they are, use the tool directly.
                                                2. **If any parameters are missing, do not proceed.** Instead, ask the user for the required information, explaining why it is needed.
                                                3. **Wait for the user's response before using the tool.**
                                            - If the user asks multiple questions, **handle them one by one**.
                                            - If some questions require tools and others don't, **answer what you can immediately**, then use tools as needed.
                                            - After using a tool, continue answering any remaining questions.
                                            `;
```

#### 4.2.3 AWS Bedrock Client Configuration

```typescript
constructor(modelId: string, options: ConverseAgentOptions = {}) {
    this.modelId = modelId;
    this.region = options.region || 'us-east-1';

    // AWS SDK client initialization - NO additional configuration
    this.bedrockClient = new BedrockRuntimeClient({ region: this.region });

    // Default configuration values
    this.maxTokens = options.maxTokens || 2000;
    this.temperature = options.temperature || 0.7;
    this.responseOutputTags = options.responseOutputTags || [];

    // Storage and session setup
    this.messageStorage = options.messageStorage || new InMemoryMessageStorage();
    this.session = options.session || { sessionId: this.generateSessionId() };

    // Component initialization
    this.toolManager = options.toolManager || null;
    this.logger = createDefaultLogger('ConverseAgent');
    this.logger.setLevel(LogLevel.INFO);
}
```

#### 4.2.4 Message Processing Logic (CRITICAL IMPLEMENTATION)

**Core Invoke Method - Handles Tool Results and User Messages:**

```typescript
async invoke(content: any[]): Promise<string> {
    // Determine message type
    const isToolResult = content.length > 0 && content[0].toolResult !== undefined;

    if (!isToolResult) {
        // Clear accumulated tool results for new user queries
        this.clearAccumulatedToolResults();
    }

    if (isToolResult) {
        this.logger.debug("Detected tool result in invoke:", JSON.stringify(content, null, 2));

        // Find the last assistant message to update with tool results
        const messages = await this.messageStorage.getMessages(this.session);
        let assistantMessageIndex = -1;

        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "assistant") {
                assistantMessageIndex = i;
                break;
            }
        }

        if (assistantMessageIndex >= 0) {
            // Update existing assistant message with tool results
            const updatedMessage: Message = {
                role: "assistant",
                content: content
            };
            await this.messageStorage.updateMessage(this.session, assistantMessageIndex, updatedMessage);
            this.logger.debug("Updated assistant message with tool results");
        } else {
            // Create new assistant message if none found
            const newMessage: Message = {
                role: "assistant",
                content: content
            };
            await this.messageStorage.addMessage(this.session, newMessage);
            this.logger.debug("Added new assistant message with tool results");
        }
    } else {
        // Regular user message
        const userMessage: Message = {
            role: "user",
            content: content,
        };
        await this.messageStorage.addMessage(this.session, userMessage);
        this.logger.debug("Added user message");
    }

    // Get response from Bedrock and process
    const messages = await this.messageStorage.getMessages(this.session);
    this.logger.debug("Sending message to model:", JSON.stringify(messages[messages.length - 1], null, 2));
    const response = await this._getConverseResponse();
    return await this._handleResponse(response);
}
```

#### 4.2.5 AWS Bedrock API Integration (EXACT IMPLEMENTATION)

```typescript
private async _getConverseResponse() {
    // Get current conversation history
    const messages = await this.messageStorage.getMessages(this.session);

    // Build API command input
    const commandInput: any = {
        modelId: this.modelId,
        messages: messages,
        system: [{ text: this.systemPrompt }],
        inferenceConfig: {
            maxTokens: this.maxTokens,
            temperature: this.temperature,
        },
    };

    // Add tool configuration if tools are available
    if (this.toolManager) {
        const toolConfig = this.toolManager.getToolConfig();
        if (toolConfig) {
            commandInput.toolConfig = toolConfig;
        }
    }

    // Debug logging for API calls
    this.logger.debug("Full conversation history:", JSON.stringify(messages, null, 2));
    this.logger.debug("CONVERSE API PAYLOAD:", JSON.stringify(commandInput, null, 2));

    // Message structure debugging
    this.logger.debug("Message structure breakdown:");
    messages.forEach((msg: Message, index: number) => {
        this.logger.debug(`Message ${index} (${msg.role}):`);
        if (Array.isArray(msg.content)) {
            msg.content.forEach((contentItem: any, contentIndex: number) => {
                this.logger.debug(`  Content item ${contentIndex} type: ${Object.keys(contentItem).join(', ')}`);
            });
        } else {
            this.logger.debug(`  Content is not an array: ${typeof msg.content}`);
        }
    });

    // Execute API call
    const command = new ConverseCommand(commandInput);
    return await this.bedrockClient.send(command);
}
```

#### 4.2.6 Response Processing (CRITICAL TOOL USE LOGIC)

```typescript
private async _handleResponse(response: any): Promise<string> {
    this.logger.debug("Received response from Bedrock:", JSON.stringify(response, null, 2));

    // Validate response structure
    if (!response.output || !response.output.message) {
        this.logger.error("Invalid response structure, missing output.message");
        this.logger.error("Response:", response);
        throw new Error("Invalid response structure from Bedrock API");
    }

    this.logger.debug("Message content before pushing to history:",
        JSON.stringify(response.output.message.content, null, 2));

    const stopReason = response.stopReason;
    this.logger.debug("Stop reason:", stopReason);

    if (stopReason === 'end_turn' || stopReason === 'stop_sequence') {
        // Standard text response handling
        await this.messageStorage.addMessage(this.session, response.output.message);

        try {
            const message = response.output.message;
            const content = message.content;

            if (!content || content.length === 0) {
                this.logger.error("No content in message");
                return '';
            }

            this.logger.debug("Content:", JSON.stringify(content, null, 2));
            let text = (content[0] && content[0].text) || '';
            this.logger.debug("Extracted text:", text ? text.substring(0, 100) + "..." : "(empty)");

            // Apply response output tags if configured
            if (this.responseOutputTags.length === 2) {
                const [startTag, endTag] = this.responseOutputTags;
                const pattern = new RegExp(`${startTag}(.*?)${endTag}`, 's');
                const match = text.match(pattern);
                if (match) {
                    text = match[1];
                }
            }

            return text;
        } catch (err) {
            this.logger.error("Error extracting text from response:", err);
            return '';
        }

    } else if (stopReason === 'tool_use') {
        // Tool use response handling
        if (!this.toolManager) {
            throw new Error("Tool use requested but no tool manager is set");
        }

        try {
            // Add assistant message with tool use requests
            await this.messageStorage.addMessage(this.session, response.output.message);

            // Process each tool use request
            const toolResults = [];
            let combinedText = "";

            this.logger.debug("Processing tool use blocks...");
            for (const contentItem of response.output.message.content) {
                if (contentItem.toolUse) {
                    const toolRequest: ToolRequest = {
                        toolUseId: contentItem.toolUse.toolUseId,
                        name: contentItem.toolUse.name,
                        input: contentItem.toolUse.input || {},
                    };

                    this.logger.info(`Gathering data using tool: ${toolRequest.name} ...`);
                    this.logger.debug(`Tool request: ${JSON.stringify(toolRequest, null, 2)}`);

                    // Execute tool
                    const toolResult = await this.toolManager.executeTool(toolRequest);
                    this.logger.info("Analyzing data ...");
                    this.logger.debug(`Tool result: ${JSON.stringify(toolResult, null, 2)}`);

                    // Collect tool result
                    toolResults.push({
                        toolResult: {
                            toolUseId: toolRequest.toolUseId,
                            content: toolResult.content || [],
                            status: toolResult.status || 'success'
                        }
                    });

                    // Extract text from tool result
                    if (toolResult && toolResult.content) {
                        for (const item of toolResult.content) {
                            if (item.text) {
                                combinedText += item.text + " ";
                            }
                        }
                    }
                }
            }

            // Add user message with tool results and get next response
            if (toolResults.length > 0) {
                const userMessageWithToolResults: Message = {
                    role: "user",
                    content: toolResults
                };
                await this.messageStorage.addMessage(this.session, userMessageWithToolResults);

                // Recursive call for continued conversation
                const nextResponse = await this._getConverseResponse();
                return await this._handleResponse(nextResponse);
            }

            return combinedText.trim();

        } catch (e) {
            this.logger.error("Error executing tool:", e);
            throw new Error(`Missing required tool use field: ${e instanceof Error ? e.message : String(e)}`);
        }

    } else if (stopReason === 'max_tokens') {
        // Token limit reached - continue conversation
        await this.messageStorage.addMessage(this.session, response.output.message);
        return await this.invokeWithPrompt('Please continue.');

    } else {
        throw new Error(`Unknown stop reason: ${stopReason}`);
    }
}
```

### 4.3 ToolManager - Tool Registration and Execution

**Location**: `src/core/ToolManager.ts`

#### 4.3.1 Tool Storage and Management

```typescript
export class ToolManager {
  private tools: Record<
    string,
    {
      handler: ToolHandler;
      description?: string;
      inputSchema?: Record<string, any>;
    }
  > = {};
  private logger: Logger;

  constructor() {
    this.logger = createDefaultLogger("ToolManager");
    this.logger.setLevel(LogLevel.INFO);
  }
}
```

#### 4.3.2 Tool Registration System

```typescript
registerTool(
    name: string,
    handler: ToolHandler,
    description?: string,
    inputSchema?: Record<string, any>
): void {
    this.tools[name] = { handler, description, inputSchema };
}
```

#### 4.3.3 Bedrock Tool Configuration Generation

```typescript
getToolConfig(): ToolConfig | null {
    const toolsList = Object.entries(this.tools).map(([name, tool]) => ({
        toolSpec: {
            name,
            description: tool.description || "Tool description",
            inputSchema: {
                json: tool.inputSchema || { type: "object", properties: {}, required: [] }
            }
        } as ToolSpec
    }));

    if (toolsList.length === 0) {
        return null;
    }

    return {
        tools: toolsList
    };
}
```

#### 4.3.4 Tool Execution Logic

```typescript
async executeTool(request: ToolRequest): Promise<ToolResponse> {
    const { toolUseId, name, input } = request;

    if (!this.tools[name]) {
        throw new Error(`Unknown tool: ${name}`);
    }

    // Input normalization
    const toolInput = typeof input === 'string' ? { value: input } : input || {};

    try {
        const result = await this.tools[name].handler(name, toolInput);

        // Handle structured vs. unstructured results
        if (result && typeof result === 'object' && result.content) {
            return {
                toolUseId,
                content: result.content,
                status: 'success'
            };
        } else {
            // Convert result to text format
            let textResult;
            try {
                if (typeof result === 'object') {
                    textResult = JSON.stringify(result);
                } else {
                    textResult = String(result);
                }
            } catch (e) {
                textResult = `Error stringifying result: ${(e as Error).message}`;
            }

            return {
                toolUseId,
                content: [{ text: textResult }],
                status: 'success'
            };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error executing tool ${name}:`, error);

        return {
            toolUseId,
            content: [{ text: `Error executing tool ${name}: ${errorMessage}` }],
            status: 'error'
        };
    }
}
```

---

## SECTION 5: STORAGE SYSTEM DETAILED IMPLEMENTATION

### 5.1 MessageStorage Interface Specification

**Location**: `src/storage/MessageStorage.ts`

```typescript
export interface MessageStorage {
  // Connection management
  initialize(): Promise<void>;
  close(): Promise<void>;
  isHealthy(): Promise<boolean>;

  // Message operations
  storeMessages(session: SessionIdentifier, messages: Message[]): Promise<void>;
  getMessages(session: SessionIdentifier): Promise<Message[]>;
  addMessage(session: SessionIdentifier, message: Message): Promise<void>;
  updateMessage(
    session: SessionIdentifier,
    messageIndex: number,
    message: Message,
  ): Promise<void>;
  clearMessages(session: SessionIdentifier): Promise<void>;

  // Utility operations
  getMessageCount(session: SessionIdentifier): Promise<number>;
}
```

### 5.2 InMemoryMessageStorage Implementation

**Location**: `src/storage/InMemoryMessageStorage.ts`

#### 5.2.1 Storage Structure and Key Generation

```typescript
export class InMemoryMessageStorage implements MessageStorage {
  private messages: Map<string, Message[]> = new Map();

  private getStorageKey(session: SessionIdentifier): string {
    return session.userId
      ? `${session.userId}:${session.sessionId}`
      : session.sessionId;
  }
}
```

#### 5.2.2 Core Operations Implementation

```typescript
// No-op initialization for in-memory storage
async initialize(): Promise<void> {}
async close(): Promise<void> {}

// Message storage with array copying for immutability
async storeMessages(session: SessionIdentifier, messages: Message[]): Promise<void> {
    const key = this.getStorageKey(session);
    this.messages.set(key, [...messages]);
}

async getMessages(session: SessionIdentifier): Promise<Message[]> {
    const key = this.getStorageKey(session);
    const messages = this.messages.get(key);
    return messages ? [...messages] : [];
}

// Atomic operations using existing methods
async addMessage(session: SessionIdentifier, message: Message): Promise<void> {
    const messages = await this.getMessages(session);
    messages.push(message);
    await this.storeMessages(session, messages);
}

async updateMessage(session: SessionIdentifier, messageIndex: number, message: Message): Promise<void> {
    const messages = await this.getMessages(session);

    if (messageIndex >= 0 && messageIndex < messages.length) {
        messages[messageIndex] = message;
        await this.storeMessages(session, messages);
    } else {
        throw new Error(`Message index ${messageIndex} out of bounds for session ${session.sessionId}`);
    }
}

async clearMessages(session: SessionIdentifier): Promise<void> {
    const key = this.getStorageKey(session);
    this.messages.delete(key);
}

async getMessageCount(session: SessionIdentifier): Promise<number> {
    const messages = await this.getMessages(session);
    return messages.length;
}

async isHealthy(): Promise<boolean> {
    return true; // Always healthy for in-memory storage
}
```

### 5.3 RedisMessageStorage Implementation

**Location**: `src/storage/RedisMessageStorage.ts`

#### 5.3.1 Configuration and Connection Management

```typescript
export class RedisMessageStorage implements MessageStorage {
  private client: RedisClientType | null = null;
  private config: Required<RedisStorageConfig>;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(config: RedisStorageConfig = {}) {
    // Default configuration with all required fields
    this.config = {
      host: config.host || "localhost",
      port: config.port || 6379,
      password: config.password || "",
      db: config.db || 0,
      keyPrefix: config.keyPrefix || "bedrock-mcp:conversation:",
      ttl: config.ttl || 86400, // 24 hours
      connectionOptions: config.connectionOptions || {},
    };

    this.logger = createDefaultLogger("RedisMessageStorage");
    this.logger.setLevel(LogLevel.INFO);
  }
}
```

#### 5.3.2 Redis Key Management

```typescript
private getRedisKey(session: SessionIdentifier): string {
    const sessionKey = session.userId ? `${session.userId}:${session.sessionId}` : session.sessionId;
    return `${this.config.keyPrefix}${sessionKey}`;
}
```

#### 5.3.3 Connection Initialization and Management

```typescript
async initialize(): Promise<void> {
    if (this.isInitialized && this.client?.isOpen) {
        return;
    }

    try {
        // Build Redis URL with authentication
        const redisUrl = this.config.password
            ? `redis://:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.db}`
            : `redis://${this.config.host}:${this.config.port}/${this.config.db}`;

        // Create client with configuration
        this.client = createClient({
            url: redisUrl,
            ...this.config.connectionOptions
        });

        // Event listeners for connection monitoring
        this.client.on('error', (err) => {
            this.logger.error('Redis client error:', err);
        });

        this.client.on('connect', () => {
            this.logger.info('Connected to Redis');
        });

        this.client.on('disconnect', () => {
            this.logger.warn('Disconnected from Redis');
        });

        await this.client.connect();
        this.isInitialized = true;
        this.logger.info(`Redis storage initialized at ${this.config.host}:${this.config.port}`);

    } catch (error) {
        this.logger.error('Failed to initialize Redis storage:', error);
        throw new Error(`Redis initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async close(): Promise<void> {
    if (this.client?.isOpen) {
        await this.client.disconnect();
        this.logger.info('Redis connection closed');
    }
    this.isInitialized = false;
}

private async ensureConnected(): Promise<void> {
    if (!this.isInitialized || !this.client?.isOpen) {
        await this.initialize();
    }
}
```

#### 5.3.4 Message Operations with TTL Support

```typescript
async storeMessages(session: SessionIdentifier, messages: Message[]): Promise<void> {
    await this.ensureConnected();

    const key = this.getRedisKey(session);
    const serializedMessages = JSON.stringify(messages);

    try {
        await this.client!.setEx(key, this.config.ttl, serializedMessages);
        this.logger.debug(`Stored ${messages.length} messages for session ${session.sessionId}`);
    } catch (error) {
        this.logger.error(`Failed to store messages for session ${session.sessionId}:`, error);
        throw new Error(`Redis store operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async getMessages(session: SessionIdentifier): Promise<Message[]> {
    await this.ensureConnected();

    const key = this.getRedisKey(session);

    try {
        const serializedMessages = await this.client!.get(key);

        if (!serializedMessages) {
            this.logger.debug(`No messages found for session ${session.sessionId}`);
            return [];
        }

        const messages = JSON.parse(serializedMessages) as Message[];
        this.logger.debug(`Retrieved ${messages.length} messages for session ${session.sessionId}`);
        return messages;
    } catch (error) {
        this.logger.error(`Failed to retrieve messages for session ${session.sessionId}:`, error);
        throw new Error(`Redis get operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Atomic operations using read-modify-write pattern
async addMessage(session: SessionIdentifier, message: Message): Promise<void> {
    const messages = await this.getMessages(session);
    messages.push(message);
    await this.storeMessages(session, messages);
}

async updateMessage(session: SessionIdentifier, messageIndex: number, message: Message): Promise<void> {
    const messages = await this.getMessages(session);

    if (messageIndex >= 0 && messageIndex < messages.length) {
        messages[messageIndex] = message;
        await this.storeMessages(session, messages);
    } else {
        throw new Error(`Message index ${messageIndex} out of bounds for session ${session.sessionId}`);
    }
}

async clearMessages(session: SessionIdentifier): Promise<void> {
    await this.ensureConnected();

    const key = this.getRedisKey(session);

    try {
        await this.client!.del(key);
        this.logger.debug(`Cleared messages for session ${session.sessionId}`);
    } catch (error) {
        this.logger.error(`Failed to clear messages for session ${session.sessionId}:`, error);
        throw new Error(`Redis delete operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async isHealthy(): Promise<boolean> {
    try {
        await this.ensureConnected();
        await this.client!.ping();
        return true;
    } catch (error) {
        this.logger.error('Redis health check failed:', error);
        return false;
    }
}
```

#### 5.3.5 Advanced Redis Operations

```typescript
// TTL management for individual sessions
async setSessionTTL(session: SessionIdentifier, ttlSeconds: number): Promise<void> {
    await this.ensureConnected();

    const key = this.getRedisKey(session);

    try {
        await this.client!.expire(key, ttlSeconds);
        this.logger.debug(`Set TTL of ${ttlSeconds}s for session ${session.sessionId}`);
    } catch (error) {
        this.logger.error(`Failed to set TTL for session ${session.sessionId}:`, error);
        throw new Error(`Redis expire operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Session discovery for management/debugging
async getActiveSessions(): Promise<string[]> {
    await this.ensureConnected();

    try {
        const keys = await this.client!.keys(`${this.config.keyPrefix}*`);
        return keys.map(key => key.replace(this.config.keyPrefix, ''));
    } catch (error) {
        this.logger.error('Failed to get active sessions:', error);
        throw new Error(`Redis keys operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Redis server information
async getRedisInfo(): Promise<string> {
    await this.ensureConnected();

    try {
        return await this.client!.info();
    } catch (error) {
        this.logger.error('Failed to get Redis info:', error);
        throw new Error(`Redis info operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Dynamic log level configuration
setLogLevel(level: LogLevel): void {
    this.logger.setLevel(level);
}
```

---

## SECTION 6: LOGGING SYSTEM IMPLEMENTATION

### 6.1 LogLevel Enumeration

**Location**: `src/utils/logging.ts`

```typescript
export enum LogLevel {
  DEBUG = 0, // Detailed debugging information
  INFO = 1, // General information messages
  WARN = 2, // Warning messages
  ERROR = 3, // Error messages
  NONE = 4, // No logging
}
```

### 6.2 Logger Configuration Interface

```typescript
export interface LoggerConfig {
  level: LogLevel; // Minimum log level to output
  prefix?: string; // Optional prefix for all messages
  enableTimestamps?: boolean; // Whether to include timestamps
}
```

### 6.3 Logger Implementation

```typescript
export class Logger {
  private level: LogLevel;
  private prefix: string;
  private enableTimestamps: boolean;

  constructor(config: LoggerConfig) {
    this.level = config.level;
    this.prefix = config.prefix || "";
    this.enableTimestamps = config.enableTimestamps || false;
  }

  // Public logging methods
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  // Dynamic level configuration
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // Core logging implementation
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.level) {
      return;
    }

    let prefix = this.prefix ? `[${this.prefix}] ` : "";

    if (this.enableTimestamps) {
      const timestamp = new Date().toISOString();
      prefix = `[${timestamp}] ${prefix}`;
    }

    const levelPrefix = this.getLevelPrefix(level);
    const formattedMessage = `${prefix}${levelPrefix}${message}`;

    // Route to appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, ...args);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args);
        break;
    }
  }

  private getLevelPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "[DEBUG] ";
      case LogLevel.INFO:
        return "[INFO] ";
      case LogLevel.WARN:
        return "[WARN] ";
      case LogLevel.ERROR:
        return "[ERROR] ";
      default:
        return "";
    }
  }
}
```

### 6.4 Default Logger Factory

```typescript
export function createDefaultLogger(prefix?: string): Logger {
  return new Logger({
    level: LogLevel.INFO,
    prefix,
    enableTimestamps: true,
  });
}
```

---

## SECTION 7: CLI IMPLEMENTATION COMPREHENSIVE SPECIFICATION

### 7.1 CLI Architecture Overview

**Location**: `src/cli/index.ts`

The CLI implements a full REPL (Read-Eval-Print Loop) interface with:

- Command-line argument parsing
- Interactive session management
- Event-driven response handling
- Built-in commands and help system

### 7.2 CLI Options Interface

```typescript
interface CLIOptions {
  modelId: string; // Required: Bedrock model ID
  region?: string; // Optional: AWS region
  systemPrompt?: string; // Optional: Custom system prompt
  mcpServerUrl?: string; // Optional: MCP server URL
  clientName?: string; // Optional: Client identification
  clientVersion?: string; // Optional: Client version
}
```

### 7.3 Argument Parsing Implementation

```typescript
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0", // Default model
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--model":
      case "-m":
        options.modelId = args[++i];
        break;
      case "--region":
      case "-r":
        options.region = args[++i];
        break;
      case "--system-prompt":
      case "-s":
        options.systemPrompt = args[++i];
        break;
      case "--mcp-url":
      case "-u":
        options.mcpServerUrl = args[++i];
        break;
      case "--name":
      case "-n":
        options.clientName = args[++i];
        break;
      case "--version":
      case "-v":
        options.clientVersion = args[++i];
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}
```

### 7.4 Help System Implementation

**EXACT TEXT REQUIRED:**

```typescript
function printHelp(): void {
  console.log(`
Bedrock MCP Connector CLI

Usage: @juspay/bedrock-mcp-connector [options]

Options:
  -m, --model <id>           AWS Bedrock model ID (default: anthropic.claude-3-sonnet-20240229-v1:0)
  -r, --region <region>      AWS region (default: us-east-1)
  -s, --system-prompt <text> System prompt for the model
  -u, --mcp-url <url>        MCP server URL
  -n, --name <name>          Client name
  -v, --version <version>    Client version
  -h, --help                 Show this help message
`);
}
```

### 7.5 Main CLI Run Function

```typescript
export async function runCLI(): Promise<void> {
  try {
    const options = parseArgs();

    // Create and configure client
    const client = new BedrockMCPClient({
      modelId: options.modelId,
      region: options.region,
      systemPrompt: options.systemPrompt,
      mcpServerUrl: options.mcpServerUrl,
      clientName: options.clientName,
      clientVersion: options.clientVersion,
    });

    // Set up event listeners
    const emitter = client.getEmitter();

    emitter.on("message", (message) => {
      logger.info(message);
    });

    emitter.on("error", (error) => {
      logger.error(error.message);
    });

    emitter.on("tool:start", (toolName, input) => {
      logger.info(`Executing tool: ${toolName}`);
    });

    emitter.on("tool:end", (toolName, result) => {
      logger.info(`Tool ${toolName} execution completed`);
    });

    // Optional MCP connection
    if (options.mcpServerUrl) {
      try {
        await client.connect();
        logger.info(`Connected to MCP server at ${options.mcpServerUrl}`);

        const tools = client.getTools();
        if (tools.length > 0) {
          logger.info(
            `Available tools: ${tools.map((t) => t.name).join(", ")}`,
          );
        } else {
          logger.info("No tools available");
        }
      } catch (error) {
        logger.warn(
          `Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`,
        );
        logger.info("Continuing without MCP tools");
      }
    }

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = (query: string): Promise<string> =>
      new Promise((resolve) => rl.question(query, resolve));

    // Welcome banner (EXACT FORMATTING REQUIRED)
    console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║          @juspay/Bedrock MCP Connector CLI         ║
║                                                    ║
╚════════════════════════════════════════════════════╝

Model: ${options.modelId}
Type 'quit', 'exit', or 'q' to exit
Type 'help' for available commands
`);

    // Main REPL loop
    while (true) {
      const userPrompt = await askQuestion("> ");
      const command = userPrompt.trim().toLowerCase();

      // Exit commands
      if (["quit", "exit", "q"].includes(command)) {
        break;
      }

      // Help command
      if (command === "help") {
        console.log(`
Available commands:
  help                 Show this help message
  tools                List available tools
  clear                Clear the conversation history
  quit, exit, q        Exit the CLI
`);
        continue;
      }

      // Tools command
      if (command === "tools") {
        const tools = client.getTools();
        if (tools.length > 0) {
          console.log("\nAvailable tools:");
          tools.forEach((tool) => {
            console.log(
              `  - ${tool.name}${tool.description ? `: ${tool.description}` : ""}`,
            );
          });
          console.log("");
        } else {
          console.log("\nNo tools available\n");
        }
        continue;
      }

      // Clear command
      if (command === "clear") {
        client.clearConversationHistory();
        console.log("\nConversation history cleared\n");
        continue;
      }

      // Process user input
      if (userPrompt.trim()) {
        try {
          console.log("\nThinking...");
          const response = await client.sendPrompt(userPrompt);
          console.log(`\n${response}\n`);
        } catch (error) {
          console.error(
            `\nError: ${error instanceof Error ? error.message : String(error)}\n`,
          );
        }
      }
    }

    // Cleanup
    rl.close();
    if (client.isConnectedToMCP()) {
      await client.disconnect();
    }

    console.log("\nGoodbye!\n");
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
```

### 7.6 CLI Module Detection for Direct Execution

```typescript
// ES Module main module detection
const isMainModule = import.meta.url.endsWith(
  process.argv[1].replace("file://", ""),
);
if (isMainModule) {
  runCLI().catch(console.error);
}
```

---

## SECTION 8: EXAMPLE IMPLEMENTATIONS

### 8.1 Basic Example (src/examples/basic.ts)

**COMPLETE IMPLEMENTATION WITH ALL FEATURES:**

```typescript
import { BedrockMCPClient, LogLevel, createDefaultLogger } from "../index.js";

// Logger setup
const logger = createDefaultLogger("Example");
logger.setLevel(LogLevel.DEBUG);

// Configuration
const config = {
  modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
  region: "us-east-1",
  systemPrompt:
    "You are a helpful assistant that provides concise and accurate information.",
  mcpServerUrl: "http://localhost:5713/sse", // Optional MCP server
  clientName: "Example Client",
  clientVersion: "1.0.0",
};

async function runExample() {
  logger.info("Starting example...");

  // Create client
  const client = new BedrockMCPClient(config);

  // Complete event listener setup
  const emitter = client.getEmitter();

  emitter.on("message", (message) => {
    logger.info(`Message: ${message}`);
  });

  emitter.on("error", (error) => {
    logger.error(`Error: ${error.message}`);
  });

  emitter.on("tool:start", (toolName, input) => {
    logger.info(
      `Tool started: ${toolName} with input: ${JSON.stringify(input)}`,
    );
  });

  emitter.on("tool:end", (toolName, result) => {
    logger.info(`Tool completed: ${toolName}`);
  });

  emitter.on("response:start", () => {
    logger.info("Response started");
  });

  emitter.on("response:chunk", (chunk) => {
    logger.debug(`Response chunk: ${chunk.substring(0, 50)}...`);
  });

  emitter.on("response:end", (fullResponse) => {
    logger.info("Response completed");
  });

  try {
    // Optional MCP connection
    if (config.mcpServerUrl) {
      try {
        await client.connect();
        logger.info(`Connected to MCP server at ${config.mcpServerUrl}`);

        const tools = client.getTools();
        if (tools.length > 0) {
          logger.info(
            `Available tools: ${tools.map((t) => t.name).join(", ")}`,
          );
        } else {
          logger.info("No tools available");
        }
      } catch (error) {
        logger.warn(
          `Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`,
        );
        logger.info("Continuing without MCP tools");
      }
    }

    // Custom tool registration
    client.registerTool(
      "getCurrentTime",
      async (name, input) => {
        const timezone = input.timezone || "UTC";
        const date = new Date().toLocaleString("en-US", { timeZone: timezone });
        return {
          content: [{ text: `The current time is ${date} in ${timezone}` }],
        };
      },
      "Get the current time in the specified timezone",
      {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description:
              "The timezone to get the time for (e.g., UTC, America/New_York)",
          },
        },
        required: [],
      },
    );

    // Send example prompt
    logger.info("Sending prompt...");
    const response = await client.sendPrompt(
      "What is the capital of France? Also, what time is it now?",
    );

    logger.info("Response:");
    console.log("\n" + response + "\n");

    // Cleanup
    if (client.isConnectedToMCP()) {
      await client.disconnect();
      logger.info("Disconnected from MCP server");
    }
  } catch (error) {
    logger.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Execute example
runExample().catch((error) => {
  console.error(
    `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
```

### 8.2 Interactive Example (src/examples/interact.js)

**NOTE**: This file is JavaScript (.js) not TypeScript, demonstrating JavaScript compatibility:

```javascript
#!/usr/bin/env node

// Import the BedrockMCPClient
import { BedrockMCPClient, LogLevel } from "../dist/index.js";

// Parse command line arguments
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace("--", "");
    const value = process.argv[i + 1];
    args[key] = value;
  }
  return args;
}

// Print usage information
function printUsage() {
  console.log(`
Usage: node interact.js [options]

Options:
  --model <model-id>       Specify the model ID (default: anthropic.claude-3-sonnet-20240229-v1:0)
  --region <region>        Specify the AWS region (default: us-east-1)
  --max-tokens <number>    Specify the maximum tokens (default: 2000)
  --temperature <number>   Specify the temperature (default: 0.7)
  --mcp-url <url>          Specify the MCP server URL
  --help                   Show this help message
`);
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  // Configuration with environment variable fallbacks
  const config = {
    modelId:
      args.model ||
      process.env.BEDROCK_MODEL_ID ||
      "anthropic.claude-3-sonnet-20240229-v1:0",
    region: args.region || process.env.AWS_REGION || "us-east-1",
    maxTokens: parseInt(args["max-tokens"] || process.env.MAX_TOKENS || "2000"),
    temperature: parseFloat(
      args.temperature || process.env.TEMPERATURE || "0.7",
    ),
    mcpServerUrl: args["mcp-url"] || process.env.MCP_SERVER_URL,
    clientName: "Interactive Example",
    clientVersion: "1.0.0",
  };

  console.log(`
Interactive Bedrock MCP Connector Example
========================================
  • Model: ${config.modelId}
  • Region: ${config.region}
  • Max Tokens: ${config.maxTokens}
  • Temperature: ${config.temperature}
  • MCP URL: ${config.mcpServerUrl || "Not configured"}

Starting interactive session...
`);

  try {
    // Create client
    const client = new BedrockMCPClient(config);

    // Set debug logging
    client.setLogLevel(LogLevel.DEBUG);

    // Set up event listeners
    const emitter = client.getEmitter();

    emitter.on("message", (message) => {
      console.log(`[CLIENT] ${message}`);
    });

    emitter.on("error", (error) => {
      console.error(`[ERROR] ${error.message}`);
    });

    // Connect to MCP if configured
    if (config.mcpServerUrl) {
      try {
        await client.connect();
        console.log(`[SUCCESS] Connected to MCP server`);

        const tools = client.getTools();
        if (tools.length > 0) {
          console.log(
            `[TOOLS] Available: ${tools.map((t) => t.name).join(", ")}`,
          );
        }
      } catch (error) {
        console.warn(`[WARNING] MCP connection failed: ${error.message}`);
      }
    }

    // Register example tools
    client.registerTool(
      "getSystemInfo",
      async (name, input) => {
        return {
          content: [
            {
              text: `System Info:
- Node.js Version: ${process.version}
- Platform: ${process.platform}
- Architecture: ${process.arch}
- Memory Usage: ${JSON.stringify(process.memoryUsage(), null, 2)}`,
            },
          ],
        };
      },
      "Get system information about the current Node.js process",
    );

    // Interactive loop
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    console.log(
      '\nType "exit" to quit, "tools" to list tools, or enter a message:\n',
    );

    while (true) {
      const input = await question("> ");

      if (input.toLowerCase().trim() === "exit") {
        break;
      }

      if (input.toLowerCase().trim() === "tools") {
        const tools = client.getTools();
        console.log(
          `\nAvailable tools: ${tools.map((t) => t.name).join(", ")}\n`,
        );
        continue;
      }

      if (input.trim()) {
        try {
          const response = await client.sendPrompt(input);
          console.log(`\n[RESPONSE] ${response}\n`);
        } catch (error) {
          console.error(`\n[ERROR] ${error.message}\n`);
        }
      }
    }

    rl.close();

    // Cleanup
    if (client.isConnectedToMCP()) {
      await client.disconnect();
    }

    console.log("\nGoodbye!");
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
```

---

## SECTION 9: TESTING INFRASTRUCTURE SPECIFICATION

### 9.1 Testing Documentation (TESTING.md)

**EXACT CONTENT REQUIRED:**

````markdown
# Testing Guide

## Prerequisites

1. AWS credentials configured with access to AWS Bedrock
2. Node.js 18+ installed
3. Redis server (for Redis storage tests)

## Running Tests

### Package Tests

```bash
node test-package.js
```
````

### Storage Tests

```bash
node test-storage.js
```

### AWS Credentials

Make sure your AWS credentials are properly configured:

```bash
# Check if AWS credentials are configured
aws sts get-caller-identity
```

The client needs:

- AWS Access Key ID
- AWS Secret Access Key
- Default region (matching the region in your config)

## Troubleshooting

1. **Authentication Error**: Check your AWS credentials
2. **Model Error**: Ensure you have access to the Bedrock model
3. **Region Error**: Make sure the region in your config matches your AWS credentials
4. **Redis Error**: Ensure Redis server is running for storage tests

````

### 9.2 Package Integration Test (test-package.js)

**COMPLETE IMPLEMENTATION:**

```javascript
#!/usr/bin/env node

// Test the package functionality without external dependencies
console.log('Testing @juspay/bedrock-mcp-connector package...\n');

async function testPackage() {
    try {
        // Test 1: Import the package
        console.log('1. Testing package imports...');
        const {
            BedrockMCPClient,
            ConverseAgent,
            ToolManager,
            Logger,
            LogLevel,
            createDefaultLogger,
            InMemoryMessageStorage
        } = await import('./dist/index.js');

        console.log('   ✓ Package imports successful');

        // Test 2: Create logger
        console.log('2. Testing logger functionality...');
        const logger = createDefaultLogger('Test');
        logger.setLevel(LogLevel.DEBUG);
        logger.info('Test log message');
        console.log('   ✓ Logger functionality works');

        // Test 3: Create in-memory storage
        console.log('3. Testing in-memory storage...');
        const storage = new InMemoryMessageStorage();
        await storage.initialize();

        const session = { sessionId: 'test-session' };
        const testMessage = {
            role: 'user',
            content: [{ text: 'Hello, world!' }]
        };

        await storage.addMessage(session, testMessage);
        const messages = await storage.getMessages(session);

        if (messages.length === 1 && messages[0].content[0].text === 'Hello, world!') {
            console.log('   ✓ In-memory storage works');
        } else {
            throw new Error('Storage test failed');
        }

        // Test 4: Tool manager
        console.log('4. Testing tool manager...');
        const toolManager = new ToolManager();

        toolManager.registerTool(
            'testTool',
            async (name, input) => {
                return `Tool ${name} received: ${JSON.stringify(input)}`;
            },
            'A test tool',
            { type: 'object', properties: {} }
        );

        const tools = toolManager.getTools();
        if (tools.length === 1 && tools[0].name === 'testTool') {
            console.log('   ✓ Tool manager works');
        } else {
            throw new Error('Tool manager test failed');
        }

        // Test 5: Client creation (without AWS calls)
        console.log('5. Testing client creation...');
        const client = new BedrockMCPClient({
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            region: 'us-east-1',
        });

        // Test event emitter
        const emitter = client.getEmitter();
        let eventReceived = false;
        emitter.on('message', () => { eventReceived = true; });
        emitter.emit('message', 'test');

        if (eventReceived) {
            console.log('   ✓ Client creation and event system works');
        } else {
            throw new Error('Event system test failed');
        }

        // Test 6: Custom tool registration
        console.log('6. Testing custom tool registration...');
        client.registerTool(
            'getCurrentTime',
            async (name, input) => {
                const timezone = input.timezone || 'UTC';
                const date = new Date().toLocaleString('en-US', { timeZone: timezone });
                return { content: [{ text: `The current time is ${date} in ${timezone}` }] };
            },
            'Get the current time in the specified timezone',
            {
                type: 'object',
                properties: {
                    timezone: {
                        type: 'string',
                        description: 'The timezone to get the time for (e.g., UTC, America/New_York)',
                    },
                },
                required: [],
            }
        );

        const clientTools = client.getTools();
        if (clientTools.some(tool => tool.name === 'getCurrentTime')) {
            console.log('   ✓ Custom tool registration works');
        } else {
            throw new Error('Tool registration test failed');
        }

        console.log('\n✅ All package tests passed successfully!\n');

        console.log('Package is ready for use. To test with AWS Bedrock:');
        console.log('1. Configure your AWS credentials');
        console.log('2. Run: node test-storage.js');
        console.log('3. Or try the interactive example: node src/examples/interact.js\n');

    } catch (error) {
        console.error(`\n❌ Package test failed: ${error.message}\n`);
        process.exit(1);
    }
}

testPackage();
````

### 9.3 Storage System Test (test-storage.js)

**COMPLETE IMPLEMENTATION:**

```javascript
#!/usr/bin/env node

// Test storage systems and basic AWS connectivity
console.log("Testing Bedrock MCP Connector storage systems...\n");

async function testStorage() {
  try {
    // Import the package
    const {
      BedrockMCPClient,
      InMemoryMessageStorage,
      RedisMessageStorage,
      LogLevel,
    } = await import("./dist/index.js");

    // Test 1: In-Memory Storage
    console.log("1. Testing In-Memory Storage...");
    await testInMemoryStorage(InMemoryMessageStorage);

    // Test 2: Redis Storage (if available)
    console.log("2. Testing Redis Storage...");
    await testRedisStorage(RedisMessageStorage);

    // Test 3: Basic client functionality with storage
    console.log("3. Testing client with different storage backends...");
    await testClientWithStorage(BedrockMCPClient);

    console.log("\n✅ All storage tests passed!\n");
  } catch (error) {
    console.error(`\n❌ Storage test failed: ${error.message}\n`);
    process.exit(1);
  }
}

async function testInMemoryStorage(InMemoryMessageStorage) {
  const storage = new InMemoryMessageStorage();
  await storage.initialize();

  const session1 = { sessionId: "session1", userId: "user1" };
  const session2 = { sessionId: "session2", userId: "user2" };

  // Test basic operations
  const message1 = {
    role: "user",
    content: [{ text: "Hello from session 1" }],
  };
  const message2 = {
    role: "user",
    content: [{ text: "Hello from session 2" }],
  };

  await storage.addMessage(session1, message1);
  await storage.addMessage(session2, message2);

  const messages1 = await storage.getMessages(session1);
  const messages2 = await storage.getMessages(session2);

  if (messages1.length !== 1 || messages2.length !== 1) {
    throw new Error("Session isolation failed");
  }

  // Test message updates
  const updatedMessage = {
    role: "assistant",
    content: [{ text: "Updated message" }],
  };
  await storage.updateMessage(session1, 0, updatedMessage);

  const updatedMessages = await storage.getMessages(session1);
  if (updatedMessages[0].role !== "assistant") {
    throw new Error("Message update failed");
  }

  // Test health check
  const isHealthy = await storage.isHealthy();
  if (!isHealthy) {
    throw new Error("Health check failed");
  }

  await storage.close();
  console.log("   ✓ In-memory storage passed all tests");
}

async function testRedisStorage(RedisMessageStorage) {
  try {
    const storage = new RedisMessageStorage({
      host: "localhost",
      port: 6379,
      db: 1, // Use different DB for testing
      keyPrefix: "test:bedrock-mcp:",
      ttl: 300, // 5 minutes for testing
    });

    await storage.initialize();

    const session = { sessionId: "redis-test-session" };
    const message = { role: "user", content: [{ text: "Redis test message" }] };

    await storage.addMessage(session, message);
    const messages = await storage.getMessages(session);

    if (
      messages.length !== 1 ||
      messages[0].content[0].text !== "Redis test message"
    ) {
      throw new Error("Redis storage operation failed");
    }

    // Test health check
    const isHealthy = await storage.isHealthy();
    if (!isHealthy) {
      throw new Error("Redis health check failed");
    }

    // Cleanup
    await storage.clearMessages(session);
    await storage.close();

    console.log("   ✓ Redis storage passed all tests");
  } catch (error) {
    if (
      error.message.includes("Redis") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.log("   ⚠ Redis not available, skipping Redis tests");
      console.log("     To test Redis: Start Redis server and run again");
    } else {
      throw error;
    }
  }
}

async function testClientWithStorage(BedrockMCPClient) {
  // Test with in-memory storage
  const client1 = new BedrockMCPClient({
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    region: "us-east-1",
    storage: { type: "memory" },
  });

  // Test storage info
  const storageInfo = client1.getStorageInfo();
  if (storageInfo.type !== "memory") {
    throw new Error("Storage type detection failed");
  }

  // Test with Redis storage (if available)
  try {
    const client2 = new BedrockMCPClient({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      region: "us-east-1",
      storage: {
        type: "redis",
        config: {
          host: "localhost",
          port: 6379,
          db: 2,
          keyPrefix: "test-client:",
        },
      },
    });

    const redisStorageInfo = client2.getStorageInfo();
    if (redisStorageInfo.type !== "redis") {
      throw new Error("Redis storage type detection failed");
    }

    console.log("   ✓ Client storage configuration works");
  } catch (error) {
    if (
      error.message.includes("Redis") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.log("   ⚠ Redis client test skipped (Redis not available)");
    } else {
      throw error;
    }
  }
}

// Mock AWS test (without making actual calls)
async function testAWSConnection() {
  console.log("4. Testing AWS SDK initialization...");

  try {
    const { BedrockMCPClient } = await import("./dist/index.js");

    const client = new BedrockMCPClient({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      region: "us-east-1",
    });

    // Test that client was created successfully
    const agent = client.getAgent();
    const bedrockClient = agent.getBedrockClient();

    if (
      bedrockClient &&
      bedrockClient.constructor.name === "BedrockRuntimeClient"
    ) {
      console.log("   ✓ AWS Bedrock client initialization successful");
    } else {
      throw new Error("Bedrock client not properly initialized");
    }
  } catch (error) {
    console.log(`   ⚠ AWS test skipped: ${error.message}`);
    console.log("     This is normal if AWS credentials are not configured");
  }
}

testStorage().then(() => testAWSConnection());
```

---

## SECTION 10: BUILD AND DISTRIBUTION CONFIGURATION

### 10.1 TypeScript Configuration (tsconfig.json)

**EXACT CONFIGURATION REQUIRED:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Key Configuration Details:**

- **Target ES2020**: Modern JavaScript features
- **Module NodeNext**: Latest Node.js ES module support
- **Strict Mode**: Full TypeScript strictness
- **Declaration Files**: Generate .d.ts files for TypeScript consumers
- **Output/Input**: dist/ and src/ directories

### 10.2 Package Configuration (package.json)

**COMPLETE CONFIGURATION:**

```json
{
  "name": "@juspay/bedrock-mcp-connector",
  "version": "1.1.0",
  "description": "A client for interacting with AWS Bedrock and MCP servers",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "@juspay/bedrock-mcp-connector": "dist/bin.js"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc",
    "start": "node dist/bin.js",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build",
    "example": "node dist/examples/basic.js"
  },
  "keywords": [
    "aws",
    "bedrock",
    "claude",
    "mcp",
    "client",
    "ai",
    "llm",
    "tools",
    "model-context-protocol"
  ],
  "author": "Swaroop Varma",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/juspay/Bedrock-MCP-Connector"
  },
  "bugs": {
    "url": "https://github.com/juspay/Bedrock-MCP-Connector/issues"
  },
  "homepage": "https://github.com/juspay/Bedrock-MCP-Connector#readme",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.0.0",
    "events": "^3.3.0",
    "mcp-client": "^1.12.0",
    "redis": "^5.8.2"
  },
  "packageManager": "pnpm@10.0.0+sha512.b8fef5494bd3fe4cbd4edabd0745df2ee5be3e4b0b8b08fa643aa3e4c6702ccc0f00d68fa8a8c9858a735a0032485a44990ed2810526c875e416f001b17df12b",
  "devDependencies": {
    "@types/events": "^3.0.3",
    "@types/node": "^22.13.13",
    "typescript": "^5.8.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Critical Package Details:**

- **Type: "module"**: Pure ES modules
- **Main/Types**: Dual entry points for JS/TS
- **Binary**: CLI executable configuration
- **Files**: Limited distribution (dist + README only)
- **Scripts**: Standard build/dev workflow
- **Package Manager**: PNPM preference indicated

### 10.3 Build Process

1. **Development**: `npm run dev` (watch mode)
2. **Production**: `npm run build` (compile to dist/)
3. **Testing**: `node test-package.js` and `node test-storage.js`
4. **Distribution**: `npm publish` (with prepublishOnly hook)

### 10.4 Module Export Strategy

Each module has an index.ts file that exports its public API:

**src/index.ts** (Main entry):

```typescript
export { BedrockMCPClient } from "./client/index.js";
export { ConverseAgent, ToolManager } from "./core/index.js";
export { Logger, LogLevel, createDefaultLogger } from "./utils/index.js";
export {
  MessageStorage,
  InMemoryMessageStorage,
  RedisMessageStorage,
  StorageConfig,
  RedisStorageConfig,
  SessionIdentifier,
} from "./storage/index.js";
export {
  BedrockMCPClientConfig,
  BedrockMCPClientEvents,
  BedrockMCPClientEmitter,
  Message,
  MessageContent,
  TextContent,
  ToolUseContent,
  ToolResultContent,
  ToolRequest,
  ToolResponse,
  ToolHandler,
  ToolSpec,
  ToolConfig,
} from "./types.js";
export { runCLI } from "./cli/index.js";
```

---

## SECTION 11: CRITICAL IMPLEMENTATION REQUIREMENTS

### 11.1 Session ID Generation Algorithm

**EXACT IMPLEMENTATION REQUIRED:**

```typescript
private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

**Format**: `session_[timestamp]_[random-9-chars]`
**Example**: `session_1640995200000_k2j3h4g5f`

### 11.2 Default System Prompt (EXACT TEXT)

```typescript
const defaultSystemPrompt = `You are a helpful assistant with access to external tools.
                                            - Use available tools **only when necessary** to provide accurate or up-to-date information.
                                            - If a question can be answered based on your knowledge, respond directly **without using tools**.
                                            - If a tool is required:
                                                1. **Check if all necessary parameters are available.** If they are, use the tool directly.
                                                2. **If any parameters are missing, do not proceed.** Instead, ask the user for the required information, explaining why it is needed.
                                                3. **Wait for the user's response before using the tool.**
                                            - If the user asks multiple questions, **handle them one by one**.
                                            - If some questions require tools and others don't, **answer what you can immediately**, then use tools as needed.
                                            - After using a tool, continue answering any remaining questions.
                                            `;
```

### 11.3 Redis Key Format

**Pattern**: `${keyPrefix}${userId}:${sessionId}` or `${keyPrefix}${sessionId}`
**Default Prefix**: `bedrock-mcp:conversation:`
**Examples**:

- With user: `bedrock-mcp:conversation:user123:session_1640995200000_k2j3h4g5f`
- Without user: `bedrock-mcp:conversation:session_1640995200000_k2j3h4g5f`

### 11.4 Event Emission Points

**CRITICAL**: Events must be emitted at exact points in the code:

1. **MCP Connection Events**:
   - `message`: "Connecting to MCP server..."
   - `message`: "Connected to MCP server"
   - `connected`: (no parameters)

2. **Tool Execution Events**:
   - `tool:start`: (toolName, input)
   - `tool:end`: (toolName, result)

3. **Response Events**:
   - `response:start`: (no parameters)
   - `response:chunk`: (chunk)
   - `response:end`: (fullResponse)

4. **Error Events**:
   - `error`: (Error object)

### 11.5 CLI Banner Format (EXACT ASCII ART)

```
╔════════════════════════════════════════════════════╗
║                                                    ║
║          @juspay/Bedrock MCP Connector CLI         ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### 11.6 Default Configuration Values

**CRITICAL DEFAULTS:**

```typescript
const DEFAULT_VALUES = {
  region: "us-east-1",
  maxTokens: 2000,
  temperature: 0.7,
  clientName: "BedrockMCPClient",
  clientVersion: "1.0.0",
  logLevel: LogLevel.INFO,
  enableTimestamps: true,
  redis: {
    host: "localhost",
    port: 6379,
    db: 0,
    keyPrefix: "bedrock-mcp:conversation:",
    ttl: 86400, // 24 hours
  },
};
```

### 11.7 Tool Use Flow Sequence

**CRITICAL**: Tool use must follow exact sequence:

1. **Bedrock returns tool_use stop reason**
2. **Add assistant message with toolUse content to storage**
3. **Execute each tool sequentially**
4. **Collect all tool results**
5. **Add user message with toolResult content to storage**
6. **Call Bedrock API again for continued response**
7. **Process the continued response**

### 11.8 Error Message Patterns

**Standard Error Formats:**

```typescript
// MCP Connection Errors
throw new Error(`Error connecting to MCP server: ${errorMessage}`);

// Tool Execution Errors
throw new Error(`Error executing tool ${name}: ${errorMessage}`);

// Storage Errors
throw new Error(`Redis store operation failed: ${errorMessage}`);

// Validation Errors
throw new Error(
  `Message index ${messageIndex} out of bounds for session ${sessionId}`,
);
```

---

## SECTION 12: IMPLEMENTATION VERIFICATION CHECKLIST

### 12.1 Core Functionality Verification

- [ ] **BedrockMCPClient constructor** follows exact initialization sequence
- [ ] **Session ID generation** uses exact algorithm
- [ ] **Storage factory pattern** handles memory/redis configuration correctly
- [ ] **MCP connection** uses SSE type with exact error handling
- [ ] **Tool registration** wraps handlers with event emission
- [ ] **Event system** emits all required events at correct points

### 12.2 AWS Integration Verification

- [ ] **BedrockRuntimeClient** initialized with region only
- [ ] **ConverseCommand** built with exact structure
- [ ] **Tool configuration** matches Bedrock API requirements
- [ ] **Response handling** processes all stop reasons correctly
- [ ] **Tool use flow** follows exact sequence
- [ ] **Conversation history** maintained correctly in storage

### 12.3 Storage System Verification

- [ ] **MessageStorage interface** implements all required methods
- [ ] **InMemoryMessageStorage** provides session isolation
- [ ] **RedisMessageStorage** handles TTL and connection management
- [ ] **Key generation** follows exact patterns
- [ ] **Error handling** uses standard error formats
- [ ] **Health checks** implemented for both storage types

### 12.4 CLI Verification

- [ ] **Argument parsing** handles all command-line options
- [ ] **Help text** matches exact format
- [ ] **Banner** uses exact ASCII art
- [ ] **REPL commands** (help, tools, clear, quit) work correctly
- [ ] **Event listeners** display appropriate messages
- [ ] **Cleanup** properly disconnects and closes resources

### 12.5 Type System Verification

- [ ] **All interfaces** match exact specifications
- [ ] **Event emitter typing** provides type safety
- [ ] **Union types** for message content work correctly
- [ ] **Storage configuration** supports memory/redis types
- [ ] **Tool handler signatures** match requirements
- [ ] **Export structure** provides all public APIs

### 12.6 Build System Verification

- [ ] **TypeScript configuration** compiles to correct target
- [ ] **Package.json** includes all required fields
- [ ] **Module exports** work correctly as ES modules
- [ ] **CLI binary** executable after build
- [ ] **Declaration files** generated for TypeScript consumers
- [ ] **Distribution files** limited to dist/ and README.md

---

## SECTION 13: CONCLUSION

This document provides a complete, line-by-line specification for implementing a 100% feature-compatible replacement for the Bedrock-MCP-Connector library. Every critical implementation detail, from session ID generation algorithms to exact error message formats, has been documented.

The implementation must follow this specification exactly to ensure:

1. **Perfect API compatibility**
2. **Identical behavior patterns**
3. **Same event emission patterns**
4. **Compatible storage formats**
5. **Matching CLI experience**
6. **Consistent error handling**
7. **Proper AWS integration**
8. **Correct MCP protocol implementation**

**Key Success Criteria:**

- All existing code using the original library continues to work unchanged
- CLI behavior is identical to the original
- Storage formats are compatible
- Event sequences match exactly
- Error conditions are handled identically
- Performance characteristics are similar or better

This specification serves as the complete blueprint for a replacement implementation that will be indistinguishable from the original library in terms of functionality and behavior.
