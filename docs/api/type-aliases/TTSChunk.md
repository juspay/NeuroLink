---
title: TTSChunk
description: Streamed TTS audio chunk emitted by stream() in TTS Mode 2
---

# Type Alias: TTSChunk

> **TTSChunk**: `object`

A streamed TTS audio chunk yielded inline by `stream()` when
`tts.enabled && tts.useAiResponse` is set. Today exactly one chunk is
yielded at end-of-stream (after the LLM response is fully accumulated and
synthesised). Future versions may stream multiple chunks during generation.

## Type Declaration

### data

> **data**: `Buffer`

Audio bytes for this chunk. Format is determined by `format` below.

### format

> **format**: [`TTSAudioFormat`](./TTSAudioFormat.md)

The audio container/encoding for this chunk.

### index

> **index**: `number`

Zero-based chunk sequence number. Today always 0 (single end-of-stream
chunk); future implementations may emit multiple.

### isFinal

> **isFinal**: `boolean`

Whether this is the final chunk in the stream. Today always true.

### cumulativeSize?

> **cumulativeSize?**: `number`

Total audio bytes streamed so far across all chunks of this stream.

### voice?

> **voice?**: `string`

Voice id used for synthesis.

### sampleRate?

> **sampleRate?**: `number`

Sample rate in Hz.

## Example

```typescript
for await (const chunk of streamResult.stream) {
  // Synthesised TTS chunks use the `tts_audio` discriminator.
  // (`type: "audio"` is reserved for raw realtime PCM — `AudioChunk` shape.)
  if (chunk.type === "tts_audio") {
    // chunk.audio is a TTSChunk
    audioBufs.push(chunk.audio.data);
    if (chunk.audio.isFinal) {
      const full = Buffer.concat(audioBufs);
      fs.writeFileSync("./out.mp3", full);
    }
  }
}
```
