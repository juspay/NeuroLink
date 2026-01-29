import type { PrismTheme } from "prism-react-renderer";

/**
 * NeuroLink Light Theme for Prism
 * Based on GitHub Light with NeuroLink branding
 */
const theme: PrismTheme = {
  plain: {
    color: "#24292e",
    backgroundColor: "#f6f8fa",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: {
        color: "#6a737d",
        fontStyle: "italic",
      },
    },
    {
      types: ["namespace"],
      style: {
        opacity: 0.7,
      },
    },
    {
      types: ["string", "attr-value"],
      style: {
        color: "#0a7d3e", // NeuroLink green for strings
      },
    },
    {
      types: ["punctuation", "operator"],
      style: {
        color: "#24292e",
      },
    },
    {
      types: [
        "entity",
        "url",
        "symbol",
        "number",
        "boolean",
        "variable",
        "constant",
        "property",
        "regex",
        "inserted", // Overridden below for diff blocks
      ],
      style: {
        color: "#005cc5",
      },
    },
    {
      types: ["atrule", "keyword", "attr-name"],
      style: {
        color: "#d73a49", // Red for keywords
      },
    },
    {
      types: ["selector"],
      style: {
        color: "#22863a",
      },
    },
    {
      types: ["function"],
      style: {
        color: "#6f42c1", // Purple for functions
      },
    },
    {
      types: ["function-variable"],
      style: {
        color: "#6f42c1",
      },
    },
    {
      types: ["tag"],
      style: {
        color: "#22863a",
      },
    },
    {
      types: ["builtin", "char"],
      style: {
        color: "#005cc5",
      },
    },
    {
      types: ["class-name"],
      style: {
        color: "#6f42c1",
      },
    },
    {
      types: ["important", "bold"],
      style: {
        fontWeight: "bold",
      },
    },
    {
      types: ["italic"],
      style: {
        fontStyle: "italic",
      },
    },
    // Diff highlighting
    {
      types: ["inserted"],
      style: {
        color: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
      },
    },
    {
      types: ["deleted"],
      style: {
        color: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
      },
    },
  ],
};

export default theme;
