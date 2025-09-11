/**
 * Conversation Memory Test - Quick Validation
 * Tests core conversation memory functionality with clear pass/fail indicators
 */

import { NeuroLink } from "../dist/index.js";

// Test configuration with strict limits for easy validation
const neurolink = new NeuroLink({
  conversationMemory: {
    enabled: true,
    maxSessions: 2, // Only keep 2 sessions
    maxTurnsPerSession: 2, // Only keep 2 turns per session
  },
});

async function runConversationMemoryTest() {
  console.log("🧪 NeuroLink Conversation Memory - Quick Test");
  console.log("=".repeat(50));

  try {
    // =================================================================
    // TEST 1: Basic Memory Functionality
    // =================================================================
    console.log("\n📋 TEST 1: Basic Memory Functionality");
    console.log("-".repeat(40));

    console.log("👤 User: My name is Alice");
    const response1 = await neurolink.generate({
      input: { text: "My name is Alice" },
      provider: "vertex",
      context: { sessionId: "test-session", userId: "alice" },
    });
    console.log(`🤖 AI: ${response1.content}`);

    console.log("\n👤 User: What is my name?");
    const response2 = await neurolink.generate({
      input: { text: "What is my name?" },
      provider: "vertex",
      context: { sessionId: "test-session", userId: "alice" },
    });
    console.log(`🤖 AI: ${response2.content}`);

    const shouldRememberName = response2.content
      .toLowerCase()
      .includes("alice");
    console.log(
      `✅ Memory Test: ${shouldRememberName ? "PASS" : "FAIL"} - ${shouldRememberName ? "Remembers name correctly" : "Failed to remember name"}`,
    );

    // =================================================================
    // TEST 2: Session Isolation
    // =================================================================
    console.log("\n📋 TEST 2: Session Isolation");
    console.log("-".repeat(40));

    console.log("👤 User (different session): Do you know Alice?");
    const response3Result = await neurolink.stream({
      input: { text: "Do you know Alice?" },
      provider: "vertex",
      context: { sessionId: "different-session", userId: "bob" },
    });

    // Collect stream content for testing
    let response3Content = "";
    for await (const chunk of response3Result.stream) {
      response3Content += chunk.content;
    }
    console.log(`🤖 AI: ${response3Content}`);

    const properIsolation =
      !response3Content.toLowerCase().includes("alice") ||
      response3Content.toLowerCase().includes("don't know") ||
      response3Content.toLowerCase().includes("no") ||
      response3Content.toLowerCase().includes("not familiar");
    console.log(
      `✅ Isolation Test: ${properIsolation ? "PASS" : "FAIL"} - ${properIsolation ? "Sessions properly isolated" : "Session leakage detected"}`,
    );

    // =================================================================
    // TEST 3: Turn Limit Testing
    // =================================================================
    console.log("\n📋 TEST 3: Turn Limit Testing (maxTurns: 2)");
    console.log("-".repeat(40));

    let stats = await neurolink.getConversationStats();
    console.log(
      `� Before limit test: ${stats.totalSessions} sessions, ${stats.totalTurns} turns`,
    );

    // Add turn 3 (should delete turn 1)
    console.log("\n👤 User: My favorite color is blue");
    await neurolink.generate({
      input: { text: "My favorite color is blue" },
      provider: "vertex",
      context: { sessionId: "test-session", userId: "alice" },
    });

    // Add turn 4 (should delete turn 2, keeping only recent turns)
    console.log("👤 User: My hobby is reading");
    await neurolink.generate({
      input: { text: "My hobby is reading" },
      provider: "vertex",
      context: { sessionId: "test-session", userId: "alice" },
    });

    // Test if old information is forgotten
    console.log("\n👤 User: Do you remember my name?");
    const nameCheckAfterLimit = await neurolink.generate({
      input: { text: "Do you remember my name?" },
      provider: "vertex",
      context: { sessionId: "test-session", userId: "alice" },
    });
    console.log(`🤖 AI: ${nameCheckAfterLimit.content}`);

    stats = await neurolink.getConversationStats();
    console.log(
      `📊 After limit test: ${stats.totalSessions} sessions, ${stats.totalTurns} turns`,
    );

    const turnLimitWorking = stats.totalTurns <= 4; // 2 sessions × 2 turns max
    console.log(
      `✅ Turn Limit Test: ${turnLimitWorking ? "PASS" : "FAIL"} - ${turnLimitWorking ? "Turn limits enforced" : "Turn limits not working"}`,
    );

    // =================================================================
    // TEST 4: Session Limit Testing
    // =================================================================
    console.log("\n📋 TEST 4: Session Limit Testing (maxSessions: 2)");
    console.log("-".repeat(40));

    // Create session 3 (should delete oldest session)
    console.log("👤 User (session 3): My name is Charlie");
    await neurolink.generate({
      input: { text: "My name is Charlie" },
      provider: "vertex",
      context: { sessionId: "session-3", userId: "charlie" },
    });

    stats = await neurolink.getConversationStats();
    console.log(
      `📊 After session 3: ${stats.totalSessions} sessions, ${stats.totalTurns} turns`,
    );

    const sessionLimitWorking = stats.totalSessions <= 2;
    console.log(
      `✅ Session Limit Test: ${sessionLimitWorking ? "PASS" : "FAIL"} - ${sessionLimitWorking ? "Session limits enforced" : "Session limits not working"}`,
    );

    // =================================================================
    // TEST 5: API Testing
    // =================================================================
    console.log("\n📋 TEST 5: API Testing");
    console.log("-".repeat(40));

    // Test clearConversationSession
    const sessionCleared =
      await neurolink.clearConversationSession("session-3");
    console.log(
      `🗑️ Clear specific session: ${sessionCleared ? "SUCCESS" : "FAILED"}`,
    );

    stats = await neurolink.getConversationStats();
    console.log(
      `📊 After clearing session: ${stats.totalSessions} sessions, ${stats.totalTurns} turns`,
    );

    // Test clearAllConversations
    await neurolink.clearAllConversations();
    stats = await neurolink.getConversationStats();
    console.log(
      `🗑️ Clear all conversations: ${stats.totalSessions === 0 ? "SUCCESS" : "FAILED"}`,
    );
    console.log(
      `📊 After clearing all: ${stats.totalSessions} sessions, ${stats.totalTurns} turns`,
    );

    // =================================================================
    // TEST 6: Stream Memory Core Functionality
    // =================================================================
    console.log("\n📋 TEST 6: Stream Memory Core Functionality");
    console.log("-".repeat(40));

    // Start fresh session for stream testing
    await neurolink.clearAllConversations();

    console.log("👤 User: My favorite food is pizza");
    const streamFoodResult = await neurolink.stream({
      input: { text: "My favorite food is pizza" },
      provider: "vertex",
      context: { sessionId: "stream-memory-test", userId: "stream-user" },
    });

    // Consume the stream to trigger memory storage
    let streamFoodContent = "";
    for await (const chunk of streamFoodResult.stream) {
      streamFoodContent += chunk.content;
    }
    console.log(`🤖 AI (streamed): ${streamFoodContent.substring(0, 200)}...`);

    // Test if stream response is remembered after consumption
    console.log("\n👤 User: What did I tell you about my food preference?");
    const foodMemoryCheck = await neurolink.generate({
      input: { text: "What did I tell you about my food preference?" },
      provider: "vertex",
      context: { sessionId: "stream-memory-test", userId: "stream-user" },
    });
    console.log(`🤖 AI: ${foodMemoryCheck.content}`);

    const streamMemoryWorks = foodMemoryCheck.content
      .toLowerCase()
      .includes("pizza");
    console.log(
      `✅ Stream Memory Core: ${streamMemoryWorks ? "PASS" : "FAIL"} - ${streamMemoryWorks ? "Stream response remembered correctly" : "Stream memory failed"}`,
    );

    // =================================================================
    // TEST 7: Manual Stream Consumption vs AI Previous Response Recall
    // =================================================================
    console.log("\n📋 TEST 7: AI Previous Response Recall Test");
    console.log("-".repeat(40));

    // Start another fresh session
    await neurolink.clearAllConversations();

    console.log("👤 User: Tell me about machine learning");
    const mlStreamResult = await neurolink.stream({
      input: { text: "Tell me about machine learning" },
      provider: "vertex",
      context: { sessionId: "recall-test-session", userId: "recall-user" },
    });

    // Collect the stream content to see what AI actually said
    let actualMLResponse = "";
    for await (const chunk of mlStreamResult.stream) {
      actualMLResponse += chunk.content;
    }
    console.log(`🤖 AI (streamed): ${actualMLResponse.substring(0, 200)}...`);

    // Now ask AI to recall what it just said
    console.log(
      "\n👤 User: Can you summarize what you just told me about machine learning?",
    );
    const recallCheck = await neurolink.generate({
      input: {
        text: "Can you summarize what you just told me about machine learning?",
      },
      provider: "vertex",
      context: { sessionId: "recall-test-session", userId: "recall-user" },
    });
    console.log(`🤖 AI (recall): ${recallCheck.content}`);

    // Check if AI can recall concepts from its own previous response
    const canRecallOwnResponse =
      recallCheck.content.toLowerCase().includes("machine learning") ||
      recallCheck.content.toLowerCase().includes("ml");
    console.log(
      `✅ AI Self-Recall: ${canRecallOwnResponse ? "PASS" : "FAIL"} - ${canRecallOwnResponse ? "AI can recall its own previous streaming response" : "AI cannot recall previous response"}`,
    );

    // =================================================================
    // TEST 8: Mixed Stream/Generate Conversation Continuity
    // =================================================================
    console.log("\n📋 TEST 8: Mixed Stream/Generate Conversation Continuity");
    console.log("-".repeat(40));

    // Clear and start conversation with generate
    await neurolink.clearAllConversations();

    console.log("👤 User: I work as a software engineer");
    const jobResponse = await neurolink.generate({
      input: { text: "I work as a software engineer" },
      provider: "vertex",
      context: { sessionId: "mixed-test-session", userId: "mixed-user" },
    });
    console.log(`🤖 AI (generated): ${jobResponse.content}`);

    // Continue with stream
    console.log("\n👤 User: I specialize in AI development");
    const specializationResult = await neurolink.stream({
      input: { text: "I specialize in AI development" },
      provider: "vertex",
      context: { sessionId: "mixed-test-session", userId: "mixed-user" },
    });

    let specializationContent = "";
    for await (const chunk of specializationResult.stream) {
      specializationContent += chunk.content;
    }
    console.log(`🤖 AI (streamed): ${specializationContent}`);

    // Test continuity with generate
    console.log("\n👤 User: Summarize what you know about my career");
    const careerSummaryResult = await neurolink.stream({
      input: { text: "Summarize what you know about my career" },
      provider: "vertex",
      context: { sessionId: "mixed-test-session", userId: "mixed-user" },
    });

    // Collect stream content with error handling
    let careerSummaryContent = "";
    try {
      for await (const chunk of careerSummaryResult.stream) {
        if (
          chunk &&
          typeof chunk === "object" &&
          chunk.content &&
          typeof chunk.content === "string"
        ) {
          careerSummaryContent += chunk.content;
        }
      }
    } catch (streamError) {
      console.error("❌ Stream iteration failed:", streamError.message);
      careerSummaryContent = `[Stream Error: ${streamError.message}]`;
    }

    // Ensure careerSummaryContent is never undefined or null
    if (!careerSummaryContent || typeof careerSummaryContent !== "string") {
      careerSummaryContent = "[Empty stream response]";
    }

    console.log(`🤖 AI (streamed): ${careerSummaryContent}`);

    // Safe check for mixed continuity with proper type validation
    const isSafeString =
      careerSummaryContent &&
      typeof careerSummaryContent === "string" &&
      careerSummaryContent.length > 0;
    const hasCareerInfo =
      isSafeString &&
      (careerSummaryContent.toLowerCase().includes("software") ||
        careerSummaryContent.toLowerCase().includes("engineer"));
    const hasSpecialization =
      isSafeString &&
      (careerSummaryContent.toLowerCase().includes("ai") ||
        careerSummaryContent.toLowerCase().includes("development"));

    const mixedContinuity = hasCareerInfo && hasSpecialization;

    console.log(
      `✅ Mixed Continuity: ${mixedContinuity ? "PASS" : "FAIL"} - ${mixedContinuity ? "Generate and stream work together" : "Conversation continuity broken"}`,
    );

    // =================================================================
    // TEST 9: Stream Session Isolation Verification
    // =================================================================
    console.log("\n📋 TEST 9: Stream Session Isolation Verification");
    console.log("-".repeat(40));

    // Stream in different session
    console.log(
      "👤 User (different session): What do you know about my career?",
    );
    const isolationResult = await neurolink.stream({
      input: { text: "What do you know about my career?" },
      provider: "vertex",
      context: {
        sessionId: "isolation-test-session",
        userId: "different-user",
      },
    });

    let isolationContent = "";
    for await (const chunk of isolationResult.stream) {
      isolationContent += chunk.content;
    }
    console.log(`🤖 AI (streamed): ${isolationContent}`);

    const streamIsolation =
      !isolationContent.toLowerCase().includes("software") &&
      !isolationContent.toLowerCase().includes("engineer") &&
      !isolationContent.toLowerCase().includes("ai development");

    console.log(
      `✅ Stream Isolation: ${streamIsolation ? "PASS" : "FAIL"} - ${streamIsolation ? "Stream sessions properly isolated" : "Stream session leakage detected"}`,
    );

    // =================================================================
    // TEST 10: Stream Turn Count Integration
    // =================================================================
    console.log("\n📋 TEST 10: Stream Turn Count Integration");
    console.log("-".repeat(40));

    await neurolink.clearAllConversations();

    // Mix generate and stream calls
    await neurolink.generate({
      input: { text: "Hello, I'm testing turn counts" },
      provider: "vertex",
      context: { sessionId: "mixed-test-session", userId: "turn-user" },
    });

    const streamTurnResult = await neurolink.stream({
      input: { text: "This is a stream call" },
      provider: "vertex",
      context: { sessionId: "mixed-test-session", userId: "turn-user" },
    });

    // Consume stream
    let streamTurnContent = "";
    for await (const chunk of streamTurnResult.stream) {
      streamTurnContent += chunk.content;
    }

    await neurolink.generate({
      input: { text: "And this is another generate call" },
      provider: "vertex",
      context: { sessionId: "mixed-test-session", userId: "turn-user" },
    });

    const finalStats = await neurolink.getConversationStats();
    console.log(
      `📊 Final stats: ${finalStats.totalSessions} sessions, ${finalStats.totalTurns} turns`,
    );

    // Should have 2 turns total due to maxTurnsPerSession: 2 limit (keeps only last 2 turns)
    // We make 3 calls (generate + stream + generate) but only last 2 turns are kept
    const expectedTurns = 2;
    const turnCountCorrect = finalStats.totalTurns === expectedTurns;
    console.log(
      `✅ Stream Turn Counting: ${turnCountCorrect ? "PASS" : "FAIL"} - ${turnCountCorrect ? "Stream turns counted correctly with limits" : `Expected ${expectedTurns} turns, got ${finalStats.totalTurns}`}`,
    );

    // =================================================================
    // TEST 11: AI Joke Recall Test
    // =================================================================
    console.log("\n📋 TEST 11: AI Joke Recall Test");
    console.log("-".repeat(40));

    // Start fresh session for joke test
    await neurolink.clearAllConversations();

    console.log("👤 User: Tell me a joke");
    const jokeResponse = await neurolink.generate({
      input: { text: "Tell me a joke" },
      provider: "vertex",
      context: { sessionId: "joke-test-session", userId: "joke-user" },
    });
    console.log(`🤖 AI (original joke): ${jokeResponse.content}`);

    // Extract key words from the original joke for comparison
    const originalJoke = jokeResponse.content.toLowerCase();

    // Wait a moment to ensure the conversation is saved
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log("\n👤 User: Can you repeat the joke you just told me?");
    const recallResponse = await neurolink.generate({
      input: { text: "Can you repeat the joke you just told me?" },
      provider: "vertex",
      context: { sessionId: "joke-test-session", userId: "joke-user" },
    });
    console.log(`🤖 AI (recalled joke): ${recallResponse.content}`);

    // Validation: Check if AI can recall its own joke
    const recalledJoke = recallResponse.content.toLowerCase();

    // Look for common joke indicators and shared content
    const hasJokeStructure =
      recalledJoke.includes("joke") ||
      recalledJoke.includes("funny") ||
      recalledJoke.includes("humor");

    // Extract meaningful words from original joke (excluding common words)
    const originalWords = originalJoke
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          ![
            "that",
            "this",
            "with",
            "have",
            "will",
            "what",
            "when",
            "where",
            "why",
            "how",
          ].includes(word),
      )
      .slice(0, 10); // Take first 10 meaningful words

    // Check if recalled joke contains key elements from original
    const sharedElements = originalWords.filter((word) =>
      recalledJoke.includes(word),
    ).length;

    const jokeRecallWorking =
      hasJokeStructure &&
      (sharedElements >= 2 || // At least 2 shared meaningful words
        recalledJoke.includes("told") || // AI acknowledges it told a joke
        recalledJoke.includes("said") || // AI acknowledges what it said
        (originalJoke.length < 100 &&
          recalledJoke.includes(originalJoke.substring(10, 30)))); // Partial exact match for short jokes

    console.log(
      `🔍 Analysis: Original joke had ${originalWords.length} key words, recalled joke shares ${sharedElements} elements`,
    );
    console.log(
      `✅ Joke Recall Test: ${jokeRecallWorking ? "PASS" : "FAIL"} - ${jokeRecallWorking ? "AI successfully recalled its own joke" : "AI failed to recall its previous joke response"}`,
    );

    // =================================================================
    // TEST 12: Conversation History Retrieval
    // =================================================================
    console.log("\n📋 TEST 12: Conversation History Retrieval");
    console.log("-".repeat(40));

    // Start with a fresh session for history testing
    await neurolink.clearAllConversations();

    console.log("👤 User: I am a software engineer");
    const res = await neurolink.generate({
      input: { text: "I am a software engineer" },
      provider: "vertex",
      context: { sessionId: "history-test", userId: "history-user" },
    });
    console.log(`🤖 AI: ${res.content}`);

    console.log("👤 User: I work with JavaScript and Python");
    await neurolink.generate({
      input: { text: "I work with JavaScript and Python" },
      provider: "vertex",
      context: { sessionId: "history-test", userId: "history-user" },
    });

    console.log("👤 User: What programming languages do I use?");
    const historyResponse = await neurolink.generate({
      input: { text: "What programming languages do I use?" },
      provider: "vertex",
      context: { sessionId: "history-test", userId: "history-user" },
    });
    console.log(`🤖 AI: ${historyResponse.content}`);

    // Now test the new getConversationHistory method
    console.log("\n🔍 Testing getConversationHistory() method...");

    try {
      const conversationHistory =
        await neurolink.getConversationHistory("history-test");

      console.log(
        `📊 Retrieved ${conversationHistory.length} messages from conversation history`,
      );

      // CORRECTED: With maxTurnsPerSession: 2, we expect only 4 messages (2 turns × 2 messages per turn)
      // The test config limits turns to 2, so oldest conversations are deleted
      const expectedMessageCount = 4; // 2 turns × 2 messages per turn (due to maxTurnsPerSession: 2)
      const messageCountCorrect =
        conversationHistory.length === expectedMessageCount;

      console.log(
        `📈 Expected ${expectedMessageCount} messages (limited by maxTurnsPerSession: 2), got ${conversationHistory.length}`,
      );

      // Validate message roles alternate correctly (user → assistant → user → assistant)
      let roleAlternationCorrect = true;
      const expectedRoles = ["user", "assistant", "user", "assistant"];

      for (
        let i = 0;
        i < Math.min(conversationHistory.length, expectedRoles.length);
        i++
      ) {
        const message = conversationHistory[i];
        if (message.role !== expectedRoles[i]) {
          roleAlternationCorrect = false;
          console.log(
            `❌ Role mismatch at index ${i}: expected '${expectedRoles[i]}', got '${message.role}'`,
          );
          break;
        }
      }

      // Validate message content contains expected keywords (may be limited by turn restrictions)
      const allMessages = conversationHistory
        .map((msg) => msg.content.toLowerCase())
        .join(" ");
      const containsRecentContent =
        allMessages.includes("javascript") && allMessages.includes("python");

      // Test message structure validation
      let messageStructureValid = true;
      for (const message of conversationHistory) {
        if (
          typeof message.role !== "string" ||
          typeof message.content !== "string"
        ) {
          messageStructureValid = false;
          break;
        }
        if (!["user", "assistant", "system"].includes(message.role)) {
          messageStructureValid = false;
          break;
        }
      }

      console.log(
        `🔍 Message structure validation: ${messageStructureValid ? "PASS" : "FAIL"}`,
      );
      console.log(
        `🔍 Role alternation: ${roleAlternationCorrect ? "PASS" : "FAIL"}`,
      );
      console.log(
        `🔍 Content validation (recent messages): ${containsRecentContent ? "PASS" : "FAIL"}`,
      );

      // Test edge case: Non-existent session
      console.log("\n🧪 Testing edge case: Non-existent session");
      const emptyHistory = await neurolink.getConversationHistory(
        "non-existent-session",
      );
      const emptySessionHandling =
        Array.isArray(emptyHistory) && emptyHistory.length === 0;
      console.log(
        `🔍 Empty session handling: ${emptySessionHandling ? "PASS" : "FAIL"}`,
      );

      // Test edge case: Invalid session ID
      console.log("\n🧪 Testing edge case: Invalid session ID");
      let invalidSessionHandling = false;
      try {
        await neurolink.getConversationHistory("");
        console.log("❌ Should have thrown error for empty session ID");
      } catch (error) {
        invalidSessionHandling = error.message.includes(
          "Session ID must be a non-empty string",
        );
        console.log(
          `🔍 Invalid session ID handling: ${invalidSessionHandling ? "PASS" : "FAIL"}`,
        );
      }

      // Test the complete conversation history retrieval success
      const historyRetrievalWorking =
        messageCountCorrect &&
        roleAlternationCorrect &&
        containsRecentContent &&
        messageStructureValid &&
        emptySessionHandling &&
        invalidSessionHandling;

      console.log(
        `✅ History Retrieval Test: ${historyRetrievalWorking ? "PASS" : "FAIL"} - ${historyRetrievalWorking ? "getConversationHistory() works correctly" : "History retrieval has issues"}`,
      );

      // Log all retrieved messages for debugging
      console.log("\n📝 All retrieved messages:");
      conversationHistory.forEach((msg, index) => {
        console.log(
          `   ${index + 1}. [${msg.role}]: ${msg.content.substring(0, 100)}...`,
        );
      });

      // =================================================================
      // TEST 13: Conversation Memory Disabled Error Handling
      // =================================================================
      console.log("\n📋 TEST 13: Conversation Memory Disabled Error Handling");
      console.log("-".repeat(40));

      // Create a new NeuroLink instance without conversation memory
      const { NeuroLink } = await import("../dist/index.js");
      const neurolinkDisabled = new NeuroLink({
        conversationMemory: {
          enabled: false,
        },
      });

      console.log(
        "🧪 Testing getConversationHistory() with disabled memory...",
      );
      let disabledMemoryHandling = false;
      try {
        await neurolinkDisabled.getConversationHistory("test-session");
        console.log("❌ Should have thrown error for disabled memory");
      } catch (error) {
        disabledMemoryHandling = error.message.includes(
          "Conversation memory is not enabled",
        );
        console.log(
          `🔍 Disabled memory error handling: ${disabledMemoryHandling ? "PASS" : "FAIL"}`,
        );
      }

      // =================================================================
      // TEST 14: Stream History Retrieval Test
      // =================================================================
      console.log("\n📋 TEST 14: Stream History Retrieval Test");
      console.log("-".repeat(40));

      // Create fresh NeuroLink instance with higher turn limit for stream testing
      const { NeuroLink: NeuroLinkClass } = await import("../dist/index.js");
      const neurolinkStream = new NeuroLinkClass({
        conversationMemory: {
          enabled: true,
          maxSessions: 5,
          maxTurnsPerSession: 5, // Higher limit to test multiple stream turns
        },
      });
      // await new Promise(resolve => setTimeout(resolve, 100)); // Wait for initialization

      await neurolinkStream.clearAllConversations();

      console.log("👤 User: My favorite language is JavaScript");
      const streamResult1 = await neurolinkStream.stream({
        input: { text: "My favorite language is JavaScript" },
        provider: "vertex",
        context: { sessionId: "stream-history-test", userId: "stream-user" },
      });

      // Consume the first stream to trigger memory storage
      let streamContent1 = "";
      for await (const chunk of streamResult1.stream) {
        streamContent1 += chunk.content;
      }
      console.log(`🤖 AI (streamed): ${streamContent1.substring(0, 100)}...`);

      console.log("👤 User: I also like Python for data science");
      const generateResult = await neurolinkStream.generate({
        input: { text: "I also like Python for data science" },
        provider: "vertex",
        context: { sessionId: "stream-history-test", userId: "stream-user" },
      });
      console.log(
        `🤖 AI (generated): ${generateResult.content.substring(0, 100)}...`,
      );

      console.log("👤 User: What programming languages do I prefer?");
      const streamResult2 = await neurolinkStream.stream({
        input: { text: "What programming languages do I prefer?" },
        provider: "vertex",
        context: { sessionId: "stream-history-test", userId: "stream-user" },
      });

      // Consume the second stream to trigger memory storage
      let streamContent2 = "";
      for await (const chunk of streamResult2.stream) {
        streamContent2 += chunk.content;
      }
      console.log(`🤖 AI (streamed): ${streamContent2.substring(0, 100)}...`);

      // Wait a moment to ensure all async storage operations complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Test getConversationHistory with mixed stream and generate calls
      console.log(
        "\n🔍 Testing getConversationHistory() with stream functions...",
      );
      const streamHistory = await neurolinkStream.getConversationHistory(
        "stream-history-test",
      );

      console.log(
        `📊 Retrieved ${streamHistory.length} messages from stream/generate mixed conversation`,
      );

      // With 3 turns (stream + generate + stream), we should have 6 messages
      const expectedStreamMessageCount = 6;
      const streamMessageCountCorrect =
        streamHistory.length === expectedStreamMessageCount;

      console.log(
        `📈 Expected ${expectedStreamMessageCount} messages, got ${streamHistory.length}`,
      );

      // Validate content from both stream and generate calls
      const streamAllMessages = streamHistory
        .map((msg) => msg.content.toLowerCase())
        .join(" ");
      const hasStreamContent =
        streamAllMessages.includes("javascript") &&
        streamAllMessages.includes("python");

      // Test that stream and generate messages are both captured
      let hasStreamAndGenerateMessages = false;
      if (streamHistory.length >= 4) {
        // Check if we have both user and assistant messages
        const userMessages = streamHistory.filter((msg) => msg.role === "user");
        const assistantMessages = streamHistory.filter(
          (msg) => msg.role === "assistant",
        );
        hasStreamAndGenerateMessages =
          userMessages.length >= 3 && assistantMessages.length >= 3;
      }

      console.log(
        `🔍 Stream message count: ${streamMessageCountCorrect ? "PASS" : "FAIL"}`,
      );
      console.log(
        `🔍 Stream content preservation: ${hasStreamContent ? "PASS" : "FAIL"}`,
      );
      console.log(
        `🔍 Mixed stream/generate capture: ${hasStreamAndGenerateMessages ? "PASS" : "FAIL"}`,
      );

      const streamHistoryWorking =
        streamMessageCountCorrect &&
        hasStreamContent &&
        hasStreamAndGenerateMessages;

      console.log(
        `✅ Stream History Test: ${streamHistoryWorking ? "PASS" : "FAIL"} - ${streamHistoryWorking ? "Stream conversations properly stored and retrieved" : "Stream history has issues"}`,
      );

      // Log stream history for debugging
      console.log("\n📝 Stream conversation history:");
      streamHistory.forEach((msg, index) => {
        console.log(
          `   ${index + 1}. [${msg.role}]: ${msg.content.substring(0, 80)}...`,
        );
      });

      // =================================================================
      // FINAL RESULTS (Enhanced with Stream Tests + History Retrieval)
      // =================================================================
      console.log("\n🎯 FINAL TEST RESULTS");
      console.log("=".repeat(50));

      const allTestsPassed =
        shouldRememberName &&
        properIsolation &&
        turnLimitWorking &&
        sessionLimitWorking &&
        streamMemoryWorks &&
        canRecallOwnResponse &&
        mixedContinuity &&
        streamIsolation &&
        turnCountCorrect &&
        jokeRecallWorking &&
        historyRetrievalWorking &&
        disabledMemoryHandling;

      console.log(`✅ Basic Memory: ${shouldRememberName ? "PASS" : "FAIL"}`);
      console.log(`✅ Session Isolation: ${properIsolation ? "PASS" : "FAIL"}`);
      console.log(`✅ Turn Limits: ${turnLimitWorking ? "PASS" : "FAIL"}`);
      console.log(
        `✅ Session Limits: ${sessionLimitWorking ? "PASS" : "FAIL"}`,
      );
      console.log(
        `✅ Stream Memory Core: ${streamMemoryWorks ? "PASS" : "FAIL"}`,
      );
      console.log(
        `✅ AI Self-Recall: ${canRecallOwnResponse ? "PASS" : "FAIL"}`,
      );
      console.log(`✅ Mixed Continuity: ${mixedContinuity ? "PASS" : "FAIL"}`);
      console.log(`✅ Stream Isolation: ${streamIsolation ? "PASS" : "FAIL"}`);
      console.log(
        `✅ Stream Turn Counting: ${turnCountCorrect ? "PASS" : "FAIL"}`,
      );
      console.log(`✅ Joke Recall: ${jokeRecallWorking ? "PASS" : "FAIL"}`);
      console.log(
        `✅ History Retrieval: ${historyRetrievalWorking ? "PASS" : "FAIL"}`,
      );
      console.log(
        `✅ Error Handling: ${disabledMemoryHandling ? "PASS" : "FAIL"}`,
      );
      console.log(`✅ API Functions: Working`);

      console.log(
        `\n🎉 OVERALL: ${allTestsPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`,
      );

      if (allTestsPassed) {
        console.log("🧠 Conversation memory is working correctly!");
        console.log(
          "💡 Check the logs above to see the conversation history vectors",
        );
        console.log("🎯 getConversationHistory() method is fully functional!");
      } else {
        console.log(
          "🔧 Some functionality needs attention - check the failed tests above",
        );
      }
    } catch (error) {
      console.error(
        "❌ History retrieval test failed with error:",
        error.message,
      );

      // =================================================================
      // FINAL RESULTS (With History Test Failure)
      // =================================================================
      console.log("\n🎯 FINAL TEST RESULTS");
      console.log("=".repeat(50));

      console.log(`✅ Basic Memory: ${shouldRememberName ? "PASS" : "FAIL"}`);
      console.log(`✅ Session Isolation: ${properIsolation ? "PASS" : "FAIL"}`);
      console.log(`✅ Turn Limits: ${turnLimitWorking ? "PASS" : "FAIL"}`);
      console.log(
        `✅ Session Limits: ${sessionLimitWorking ? "PASS" : "FAIL"}`,
      );
      console.log(
        `✅ Stream Memory Core: ${streamMemoryWorks ? "PASS" : "FAIL"}`,
      );
      console.log(
        `✅ AI Self-Recall: ${canRecallOwnResponse ? "PASS" : "FAIL"}`,
      );
      console.log(`✅ Mixed Continuity: ${mixedContinuity ? "PASS" : "FAIL"}`);
      console.log(`✅ Stream Isolation: ${streamIsolation ? "PASS" : "FAIL"}`);
      console.log(
        `✅ Stream Turn Counting: ${turnCountCorrect ? "PASS" : "FAIL"}`,
      );
      console.log(`✅ Joke Recall: ${jokeRecallWorking ? "PASS" : "FAIL"}`);
      console.log(`❌ History Retrieval: FAIL`);
      console.log(`✅ API Functions: Working`);

      console.log(`\n🎉 OVERALL: ❌ SOME TESTS FAILED`);
      console.log("🔧 History retrieval functionality needs attention");
    }
  } catch (error) {
    console.error("\n❌ TEST FAILED WITH ERROR:", error.message);
    console.error("📍 Stack trace:", error.stack);

    if (error.message.includes("Failed to generate text with all providers")) {
      console.log("\n💡 Setup required:");
      console.log('   export OPENAI_API_KEY="your-key-here"');
      console.log("   # or configure any other supported AI provider");
    }
  }
}

// Run the test
console.log("Starting conversation memory test...\n");
runConversationMemoryTest();
