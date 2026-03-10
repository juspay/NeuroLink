import type { LoopSnapshot } from "../loopTypes.js";
import type { CheckpointListEntry, CheckpointStore } from "./checkpointStore.js";

/**
 * Minimal Redis client interface — compatible with ioredis and node-redis.
 * We only need get/set/del/keys.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
  keys(pattern: string): Promise<string[]>;
}

/**
 * Redis-based checkpoint store.
 * Uses the existing Redis connection from conversation memory.
 * Suitable for production multi-process deployments.
 */
export class RedisCheckpointStore implements CheckpointStore {
  constructor(
    private readonly redis: RedisClient,
    private readonly prefix = "neurolink:checkpoint:",
  ) {}

  private _key(loopId: string): string {
    return `${this.prefix}${loopId}`;
  }

  async save(snapshot: LoopSnapshot): Promise<void> {
    await this.redis.set(this._key(snapshot.loopId), JSON.stringify(snapshot));
  }

  async load(loopId: string): Promise<LoopSnapshot | null> {
    const raw = await this.redis.get(this._key(loopId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LoopSnapshot;
    } catch {
      return null;
    }
  }

  async list(filter?: { status?: string }): Promise<CheckpointListEntry[]> {
    const keys = await this.redis.keys(`${this.prefix}*`);
    const entries: CheckpointListEntry[] = [];

    for (const key of keys) {
      const raw = await this.redis.get(key);
      if (!raw) continue;
      try {
        const snapshot = JSON.parse(raw) as LoopSnapshot;
        if (!filter?.status || snapshot.status === filter.status) {
          entries.push({
            loopId: snapshot.loopId,
            status: snapshot.status,
            goal: snapshot.goalText.substring(0, 100),
            updatedAt: snapshot.lastCheckpointAt,
          });
        }
      } catch {
        // Skip malformed entries
      }
    }

    return entries;
  }

  async delete(loopId: string): Promise<void> {
    await this.redis.del(this._key(loopId));
  }
}
