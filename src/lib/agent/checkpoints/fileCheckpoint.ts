import { promises as fs } from "fs";
import path from "path";
import type { LoopSnapshot } from "../loopTypes.js";
import type { CheckpointListEntry, CheckpointStore } from "./checkpointStore.js";

/**
 * File-based checkpoint store.
 * Stores JSON snapshots in `.neurolink/checkpoints/{loopId}.json`.
 * Simple, no dependencies — good for single-process use.
 */
export class FileCheckpointStore implements CheckpointStore {
  constructor(
    private readonly dir: string = ".neurolink/checkpoints",
  ) {}

  private _filePath(loopId: string): string {
    return path.join(this.dir, `${loopId}.json`);
  }

  private async _ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  async save(snapshot: LoopSnapshot): Promise<void> {
    await this._ensureDir();
    await fs.writeFile(
      this._filePath(snapshot.loopId),
      JSON.stringify(snapshot, null, 2),
      "utf-8",
    );
  }

  async load(loopId: string): Promise<LoopSnapshot | null> {
    try {
      const raw = await fs.readFile(this._filePath(loopId), "utf-8");
      return JSON.parse(raw) as LoopSnapshot;
    } catch {
      return null;
    }
  }

  async list(filter?: { status?: string }): Promise<CheckpointListEntry[]> {
    try {
      await this._ensureDir();
      const files = await fs.readdir(this.dir);
      const entries: CheckpointListEntry[] = [];

      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const raw = await fs.readFile(path.join(this.dir, file), "utf-8");
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
          // Skip malformed checkpoint files
        }
      }

      return entries;
    } catch {
      return [];
    }
  }

  async delete(loopId: string): Promise<void> {
    try {
      await fs.unlink(this._filePath(loopId));
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
