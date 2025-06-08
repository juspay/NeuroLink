# 🖥️ NeuroLink CLI Guide

The NeuroLink CLI provides all SDK functionality through an elegant command-line interface with professional UX features.

## Installation & Usage

### Option 1: NPX (No Installation Required)
```bash
# Use directly without installation
npx @juspay/neurolink --help
npx @juspay/neurolink generate-text "Hello, AI!"
npx @juspay/neurolink status
```

### Option 2: Global Installation
```bash
# Install globally for convenient access
npm install -g @juspay/neurolink

# Then use anywhere
neurolink --help
neurolink generate-text "Write a haiku about programming"
neurolink status --verbose
```

### Option 3: Local Project Usage
```bash
# Add to project and use via npm scripts
npm install @juspay/neurolink
npx neurolink generate-text "Explain TypeScript"
```

## Commands Reference

### `generate-text <prompt>` - Core Text Generation

Generate AI content with customizable parameters.

```bash
# Basic text generation
neurolink generate-text "Explain quantum computing"

# With provider selection
neurolink generate-text "Write a story" --provider openai

# With temperature and token control
neurolink generate-text "Creative writing" --temperature 0.9 --max-tokens 1000

# JSON output for scripting
neurolink generate-text "Summary of AI" --format json
```

**Output Example:**
```
🤖 Generating text...
✅ Text generated successfully!
Quantum computing represents a revolutionary approach to information processing...
ℹ️  127 tokens used
```

### `stream <prompt>` - Real-time Streaming

Stream text generation in real-time for better user experience.

```bash
# Stream text generation in real-time
neurolink stream "Tell me a story about robots"

# With provider selection
neurolink stream "Explain machine learning" --provider vertex --temperature 0.8
```

**Output Example:**
```
🔄 Streaming from auto provider...

Once upon a time, in a world where technology had advanced beyond...
[text streams in real-time as it's generated]
```

### `batch <file>` - Process Multiple Prompts

Process multiple prompts from a file efficiently with progress tracking.

```bash
# Create a file with prompts (one per line)
echo -e "Write a haiku\nExplain gravity\nDescribe the ocean" > prompts.txt

# Process all prompts
neurolink batch prompts.txt

# Save results to JSON file
neurolink batch prompts.txt --output results.json

# Add delay between requests (rate limiting)
neurolink batch prompts.txt --delay 2000
```

**Output Example:**
```
📦 Processing 3 prompts...

✅ 1/3 completed
✅ 2/3 completed
✅ 3/3 completed
✅ Results saved to results.json
```

### `status` - Provider Diagnostics

Check the health and connectivity of all configured AI providers.

```bash
# Check all provider connectivity
neurolink status

# Verbose output with detailed information
neurolink status --verbose
```

**Output Example:**
```
🔍 Checking AI provider status...

✅ openai: ✅ Working (234ms)
✅ bedrock: ✅ Working (456ms)
❌ vertex: ❌ Authentication failed

📊 Summary: 2/3 providers working
```

### `get-best-provider` - Auto-selection Testing

Test which provider would be automatically selected.

```bash
# Test which provider would be auto-selected
neurolink get-best-provider
```

**Output Example:**
```
🎯 Finding best provider...
✅ Best provider: bedrock
```

## Command Options

### Global Options
- `--help, -h` - Show help information
- `--version, -v` - Show version number

### Generation Options
- `--provider <name>` - Choose provider: `auto` (default), `openai`, `bedrock`, `vertex`
- `--temperature <number>` - Creativity level: `0.0` (focused) to `1.0` (creative), default: `0.7`
- `--max-tokens <number>` - Maximum tokens to generate, default: `500`
- `--format <type>` - Output format: `text` (default) or `json`

### Batch Processing Options
- `--output <file>` - Save results to JSON file
- `--delay <ms>` - Delay between requests in milliseconds, default: `1000`

### Status Options
- `--verbose, -v` - Show detailed diagnostic information

## CLI Features

### ✨ Professional UX
- **Animated Spinners**: Beautiful animations during AI generation
- **Colorized Output**: Green ✅ for success, red ❌ for errors, blue ℹ️ for info
- **Progress Tracking**: Real-time progress for batch operations
- **Smart Error Messages**: Helpful hints for common issues

### 🛠️ Developer-Friendly
- **Multiple Output Formats**: Text for humans, JSON for scripts
- **Provider Selection**: Test specific providers or use auto-selection
- **Batch Processing**: Handle multiple prompts efficiently
- **Status Monitoring**: Check provider health and connectivity

### 🔧 Automation Ready
- **Exit Codes**: Standard exit codes for scripting
- **JSON Output**: Structured data for automated workflows
- **Environment Variables**: All SDK environment variables work with CLI
- **Scriptable**: Perfect for CI/CD pipelines and automation

## Usage Examples

### Creative Writing Workflow
```bash
# Generate creative content with high temperature
neurolink generate-text "Write a sci-fi story opening" \
  --provider openai \
  --temperature 0.9 \
  --max-tokens 1000 \
  --format json > story.json

# Check what was generated
cat story.json | jq '.content'
```

### Batch Content Processing
```bash
# Create prompts file
cat > content-prompts.txt << EOF
Write a product description for AI software
Create a social media post about technology
Draft an email about our new features
Write a blog post title about machine learning
EOF

# Process all prompts and save results
neurolink batch content-prompts.txt \
  --output content-results.json \
  --provider bedrock \
  --delay 2000

# Extract just the content
cat content-results.json | jq -r '.[].response'
```

### Provider Health Monitoring
```bash
# Check provider status (useful for monitoring scripts)
neurolink status --format json > status.json

# Parse results in scripts
working_providers=$(cat status.json | jq '[.[] | select(.status == "working")] | length')
echo "Working providers: $working_providers"
```

### Integration with Shell Scripts
```bash
#!/bin/bash
# AI-powered commit message generator

# Get git diff
diff=$(git diff --cached --name-only)

if [ -z "$diff" ]; then
  echo "No staged changes found"
  exit 1
fi

# Generate commit message
commit_msg=$(neurolink generate-text \
  "Generate a concise git commit message for these changes: $diff" \
  --max-tokens 50 \
  --temperature 0.3)

echo "Suggested commit message:"
echo "$commit_msg"

# Optionally auto-commit
read -p "Use this commit message? (y/N): " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git commit -m "$commit_msg"
fi
```

## Environment Setup

The CLI uses the same environment variables as the SDK:

```bash
# Set up your providers (same as SDK)
export OPENAI_API_KEY="sk-your-key"
export AWS_ACCESS_KEY_ID="your-aws-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Test configuration
neurolink status
```

## CLI vs SDK Comparison

| Feature | CLI | SDK |
|---------|-----|-----|
| **Text Generation** | ✅ `generate-text` | ✅ `generateText()` |
| **Streaming** | ✅ `stream` | ✅ `streamText()` |
| **Provider Selection** | ✅ `--provider` flag | ✅ `createProvider()` |
| **Batch Processing** | ✅ `batch` command | ✅ Manual implementation |
| **Status Monitoring** | ✅ `status` command | ✅ Manual testing |
| **JSON Output** | ✅ `--format json` | ✅ Native objects |
| **Automation** | ✅ Perfect for scripts | ✅ Perfect for apps |
| **Learning Curve** | 🟢 Low | 🟡 Medium |

## When to Use CLI vs SDK

### Use the CLI when:
- 🔧 **Prototyping**: Quick testing of prompts and providers
- 📜 **Scripting**: Shell scripts and automation workflows
- 🔍 **Debugging**: Checking provider status and testing connectivity
- 📊 **Batch Processing**: Processing multiple prompts from files
- 🎯 **One-off Tasks**: Generating content without writing code

### Use the SDK when:
- 🏗️ **Application Development**: Building web apps, APIs, or services
- 🔄 **Real-time Integration**: Chat interfaces, streaming responses
- ⚙️ **Complex Logic**: Custom provider fallback, error handling
- 🎨 **UI Integration**: React components, Svelte stores
- 📈 **Production Applications**: Full-featured applications

## Visual Documentation

For CLI screenshots and demonstration videos, see the [Visual Demos Guide](./VISUAL-DEMOS.md#cli-demonstrations).

---

[← Back to Main README](../README.md) | [Next: Framework Integration →](./FRAMEWORK-INTEGRATION.md)
