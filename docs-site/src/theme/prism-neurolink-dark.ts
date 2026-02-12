import type { PrismTheme } from "prism-react-renderer";

/**
 * NeuroLink Dark Theme for Prism
 * Based on One Dark with NeuroLink branding
 */
const theme: PrismTheme = {
  plain: {
    color: "#abb2bf",
    backgroundColor: "#0a0a0a",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: {
        color: "#5c6370",
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
        color: "#4ade80", // NeuroLink green for strings (brighter for dark mode)
      },
    },
    {
      types: ["punctuation", "operator"],
      style: {
        color: "#abb2bf",
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
        color: "#4db5e8", // Blue (NeuroLink accent)
      },
    },
    {
      types: ["atrule", "keyword", "attr-name"],
      style: {
        color: "#f87171", // Red for keywords
      },
    },
    {
      types: ["selector"],
      style: {
        color: "#c678dd",
      },
    },
    {
      types: ["function"],
      style: {
        color: "#c084fc", // Purple for functions
      },
    },
    {
      types: ["function-variable"],
      style: {
        color: "#c084fc",
      },
    },
    {
      types: ["tag"],
      style: {
        color: "#c084fc",
      },
    },
    {
      types: ["builtin", "char"],
      style: {
        color: "#4db5e8",
      },
    },
    {
      types: ["class-name"],
      style: {
        color: "#e5c07b",
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
        color: "#4ade80",
        backgroundColor: "rgba(34, 197, 94, 0.15)",
      },
    },
    {
      types: ["deleted"],
      style: {
        color: "#f87171",
        backgroundColor: "rgba(239, 68, 68, 0.15)",
      },
    },
  ],
};

export default theme;
