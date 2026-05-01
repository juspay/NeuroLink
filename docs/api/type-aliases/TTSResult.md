---
title: TTSResult
description: Audio result returned from TTS synthesis
---

# Type Alias: TTSResult

> **TTSResult**: `object`

The audio result returned from TTS synthesis (Mode 1 direct or Mode 2 via
`useAiResponse: true`). Populated on `result.audio` for `generate()` and
on `await result.audio` for `stream()`.

## Type Declaration

### buffer

> **buffer**: `Buffer`

Audio data. **Note:** the field is `buffer`, not `data`.

### format

> **format**: [`TTSAudioFormat`](./TTSAudioFormat.md)

Audio format — one of `mp3`, `wav`, `ogg`, `opus`, `m4a`, `flac`, `webm`,
`mp4`, `mpeg`, or `mpga`. The `pcm16` member of the shared
[`TTSAudioFormat`](./TTSAudioFormat.md) union is reserved for raw 16-bit PCM
streams (e.g. ElevenLabs `pcm_44100` output, OpenAI Realtime PCM output) and
is exposed here only because some providers return raw PCM bytes without a
RIFF/WAV header — write those to a `.pcm` file (or wrap in a WAV header
yourself), not to a `.wav` file. Realtime PCM frames are normally carried by
[`AudioChunk`](./AudioChunk.md) / `RealtimeAudioChunk`, not `TTSResult`.

### size

> **size**: `number`

Audio file size in bytes (matches `buffer.length` for in-memory results).

### duration?

> **duration?**: `number`

Duration in seconds, when the provider can compute it without re-decoding.

### voice?

> **voice?**: `string`

Voice id used for synthesis (e.g. `"nova"`, `"en-US-JennyNeural"`).

### sampleRate?

> **sampleRate?**: `number`

Sample rate in Hz.

### metadata?

> **metadata?**: `object`

Provider-specific metadata. Always carries `latency` (ms); other fields
vary by provider.

## Example

```typescript
const result = await neurolink.generate({
  input: { text: "Hello world" },
  tts: { enabled: true, provider: "openai-tts", format: "mp3" },
});

if (result.audio) {
  fs.writeFileSync("./out.mp3", result.audio.buffer);
  console.log(`${result.audio.size} bytes, ${result.audio.format}`);
}
```
