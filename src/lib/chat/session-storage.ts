/**
 * Phase 3: SSE Chat Utilities
 * Session storage adapters for persistence
 */

import type { SessionStorage, ChatSessionState } from "./types.js";
import { promises as fs } from "fs";

/**
 * In-memory session storage (default)
 */
export class MemorySessionStorage implements SessionStorage {
	private sessions = new Map<string, ChatSessionState>();

	async get(sessionId: string): Promise<ChatSessionState | null> {
		return this.sessions.get(sessionId) || null;
	}

	async set(sessionId: string, state: ChatSessionState): Promise<void> {
		this.sessions.set(sessionId, state);
	}

	async delete(sessionId: string): Promise<void> {
		this.sessions.delete(sessionId);
	}

	async list(): Promise<string[]> {
		return Array.from(this.sessions.keys());
	}

	async cleanup(maxAge: number): Promise<number> {
		const now = Date.now();
		let removed = 0;

		for (const [sessionId, state] of this.sessions.entries()) {
			if (now - state.lastActivity > maxAge) {
				this.sessions.delete(sessionId);
				removed++;
			}
		}

		return removed;
	}

	/**
	 * Get storage statistics
	 */
	getStats(): {
		totalSessions: number;
		memoryUsageBytes: number;
		oldestSession?: number;
		newestSession?: number;
	} {
		const sessions = Array.from(this.sessions.values());
		const memoryUsageBytes = Buffer.byteLength(
			JSON.stringify(sessions),
			"utf8",
		);

		const timestamps = sessions.map((s) => s.lastActivity);

		return {
			totalSessions: this.sessions.size,
			memoryUsageBytes,
			oldestSession:
				timestamps.length > 0 ? Math.min(...timestamps) : undefined,
			newestSession:
				timestamps.length > 0 ? Math.max(...timestamps) : undefined,
		};
	}

	/**
	 * Clear all sessions
	 */
	async clear(): Promise<void> {
		this.sessions.clear();
	}
}

/**
 * File-based session storage
 */
export class FileSessionStorage implements SessionStorage {
	private basePath: string;

	private constructor(basePath: string) {
		this.basePath = basePath;
	}

	static async create(
		basePath: string = "./sessions",
	): Promise<FileSessionStorage> {
		const instance = new FileSessionStorage(basePath);
		await instance.ensureDirectory();
		return instance;
	}

	async get(sessionId: string): Promise<ChatSessionState | null> {
		try {
			const filePath = this.getFilePath(sessionId);
			const data = await fs.readFile(filePath, "utf-8");
			return JSON.parse(data);
		} catch (error) {
			if ((error as any)?.code === "ENOENT") {
				return null; // File doesn't exist
			}
			throw error;
		}
	}

	async set(sessionId: string, state: ChatSessionState): Promise<void> {
		const filePath = this.getFilePath(sessionId);
		const data = JSON.stringify(
			{
				...state,
				lastActivity: state.lastActivity ?? Date.now(),
			},
			null,
			2,
		);

		await fs.writeFile(filePath, data, "utf-8");
	}

	async delete(sessionId: string): Promise<void> {
		try {
			const filePath = this.getFilePath(sessionId);
			await fs.unlink(filePath);
		} catch (error) {
			if ((error as any)?.code !== "ENOENT") {
				throw error;
			}
		}
	}

	async list(): Promise<string[]> {
		try {
			const files = await fs.readdir(this.basePath);
			return files
				.filter((file) => file.endsWith(".json"))
				.map((file) => file.replace(".json", ""));
		} catch (error) {
			return [];
		}
	}

	async cleanup(maxAge: number): Promise<number> {
		const sessionIds = await this.list();
		const now = Date.now();
		let removed = 0;

		for (const sessionId of sessionIds) {
			const state = await this.get(sessionId);
			if (state && now - state.lastActivity > maxAge) {
				await this.delete(sessionId);
				removed++;
			}
		}

		return removed;
	}

	private getFilePath(sessionId: string): string {
		return `${this.basePath}/${sessionId}.json`;
	}

	private async ensureDirectory(): Promise<void> {
		try {
			await fs.mkdir(this.basePath, { recursive: true });
		} catch (error) {
			if ((error as any)?.code !== "EEXIST") {
				throw error; // Rethrow unexpected errors
			}
			// Directory already exists, which is fine
		}
	}
}

/**
 * Redis session storage (for production scaling)
 */
// Generic Redis client interface for better typing
interface RedisClient {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, options?: any): Promise<any>;
	del(key: string): Promise<number>;
	exists(key: string): Promise<number>;
	expire?(key: string, ttl: number): Promise<any>;
	keys?(pattern: string): Promise<string[]>;
}

export class RedisSessionStorage implements SessionStorage {
	private client: RedisClient;
	private keyPrefix: string;

	constructor(
		redisClient: RedisClient,
		keyPrefix: string = "neurolink:session:",
	) {
		this.client = redisClient;
		this.keyPrefix = keyPrefix;
	}

	async get(sessionId: string): Promise<ChatSessionState | null> {
		try {
			const data = await this.client.get(this.getKey(sessionId));
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error("Redis get error:", error);
			return null;
		}
	}

	async set(sessionId: string, state: ChatSessionState): Promise<void> {
		try {
			const key = this.getKey(sessionId);
			const data = JSON.stringify({
				...state,
				lastActivity: Date.now(),
			});

			await this.client.set(key, data);

			// Set TTL if supported
			if (this.client.expire) {
				await this.client.expire(key, 3600); // 1 hour default
			}
		} catch (error) {
			console.error("Redis set error:", error);
			throw error;
		}
	}

	async delete(sessionId: string): Promise<void> {
		try {
			await this.client.del(this.getKey(sessionId));
		} catch (error) {
			console.error("Redis delete error:", error);
			throw error;
		}
	}

	async list(): Promise<string[]> {
		try {
			if (!this.client.keys) {
				console.warn("Redis client does not support keys operation");
				return [];
			}
			const keys = await this.client.keys(`${this.keyPrefix}*`);
			return keys.map((key: string) => key.replace(this.keyPrefix, ""));
		} catch (error) {
			console.error("Redis list error:", error);
			return [];
		}
	}

	async cleanup(maxAge: number): Promise<number> {
		const sessionIds = await this.list();
		const now = Date.now();
		let removed = 0;

		for (const sessionId of sessionIds) {
			const state = await this.get(sessionId);
			if (state && now - state.lastActivity > maxAge) {
				await this.delete(sessionId);
				removed++;
			}
		}

		return removed;
	}

	private getKey(sessionId: string): string {
		return `${this.keyPrefix}${sessionId}`;
	}
}

/**
 * Session storage factory
 */
export class SessionStorageFactory {
	static async create(
		type: "memory" | "file" | "redis",
		options?: {
			basePath?: string; // For file storage
			redisClient?: RedisClient; // For Redis storage
			keyPrefix?: string; // For Redis storage
		},
	): Promise<SessionStorage> {
		switch (type) {
			case "memory":
				return new MemorySessionStorage();

			case "file":
				return await FileSessionStorage.create(options?.basePath);

			case "redis":
				if (!options?.redisClient) {
					throw new Error("Redis client required for Redis storage");
				}
				return new RedisSessionStorage(options.redisClient, options.keyPrefix);

			default:
				throw new Error(`Unknown storage type: ${type}`);
		}
	}
}
