# 🎤 NeuroLink TTS CLI Guide

## Overview

The NeuroLink TTS (Text-to-Speech) CLI provides powerful text-to-speech capabilities with Google Gemini integration. Generate high-quality speech audio from text with support for multiple languages, voices, accents, and audio formats.

## Features

- 🗣️ **Multi-Language Support** - Generate speech in 40+ languages including English (US, UK, IN, AU), Hindi, Tamil, Bengali, French, Spanish, and more
- 🎭 **Multiple Voice Types** - Choose from WaveNet and Neural2 voice models with male and female options
- 🎵 **Audio Customization** - Control speaking rate, pitch, and audio encoding (MP3, WAV, OGG)
- 🔊 **Cross-Platform Playback** - Automatic audio playback on macOS, Linux, and Windows
- 🌍 **Regional Accents** - Support for Indian English, British English, Australian English, and more
- 📋 **Voice Discovery** - Browse and filter available voices by language and characteristics

## Installation

### Global Installation (Recommended)

```bash
npm install -g @juspay/neurolink

# Verify installation
neurolink tts --help
```

### NPX (No Installation)

```bash
npx @juspay/neurolink tts --help
```

### Local Project

```bash
npm install @juspay/neurolink

# Use via package.json scripts or npx
npx neurolink tts generate "Hello, world!"
```

## Quick Start

### Setup

Set your Google AI API key:

```bash
export GOOGLE_AI_API_KEY="your-api-key-here"
```

### Basic Usage

```bash
# Generate and play speech
neurolink tts generate "Hello, this is text-to-speech!"

# Generate with specific voice
neurolink tts generate "Welcome to NeuroLink" --voice en-US-Wavenet-D

# List available voices
neurolink tts voices
```

## Commands Reference

### `tts generate <text>` - Generate Speech Audio

Generate speech audio from text with customizable voice, language, and audio parameters.

```bash
# Basic generation (uses default US English voice)
neurolink tts generate "Hello, world!"

# With specific voice
neurolink tts generate "Welcome to the future" --voice en-US-Neural2-C

# Indian English accent
neurolink tts generate "Namaste, how are you?" --voice en-IN-Neural2-A --lang en-IN

# British English accent
neurolink tts generate "Good afternoon" --voice en-GB-Wavenet-A --lang en-GB

# Different language (French)
neurolink tts generate "Bonjour, comment allez-vous?" --lang fr-FR --voice fr-FR-Wavenet-A

# Hindi language
neurolink tts generate "नमस्ते, आप कैसे हैं?" --lang hi-IN --voice hi-IN-Wavenet-A

# Custom speaking rate (faster/slower)
neurolink tts generate "This is faster speech" --rate 1.5

# Custom pitch (higher/lower)
neurolink tts generate "This has higher pitch" --pitch 5.0

# Different audio formats
neurolink tts generate "MP3 audio format" --encoding MP3
neurolink tts generate "WAV audio format" --encoding WAV
neurolink tts generate "OGG audio format" --encoding OGG

# Quiet mode (no spinners or progress)
neurolink tts generate "Silent generation" --quiet

# Debug mode (detailed information)
neurolink tts generate "Debug information" --debug
```

**Available Options:**

- `--voice, --voiceName <name>` - Voice to use (e.g., en-US-Wavenet-D, en-IN-Neural2-A)
- `--lang, --languageCode <code>` - Language code (default: en-US)
- `--encoding, --audioEncoding <format>` - Audio format: MP3, WAV, or OGG (default: WAV)
- `--rate, --speakingRate <number>` - Speech speed: 0.25 to 4.0 (default: 1.0)
- `--pitch <number>` - Voice pitch: -20.0 to 20.0 (default: 0.0)
- `--quiet, -q` - Suppress non-essential output
- `--debug, -v` - Enable debug mode with verbose output

**Output Example:**

```
🎤 Generating TTS audio...
✅ TTS audio generated successfully
```

**Debug Mode Output:**

```
🎤 Generating TTS audio...

🔍 Debug - TTS Input:
{
  "text": "Hello, world!",
  "provider": "gemini",
  "languageCode": "en-US",
  "voiceName": "en-US-Wavenet-D",
  "audioEncoding": "WAV",
  "speakingRate": 1.0,
  "pitch": 0.0,
  "play": true
}

✅ TTS audio generated successfully

🔍 Debug - Generation Results:
   Audio buffer generated in memory
   Audio size: 45.2 KB
   Voice used: en-US-Wavenet-D
   Language: en-US
   Encoding: WAV
   Generation time: 1234ms
   Was played: true
```

### `tts voices [language]` - List Available Voices

Browse and filter available TTS voices by language or characteristics.

```bash
# List all available voices
neurolink tts voices

# Filter by language code
neurolink tts voices en-US     # US English voices
neurolink tts voices en-IN     # Indian English voices
neurolink tts voices en-GB     # British English voices
neurolink tts voices hi-IN     # Hindi voices
neurolink tts voices fr-FR     # French voices

# Different output formats
neurolink tts voices --format table    # Table format (default)
neurolink tts voices --format json     # JSON format
neurolink tts voices --format text     # Text format

# Quiet mode (results only)
neurolink tts voices --quiet

# Debug mode
neurolink tts voices en-IN --debug
```

**Available Options:**

- `[language]` - Language code to filter voices (optional)
- `--format, -f <type>` - Output format: text, json, or table (default: text)
- `--quiet, -q` - Suppress non-essential output
- `--debug, -v` - Enable debug mode

**Output Example (Text Format):**

```
🔍 Fetching available TTS voices...
✅ Found 8 voices for en-IN

🎤 Available TTS Voices (en-IN):
   en-IN-Wavenet-A - FEMALE WaveNet (en-IN)
   en-IN-Wavenet-B - MALE WaveNet (en-IN)
   en-IN-Wavenet-C - MALE WaveNet (en-IN)
   en-IN-Wavenet-D - FEMALE WaveNet (en-IN)
   en-IN-Neural2-A - FEMALE Neural2 (en-IN)
   en-IN-Neural2-B - MALE Neural2 (en-IN)
   en-IN-Neural2-C - MALE Neural2 (en-IN)
   en-IN-Neural2-D - FEMALE Neural2 (en-IN)

💡 Use with: neurolink tts generate "text" --voice en-IN-Wavenet-A
```

**Output Example (JSON Format):**

```json
[
  {
    "name": "en-IN-Wavenet-A",
    "language": "en-IN",
    "gender": "FEMALE",
    "type": "WaveNet"
  },
  {
    "name": "en-IN-Neural2-A",
    "language": "en-IN",
    "gender": "FEMALE",
    "type": "Neural2"
  }
]
```

## Supported Languages & Voices

### English Variants

#### US English (en-US)

- **WaveNet:** en-US-Wavenet-A (M), en-US-Wavenet-B (M), en-US-Wavenet-C (F), en-US-Wavenet-D (M)
- **Neural2:** en-US-Neural2-A (M), en-US-Neural2-C (F)

#### Indian English (en-IN)

- **WaveNet:** en-IN-Wavenet-A (F), en-IN-Wavenet-B (M), en-IN-Wavenet-C (M), en-IN-Wavenet-D (F)
- **Neural2:** en-IN-Neural2-A (F), en-IN-Neural2-B (M), en-IN-Neural2-C (M), en-IN-Neural2-D (F)

#### British English (en-GB)

- **WaveNet:** en-GB-Wavenet-A (F), en-GB-Wavenet-B (M), en-GB-Wavenet-C (F), en-GB-Wavenet-D (M)
- **Neural2:** en-GB-Neural2-A (F), en-GB-Neural2-B (M)

#### Australian English (en-AU)

- **WaveNet:** en-AU-Wavenet-A (F), en-AU-Wavenet-B (M), en-AU-Wavenet-C (F), en-AU-Wavenet-D (M)
- **Neural2:** en-AU-Neural2-A (F), en-AU-Neural2-B (M)

### Indian Regional Languages

#### Hindi (hi-IN)

- **WaveNet:** hi-IN-Wavenet-A (F), hi-IN-Wavenet-B (M), hi-IN-Wavenet-C (M), hi-IN-Wavenet-D (F)

#### Bengali (bn-IN)

- **WaveNet:** bn-IN-Wavenet-A (F), bn-IN-Wavenet-B (M)

#### Tamil (ta-IN)

- **WaveNet:** ta-IN-Wavenet-A (F), ta-IN-Wavenet-B (M)

#### Gujarati (gu-IN)

- **WaveNet:** gu-IN-Wavenet-A (F), gu-IN-Wavenet-B (M)

### Other Languages

#### Spanish (es-ES)

- **WaveNet:** es-ES-Wavenet-B (M), es-ES-Wavenet-C (F)

#### French (fr-FR)

- **WaveNet:** fr-FR-Wavenet-A (F), fr-FR-Wavenet-B (M)

## Voice Types

### WaveNet Voices

- High-quality natural-sounding voices
- Excellent for general-purpose applications
- Good balance of quality and performance

### Neural2 Voices

- Latest generation neural network voices
- Most natural and human-like quality
- Recommended for production applications

## Audio Encoding Formats

### MP3 (Default for SDK)

- Good compression and quality balance
- Wide compatibility
- Recommended for web applications

### WAV (Default for CLI)

- Uncompressed high-quality audio
- Best audio fidelity
- Larger file sizes

### OGG

- Open-source Opus codec
- Good compression
- Web-friendly format

## Platform Support

### macOS

- **Player:** `afplay` (pre-installed)
- **Status:** ✅ Fully supported

### Linux

- **Players:** `ffplay` (ffmpeg) or `aplay` (alsa-utils)
- **Status:** ✅ Fully supported
- **Installation:** `sudo apt install ffmpeg` or `sudo apt install alsa-utils`

### Windows

- **Player:** PowerShell Media.SoundPlayer
- **Status:** ✅ Fully supported (pre-installed)

## Usage Examples

### Multilingual Content Generation

```bash
# English (US)
neurolink tts generate "Welcome to our service" --voice en-US-Neural2-C

# Indian English
neurolink tts generate "Thank you for calling customer support" --voice en-IN-Neural2-A --lang en-IN

# British English
neurolink tts generate "The weather forecast for today" --voice en-GB-Wavenet-A --lang en-GB

# Hindi
neurolink tts generate "आपका स्वागत है" --voice hi-IN-Wavenet-A --lang hi-IN

# French
neurolink tts generate "Bienvenue dans notre application" --voice fr-FR-Wavenet-A --lang fr-FR

# Spanish
neurolink tts generate "Bienvenido a nuestro servicio" --voice es-ES-Wavenet-C --lang es-ES
```

### Voice Customization

```bash
# Slow and clear (for learning/accessibility)
neurolink tts generate "This is spoken slowly and clearly" \
  --voice en-US-Wavenet-D \
  --rate 0.75 \
  --pitch 0

# Fast-paced announcement
neurolink tts generate "Quick announcement for urgent updates" \
  --voice en-US-Neural2-A \
  --rate 1.5 \
  --pitch 2

# Deep voice
neurolink tts generate "This has a deeper voice tone" \
  --voice en-US-Wavenet-A \
  --pitch -10

# High-pitched voice
neurolink tts generate "This has a higher voice tone" \
  --voice en-US-Wavenet-C \
  --pitch 10
```

### Batch Processing Script

```bash
#!/bin/bash
# Generate multiple TTS files

# Array of messages
declare -a messages=(
  "Welcome to our application"
  "Please enter your credentials"
  "Processing your request"
  "Thank you for using our service"
)

# Generate TTS for each message
for msg in "${messages[@]}"; do
  echo "Generating: $msg"
  neurolink tts generate "$msg" \
    --voice en-US-Neural2-C \
    --encoding MP3 \
    --quiet
done

echo "✅ All messages generated successfully"
```

### Voice Comparison

```bash
#!/bin/bash
# Compare different voices for the same text

text="The quick brown fox jumps over the lazy dog"

# US English - Male
echo "🎤 US Male (WaveNet-A)"
neurolink tts generate "$text" --voice en-US-Wavenet-A

# US English - Female
echo "🎤 US Female (Neural2-C)"
neurolink tts generate "$text" --voice en-US-Neural2-C

# Indian English - Female
echo "🎤 Indian Female (Neural2-A)"
neurolink tts generate "$text" --voice en-IN-Neural2-A --lang en-IN

# British English - Male
echo "🎤 British Male (Wavenet-B)"
neurolink tts generate "$text" --voice en-GB-Wavenet-B --lang en-GB
```

### IVR System Demo

```bash
#!/bin/bash
# Interactive Voice Response system demo

voice="en-IN-Neural2-A"
lang="en-IN"

neurolink tts generate "Welcome to our customer support system" \
  --voice $voice --lang $lang

sleep 1

neurolink tts generate "Press 1 for account information" \
  --voice $voice --lang $lang

sleep 1

neurolink tts generate "Press 2 for technical support" \
  --voice $voice --lang $lang

sleep 1

neurolink tts generate "Press 0 to speak with an operator" \
  --voice $voice --lang $lang
```

## Troubleshooting

### Audio Playback Issues

**Problem:** "Audio player not found"

**Solution (Linux):**

```bash
# Install ffmpeg (recommended)
sudo apt install ffmpeg

# OR install alsa-utils
sudo apt install alsa-utils
```

**Solution (macOS):**

```bash
# afplay should be pre-installed
# If missing, reinstall Xcode Command Line Tools
xcode-select --install
```

**Solution (Windows):**

```bash
# PowerShell should be pre-installed
# If issues occur, update PowerShell
winget install Microsoft.PowerShell
```

### API Key Issues

**Problem:** "GOOGLE_AI_API_KEY environment variable or config.apiKey is required"

**Solution:**

```bash
# Set environment variable
export GOOGLE_AI_API_KEY="your-api-key-here"

# Or add to ~/.bashrc or ~/.zshrc for persistence
echo 'export GOOGLE_AI_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### Voice Not Found

**Problem:** Voice name not recognized

**Solution:**

```bash
# List all available voices to find the correct name
neurolink tts voices

# Filter by language
neurolink tts voices en-IN

# Use exact voice name from the list
neurolink tts generate "test" --voice en-IN-Neural2-A
```

## Environment Variables

### Required

- `GOOGLE_AI_API_KEY` - Google AI API key for TTS service

### Optional (Advanced)

- `GOOGLE_TTS_SYNTHESIZE_URL` - Custom TTS API endpoint (default: Google Cloud TTS)
- `GOOGLE_TTS_VOICES_URL` - Custom voices API endpoint

## Best Practices

### Voice Selection

1. **Neural2 for Production** - Use Neural2 voices for production applications (more natural)
2. **WaveNet for Development** - WaveNet voices are good for development and testing
3. **Match Language & Voice** - Always match the voice language code with your text language
4. **Test Multiple Voices** - Test different voices to find the best fit for your use case

### Performance Optimization

1. **Use MP3 for Web** - MP3 provides good quality with smaller file sizes
2. **Use WAV for Quality** - WAV provides highest quality for offline applications
3. **Cache Generated Audio** - Cache frequently used audio to reduce API calls
4. **Batch Generation** - Generate multiple audio files in batch for efficiency

### Accessibility

1. **Clear Speech** - Use rate 0.75-1.0 for accessibility applications
2. **Neutral Pitch** - Keep pitch between -5.0 and 5.0 for clarity
3. **Appropriate Pauses** - Use punctuation in text for natural pauses

## Integration Examples

### Node.js Script

```javascript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function generateTTS(text, voice = "en-US-Neural2-C") {
  try {
    const { stdout, stderr } = await execAsync(
      `neurolink tts generate "${text}" --voice ${voice} --quiet`,
    );
    console.log("✅ TTS generated successfully");
  } catch (error) {
    console.error("❌ TTS generation failed:", error);
  }
}

// Usage
await generateTTS("Hello from Node.js!");
```

### Shell Script with Error Handling

```bash
#!/bin/bash

generate_tts() {
  local text="$1"
  local voice="${2:-en-US-Neural2-C}"

  if ! neurolink tts generate "$text" --voice "$voice" --quiet 2>/dev/null; then
    echo "❌ Failed to generate TTS for: $text"
    return 1
  fi

  echo "✅ Generated: $text"
  return 0
}

# Usage
generate_tts "Welcome message" "en-US-Neural2-C"
generate_tts "Error message" "en-US-Wavenet-D"
```

## Advanced Features

### Debug Mode

Get detailed information about TTS generation:

```bash
neurolink tts generate "debug test" --debug
```

Provides:

- Input parameters
- API request details
- Response metadata
- Audio buffer information
- Generation timing
- Playback status

### Quiet Mode

Suppress all non-essential output for automation:

```bash
neurolink tts generate "silent mode" --quiet
```

Perfect for:

- Automated scripts
- Background processing
- CI/CD pipelines
- Headless environments

## API Rate Limits

Google TTS API has rate limits:

- **Standard:** 100 requests per 100 seconds
- **Burst:** Higher limits available with quota increase

**Recommendations:**

- Add delays between batch requests
- Implement exponential backoff on errors
- Cache frequently used audio
- Monitor API usage

## Cost Optimization

### Google TTS Pricing (Approximate)

- **WaveNet:** ~$16 per 1 million characters
- **Neural2:** ~$16 per 1 million characters
- **Standard:** ~$4 per 1 million characters

**Tips:**

- Cache generated audio files
- Use appropriate audio encoding (MP3 vs WAV)
- Batch similar content
- Monitor character usage

---

## Related Documentation

- [TTS SDK Guide](./TTS-SDK-GUIDE.md) - Programmatic TTS integration
- [CLI Guide](./CLI-GUIDE.md) - General CLI usage
- [Provider Configuration](./getting-started/provider-setup.md) - API key setup

## Support

For issues, questions, or contributions:

- 📧 GitHub Issues: https://github.com/juspay/neurolink/issues
- 📚 Documentation: https://github.com/juspay/neurolink#readme
- 💬 Discussions: https://github.com/juspay/neurolink/discussions

---

[← Back to CLI Guide](./CLI-GUIDE.md) | [Next: TTS SDK Guide →](./TTS-SDK-GUIDE.md)
