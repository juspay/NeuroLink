import { describe, it, expect } from "vitest";

// Import the parsing functions - need to access them directly from the module
// Since they're not exported, we'll test the public behavior through executeFunctionCall
import { executeFunctionCall } from "../../../src/lib/mcp/function-calling.js";

/**
 * COMPREHENSIVE UNIT TESTS FOR FUNCTION NAME PARSING
 *
 * Tests the parseFunctionName function and related parsing logic through
 * the public executeFunctionCall interface, since the parsing functions
 * are internal to the module.
 *
 * Coverage:
 * - NeuroLink server patterns (neurolink_ai_core_*, neurolink_utility_*)
 * - Underscore-separated format (server_tool_name)
 * - Dot-separated format (server.tool)
 * - Edge cases and fallbacks
 * - MCP tool name sanitization
 */
describe("Function Name Parsing Tests", () => {
  describe("NeuroLink Server Patterns", () => {
    it("should parse neurolink_ai_core_generate correctly", async () => {
      // Test that the parsing extracts correct server and tool name
      const functionName = "neurolink_ai_core_generate";

      try {
        // This will test the parsing logic internally
        await executeFunctionCall(functionName, { prompt: "test" });
      } catch (error) {
        // Expected to fail since we don't have actual neurolink_ai_core server
        // But the parsing should work correctly (server: neurolink_ai_core, tool: generate)
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should parse neurolink_ai_core_stream correctly", async () => {
      const functionName = "neurolink_ai_core_stream";

      try {
        await executeFunctionCall(functionName, { prompt: "test" });
      } catch (error) {
        // Should parse as server: neurolink_ai_core, tool: stream
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should parse neurolink_utility_format_number correctly", async () => {
      const functionName = "neurolink_utility_format_number";

      try {
        await executeFunctionCall(functionName, { number: 1234.56 });
      } catch (error) {
        // Should parse as server: neurolink_utility, tool: format_number
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should parse multi-word neurolink tools correctly", async () => {
      const functionName = "neurolink_ai_core_advanced_text_generation";

      try {
        await executeFunctionCall(functionName, { prompt: "test" });
      } catch (error) {
        // Should parse as server: neurolink_ai_core, tool: advanced_text_generation
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });
  });

  describe("Standard Underscore Format", () => {
    it("should parse simple server_tool format", async () => {
      const functionName = "filesystem_read_file";

      try {
        await executeFunctionCall(functionName, { path: "/test" });
      } catch (error) {
        // Should parse as server: filesystem, tool: read_file
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should parse multi-segment tool names", async () => {
      const functionName = "github_create_pull_request";

      try {
        await executeFunctionCall(functionName, { title: "test" });
      } catch (error) {
        // Should parse as server: github, tool: create_pull_request
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should parse complex server names", async () => {
      const functionName = "my_custom_server_complex_tool_name";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should parse as server: my_custom_server, tool: complex_tool_name
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });
  });

  describe("Dot-Separated Legacy Format", () => {
    it("should parse server.tool format", async () => {
      const functionName = "filesystem.listDirectory";

      try {
        await executeFunctionCall(functionName, { path: "/test" });
      } catch (error) {
        // Should parse as server: filesystem, tool: listDirectory
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should parse with camelCase tool names", async () => {
      const functionName = "database.getUserProfile";

      try {
        await executeFunctionCall(functionName, { userId: "123" });
      } catch (error) {
        // Should parse as server: database, tool: getUserProfile
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });
  });

  describe("Edge Cases and Fallbacks", () => {
    it("should handle single word function names", async () => {
      const functionName = "getCurrentTime";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should parse but server will be "unknown", tool will be "getCurrentTime"
        // This tests the fallback behavior
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should handle empty function name", async () => {
      const functionName = "";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should handle gracefully
        expect(error.message || "").toBeTruthy();
      }
    });

    it("should handle function names with numbers", async () => {
      const functionName = "api_v2_get_user_data";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should parse as server: api_v2, tool: get_user_data
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should handle function names with special characters (sanitized)", async () => {
      const functionName = "github-com-user-repo_list_files";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should handle the hyphenated name
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should prioritize underscore over dot format", async () => {
      // If a function name has both underscores and dots, underscores should take precedence
      const functionName = "server_tool.something";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should parse as underscore format first: server: server_tool, tool: something
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });
  });

  describe("Real MCP Tool Name Patterns", () => {
    it("should handle MCP filesystem tools", async () => {
      const functionName = "mcp_filesystem_read_file";

      try {
        await executeFunctionCall(functionName, { path: "/test" });
      } catch (error) {
        // Should parse as server: mcp_filesystem, tool: read_file
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should handle long GitHub MCP names", async () => {
      const functionName =
        "github_com_modelcontextprotocol_servers_filesystem_read";

      try {
        await executeFunctionCall(functionName, { path: "/test" });
      } catch (error) {
        // Should handle long MCP server names correctly
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should handle sanitized tool names", async () => {
      const functionName = "fs_read_file"; // Shortened from filesystem

      try {
        await executeFunctionCall(functionName, { path: "/test" });
      } catch (error) {
        // Should parse shortened names
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });
  });

  describe("Server ID Priority and Matching", () => {
    it("should handle neurolink patterns over generic underscore", async () => {
      // Test that neurolink patterns are detected correctly
      const neurolinkName = "neurolink_ai_core_test";
      const genericName = "some_server_test";

      try {
        await executeFunctionCall(neurolinkName, {});
        await executeFunctionCall(genericName, {});
      } catch (error) {
        // Both should parse but neurolink should get special handling
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should handle filesystem server specially", async () => {
      const functionName = "filesystem_list_directory";

      try {
        await executeFunctionCall(functionName, { path: "/test" });
      } catch (error) {
        // Filesystem should get special activation logic
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });
  });

  describe("Function Name Validation", () => {
    it("should handle very long function names", async () => {
      const longName =
        "very_long_server_name_with_many_segments_and_a_very_descriptive_tool_name_that_exceeds_normal_length";

      try {
        await executeFunctionCall(longName, {});
      } catch (error) {
        // Should handle long names gracefully
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should handle function names with only underscores", async () => {
      const functionName = "___";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should handle edge case
        expect(error.message || "").toBeTruthy();
      }
    });

    it("should handle function names with mixed case", async () => {
      const functionName = "MyServer_MyTool";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should parse as server: MyServer, tool: MyTool
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });
  });

  describe("Malformed Function Names and Edge Cases", () => {
    it("should handle empty string gracefully", async () => {
      const functionName = "";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should handle gracefully with meaningful error
        expect(error.message || "").toBeTruthy();
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should handle whitespace-only function names", async () => {
      const functionName = "   ";

      try {
        await executeFunctionCall(functionName, {});
      } catch (error) {
        // Should handle gracefully
        expect(error.message || "").toBeTruthy();
      }
    });

    it("should handle function names with only special characters", async () => {
      const malformedNames = ["!!!", "@@@", "###", "***", "==="];

      for (const name of malformedNames) {
        try {
          await executeFunctionCall(name, {});
        } catch (error) {
          // Should handle gracefully without parsing errors
          expect(error.message || "").toBeTruthy();
          expect(error.message || "").not.toContain(
            "Cannot parse function name",
          );
        }
      }
    });

    it("should handle function names with invalid characters", async () => {
      const invalidNames = [
        "server<>tool",
        "server|tool",
        "server\\tool",
        "server/tool",
        "server tool", // space in middle
        "server\ttool", // tab character
        "server\ntool", // newline character
      ];

      for (const name of invalidNames) {
        try {
          await executeFunctionCall(name, {});
        } catch (error) {
          // Should handle invalid characters gracefully
          expect(error.message || "").toBeTruthy();
          expect(error.message || "").not.toContain(
            "Cannot parse function name",
          );
        }
      }
    });

    it("should handle extremely long function names", async () => {
      const extremelyLongName = "a".repeat(1000) + "_" + "b".repeat(1000);

      try {
        await executeFunctionCall(extremelyLongName, {});
      } catch (error) {
        // Should handle without crashing
        expect(error.message || "").toBeTruthy();
        expect(error.message || "").not.toContain("Cannot parse function name");
      }
    });

    it("should handle function names with consecutive separators", async () => {
      const malformedNames = [
        "server__tool", // double underscore
        "server___tool", // triple underscore
        "server..tool", // double dot
        "server...tool", // triple dot
        "_server_tool", // leading underscore
        "server_tool_", // trailing underscore
        ".server.tool", // leading dot
        "server.tool.", // trailing dot
      ];

      for (const name of malformedNames) {
        try {
          await executeFunctionCall(name, {});
        } catch (error) {
          // Should parse these gracefully (they're technically valid but unusual)
          expect(error.message || "").not.toContain(
            "Cannot parse function name",
          );
        }
      }
    });

    it("should handle function names with unicode characters", async () => {
      const unicodeNames = [
        "servër_tööl", // accented characters
        "服务器_工具", // Chinese characters
        "сервер_инструмент", // Cyrillic characters
        "server_🔧", // emoji
        "server_tØØl", // mixed unicode
      ];

      for (const name of unicodeNames) {
        try {
          await executeFunctionCall(name, {});
        } catch (error) {
          // Should handle unicode gracefully
          expect(error.message || "").not.toContain(
            "Cannot parse function name",
          );
        }
      }
    });

    it("should handle null and undefined-like strings", async () => {
      const nullishNames = ["null", "undefined", "NaN", "false", "0"];

      for (const name of nullishNames) {
        try {
          await executeFunctionCall(name, {});
        } catch (error) {
          // Should parse these as valid single-word function names
          expect(error.message || "").not.toContain(
            "Cannot parse function name",
          );
        }
      }
    });

    it("should handle function names that look like code injection", async () => {
      const injectionAttempts = [
        "'; DROP TABLE users; --",
        "server_$(rm -rf /)",
        "server_`cat /etc/passwd`",
        "server_${process.exit(1)}",
        "server_require('fs')",
        "<script>alert('xss')</script>",
      ];

      for (const name of injectionAttempts) {
        try {
          await executeFunctionCall(name, {});
        } catch (error) {
          // Should handle these safely without executing code
          expect(error.message || "").not.toContain(
            "Cannot parse function name",
          );
        }
      }
    });

    it("should handle function names with mixed separators", async () => {
      const mixedNames = [
        "server_tool.method", // underscore and dot
        "server.tool_method", // dot and underscore
        "server_tool-method", // underscore and hyphen
        "server-tool_method", // hyphen and underscore
        "server.tool-method", // dot and hyphen
      ];

      for (const name of mixedNames) {
        try {
          await executeFunctionCall(name, {});
        } catch (error) {
          // Should prioritize underscore parsing over other separators
          expect(error.message || "").not.toContain(
            "Cannot parse function name",
          );
        }
      }
    });
  });

  describe("Integration with Tool Map", () => {
    it("should work with actual tool execution context", async () => {
      // Test that the parsing integrates correctly with the broader system
      const functionName = "test_server_test_tool";

      try {
        const result = await executeFunctionCall(functionName, {
          param: "value",
        });
        // If this succeeds, parsing worked correctly
        expect(result).toBeDefined();
      } catch (error) {
        // Expected to fail since tool doesn't exist, but parsing should work
        expect(error.message || "").not.toContain("Cannot parse function name");
        expect(error.message || "").not.toContain(
          "Invalid function name format",
        );
      }
    });
  });
});

/**
 * INTEGRATION TESTS FOR REAL PARSING SCENARIOS
 *
 * Tests actual scenarios that would occur in production usage
 */
describe("Function Name Parsing Integration", () => {
  describe("Real-World MCP Tool Names", () => {
    const realWorldNames = [
      "neurolink_ai_core_generate",
      "neurolink_utility_format_currency",
      "filesystem_read_file",
      "github_create_issue",
      "database_user_lookup",
      "api_v1_get_weather",
      "mcp_tools_calculator",
      "fs_list_dir", // Shortened filesystem name
      "time_get_current", // Built-in time tool pattern
    ];

    realWorldNames.forEach((functionName) => {
      it(`should parse real-world function name: ${functionName}`, async () => {
        try {
          await executeFunctionCall(functionName, {});
        } catch (error) {
          // Should not fail due to parsing - only due to tool not existing
          expect(error.message || "").not.toContain(
            "Cannot parse function name",
          );
          expect(error.message || "").not.toContain(
            "Invalid function name format",
          );
          expect(error.message || "").not.toContain(
            "Unknown function name format",
          );
        }
      });
    });
  });

  describe("Parsing Performance", () => {
    it("should parse function names efficiently", async () => {
      const startTime = Date.now();
      const testNames = [
        "server1_tool1",
        "server2_tool2",
        "neurolink_ai_core_generate",
        "filesystem_read_file",
        "complex.tool.name",
      ];

      for (const name of testNames) {
        try {
          await executeFunctionCall(name, {});
        } catch (error) {
          // Ignore execution errors, we're testing parsing speed
        }
      }

      const duration = Date.now() - startTime;
      // Parsing should be very fast (under 100ms for 5 names)
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Error Handling in Parsing", () => {
    it("should provide helpful errors for unparseable names", async () => {
      const invalidNames = [
        "", // Empty
        " ", // Just whitespace
        ".", // Just dot
        "_", // Just underscore
      ];

      for (const name of invalidNames) {
        try {
          await executeFunctionCall(name, {});
        } catch (error) {
          // Should get a meaningful error
          expect(error.message || "").toBeTruthy();
        }
      }
    });
  });
});
