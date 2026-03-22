/**
 * React Chat Application Example
 *
 * A complete chat application demonstrating the use of NeuroLink Client SDK
 * React hooks for building interactive AI chat interfaces.
 *
 * @remarks
 * This is a React component example that requires a bundler (Vite, webpack, etc.)
 * to run. It is not a standalone script and must be imported into a React application
 * with the appropriate build tooling configured.
 *
 * Features:
 * - useChat hook for message management
 * - useAgent hook for agent execution
 * - useVoice hook for voice interactions
 * - useTools hook for tool discovery
 * - Real-time streaming responses
 * - Tool call visualization
 * - Error handling and retry
 * - Session management
 * - Multimodal input (text + images)
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom/client";
import {
  NeuroLinkProvider,
  useChat,
  useAgent,
  useVoice,
  useTools,
  isNeuroLinkError,
  ErrorCode,
  type ChatMessage,
} from "@juspay/neurolink/client";

// =============================================================================
// Main App Component
// =============================================================================

function App() {
  // Vite exposes env vars via import.meta.env.VITE_* (not process.env.REACT_APP_*)
  return (
    <NeuroLinkProvider
      config={{
        baseUrl:
          import.meta.env.VITE_NEUROLINK_BASE_URL || "http://localhost:3000",
        apiKey: import.meta.env.VITE_NEUROLINK_API_KEY,
        debug: import.meta.env.DEV,
        timeout: 60000,
        retry: {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
        },
      }}
    >
      <div className="app">
        <header className="app-header">
          <h1>NeuroLink Chat Demo</h1>
          <p>AI-powered chat with voice, agents, and tools</p>
        </header>

        <main className="app-main">
          <ChatDemo />
        </main>
      </div>
    </NeuroLinkProvider>
  );
}

// =============================================================================
// Chat Demo Component
// =============================================================================

function ChatDemo() {
  const [activeTab, setActiveTab] = useState<
    "chat" | "agent" | "voice" | "tools"
  >("chat");

  return (
    <div className="chat-demo">
      <nav className="tabs">
        <button
          className={activeTab === "chat" ? "active" : ""}
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>
        <button
          className={activeTab === "agent" ? "active" : ""}
          onClick={() => setActiveTab("agent")}
        >
          Agent
        </button>
        <button
          className={activeTab === "voice" ? "active" : ""}
          onClick={() => setActiveTab("voice")}
        >
          Voice
        </button>
        <button
          className={activeTab === "tools" ? "active" : ""}
          onClick={() => setActiveTab("tools")}
        >
          Tools
        </button>
      </nav>

      <div className="tab-content">
        {activeTab === "chat" && <ChatTab />}
        {activeTab === "agent" && <AgentTab />}
        {activeTab === "voice" && <VoiceTab />}
        {activeTab === "tools" && <ToolsTab />}
      </div>
    </div>
  );
}

// =============================================================================
// Chat Tab Component
// =============================================================================

function ChatTab() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stabilize the demo session ID so it is generated once per mount,
  // not on every render.
  const sessionId = useMemo(() => `session-${Date.now()}`, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
    stop,
    setMessages,
    clearError,
    toolCalls,
  } = useChat({
    agentId: "general-assistant",
    sessionId,
    systemPrompt: "You are a helpful assistant. Be concise and friendly.",

    // Callbacks
    onResponse: (response) => {
      console.log("Response received:", response.status);
    },
    onFinish: (message) => {
      console.log("Message complete:", message.content.length, "chars");
    },
    onError: (err) => {
      console.error("Chat error:", err);

      if (isNeuroLinkError(err)) {
        switch (err.code) {
          case ErrorCode.RATE_LIMIT_EXCEEDED:
            showToast("Rate limit exceeded. Please wait a moment.");
            break;
          case ErrorCode.CONTEXT_LENGTH_EXCEEDED:
            showToast("Conversation too long. Starting new session.");
            setMessages([]);
            break;
          default:
            showToast(`Error: ${err.message}`);
        }
      }
    },
    onToolCall: (toolCall) => {
      console.log("Tool called:", toolCall.name, toolCall.arguments);
    },

    // Custom request body
    body: {
      temperature: 0.7,
      maxTokens: 2000,
      provider: "openai",
      model: "gpt-4o",
    },

    // Generate unique IDs
    generateId: () => `msg_${Date.now()}_${Math.random()}`,
  });

  const handleSubmitWithImages = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedImages.length > 0) {
      // Append message with images
      append({
        role: "user",
        content: input,
        metadata: { images: selectedImages },
      });

      // Clear images
      setSelectedImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      handleSubmit(e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageUrls: string[] = [];
    const readers: Promise<string>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
      });

      readers.push(promise);
      reader.readAsDataURL(file);
    }

    Promise.all(readers).then((urls) => {
      setSelectedImages((prev) => [...prev, ...urls]);
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-tab">
      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Start a conversation!</p>
            <div className="suggestions">
              <button
                onClick={() =>
                  append({
                    role: "user",
                    content: "Tell me a joke",
                  })
                }
              >
                Tell me a joke
              </button>
              <button
                onClick={() =>
                  append({
                    role: "user",
                    content: "Explain quantum computing",
                  })
                }
              >
                Explain quantum computing
              </button>
              <button
                onClick={() =>
                  append({
                    role: "user",
                    content: "Write a haiku about coding",
                  })
                }
              >
                Write a haiku
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <div className="avatar">🤖</div>
            <div className="content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {toolCalls.length > 0 && (
          <div className="tool-calls-active">
            <h4>🔧 Tools in use:</h4>
            {toolCalls.map((tool, i) => (
              <div key={i} className="tool-call">
                <strong>{tool.name}</strong>
                <pre>{JSON.stringify(tool.arguments, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error.message}</span>
          <button onClick={clearError} className="error-dismiss">
            ✕
          </button>
        </div>
      )}

      {/* Image Preview */}
      {selectedImages.length > 0 && (
        <div className="image-preview">
          {selectedImages.map((url, i) => (
            <div key={i} className="preview-item">
              <img src={url} alt={`Upload ${i + 1}`} />
              <button
                onClick={() =>
                  setSelectedImages((prev) =>
                    prev.filter((_, idx) => idx !== i),
                  )
                }
                className="remove-image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmitWithImages} className="input-form">
        <div className="input-wrapper">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="attach-button"
            disabled={isLoading}
          >
            📎
          </button>

          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={isLoading}
            className="message-input"
          />

          <button
            type="submit"
            disabled={
              isLoading || (!input.trim() && selectedImages.length === 0)
            }
            className="send-button"
          >
            {isLoading ? "⏸️" : "📤"}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {isLoading && (
            <button type="button" onClick={stop} className="stop-button">
              Stop Generation
            </button>
          )}
          {!isLoading && messages.length > 0 && (
            <>
              <button type="button" onClick={reload} className="reload-button">
                Regenerate Last
              </button>
              <button
                type="button"
                onClick={() => setMessages([])}
                className="clear-button"
              >
                Clear Chat
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

// =============================================================================
// Agent Tab Component
// =============================================================================

function AgentTab() {
  const [agentId, setAgentId] = useState("code-assistant");
  const [customInput, setCustomInput] = useState("");

  const {
    execute,
    stream,
    sessionId,
    setSessionId,
    isLoading,
    isStreaming,
    result,
    error,
    clearError,
    abort,
  } = useAgent({
    agentId,

    onResponse: (res) => {
      console.log("Agent response:", res);
    },
    onError: (err) => {
      console.error("Agent error:", err);
      showToast(`Agent error: ${err.message}`);
    },
    onToolCall: (tool) => {
      console.log("Agent using tool:", tool.name);
    },
  });

  const handleExecute = async () => {
    if (!customInput.trim()) return;

    try {
      await execute(customInput, {
        context: {
          language: "typescript",
          framework: "react",
        },
        tools: {
          enabled: ["readFile", "writeFile", "searchFiles"],
          mode: "auto",
        },
      });
    } catch (err) {
      console.error("Execute error:", err);
    }
  };

  const handleStream = async () => {
    if (!customInput.trim()) return;

    try {
      await stream(customInput, {
        onText: (text) => {
          console.log("Streaming text:", text);
        },
        onToolCall: (tool) => {
          console.log("Tool:", tool.name);
        },
        onDone: (res) => {
          console.log("Stream complete:", res);
        },
      });
    } catch (err) {
      console.error("Stream error:", err);
    }
  };

  return (
    <div className="agent-tab">
      <div className="agent-config">
        <h3>Agent Configuration</h3>

        <label>
          Agent ID:
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={isLoading || isStreaming}
          >
            <option value="code-assistant">Code Assistant</option>
            <option value="customer-support">Customer Support</option>
            <option value="research-specialist">Research Specialist</option>
            <option value="content-writer">Content Writer</option>
          </select>
        </label>

        <div className="session-info">
          <label>Session ID:</label>
          <input type="text" value={sessionId || "None"} disabled />
          <button onClick={() => setSessionId(null)}>New Session</button>
        </div>
      </div>

      <div className="agent-input">
        <h3>Input</h3>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Enter your request for the agent..."
          rows={5}
          disabled={isLoading || isStreaming}
        />

        <div className="agent-actions">
          <button
            onClick={handleExecute}
            disabled={isLoading || isStreaming || !customInput.trim()}
          >
            {isLoading ? "Executing..." : "Execute"}
          </button>

          <button
            onClick={handleStream}
            disabled={isLoading || isStreaming || !customInput.trim()}
          >
            {isStreaming ? "Streaming..." : "Stream"}
          </button>

          {(isLoading || isStreaming) && (
            <button onClick={abort} className="abort-button">
              Abort
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-box">
          <h4>Error</h4>
          <p>{error.message}</p>
          <button onClick={clearError}>Clear</button>
        </div>
      )}

      {result && (
        <div className="agent-result">
          <h3>Result</h3>

          <div className="result-content">
            <h4>Response:</h4>
            <pre>{result.content}</pre>
          </div>

          {result.toolsUsed && result.toolsUsed.length > 0 && (
            <div className="tools-used">
              <h4>Tools Used:</h4>
              <ul>
                {result.toolsUsed.map((tool, i) => (
                  <li key={i}>{tool}</li>
                ))}
              </ul>
            </div>
          )}

          {result.toolExecutions && (
            <div className="tool-executions">
              <h4>Tool Executions:</h4>
              {result.toolExecutions.map((exec, i) => (
                <div key={i} className="tool-execution">
                  <strong>{exec.name}</strong>
                  <span className="duration">{exec.duration}ms</span>
                  <details>
                    <summary>Details</summary>
                    <pre>Input: {JSON.stringify(exec.input, null, 2)}</pre>
                    <pre>Output: {JSON.stringify(exec.output, null, 2)}</pre>
                  </details>
                </div>
              ))}
            </div>
          )}

          {result.usage && (
            <div className="usage-stats">
              <h4>Usage:</h4>
              <p>Prompt tokens: {result.usage.promptTokens}</p>
              <p>Completion tokens: {result.usage.completionTokens}</p>
              <p>Total tokens: {result.usage.totalTokens}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Voice Tab Component
// =============================================================================

function VoiceTab() {
  const {
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    submit,
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    response,
    error,
    isSupported,
  } = useVoice({
    voice: "en-US-Neural2-A",
    language: "en-US",
    autoPlay: true,

    onSpeechStart: () => console.log("Speech started"),
    onSpeechEnd: () => console.log("Speech ended"),
    onError: (err) => {
      console.error("Voice error:", err);
      showToast(`Voice error: ${err.message}`);
    },

    api: "/api/voice",
    enableSpeechRecognition: true,
  });

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = async () => {
    if (!transcript) return;

    try {
      await submit(transcript);
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleTestTTS = async () => {
    await speak("Hello! This is a test of the text-to-speech system.");
  };

  if (!isSupported) {
    return (
      <div className="voice-tab">
        <div className="not-supported">
          <h3>Voice Not Supported</h3>
          <p>
            Your browser does not support the Web Speech API. Please use a
            modern browser like Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-tab">
      <div className="voice-controls">
        <h3>Voice Input</h3>

        <button
          onClick={handleVoiceInput}
          disabled={isProcessing || isSpeaking}
          className={`voice-button ${isListening ? "listening" : ""}`}
        >
          {isListening ? (
            <>
              <span className="mic-icon animated">🎤</span>
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <span className="mic-icon">🎤</span>
              <span>Start Listening</span>
            </>
          )}
        </button>

        {transcript && (
          <div className="transcript-box">
            <h4>You said:</h4>
            <p>{transcript}</p>
            <button onClick={handleSubmit} disabled={isProcessing}>
              Submit to AI
            </button>
          </div>
        )}

        {response && (
          <div className="response-box">
            <h4>AI Response:</h4>
            <p>{response}</p>
          </div>
        )}

        {isSpeaking && (
          <div className="speaking-indicator">
            <span className="speaker-icon">🔊</span>
            <span>Speaking...</span>
            <button onClick={stopSpeaking}>Stop</button>
          </div>
        )}

        <div className="voice-status">
          {isListening && (
            <span className="status listening">🎤 Listening</span>
          )}
          {isProcessing && (
            <span className="status processing">⚙️ Processing</span>
          )}
          {isSpeaking && <span className="status speaking">🔊 Speaking</span>}
        </div>

        <div className="test-controls">
          <h4>Test TTS</h4>
          <button onClick={handleTestTTS} disabled={isSpeaking}>
            Test Text-to-Speech
          </button>
        </div>

        {error && (
          <div className="error-box">
            <h4>Error</h4>
            <p>{error.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Tools Tab Component
// =============================================================================

function ToolsTab() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolParams, setToolParams] = useState<Record<string, string>>({});

  const { tools, execute, refresh, isLoading, error } = useTools({
    refreshInterval: 60000, // Auto-refresh every minute
  });

  const handleExecuteTool = async () => {
    if (!selectedTool) return;

    try {
      const result = await execute(selectedTool, toolParams);
      console.log("Tool result:", result);
      showToast("Tool executed successfully");
    } catch (err) {
      console.error("Tool execution error:", err);
      showToast(`Tool execution failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="tools-tab">
      <div className="tools-header">
        <h3>Available Tools ({tools.length})</h3>
        <button onClick={refresh} disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh Tools"}
        </button>
      </div>

      {error && (
        <div className="error-box">
          <p>{error.message}</p>
        </div>
      )}

      {tools.length === 0 && !isLoading && (
        <div className="empty-state">
          <p>No tools available</p>
        </div>
      )}

      <div className="tools-grid">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className={`tool-card ${selectedTool === tool.name ? "selected" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedTool(tool.name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedTool(tool.name);
              }
            }}
          >
            <h4>{tool.name}</h4>
            <p>{tool.description}</p>
            <div className="tool-meta">
              <span className="category">{tool.category || "General"}</span>
              <span className="server">{tool.serverId}</span>
              {tool.requiresConfirmation && (
                <span className="badge">⚠️ Requires Confirmation</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTool && (
        <div className="tool-executor">
          <h4>Execute: {selectedTool}</h4>

          <div className="tool-params">
            <label>
              Parameters (JSON):
              <textarea
                value={JSON.stringify(toolParams, null, 2)}
                onChange={(e) => {
                  try {
                    setToolParams(JSON.parse(e.target.value));
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                rows={5}
              />
            </label>
          </div>

          <button onClick={handleExecuteTool} disabled={isLoading}>
            Execute Tool
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Message Bubble Component
// =============================================================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`message ${message.role}`}>
      <div className="avatar">{isUser ? "👤" : "🤖"}</div>
      <div className="content">
        <div className="text">{message.content}</div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="tool-calls">
            <h5>🔧 Tools Used:</h5>
            {message.toolCalls.map((tool, i) => (
              <details key={i} className="tool-call">
                <summary>{tool.name}</summary>
                <pre>{JSON.stringify(tool.arguments, null, 2)}</pre>
              </details>
            ))}
          </div>
        )}

        {message.metadata?.images && (
          <div className="message-images">
            {(message.metadata.images as string[]).map((url, i) => (
              <img key={i} src={url} alt={`Attachment ${i + 1}`} />
            ))}
          </div>
        )}

        <div className="timestamp">
          {message.createdAt.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function showToast(message: string) {
  // Simple toast notification
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// =============================================================================
// Bootstrap
// =============================================================================

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// =============================================================================
// Styles (CSS-in-JS or external stylesheet)
// =============================================================================

const styles = `
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tabs button.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.messages-container {
  height: 500px;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.message {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.message.user {
  flex-direction: row-reverse;
}

.message .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.message .content {
  max-width: 70%;
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.user .content {
  background: #007bff;
  color: white;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #666;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

.input-form {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  font-size: 14px;
}

.send-button, .attach-button {
  width: 40px;
  height: 40px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
}

.attach-button {
  background: #6c757d;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 8px;
  margin-bottom: 15px;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #333;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.fade-out {
  animation: fadeOut 0.3s;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}
`;

// Inject styles
const styleElement = document.createElement("style");
styleElement.textContent = styles;
document.head.appendChild(styleElement);
