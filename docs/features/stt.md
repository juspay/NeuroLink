---
title: Speech-to-Text (STT) Integration Guide
description: Complete guide to NeuroLink's STT capabilities for transcribing audio files using Google Cloud Speech-to-Text v1
keywords: stt, speech-to-text, transcription, audio, google cloud stt, audio transcription
---

## Overview

NeuroLink provides integrated Speech-to-Text (STT) capabilities, allowing you to transcribe audio files to text using Google Cloud Speech-to-Text v1 API. This feature automatically processes audio files alongside your prompts, with intelligent fallback to OpenAI Whisper when available.

**Key Features:**

- **Google Cloud STT v1 integration** - Production-grade transcription service
- **Multiple STT models** - Optimized for different use cases (short/long-form, commands)
- **Automatic format detection** - Supports MP3, WAV, FLAC, OGG, WebM, AMR
- **Stereo-to-mono conversion** - Automatic WAV conversion for Google STT requirements
- **Two transcription modes** - Direct transcription OR AI-powered analysis
- **Intelligent fallback** - Automatically falls back to other providers if available
- **Seamless integration** - Works with generic `--file` flag, auto-detects audio files

---

## Quick Start

### Installation

STT support is built into NeuroLink. No additional installation required.

### Environment Setup

STT requires Google Cloud service account credentials:

```bash
# Required: Service account credentials (API keys NOT supported by STT v1)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

**Important:** Speech-to-Text v1 requires service account authentication. API keys are NOT supported.

**Required IAM Permissions:**

The service account needs one of these roles:

- `roles/speech.client` (recommended - minimum required permissions)
- `roles/speech.admin` (broader permissions)

### Basic Usage

**CLI:**

```bash
# Transcribe and let AI summarize
neurolink generate "Summarize this meeting" \
  --file meeting.mp3 \
  --provider google-ai

# Direct transcription (no AI processing)
neurolink generate "" \
  --file audio.wav \
  --stt-direct \
  --provider google-ai

# Specify language and model
neurolink generate "What did they discuss?" \
  --file interview.mp3 \
  --stt-language hi-IN \
  --stt-model latest_long \
  --provider google-ai

# Stream AI analysis
neurolink stream "Analyze this recording" \
  --file meeting.mp3 \
  --stt-language en-IN \
  --provider google-ai
```

**SDK:**

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

// Transcribe and AI-process
const result = await neurolink.generate({
  input: {
    text: "Summarize the key points from this recording",
    files: ["meeting.mp3"],
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-IN",
    model: "default",
  },
});

console.log(result.content); // AI-generated summary

// Stream AI analysis of transcribed audio
const result = await neurolink.stream({
  input: {
    text: "Analyze this recording",
    files: ["meeting.mp3"],
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-IN",
  },
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

---

## Supported Providers

STT is available through Google Cloud Speech-to-Text v1:

| Provider      | Authentication                                     | Models | Notes                              |
| ------------- | -------------------------------------------------- | ------ | ---------------------------------- |
| **google-ai** | Service Account (`GOOGLE_APPLICATION_CREDENTIALS`) | 4      | Same credentials as Gemini models  |
| **vertex**    | Service Account (`GOOGLE_APPLICATION_CREDENTIALS`) | 4      | Reuses existing Vertex credentials |

**Automatic Fallback:**

- If Google Cloud credentials are not available, NeuroLink automatically falls back to OpenAI Whisper (if `OPENAI_API_KEY` is set)
- If neither is available, audio files are processed for metadata only

---

## STT Models

Google Cloud Speech-to-Text v1 offers 4 models optimized for different use cases:

| Model                  | Description                   | Best For                                    |
| ---------------------- | ----------------------------- | ------------------------------------------- |
| **default**            | General-purpose model         | Default, Mixed content, unsure about length |
| **latest_long**        | Optimized for long-form audio | Meetings, interviews, podcasts              |
| **latest_short**       | Optimized for short audio     | Commands, queries (< 1 minute)              |
| **command_and_search** | Optimized for voice commands  | Voice assistants, search queries            |

**Model Selection Guidelines:**

```typescript
// For meetings, interviews, podcasts (> 1 minute)
sttOptions: {
  model: "latest_long";
}

// For voice commands, search queries (< 1 minute)
sttOptions: {
  model: "latest_short";
}

// For general purpose or mixed content
sttOptions: {
  model: "default";
}

// For voice assistant commands
sttOptions: {
  model: "command_and_search";
}
```

---

## Audio Format Support

NeuroLink automatically detects and processes various audio formats:

| Format   | Extension | Encoding       | Notes                                     |
| -------- | --------- | -------------- | ----------------------------------------- |
| **MP3**  | .mp3      | MPEG Layer 3   | Most common, good balance of size/quality |
| **WAV**  | .wav      | LINEAR16 (PCM) | Highest quality, auto-converts stereo     |
| **FLAC** | .flac     | FLAC           | Lossless compression                      |
| **OGG**  | .ogg      | OGG_OPUS       | Web streaming                             |
| **WebM** | .webm     | WEBM_OPUS      | Video audio extraction                    |
| **AMR**  | .amr      | AMR/AMR_WB     | Mobile recordings                         |

**Automatic Processing:**

- **File type detection**: Uses magic bytes, MIME type, and extension
- **Stereo-to-mono conversion**: Automatically converts stereo WAV files to mono (Google STT v1 requirement)
- **Format validation**: Ensures audio is within size limits (10MB for inline recognition)

---

## STT Configuration

### Language Support

Google Cloud STT v1 supports 125+ languages and variants. Our default is `en-IN`. Common examples:

**English Variants:**

- `en-US` - United States English
- `en-GB` - British English
- `en-IN` - Indian English (default)
- `en-AU` - Australian English

**Other Languages:**

- `hi-IN` - Hindi (India)
- `es-ES` - Spanish (Spain)
- `es-US` - Spanish (United States)
- `fr-FR` - French (France)
- `de-DE` - German (Germany)
- `ja-JP` - Japanese
- `zh-CN` - Chinese (Simplified)
- `pt-BR` - Portuguese (Brazil)
- `it-IT` - Italian
- `ko-KR` - Korean
- `ru-RU` - Russian

**Full language list:** [Google Cloud STT Languages](https://cloud.google.com/speech-to-text/docs/languages)

### Configuration Options

```typescript
export type STTOptions = {
  /** Language code (BCP-47 format, default: "en-IN") */
  language?: string;

  /** STT model (default: "default") */
  model?: "default" | "latest_long" | "latest_short" | "command_and_search";

  /** Enable automatic punctuation (default: true) */
  enableAutomaticPunctuation?: boolean;

  /** Filter profanity in transcript (default: false) */
  profanityFilter?: boolean;

  /** Sample rate in Hz (optional, auto-detected if not provided) */
  sampleRateHertz?: number;

  /** Use AI to process transcribed text (default: true) */
  useAIResponse?: boolean;
};
```

---

## Transcription Modes

NeuroLink supports two STT modes:

### Mode 1: AI-Powered Analysis (Default)

Transcribes audio, then uses AI to analyze/summarize the content.

```typescript
// SDK
const result = await neurolink.generate({
  input: {
    text: "What are the main discussion points?",
    files: ["meeting.mp3"],
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-IN",
    useAIResponse: true, // default
  },
});

console.log(result.content); // AI analysis of transcript
```

```bash
# CLI
neurolink generate "Summarize the key points" \
  --file meeting.mp3 \
  --stt-language en-IN \
  --provider google-ai
```

**Use Cases:**

- Meeting summaries
- Interview insights
- Podcast analysis
- Content extraction

### Mode 2: Direct Transcription

Returns raw transcript without AI processing.

```typescript
// SDK
const result = await neurolink.generate({
  input: {
    text: "", // Can be empty in direct mode
    files: ["audio.wav"],
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-US",
    useAIResponse: false, // Direct transcription
  },
});

console.log(result.content); // Raw transcript text
```

```bash
# CLI
neurolink generate "" \
  --file audio.wav \
  --stt-direct \
  --stt-language en-US \
  --provider google-ai
```

**Use Cases:**

- Raw transcription for external processing
- Subtitle generation
- Transcript archives
- Data collection

---

## Complete Configuration Reference

### SDK Configuration

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

const result = await neurolink.generate({
  input: {
    text: "Your prompt here",
    files: ["audio.mp3"], // Auto-detects as audio
  },
  provider: "google-ai", // or "vertex"
  sttOptions: {
    language: "en-IN", // Language code
    model: "latest_long", // STT model
    enableAutomaticPunctuation: true, // Add punctuation
    profanityFilter: false, // Filter profanity
    sampleRateHertz: 16000, // Optional: sample rate
    useAIResponse: true, // AI processing mode
  },
});

console.log(result.content);
console.log(result.provider); // "google-cloud-stt" for direct mode
```

**Streaming with STT:**

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

// Stream AI analysis of transcribed audio
const result = await neurolink.stream({
  input: {
    text: "Analyze and summarize this recording in real-time",
    files: ["meeting.mp3"], // Auto-detects as audio
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-IN",
    model: "latest_long",
    enableAutomaticPunctuation: true,
  },
});

// Process streaming response
console.log("Streaming AI analysis:\n");
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
console.log("\n\nStream complete!");
```

### CLI Flags

```bash
neurolink generate "Your prompt" \
  --file <audio-file> \
  --provider google-ai \
  --stt-language <code> \
  --stt-model <model> \
  --stt-punctuation \
  --stt-filter \
  --stt-direct
```

**Available CLI Flags:**

| Flag                | Type    | Default     | Description                                  |
| ------------------- | ------- | ----------- | -------------------------------------------- |
| `--file`            | string  | -           | Audio file path (can be used multiple times) |
| `--stt-language`    | string  | `"en-IN"`   | Language code (BCP-47 format)                |
| `--stt-model`       | string  | `"default"` | STT model to use                             |
| `--stt-punctuation` | boolean | `true`      | Enable automatic punctuation                 |
| `--stt-filter`      | boolean | `false`     | Enable profanity filter                      |
| `--stt-direct`      | boolean | `false`     | Direct mode (useAIResponse: false)           |

---

## Use Cases & Examples

### 1. Meeting Transcription & Summary

Transcribe a meeting recording and generate an AI summary:

```typescript
const meetingSummary = await neurolink.generate({
  input: {
    text: "Provide a structured summary with: 1) Key decisions, 2) Action items, 3) Next steps",
    files: ["meeting.mp3"],
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-IN",
    model: "latest_long",
    enableAutomaticPunctuation: true,
  },
});

console.log(meetingSummary.content);
```

**CLI:**

```bash
neurolink generate "Summarize this meeting with action items" \
  --file team-meeting.mp3 \
  --stt-language en-IN \
  --stt-model latest_long \
  --provider google-ai
```

### 2. Interview Insights

Extract insights from interview recordings:

```typescript
const insights = await neurolink.generate({
  input: {
    text: "Analyze the interview and extract: candidate strengths, areas of concern, and hiring recommendation",
    files: ["interview.wav"],
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-US",
    model: "latest_long",
  },
});
```

### 3. Voice Command Processing

Process short voice commands:

```typescript
const command = await neurolink.generate({
  input: {
    text: "Parse the voice command and return the intent",
    files: ["command.wav"],
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-US",
    model: "command_and_search",
  },
});
```

### 4. Multi-Language Transcription

Transcribe audio in different languages:

```bash
# Hindi transcription
neurolink generate "Summarize in English" \
  --file hindi-audio.mp3 \
  --stt-language hi-IN \
  --stt-model default \
  --provider google-ai

# Spanish transcription
neurolink generate "Translate and summarize" \
  --file spanish-interview.wav \
  --stt-language es-ES \
  --stt-model latest_long \
  --provider google-ai
```

### 5. Direct Transcription for Subtitles

Generate raw transcripts for subtitle creation:

```typescript
const transcript = await neurolink.generate({
  input: {
    files: ["video-audio.mp3"],
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-US",
    enableAutomaticPunctuation: true,
    useAIResponse: false, // Direct mode
  },
});

// Save transcript
import { writeFileSync } from "fs";
writeFileSync("subtitles.txt", transcript.content);
```

### 6. Batch Audio Processing

Process multiple audio files:

```typescript
async function transcribeBatch(
  audioFiles: string[],
  language: string = "en-IN",
) {
  const results = [];

  for (const file of audioFiles) {
    const result = await neurolink.generate({
      input: {
        text: "Extract key points",
        files: [file],
      },
      provider: "google-ai",
      sttOptions: {
        language,
        model: "default",
      },
    });

    results.push({
      file,
      summary: result.content,
    });

    console.log(`Processed: ${file}`);
  }

  return results;
}

// Usage
const summaries = await transcribeBatch(
  ["meeting-1.mp3", "meeting-2.mp3", "meeting-3.mp3"],
  "en-IN",
);
```

### 7. Mixed File Types

Process audio alongside other file types:

```typescript
const analysis = await neurolink.generate({
  input: {
    text: "Compare the audio discussion with the written proposal",
    files: [
      "discussion.mp3", // Auto-detected as audio → transcribed
      "proposal.pdf", // Auto-detected as PDF → extracted
    ],
  },
  provider: "google-ai",
  sttOptions: {
    language: "en-IN",
  },
});
```

---

## Error Handling

### Common Error Patterns

```typescript
async function transcribeWithErrorHandling(audioFile: string) {
  try {
    const result = await neurolink.generate({
      input: {
        text: "Transcribe this",
        files: [audioFile],
      },
      provider: "google-ai",
      sttOptions: {
        language: "en-IN",
      },
    });

    return { success: true, content: result.content };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle specific errors
    if (errorMessage.includes("GOOGLE_APPLICATION_CREDENTIALS")) {
      console.error("Missing Google Cloud credentials");
      console.error("Set GOOGLE_APPLICATION_CREDENTIALS environment variable");
      return { success: false, error: "Missing credentials" };
    }

    if (errorMessage.includes("Audio file too large")) {
      console.error("Audio file exceeds 10MB limit for inline recognition");
      return { success: false, error: "File too large" };
    }

    if (errorMessage.includes("Invalid language code")) {
      console.error(
        "Invalid language code. Use BCP-47 format (e.g., en-US, hi-IN)",
      );
      return { success: false, error: "Invalid language" };
    }

    if (errorMessage.includes("Invalid STT model")) {
      console.error(
        "Invalid model. Use: default, latest_long, latest_short, command_and_search",
      );
      return { success: false, error: "Invalid model" };
    }

    console.error("Transcription failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Usage
const result = await transcribeWithErrorHandling("meeting.mp3");
if (result.success) {
  console.log(result.content);
} else {
  console.error("Failed:", result.error);
}
```

---

## Troubleshooting

### Common Issues

| Issue                              | Cause                        | Solution                                                                   |
| ---------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| **"Client not initialized"**       | Missing credentials          | Set `GOOGLE_APPLICATION_CREDENTIALS` to service account JSON path          |
| **"Invalid language code"**        | Wrong format                 | Use BCP-47 format (e.g., `en-US`, `hi-IN`)                                 |
| **"Invalid STT model"**            | Unsupported model            | Use: `default`, `latest_long`, `latest_short`, `command_and_search`        |
| **"Audio file too large"**         | File > 10MB                  | Use smaller files or cloud storage with async recognition                  |
| **"No transcription results"**     | Silent audio or poor quality | Check audio quality, ensure speech is present                              |
| **"WAV format conversion failed"** | Invalid WAV file             | Verify WAV file integrity, ensure proper header                            |
| **Fallback to Whisper silently**   | No Google credentials        | Set `GOOGLE_APPLICATION_CREDENTIALS` or keep `OPENAI_API_KEY` for fallback |

### Authentication Issues

**Verify Credentials:**

```bash
# Check if environment variable is set
echo $GOOGLE_APPLICATION_CREDENTIALS

# Verify file exists
ls -la $GOOGLE_APPLICATION_CREDENTIALS

# Test authentication (requires gcloud CLI)
gcloud auth application-default login
```

**Grant IAM Permissions:**

```bash
# Grant Speech Client role
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/speech.client"
```

### Debugging

Enable debug logging to see transcription details:

```typescript
// Set environment variable before running
process.env.LOG_LEVEL = "debug";

const result = await neurolink.generate({
  input: { files: ["audio.mp3"] },
  provider: "google-ai",
  sttOptions: { language: "en-IN" },
});

// Logs will show:
// - Audio file detection
// - STT options validation
// - Transcription provider selection
// - Transcript length and confidence
```

---

## Best Practices

### Performance Optimization

1. **Choose appropriate model:**
   - Use `latest_short` for audio < 1 minute
   - Use `latest_long` for meetings/interviews
   - Use `default` when unsure

2. **File size management:**
   - Keep files under 10MB for inline recognition
   - Use audio compression for large files
   - Consider splitting very long recordings

3. **Language accuracy:**
   - Always specify the correct language code
   - Use regional variants (e.g., `en-IN` vs `en-US` vs `en-GB`)

4. **Batch processing:**
   - Process multiple files sequentially to avoid rate limits
   - Implement retry logic with exponential backoff

### Production Deployment

1. **Authentication:**
   - Use service account credentials (required for STT v1)
   - Store credentials securely (never commit to version control)
   - Use separate credentials for dev/staging/production

2. **Error handling:**
   - Implement comprehensive error handling
   - Provide graceful degradation (fallback to Whisper)
   - Log errors for monitoring

3. **Monitoring:**
   - Track transcription success/failure rates
   - Monitor API quota usage
   - Set up alerts for authentication failures

4. **Cost management:**
   - Monitor Google Cloud STT usage
   - Set budget alerts in Google Cloud Console
   - Consider using Whisper for non-critical workloads

---

## Pricing

Google Cloud Speech-to-Text v1 pricing (as of 2026):

| Model Type       | Price per 15 seconds |
| ---------------- | -------------------- |
| **Standard**     | $0.006               |
| **Data Logging** | $0.004               |

**Monthly free tier:** 60 minutes per month

**Notes:**

- All v1 models (default, latest_long, latest_short, command_and_search) use standard pricing
- Data logging option offers reduced cost in exchange for allowing Google to use data for model improvement
- For detailed pricing, see [Google Cloud STT Pricing](https://cloud.google.com/speech-to-text/pricing)

---

## Related Features

**Multimodal Capabilities:**

- [Multimodal Guide](multimodal.md) - Process images, PDFs, videos alongside audio
- [PDF Support](pdf-support.md) - Document processing
- [Video Generation](video-generation.md) - AI-powered video creation

**Advanced Features:**

- [Streaming](../advanced/streaming.md) - Stream AI responses in real-time
- [Provider Orchestration](provider-orchestration.md) - Multi-provider failover

**Documentation:**

- [CLI Commands](../cli/commands.md) - Complete CLI reference
- [SDK API Reference](../sdk/api-reference.md) - Full API documentation
- [Troubleshooting](../troubleshooting.md) - Extended error catalog

---

## Summary

NeuroLink's STT integration provides:

✅ **Google Cloud STT v1** - Production-grade transcription
✅ **4 specialized models** - Optimized for different use cases
✅ **125+ languages** - Comprehensive language support
✅ **Two transcription modes** - Direct transcription or AI analysis
✅ **Automatic format detection** - Supports MP3, WAV, FLAC, OGG, WebM, AMR
✅ **Intelligent fallback** - Automatic fallback to OpenAI Whisper
✅ **Seamless integration** - Works with generic file handling
✅ **Production-ready** - Service account authentication, error handling

**Next Steps:**

1. Set up [Google Cloud credentials](#environment-setup)
2. Try the [quick start examples](#quick-start)
3. Explore [use cases](#use-cases--examples) for your application
4. Check [troubleshooting](#troubleshooting) if needed
