# NeuroLink MCP Tools Demo

Demonstrates MCP (Model Context Protocol) tool integration patterns.

## Features

- Built-in tools usage
- Custom tool creation
- External MCP servers
- HTTP transport configuration

## Quick Start

```bash
npm install
cp .env.example .env
npm run demo:built-in    # Built-in tools demo
npm run demo:custom      # Custom tools demo
npm run demo:external    # External MCP server demo
npm run demo:http        # HTTP transport demo
```

## Demos

### Built-in Tools

Shows usage of NeuroLink's built-in tools: getCurrentTime, readFile, writeFile, listDirectory, calculateMath, websearchGrounding

### Custom Tools

Creating and registering custom tools with schemas

### External MCP Servers

Connecting to external MCP servers (GitHub, PostgreSQL, etc.)

### HTTP Transport

Using HTTP/Streamable HTTP transport for remote MCP servers

## Project Structure

```
mcp-tools-demo/
├── src/
│   ├── index.ts           # Main entry point
│   ├── tools/
│   │   └── custom-tool.ts # Custom tool definitions
│   └── demo/
│       ├── built-in-tools.ts   # Built-in tools demo
│       ├── custom-tools.ts     # Custom tools demo
│       ├── external-mcp.ts     # External MCP server demo
│       └── http-transport.ts   # HTTP transport demo
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Learn More

- [NeuroLink MCP Documentation](https://docs.neurolink.dev/features/mcp-tools-showcase)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
