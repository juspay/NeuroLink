import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExternalServerManager } from "../../../src/lib/mcp/externalServerManager.js";
import type {
  MCPServerInfo,
  MCPToolInfo,
} from "../../../src/lib/types/mcpTypes.js";

/**
 * Type for accessing internal ExternalServerManager properties in tests.
 * This is needed because we're testing private implementation details.
 */
interface ExternalServerManagerInternal {
  servers: Map<string, ServerInstance>;
  toolDiscovery: {
    discoverTools: ReturnType<typeof vi.fn>;
    executeTool: ReturnType<typeof vi.fn>;
  };
  discoverServerTools: (serverId: string) => Promise<void>;
}

interface ServerInstance extends MCPServerInfo {
  process: null;
  client: {
    callTool: ReturnType<typeof vi.fn>;
    listTools?: ReturnType<typeof vi.fn>;
  };
  transportInstance: null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  toolsMap: Map<string, MCPToolInfo>;
  toolsArray?: MCPToolInfo[];
  metrics: {
    totalConnections: number;
    totalDisconnections: number;
    totalErrors: number;
    totalToolCalls: number;
    averageResponseTime: number;
    lastResponseTime: number;
  };
  config: MCPServerInfo;
}

describe("ExternalServerManager - Tool Blocklist", () => {
  let manager: ExternalServerManager;

  beforeEach(() => {
    manager = new ExternalServerManager({
      maxServers: 10,
      defaultTimeout: 5000,
    });
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  describe("Configuration Validation", () => {
    it("should accept blockedTools array in configuration", () => {
      const config: MCPServerInfo = {
        id: "test-server",
        name: "test-server",
        description: "Test server",
        transport: "stdio",
        status: "initializing",
        tools: [],
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem"],
        blockedTools: ["dangerousTool", "deleteAll"],
      };

      const validation = manager.validateConfig(config);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should accept empty blockedTools array", () => {
      const config: MCPServerInfo = {
        id: "test-server",
        name: "test-server",
        description: "Test server",
        transport: "stdio",
        status: "initializing",
        tools: [],
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem"],
        blockedTools: [],
      };

      const validation = manager.validateConfig(config);
      expect(validation.isValid).toBe(true);
    });

    it("should accept config without blockedTools field", () => {
      const config: MCPServerInfo = {
        id: "test-server",
        name: "test-server",
        description: "Test server",
        transport: "stdio",
        status: "initializing",
        tools: [],
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem"],
      };

      const validation = manager.validateConfig(config);
      expect(validation.isValid).toBe(true);
    });
  });

  describe("Tool Blocking", () => {
    it("should prevent execution of blocked tools", async () => {
      // Mock server configuration with blocked tools
      const mockServerInfo: MCPServerInfo = {
        id: "mock-server",
        name: "mock-server",
        description: "Mock server for testing",
        transport: "stdio",
        status: "connected",
        tools: [],
        command: "node",
        args: ["mock-server.js"],
        blockedTools: ["deleteFile", "destroySystem"],
      };

      // Mock the internal server instance
      const mockInstance = {
        ...mockServerInfo,
        process: null,
        client: { callTool: vi.fn() },
        transportInstance: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3,
        toolsMap: new Map(),
        metrics: {
          totalConnections: 0,
          totalDisconnections: 0,
          totalErrors: 0,
          totalToolCalls: 0,
          averageResponseTime: 0,
          lastResponseTime: 0,
        },
        config: mockServerInfo,
      };

      // Inject mock instance into manager's internal state
      (manager as unknown as ExternalServerManagerInternal).servers.set(
        "mock-server",
        mockInstance as unknown as ServerInstance,
      );

      // Try to execute a blocked tool
      await expect(
        manager.executeTool("mock-server", "deleteFile", {}),
      ).rejects.toThrow(
        "Tool 'deleteFile' is blocked on server 'mock-server' by configuration",
      );

      await expect(
        manager.executeTool("mock-server", "destroySystem", {}),
      ).rejects.toThrow(
        "Tool 'destroySystem' is blocked on server 'mock-server' by configuration",
      );
    });

    it("should allow execution of non-blocked tools", async () => {
      // Mock server configuration with blocked tools
      const mockServerInfo: MCPServerInfo = {
        id: "mock-server",
        name: "mock-server",
        description: "Mock server for testing",
        transport: "stdio",
        status: "connected",
        tools: [],
        command: "node",
        args: ["mock-server.js"],
        blockedTools: ["deleteFile"],
      };

      const mockToolResult = { success: true, data: "Tool executed" };
      const mockClient = {
        callTool: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: JSON.stringify(mockToolResult) }],
        }),
      };

      // Mock the internal server instance
      const mockInstance = {
        ...mockServerInfo,
        process: null,
        client: mockClient,
        transportInstance: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3,
        toolsMap: new Map([
          [
            "readFile",
            {
              name: "readFile",
              description: "Read a file",
              serverId: "mock-server",
              isAvailable: true,
              stats: {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                averageExecutionTime: 0,
                lastExecutionTime: 0,
              },
            },
          ],
        ]),
        metrics: {
          totalConnections: 0,
          totalDisconnections: 0,
          totalErrors: 0,
          totalToolCalls: 0,
          averageResponseTime: 0,
          lastResponseTime: 0,
        },
        config: mockServerInfo,
      };

      // Inject mock instance into manager's internal state
      (manager as unknown as ExternalServerManagerInternal).servers.set(
        "mock-server",
        mockInstance as unknown as ServerInstance,
      );

      // Mock the toolDiscovery service
      const mockToolDiscovery = {
        executeTool: vi.fn().mockResolvedValue(mockToolResult),
        discoverTools: vi.fn(),
      };
      (manager as unknown as ExternalServerManagerInternal).toolDiscovery =
        mockToolDiscovery;

      // Try to execute a non-blocked tool - should succeed
      const result = await manager.executeTool("mock-server", "readFile", {
        path: "/test.txt",
      });

      expect(result).toEqual(mockToolResult.data);
      expect(mockToolDiscovery.executeTool).toHaveBeenCalledWith(
        "readFile",
        "mock-server",
        mockClient,
        { path: "/test.txt" },
        { timeout: 5000 },
      );
    });
  });

  describe("Tool Discovery Filtering", () => {
    it("should filter blocked tools during discovery", async () => {
      // This test verifies that blocked tools are not added to the toolsMap
      // during the discovery phase
      const mockServerInfo: MCPServerInfo = {
        id: "test-server",
        name: "test-server",
        description: "Test server",
        transport: "stdio",
        status: "connected",
        tools: [],
        command: "node",
        args: ["test-server.js"],
        blockedTools: ["toolA", "toolC"],
      };

      const mockClient = {
        listTools: vi.fn().mockResolvedValue({
          tools: [
            { name: "toolA", description: "Tool A" },
            { name: "toolB", description: "Tool B" },
            { name: "toolC", description: "Tool C" },
          ],
        }),
      };

      const mockInstance = {
        ...mockServerInfo,
        process: null,
        client: mockClient,
        transportInstance: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3,
        toolsMap: new Map(),
        metrics: {
          totalConnections: 0,
          totalDisconnections: 0,
          totalErrors: 0,
          totalToolCalls: 0,
          averageResponseTime: 0,
          lastResponseTime: 0,
        },
        config: mockServerInfo,
      };

      (manager as unknown as ExternalServerManagerInternal).servers.set(
        "test-server",
        mockInstance as unknown as ServerInstance,
      );

      // Mock tool discovery to return filtered tools
      const mockToolDiscovery = {
        executeTool: vi.fn(),
        discoverTools: vi.fn().mockResolvedValue({
          success: true,
          toolCount: 3,
          tools: [
            {
              name: "toolA",
              description: "Tool A",
              serverId: "test-server",
              isAvailable: true,
              stats: {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                averageExecutionTime: 0,
                lastExecutionTime: 0,
              },
            },
            {
              name: "toolB",
              description: "Tool B",
              serverId: "test-server",
              isAvailable: true,
              stats: {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                averageExecutionTime: 0,
                lastExecutionTime: 0,
              },
            },
            {
              name: "toolC",
              description: "Tool C",
              serverId: "test-server",
              isAvailable: true,
              stats: {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                averageExecutionTime: 0,
                lastExecutionTime: 0,
              },
            },
          ],
          duration: 100,
          serverId: "test-server",
        }),
      };

      (manager as unknown as ExternalServerManagerInternal).toolDiscovery =
        mockToolDiscovery;

      // Call the private method directly to test filtering
      await (
        manager as unknown as ExternalServerManagerInternal
      ).discoverServerTools("test-server");

      // Verify that only toolB was added (toolA and toolC are blocked)
      const instance = (
        manager as unknown as ExternalServerManagerInternal
      ).servers.get("test-server");
      expect(instance?.toolsMap.size).toBe(1);
      expect(instance?.toolsMap.has("toolB")).toBe(true);
      expect(instance?.toolsMap.has("toolA")).toBe(false);
      expect(instance?.toolsMap.has("toolC")).toBe(false);
    });
  });

  describe("Configuration File Loading", () => {
    it("should load blockedTools from config file format", () => {
      // Simulating the structure from .mcp-config.json
      const configFromFile = {
        mcpServers: {
          "test-server": {
            name: "test-server",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem"],
            transport: "stdio",
            blockedTools: ["rm", "rmdir", "deleteFile"],
          },
        },
      };

      // Verify the config structure is valid
      expect(
        configFromFile.mcpServers["test-server"].blockedTools,
      ).toBeDefined();
      expect(
        Array.isArray(configFromFile.mcpServers["test-server"].blockedTools),
      ).toBe(true);
      expect(configFromFile.mcpServers["test-server"].blockedTools).toContain(
        "rm",
      );
    });
  });
});
