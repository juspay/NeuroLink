# Text-to-Speech (TTS) Support

NeuroLink provides comprehensive Text-to-Speech (TTS) capabilities powered by Google Cloud Text-to-Speech API, enabling high-quality voice synthesis with 50+ professional voices across 10+ languages.

## Overview

The TTS feature in NeuroLink enables you to:

1. **Convert text to natural-sounding speech** with professional AI voices
2. **Customize voice characteristics** (speaking rate, pitch, gender)
3. **Support multiple languages** (English, Spanish, French, Hindi, Japanese, and more)
4. **Choose audio formats** (MP3, WAV, OGG)
5. **Play audio directly** or save to files for later use
6. **Cross-platform playback** (macOS, Linux, Windows)

**Key Design:** Unlike multimodal inputs (PDF, CSV, images), TTS is an **output modality** - it generates audio from text rather than analyzing existing media.

## Quick Start

### SDK Usage

```typescript
import { TTSService } from "@juspay/neurolink";
import { writeFileSync } from "fs";

// Initialize TTS service
const tts = new TTSService({
  apiKey: process.env.GOOGLE_TTS_API_KEY, // or set via env var
});

// Basic text-to-speech
const result = await tts.generateAudio({
  text: "Hello! Welcome to NeuroLink's Text-to-Speech feature.",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Neural2-C", // Female voice
});

// Save audio to file
writeFileSync("output.mp3", result.audioBuffer);

// Generate and play audio
const playResult = await tts.generateAudio({
  text: "This will be played immediately after generation.",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Neural2-C",
  play: true, // Auto-play
});

// Customize voice characteristics
const customized = await tts.generateAudio({
  text: "I'm speaking slower and with a higher pitch.",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Neural2-A",
  speakingRate: 0.8, // 80% of normal speed
  pitch: 5.0, // Higher pitch
  audioEncoding: "WAV", // High-quality WAV format
});

// Multi-language support
const hindiAudio = await tts.generateAudio({
  text: "नमस्ते! यह हिंदी में टेस्ट है।",
  provider: "gemini",
  languageCode: "hi-IN",
  voiceName: "hi-IN-Neural2-A",
});

// Get available voices
const voices = await tts.getAvailableVoices("en-US");
console.log(`Found ${voices.length} English voices`);

// List all voices
const allVoices = await tts.getAvailableVoices();
```

### CLI Usage

```bash
# Basic text-to-speech (automatically plays)
neurolink tts generate "Hello, this is a test of the TTS system"

# Specify voice and language
neurolink tts generate "Bonjour, comment allez-vous?" --lang fr-FR --voice fr-FR-Wavenet-A

# Customize speaking rate and pitch
neurolink tts generate "I'm speaking slowly with higher pitch" --rate 0.7 --pitch 8.0

# Choose audio format
neurolink tts generate "Testing WAV format" --encoding WAV
neurolink tts generate "Testing OGG format" --encoding OGG

# Indian English voices
neurolink tts generate "This is Indian English voice" --lang en-IN --voice en-IN-Neural2-A

# List available voices
neurolink tts voices           # All voices
neurolink tts voices en-US     # English (US) voices only
neurolink tts voices hi-IN     # Hindi voices

# Output formats for automation
neurolink tts voices en-US --format json    # JSON output
neurolink tts voices en-US --format table   # Table output
neurolink tts generate "Hello" --format json  # Generation summary as JSON
neurolink tts generate "Hello" --format table # Generation summary as table

# Debug mode for troubleshooting
neurolink tts generate "Debug test" --debug

# Quiet mode (minimal output)
neurolink tts generate "Quiet test" --quiet
```

## API Reference

### TTSService

Main service class for text-to-speech operations.

```typescript
class TTSService {
  constructor(config?: Partial<TTSConfig>);

  // Generate audio from text
  generateAudio(input: TTSInput): Promise<TTSResponse>;

  // Play audio file
  playAudio(filePath: string): Promise<void>;

  // Play audio from buffer
  playAudioFromBuffer(
    audioBuffer: Buffer,
    encoding?: AudioEncoding,
  ): Promise<void>;

  // Test audio playback capability
  testAudioPlayback(): Promise<boolean>;

  // Get available voices
  getAvailableVoices(languageCode?: string): Promise<VoiceOption[]>;

  // Get supported encodings
  getSupportedEncodings(): string[];

  // Get supported platforms
  getSupportedPlatforms(): string[];

  // Get system information
  getSystemInfo(): object;

  // Quick create instance
  static create(apiKey?: string): TTSService;
}
```

### TTSInput

```typescript
type TTSInput = {
  text: string; // Text to convert to speech
  provider: "gemini"; // Provider ID for Google Cloud TTS (currently only supported provider)
  languageCode: string; // e.g., "en-US", "fr-FR", "hi-IN"
  voiceName: string; // e.g., "en-US-Neural2-C"
  audioEncoding?: "MP3" | "WAV" | "OGG"; // Default: MP3
  speakingRate?: number; // 0.25 to 4.0, default: 1.0
  pitch?: number; // -20.0 to 20.0, default: 0.0
  play?: boolean; // Auto-play after generation
};
```

### TTSResponse

```typescript
type TTSResponse = {
  audioBuffer: Buffer; // Generated audio data
  audioSize: number; // Size in bytes
  generationTime: number; // Time taken in milliseconds
  wasPlayed: boolean; // Whether audio was played
  encoding: "MP3" | "WAV" | "OGG"; // Actual encoding used
};
```

### TTSConfig

```typescript
type TTSConfig = {
  apiKey: string; // Google API key
  defaultEncoding?: "MP3" | "WAV" | "OGG"; // Default format
};
```

## Available Voices

### Voice Types

- **Neural2**: Latest generation neural voices (highest quality, most natural)
- **WaveNet**: High-quality deep learning voices (natural and lifelike)
- **Standard**: Standard quality voices (budget-friendly, basic synthesis)
- **Studio**: Studio-quality voices (professional voice-over, polished delivery)
- **Chirp 3**: HD conversational agent voices (experimental)
- **One-speaker**: Media narration voices (person-style)

### Supported Languages

| Language        | Code  | Sample Voices                                   |
| --------------- | ----- | ----------------------------------------------- |
| English (US)    | en-US | Neural2-A (Male), Neural2-C (Female), Wavenet-D |
| English (UK)    | en-GB | Neural2-A (Female), Neural2-B (Male), Wavenet-A |
| English (AU)    | en-AU | Neural2-A (Female), Neural2-B (Male)            |
| English (IN)    | en-IN | Neural2-A (Female), Neural2-B (Male), Wavenet-A |
| Spanish (ES)    | es-ES | Neural2-A (Female), Neural2-B (Male), Wavenet-B |
| French (FR)     | fr-FR | Neural2-A (Female), Neural2-B (Male), Wavenet-A |
| German (DE)     | de-DE | Neural2-A (Female), Neural2-B (Male), Wavenet-A |
| Italian (IT)    | it-IT | Neural2-A (Female), Neural2-C (Male), Wavenet-A |
| Japanese (JP)   | ja-JP | Neural2-B (Female), Neural2-C (Male), Wavenet-A |
| Hindi (IN)      | hi-IN | Neural2-A (Female), Neural2-B (Male), Wavenet-A |
| Portuguese (BR) | pt-BR | Neural2-A (Female), Neural2-B (Male), Wavenet-A |
| Korean (KR)     | ko-KR | Neural2-A (Female), Neural2-B (Male), Wavenet-A |

### Popular Voice Recommendations

**English (US)**

- `en-US-Neural2-A` - Male, natural
- `en-US-Neural2-C` - Female, professional
- `en-US-Neural2-D` - Male, warm
- `en-US-Wavenet-A` - Male, clear

**English (UK)**

- `en-GB-Neural2-A` - Female, professional
- `en-GB-Neural2-B` - Male, authoritative

**English (India)**

- `en-IN-Neural2-A` - Female, clear
- `en-IN-Neural2-B` - Male, professional

**Hindi**

- `hi-IN-Neural2-A` - Female
- `hi-IN-Neural2-B` - Male

## Audio Formats

### MP3

- Default format
- Good quality, smaller file size
- Widely compatible
- Recommended for: General use, web applications

### WAV

- Highest quality, lossless
- Larger file size
- Professional standard
- Recommended for: Production, editing, archival

### OGG

- Good quality, efficient compression
- Medium file size
- Open source format
- Recommended for: Web applications, gaming

## Voice Customization

### Speaking Rate

Controls the speed of speech:

- Range: `0.25` to `4.0`
- Default: `1.0`
- `0.5`: Half speed (slower, more deliberate)
- `1.0`: Normal speed
- `2.0`: Double speed (faster)

```typescript
// Slow and clear
await tts.generateAudio({
  text: "Speaking slowly and clearly.",
  speakingRate: 0.7,
  // ... other options
});

// Fast narration
await tts.generateAudio({
  text: "Quick announcement!",
  speakingRate: 1.5,
  // ... other options
});
```

### Pitch

Controls the voice pitch:

- Range: `-20.0` to `20.0`
- Default: `0.0`
- Negative values: Lower pitch (deeper voice)
- Positive values: Higher pitch (lighter voice)

```typescript
// Deeper voice
await tts.generateAudio({
  text: "Deep voice narration.",
  pitch: -5.0,
  // ... other options
});

// Higher voice
await tts.generateAudio({
  text: "Cheerful announcement!",
  pitch: 5.0,
  // ... other options
});
```

## Cross-Platform Playback

### Supported Platforms

- **macOS**: Uses `afplay` (pre-installed)
  - Typically supports MP3 and WAV (OGG may not be available by default)
- **Linux**: Uses `ffplay` (ffmpeg) or `aplay` (alsa-utils)
  - `ffplay`: MP3, WAV, OGG; `aplay`: WAV only
- **Windows**: Uses PowerShell SoundPlayer (pre-installed)
  - **Note**: Automatically uses WAV format for playback reliability
  - When `play: true` is set, encoding is automatically changed to WAV on Windows

### Linux Setup

```bash
# Install ffmpeg (recommended)
sudo apt install ffmpeg

# Or install alsa-utils
sudo apt install alsa-utils
```

### Testing Playback

```typescript
const tts = new TTSService();

// Get system information and playback capability
const info = tts.getSystemInfo();
const isSupported = info.audioSupported;
const canPlay = await tts.testAudioPlayback();

console.log(info);
// {
//   platform: 'darwin',
//   audioSupported: true,
//   playerCommand: 'afplay',
//   supportedEncodings: ['MP3', 'WAV', 'OGG'],
//   nodeVersion: 'v18.0.0'
// }
```

## Error Handling

### Common Errors

```typescript
import { TTSError } from "@juspay/neurolink";

try {
  await tts.generateAudio({
    text: "Test",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-C",
  });
} catch (error) {
  if (error instanceof TTSError) {
    switch (error.code) {
      case "MISSING_API_KEY":
        console.error("Please set GOOGLE_TTS_API_KEY");
        break;
      case "INVALID_TEXT":
        console.error("Text is required");
        break;
      case "UNSUPPORTED_PROVIDER":
        console.error("Only Google Cloud TTS is supported");
        break;
      case "GENERATION_FAILED":
        console.error("Failed to generate audio:", error.message);
        break;
      case "PLAYBACK_NOT_SUPPORTED":
        console.error("Audio playback not supported on this platform");
        break;
      case "PLAYER_NOT_FOUND":
        console.error("Audio player not installed");
        break;
      case "UNSUPPORTED_FORMAT":
        console.error("Invalid audio format for Windows playback - use WAV");
        break;
      case "INVALID_AUDIO_BUFFER":
        console.error("Audio buffer is empty or invalid");
        break;
      default:
        console.error("TTS error:", error.message);
    }
  }
}
```

### Error Codes

| Code                     | Description                 | Solution                                      |
| ------------------------ | --------------------------- | --------------------------------------------- |
| `MISSING_API_KEY`        | API key not provided        | Set `GOOGLE_TTS_API_KEY` environment variable |
| `INVALID_TEXT`           | Empty or missing text       | Provide non-empty text                        |
| `UNSUPPORTED_PROVIDER`   | Invalid provider            | Use `"gemini"` as provider                    |
| `MISSING_LANGUAGE_CODE`  | Language code not specified | Provide valid language code (e.g., `"en-US"`) |
| `MISSING_VOICE_NAME`     | Voice name not specified    | Provide valid voice name                      |
| `GENERATION_FAILED`      | API call failed             | Check API key, network, and input parameters  |
| `PLAYBACK_NOT_SUPPORTED` | Platform not supported      | Use macOS, Linux, or Windows                  |
| `PLAYER_NOT_FOUND`       | Audio player not installed  | Install required audio player                 |
| `FILE_NOT_FOUND`         | Audio file not found        | Check file path                               |
| `UNSUPPORTED_FORMAT`     | Invalid audio format        | Use WAV format for Windows playback           |
| `INVALID_AUDIO_BUFFER`   | Audio buffer is invalid     | Ensure buffer is not empty or null            |

## Use Cases

### 1. Accessibility

Convert written content to audio for visually impaired users:

```typescript
import { TTSService } from "@juspay/neurolink";

const tts = new TTSService();

// Convert article to audio
const article = `
NeuroLink is a universal AI development platform...
`;

await tts.generateAudio({
  text: article,
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Neural2-C",
  audioEncoding: "MP3",
  play: true,
});
```

### 2. E-Learning

Create audio narrations for educational content:

```typescript
import { TTSService } from "@juspay/neurolink";
import { writeFileSync } from "fs";

const tts = new TTSService();

const lessons = [
  "Welcome to Lesson 1: Introduction to AI",
  "In this lesson, we will explore the fundamentals...",
];

for (const lesson of lessons) {
  const audio = await tts.generateAudio({
    text: lesson,
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-A",
    speakingRate: 0.9, // Slightly slower for learning
  });

  writeFileSync(`lesson-${lessons.indexOf(lesson)}.mp3`, audio.audioBuffer);
}
```

### 3. Multi-Language Support

Create voice announcements in multiple languages:

```typescript
import { TTSService } from "@juspay/neurolink";

const tts = new TTSService();

const messages = [
  { text: "Welcome!", lang: "en-US", voice: "en-US-Neural2-C" },
  { text: "Bienvenue!", lang: "fr-FR", voice: "fr-FR-Neural2-A" },
  { text: "नमस्ते!", lang: "hi-IN", voice: "hi-IN-Neural2-A" },
];

for (const msg of messages) {
  await tts.generateAudio({
    text: msg.text,
    provider: "gemini",
    languageCode: msg.lang,
    voiceName: msg.voice,
    play: true,
  });
}
```

### 4. Voice Notifications

Generate audio alerts for applications:

```typescript
import { TTSService } from "@juspay/neurolink";

const tts = new TTSService();

async function notifyUser(message: string, urgency: "low" | "high") {
  await tts.generateAudio({
    text: message,
    provider: "gemini",
    languageCode: "en-US",
    voiceName: urgency === "high" ? "en-US-Neural2-D" : "en-US-Neural2-C",
    speakingRate: urgency === "high" ? 1.2 : 1.0,
    pitch: urgency === "high" ? 2.0 : 0.0,
    play: true,
  });
}

await notifyUser("Your order has been shipped!", "low");
await notifyUser("Security alert: Unusual activity detected!", "high");
```

### 5. IVR Systems

Create interactive voice response systems:

```typescript
import { TTSService } from "@juspay/neurolink";
import { writeFileSync } from "fs";

const tts = new TTSService();

const ivr = {
  welcome: "Thank you for calling. Press 1 for sales, 2 for support.",
  sales: "Connecting you to our sales department.",
  support: "Please describe your issue after the beep.",
};

// Generate all IVR prompts
for (const [key, text] of Object.entries(ivr)) {
  const audio = await tts.generateAudio({
    text,
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Neural2-C",
    audioEncoding: "WAV",
  });

  writeFileSync(`ivr-${key}.wav`, audio.audioBuffer);
}
```

## Best Practices

### 1. API Key Management

```typescript
// ✅ Good: Use environment variables
const tts = new TTSService({
  apiKey: process.env.GOOGLE_TTS_API_KEY,
});

// ❌ Bad: Hardcode API keys
const tts = new TTSService({
  apiKey: "AIza...", // Never commit API keys!
});
```

### 2. Voice Selection

```typescript
// ✅ Good: Choose appropriate voice for content
const tts = new TTSService();

// Professional female voice for business
await tts.generateAudio({
  text: "Quarterly earnings report...",
  voiceName: "en-US-Neural2-C",
  speakingRate: 0.95,
  // ...
});

// Warm male voice for storytelling
await tts.generateAudio({
  text: "Once upon a time...",
  voiceName: "en-US-Neural2-D",
  pitch: -2.0,
  // ...
});
```

### 3. Error Handling

```typescript
// ✅ Good: Handle errors gracefully
try {
  const result = await tts.generateAudio(input);
  return result;
} catch (error) {
  if (error instanceof TTSError) {
    logger.error(`TTS failed: ${error.code}`, error.message);
    // Fallback logic
  }
  throw error;
}

// ❌ Bad: Ignore errors
const result = await tts.generateAudio(input); // May crash
```

### 4. Resource Cleanup

```typescript
// ✅ Good: Clean up resources
const tts = new TTSService();
try {
  await tts.generateAudio(input);
} finally {
  // Resources are automatically cleaned up
}

// Temporary files are auto-deleted after playback
await tts.generateAudio({ ...input, play: true });
```

### 5. Performance Optimization

```typescript
// ✅ Good: Reuse TTS instance
const tts = new TTSService();
for (const text of texts) {
  await tts.generateAudio({ text, ...options });
}

// ❌ Bad: Create new instance each time
for (const text of texts) {
  const tts = new TTSService(); // Inefficient
  await tts.generateAudio({ text, ...options });
}
```

## Troubleshooting

### Audio Playback Not Working

**Issue**: Audio generation succeeds but playback fails

**Solutions**:

1. Check platform support:

   ```typescript
   const info = tts.getSystemInfo();
   console.log("Audio supported:", info.audioSupported);
   ```

2. Test playback capability:

   ```typescript
   const canPlay = await tts.testAudioPlayback();
   if (!canPlay) {
     const { playerCommand } = tts.getSystemInfo();
     console.log(
       `Playback tool missing. Install or configure: ${playerCommand || "ffplay/aplay (Linux), afplay (macOS), PowerShell (Windows)"}`,
     );
   }
   ```

3. Linux: Install required packages
   ```bash
   sudo apt install ffmpeg  # or alsa-utils
   ```

### API Authentication Errors

**Issue**: `MISSING_API_KEY` or authentication failures

**Solutions**:

1. Set environment variable:

   ```bash
   export GOOGLE_TTS_API_KEY=your_api_key_here
   ```

2. Pass API key explicitly:

   ```typescript
   const tts = new TTSService({ apiKey: "your_key" });
   ```

3. Verify API key is valid and has TTS API enabled

### Voice Not Found

**Issue**: Specified voice not available

**Solutions**:

1. List available voices:

   ```bash
   neurolink tts voices en-US
   ```

2. Use correct voice format:

   ```typescript
   // ✅ Correct
   voiceName: "en-US-Neural2-C";

   // ❌ Incorrect
   voiceName: "Neural2-C"; // Missing language code
   ```

### Quality Issues

**Issue**: Audio sounds robotic or unclear

**Solutions**:

1. Use Neural2 voices (highest quality):

   ```typescript
   voiceName: "en-US-Neural2-C"; // Best quality
   ```

2. Adjust speaking rate for clarity:

   ```typescript
   speakingRate: 0.9; // Slightly slower
   ```

3. Use WAV format for best quality:
   ```typescript
   audioEncoding: "WAV";
   ```

## Limitations

### Current Limitations

1. **Provider Support**: Only Google Cloud Text-to-Speech is currently supported
   - Future: OpenAI TTS, Azure TTS, AWS Polly

2. **Audio Formats**: Limited to MP3, WAV, OGG
   - No support for FLAC, AAC, etc.

3. **Voice Cloning**: Not supported
   - Only pre-defined Google voices available

4. **SSML**: Limited SSML support
   - Basic text-to-speech only

5. **Streaming TTS**: Not available
   - Audio is generated in full before playback

### API Limits

- **Text Length**: Maximum 5000 bytes per request (UTF-8 encoding)
- **Rate Limits**: Subject to Google Cloud TTS quotas
- **File Size**: Generated audio size depends on text length and format

## Migration from Other TTS Services

### From AWS Polly

```typescript
// AWS Polly
const polly = new AWS.Polly();
await polly
  .synthesizeSpeech({
    Text: "Hello",
    VoiceId: "Joanna",
    OutputFormat: "mp3",
  })
  .promise();

// NeuroLink TTS
import { TTSService } from "@juspay/neurolink";

const tts = new TTSService();
await tts.generateAudio({
  text: "Hello",
  voiceName: "en-US-Neural2-C",
  audioEncoding: "MP3",
  provider: "gemini",
  languageCode: "en-US",
});
```

### From Azure Speech

```typescript
// Azure Speech
const synthesizer = new SpeechSynthesizer(config);
await synthesizer.speakTextAsync("Hello");

// NeuroLink TTS
import { TTSService } from "@juspay/neurolink";

const tts = new TTSService();
await tts.generateAudio({
  text: "Hello",
  voiceName: "en-US-Neural2-C",
  provider: "gemini",
  languageCode: "en-US",
  play: true,
});
```

## Related Features

- [Multimodal Chat](./multimodal-chat.md) - Process images, PDFs, and CSV files
- [PDF Support](./pdf-support.md) - Analyze PDF documents
- [CSV Support](./csv-support.md) - Process CSV data

## Additional Resources

- [Google Cloud TTS Documentation](https://cloud.google.com/text-to-speech/docs)
- [Voice Samples](https://cloud.google.com/text-to-speech/docs/voices)

## Support

For issues or questions:

- Open an issue on [GitHub](https://github.com/juspay/neurolink/issues)
- Check existing documentation and examples
- Review error messages and troubleshooting guide
