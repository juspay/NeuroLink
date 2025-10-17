# Design Doc: Large Context Handling via Direct Tools

## 1. Overview

This document outlines the implemented design for enhancing the `NeuroLink` SDK to handle large documents and complex content processing through **LLM-driven tool selection**. The solution provides **direct MCP tools** that the AI can intelligently choose to use, enabling flexible, tool-based document operations.

This design follows the **DIRECT TOOLS pattern** where tools are registered in the `directTools` server and are immediately available to the LLM for intelligent decision-making.

## 2. Problem Statement

### 2.1 Original Problems

The original `NeuroLink` SDK implementation had **hardcoded file detection patterns** that were inflexible and insufficient for handling diverse document processing scenarios:

1. **Hardcoded Logic**: CLI used regex patterns to detect files, limiting flexibility
2. **Large Document Processing**: No intelligent way to handle documents exceeding token limits
3. **Limited Scenarios**: Could not handle complex use cases like "summarize all files in this directory"
4. **CLI-Specific**: File processing was locked to CLI, not available through SDK
5. **Inflexible**: No way for LLM to decide appropriate processing strategy

**Solution**: Provide LLM-driven tools that enable intelligent document processing decisions.

## 3. Current Implementation

### 3.1. Direct Tools Architecture

The solution provides **two document processing tools** integrated into the `directTools` server:

- **`chunkDocument`**: Intelligently splits large documents into manageable chunks
- **`summarizeChunks`**: Combines multiple text chunks into coherent summaries

**Location**: `src/lib/agent/directTools.ts`

**Integration**: Tools are automatically registered in the `direct` server alongside other core tools like `readFile`, `analyzeCSV`, etc.

### 3.2. Tool Capabilities

#### **`chunkDocument` Tool**

- **Purpose**: Intelligent text chunking with overlap and sentence preservation
- **Features**:
  - Configurable chunk size (default: 100,000 characters)
  - Configurable overlap (default: 2,000 characters)
  - Sentence boundary preservation (default: enabled)
  - Direct file path support
  - Metadata tracking for reconstruction

**Parameters**:

```typescript
{
  filePath: string,              // Path to document file
  chunkSize?: number,            // Default: 100000
  overlap?: number,              // Default: 2000
  preserveSentences?: boolean    // Default: true
}
```

**Returns**:

```typescript
{
  success: boolean,
  filePath: string,
  totalSize: number,
  chunkSize: number,
  overlap: number,
  preserveSentences: boolean,
  chunks: string[],              // Array of text chunks
  chunkCount: number,
  metadata: {
    fileSize: number,
    fileName: string,
    chunksCreated: number,
    averageChunkSize: number,
    sentencePreserved: boolean
  }
}
```

#### **`summarizeChunks` Tool**

- **Purpose**: Combine multiple text chunks into coherent summaries
- **Features**:
  - Multiple summary lengths (brief, detailed, comprehensive)
  - Optional focus areas for targeted summarization
  - Context preservation across chunks
  - Intelligent information synthesis

**Parameters**:

```typescript
{
  chunks: string[],                                    // Array of text chunks
  summaryLength?: "brief" | "detailed" | "comprehensive",  // Default: "detailed"
  focusAreas?: string[]                                // Optional focus areas
}
```

**Returns**:

```typescript
{
  success: boolean,
  chunkCount: number,
  totalWords: number,
  totalChars: number,
  summaryLength: string,
  focusAreas: string[],
  overallSummary: string,        // Combined summary
  chunkSummaries: Array<{        // Individual chunk summaries
    chunkIndex: number,
    wordCount: number,
    charCount: number,
    preview: string,
    keyPoints: string[]
  }>,
  metadata: {
    averageWordsPerChunk: number,
    averageCharsPerChunk: number,
    processingTime: string,
    hasFocusAreas: boolean,
    focusAreasCount: number
  }
}
```

### 3.3. Intelligent Chunking Algorithm

The chunking logic intelligently divides large text while preserving context and sentence boundaries:

```typescript
// Sentence-preserving chunking
while (currentIndex < content.length) {
  const remainingText = content.substring(currentIndex);
  let endIndex = Math.min(chunkSize, remainingText.length);

  if (preserveSentences) {
    const potentialSplitArea = remainingText.substring(0, endIndex);

    // 1. Look for sentence endings (., !, ?)
    for (const boundary of [".", "!", "?"]) {
      const pos = potentialSplitArea.lastIndexOf(boundary);
      if (pos > splitPosition) {
        splitPosition = pos;
      }
    }

    // 2. Fall back to space if no sentence boundary found
    if (splitPosition === endIndex - 1) {
      const spacePos = potentialSplitArea.lastIndexOf(" ");
      if (spacePos !== -1) {
        splitPosition = spacePos;
      }
    }
  }

  // Create chunk and move forward with overlap
  endIndex = splitPosition + 1;
  const chunkContent = remainingText.substring(0, endIndex);
  chunks.push({ content: chunkContent, index: chunks.length });

  currentIndex += Math.max(1, endIndex - overlap);
}
```

**Key Features**:

- **Boundary Preservation**: Prioritizes sentence and word boundaries
- **Context Overlap**: Maintains context between chunks (default 2000 chars)
- **Fallback Logic**: Handles edge cases like very long words
- **No External Dependencies**: Self-contained implementation

### 3.4. Enhanced `readFile` Tool Integration

The existing `readFile` tool has been enhanced with intelligent file size handling:

**Size-Based Processing Strategies**:

- ≤50KB (Tiny): Direct read
- 50KB-200KB (Small): Buffered read
- 200KB-1MB (Medium): Streaming read
- 1MB-10MB (Large): Preview mode (10KB sample)
- \>10MB: Recommendation to use `chunkDocument`

**Intelligent Recommendations**:

```typescript
if (fileSize > FILE_SIZE_LIMITS.MEDIUM_FILE) {
  recommendation =
    "File is medium-sized. For comprehensive analysis, use chunkDocument tool...";
  suggestedTools = ["chunkDocument", "summarizeChunks"];
}
```

## 4. LLM-Driven Workflow

### 4.1. High-Level Flow

```mermaid
graph TD
    A[User Request: "Analyze large document"] --> B[LLM receives request + available tools];
    B --> C{LLM analyzes context};
    C --> D[LLM chooses appropriate tools];
    D --> E[Tool 1: readFile to check file size];
    E --> F{File > 200KB?};
    F -->|Yes| G[Tool 2: chunkDocument to split content];
    F -->|No| H[Process directly];
    G --> I[Tool 3: summarizeChunks if needed];
    I --> J[LLM synthesizes final response];
    H --> J;
    J --> K[Return intelligent response to user];
```

### 4.2. Example Usage Scenarios

#### Scenario 1: Small File (Direct Processing)

```
User: "What's in this file?"
LLM: *calls readFile()*
Tool: *returns full content (file is 50KB)*
LLM: "This file contains: [full analysis]"
```

#### Scenario 2: Large File (Chunked Processing)

```
User: "Summarize this large document"
LLM: *calls readFile()*
Tool: *returns preview + recommendation to use chunkDocument*
LLM: *calls chunkDocument()*
Tool: *returns 10 chunks*
LLM: *calls summarizeChunks()*
Tool: *returns comprehensive summary*
LLM: "Here's a summary: [concise analysis]"
```

#### Scenario 3: Focused Analysis

```
User: "What are the technical details in this document?"
LLM: *calls chunkDocument()*
Tool: *returns chunks*
LLM: *calls summarizeChunks with focusAreas: ["technical details"]*
Tool: *returns focused summary*
LLM: "Technical details: [targeted analysis]"
```

## 5. Integration with NeuroLink

### 5.1. Tool Registration

Tools are automatically registered in the `directTools` server:

```typescript
// src/lib/mcp/servers/agent/directToolsServer.ts
import { directAgentTools } from "../../agent/directTools.js";

export const directToolsServer = createMCPServer({
  id: "neurolink-direct",
  title: "NeuroLink Direct Tools",
  description:
    "Core tools for file operations, calculations, and document processing",
  category: "built-in",
  tools: directAgentTools, // Includes chunkDocument and summarizeChunks
});
```

### 5.2. Tool Discovery

Tools are automatically discovered through the standard tool discovery mechanism:

```typescript
// In NeuroLink.getAllAvailableTools()
const allTools = await this.toolRegistry.listTools();
// Returns all tools including chunkDocument and summarizeChunks
```

### 5.3. Usage in SDK

No special configuration required - tools are automatically available:

```typescript
const neurolink = new NeuroLink();

const result = await neurolink.generate({
  input: { text: "Analyze this large document at /path/to/file.txt" },
  provider: "auto",
  disableTools: false, // Ensures tools are available
});

// LLM automatically:
// 1. Reads file with readFile
// 2. Chunks with chunkDocument if needed
// 3. Summarizes with summarizeChunks if needed
// 4. Returns intelligent analysis
```

## 6. Benefits Achieved

### 6.1. Architectural Benefits

- ✅ **No Hardcoded Logic**: Completely removed CLI file detection patterns
- ✅ **LLM-Driven Decisions**: AI chooses appropriate tools based on context
- ✅ **SDK Integration**: Available programmatically, not CLI-locked
- ✅ **Simple Architecture**: Tools in single location (`directTools.ts`)
- ✅ **Extensibility**: Easy to add new document processing capabilities
- ✅ **No Redundancy**: Clean, maintainable codebase

### 6.2. User Experience Benefits

- 🚀 **Flexibility**: Handles diverse document processing scenarios
- 🚀 **Intelligence**: Context-aware processing decisions
- 🚀 **Robustness**: Comprehensive error handling and validation
- 🚀 **Efficiency**: Sentence-preserving chunking maintains context
- 🚀 **Future-Proof**: Extensible architecture for new capabilities

### 6.3. Technical Benefits

- ⚡ **Performance**: Streaming reads for large files
- ⚡ **Memory Safety**: Preview mode for very large files
- ⚡ **Context Preservation**: Overlap and sentence boundaries
- ⚡ **Metadata Rich**: Detailed information for debugging

## 7. Testing and Validation

### 7.1. Verified Functionality

✅ **Tool Discovery**: Both tools appear in `getAllAvailableTools()`
✅ **Tool Execution**: LLM successfully calls both tools
✅ **Chunking**: Sentence-preserving logic works correctly
✅ **Summarization**: Focus areas and summary lengths work
✅ **Integration**: Works with all AI providers
✅ **Error Handling**: Graceful failures with clear messages

## 8. Future Enhancements

Potential future improvements:

1. **Additional Chunking Strategies**: Paragraph-based, semantic-based
2. **Multi-format Support**: PDF, DOCX extraction before chunking
3. **Parallel Processing**: Process multiple chunks concurrently
4. **Caching**: Cache chunk results for repeated queries
5. **Streaming Summaries**: Stream summary generation for very large documents

## 9. Conclusion

The current implementation successfully provides LLM-driven document processing through two well-integrated tools in the `directTools` server. The architecture is simple, maintainable, and extensible, enabling intelligent handling of large documents without hardcoded logic.

**Key Achievement**: Transformed NeuroLink from a hardcoded file processing system to an intelligent, tool-based document processing platform that follows industry best practices for AI tool integration.
