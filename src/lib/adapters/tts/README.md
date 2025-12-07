# OpenAI TTS Handler - Usage Examples

This document provides examples of using the `OpenAITTSHandler` for text-to-speech synthesis.

## Basic Usage

```typescript
import { OpenAITTSHandler } from "@juspay/neurolink/adapters/tts";

// Initialize handler with API key
const ttsHandler = new OpenAITTSHandler(process.env.OPENAI_API_KEY);

// Synthesize text with default settings
const result = await ttsHandler.synthesize({
  text: "Hello, world!",
});

console.log(`Audio format: ${result.format}`);
console.log(`Buffer size: ${result.size} bytes`);
console.log(`Duration: ${result.duration} seconds`);
console.log(`Voice: ${result.voice}`);

// Save audio to file
import { writeFileSync } from "fs";
writeFileSync("output.mp3", result.buffer);
```

## Supported Voices

The handler supports all 6 OpenAI voices:

- `alloy` (default) - Neutral, balanced voice
- `echo` - Clear and articulate
- `fable` - British accent, storytelling
- `onyx` - Deep, authoritative
- `nova` - Energetic and enthusiastic
- `shimmer` - Warm and friendly

```typescript
// Use a specific voice
const result = await ttsHandler.synthesize({
  text: "Welcome to our application!",
  voice: "nova",
});
```

## Supported Formats

The handler supports all OpenAI TTS formats:

- `mp3` (default) - Compressed, good quality
- `opus` - High compression, web streaming
- `aac` - Advanced audio coding
- `flac` - Lossless, best quality
- `wav` - Uncompressed, best quality
- `pcm` - Raw PCM audio

```typescript
// Generate high-quality WAV audio
const result = await ttsHandler.synthesize({
  text: "High quality audio",
  format: "wav",
});
```

## Quality Levels

Choose between standard and HD quality:

- `standard` (default) - Uses `tts-1` model
- `hd` - Uses `tts-1-hd` model (higher quality, slower)

```typescript
// Generate HD quality audio
const result = await ttsHandler.synthesize({
  text: "High definition speech",
  quality: "hd",
});
```

## Speed Control

Adjust speech speed from 0.25x to 4.0x (default: 1.0x):

```typescript
// Slow speech for language learning
const slow = await ttsHandler.synthesize({
  text: "This is slow speech",
  speed: 0.5,
});

// Fast speech for efficiency
const fast = await ttsHandler.synthesize({
  text: "This is fast speech",
  speed: 2.0,
});
```

## Complete Example

```typescript
import { OpenAITTSHandler } from "@juspay/neurolink/adapters/tts";
import { writeFileSync } from "fs";

async function generatePodcastIntro() {
  const handler = new OpenAITTSHandler();

  const result = await handler.synthesize({
    text: "Welcome to Tech Insights Podcast, episode 42. Today we're discussing the future of AI.",
    voice: "onyx",
    format: "mp3",
    quality: "hd",
    speed: 0.95, // Slightly slower for clarity
  });

  // Save to file
  writeFileSync("podcast-intro.mp3", result.buffer);

  console.log(`Generated ${result.size} bytes of audio`);
  console.log(
    `Estimated duration: ${result.duration?.toFixed(2)} seconds`,
  );
  console.log(`Voice used: ${result.voice}`);

  return result;
}

generatePodcastIntro();
```

## Error Handling

The handler validates all inputs and provides clear error messages:

```typescript
try {
  const result = await handler.synthesize({
    text: "", // Empty text
  });
} catch (error) {
  console.error(error.message); // "Text is required for TTS synthesis"
}

try {
  const result = await handler.synthesize({
    text: "test",
    speed: 5.0, // Invalid speed
  });
} catch (error) {
  console.error(error.message); // "Speed must be between 0.25 and 4.0"
}
```

## Result Structure

The result includes the audio data and metadata:

```typescript
const result = await handler.synthesize({
  text: "Sample text",
});

console.log(result);
// {
//   buffer: Buffer,          // Audio data
//   format: "mp3",           // Audio format
//   size: 38400,             // Buffer size in bytes
//   duration: 2.4,           // Estimated duration in seconds
//   voice: "alloy",          // Voice used
//   sampleRate: undefined    // Sample rate (not provided by OpenAI)
// }
```

## Getting Supported Options

```typescript
const handler = new OpenAITTSHandler();

// Get all supported voices
const voices = handler.getSupportedVoices();
console.log(voices); // ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

// Get all supported formats
const formats = handler.getSupportedFormats();
console.log(formats); // ["mp3", "opus", "aac", "flac", "wav", "pcm"]
```
