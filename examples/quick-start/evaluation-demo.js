#!/usr/bin/env node
/**
 * Evaluation Demo - Small Team Focused
 * Shows the evaluation system in action
 */

import dotenv from "dotenv";
dotenv.config();

// Local imports from built version
import { evaluateResponse } from "../../dist/lib/core/evaluation.js";

async function evaluationDemo() {
  console.log("⭐ Evaluation Demo");
  console.log("==================\n");

  const query = "Explain machine learning in simple terms";
  const response =
    "Machine learning is a type of AI that learns patterns from data to make predictions or decisions without being explicitly programmed for each task.";

  try {
    // 1. Basic Evaluation
    console.log("1. 🔹 Basic Evaluation");
    const result = await evaluateResponse(query, response);

    console.log(`   Relevance: ${result.relevanceScore}/10`);
    console.log(`   Accuracy: ${result.accuracyScore}/10`);
    console.log(`   Completeness: ${result.completenessScore}/10`);
    console.log(`   Overall: ${result.overall}/10`);
    console.log(`   Alert: ${result.alertSeverity}`);
    console.log(`   Reasoning: ${result.reasoning}\n`);

    // 2. Domain-Aware Evaluation
    console.log("2. 🎯 Domain-Aware Evaluation");
    const domainResult = await evaluateResponse(
      query,
      response,
      { team: "small-team", feature: "ai-education" },
      "AI education platform",
      "knowledge-base, simplification tools",
      [
        { role: "user", content: "I want to understand AI concepts" },
        { role: "assistant", content: "I can help explain AI in simple terms" },
      ],
    );

    console.log(`   Relevance: ${domainResult.relevanceScore}/10`);
    console.log(`   Accuracy: ${domainResult.accuracyScore}/10`);
    console.log(`   Completeness: ${domainResult.completenessScore}/10`);
    console.log(`   Overall: ${domainResult.overall}/10`);
    console.log(`   Alert: ${domainResult.alertSeverity}`);
    console.log(`   Reasoning: ${domainResult.reasoning}\n`);

    console.log("✅ Evaluation system working!");
  } catch (error) {
    console.error("❌ Evaluation demo failed:", error.message);
    console.log("\n🔧 Possible fixes:");
    console.log("   - Check if evaluation model API key is set");
    console.log("   - Verify internet connection");
    console.log("   - Try again in a moment");
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  evaluationDemo().catch(console.error);
}

export { evaluationDemo };
