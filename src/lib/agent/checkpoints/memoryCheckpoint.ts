import type { LoopSnapshot } from "../loopTypes.js";
import type { CheckpointListEntry, CheckpointStore } from "./checkpointStore.js";

/**
 * In-memory checkpoint store — for testing only.
 * State is lost when the process exits.
 */
export class InMemoryCheckpointStore implements CheckpointStore {
  private readonly _store = new Map<string, LoopSnapshot>();

  async save(snapshot: LoopSnapshot): Promise<void> {
    this._store.set(snapshot.loopId, { ...snapshot });
  }

  async load(loopId: string): Promise<LoopSnapshot | null> {
    return this._store.get(loopId) ?? null;
  }

  async list(filter?: { status?: string }): Promise<CheckpointListEntry[]> {
    const entries: CheckpointListEntry[] = [];
    for (const snapshot of this._store.values()) {
      if (!filter?.status || snapshot.status === filter.status) {
        entries.push({
          loopId: snapshot.loopId,
          status: snapshot.status,
          goal: snapshot.goalText.substring(0, 100),
          updatedAt: snapshot.lastCheckpointAt,
        });
      }
    }
    return entries;
  }

  async delete(loopId: string): Promise<void> {
    this._store.delete(loopId);
  }
}
