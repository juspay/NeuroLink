/**
 * Rule 13: Barrel-only imports for internal types.
 *
 * Code outside `src/lib/types/` must import internal types from the barrel
 * (`.../types/index.js` or `.../types`), never from specific type files
 * (`.../types/rag.js`, `.../types/mcp.js`).
 *
 * Detects:
 *   - `import type { X } from "../types/rag.js"`             → error
 *   - `import { X } from "../types/rag.js"`                  → error (even for values)
 *   - `import { type X } from "../types/rag.js"`             → error
 *   - `import("../types/rag.js").X`  (dynamic type imports)  → error
 *   - `from "../../types/mcp"` (no extension)                → error
 *   - `from "~/types/mcp.js"`  (path-alias, if configured)   → not checked; adjust if needed
 *
 * Allows:
 *   - `from ".../types/index.js"`                 (the barrel)
 *   - `from ".../types/index"`
 *   - `from ".../types"`                          (dir import, resolves to index)
 *   - Files inside `src/lib/types/` (they import from each other).
 *   - External packages (`from "zod"`, `from "@ai-sdk/provider"`, etc.).
 */

"use strict";

/** Returns true if the importing file is inside src/lib/types/. */
function isInsideTypesFolder(filename) {
  const normalized = filename.replace(/\\/g, "/");
  return /\/src\/lib\/types\//.test(normalized);
}

/**
 * Returns true if the import path points to a specific file inside a types/
 * folder (not the barrel).
 */
function isDirectTypeFileImport(importPath) {
  // Only consider relative imports
  if (!importPath.startsWith(".")) return false;

  // Must have `/types/` segment
  const m = importPath.match(/\/types\/([^/]+?)(?:\.[jt]sx?)?$/);
  if (!m) return false;

  const last = m[1];
  // Allow barrel forms:
  //   .../types/index      .../types/index.js     .../types/index.ts
  if (last === "index") return false;

  return true;
}

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require barrel imports for internal types from src/lib/types/ (Critical Rule 13).",
    },
    schema: [],
    messages: {
      useBarrel:
        "Import internal types via the barrel (`{{barrel}}`) instead of `{{source}}`. See CLAUDE.md Critical Rule 13.",
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    if (isInsideTypesFolder(filename)) {
      return {};
    }

    function toBarrel(source) {
      // Replace the final path component (e.g., rag.js / mcp) with index.js.
      return source.replace(/\/types\/[^/]+$/, "/types/index.js");
    }

    function check(node, source) {
      if (typeof source !== "string") return;
      if (!isDirectTypeFileImport(source)) return;
      context.report({
        node,
        messageId: "useBarrel",
        data: { barrel: toBarrel(source), source },
      });
    }

    return {
      ImportDeclaration(node) {
        check(node.source, node.source.value);
      },

      // `import("../types/rag.js").X` — dynamic type imports.
      TSImportType(node) {
        // node.argument is a TSLiteralType wrapping a Literal string in current parsers.
        const arg = node.argument;
        if (!arg) return;
        if (
          arg.type === "TSLiteralType" &&
          arg.literal &&
          typeof arg.literal.value === "string"
        ) {
          check(arg, arg.literal.value);
        } else if (arg.type === "Literal" && typeof arg.value === "string") {
          check(arg, arg.value);
        }
      },

      // `export { X } from "../types/rag.js"` — re-export also violates.
      // (The type-reexport rule catches type-only cases; this catches the rest.)
      ExportNamedDeclaration(node) {
        if (node.source) check(node.source, node.source.value);
      },

      ExportAllDeclaration(node) {
        if (node.source) check(node.source, node.source.value);
      },
    };
  },
};
