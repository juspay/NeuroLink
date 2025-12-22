# Model Name Normalization (PC-010)

## Overview

NeuroLink now supports flexible model name input with automatic normalization. You no longer need to remember exact model name formats - use aliases, alternative separators, or even partial names!

## Features

### ✨ Alias Support

Use friendly shortcuts instead of full model names:

```typescript
// OpenAI
"gpt4" → "gpt-4"
"gpt4o" → "gpt-4o"
"chatgpt" → "gpt-3.5-turbo"

// Anthropic
"claude" → "claude-3-5-sonnet-20241022"
"claude-sonnet" → "claude-3-5-sonnet-20241022"
"claude-opus" → "claude-opus-4-5-20251124"

// Google AI
"gemini" → "gemini-2.5-flash"
"gemini-pro" → "gemini-2.5-pro"

// Mistral
"mistral" → "mistral-large-latest"
"codestral" → "codestral-latest"

// Ollama
"llama" → "llama3.2:latest"
```

### 🔄 Separator Normalization

Different separator styles are automatically normalized:

```typescript
// Google AI/Vertex: Hyphens to dots for version numbers
"gemini-1-5-pro" → "gemini-1.5-pro"
"gemini-2-5-flash" → "gemini-2.5-flash"

// OpenAI: Underscores to hyphens
"gpt_4o" → "gpt-4o"

// Azure: Version number format
"gpt-3.5-turbo" → "gpt-35-turbo" (Azure specific)
```

### 🎯 Provider-Specific Validation

#### LiteLLM Auto-Prefix

LiteLLM requires `provider/model` format. The normalizer automatically adds the prefix if missing:

```typescript
// Input
"gpt-4o"

// Normalized (with warning)
"openai/gpt-4o"

// Already prefixed - no change
"anthropic/claude-3-5-sonnet"
```

#### Bedrock Vendor Validation

Bedrock models must include vendor prefix:

```typescript
// Valid formats
"anthropic.claude-3-5-sonnet-20241022-v1:0"
"amazon.nova-pro-v1:0"
"meta.llama4-maverick-17b-instruct-v1:0"
```

#### Ollama Tag Addition

Ollama models automatically get `:latest` tag if not specified:

```typescript
"llama3.2" → "llama3.2:latest"
"llama3.2:7b" → "llama3.2:7b" (tag preserved)
```

## Usage Examples

### SDK Usage

```typescript
import { NeuroLink } from "@juspay/neurolink";

const sdk = new NeuroLink();

// All these work!
await sdk.generate({ 
  provider: "openai", 
  modelName: "gpt4o",  // Normalized to "gpt-4o"
  input: { text: "Hello!" } 
});

await sdk.generate({ 
  provider: "google-ai", 
  modelName: "gemini-1-5-pro",  // Normalized to "gemini-1.5-pro"
  input: { text: "Hello!" } 
});

await sdk.generate({ 
  provider: "anthropic", 
  modelName: "claude",  // Normalized to "claude-3-5-sonnet-20241022"
  input: { text: "Hello!" } 
});
```

### CLI Usage

```bash
# Use aliases
neurolink chat --provider openai --model gpt4o

# Use alternative separators
neurolink chat --provider google-ai --model gemini-1-5-pro

# Use shortcuts
neurolink chat --provider anthropic --model claude
```

### Direct Normalizer Usage

```typescript
import { ModelNameNormalizer } from "@juspay/neurolink";

// Normalize model name
const normalized = ModelNameNormalizer.normalize("gpt4", "openai");
console.log(normalized); // "gpt-4"

// Validate model name
const isValid = ModelNameNormalizer.validate("openai/gpt-4o", "litellm");
console.log(isValid); // true

// Get available aliases
const aliases = ModelNameNormalizer.getAliases("openai");
console.log(aliases);
// { gpt4: "gpt-4", chatgpt: "gpt-3.5-turbo", ... }

// Get suggestions
const suggestions = ModelNameNormalizer.suggestModels("gpt", "openai");
console.log(suggestions);
// ["gpt-4", "gpt-4o", "gpt-3.5-turbo", ...]
```

## Error Messages

When an invalid model name is provided, you'll get helpful error messages:

### LiteLLM Format Error

```
Invalid model name for litellm: "gpt-4o"
LiteLLM requires "provider/model" format (e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet")
```

### Bedrock Vendor Error

```
Invalid model name for bedrock: "invalid-model"
Bedrock requires vendor prefix (e.g., "anthropic.claude-3-5-sonnet-20241022-v1:0", "amazon.nova-pro-v1:0")
```

## Supported Providers

Model name normalization is available for all providers:

- ✅ OpenAI
- ✅ Anthropic
- ✅ Google AI Studio
- ✅ Google Vertex AI
- ✅ Mistral
- ✅ AWS Bedrock
- ✅ Azure OpenAI
- ✅ Ollama
- ✅ LiteLLM
- ✅ HuggingFace
- ✅ AWS SageMaker
- ✅ OpenAI-Compatible

## Benefits

1. **Improved Developer Experience**: Use intuitive aliases instead of memorizing exact formats
2. **Reduced Errors**: Automatic normalization catches common mistakes
3. **Consistent API**: Same flexible input across all providers
4. **Helpful Errors**: Clear messages guide you when something is wrong
5. **Future-Proof**: Easy to add new aliases as models evolve

## Implementation Details

- **Location**: `src/lib/utils/modelNameNormalizer.ts`
- **Integration**: Automatic normalization in `ProviderFactory`
- **Export**: Available from main package: `import { ModelNameNormalizer } from "@juspay/neurolink"`
- **Tests**: 59 comprehensive tests covering all providers

## Backwards Compatibility

✅ **Fully backwards compatible** - All existing model names continue to work exactly as before. The normalizer only adds convenience, it doesn't break anything.

## Future Enhancements

Potential future improvements:

- Add fuzzy matching for typos
- Support for model family shortcuts (e.g., "gpt4-latest")
- Integration with model discovery/listing commands
- Provider-specific alias suggestions in error messages
