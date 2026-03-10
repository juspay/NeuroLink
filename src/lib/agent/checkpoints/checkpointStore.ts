import type { LoopSnapshot } from "../loopTypes.js";

export type CheckpointListEntry = {
  loopId: string;
  status: string;
  goal: string;
  updatedAt: string;
};

/**
 * CheckpointStore interface — persists LoopSnapshot between iterations and crashes.
 */
export interface CheckpointStore {
  save(snapshot: LoopSnapshot): Promise<void>;
  load(loopId: string): Promise<LoopSnapshot | null>;
  list(filter?: { status?: string }): Promise<CheckpointListEntry[]>;
  delete(loopId: string): Promise<void>;
}
