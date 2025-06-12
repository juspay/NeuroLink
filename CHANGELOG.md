# @juspay/neurolink

## 1.5.1

### Patch Changes

- **🔧 Critical CLI Dependency Fix**: Removed peer dependencies to ensure zero-friction CLI usage
  - **Issue**: CLI commands failed when provider-specific SDK packages were peer dependencies
  - **Root Cause**: `npx` doesn't install peer dependencies, causing missing module errors
  - **Solution**: Moved ALL AI provider SDKs to regular dependencies
  - **Impact**: **100% reliable CLI** - all providers work immediately with `npx @juspay/neurolink`
  - **Dependencies**: All AI SDK packages now bundled automatically (@ai-sdk/openai, @ai-sdk/bedrock, @ai-sdk/vertex, @ai-sdk/google)

- **📄 Critical Legal Compliance**: Added missing MIT LICENSE file
  - **Issue**: Package claimed MIT license but had no LICENSE file in repository
  - **Legal Risk**: Without explicit license file, users had no legal permission to use the software
  - **Solution**: Added proper MIT License file with Juspay Technologies copyright (2025)
  - **Impact**: **Full legal compliance** - users now have explicit permission to use, modify, and distribute
  - **Files**: Added `LICENSE` file with standard MIT license text

### Technical Changes

- **Dependency Structure**: Eliminated peer dependencies entirely for CLI compatibility
- **Provider Support**: All 5 AI providers (OpenAI, Bedrock, Vertex AI, Google AI Studio, Anthropic) now work out-of-the-box
- **Zero Setup**: No manual dependency installation required for any provider
- **Repository Structure**: LICENSE file now included in package distribution
- **Legal Clarity**: Explicit copyright and permission statements
- **Compliance**: Matches industry standards for open source software licensing
- **Package Files**: LICENSE included in NPM package distribution
- **Backward Compatibility**: 100% compatible with existing code and configurations

## 1.5.0

### Major Changes

- **🧠 Google AI Studio Integration**: Added Google AI Studio as 5th AI provider with Gemini models
  - **🔧 New Provider**: Complete GoogleAIStudio provider with Gemini 1.5/2.0 Flash/Pro models
  - **🆓 Free Tier Access**: Leverage Google's generous free tier for development and testing
  - **🖥️ CLI Support**: Full `--provider google-ai` integration across all commands
  - **⚡ Auto-Selection**: Included in automatic provider selection algorithm
  - **🔑 Simple Setup**: Single `GOOGLE_AI_API_KEY` environment variable configuration

### Features

- **📚 Documentation Architecture Overhaul**: Complete README.md restructuring for better UX
  - **75% Size Reduction**: Transformed from 800+ lines to ~200 lines focused on quick start
  - **Progressive Disclosure**: Clear path from basic → intermediate → advanced documentation
  - **Specialized Documentation**: Created 4 dedicated docs files for different audiences
  - **Cross-References**: Complete navigation system between all documentation files

### New Documentation Structure

```
docs/
├── AI-ANALYSIS-TOOLS.md          # AI optimization and analysis tools
├── AI-WORKFLOW-TOOLS.md          # Development lifecycle tools
├── MCP-FOUNDATION.md             # Technical MCP architecture
└── GOOGLE-AI-STUDIO-INTEGRATION-ARCHIVE.md  # Integration details
```

### Google AI Studio Provider

```typescript
// New Google AI Studio usage
import { createBestAIProvider } from '@juspay/neurolink';

const provider = createBestAIProvider(); // Auto-includes Google AI Studio
const result = await provider.generateText("Hello, Gemini!");
```

```bash
# Quick setup with Google AI Studio (free tier)
export GOOGLE_AI_API_KEY="AIza-your-google-ai-key"
npx @juspay/neurolink generate-text "Hello, AI!" --provider google-ai
```

### Enhanced Visual Content

- **Google AI Studio Demos**: Complete visual documentation for new provider
- **CLI Demonstrations**: Updated CLI videos showing google-ai provider
- **Professional Quality**: 6 new videos and asciinema recordings

### Technical Implementation

- **Provider Integration**: `src/lib/providers/googleAIStudio.ts`
- **Models Supported**: Gemini 1.5 Pro/Flash, Gemini 2.0 Flash/Pro
- **Authentication**: Simple API key authentication via Google AI Studio
- **Testing**: Complete test coverage including provider and CLI tests

### Bug Fixes

- **🔧 CLI Dependencies**: Moved essential dependencies (`ai`, `zod`) from peer to regular dependencies
  - **Issue**: `npx @juspay/neurolink` commands failed due to missing dependencies
  - **Solution**: CLI now works out-of-the-box without manual dependency installation
  - **Impact**: Zero-friction CLI usage for all users

### Breaking Changes

- None - 100% backward compatibility maintained

## 1.4.0

### Major Changes

- **📚 MCP Documentation Master Plan**: Complete external server connectivity documentation
  - **🔧 MCP Integration Guide**: 400+ line comprehensive setup and usage guide
  - **📖 CLI Documentation**: Complete MCP commands section with workflows
  - **🧪 Demo Integration**: 5 MCP API endpoints for testing and demonstration
  - **⚙️ Configuration Templates**: .env.example and .mcp-servers.example.json
  - **📋 API Reference**: Complete MCP API documentation with examples

### Features

- **External Server Connectivity**: Full MCP (Model Context Protocol) support
- **65+ Compatible Servers**: Filesystem, GitHub, databases, web browsing, search
- **Professional CLI**: Complete server lifecycle management
- **Demo Server Integration**: Live MCP API endpoints
- **Configuration Management**: Templates and examples for all deployment scenarios

### MCP Server Support

```bash
# Install and manage external servers
neurolink mcp install filesystem
neurolink mcp install github
neurolink mcp test filesystem
neurolink mcp list --status
neurolink mcp execute filesystem read_file --path="/path/to/file"
```

### MCP API Endpoints

```typescript
// Demo server includes 5 MCP endpoints
GET  /api/mcp/servers          # List configured servers
POST /api/mcp/test/:server     # Test server connectivity
GET  /api/mcp/tools/:server    # Get available tools
POST /api/mcp/execute          # Execute MCP tools
POST /api/mcp/install/:server  # Install new servers
```

### Documentation Updates

- **README.md**: Complete MCP section with real-world examples
- **docs/MCP-INTEGRATION.md**: 400+ line comprehensive MCP guide
- **docs/CLI-GUIDE.md**: MCP commands section with workflow examples
- **docs/API-REFERENCE.md**: Complete MCP API documentation
- **docs/README.md**: Updated documentation index with MCP references

### Configuration

- **.env.example**: MCP environment variables section
- **.mcp-servers.example.json**: Complete server configuration template
- **package.json**: Updated description highlighting MCP capabilities

### Breaking Changes

- None - 100% backward compatibility maintained

## 1.3.0

### Major Changes

- **🎉 MCP Foundation (Model Context Protocol)**: NeuroLink transforms from AI SDK to Universal AI Development Platform
  - **🏭 MCP Server Factory**: Lighthouse-compatible server creation with `createMCPServer()`
  - **🧠 Context Management**: Rich context with 15+ fields + tool chain tracking
  - **📋 Tool Registry**: Discovery, registration, execution + statistics
  - **🎼 Tool Orchestration**: Single tools + sequential pipelines + error handling
  - **🤖 AI Provider Integration**: Core AI tools with schema validation
  - **🔗 Integration Tests**: 27/27 tests passing (100% success rate)

### Features

- **Factory-First Architecture**: MCP tools work internally, users see simple factory methods
- **Lighthouse Compatible**: 99% compatible with existing Lighthouse MCP patterns
- **Enterprise Ready**: Rich context, permissions, tool orchestration, analytics
- **Production Tested**: <1ms tool execution, comprehensive error handling

### Performance

- **Test Execution**: 1.23s for 27 comprehensive tests
- **Tool Execution**: 0-11ms per tool (well under 100ms target)
- **Pipeline Performance**: 22ms for 2-step sequential pipeline
- **Memory Efficiency**: Clean context management with automatic cleanup

### Technical Implementation

```typescript
src/lib/mcp/
├── factory.ts                  # createMCPServer() - Lighthouse compatible
├── context-manager.ts          # Rich context (15+ fields) + tool chain tracking
├── registry.ts                 # Tool discovery, registration, execution + statistics
├── orchestrator.ts             # Single tools + sequential pipelines + error handling
└── servers/ai-providers/       # AI Core Server with 3 tools integrated
    └── ai-core-server.ts       # generate-text, select-provider, check-provider-status
```

### Breaking Changes

- None - 100% backward compatibility maintained

## 1.2.4

### Patch Changes

- 95d8ee6: Set up automated version bumping and publishing workflow with changesets integration
