import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import prismDarkTheme from "./src/theme/prism-neurolink-dark";
// Custom Prism themes will be imported from local files
import prismLightTheme from "./src/theme/prism-neurolink-light";
// Redirects configuration for legacy paths and SEO
import { redirectsPluginConfig } from "./config/redirects";

const config: Config = {
  title: "NeuroLink",
  tagline:
    "Enterprise AI Development Platform - Universal provider support, MCP integration, and professional CLI",
  favicon: "img/favicon.svg",

  // Production URL - custom domain
  url: "https://docs.neurolink.ink",
  baseUrl: "/",

  organizationName: "juspay",
  projectName: "neurolink",

  onBrokenLinks: process.env.NODE_ENV === "production" ? "throw" : "warn",
  onBrokenAnchors: process.env.NODE_ENV === "production" ? "throw" : "warn",

  // Custom fields for Algolia and analytics
  customFields: {
    algoliaAppId: process.env.ALGOLIA_APP_ID,
    algoliaSearchApiKey: process.env.ALGOLIA_SEARCH_API_KEY,
    posthogApiKey: process.env.POSTHOG_API_KEY,
    posthogHost: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
  },

  // Head tags for performance and verification
  headTags: [
    {
      tagName: "meta",
      attributes: {
        name: "algolia-site-verification",
        content: "6D4D16FE88B771D9",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: "anonymous",
      },
    },
  ],

  markdown: {
    format: "mdx",
    mermaid: false,
    mdx1Compat: {
      comments: true,
      admonitions: true,
      headingIds: true,
    },
    hooks: {
      onBrokenMarkdownImages: "warn",
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  // Production optimizations disabled - requires @docusaurus/faster package
  // ...(process.env.NODE_ENV === "production" && {
  //   future: {
  //     experimental_faster: true,
  //   },
  // }),

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "docs", // Docs at /docs, root redirects to getting-started
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/juspay/neurolink/tree/release/docs-site/",
          exclude: [
            "**/api/**",
            "**/cli-guide.md",
            "**/package-overrides.md",
            "**/mcp/concurrency.md",
            "**/features/interactive-cli.md",
            "**/mastra-features-implementation/**",
          ],
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          breadcrumbs: true,
          // Versioning configuration
          lastVersion: "current",
          versions: {
            current: {
              label: "Next",
              path: "",
              banner: "none",
            },
          },
          // Only include current version in development for faster builds
          onlyIncludeVersions:
            process.env.NODE_ENV === "development" ? ["current"] : undefined,
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
        sitemap: {
          lastmod: "date",
          changefreq: "weekly",
          priority: 0.5,
          filename: "sitemap.xml",
        },
        ...(process.env.NODE_ENV === "production" &&
          process.env.GA_TRACKING_ID && {
            gtag: {
              trackingID: process.env.GA_TRACKING_ID,
              anonymizeIP: true,
            },
          }),
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/neurolink-social-card.png",

    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },

    navbar: {
      title: "NeuroLink",
      logo: {
        alt: "NeuroLink Logo",
        src: "img/logo-light.svg",
        srcDark: "img/logo-dark.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          to: "/docs/sdk",
          label: "SDK",
          position: "left",
        },
        {
          to: "/docs/cli",
          label: "CLI",
          position: "left",
        },
        {
          to: "/docs/examples",
          label: "Examples",
          position: "left",
        },
        {
          href: "https://www.npmjs.com/package/@juspay/neurolink",
          label: "NPM",
          position: "right",
        },
        {
          href: "https://github.com/juspay/neurolink",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
        },
      ],
    },

    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            { label: "Getting Started", to: "/docs/getting-started" },
            { label: "SDK Reference", to: "/docs/sdk" },
            { label: "CLI Guide", to: "/docs/cli" },
            { label: "Examples", to: "/docs/examples" },
          ],
        },
        {
          title: "Features",
          items: [
            {
              label: "MCP Integration",
              to: "/docs/features/mcp-tools-showcase",
            },
            { label: "Multimodal", to: "/docs/features/multimodal" },
          ],
        },
        {
          title: "Community",
          items: [
            { label: "GitHub", href: "https://github.com/juspay/neurolink" },
            {
              label: "GitHub Discussions",
              href: "https://github.com/juspay/neurolink/discussions",
            },
            {
              label: "NPM Package",
              href: "https://www.npmjs.com/package/@juspay/neurolink",
            },
          ],
        },
        {
          title: "More",
          items: [
            { label: "Juspay", href: "https://juspay.io" },
            {
              label: "Contributing",
              href: "https://github.com/juspay/neurolink/blob/release/CONTRIBUTING.md",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Juspay Technologies.`,
    },

    prism: {
      theme: prismLightTheme,
      darkTheme: prismDarkTheme,
      additionalLanguages: [
        "bash",
        "diff",
        "json",
        "typescript",
        "javascript",
        "yaml",
      ],
    },

    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,

  // Plugins configuration
  plugins: [
    // Client-side redirects for legacy paths, SEO, and URL migrations
    redirectsPluginConfig,

    // NOTE: docusaurus-plugin-new-docs is available but disabled.
    // Location: plugins/docusaurus-plugin-new-docs/index.js
    // Purpose: Auto-detect new/modified docs via Git history for "NEW" badges.
    // Status: Disabled due to Docusaurus 3.9.2 generatedFilesDir compatibility issue.
    // Workaround: Badge detection handled via frontmatter tags and sync-docs.ts.
    // To re-enable: Uncomment the plugin config below after fixing generatedFilesDir issue.
    // See: https://github.com/facebook/docusaurus/issues (search generatedFilesDir)
  ],
};

export default config;
