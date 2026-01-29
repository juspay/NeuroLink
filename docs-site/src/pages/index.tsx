import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import type React from "react";
import styles from "./index.module.css";

// Icons as inline SVGs for performance
const ProviderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const ToolsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const StreamIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const CodeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="16,18 22,12 16,6" />
    <polyline points="8,6 2,12 8,18" />
  </svg>
);

const TerminalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="4,17 10,11 4,5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const ImageIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21,15 16,10 5,21" />
  </svg>
);

const MemoryIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
    <path d="M6 2v4M10 2v4M14 2v4M18 2v4M6 18v4M10 18v4M14 18v4M18 18v4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.arrowIcon}
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12,5 19,12 12,19" />
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

// Feature data
const features = [
  {
    icon: <ProviderIcon />,
    title: "13 AI Providers",
    description:
      "OpenAI, Anthropic, Google AI, Vertex, Bedrock, Azure, Mistral, and more. Switch providers with a single parameter change.",
  },
  {
    icon: <ToolsIcon />,
    title: "58+ MCP Tools",
    description:
      "Full Model Context Protocol support with GitHub, PostgreSQL, Slack, and 55+ external tool integrations.",
  },
  {
    icon: <StreamIcon />,
    title: "Streaming & Real-time",
    description:
      "First-class streaming support with real-time token delivery, partial responses, and backpressure handling.",
  },
  {
    icon: <ShieldIcon />,
    title: "Enterprise Security",
    description:
      "SOC2, HIPAA, GDPR compliant. Human-in-the-loop workflows, audit trails, and zero credential logging.",
  },
  {
    icon: <ImageIcon />,
    title: "Multimodal Support",
    description:
      "Native support for images, PDFs, and CSV files with automatic file type detection and provider adaptation.",
  },
  {
    icon: <MemoryIcon />,
    title: "Conversation Memory",
    description:
      "Redis-backed distributed memory with session export, auto-summarization, and graceful failover.",
  },
];

// Provider logos/names
const providers = [
  "OpenAI",
  "Anthropic",
  "Google AI",
  "Vertex AI",
  "AWS Bedrock",
  "Azure OpenAI",
  "Mistral",
  "LiteLLM",
  "Ollama",
  "Hugging Face",
  "SageMaker",
];

// Stats
const stats = [
  { value: "13", label: "AI Providers" },
  { value: "100+", label: "Models" },
  { value: "58+", label: "MCP Tools" },
  { value: "35-40%", label: "Cost Savings" },
];

function HeroSection() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroBackground}>
        <div className={styles.heroGlow} />
      </div>
      <div className={styles.heroContent}>
        <div className={styles.badge}>
          <span className={styles.badgeText}>Production-Ready</span>
          <span className={styles.badgeDivider}>|</span>
          <span className={styles.badgeVersion}>v8.35+</span>
        </div>
        <h1 className={styles.heroTitle}>
          The Enterprise AI SDK
          <br />
          <span className={styles.heroTitleAccent}>
            for Production Applications
          </span>
        </h1>
        <p className={styles.heroSubtitle}>
          Universal AI integration platform unifying 13 providers and 100+
          models under one consistent API. Battle-tested at enterprise scale.
          Ships as TypeScript SDK and professional CLI.
        </p>
        <div className={styles.heroCta}>
          <Link to="/docs/getting-started" className={styles.ctaPrimary}>
            Get Started
            <ArrowRightIcon />
          </Link>
          <Link to="/docs" className={styles.ctaSecondary}>
            Documentation
          </Link>
        </div>
        <div className={styles.heroInstall}>
          <code className={styles.installCode}>
            <span className={styles.installPrefix}>$</span>
            npm install @juspay/neurolink
          </code>
        </div>
      </div>
    </header>
  );
}

function StatsSection() {
  return (
    <section className={styles.stats}>
      <div className={styles.statsContainer}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statItem}>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Everything You Need for AI Development
          </h2>
          <p className={styles.sectionSubtitle}>
            From rapid prototyping to enterprise deployment, NeuroLink provides
            the complete toolkit for building production-ready AI applications.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <div key={feature.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProvidersSection() {
  return (
    <section className={styles.providers}>
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>One API. Every Provider.</h2>
          <p className={styles.sectionSubtitle}>
            Switch between providers instantly. No code changes, no migrations,
            no vendor lock-in.
          </p>
        </div>
        <div className={styles.providersList}>
          {providers.map((provider) => (
            <div key={provider} className={styles.providerBadge}>
              {provider}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CodeExampleSection() {
  return (
    <section className={styles.codeExample}>
      <div className={styles.sectionContainer}>
        <div className={styles.codeExampleGrid}>
          <div className={styles.codeExampleContent}>
            <h2 className={styles.sectionTitle}>Developer-First Experience</h2>
            <p className={styles.sectionSubtitle}>
              Full TypeScript support with IntelliSense, streaming responses,
              tool calling, and framework integrations for Next.js, SvelteKit,
              and Express.
            </p>
            <ul className={styles.checkList}>
              <li>
                <CheckIcon /> Full TypeScript type safety
              </li>
              <li>
                <CheckIcon /> Streaming with real-time tokens
              </li>
              <li>
                <CheckIcon /> MCP tool integration
              </li>
              <li>
                <CheckIcon /> Structured output with Zod schemas
              </li>
              <li>
                <CheckIcon /> Extended thinking support
              </li>
            </ul>
            <div className={styles.codeExampleCta}>
              <Link to="/docs/sdk" className={styles.ctaSecondary}>
                <CodeIcon />
                SDK Reference
              </Link>
              <Link to="/docs/cli" className={styles.ctaSecondary}>
                <TerminalIcon />
                CLI Guide
              </Link>
            </div>
          </div>
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
              <span className={styles.codeFileName}>example.ts</span>
            </div>
            <pre className={styles.codeContent}>
              <code>{`import { NeuroLink } from "@juspay/neurolink";

const ai = new NeuroLink({
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
});

// Stream responses with tool calling
const stream = await ai.stream({
  prompt: "Analyze this codebase",
  tools: ["github", "readFile"],
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.cta}>
      <div className={styles.sectionContainer}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Build?</h2>
          <p className={styles.ctaSubtitle}>
            Start building production-ready AI applications in minutes. Open
            source and battle-tested at enterprise scale.
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/docs/getting-started" className={styles.ctaPrimary}>
              Get Started
              <ArrowRightIcon />
            </Link>
            <a
              href="https://github.com/juspay/neurolink"
              className={styles.ctaSecondary}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Enterprise AI SDK" description={siteConfig.tagline}>
      <main className={styles.main}>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ProvidersSection />
        <CodeExampleSection />
        <CTASection />
      </main>
    </Layout>
  );
}
