/**
 * Rule 10: The barrel `src/lib/types/index.ts` must only contain
 * `export * from "./file.js"` lines.
 *
 * Forbidden inside the barrel:
 *   - `export type { X } from "./file.js"`    (selective)
 *   - `export { X as Y } from "./file.js"`    (aliased)
 *   - `export type X = ...`                   (local definition)
 *   - Any re-export that isn't `export *`
 *
 * Allows:
 *   - `export * from "./xxx.js"`
 *   - Comments
 */

"use strict";

function isBarrelFile(filename) {
  const normalized = filename.replace(/\\/g, "/");
  return /\/src\/lib\/types\/index\.ts$/.test(normalized);
}

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "The types barrel must use `export *` only (Critical Rule 10).",
    },
    schema: [],
    messages: {
      selectiveExport:
        "The types barrel must use `export *` only. Found a selective / aliased export. See CLAUDE.md Critical Rule 10.",
      localDefinition:
        "The types barrel must not define types locally; move to a type file and `export *` it. See CLAUDE.md Critical Rule 10.",
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    if (!isBarrelFile(filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        context.report({ node, messageId: "selectiveExport" });
      },
      TSTypeAliasDeclaration(node) {
        context.report({ node, messageId: "localDefinition" });
      },
      TSInterfaceDeclaration(node) {
        context.report({ node, messageId: "localDefinition" });
      },
    };
  },
};
