# 🎤 NeuroLink TTS SDK Guide

Build powerful text-to-speech applications with NeuroLink's comprehensive TTS SDK powered by Google Gemini.

## 📋 Overview

NeuroLink's TTS SDK provides seamless text-to-speech integration with:

- ✅ **Simple API** - Single method call for audio generation
- ✅ **Multi-Language Support** - 40+ languages including English variants, Hindi, Tamil, Bengali, French, Spanish
- ✅ **Voice Options** - WaveNet and Neural2 voices with gender options
- ✅ **Audio Customization** - Control rate, pitch, and encoding format
- ✅ **Cross-Platform Playback** - Works on macOS, Linux, and Windows
- ✅ **Buffer-Based** - In-memory audio processing, no temporary files
- ✅ **TypeScript First** - Full type safety and autocomplete

## 🚀 Quick Start

### Installation

```bash
npm install @juspay/neurolink
```

### Setup

Set your Google AI API key:

```bash
export GOOGLE_AI_API_KEY="your-api-key-here"
```

### Basic Usage

```typescript
import { TTSService } from "@juspay/neurolink";

// Create service
const tts = new TTSService();

// Generate and play audio
const response = await tts.generateAudio({
  text: "Hello, this is text-to-speech!",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  audioEncoding: "MP3",
  speakingRate: 1.0,
  pitch: 0.0,
  play: true,
});

console.log(`Audio size: ${response.audioSize} bytes`);
console.log(`Generation time: ${response.generationTime}ms`);
console.log(`Was played: ${response.wasPlayed}`);
```

## 📚 Core Concepts

### TTSService

The main service class that orchestrates TTS generation and playback.

```typescript
import { TTSService } from "@juspay/neurolink";

// Create with default configuration
const tts = new TTSService();

// Create with custom API key
const ttsCustom = new TTSService({
  apiKey: "your-api-key",
  defaultEncoding: "MP3",
});

// Static factory method
const ttsFactory = TTSService.create("your-api-key");
```

### TTSInput Interface

Defines parameters for audio generation:

```typescript
interface TTSInput {
  text: string; // Text to convert
  provider: "gemini"; // TTS provider
  languageCode: string; // Language (e.g., "en-US")
  voiceName: string; // Voice ID
  audioEncoding?: "MP3" | "WAV" | "OGG"; // Format
  speakingRate?: number; // 0.25 to 4.0
  pitch?: number; // -20.0 to 20.0
  play?: boolean; // Auto-play audio
}
```

### TTSResponse Interface

Contains generated audio and metadata:

```typescript
interface TTSResponse {
  audioBuffer: Buffer; // Audio data
  audioSize: number; // Buffer size in bytes
  generationTime: number; // Time taken (ms)
  wasPlayed: boolean; // Was audio played
  encoding: string; // Audio format used
}
```

## 🎯 Common Use Cases

### 1. Basic Text-to-Speech

```typescript
import { TTSService } from "@juspay/neurolink";

const tts = new TTSService();

const response = await tts.generateAudio({
  text: "Welcome to our application",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  play: true,
});

console.log(`Generated ${response.audioSize} bytes`);
```

### 2. Multi-Language Support

```typescript
// English (US)
await tts.generateAudio({
  text: "Hello, how are you?",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Neural2-C",
  play: true,
});

// Indian English
await tts.generateAudio({
  text: "Welcome to customer support",
  provider: "gemini",
  languageCode: "en-IN",
  voiceName: "en-IN-Neural2-A",
  play: true,
});

// Hindi
await tts.generateAudio({
  text: "नमस्ते, आप कैसे हैं?",
  provider: "gemini",
  languageCode: "hi-IN",
  voiceName: "hi-IN-Wavenet-A",
  play: true,
});

// French
await tts.generateAudio({
  text: "Bonjour, comment allez-vous?",
  provider: "gemini",
  languageCode: "fr-FR",
  voiceName: "fr-FR-Wavenet-A",
  play: true,
});
```

### 3. Save Audio to File

```typescript
import { writeFileSync } from "fs";

const response = await tts.generateAudio({
  text: "Save this audio to a file",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  audioEncoding: "MP3",
  play: false, // Don't auto-play
});

// Save to file
writeFileSync("output.mp3", response.audioBuffer);
console.log(`Saved ${response.audioSize} bytes to output.mp3`);
```

### 4. Customize Voice Parameters

```typescript
// Slow and clear (for accessibility)
const slowSpeech = await tts.generateAudio({
  text: "This is spoken slowly and clearly",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  speakingRate: 0.75,
  pitch: 0,
  play: true,
});

// Fast-paced announcement
const fastSpeech = await tts.generateAudio({
  text: "Quick update: the meeting starts in 5 minutes",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Neural2-A",
  speakingRate: 1.5,
  pitch: 2,
  play: true,
});

// Deep voice
const deepVoice = await tts.generateAudio({
  text: "This has a deeper voice tone",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-A",
  pitch: -10,
  play: true,
});
```

### 5. Buffer-Only Generation (No Playback)

```typescript
// Generate audio buffer without playing
const response = await tts.generateAudio({
  text: "Generate buffer only",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  audioEncoding: "MP3",
  play: false,
});

// Use the buffer for custom processing
const audioBuffer = response.audioBuffer;
console.log(`Buffer size: ${response.audioSize} bytes`);

// Send via HTTP response
res.set("Content-Type", "audio/mpeg");
res.send(audioBuffer);
```

## 🛠️ Advanced Usage

### Error Handling

```typescript
import { TTSService, TTSError } from "@juspay/neurolink";

const tts = new TTSService();

try {
  const response = await tts.generateAudio({
    text: "Test audio generation",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Wavenet-D",
    play: true,
  });

  console.log("Success:", response);
} catch (error) {
  if (error instanceof TTSError) {
    console.error("TTS Error:", error.message);
    console.error("Error Code:", error.code);

    // Handle specific error codes
    switch (error.code) {
      case "MISSING_API_KEY":
        console.error("Please set GOOGLE_AI_API_KEY environment variable");
        break;
      case "API_ERROR":
        console.error("Google TTS API error occurred");
        break;
      case "INVALID_TEXT":
        console.error("Text validation failed");
        break;
      case "TEXT_TOO_LONG":
        console.error("Text exceeds 5000 character limit");
        break;
      case "PLAYBACK_NOT_SUPPORTED":
        console.error("Audio playback not supported on this platform");
        break;
      default:
        console.error("Unknown TTS error");
    }
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Input Validation

```typescript
// Validate TTS input before generation
try {
  tts.validateInput({
    text: "Test",
    provider: "gemini",
    languageCode: "en-US",
    voiceName: "en-US-Wavenet-D",
  });

  console.log("Input is valid");
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

### System Information

```typescript
// Get system capabilities
const systemInfo = tts.getSystemInfo();

console.log("Platform:", systemInfo.platform);
console.log("Audio supported:", systemInfo.audioSupported);
console.log("Player command:", systemInfo.playerCommand);
console.log("Supported encodings:", systemInfo.supportedEncodings);
console.log("Node version:", systemInfo.nodeVersion);
```

### Test Audio Playback

```typescript
// Test if audio playback is available
const canPlay = await tts.testAudioPlayback();

if (canPlay) {
  console.log("✅ Audio playback is supported");
} else {
  console.log("❌ Audio playback is not available");
  console.log("Please install audio player for your platform");
}
```

### Get Available Voices

```typescript
// Get all available voices
const allVoices = await tts.getAvailableVoices();
console.log(`Found ${allVoices.length} voices`);

// Filter by language
const indianVoices = await tts.getAvailableVoices("en-IN");
console.log(`Found ${indianVoices.length} Indian English voices`);

// Display voice information
for (const voice of indianVoices) {
  console.log(
    `${voice.name} - ${voice.ssmlGender} (${voice.languageCodes.join(", ")})`,
  );
}
```

### Direct Audio Playback

```typescript
import { writeFileSync } from "fs";

// Generate audio buffer first
const response = await tts.generateAudio({
  text: "Test audio",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  audioEncoding: "MP3",
  play: false,
});

// Save to temporary file
const tempFile = "/tmp/test-audio.mp3";
writeFileSync(tempFile, response.audioBuffer);

// Play the file later
await tts.playAudio(tempFile);

// Or play from buffer directly
await tts.playAudioFromBuffer(response.audioBuffer, "mp3");
```

## 🎭 Voice Selection Guide

### English Variants

```typescript
// US English - Standard American accent
const usVoice = {
  languageCode: "en-US",
  voiceName: "en-US-Neural2-C", // Female
  // voiceName: "en-US-Neural2-A", // Male
};

// Indian English - Indian accent
const indianVoice = {
  languageCode: "en-IN",
  voiceName: "en-IN-Neural2-A", // Female
  // voiceName: "en-IN-Neural2-B", // Male
};

// British English - British accent
const britishVoice = {
  languageCode: "en-GB",
  voiceName: "en-GB-Neural2-A", // Female
  // voiceName: "en-GB-Neural2-B", // Male
};

// Australian English - Australian accent
const australianVoice = {
  languageCode: "en-AU",
  voiceName: "en-AU-Neural2-A", // Female
  // voiceName: "en-AU-Neural2-B", // Male
};
```

### Voice Types

```typescript
// WaveNet voices - High quality, good for general use
await tts.generateAudio({
  text: "WaveNet voice example",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D", // WaveNet
  play: true,
});

// Neural2 voices - Latest generation, most natural
await tts.generateAudio({
  text: "Neural2 voice example",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Neural2-C", // Neural2
  play: true,
});
```

## 🌍 Multi-Language Applications

### Language-Aware TTS Helper

```typescript
class MultiLanguageTTS {
  private tts: TTSService;

  // Language to voice mapping
  private voiceMap: Record<string, { lang: string; voice: string }> = {
    en: { lang: "en-US", voice: "en-US-Neural2-C" },
    "en-IN": { lang: "en-IN", voice: "en-IN-Neural2-A" },
    hi: { lang: "hi-IN", voice: "hi-IN-Wavenet-A" },
    fr: { lang: "fr-FR", voice: "fr-FR-Wavenet-A" },
    es: { lang: "es-ES", voice: "es-ES-Wavenet-C" },
  };

  constructor() {
    this.tts = new TTSService();
  }

  async speak(text: string, language: string = "en"): Promise<TTSResponse> {
    const voiceConfig = this.voiceMap[language] || this.voiceMap["en"];

    return await this.tts.generateAudio({
      text,
      provider: "gemini",
      languageCode: voiceConfig.lang,
      voiceName: voiceConfig.voice,
      play: true,
    });
  }

  async speakWithOptions(
    text: string,
    language: string,
    options?: {
      rate?: number;
      pitch?: number;
      encoding?: "MP3" | "WAV" | "OGG";
      play?: boolean;
    },
  ): Promise<TTSResponse> {
    const voiceConfig = this.voiceMap[language] || this.voiceMap["en"];

    return await this.tts.generateAudio({
      text,
      provider: "gemini",
      languageCode: voiceConfig.lang,
      voiceName: voiceConfig.voice,
      speakingRate: options?.rate || 1.0,
      pitch: options?.pitch || 0.0,
      audioEncoding: options?.encoding || "MP3",
      play: options?.play ?? true,
    });
  }
}

// Usage
const multiLangTTS = new MultiLanguageTTS();

await multiLangTTS.speak("Hello, world!", "en");
await multiLangTTS.speak("नमस्ते", "hi");
await multiLangTTS.speak("Bonjour", "fr");

// With custom options
await multiLangTTS.speakWithOptions("Slow and clear", "en", {
  rate: 0.75,
  pitch: 0,
  encoding: "WAV",
  play: true,
});
```

## 📦 Integration Examples

### Express.js API

```typescript
import express from "express";
import { TTSService } from "@juspay/neurolink";

const app = express();
const tts = new TTSService();

app.use(express.json());

// Generate TTS audio endpoint
app.post("/api/tts/generate", async (req, res) => {
  try {
    const { text, language, voice, encoding } = req.body;

    const response = await tts.generateAudio({
      text,
      provider: "gemini",
      languageCode: language || "en-US",
      voiceName: voice || "en-US-Wavenet-D",
      audioEncoding: encoding || "MP3",
      play: false,
    });

    // Set appropriate content type
    const contentType =
      encoding === "MP3"
        ? "audio/mpeg"
        : encoding === "WAV"
          ? "audio/wav"
          : "audio/ogg";

    res.set({
      "Content-Type": contentType,
      "Content-Length": response.audioSize,
      "X-Generation-Time": response.generationTime,
    });

    res.send(response.audioBuffer);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      code: error.code || "UNKNOWN_ERROR",
    });
  }
});

// Get available voices
app.get("/api/tts/voices", async (req, res) => {
  try {
    const { language } = req.query;
    const voices = await tts.getAvailableVoices(language as string);

    res.json({
      count: voices.length,
      voices: voices.map((v) => ({
        name: v.name,
        language: v.languageCodes,
        gender: v.ssmlGender,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("TTS API server running on port 3000");
});
```

### React Hook

```typescript
import { useState } from 'react';
import { TTSService, type TTSResponse } from '@juspay/neurolink';

export function useTTS() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tts = new TTSService();

  const generateSpeech = async (
    text: string,
    options?: {
      language?: string;
      voice?: string;
      rate?: number;
      pitch?: number;
      encoding?: 'MP3' | 'WAV' | 'OGG';
    }
  ): Promise<TTSResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await tts.generateAudio({
        text,
        provider: "gemini",
        languageCode: options?.language || 'en-US',
        voiceName: options?.voice || 'en-US-Wavenet-D',
        speakingRate: options?.rate || 1.0,
        pitch: options?.pitch || 0.0,
        audioEncoding: options?.encoding || 'MP3',
        play: false
      });

      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudioBuffer = async (
    audioBuffer: Buffer,
    encoding: string = 'mp3'
  ): Promise<void> => {
    try {
      await tts.playAudioFromBuffer(audioBuffer, encoding);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    generateSpeech,
    playAudioBuffer,
    isGenerating,
    error
  };
}

// Usage in component
function TTSComponent() {
  const { generateSpeech, isGenerating, error } = useTTS();

  const handleSpeak = async () => {
    const response = await generateSpeech("Hello from React!", {
      language: 'en-US',
      voice: 'en-US-Neural2-C',
      rate: 1.0,
      encoding: 'MP3'
    });

    if (response) {
      // Create blob and play audio
      const blob = new Blob([response.audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    }
  };

  return (
    <div>
      <button onClick={handleSpeak} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Speak'}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Chatbot with TTS

```typescript
import { TTSService } from "@juspay/neurolink";

class ChatbotWithTTS {
  private tts: TTSService;
  private voiceConfig = {
    languageCode: "en-US",
    voiceName: "en-US-Neural2-C",
    speakingRate: 1.0,
    pitch: 0,
  };

  constructor() {
    this.tts = new TTSService();
  }

  async respondWithSpeech(message: string): Promise<void> {
    // Get chatbot response (from your AI model)
    const botResponse = await this.getChatbotResponse(message);

    // Generate and play speech
    await this.tts.generateAudio({
      text: botResponse,
      provider: "gemini",
      ...this.voiceConfig,
      audioEncoding: "MP3",
      play: true,
    });
  }

  async generateResponseAudio(message: string): Promise<Buffer> {
    const botResponse = await this.getChatbotResponse(message);

    const response = await this.tts.generateAudio({
      text: botResponse,
      provider: "gemini",
      ...this.voiceConfig,
      audioEncoding: "MP3",
      play: false,
    });

    return response.audioBuffer;
  }

  private async getChatbotResponse(message: string): Promise<string> {
    // Your chatbot logic here
    return `You said: ${message}. How can I help you?`;
  }

  setVoice(languageCode: string, voiceName: string): void {
    this.voiceConfig.languageCode = languageCode;
    this.voiceConfig.voiceName = voiceName;
  }

  setRate(rate: number): void {
    this.voiceConfig.speakingRate = Math.max(0.25, Math.min(4.0, rate));
  }

  setPitch(pitch: number): void {
    this.voiceConfig.pitch = Math.max(-20.0, Math.min(20.0, pitch));
  }
}

// Usage
const chatbot = new ChatbotWithTTS();

// Respond with speech
await chatbot.respondWithSpeech("Hello, how are you?");

// Change to Indian English voice
chatbot.setVoice("en-IN", "en-IN-Neural2-A");
await chatbot.respondWithSpeech("Tell me about India");

// Adjust speaking rate and pitch
chatbot.setRate(1.2);
chatbot.setPitch(2);
await chatbot.respondWithSpeech("This is faster with higher pitch");
```

### Batch TTS Generation

```typescript
import { TTSService } from "@juspay/neurolink";
import { writeFileSync } from "fs";

async function generateBatchTTS(messages: string[], outputDir: string) {
  const tts = new TTSService();

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    console.log(`Generating ${i + 1}/${messages.length}: ${message}`);

    try {
      const response = await tts.generateAudio({
        text: message,
        provider: "gemini",
        languageCode: "en-US",
        voiceName: "en-US-Wavenet-D",
        audioEncoding: "MP3",
        play: false,
      });

      const filename = `${outputDir}/audio-${i + 1}.mp3`;
      writeFileSync(filename, response.audioBuffer);

      console.log(`✅ Saved: ${filename} (${response.audioSize} bytes)`);
    } catch (error) {
      console.error(`❌ Failed for "${message}": ${error.message}`);
    }

    // Rate limiting - wait 1 second between requests
    if (i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Usage
const messages = [
  "Welcome to our application",
  "Please enter your credentials",
  "Processing your request",
  "Thank you for using our service",
];

await generateBatchTTS(messages, "./audio-files");
```

## 🔧 Configuration Reference

### TTSConfig Interface

```typescript
interface TTSConfig {
  apiKey: string; // Google AI API key
  defaultEncoding?: string; // Default audio format (MP3, WAV, OGG)
}
```

### TTSService Constructor

```typescript
// With environment variable (GOOGLE_AI_API_KEY)
const tts = new TTSService();

// With explicit API key
const tts = new TTSService({
  apiKey: "your-api-key-here",
  defaultEncoding: "MP3",
});

// Static factory method
const tts = TTSService.create("your-api-key");
```

## ⚡ Performance Tips

### 1. Buffer Reuse

```typescript
// Generate once, use multiple times
const response = await tts.generateAudio({
  text: "Frequently used message",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  audioEncoding: "MP3",
  play: false,
});

// Cache the buffer
const cachedBuffer = response.audioBuffer;

// Reuse later
await tts.playAudioFromBuffer(cachedBuffer, "mp3");
```

### 2. Optimize Encoding

```typescript
// Use MP3 for smaller file sizes (good for web)
const mp3Response = await tts.generateAudio({
  text: "MP3 encoding",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  audioEncoding: "MP3",
  play: false,
});

// Use WAV for highest quality (good for processing)
const wavResponse = await tts.generateAudio({
  text: "WAV encoding",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  audioEncoding: "WAV",
  play: false,
});

console.log(`MP3: ${mp3Response.audioSize} bytes`);
console.log(`WAV: ${wavResponse.audioSize} bytes`);
// MP3 is typically 10x smaller
```

### 3. Rate Limiting

```typescript
import pLimit from "p-limit";

// Limit concurrent TTS requests
const limit = pLimit(3); // Max 3 concurrent requests

const messages = [
  "Message 1",
  "Message 2",
  "Message 3",
  "Message 4",
  "Message 5",
];

const audioPromises = messages.map((message) =>
  limit(() =>
    tts.generateAudio({
      text: message,
      provider: "gemini",
      languageCode: "en-US",
      voiceName: "en-US-Wavenet-D",
      play: false,
    }),
  ),
);

const responses = await Promise.all(audioPromises);
console.log(`Generated ${responses.length} audio files`);
```

## 🐛 Debugging

### Enable Debug Logging

```typescript
// Set debug environment variable
process.env.NEUROLINK_DEBUG = "true";

// Or use custom logger
import { logger } from "@juspay/neurolink";

logger.setLevel("debug");

// Generate with debug information
const response = await tts.generateAudio({
  text: "Debug test",
  provider: "gemini",
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  play: true,
});
```

### Error Code Reference

| Error Code               | Description                       | Solution                                   |
| ------------------------ | --------------------------------- | ------------------------------------------ |
| `MISSING_API_KEY`        | API key not found                 | Set GOOGLE_AI_API_KEY environment variable |
| `API_ERROR`              | Google TTS API error              | Check API key and quota                    |
| `INVALID_TEXT`           | Text validation failed            | Provide non-empty text                     |
| `TEXT_TOO_LONG`          | Text exceeds limit                | Split text into chunks (max 5000 chars)    |
| `MISSING_LANGUAGE_CODE`  | Language code missing             | Provide languageCode parameter             |
| `MISSING_VOICE_NAME`     | Voice name missing                | Provide voiceName parameter                |
| `INVALID_SPEAKING_RATE`  | Rate out of range                 | Use value between 0.25 and 4.0             |
| `INVALID_PITCH`          | Pitch out of range                | Use value between -20.0 and 20.0           |
| `PLAYBACK_NOT_SUPPORTED` | Platform doesn't support playback | Install audio player for your platform     |
| `PLAYER_NOT_FOUND`       | Audio player not installed        | Install ffmpeg, alsa-utils, or PowerShell  |
| `GENERATION_FAILED`      | TTS generation failed             | Check network connection and API status    |

## 📚 Type Definitions

### Complete TypeScript Types

```typescript
import type {
  TTSInput,
  TTSResponse,
  TTSConfig,
  TTSError,
  VoiceOption,
  GoogleVoice,
  AudioPlayer,
} from "@juspay/neurolink";

// TTSInput - Input for audio generation
interface TTSInput {
  text: string;
  provider: "gemini";
  languageCode: string;
  voiceName: string;
  audioEncoding?: "MP3" | "WAV" | "OGG";
  speakingRate?: number;
  pitch?: number;
  play?: boolean;
}

// TTSResponse - Generated audio response
interface TTSResponse {
  audioBuffer: Buffer;
  audioSize: number;
  generationTime: number;
  wasPlayed: boolean;
  encoding: string;
}

// TTSConfig - Service configuration
interface TTSConfig {
  apiKey: string;
  defaultEncoding?: string;
}

// VoiceOption - Voice information
interface VoiceOption {
  name: string;
  language: string;
  gender: "MALE" | "FEMALE";
  type: "WaveNet" | "Neural2";
}

// GoogleVoice - Detailed voice from API
interface GoogleVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: string;
  naturalSampleRateHertz: number;
}

// TTSError - Custom error class
class TTSError extends Error {
  constructor(message: string, code: string, originalError?: Error);
  code: string;
  originalError?: Error;
}
```

## 🎯 Best Practices

### 1. Handle Errors Gracefully

```typescript
async function safeTTSGeneration(text: string) {
  try {
    return await tts.generateAudio({
      text,
      provider: "gemini",
      languageCode: "en-US",
      voiceName: "en-US-Wavenet-D",
      play: true,
    });
  } catch (error) {
    if (error.code === "TEXT_TOO_LONG") {
      // Split and retry
      const chunks = splitText(text, 4000);
      for (const chunk of chunks) {
        await safeTTSGeneration(chunk);
      }
    } else {
      console.error("TTS failed:", error);
      throw error;
    }
  }
}
```

### 2. Cache Frequent Phrases

```typescript
class CachedTTS {
  private cache = new Map<string, Buffer>();
  private tts: TTSService;

  constructor() {
    this.tts = new TTSService();
  }

  async generateCached(text: string): Promise<Buffer> {
    if (this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    const response = await this.tts.generateAudio({
      text,
      provider: "gemini",
      languageCode: "en-US",
      voiceName: "en-US-Wavenet-D",
      audioEncoding: "MP3",
      play: false,
    });

    this.cache.set(text, response.audioBuffer);
    return response.audioBuffer;
  }
}
```

### 3. Validate Before Generation

```typescript
function validateTTSInput(input: Partial<TTSInput>): void {
  if (!input.text || input.text.trim().length === 0) {
    throw new Error("Text is required");
  }

  if (input.text.length > 5000) {
    throw new Error("Text too long (max 5000 characters)");
  }

  if (
    input.speakingRate &&
    (input.speakingRate < 0.25 || input.speakingRate > 4.0)
  ) {
    throw new Error("Speaking rate must be between 0.25 and 4.0");
  }

  if (input.pitch && (input.pitch < -20.0 || input.pitch > 20.0)) {
    throw new Error("Pitch must be between -20.0 and 20.0");
  }
}

// Usage
validateTTSInput({ text: "Test", speakingRate: 1.0 });
```

## 📖 API Reference

### TTSService Methods

| Method                                  | Description               | Returns                  |
| --------------------------------------- | ------------------------- | ------------------------ |
| `generateAudio(input)`                  | Generate audio from text  | `Promise<TTSResponse>`   |
| `playAudio(filePath)`                   | Play audio file           | `Promise<void>`          |
| `playAudioFromBuffer(buffer, encoding)` | Play audio from buffer    | `Promise<void>`          |
| `testAudioPlayback()`                   | Test playback capability  | `Promise<boolean>`       |
| `getAvailableVoices(languageCode?)`     | Get available voices      | `Promise<GoogleVoice[]>` |
| `getSupportedEncodings()`               | Get supported formats     | `string[]`               |
| `getSupportedPlatforms()`               | Get supported platforms   | `string[]`               |
| `getConfig()`                           | Get current configuration | `Partial<TTSConfig>`     |
| `getSystemInfo()`                       | Get system information    | `object`                 |
| `validateInput(input)`                  | Validate TTS input        | `void`                   |

### Static Methods

| Method                       | Description             | Returns      |
| ---------------------------- | ----------------------- | ------------ |
| `TTSService.create(apiKey?)` | Create service instance | `TTSService` |

## 🔗 Related Documentation

- [TTS CLI Guide](./TTS-CLI-GUIDE.md) - CLI usage and examples
- [API Reference](./sdk/api-reference.md) - Complete API documentation
- [Provider Setup](./getting-started/provider-setup.md) - Configuration guide

## 💬 Support

For issues, questions, or contributions:

- 📧 GitHub Issues: https://github.com/juspay/neurolink/issues
- 📚 Documentation: https://github.com/juspay/neurolink#readme
- 💬 Discussions: https://github.com/juspay/neurolink/discussions

---

[← Back to TTS CLI Guide](./TTS-CLI-GUIDE.md) | [Next: API Reference →](./sdk/api-reference.md)
