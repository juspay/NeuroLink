/**
 * Analytics Storage Layer Interface and In-Memory Implementation
 * Designed modularly so Redis or a database can later replace the storage backend.
 */

export interface TelemetryRecord {
  id: string;
  provider: string;
  model: string;
  userId?: string;
  teamId?: string;
  department?: string;
  timestamp: number;
  latency: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  isError: boolean;
  errorMessage?: string;
  qualityScore?: {
    overall: number;
    relevance: number;
    accuracy: number;
    completeness: number;
    reasoning?: string;
  };
}

export interface AnalyticsStorage {
  /** Save a telemetry record */
  saveRecord(record: TelemetryRecord): Promise<void>;
  /** Retrieve all records */
  getRecords(): Promise<TelemetryRecord[]>;
  /** Clear storage */
  clear(): Promise<void>;
}

/**
 * Lightweight in-memory storage implementation
 */
export class InMemoryAnalyticsStorage implements AnalyticsStorage {
  private records: TelemetryRecord[] = [];

  async saveRecord(record: TelemetryRecord): Promise<void> {
    this.records.push(record);
  }

  async getRecords(): Promise<TelemetryRecord[]> {
    return [...this.records];
  }

  async clear(): Promise<void> {
    this.records = [];
  }
}
