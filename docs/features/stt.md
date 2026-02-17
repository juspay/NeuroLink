---
title: Speech-to-Text (STT) Integration Guide
description: Complete guide to NeuroLink's STT capabilities for converting audio to text with Google Cloud Speech-to-Text
keywords: stt, speech-to-text, transcription, audio, voice recognition, google cloud stt, audio transcription
---

## Overview

NeuroLink provides integrated Speech-to-Text (STT) capabilities, allowing you to transcribe audio files to text with high accuracy. This feature is perfect for voice assistants, meeting transcription, accessibility features, and more.

**Key Features:**

- **High-accuracy transcription** - Powered by Google Cloud Speech-to-Text
- **7 specialized models** - Optimized models for different audio types
- **Word-level timestamps** - Precise timing for each word
- **Multiple audio formats** - WAV, MP3, FLAC, AAC, M4A, OGG/Opus, WebM, WMA support
- **Automatic punctuation** - Context-aware punctuation insertion
- **Alternative transcriptions** - Multiple transcription candidates with confidence scores

---

## Quick Start

### Installation

STT support is built into NeuroLink, so no additional installation required.

### Environment Setup

STT requires Google Cloud service account credentials:

```bash
# Set service account credentials path
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

**Service Account Setup:**

1. Navigate to Google Cloud Console > "IAM & Admin" > "Service Accounts"
2. Create a new service account or select an existing one
3. Grant the "Cloud Speech-to-Text User" role
4. Create and download a JSON key file
5. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the key file path

### Basic Usage

**CLI:**

```bash
# Transcribe an audio file (language auto-detects)
neurolink generate "Transcribe" --file audio.mp3 --stt-language en-US

# Or with explicit language
neurolink generate "Transcribe this audio" \
  --file audio.mp3 \
  --stt-language en-US

# Save transcription to file
neurolink generate "Transcribe this meeting" \
  --file meeting.wav \
  --stt-language en-US \
  -o transcript.txt
```

> **Note:** STT follows NeuroLink's multimodal input pattern. Use the `--file` flag to specify files. Language is auto-detected when `--stt-language` is not specified.

**SDK:**

```typescript
import { NeuroLink } from "@juspay/neurolink";
import { readFileSync } from "fs";

const neurolink = new NeuroLink();

const audioBuffer = readFileSync("audio.mp3");

const result = await neurolink.generate({
  input: {
    text: "Transcribe this audio",
    files: [audioBuffer],
  },
  provider: "google-ai",
  stt: {
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
  },
});

// Access transcription result
console.log("Transcription:", result.transcription?.text);
console.log("Confidence:", result.transcription?.confidence);
```

## Supported Providers

STT is currently available through Google Cloud Speech-to-Text API through Service Account (`GOOGLE_APPLICATION_CREDENTIALS`)

---

## Model Selection

Google Cloud STT offers 7 specialized models optimized for different audio types:

### Available Models

**SDK:**

```typescript
// Default provider (google-ai)
const models = await neurolink.getSTTModels();
console.log("Available models:", models);

// Or specify a provider
const models = await neurolink.getSTTModels("google-ai");
```

**CLI:**

```bash
# Default provider (google-ai)
neurolink stt models

# Or specify a provider
neurolink stt models google-ai
```

### Model Types

| Model                  | Use Case                         | Audio Type     | Accuracy    |
| ---------------------- | -------------------------------- | -------------- | ----------- |
| **default**            | General-purpose transcription    | Any            | High        |
| **command_and_search** | Short queries and voice commands | < 15 seconds   | High        |
| **phone_call**         | Telephone/VoIP audio             | 8kHz/16kHz     | Optimized   |
| **video**              | Video soundtracks                | Mixed audio    | High        |
| **medical_dictation**  | Medical terminology              | Clinical notes | Specialized |
| **latest_long**        | Long-form audio                  | > 1 minute     | Latest      |
| **latest_short**       | Short-form audio                 | < 1 minute     | Latest      |

### Model Selection Guidelines

**For Meeting Transcription:**

```typescript
stt: {
  languageCode: "en-US",
  model: "video",
  enableSpeakerDiarization: true,
  diarizationSpeakerCount: 5,
}
```

**For Call Center Analytics:**

```typescript
stt: {
  languageCode: "en-US",
  model: "phone_call",
  enableSpeakerDiarization: true,
  diarizationSpeakerCount: 2,
}
```

**For Voice Commands:**

```typescript
stt: {
  languageCode: "en-US",
  model: "command_and_search",
}
```

**For Medical Transcription:**

```typescript
stt: {
  languageCode: "en-US",
  model: "medical_dictation",
  useEnhanced: true,
}
```

---

## Audio Format Support

### Supported Formats

| Format       | Encoding  | Quality  | File Size | Use Case                      |
| ------------ | --------- | -------- | --------- | ----------------------------- |
| **WAV**      | LINEAR16  | Best     | Large     | Uncompressed, highest quality |
| **FLAC**     | FLAC      | Lossless | Medium    | Balanced quality/size         |
| **MP3**      | MP3       | Good     | Small     | Common format, web-friendly   |
| **AAC**      | AAC       | Good     | Small     | Apple devices, iTunes         |
| **M4A**      | AAC       | Good     | Small     | Apple/iTunes audio            |
| **OGG/Opus** | OGG_OPUS  | Good     | Small     | Web streaming                 |
| **WebM**     | WEBM_OPUS | Good     | Small     | Web video audio tracks        |
| **WMA**      | WMA       | Good     | Small     | Windows Media Audio           |

### Required Audio Specifications for Google Cloud Speech-to-Text

**File Size Limits:**

- Maximum size: **10 MB** per audio file
- For larger files, consider chunking or using streaming API (coming soon)

**Duration Limits:**

- Maximum duration: **60 seconds** per request (as per google cloud speech-to-test synchronous API)
- For longer audio, split into chunks

**Sample Rate:**

- Recommended: **16,000 Hz** (16 kHz)
- Supported: 8,000 Hz - 48,000 Hz
- Telephony: 8,000 Hz
- High-quality: 48,000 Hz

### Format Detection

NeuroLink automatically detects audio format from file extension:

```typescript
// Automatic format detection
const result = await neurolink.generate({
  input: {
    text: "Transcribe",
    files: ["meeting.mp3"],
  },
  provider: "google-ai",
  stt: {
    languageCode: "en-US",
  },
});
```

Manual encoding specification:

```typescript
stt: {
  languageCode: "en-US",
  encoding: "LINEAR16",
  sampleRateHertz: 16000,
}
```

---

## Advanced Features

### Word-Level Timestamps

Get precise timing for each word in the transcription:

```typescript
const result = await neurolink.generate({
  input: {
    text: "Transcribe with timestamps",
    files: [audioBuffer],
  },
  provider: "google-ai",
  stt: {
    languageCode: "en-US",
    enableWordTimeOffsets: true,
    enableWordConfidence: true,
  },
});

// Access word-level data
result.transcription?.words?.forEach((word) => {
  console.log(
    `${word.word}: ${word.startTime}s - ${word.endTime}s (confidence: ${word.confidence})`,
  );
});
```

**Example Output:**

```
Hello: 0.0s - 0.3s (confidence: 0.98)
world: 0.4s - 0.7s (confidence: 0.95)
this: 0.8s - 1.0s (confidence: 0.97)
is: 1.1s - 1.2s (confidence: 0.99)
a: 1.3s - 1.4s (confidence: 0.96)
test: 1.5s - 1.8s (confidence: 0.98)
```

### Speaker Diarization

Identify different speakers in multi-speaker audio:

```typescript
const result = await neurolink.generate({
  input: {
    text: "Transcribe meeting",
    files: ["meeting.wav"],
  },
  provider: "google-ai",
  stt: {
    languageCode: "en-US",
    enableSpeakerDiarization: true,
    diarizationSpeakerCount: 3,
    enableWordTimeOffsets: true,
  },
});

// Group words by speaker
const speakers = new Map<number, string[]>();
result.transcription?.words?.forEach((word) => {
  const tag = word.speakerTag || 0;
  if (!speakers.has(tag)) speakers.set(tag, []);
  speakers.get(tag)?.push(word.word);
});

speakers.forEach((words, speaker) => {
  console.log(`Speaker ${speaker}: ${words.join(" ")}`);
});
```

**CLI Usage:**

```bash
neurolink generate "Transcribe this meeting" \
  --file meeting.wav \
  --stt-language en-US \
  --stt-enable-timestamps \
  --stt-enable-diarization \
  -o transcript.txt
```

### Alternative Transcriptions

Get multiple transcription candidates with confidence scores:

```typescript
const result = await neurolink.generate({
  input: {
    text: "Transcribe",
    files: [audioBuffer],
  },
  provider: "google-ai",
  stt: {
    languageCode: "en-US",
    maxAlternatives: 3,
  },
});

// Primary transcription
console.log("Primary:", result.transcription?.text);
console.log("Confidence:", result.transcription?.confidence);

// Alternative transcriptions
result.transcription?.alternatives?.forEach((alt, i) => {
  console.log(`Alternative ${i + 1}: ${alt.transcript} (${alt.confidence})`);
});
```

### Profanity Filtering

Automatically filter profanity from transcriptions:

```typescript
stt: {
  languageCode: "en-US",
  profanityFilter: true,
}
```

### Speech Contexts

Improve recognition accuracy by providing context phrases:

```typescript
stt: {
  languageCode: "en-US",
  speechContexts: [
    {
      phrases: ["NeuroLink", "API", "authentication", "token"],
      boost: 10,
    },
    {
      phrases: ["customer service", "technical support"],
      boost: 5,
    },
  ],
}
```

Use cases:

- **Product names**: Bias towards your product terminology
- **Technical terms**: Improve accuracy for domain-specific vocabulary
- **Names**: Recognize company/person names correctly

---

## Complete Configuration Reference

### SDK Configuration

```typescript
import { NeuroLink } from "@juspay/neurolink";
import { readFileSync } from "fs";

const neurolink = new NeuroLink();

const result = await neurolink.generate({
  input: {
    text: "Transcribe this audio",
    files: [readFileSync("audio.mp3")],
  },
  provider: "google-ai", // or "vertex"
  stt: {
    // Audio configuration
    encoding: "MP3", // Audio encoding (auto-detected if not specified)
    sampleRateHertz: 16000, // Sample rate in Hz
    audioChannelCount: 1, // 1 = mono, 2 = stereo

    // Language configuration
    languageCode: "en-US", // Optional: language code (auto-detects if not specified)
    alternativeLanguageCodes: ["es-US", "fr-FR"], // Optional: Alternative languages

    // Model selection
    model: "default", // Model type
    useEnhanced: false, // Use enhanced models (higher cost/accuracy)

    // Transcription features
    enableAutomaticPunctuation: true, // Add punctuation automatically
    profanityFilter: false, // Filter profanity
    maxAlternatives: 1, // Number of alternative transcriptions

    // Word-level features
    enableWordTimeOffsets: false, // Word timestamps
    enableWordConfidence: false, // Word confidence scores

    // Speaker diarization
    enableSpeakerDiarization: false, // Identify speakers
    diarizationSpeakerCount: 2, // Expected speaker count

    // Speech contexts (optional)
    speechContexts: [
      {
        phrases: ["custom", "terms"],
        boost: 10,
      },
    ],
  },
});

// Access results
console.log("Text:", result.transcription?.text);
console.log("Confidence:", result.transcription?.confidence);
console.log("Duration:", result.transcription?.duration, "seconds");
console.log("Language:", result.transcription?.languageCode);

// Word-level details
result.transcription?.words?.forEach((word) => {
  console.log(`${word.word}: ${word.startTime}s (speaker ${word.speakerTag})`);
});

// Metadata
console.log("Latency:", result.transcription?.metadata.latency, "ms");
console.log("Provider:", result.transcription?.metadata.provider);
console.log("Model:", result.transcription?.metadata.model);
```

### CLI Flags

```bash
neurolink generate "<prompt>" \
  --file <audio-file> \
  --provider google-ai \
  --stt-model <model> \
  --stt-enable-timestamps \
  --stt-enable-diarization \
  -o <output-file>
```

**Available CLI Flags:**

- `--file` - Audio file path (required for transcription)
- `--stt-language` (alias: `--stt-lang`) - Language code (e.g., en-US, es-ES) - auto-detects if not specified
- `--stt-model` - Model type (default, phone_call, video, etc.)
- `--stt-enhanced` - Use enhanced model (higher accuracy, higher cost)
- `--stt-enable-timestamps` - Enable word-level timestamps
- `--stt-enable-confidence` - Enable word-level confidence scores
- `--stt-enable-diarization` - Enable speaker diarization
- `--stt-speaker-count` - Expected number of speakers for diarization
- `--stt-enable-punctuation` - Enable automatic punctuation (default: true)
- `--stt-max-alternatives` - Number of alternative transcriptions (1-30)

---

## Error Handling

### Common Error Patterns

```typescript
import { STTError, STT_ERROR_CODES } from "@juspay/neurolink";

async function transcribeWithErrorHandling(audioFile: string) {
  try {
    const audioBuffer = readFileSync(audioFile);

    const result = await neurolink.generate({
      input: {
        text: "Transcribe",
        files: [audioBuffer],
      },
      provider: "google-ai",
      stt: {
        languageCode: "en-US",
        enableAutomaticPunctuation: true,
      },
    });

    // Validate transcription result
    if (!result.transcription || !result.transcription.text) {
      throw new Error("Empty transcription result");
    }

    if (result.transcription.confidence < 0.7) {
      console.warn(
        "Low confidence transcription:",
        result.transcription.confidence,
      );
    }

    return result.transcription;
  } catch (error) {
    if (error instanceof STTError) {
      switch (error.code) {
        case STT_ERROR_CODES.AUDIO_TOO_LARGE:
          console.error("Audio file exceeds 10MB limit");
          break;
        case STT_ERROR_CODES.AUDIO_TOO_LONG:
          console.error("Audio exceeds 60 second limit");
          break;
        case STT_ERROR_CODES.LANGUAGE_NOT_SUPPORTED:
          console.error("Unsupported language code");
          break;
        case STT_ERROR_CODES.NO_SPEECH_DETECTED:
          console.error("No speech found in audio");
          break;
        case STT_ERROR_CODES.PROVIDER_NOT_CONFIGURED:
          console.error("Google Cloud credentials not configured");
          break;
        default:
          console.error("STT error:", error.message);
      }
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
}
```

---

## Troubleshooting

### Common Issues

| Issue                            | Cause                       | Solution                                                     |
| -------------------------------- | --------------------------- | ------------------------------------------------------------ |
| **"STT client not initialized"** | Missing credentials         | Set `GOOGLE_APPLICATION_CREDENTIALS` to service account path |
| **"Audio file too large"**       | File exceeds 10MB           | Compress audio or split into smaller chunks                  |
| **"Audio too long"**             | Duration exceeds 60 seconds | Split audio into smaller segments                            |
| **"No speech detected"**         | Audio is empty/silent       | Verify audio contains speech                                 |
| **"Low confidence result"**      | Poor audio quality          | Use higher quality audio, add speech contexts                |
| **"Speaker diarization failed"** | Wrong speaker count         | Adjust `diarizationSpeakerCount` to match actual speakers    |

### Authentication Issues

**Service Account:**

```bash
# Verify credentials file exists
ls -la $GOOGLE_APPLICATION_CREDENTIALS

# Test authentication
gcloud auth application-default login
```

### Audio Quality Issues

**Best Practices:**

1. **Sample Rate**: Use 16 kHz for best results
2. **Format**: Use FLAC or WAV for highest quality
3. **Channels**: Use mono (1 channel) unless stereo required
4. **Noise**: Reduce background noise before transcription
5. **Volume**: Ensure audio has consistent volume levels

**Pre-process Audio:**

```bash
# Convert to optimal format with ffmpeg
ffmpeg -i input.mp3 -ar 16000 -ac 1 -c:a flac output.flac
```

---

## Best Practices

### Performance Optimization

1. **Use appropriate models** - `phone_call` for telephony, `command_and_search` for short audio
2. **Cache language/model lists** - Lists are cached for 5 minutes
3. **Chunk long audio** - Split audio > 60 seconds into smaller segments
4. **Optimize audio format** - Use FLAC for best quality/size balance

### Production Deployment

1. **Use service accounts** - More secure than API keys
2. **Implement retry logic** - Handle transient network failures
3. **Monitor quota usage** - Track Google Cloud STT API usage
4. **Set appropriate timeouts** - Default is 60 seconds
5. **Handle errors gracefully** - Provide fallback behavior
6. **Log transcription metadata** - Track latency and confidence

### Accuracy Improvement

1. **Use speech contexts** - Add domain-specific terms
2. **Select correct model** - Match model to audio type
3. **Enable enhanced models** - Higher cost but better accuracy
4. **Specify language code** - Auto-detection works well but explicit language may improve accuracy
5. **Pre-process audio** - Clean audio before transcription
6. **Verify confidence scores** - Flag low-confidence results

### Cost Management

1. **Use standard models** - Enhanced models cost more
2. **Optimize audio duration** - Shorter audio = lower cost
3. **Cache results** - Avoid re-transcribing same audio
4. **Monitor API usage** - Set budget alerts in Google Cloud Console

---

## Related Features

**Multimodal Capabilities:**

- [Text-to-Speech (TTS)](tts.md) - Audio generation from text
- [Multimodal Guide](multimodal.md) - Images, PDFs, CSV inputs
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

✅ **High-accuracy transcription** - Google Cloud Speech-to-Text
✅ **7 specialized models** - Optimized for different audio types
✅ **Word-level timestamps** - Precise timing information
✅ **Speaker diarization** - Multi-speaker identification
✅ **8 audio formats** - WAV, MP3, FLAC, AAC, M4A, OGG/Opus, WebM, WMA
✅ **Advanced features** - Punctuation, profanity filtering, alternatives
✅ **CLI integration** - Simple `--file <audio-file>` flag pattern
✅ **Auto-detection** - Language auto-detects if not specified
