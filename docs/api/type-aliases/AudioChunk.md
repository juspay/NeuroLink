---
title: AudioChunk
description: Raw PCM audio chunk for live realtime streaming (Gemini Live, OpenAI Realtime)
---

# Type Alias: AudioChunk

> **AudioChunk**: `object`

Raw PCM audio frame used by realtime providers (Gemini Live, OpenAI
Realtime). **Distinct from [`TTSChunk`](./TTSChunk.md)**: AudioChunk
carries un-encoded PCM samples for live audio playback, while TTSChunk
carries encoded audio (MP3/WAV/etc.) from a TTS Mode 2 stream.

## Type Declaration

### data

> **data**: `Buffer`

Raw PCM bytes (no RIFF header, no MP3 framing).

### sampleRateHz

> **sampleRateHz**: `number`

Sample rate in Hz. Gemini Live typically emits at 24000.

### channels

> **channels**: `number`

Number of channels. Currently always 1 (mono).

### encoding

> **encoding**: `PCMEncoding`

PCM encoding format — typically `"PCM16LE"`.

## Note

OpenAI Realtime emits PCM frames with `format: "pcm16"` on its
`RealtimeAudioChunk` shape (also raw PCM). Do not pass either type to a
WAV duration parser without first wrapping the bytes in a RIFF header.

## Example

```typescript
for await (const chunk of streamResult.stream) {
  if (chunk.type === "audio" && "sampleRateHz" in chunk.audio) {
    // chunk.audio is an AudioChunk (live PCM)
    speakerOut.write(chunk.audio.data);
  }
}
```
