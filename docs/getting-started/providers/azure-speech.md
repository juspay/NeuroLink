# Azure Speech Services

Azure Cognitive Services Speech provides both TTS and STT capabilities.

## Setup

```bash
# Required environment variables
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=eastus
```

Get credentials from: **Azure Portal** > **Cognitive Services** > **Speech** > **Keys and Endpoint**

## Usage

### Text-to-Speech

```typescript
const result = await neurolink.generate({
  input: { text: "Summarize this document" },
  tts: {
    enabled: true,
    provider: "azure-tts",
    voice: "en-US-JennyNeural",
    format: "mp3",
  },
});
// result.audio contains the synthesized speech
```

### Speech-to-Text

```typescript
const result = await neurolink.generate({
  input: { text: "" },
  stt: {
    enabled: true,
    provider: "azure-stt",
    audio: audioBuffer,
    language: "en-US",
  },
});
// result.transcription.text contains the transcribed text
```

### CLI

```bash
# TTS
neurolink generate "Hello world" --tts --tts-provider azure-tts

# STT
neurolink generate --stt --stt-provider azure-stt --input-audio ./recording.wav
```

## Supported Voices

Azure Speech supports 400+ neural voices across 140+ languages. Common voices:

| Voice                | Language     | Style   |
| -------------------- | ------------ | ------- |
| `en-US-JennyNeural`  | English (US) | General |
| `en-US-GuyNeural`    | English (US) | General |
| `en-GB-SoniaNeural`  | English (UK) | General |
| `de-DE-KatjaNeural`  | German       | General |
| `fr-FR-DeniseNeural` | French       | General |
| `ja-JP-NanamiNeural` | Japanese     | General |

## Supported Audio Formats

- TTS output: `mp3`, `wav`, `ogg`
- STT input: `wav` (16kHz PCM mono recommended), `ogg`, `opus`
  - Azure's short-audio REST endpoint does not decode MP3 — convert to WAV first or use a different STT provider for MP3 input.

## Limits

- TTS: 10,000 characters per request
- STT: Batch mode (streaming not yet supported)
