/**
 * Phase 3: SSE Chat Utilities
 * Chat session management with persistence
 */

import type {
	ChatMessage,
	SessionOptions,
	ChatSessionState,
	SessionStorage,
} from "./types.js";
import { MemorySessionStorage } from "./session-storage.js";

export class ChatSession {
	private sessionId: string;
	private messages: ChatMessage[] = [];
	private options: Required<SessionOptions>;
	private storage: SessionStorage;
	private createdAt: number;
	private lastActivity: number;
	private metadata: Record<string, any> = {};

	constructor(sessionId: string, options: SessionOptions = {}) {
		this.sessionId = sessionId;
		this.createdAt = Date.now();
		this.lastActivity = Date.now();

		this.options = {
			maxHistory: options.maxHistory ?? 100,
			persistenceAdapter: options.persistenceAdapter ?? "memory",
			contextWindowSize: options.contextWindowSize ?? 4000,
			autoSave: options.autoSave ?? true,
			ttl: options.ttl ?? 3600, // 1 hour default
		};

		// Initialize storage adapter
		this.storage = this.createStorageAdapter();

		// Load existing session if available
		this.loadSession().catch(() => {});
	}

	/**
	 * Add message to session
	 */
	addMessage(
		role: "user" | "assistant" | "system",
		content: string,
		metadata?: any,
	): ChatMessage {
		const message: ChatMessage = {
			id: `${this.sessionId}_${Date.now()}_${role}`,
			role,
			content,
			timestamp: Date.now(),
			metadata,
		};

		this.messages.push(message);
		this.lastActivity = Date.now();

		// Trim history if needed
		if (this.messages.length > this.options.maxHistory) {
			this.messages = this.messages.slice(-this.options.maxHistory);
		}

		// Auto-save if enabled
		if (this.options.autoSave) {
			this.persist().catch((error) => {
				console.error("Auto-save failed:", error);
			});
		}

		return message;
	}

	/**
	 * Get conversation history
	 */
	getHistory(limit?: number): ChatMessage[] {
		const messages = limit ? this.messages.slice(-limit) : this.messages;
		return [...messages]; // Return copy to prevent mutations
	}

	/**
	 * Get messages for a specific role
	 */
	getMessagesByRole(role: "user" | "assistant" | "system"): ChatMessage[] {
		return this.messages.filter((msg) => msg.role === role);
	}

	/**
	 * Get session metadata
	 */
	getMetadata(): Record<string, any> {
		return { ...this.metadata };
	}

	/**
	 * Set session metadata
	 */
	setMetadata(key: string, value: any): void {
		this.metadata[key] = value;
		this.lastActivity = Date.now();
	}

	/**
	 * Clear session history
	 */
	clearHistory(): void {
		this.messages = [];
		this.lastActivity = Date.now();

		if (this.options.autoSave) {
			this.persist().catch((error) => {
				console.error("Auto-save after clear failed:", error);
			});
		}
	}

	/**
	 * Get session statistics
	 */
	getStats(): {
		messageCount: number;
		userMessages: number;
		assistantMessages: number;
		systemMessages: number;
		totalTokens: number;
		sessionAge: number;
		lastActivity: number;
	} {
		const userMessages = this.getMessagesByRole("user").length;
		const assistantMessages = this.getMessagesByRole("assistant").length;
		const systemMessages = this.getMessagesByRole("system").length;

		// Rough token estimation (characters / 4)
		const totalTokens = this.messages.reduce((sum, msg) => {
			return sum + Math.ceil(msg.content.length / 4);
		}, 0);

		return {
			messageCount: this.messages.length,
			userMessages,
			assistantMessages,
			systemMessages,
			totalTokens,
			sessionAge: Date.now() - this.createdAt,
			lastActivity: this.lastActivity,
		};
	}

	/**
	 * Trim context to fit within token limits
	 */
	trimContext(maxTokens: number): number {
		let currentTokens = this.estimateTokens();
		let removedMessages = 0;

		// Keep the most recent messages within token limit
		while (currentTokens > maxTokens && this.messages.length > 1) {
			// Remove oldest message (but keep system messages if possible)
			const oldestNonSystem = this.messages.findIndex(
				(msg) => msg.role !== "system",
			);
			const indexToRemove = oldestNonSystem >= 0 ? oldestNonSystem : 0;

			const removedMessage = this.messages.splice(indexToRemove, 1)[0];
			currentTokens -= Math.ceil(removedMessage.content.length / 4);
			removedMessages++;
		}

		this.lastActivity = Date.now();

		if (this.options.autoSave && removedMessages > 0) {
			this.persist().catch((error) => {
				console.error("Auto-save after trim failed:", error);
			});
		}

		return removedMessages;
	}

	/**
	 * Estimate total tokens in session
	 */
	estimateTokens(): number {
		return this.messages.reduce((sum, msg) => {
			return sum + Math.ceil(msg.content.length / 4);
		}, 0);
	}

	/**
	 * Get session context for AI prompts
	 */
	getContextForPrompt(includeSystem: boolean = true): string {
		const relevantMessages = includeSystem
			? this.messages
			: this.messages.filter((msg) => msg.role !== "system");

		return relevantMessages
			.map((msg) => `${msg.role}: ${msg.content}`)
			.join("\n\n");
	}

	/**
	 * Persist session to storage
	 */
	async persist(): Promise<void> {
		const state: ChatSessionState = {
			id: this.sessionId,
			messages: this.messages,
			createdAt: this.createdAt,
			lastActivity: this.lastActivity,
			metadata: this.metadata,
		};

		await this.storage.set(this.sessionId, state);
	}

	/**
	 * Load session from storage
	 */
	private async loadSession(): Promise<void> {
		try {
			const state = await this.storage.get(this.sessionId);

			if (state) {
				this.messages = state.messages || [];
				this.createdAt = state.createdAt || Date.now();
				this.lastActivity = state.lastActivity || Date.now();
				this.metadata = state.metadata || {};

				// Check if session has expired
				const age = Date.now() - this.lastActivity;
				if (age > this.options.ttl * 1000) {
					// Session expired, start fresh
					this.messages = [];
					this.metadata = {};
					this.createdAt = Date.now();
					this.lastActivity = Date.now();
				}
			}
		} catch (error) {
			console.error("Failed to load session:", error);
			// Continue with fresh session
		}
	}

	/**
	 * Delete session from storage
	 */
	async delete(): Promise<void> {
		await this.storage.delete(this.sessionId);
		this.messages = [];
		this.metadata = {};
	}

	/**
	 * Create storage adapter based on options
	 */
	private createStorageAdapter(): SessionStorage {
		switch (this.options.persistenceAdapter) {
			case "memory":
				return new MemorySessionStorage();
			case "redis":
				// TODO: Implement Redis adapter
				console.warn(
					"Redis adapter not yet implemented, falling back to memory",
				);
				return new MemorySessionStorage();
			case "file":
				// TODO: Implement File adapter
				console.warn(
					"File adapter not yet implemented, falling back to memory",
				);
				return new MemorySessionStorage();
			default:
				return new MemorySessionStorage();
		}
	}

	/**
	 * Export session data
	 */
	export(): ChatSessionState {
		return {
			id: this.sessionId,
			messages: [...this.messages],
			createdAt: this.createdAt,
			lastActivity: this.lastActivity,
			metadata: { ...this.metadata },
		};
	}

	/**
	 * Import session data
	 */
	import(state: ChatSessionState): void {
		this.messages = state.messages || [];
		this.createdAt = state.createdAt || Date.now();
		this.lastActivity = state.lastActivity || Date.now();
		this.metadata = state.metadata || {};
	}

	/**
	 * Get session ID
	 */
	getId(): string {
		return this.sessionId;
	}

	/**
	 * Check if session is active (not expired)
	 */
	isActive(): boolean {
		const age = Date.now() - this.lastActivity;
		return age <= this.options.ttl * 1000;
	}
}
