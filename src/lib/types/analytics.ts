/**
 * Analytics-related type definitions for NeuroLink
 * Comprehensive usage tracking, performance metrics, and cost analysis types
 */

import type { JsonValue, UnknownRecord } from "./common.js";

/**
 * Token usage information (consolidated from multiple sources)
 */
export type TokenUsage = {
  input: number;
  output: number;
  total: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  reasoning?: number;
  cacheSavingsPercent?: number;
};

/**
 * Error info type for analytics
 */
export type AnalyticsErrorInfo = {
  message: string;
  code?: string | number;
  stack?: string;
  details?: UnknownRecord;
};

/**
 * Analytics data structure (consolidated from core analytics)
 */
export type AnalyticsData = {
  provider: string;
  model?: string;
  tokenUsage: TokenUsage;
  requestDuration: number;
  timestamp: string;
  cost?: number;
  context?: JsonValue;
};

/**
 * Stream Analytics Data - Enhanced for performance tracking
 */
export type StreamAnalyticsData = {
  /** Tool execution results with timing */
  toolResults?: Promise<Array<unknown>>;
  /** Tool calls made during stream */
  toolCalls?: Promise<Array<unknown>>;
  /** Stream performance metrics */
  performance?: {
    startTime: number;
    endTime?: number;
    chunkCount: number;
    avgChunkSize: number;
    totalBytes: number;
  };
  /** Provider analytics */
  providerAnalytics?: AnalyticsData;
};

export type PerformanceMetrics = {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryStart: NodeJS.MemoryUsage;
  memoryEnd?: NodeJS.MemoryUsage;
  memoryDelta?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
};

export type TimeRangeOption = {
  start: Date;
  end: Date;
};

export interface ProviderMetricsOptions {
  providers?: string[];
  timeRange?: TimeRangeOption | string;
  metrics?: string[];
}

export interface ProviderMetricItem {
  name: string;
  averageLatency: number;
  averageResponseTime: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  errorRate: number;
  successRate: number;
  costPerToken: number;
  totalCost: number;
  requestCount: number;
}

export interface ProviderMetricsResult {
  averageLatency: number;
  averageResponseTime: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  errorRate: number;
  successRate: number;
  costPerToken: number;
  totalCost: number;
  requestCount: number;
  providers: ProviderMetricItem[];
}

export interface CostAnalysisOptions {
  timeRange?: TimeRangeOption | string;
  groupBy?: string | string[];
  includeProjections?: boolean;
}

export interface CostGroupItem {
  groupKey: string;
  provider?: string;
  model?: string;
  userId?: string;
  totalCost: number;
  costPerToken: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
}

export interface CostAnalysisResult {
  totalCost: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
  groups: Record<string, CostGroupItem>;
  providers: CostGroupItem[];
  projections?: {
    nextMonth: number;
    nextQuarter: number;
  };
}

export interface TeamAnalyticsOptions {
  teamId?: string;
  departments?: string[];
  metrics?: string[];
  timeRange?: TimeRangeOption | string;
}

export interface TeamAnalyticsResult {
  totalRequests: number;
  uniqueUsers: number;
  providersUsed: string[];
  costBreakdownByProvider: Record<string, number>;
  costBreakdownByUser: Record<string, number>;
  qualityScores?: {
    overall: number;
    relevance: number;
    accuracy: number;
    completeness: number;
    reasoning?: string;
  };
}
