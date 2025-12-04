# FFmpeg Operations Documentation

This document provides comprehensive information about all supported FFmpeg operations in NeuroLink.

## Table of Contents

- [Supported Operations](#supported-operations)
- [Configuration & Presets](#configuration--presets)
- [Type System](#type-system)
- [Usage Examples](#usage-examples)

---

## Supported Operations

### 1. `convertVideo()` - Video Format Conversion

**Purpose:** Convert video files between formats with full control over codecs, quality, and encoding parameters.

**Use Cases:**

- Format conversion (MP4 ↔ WebM ↔ MKV ↔ AVI ↔ MOV)
- Quality optimization and compression
- Codec transcoding (H.264 → H.265, VP8 → VP9, etc.)
- Resolution/bitrate adjustment
- Cross-platform compatibility preparation

**Configuration:**

- Video codec: Configurable via `VideoCodec` enum or custom string
- Audio codec: Configurable via `AudioCodec` enum or custom string
- Quality: CRF-based (0-51, lower = better) or bitrate-based
- Preset: FFmpeg's official x264/x265 presets (speed vs compression trade-off)
- Dimensions: Resolution and frame rate control
- Audio: Sample rate, bitrate, channel configuration

**Default Codecs by Format:**
| Format | Video Codec | Audio Codec |
|--------|-------------|-------------|
| MP4 | H.264 (libx264) | AAC |
| WebM | VP9 (libvpx-vp9) | Opus |
| MKV | H.264 (libx264) | AAC |
| AVI | H.264 (libx264) | MP3 |
| MOV | H.264 (libx264) | AAC |

**Timeout:** Dynamically calculated based on input duration × 2 (encoding complexity)

---

### 2. `extractAudio()` - Audio Track Extraction

**Purpose:** Extract audio tracks from video files and convert to various audio formats.

**Use Cases:**

- Audio extraction from videos
- Audio format conversion
- Podcast/music extraction from video content
- Audio quality optimization
- Lossless audio archival (FLAC)

**Configuration:**

- Format: MP3, AAC, WAV, FLAC, OGG (via `AudioFormat` enum)
- Bitrate: Configurable (e.g., '128k', '192k', '320k')
- Sample rate: Configurable (e.g., 44100, 48000 Hz)
- Channels: Mono (1) or Stereo (2)

**Default Codecs by Format:**
| Format | Codec | Typical Use Case |
|--------|-------|------------------|
| MP3 | libmp3lame | Universal compatibility |
| AAC | aac | Apple/streaming platforms |
| WAV | pcm_s16le | Uncompressed editing |
| FLAC | flac | Lossless archival |
| OGG | libvorbis | Open source/web |

**Timeout:** Dynamically calculated based on input duration × 1 (fast operation)

---

### 3. `extractThumbnail()` - Video Thumbnail Generation

**Purpose:** Generate thumbnail images from video frames at specific time positions.

**Use Cases:**

- Video preview generation
- Poster/cover image creation
- Timeline scrubbing thumbnails
- Social media preview images
- Video catalog visualization

**Configuration:**

- Time: Position in seconds (standardized as `TimeInSeconds`)
- Dimensions: Width/height (auto-maintains aspect ratio if only one specified)
- Quality: JPEG quality setting (1-31, lower = better)

**Output Formats:** JPG, PNG

**Timeout:** Fixed at 30 seconds (very fast operation)

---

### 4. `trimVideo()` - Video Segment Extraction

**Purpose:** Cut/trim video segments by time range.

**Use Cases:**

- Clip creation
- Segment extraction
- Highlight reel generation
- Content cutting/editing
- Advertisement insertion prep

**Configuration:**

- Start time: Required, in seconds (standardized as `TimeInSeconds`)
- End time or Duration: Specify either end point or length
- Re-encode: Fast copy mode (default) or full re-encode

**Modes:**

- **Copy mode** (default): Ultra-fast, lossless cut at keyframes
- **Re-encode mode**: Precise cut at any frame, slower

**Timeout:** Dynamically calculated based on output duration × 1 (copy) or × 2 (re-encode)

---

## Configuration & Presets

### FFmpeg Encoding Presets

**Source:** Official FFmpeg libx264/libx265 documentation

Presets control the trade-off between **encoding speed** and **compression efficiency**:

| Preset      | Speed     | File Size    | Use Case                            |
| ----------- | --------- | ------------ | ----------------------------------- |
| `ULTRAFAST` | Fastest   | Largest      | Real-time streaming, quick previews |
| `SUPERFAST` | Very Fast | Large        | Fast processing needed              |
| `VERYFAST`  | Fast      | Large        | Quick turnaround                    |
| `FASTER`    | Fast      | Medium-Large | Balanced speed priority             |
| `FAST`      | Moderate  | Medium       | General use                         |
| `MEDIUM`    | Moderate  | Medium       | **Default - balanced**              |
| `SLOW`      | Slow      | Small        | Quality priority                    |
| `SLOWER`    | Very Slow | Smaller      | High quality archival               |
| `VERYSLOW`  | Slowest   | Smallest     | Maximum compression                 |

**Important:** These are **official FFmpeg presets**, not custom configurations. They directly map to FFmpeg's `-preset` parameter.

**Access via:** `FFmpegPreset` enum

```typescript
import { FFmpegWrapper, FFmpegPreset } from "@juspay/neurolink";

await FFmpegWrapper.convertVideo("input.mp4", "output.mp4", {
  preset: FFmpegPreset.FAST, // Use enum
  quality: 20,
});
```

### Video & Audio Codecs

**Video Codecs** (`VideoCodec` enum):

- `H264` - Most compatible (libx264)
- `H265` - Better compression (libx265)
- `VP9` - Google's WebM codec (libvpx-vp9)
- `VP8` - Older WebM (libvpx)
- `AV1` - Next-generation (libaom-av1)

**Audio Codecs** (`AudioCodec` enum):

- `AAC` - Most compatible
- `MP3` - Universal (libmp3lame)
- `OPUS` - Best for WebM (libopus)
- `VORBIS` - OGG codec (libvorbis)
- `PCM` - Uncompressed (pcm_s16le)
- `FLAC` - Lossless

---

## Type System

### Standardized Time Types

All time-related fields use **`TimeInSeconds`** (number) for consistency:

```typescript
export type TimeInSeconds = number;

// All operations use TimeInSeconds
extractThumbnail("video.mp4", "thumb.jpg", { time: 10 }); // seconds
trimVideo("input.mp4", "output.mp4", {
  startTime: 10, // seconds
  endTime: 30, // seconds
});
```

**Rationale:** Eliminates `number | string` ambiguity and simplifies code handling.

### Base Types & Type Composition

Types are organized using **base types** and **composition** to minimize duplication:

**Base Types:**

- `FFmpegBaseOptions` - Common execution options
- `VideoQualitySettings` - Video quality configuration
- `AudioQualitySettings` - Audio quality configuration
- `VideoDimensions` - Resolution/framerate

**Operation Types** (extend base types):

```typescript
// Example: VideoConvertOptions extends multiple base types
export type VideoConvertOptions = VideoQualitySettings &
  AudioQualitySettings &
  VideoDimensions & {
    /* additional fields */
  };
```

### Explicit Nested Object Types

Complex nested structures have **explicit named types**:

```typescript
// Instead of inline object type:
export type FFprobeFormat = {
  /* ... */
};
export type FFprobeStream = {
  /* ... */
};

export type FFprobeResult = {
  format?: FFprobeFormat;
  streams?: FFprobeStream[];
};
```

**Benefits:**

- Improved type reusability
- Better IDE autocomplete
- Clearer documentation
- Easier type imports

---

## Usage Examples

### Basic Video Conversion

```typescript
import { FFmpegWrapper } from "@juspay/neurolink";

// Simple format conversion (uses defaults)
const result = await FFmpegWrapper.convertVideo("input.mp4", "output.webm");

if (result.success) {
  console.log(`Converted in ${result.durationMs}ms`);
}
```

### Advanced Video Conversion

```typescript
import {
  FFmpegWrapper,
  FFmpegPreset,
  VideoCodec,
  AudioCodec,
} from "@juspay/neurolink";

await FFmpegWrapper.convertVideo("input.mp4", "output.mp4", {
  videoCodec: VideoCodec.H265, // Use enum
  audioCodec: AudioCodec.AAC,
  quality: 20, // CRF quality
  preset: FFmpegPreset.SLOW, // Better compression
  resolution: "1920x1080",
  frameRate: 30,
  bitrate: "192k", // Audio bitrate
  sampleRate: 48000,
  channels: 2,
});
```

### Audio Extraction

```typescript
import { FFmpegWrapper, AudioFormat } from "@juspay/neurolink";

// Extract as MP3 with custom settings
await FFmpegWrapper.extractAudio("video.mp4", "audio.mp3", {
  format: AudioFormat.MP3,
  bitrate: "320k",
  sampleRate: 48000,
  channels: 2,
});

// Extract lossless
await FFmpegWrapper.extractAudio("video.mp4", "audio.flac", {
  format: AudioFormat.FLAC,
});
```

### Thumbnail Extraction

```typescript
import { FFmpegWrapper } from "@juspay/neurolink";

// Extract at 10 seconds
await FFmpegWrapper.extractThumbnail("video.mp4", "thumb.jpg", {
  time: 10,
  width: 1280,
  quality: 2, // Low number = high quality for JPEG
});

// Extract at specific frame for preview
await FFmpegWrapper.extractThumbnail("video.mp4", "poster.png", {
  time: 5,
  height: 720, // Width auto-calculated
});
```

### Video Trimming

```typescript
import { FFmpegWrapper } from "@juspay/neurolink";

// Fast copy mode (no re-encoding)
await FFmpegWrapper.trimVideo("input.mp4", "clip.mp4", {
  startTime: 10,
  endTime: 30,
  reencode: false, // Default, ultra-fast
});

// Precise trim with re-encoding
await FFmpegWrapper.trimVideo("input.mp4", "clip.mp4", {
  startTime: 10,
  duration: 20, // Alternative to endTime
  reencode: true, // Slower but frame-accurate
});
```

### Using Custom Timeouts

```typescript
import { FFmpegWrapper } from "@juspay/neurolink";

await FFmpegWrapper.convertVideo("large.mp4", "output.webm", {
  quality: 18,
  baseOptions: {
    timeout: 600000, // 10 minutes for large file
    cwd: "/tmp/workspace",
  },
});
```

### Type-Safe Configuration

```typescript
import {
  FFmpegWrapper,
  FFmpegPreset,
  VideoFormat,
  AudioFormat,
  type VideoConvertOptions,
  type TimeInSeconds,
} from "@juspay/neurolink";

// Type-safe options
const options: VideoConvertOptions = {
  preset: FFmpegPreset.MEDIUM,
  quality: 23,
  resolution: "1280x720",
};

const thumbnailTime: TimeInSeconds = 15; // Type-enforced as number

await FFmpegWrapper.convertVideo("input.mp4", "output.mp4", options);
await FFmpegWrapper.extractThumbnail("video.mp4", "thumb.jpg", {
  time: thumbnailTime,
});
```

---

## Dynamic Timeout Estimation

All high-level operations use **dynamic timeout estimation** based on media duration and operation complexity:

```
timeout = min(max(duration × 3000ms × complexity, 30s), 2h)
```

**Complexity Multipliers:**

- Audio extraction: 1× (fast)
- Video copy/trim: 1× (fast)
- Video transcoding: 2× (moderate)
- Re-encoding: 2× (moderate)

**Benefits:**

- No timeout failures on large files
- Efficient processing on small files
- Safe bounds (30s min, 2h max)

**Override:** Use `baseOptions.timeout` for custom timeouts when needed.

---

## Error Handling

```typescript
import { FFmpegWrapper, type FFmpegError } from "@juspay/neurolink";

try {
  const result = await FFmpegWrapper.convertVideo("input.mp4", "output.webm");

  if (!result.success) {
    console.error("FFmpeg failed:", result.stderr);
  }
} catch (error) {
  const ffmpegError = error as FFmpegError;
  console.error("Execution error:", ffmpegError.message);
  console.error("Exit code:", ffmpegError.exitCode);
}
```

---

## Best Practices

1. **Use enums for type safety:** `FFmpegPreset`, `VideoCodec`, `AudioCodec`, `VideoFormat`, `AudioFormat`
2. **Prefer CRF quality over bitrate:** More consistent quality across different content
3. **Use copy mode for trimming when possible:** Much faster, lossless
4. **Let timeout be calculated dynamically:** Override only when necessary
5. **Check `isAvailable()` before operations:** Ensure FFmpeg is installed
6. **Use high-level operations for LLM/MCP:** Safer and validated

---

## System Requirements

FFmpeg must be installed on the system:

- **macOS:** `brew install ffmpeg`
- **Ubuntu/Debian:** `sudo apt install ffmpeg`
- **Windows:** Download from [ffmpeg.org](https://ffmpeg.org/download.html)

**Verify installation:**

```typescript
import { FFmpegWrapper } from "@juspay/neurolink";

const available = await FFmpegWrapper.isAvailable();
const version = await FFmpegWrapper.getVersion();

console.log("FFmpeg available:", available);
console.log("Version:", version?.version);
```
