---
title: PPT Generation - AI-Powered Presentations
description: Generate professional PowerPoint presentations from text prompts using AI-powered content planning and slide generation
keywords: ppt generation, powerpoint, presentation, slides, ai presentation, neurolink, gemini, claude, gpt-4
---

# PPT Generation - AI-Powered Presentations

NeuroLink enables AI-powered PowerPoint presentation generation from text prompts. Transform ideas into professional, visually-appealing presentations with intelligent content planning, multiple slide types, and optional AI-generated images.

## Overview

PPT generation in NeuroLink uses a multi-stage pipeline powered by any supported AI provider:

1. **Accepts** a text prompt describing the presentation topic via `input.text`
2. **Plans** structured content using AI-powered content planning
3. **Generates** individual slides with appropriate types, layouts, and content
4. **Creates** optional AI-generated images for visual slides
5. **Assembles** a complete `.pptx` file using pptxgenjs
6. **Returns** a `PPTGenerationResult` containing file path and metadata

```mermaid
graph LR
    A[Text Prompt] --> B[Content Planning AI]
    B --> C[Slide Schemas]
    C --> D[Slide Generator]
    D --> E[Image Generation]
    E --> F[PPTX Assembly]
    F --> G[PPTGenerationResult]
    G --> H[Save to File]
```

## What You Get

- **Professional presentations** – Generate complete PowerPoint files with 5-50 slides
- **35 slide types** – From title and content slides to charts, timelines, dashboards, and composite layouts
- **5 built-in themes** – Modern, Corporate, Creative, Minimal, and Dark
- **AI image generation** – Optional background and decorative images using Gemini
- **User-provided images** – Use your own images instead of AI generation
- **SDK integration** – Use `neurolink.generate()` with `output.mode: "ppt"`
- **CLI support** – Generate presentations directly from command line
- **Multi-provider support** – Works with Vertex AI, OpenAI, Anthropic, Google AI, Azure, and Bedrock

## Supported Providers & Models

### Provider Compatibility

| Provider    | Recommended Models               | Slide Types | Image Gen   | Quality | Notes                    |
| ----------- | -------------------------------- | ----------- | ----------- | ------- | ------------------------ |
| `vertex`    | gemini-2.5-pro, gemini-3         | All 35      | ✅ Native   | Highest | Full feature support     |
| `google-ai` | gemini-2.5-pro, gemini-3         | All 35      | ✅ Native   | Highest | Full feature support     |
| `openai`    | gpt-4o, gpt-4-turbo              | All 35      | ⚠️ External | High    | Uses OpenAI for planning |
| `anthropic` | claude-4.5-sonnet, claude-3-opus | All 35      | ⚠️ External | Highest | Advanced reasoning       |
| `azure`     | gpt-4o, gpt-4-turbo              | All 35      | ⚠️ External | High    | Enterprise deployment    |
| `bedrock`   | claude-3-sonnet, titan           | All 35      | ⚠️ External | High    | AWS integration          |

### Model Tiers

| Tier       | Models                                                                   | Slide Types | Notes                         |
| ---------- | ------------------------------------------------------------------------ | ----------- | ----------------------------- |
| `advanced` | claude-4.5-opus, claude-4.5-sonnet, gpt-4o, gemini-2.5-pro, gemini-3-pro | All 35      | Full prompt with all features |
| `basic`    | gemini-flash, claude-instant, gpt-3.5                                    | 10 core     | Simplified prompt for speed   |

## Prerequisites

1. **AI provider credentials** configured for your chosen provider
2. **For AI images**: Vertex AI or Google AI credentials with Gemini access
3. **Sufficient storage**: Output files range from 100KB to 10MB+ depending on images

## Quick Start

### SDK Usage

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

// Basic PPT generation
const result = await neurolink.generate({
  input: {
    text: "Create a presentation about AI in Healthcare",
  },
  provider: "vertex",
  model: "gemini-2.5-pro",
  output: {
    mode: "ppt",
    ppt: {
      pages: 10,
      theme: "modern",
      audience: "business",
      tone: "professional",
    },
  },
});

// Access result
if (result.ppt) {
  console.log(`Presentation saved: ${result.ppt.filePath}`);
  console.log(`Total slides: ${result.ppt.totalSlides}`);
}
```

#### With Full Options

```typescript
import { NeuroLink } from "@juspay/neurolink";
import { readFileSync } from "fs";

const neurolink = new NeuroLink();

const result = await neurolink.generate({
  input: {
    text: "Quarterly Sales Report Q4 2025 - Key achievements, challenges, and outlook",
  },
  provider: "vertex",
  model: "gemini-2.5-pro",
  output: {
    mode: "ppt",
    ppt: {
      pages: 15,
      theme: "corporate",
      audience: "business",
      tone: "professional",
      generateAIImages: true,
      aspectRatio: "16:9",
      outputPath: "./presentations/q4-report.pptx",
      logoPath: readFileSync("./assets/company-logo.png"),
    },
  },
});

console.log("Presentation metadata:", {
  filePath: result.ppt?.filePath,
  slides: result.ppt?.totalSlides,
  theme: result.ppt?.metadata?.theme,
  fileSize: result.ppt?.metadata?.fileSize,
});
```

#### With User-Provided Images

```typescript
import { NeuroLink } from "@juspay/neurolink";
import { readFileSync } from "fs";

const neurolink = new NeuroLink();

// Use your own images instead of AI generation
const result = await neurolink.generate({
  input: {
    text: "Product Launch Presentation for our new smartphone",
    images: [
      readFileSync("./product-hero.jpg"),
      readFileSync("./product-features.png"),
      "./marketing/lifestyle-shot.jpg", // File path also works
    ],
  },
  provider: "anthropic",
  model: "claude-3.5-sonnet",
  output: {
    mode: "ppt",
    ppt: {
      pages: 12,
      theme: "creative",
      generateAIImages: false, // Use provided images only
    },
  },
});
```

### CLI Usage

```bash
# Basic PPT generation
npx @juspay/neurolink generate "Introduction to Machine Learning" \
  --outputMode ppt \
  --pptPages 10 \
  --pptOutput ./ml-presentation.pptx

# Full options
npx @juspay/neurolink generate "Company Strategy 2026" \
  --provider vertex \
  --model gemini-2.5-pro \
  --outputMode ppt \
  --pptPages 15 \
  --pptTheme corporate \
  --pptAudience business \
  --pptTone professional \
  --pptAspectRatio 16:9 \
  --pptOutput ./strategy-2026.pptx

# Disable AI image generation
npx @juspay/neurolink generate "Machine Learning 101" \
  --outputMode ppt \
  --pptTheme minimal \
  --pptTone educational \
  --pptNoImages
```

### CLI Arguments

- `--outputMode` (string, default: `text`) — Output mode: `text`, `video`, or `ppt`
- `--pptPages`, `--pages` (number, default: `10`) — Number of slides (5-50)
- `--pptTheme` (string, default: AI-selected) — Theme: `modern`, `corporate`, `creative`, `minimal`, `dark`
- `--pptAudience` (string, default: AI-selected) — Target audience: `business`, `students`, `technical`, `general`
- `--pptTone` (string, default: AI-selected) — Presentation tone: `professional`, `casual`, `educational`, `persuasive`
- `--pptNoImages` (boolean, default: `false`) — Disable AI images for visual slides (images are enabled by default)
- `--pptAspectRatio` (string, default: `16:9`) — Aspect ratio: `16:9` or `4:3`
- `--pptOutput`, `--po` (string, default: auto-generated) — Output file path

## Slide Types

NeuroLink supports **35 distinct slide types** organized by category:

### Opening/Closing Slides

| Type             | Description                      | Layout Options                     |
| ---------------- | -------------------------------- | ---------------------------------- |
| `title`          | Opening slide with main title    | `title-centered`, `title-bottom`   |
| `section-header` | Section divider with large title | `title-centered`                   |
| `thank-you`      | Final slide with contact info    | `contact-info`, `title-centered`   |
| `closing`        | Summary and next steps           | `summary-bullets`, `title-content` |

### Content Slides

| Type            | Description                    | Layout Options                 |
| --------------- | ------------------------------ | ------------------------------ |
| `content`       | Standard title + bullet points | `title-content`, image layouts |
| `agenda`        | Table of contents              | `title-content`, `two-column`  |
| `bullets`       | Enhanced bullet points         | `title-content`                |
| `numbered-list` | Step-by-step content           | `title-content`                |

### Visual Slides

| Type               | Description               | Image Required |
| ------------------ | ------------------------- | -------------- |
| `image-focus`      | Large centered image      | Yes            |
| `image-left`       | Image left, content right | Yes            |
| `image-right`      | Content left, image right | Yes            |
| `full-bleed-image` | Full background image     | Yes            |
| `gallery`          | Multiple images grid      | Yes            |

### Data Slides

| Type         | Description               | Data Structure |
| ------------ | ------------------------- | -------------- |
| `table`      | Data table with headers   | `TableRow[]`   |
| `chart-bar`  | Bar chart                 | `ChartSeries`  |
| `chart-line` | Line chart for trends     | `ChartSeries`  |
| `chart-pie`  | Pie chart for proportions | `ChartSeries`  |
| `chart-area` | Area chart                | `ChartSeries`  |
| `statistics` | Big numbers display       | `Statistic[]`  |

### Layout Slides

| Type            | Description             | Columns |
| --------------- | ----------------------- | ------- |
| `two-column`    | Two equal columns       | 2       |
| `three-column`  | Three column layout     | 3       |
| `split-content` | Asymmetric 60/40 split  | 2       |
| `comparison`    | Side-by-side comparison | 2       |

### Special Slides

| Type           | Description             | Key Content       |
| -------------- | ----------------------- | ----------------- |
| `quote`        | Impactful quote         | `quote`, `author` |
| `timeline`     | Chronological events    | `TimelineItem[]`  |
| `process-flow` | Step-by-step process    | `ProcessStep[]`   |
| `features`     | Feature list with icons | `FeatureItem[]`   |
| `team`         | Team member profiles    | `TeamMember[]`    |
| `icons`        | Icon grid with labels   | `icons[]`         |
| `conclusion`   | Summary with takeaways  | `bullets`         |

### Composite/Dashboard Slides

| Type            | Description                | Components               |
| --------------- | -------------------------- | ------------------------ |
| `dashboard`     | Multi-zone flexible grid   | charts + stats + bullets |
| `mixed-content` | Left bullets + right chart | bullets + data           |
| `stats-grid`    | Multiple stat boxes        | `Statistic[]`            |
| `icon-grid`     | Icon boxes in grid         | icons                    |

## Themes

### Built-in Themes

| Theme       | Colors                  | Best For            |
| ----------- | ----------------------- | ------------------- |
| `modern`    | Blue, Purple, Cyan      | Tech, Innovation    |
| `corporate` | Dark Blue, Green, Slate | Business, Finance   |
| `creative`  | Orange, Pink, Yellow    | Marketing, Design   |
| `minimal`   | Black, White, Gray      | Clean, Professional |
| `dark`      | Cyan, Purple on Dark    | Tech, Startups      |

### Theme Structure

```typescript
interface PresentationTheme {
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string; // Main accent color
    secondary: string; // Secondary accent
    accent: string; // Highlight color
    background: string; // Slide background
    text: string; // Body text color
    textOnPrimary: string; // Text on primary color
    muted: string; // Muted/caption text
  };
  fonts: {
    heading: string;
    body: string;
    sizes: {
      title: number;
      subtitle: number;
      heading: number;
      body: number;
      caption: number;
    };
  };
}
```

## Type Definitions

### PPTOutputOptions

Options for PPT generation configuration:

```typescript
type PPTOutputOptions = {
  /** Number of slides (5-50) */
  pages: number;
  /** Output format (currently only 'pptx') */
  format?: "pptx";
  /** Presentation theme */
  theme?: "modern" | "corporate" | "creative" | "minimal" | "dark";
  /** Target audience */
  audience?: "business" | "students" | "technical" | "general";
  /** Presentation tone */
  tone?: "professional" | "casual" | "educational" | "persuasive";
  /** Generate AI images for visual slides */
  generateAIImages?: boolean;
  /** Output file path */
  outputPath?: string;
  /** Aspect ratio */
  aspectRatio?: "16:9" | "4:3";
  /** Logo image (Buffer, file path, or ImageWithAltText) */
  logoPath?: Buffer | string | ImageWithAltText;
};
```

### PPTGenerationResult

Result type for generated presentation:

```typescript
type PPTGenerationResult = {
  /** Path to generated file */
  filePath: string;
  /** Total number of slides */
  totalSlides: number;
  /** Output format */
  format: "pptx";
  /** Provider used for content planning */
  provider: string;
  /** Model used for content planning */
  model: string;
  /** Additional metadata */
  metadata?: {
    theme?: string;
    audience?: string;
    tone?: string;
    imageModel?: string;
    fileSize?: number;
  };
};
```

### Content Structure Types

```typescript
// Bullet point with optional formatting
type BulletPoint = {
  text: string;
  subBullets?: string[];
  icon?: string;
  emphasis?: boolean;
  fontSize?: number;
  bulletStyle?: "disc" | "number" | "checkmark" | "arrow" | "dash" | "none";
  color?: string;
  bold?: boolean;
};

// Statistics for data slides
type Statistic = {
  value: string;
  label: string;
  trend?: "up" | "down" | "neutral";
  change?: string;
  icon?: string;
};

// Timeline items
type TimelineItem = {
  date: string;
  title: string;
  description?: string;
  icon?: string;
};

// Process steps
type ProcessStep = {
  step: number;
  title: string;
  description?: string;
  icon?: string;
};

// Chart data
type ChartSeries = {
  name: string;
  labels: string[];
  values: number[];
  color?: string;
};
```

### Extended GenerateResult

The `generate()` function returns an extended result when PPT mode is enabled:

```typescript
type GenerateResult = {
  content: string;
  provider?: string;
  model?: string;
  usage?: TokenUsage;
  responseTime?: number;

  // PPT-specific field (present when output.mode === "ppt")
  ppt?: PPTGenerationResult;

  // Other optional fields
  toolsUsed?: string[];
  analytics?: AnalyticsData;
  evaluation?: EvaluationData;
};
```

## Configuration & Best Practices

### Configuration Options

| Option                        | Type               | Default          | Required | Description                       |
| ----------------------------- | ------------------ | ---------------- | -------- | --------------------------------- |
| `input.text`                  | `string`           | -                | Yes      | Topic/description (10-1000 chars) |
| `input.images`                | `Array<Buffer>`    | -                | No       | User-provided images              |
| `provider`                    | `string`           | `vertex`         | No       | AI provider for content planning  |
| `model`                       | `string`           | provider default | No       | Model for content planning        |
| `output.mode`                 | `string`           | `text`           | Yes      | Must be `"ppt"` for PPT output    |
| `output.ppt.pages`            | `number`           | `10`             | Yes      | Number of slides (5-50)           |
| `output.ppt.theme`            | `string`           | `modern`         | No       | Presentation theme                |
| `output.ppt.audience`         | `string`           | `general`        | No       | Target audience                   |
| `output.ppt.tone`             | `string`           | `professional`   | No       | Presentation tone                 |
| `output.ppt.generateAIImages` | `boolean`          | `false`          | No       | Enable AI image generation        |
| `output.ppt.aspectRatio`      | `string`           | `16:9`           | No       | Slide aspect ratio                |
| `output.ppt.outputPath`       | `string`           | auto-generated   | No       | Output file path                  |
| `output.ppt.logoPath`         | `Buffer \| string` | -                | No       | Logo for slides                   |

### Best Practices

#### 1. Prompt Engineering

```typescript
// ❌ Vague prompt
const vaguePrompt = "Make a presentation";

// ✅ Specific and detailed
const specificPrompt =
  "Create a presentation about Machine Learning in Healthcare: covering benefits, use cases (diagnosis, drug discovery, patient care), implementation challenges, and future outlook";

// ✅ Include structure hints
const structuredPrompt = `Product Launch Presentation for SmartWatch Pro:
- Start with value proposition
- Cover 5 key features
- Include competitor comparison
- Show pricing tiers
- End with launch timeline and CTA`;
```

#### 2. Audience & Tone Matching

```typescript
// Technical audience
const technicalPpt = await neurolink.generate({
  input: {
    text: "Kubernetes Architecture Deep Dive",
  },
  output: {
    mode: "ppt",
    ppt: {
      pages: 15,
      audience: "technical",
      tone: "educational",
      theme: "dark",
    },
  },
});

// Executive audience
const executivePpt = await neurolink.generate({
  input: {
    text: "Digital Transformation ROI Report",
  },
  output: {
    mode: "ppt",
    ppt: {
      pages: 10,
      audience: "business",
      tone: "professional",
      theme: "corporate",
    },
  },
});
```

#### 3. Image Strategy

```typescript
// AI-generated images for creative presentations
const creativePpt = await neurolink.generate({
  input: { text: "Future of Space Tourism" },
  output: {
    mode: "ppt",
    ppt: {
      pages: 12,
      theme: "creative",
      generateAIImages: true, // AI generates thematic images
    },
  },
});

// User-provided images for brand consistency
const brandPpt = await neurolink.generate({
  input: {
    text: "Annual Report 2025",
    images: [
      readFileSync("./brand/hero.jpg"),
      readFileSync("./brand/team.jpg"),
      readFileSync("./brand/office.jpg"),
    ],
  },
  output: {
    mode: "ppt",
    ppt: {
      pages: 20,
      generateAIImages: false,
      logoPath: "./brand/logo.png",
    },
  },
});
```

## Comprehensive Examples

### Example 1: Basic Presentation

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

async function generateBasicPresentation() {
  const result = await neurolink.generate({
    input: {
      text: "Introduction to Cloud Computing: Benefits, Types, and Best Practices",
    },
    provider: "vertex",
    model: "gemini-2.5-pro",
    output: {
      mode: "ppt",
      ppt: {
        pages: 10,
        theme: "modern",
        audience: "general",
        tone: "educational",
      },
    },
  });

  if (result.ppt) {
    console.log({
      filePath: result.ppt.filePath,
      totalSlides: result.ppt.totalSlides,
      provider: result.ppt.provider,
    });
  }
}
```

### Example 2: Business Presentation with Analytics

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

async function generateBusinessPresentation() {
  const result = await neurolink.generate({
    input: {
      text: `Q4 2025 Sales Performance Report:
        - Revenue: $12.5M (up 23% YoY)
        - New customers: 450
        - Customer retention: 94%
        - Top products: Enterprise Suite, Cloud Platform
        - Challenges: Supply chain, competition
        - 2026 targets: $18M revenue, 600 new customers`,
    },
    provider: "anthropic",
    model: "claude-3.5-sonnet",
    enableAnalytics: true,
    output: {
      mode: "ppt",
      ppt: {
        pages: 15,
        theme: "corporate",
        audience: "business",
        tone: "professional",
        outputPath: "./reports/q4-sales.pptx",
      },
    },
  });

  console.log("Analytics:", result.analytics);
  console.log("Presentation:", result.ppt);
}
```

### Example 3: Technical Documentation with Code

```typescript
import { NeuroLink } from "@juspay/neurolink";

const neurolink = new NeuroLink();

async function generateTechnicalDocs() {
  const result = await neurolink.generate({
    input: {
      text: `API Integration Guide for Payment Gateway:
        - Authentication (OAuth 2.0, API Keys)
        - Endpoints overview
        - Request/Response formats
        - Error handling
        - Code examples in TypeScript
        - Testing and sandbox environment
        - Security best practices`,
    },
    provider: "openai",
    model: "gpt-4o",
    output: {
      mode: "ppt",
      ppt: {
        pages: 12,
        theme: "dark",
        audience: "technical",
        tone: "educational",
      },
    },
  });

  return result.ppt;
}
```

### Example 4: Batch Presentation Generation

```typescript
import { NeuroLink } from "@juspay/neurolink";
import pLimit from "p-limit";

const neurolink = new NeuroLink();
const limit = pLimit(2); // Max 2 concurrent generations

const topics = [
  { topic: "AI in Healthcare", audience: "business" },
  { topic: "Machine Learning Basics", audience: "students" },
  { topic: "Cloud Architecture Patterns", audience: "technical" },
];

async function batchGenerate() {
  const results = await Promise.all(
    topics.map((item) =>
      limit(async () => {
        const result = await neurolink.generate({
          input: { text: item.topic },
          output: {
            mode: "ppt",
            ppt: {
              pages: 10,
              audience: item.audience as any,
              outputPath: `./presentations/${item.topic.replace(/\s+/g, "-").toLowerCase()}.pptx`,
            },
          },
        });
        return {
          topic: item.topic,
          filePath: result.ppt?.filePath,
          slides: result.ppt?.totalSlides,
        };
      }),
    ),
  );

  console.table(results);
}
```

### Example 5: Error Handling

```typescript
import { NeuroLink, NeuroLinkError, PPTError } from "@juspay/neurolink";

const neurolink = new NeuroLink();

async function generateWithErrorHandling(topic: string) {
  try {
    const result = await neurolink.generate({
      input: { text: topic },
      output: {
        mode: "ppt",
        ppt: {
          pages: 10,
          theme: "modern",
        },
      },
      timeout: 300000, // 5 minutes for PPT generation
    });

    return result.ppt;
  } catch (error) {
    if (error instanceof PPTError) {
      console.error(`PPT Error [${error.code}]:`, error.message);

      switch (error.code) {
        case "PPT_PLANNING_FAILED":
          console.error("Content planning failed - try a different prompt");
          break;
        case "PPT_INVALID_AI_RESPONSE":
          console.error(
            "AI returned invalid response - retry with different model",
          );
          break;
        case "PPT_IMAGE_GENERATION_FAILED":
          console.error("Image generation failed - try without AI images");
          break;
        case "PPT_ASSEMBLY_FAILED":
          console.error("PPTX assembly failed - check file permissions");
          break;
        case "PPT_FILE_WRITE_FAILED":
          console.error("File write failed - check disk space and permissions");
          break;
        case "PPT_TIMEOUT":
          console.error("Generation timed out - try fewer slides");
          break;
      }
    } else if (error instanceof NeuroLinkError) {
      console.error(`NeuroLink Error:`, error.message);
    }

    throw error;
  }
}
```

## Error Handling & Validation

### Validation Rules

| Parameter                | Validation          | Error Type | Example Message                            |
| ------------------------ | ------------------- | ---------- | ------------------------------------------ |
| `input.text`             | 10-1000 characters  | PPTError   | `Prompt must be 10-1000 characters`        |
| `output.ppt.pages`       | 5-50 slides         | PPTError   | `Pages must be between 5 and 50`           |
| `output.ppt.theme`       | Valid theme name    | PPTError   | `Invalid theme. Use: modern, corporate...` |
| `output.ppt.audience`    | Valid audience type | PPTError   | `Invalid audience type`                    |
| `output.ppt.tone`        | Valid tone type     | PPTError   | `Invalid tone type`                        |
| `output.ppt.aspectRatio` | `16:9` or `4:3`     | PPTError   | `Invalid aspect ratio`                     |

### Error Codes

```typescript
const PPT_ERROR_CODES = {
  PLANNING_FAILED: "PPT_PLANNING_FAILED",
  INVALID_AI_RESPONSE: "PPT_INVALID_AI_RESPONSE",
  IMAGE_GENERATION_FAILED: "PPT_IMAGE_GENERATION_FAILED",
  ASSEMBLY_FAILED: "PPT_ASSEMBLY_FAILED",
  FILE_WRITE_FAILED: "PPT_FILE_WRITE_FAILED",
  INVALID_INPUT: "PPT_INVALID_INPUT",
  TIMEOUT: "PPT_TIMEOUT",
};
```

## Troubleshooting

| Symptom                 | Cause                            | Solution                                     |
| ----------------------- | -------------------------------- | -------------------------------------------- |
| Content planning fails  | Invalid/vague prompt             | Use more specific, detailed prompts          |
| Slides have wrong types | Model not following instructions | Try advanced-tier model (claude-3.5, gpt-4o) |
| Images not generating   | `generateAIImages` not enabled   | Set `generateAIImages: true`                 |
| Images fail to generate | Missing Vertex AI credentials    | Configure `GOOGLE_APPLICATION_CREDENTIALS`   |
| File write fails        | Permission denied                | Check output directory permissions           |
| Generation times out    | Too many slides with images      | Reduce pages or disable AI images            |
| Bullet formatting wrong | AI not following format          | Use simplified slide types                   |
| Charts have no data     | AI didn't generate chart data    | Provide explicit data in prompt              |
| Logo not appearing      | Invalid logo path/buffer         | Verify logo file exists and is valid image   |
| Incorrect aspect ratio  | Using wrong dimension            | Ensure aspectRatio matches content design    |

### Debug Mode

```typescript
// Enable verbose logging
const neurolink = new NeuroLink({
  debug: true,
  logLevel: "verbose",
});

// Or via environment variable
// export NEUROLINK_DEBUG=true
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect, vi } from "vitest";
import { NeuroLink } from "@juspay/neurolink";

describe("PPT Generation", () => {
  it("should generate presentation with valid options", async () => {
    const neurolink = new NeuroLink();

    const result = await neurolink.generate({
      input: { text: "Test presentation about AI" },
      output: {
        mode: "ppt",
        ppt: {
          pages: 5,
          theme: "modern",
          audience: "general",
          tone: "professional",
        },
      },
    });

    expect(result.ppt).toBeDefined();
    expect(result.ppt?.filePath).toMatch(/\.pptx$/);
    expect(result.ppt?.totalSlides).toBeGreaterThanOrEqual(5);
    expect(result.ppt?.format).toBe("pptx");
  });

  it("should throw error for invalid page count", async () => {
    const neurolink = new NeuroLink();

    await expect(
      neurolink.generate({
        input: { text: "Test" },
        output: {
          mode: "ppt",
          ppt: { pages: 100 }, // Invalid: max is 50
        },
      }),
    ).rejects.toThrow();
  });
});
```

### Mock Strategy for CI/CD

```typescript
import { vi } from "vitest";

vi.mock("@juspay/neurolink", () => ({
  NeuroLink: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      content: "",
      provider: "vertex",
      model: "gemini-2.5-pro",
      ppt: {
        filePath: "./test-output.pptx",
        totalSlides: 10,
        format: "pptx",
        provider: "vertex",
        model: "gemini-2.5-pro",
        metadata: {
          theme: "modern",
          audience: "general",
          tone: "professional",
        },
      },
    }),
  })),
}));
```

## Limitations

| Limitation       | Description                     | Workaround                            |
| ---------------- | ------------------------------- | ------------------------------------- |
| Max slides       | 50 slides per presentation      | Split into multiple presentations     |
| Min slides       | 5 slides minimum                | Use at least 5 pages                  |
| Output format    | Only PPTX supported             | Convert with external tools if needed |
| Image generation | Only with Vertex AI / Google AI | Use user-provided images              |
| Custom templates | Not supported yet               | Use theme customization               |
| Animations       | Basic transitions only          | Edit in PowerPoint after generation   |
| Video embedding  | Not supported                   | Add videos manually after generation  |

## Performance Optimization

### Generation Time Estimates

| Configuration             | Estimated Time | Notes                      |
| ------------------------- | -------------- | -------------------------- |
| 10 slides, no images      | 15-30s         | Fast, text-only            |
| 10 slides, with AI images | 60-120s        | Image generation adds time |
| 20 slides, no images      | 30-60s         | Linear scaling             |
| 20 slides, with AI images | 120-240s       | Parallel image generation  |
| 50 slides, no images      | 60-120s        | Large presentation         |
| 50 slides, with AI images | 300-600s       | Consider splitting         |

### Optimization Tips

1. **Disable AI images** for faster generation: `generateAIImages: false`
2. **Use basic-tier models** for simple presentations: `gemini-2.5-flash`
3. **Provide user images** instead of AI generation for brand consistency
4. **Limit slide count** to what's actually needed
5. **Use structured prompts** for better AI content planning

## Related Features

- [Video Generation](./video-generation.md) – Generate videos from images
- [Multimodal Chat](./multimodal-chat.md) – Image and text processing
- [Office Documents](./office-documents.md) – Process existing PPTX files

## Implementation Files

| File                                               | Purpose                                          |
| -------------------------------------------------- | ------------------------------------------------ |
| `src/lib/features/ppt/presentationOrchestrator.ts` | Main orchestration pipeline                      |
| `src/lib/features/ppt/contentPlanner.ts`           | AI-powered content planning                      |
| `src/lib/features/ppt/slideGenerator.ts`           | Individual slide generation                      |
| `src/lib/features/ppt/slideRenderers.ts`           | Slide type rendering functions                   |
| `src/lib/features/ppt/constants.ts`                | Themes, prompts, and configuration               |
| `src/lib/features/ppt/types.ts`                    | Type definitions                                 |
| `src/lib/types/pptTypes.ts`                        | Public API types                                 |
| `src/lib/utils/parameterValidation.ts`             | Input validation: `validatePPTGenerationInput()` |

**Next:** [Video Generation](./video-generation.md) | [Multimodal Chat](./multimodal-chat.md)
