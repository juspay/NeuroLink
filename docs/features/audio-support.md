# Audio File Support

NeuroLink provides audio file support as a **multimodal input type** - attach audio files directly to your AI prompts for transcription, analysis, and audio-to-text processing.

## Overview

Audio support in NeuroLink enables you to process audio files for transcription and analysis. The system:

1. **Auto-detects** audio files using FileDetector (magic bytes, MIME types, extensions)
2. **Validates** audio format compatibility with the selected provider
3. **Transcribes** audio content using provider-native speech-to-text capabilities
4. **Supports** multiple languages for transcription
5. **Works** with providers that have native audio processing capabilities

## Quick Start

### CLI Usage

```bash
# Transcribe audio with auto-detection
npx @juspay/neurolink generate "Transcribe this meeting recording" \
  --audio ./meeting-recording.mp3 \
  --provider google-ai

# Process multiple audio files
npx @juspay/neurolink generate "Summarize these voice notes" \
  --audio ./note1.mp3 \
  --audio ./note2.wav \
  --provider google-ai

# Multi-language transcription
npx @juspay/neurolink generate "Transcribe this Spanish audio to English" \
  --audio ./spanish-interview.mp3 \
  --provider google-ai

# Streaming with audio
npx @juspay/neurolink stream "Provide detailed notes from this lecture" \
  --audio ./lecture.mp3 \
  --provider google-ai
```

### SDK Usage

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

// Basic audio transcription
const result = await neurolink.generate({
  input: {
    text: "Transcribe this audio recording",
    audioFiles: ["./meeting-recording.mp3"],
  },
  provider: "google-ai",
});

console.log(result.content); // Transcribed text

// Multiple audio files
const summary = await neurolink.generate({
  input: {
    text: "Summarize the key points from these voice memos",
    audioFiles: ["./memo1.mp3", "./memo2.wav", "./memo3.m4a"],
  },
  provider: "google-ai",
});

// Multi-language transcription
const translation = await neurolink.generate({
  input: {
    text: "Transcribe and translate this French podcast to English",
    audioFiles: ["./french-podcast.mp3"],
  },
  provider: "google-ai",
});

// Auto-detect file types (mix audio with other files)
const multimodal = await neurolink.generate({
  input: {
    text: "Compare the audio transcript with the meeting notes document",
    files: ["./meeting-audio.mp3", "./meeting-notes.pdf"],
  },
  provider: "google-ai",
});

// Streaming with audio
const stream = await neurolink.stream({
  input: {
    text: "Provide a detailed transcript with timestamps",
    audioFiles: ["./interview.mp3"],
  },
  provider: "google-ai",
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

## Supported Audio Formats

| Format | Extension | MIME Type        | Notes                          |
| ------ | --------- | ---------------- | ------------------------------ |
| MP3    | `.mp3`    | `audio/mpeg`     | Most common, widely supported  |
| WAV    | `.wav`    | `audio/wav`      | Uncompressed, high quality     |
| FLAC   | `.flac`   | `audio/flac`     | Lossless compression           |
| OGG    | `.ogg`    | `audio/ogg`      | Open format, good compression  |
| M4A    | `.m4a`    | `audio/mp4`      | Apple format, AAC codec        |
| WebM   | `.webm`   | `audio/webm`     | Web-optimized format           |
| AAC    | `.aac`    | `audio/aac`      | Advanced Audio Coding          |

## Supported Providers

| Provider             | Audio Support | Max Duration | Max Size | Languages      | Notes                         |
| -------------------- | ------------- | ------------ | -------- | -------------- | ----------------------------- |
| **Google AI Studio** | ✅ Full       | 8+ hours     | 2 GB     | 100+ languages | Recommended for audio         |
| **Google Vertex AI** | ✅ Full       | 8+ hours     | 2 GB     | 100+ languages | Enterprise deployments        |
| **OpenAI**           | ✅ Full       | ~25 minutes  | 25 MB    | 50+ languages  | Whisper-based transcription   |
| **Azure OpenAI**     | ✅ Full       | ~25 minutes  | 25 MB    | 50+ languages  | Enterprise Azure integration  |

**Not currently supported:** Anthropic, AWS Bedrock, Mistral, Ollama, Hugging Face

## API Reference

### GenerateOptions

```typescript
type GenerateOptions = {
  input: {
    text: string;
    images?: Array<Buffer | string>; // Image files
    csvFiles?: Array<Buffer | string>; // CSV files
    pdfFiles?: Array<Buffer | string>; // PDF files
    audioFiles?: Array<Buffer | string>; // Audio files (NEW)
    files?: Array<Buffer | string>; // Auto-detect file types
  };

  // Provider selection
  provider?: "google-ai" | "vertex" | "openai" | "azure";

  // Standard options
  model?: string;
  maxTokens?: number;
  temperature?: number;
  // ... other options
};
```

### Audio Input Formats

```typescript
// File path (relative or absolute)
audioFiles: ["./recordings/meeting.mp3"];
audioFiles: ["/absolute/path/to/audio.wav"];

// Buffer (from fs.readFile or other source)
import { readFile } from "fs/promises";
const audioBuffer = await readFile("recording.mp3");
audioFiles: [audioBuffer];

// URL (HTTPS)
audioFiles: ["https://example.com/audio/podcast.mp3"];

// Mixed types
audioFiles: ["local.mp3", audioBuffer, "https://example.com/remote.wav"];
```

## Features

### 1. Auto-Detection

Use the `files` array for automatic file type detection:

```typescript
// Automatically detects audio, PDF, CSV, and image types
await neurolink.generate({
  input: {
    text: "Analyze all these files",
    files: [
      "recording.mp3", // Auto-detected as audio
      "report.pdf", // Auto-detected as PDF
      "data.csv", // Auto-detected as CSV
      "chart.png", // Auto-detected as image
    ],
  },
  provider: "google-ai",
});
```

### 2. Multi-Language Support

NeuroLink supports transcription in 100+ languages:

```typescript
// Spanish transcription
await neurolink.generate({
  input: {
    text: "Transcribe this Spanish audio",
    audioFiles: ["spanish-meeting.mp3"],
  },
  provider: "google-ai",
});

// Translation during transcription
await neurolink.generate({
  input: {
    text: "Transcribe this Japanese audio and translate to English",
    audioFiles: ["japanese-interview.mp3"],
  },
  provider: "google-ai",
});

// Multiple languages in one file
await neurolink.generate({
  input: {
    text: "Transcribe this multilingual conference call, identifying each language",
    audioFiles: ["conference-call.mp3"],
  },
  provider: "google-ai",
});
```

### 3. Multiple Audio Files

Process multiple audio files in a single request:

```typescript
// Compare multiple recordings
await neurolink.generate({
  input: {
    text: "Compare the content of these two interviews and highlight differences",
    audioFiles: ["interview-v1.mp3", "interview-v2.mp3"],
  },
  provider: "google-ai",
});

// Batch transcription
await neurolink.generate({
  input: {
    text: "Transcribe all these voice memos and organize by topic",
    audioFiles: [
      "memo-monday.mp3",
      "memo-tuesday.mp3",
      "memo-wednesday.mp3",
    ],
  },
  provider: "google-ai",
});
```

### 4. Combined with Other File Types

Mix audio with documents and images:

```typescript
// Audio + PDF analysis
await neurolink.generate({
  input: {
    text: "Compare the audio meeting recording with the written meeting notes",
    audioFiles: ["meeting-recording.mp3"],
    pdfFiles: ["meeting-notes.pdf"],
  },
  provider: "google-ai",
});

// Audio + CSV data
await neurolink.generate({
  input: {
    text: "Verify the sales figures mentioned in the audio match the spreadsheet",
    audioFiles: ["sales-call.mp3"],
    csvFiles: ["sales-data.csv"],
  },
  provider: "google-ai",
});
```

## Best Practices

### 1. Choose the Right Provider

```typescript
// For long recordings (podcasts, lectures)
provider: "google-ai"; // Supports 8+ hours

// For enterprise/compliance requirements
provider: "vertex"; // GCP infrastructure

// For short clips with high accuracy
provider: "openai"; // Whisper-based, 25MB limit
```

### 2. Optimize Audio Quality

- **Sample rate**: 16kHz or higher recommended
- **Bit rate**: 128kbps or higher for MP3
- **Channels**: Mono preferred for single speaker, stereo for multi-speaker
- **Noise**: Clean audio yields better transcription accuracy

### 3. Handle Large Files

```typescript
// Check file size before processing
import { stat } from "fs/promises";

const stats = await stat("large-recording.mp3");
const sizeMB = stats.size / (1024 * 1024);

if (sizeMB > 25) {
  // Use Google AI for large files
  provider = "google-ai"; // Supports up to 2GB
} else {
  // OpenAI works for smaller files
  provider = "openai"; // 25MB limit
}
```

### 4. Be Specific in Prompts

```typescript
// ❌ Too vague
"Process this audio";

// ✅ Specific and actionable
"Transcribe this meeting recording, identify speakers, and create action items";
"Extract all mentioned dates, times, and locations from this voicemail";
"Summarize the key discussion points from this podcast episode";
```

## Error Handling

```typescript
try {
  const result = await neurolink.generate({
    input: {
      text: "Transcribe this audio",
      audioFiles: ["recording.mp3"],
    },
    provider: "google-ai",
  });
} catch (error) {
  if (error.message.includes("not supported")) {
    console.error("Audio not supported by this provider. Try: --provider google-ai");
  } else if (error.message.includes("size exceeds")) {
    console.error("File too large. Try: --provider google-ai for files up to 2GB");
  } else if (error.message.includes("Invalid audio")) {
    console.error("File is not a valid audio format");
  } else {
    console.error("Error:", error.message);
  }
}
```

## Troubleshooting

### Error: "Audio files are not currently supported"

**Problem:** Using unsupported provider

**Solution:**

```bash
# Switch to a supported provider
neurolink generate "Transcribe audio" --audio recording.mp3 --provider google-ai
```

### Error: "Audio file size exceeds limit"

**Problem:** File too large for provider

**Solution:**

```bash
# Use Google AI Studio (2GB limit)
neurolink generate "Transcribe" --audio large-file.mp3 --provider google-ai

# Or compress/split the audio file externally
```

### Error: "Invalid audio file format"

**Problem:** Unsupported or corrupted audio format

**Solution:**

```bash
# Verify file format
file recording.mp3  # Should show "Audio file with ID3"

# Convert to supported format
ffmpeg -i input.xyz -acodec libmp3lame output.mp3
```

### Poor Transcription Quality

**Common Causes:**

1. Low audio quality or high background noise
2. Multiple overlapping speakers
3. Strong accents or technical jargon
4. Very fast speech

**Solutions:**

- Use noise reduction before transcription
- Process speakers separately if possible
- Provide context in your prompt
- Use a provider with specialized models

## Real-Time Audio Streaming

For real-time audio input (microphone streaming), NeuroLink supports the Gemini Live API:

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

// Real-time audio streaming (advanced)
const stream = await neurolink.stream({
  input: {
    text: "Respond to this conversation",
    audio: {
      frames: audioFramesAsyncIterable, // PCM16LE mono frames
      sampleRateHz: 16000,
      encoding: "PCM16LE",
      channels: 1,
    },
  },
  provider: "google-ai",
  model: "gemini-2.5-flash-preview-native-audio-dialog",
});

for await (const event of stream) {
  if (event.type === "audio") {
    // Handle audio output chunks
    playAudio(event.audio.data);
  }
}
```

## Related Features

- [Multimodal Chat](./multimodal-chat.md) - Overview of multimodal capabilities
- [PDF Support](./pdf-support.md) - PDF document processing
- [CSV Support](./csv-support.md) - CSV file processing
- [CLI Commands](../cli/commands.md) - CLI reference

## Summary

- Audio support is a **multimodal input** (like images, PDFs, CSVs)
- Use `audioFiles` array or `files` array (auto-detect)
- Supports MP3, WAV, FLAC, OGG, M4A, WebM, AAC formats
- Works with Google AI, Vertex AI, OpenAI, Azure OpenAI
- 100+ languages supported for transcription
- CLI support with `--audio` flag
