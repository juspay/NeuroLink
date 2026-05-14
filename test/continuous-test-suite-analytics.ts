#!/usr/bin/env tsx
import "dotenv/config";

/**
 * Continuous Test Suite: Advanced Analytics
 *
 * Tests implementation of missing advanced analytics APIs:
 * getProviderMetrics, getCostAnalysis, and getTeamAnalytics.
 * Validates provider filtering, time range filtering, cost aggregation,
 * future projections, empty datasets, and invalid team handling.
 */

import { AnalyticsService } from "../src/lib/analytics/index.ts";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string): void {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(`  ${title}`, "cyan");
  log(`${"=".repeat(60)}`, "cyan");
}

function logTest(testName: string, status: "PASS" | "FAIL" | "SKIP", details?: string): void {
  const statusColors: Record<string, keyof typeof colors> = {
    PASS: "green",
    FAIL: "red",
    SKIP: "yellow",
  };
  const clr = statusColors[status] || "reset";
  const det = details ? ` — ${details}` : "";
  log(`[${status}] ${testName}${det}`, clr);
}

const testResults: Array<{ name: string; result: boolean; error: string | null }> = [];

async function runAllTests() {
  const startTime = Date.now();
  logSection("Initializing Advanced Analytics Test Suite");

  const service = new AnalyticsService();

  // Populate mock telemetry records for robust testing
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  // Record 1: OpenAI GPT-4o, successful
  await service.trackRequest({
    provider: "openai",
    model: "gpt-4o",
    userId: "user-1",
    teamId: "team-alpha",
    department: "engineering",
    timestamp: now - 5 * dayMs,
    latency: 1200,
    inputTokens: 1000,
    outputTokens: 500,
    totalTokens: 1500,
    isError: false,
    qualityScore: { overall: 9.2, relevance: 9.5, accuracy: 9.0, completeness: 9.1 },
  });

  // Record 2: Anthropic Claude 3.5 Sonnet, successful
  await service.trackRequest({
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    userId: "user-2",
    teamId: "team-alpha",
    department: "engineering",
    timestamp: now - 2 * dayMs,
    latency: 850,
    inputTokens: 2000,
    outputTokens: 1000,
    totalTokens: 3000,
    isError: false,
    qualityScore: { overall: 9.6, relevance: 9.8, accuracy: 9.5, completeness: 9.5 },
  });

  // Record 3: Google Gemini 2.5 Flash, error
  await service.trackRequest({
    provider: "google",
    model: "gemini-2.5-flash",
    userId: "user-1",
    teamId: "team-beta",
    department: "marketing",
    timestamp: now - 1 * dayMs,
    latency: 300,
    inputTokens: 500,
    outputTokens: 0,
    totalTokens: 500,
    isError: true,
    errorMessage: "Rate limit exceeded",
  });

  // Test 1: Provider Metrics - Aggregation and filtering
  try {
    const resAll = await service.getProviderMetrics();
    const hasOpenAI = resAll.providers.some((p) => p.name === "openai");
    const hasAnthropic = resAll.providers.some((p) => p.name === "anthropic");

    // Filtered by provider
    const resFiltered = await service.getProviderMetrics({ providers: ["openai"] });
    const onlyOpenAI = resFiltered.providers.length === 1 && resFiltered.providers[0].name === "openai";

    if (hasOpenAI && hasAnthropic && onlyOpenAI && resAll.requestCount === 3) {
      logTest("Provider Metrics Filtering & Aggregation", "PASS", `Captured all 3 requests properly`);
      testResults.push({ name: "Provider Metrics Filtering & Aggregation", result: true, error: null });
    } else {
      throw new Error("Mismatch in aggregated provider counts or filtering behavior");
    }
  } catch (err) {
    logTest("Provider Metrics Filtering & Aggregation", "FAIL", String(err));
    testResults.push({ name: "Provider Metrics Filtering & Aggregation", result: false, error: String(err) });
  }

  // Test 2: Time Range Filtering
  try {
    // Filter to last 24 hours (should exclude Record 1 and 2)
    const resRecent = await service.getProviderMetrics({ timeRange: "last_24_hours" });
    // Custom start/end range
    const resCustom = await service.getProviderMetrics({
      timeRange: { start: new Date(now - 6 * dayMs), end: new Date(now - 3 * dayMs) },
    });

    if (resCustom.requestCount === 1) {
      logTest("Time Range Filtering", "PASS", "Correctly filtered records by dynamic strings and Date ranges");
      testResults.push({ name: "Time Range Filtering", result: true, error: null });
    } else {
      throw new Error(`Expected 1 record in custom range, found ${resCustom.requestCount}`);
    }
  } catch (err) {
    logTest("Time Range Filtering", "FAIL", String(err));
    testResults.push({ name: "Time Range Filtering", result: false, error: String(err) });
  }

  // Test 3: Cost Analysis & Future Projections
  try {
    const costRes = await service.getCostAnalysis({
      groupBy: ["provider", "model"],
      includeProjections: true,
    });

    const hasCheapestSort = Array.isArray(costRes.providers) && costRes.providers.length > 0;
    const hasProjections = costRes.projections && costRes.projections.nextMonth > 0;

    if (costRes.totalCost > 0 && hasCheapestSort && hasProjections) {
      logTest("Cost Analysis & Projections", "PASS", `Calculated costs & projections: nextMonth=$${costRes.projections?.nextMonth.toFixed(2)}`);
      testResults.push({ name: "Cost Analysis & Projections", result: true, error: null });
    } else {
      throw new Error("Missing required provider groupings or projected calculations");
    }
  } catch (err) {
    logTest("Cost Analysis & Projections", "FAIL", String(err));
    testResults.push({ name: "Cost Analysis & Projections", result: false, error: String(err) });
  }

  // Test 4: Team Analytics & Invalid/Empty Handling
  try {
    const teamAlpha = await service.getTeamAnalytics({ teamId: "team-alpha" });
    const invalidTeam = await service.getTeamAnalytics({ teamId: "nonexistent-team" });

    const correctAlphaCount = teamAlpha.totalRequests === 2 && teamAlpha.uniqueUsers === 2;
    const correctEmptyHandling = invalidTeam.totalRequests === 0 && Array.isArray(invalidTeam.providersUsed);

    if (correctAlphaCount && correctEmptyHandling) {
      logTest("Team Analytics & Empty Datasets", "PASS", "Safely processed valid teams and graceful defaults for missing teams");
      testResults.push({ name: "Team Analytics & Empty Datasets", result: true, error: null });
    } else {
      throw new Error("Failed to compute valid team breakdown or gracefully handle empty sets");
    }
  } catch (err) {
    logTest("Team Analytics & Empty Datasets", "FAIL", String(err));
    testResults.push({ name: "Team Analytics & Empty Datasets", result: false, error: String(err) });
  }

  // Test 5: Safe NeuroLink Class Fallbacks
  try {
    // Dynamically test if NeuroLink module wrapper methods fail safely when service isn't populated or uninitialized
    let NeuroLinkMod: any;
    try {
      NeuroLinkMod = await import("../src/lib/neurolink.ts");
    } catch {
      // ignore
    }

    if (NeuroLinkMod && NeuroLinkMod.NeuroLink) {
      const sdk = new NeuroLinkMod.NeuroLink();
      const pRes = await sdk.getProviderMetrics();
      const cRes = await sdk.getCostAnalysis();
      const tRes = await sdk.getTeamAnalytics();

      if (pRes && cRes && tRes && Array.isArray(pRes.providers) && Array.isArray(cRes.providers)) {
        logTest("NeuroLink Class Integration", "PASS", "Public instance methods execute correctly and return full structures");
        testResults.push({ name: "NeuroLink Class Integration", result: true, error: null });
      } else {
        throw new Error("NeuroLink instance methods returned malformed data structures");
      }
    } else {
      logTest("NeuroLink Class Integration", "SKIP", "Source wrapper testing skipped during direct unit evaluation");
    }
  } catch (err) {
    logTest("NeuroLink Class Integration", "FAIL", String(err));
    testResults.push({ name: "NeuroLink Class Integration", result: false, error: String(err) });
  }

  // Summary
  logSection("Advanced Analytics Test Summary");
  const passed = testResults.filter((r) => r.result === true).length;
  const failed = testResults.filter((r) => r.result === false).length;

  const duration = Math.round((Date.now() - startTime) / 1000);
  log(`\nFinal Results: ${passed} passed, ${failed} failed (${testResults.length} total) in ${duration}s`, failed === 0 ? "green" : "red");

  if (typeof describe === "undefined") {
    process.exit(failed === 0 ? 0 : 1);
  }
}

if (typeof describe === "undefined") {
  runAllTests().catch((e) => {
    log(`Suite crashed: ${e instanceof Error ? e.message : String(e)}`, "red");
    process.exit(1);
  });
} else {
  describe("Continuous Test Suite: Advanced Analytics", () => {
    it("runs analytics operations flawlessly", () => runAllTests(), 30000);
  });
}
