---
title: STTError
description: Error class thrown by STT operations
---

# Class: STTError

Extends `VoiceError`, which extends `NeuroLinkError`.

Thrown by `STTProcessor.transcribe()` and STT provider handlers. Carries a
typed `code` from the [STT error code table](../../reference/error-codes.md#stt-error-codes).

## Properties

### code

> **code**: `string`

Stable error code — see [error codes reference](../../reference/error-codes.md#stt-error-codes).
Common values: `STT_AUDIO_EMPTY`, `STT_AUDIO_TOO_LONG`,
`STT_INVALID_AUDIO_FORMAT`, `STT_PROVIDER_NOT_CONFIGURED`,
`STT_TRANSCRIPTION_FAILED`.

### message

> **message**: `string`

Human-readable error description.

### context?

> **context?**: `object`

Per-error context. For `STT_INVALID_AUDIO_FORMAT`: `{ provider, requestedFormat, supportedFormats }`.
For `STT_AUDIO_TOO_LONG`: `{ provider, byteLength, maxAudioBytes }`.

## Static Helpers

### STTError.transcriptionFailed(reason, provider?, originalError?)

Convenience constructor for the common `STT_TRANSCRIPTION_FAILED` case.

### STTError.streamError(reason, provider?, originalError?)

Convenience constructor for `STT_STREAM_ERROR`.

## Example

```typescript
import { STTError, STT_ERROR_CODES } from "@juspay/neurolink";

try {
  await neurolink.generate({
    input: { text: "" },
    provider: "openai",
    stt: { enabled: true, provider: "azure-stt", audio: mp3Buf, format: "mp3" },
  });
} catch (err) {
  if (
    err instanceof STTError &&
    err.code === STT_ERROR_CODES.INVALID_AUDIO_FORMAT
  ) {
    console.log("Convert MP3 to WAV first:", err.context);
  }
}
```
