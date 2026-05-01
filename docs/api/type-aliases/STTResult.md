---
title: STTResult
description: Transcription result returned from STT
---

# Type Alias: STTResult

> **STTResult**: `object`

The transcription result returned from STT. Populated on
`result.transcription` for both `generate()` and `stream()` (set BEFORE
the stream begins iterating).

## Type Declaration

### text

> **text**: `string`

Transcribed text. Empty string when the provider returns success but no
transcription (e.g. silence).

### confidence?

> **confidence?**: `number`

Confidence score from 0 to 1, when the provider supplies it.

### segments?

> **segments?**: `Array<object>`

Per-segment transcription with timestamps, when the provider returns them.

### language?

> **language?**: `string`

Detected language code (e.g. `"en-US"`).

### metadata?

> **metadata?**: `object`

Provider-specific metadata. When present, `STTProcessor` always populates
`latency` (ms) and `provider`; other fields vary by provider. The field is
declared optional because direct handler results (without going through
`STTProcessor`) may omit it.

## Example

```typescript
const result = await neurolink.generate({
  input: { text: "Repeat this audio" },
  provider: "openai",
  stt: {
    enabled: true,
    provider: "whisper",
    audio: audioBuffer,
    format: "mp3",
  },
});

console.log(result.transcription?.text);
console.log("confidence:", result.transcription?.confidence);
```
