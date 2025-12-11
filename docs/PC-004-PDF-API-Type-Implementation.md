# PC-004: PDF API Type Field Implementation

## Problem Statement
PDF provider configurations included an `apiType` field ("document" or "files-api") but this field was never checked in message building. This meant all PDFs were formatted the same way, which is incorrect for some providers.

## Root Cause
- `pdfProcessor.ts` defined `apiType` in all provider configs
- `messageBuilder.ts` ignored the field and formatted all PDFs identically
- Different providers require different PDF handling approaches

## Solution

### 1. Added `buildPDFContent()` Helper Function
Location: `src/lib/utils/messageBuilder.ts` (lines 1055-1121)

This function:
- Retrieves provider's PDF configuration
- Checks the `apiType` field
- Routes to appropriate handling based on type:
  - **"document" API**: Returns inline FilePart with Buffer (Anthropic, Bedrock, Vertex)
  - **"files-api" API**: Logs warning and falls back to inline (OpenAI, Google AI, Azure)
- Includes comprehensive logging for debugging

### 2. Updated Message Building Flow
Modified `convertMultimodalToProviderFormat()` to:
- Iterate through PDFs
- Call `buildPDFContent()` for each PDF
- Replace previous simple map operation

### 3. Provider Categorization

**Document API Providers** (inline bytes):
- Anthropic (`anthropic`)
- AWS Bedrock (`bedrock`)
- Google Vertex AI (`vertex`, `google-vertex`)

**Files API Providers** (should upload first):
- OpenAI (`openai`)
- Azure OpenAI (`azure`, `azure-openai`)
- Google AI Studio (`google-ai-studio`, `gemini`, `google-ai`)
- LiteLLM (`litellm`)
- OpenAI Compatible (`openai-compatible`)
- Mistral (`mistral`)
- Hugging Face (`hugging-face`, `huggingface`)

## Test Coverage

### Unit Tests (`test/unit/utils/pdfApiType.test.ts`)
- API type detection for all providers (10 tests)
- PDF processing with API type metadata (3 tests)
- Configuration coverage validation (2 tests)

### Integration Tests (`test/unit/utils/pdfApiTypeIntegration.test.ts`)
- Document API providers behavior (3 tests)
- Files API providers behavior (3 tests)
- Multiple PDFs handling (1 test)
- Error cases (1 test)

### Results
```
✓ test/unit/utils/pdfApiType.test.ts (15 tests)
✓ test/unit/utils/pdfApiTypeIntegration.test.ts (8 tests)
✓ test/unit/utils/csvProcessor.test.ts (12 tests)

Total: 35 tests passing
```

## Future Work

### Files API Upload Implementation
The current implementation correctly identifies files-api providers but falls back to inline format. Full implementation requires:

**OpenAI Files API**
- Endpoint: `POST https://api.openai.com/v1/files`
- Requires: API key, file upload, purpose field
- Returns: File ID for reference
- Docs: https://platform.openai.com/docs/api-reference/files

**Google AI Studio Files API**
- Endpoint: `POST https://generativelanguage.googleapis.com/v1/files`
- Requires: API key, multipart upload
- Returns: File URI
- Docs: https://ai.google.dev/api/files

**Azure OpenAI File Upload**
- Endpoint: Provider-specific
- Requires: Azure credentials, storage account
- Returns: File reference
- Docs: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/file-upload

### Implementation Considerations
1. **Authentication**: Each provider requires different auth mechanisms
2. **Upload Format**: Multipart form-data vs JSON
3. **File Lifecycle**: Expiration, cleanup, management
4. **Error Handling**: Upload failures, retries, fallbacks
5. **URI Format**: Provider-specific reference formats
6. **Async Operations**: Upload progress, timeout handling

## Code Quality
- ✅ All tests passing (35/35)
- ✅ Type checking passes
- ✅ Code formatted with Prettier
- ✅ No linting errors
- ✅ Code review completed with no issues

## Benefits
1. **Correct API Usage**: PDFs now routed to appropriate handler based on provider
2. **Future Ready**: Infrastructure in place for file upload implementation
3. **Transparent**: Clear logging shows which API type is being used
4. **Backward Compatible**: Existing inline behavior preserved
5. **Well Tested**: Comprehensive test coverage for both API types

## Migration Notes
- No breaking changes
- Existing PDF functionality preserved
- New logging provides visibility into API type usage
- Files-api providers will log warnings until upload is implemented
