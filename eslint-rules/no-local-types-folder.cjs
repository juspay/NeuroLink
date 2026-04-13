/**
 * Rule 11: No local `types/` directories anywhere except `src/lib/types/`.
 * Rule 11b: No local `types.ts` file anywhere outside `src/lib/types/`.
 *
 * All type declarations belong in the canonical folder. Scattered `types/`
 * folders and ad-hoc `types.ts` files cause discoverability problems and
 * usually contain rule-12 violations.
 *
 * Implementation: each file's own path reveals whether it lives in a
 * forbidden location. ESLint visits every file, so the union of per-file
 * checks equals a filesystem-wide check.
 */

"use strict";

const CANONICAL = "/src/lib/types/";

function normalize(fp) {
  return fp.replace(/\\/g, "/");
}

function checkPath(filename) {
  const fp = normalize(filename);

  // Rule 11b: a file literally named `types.ts` (or `types.tsx`) anywhere
  // other than inside the canonical folder.
  const fileMatch = fp.match(/\/([^/]+)\.tsx?$/);
  if (fileMatch && fileMatch[1] === "types" && !fp.includes(CANONICAL)) {
    return {
      rule: "11b",
      reason: `File named "types.ts" outside the canonical folder`,
    };
  }

  // Rule 11: file lives inside a `/types/` directory that isn't
  // `/src/lib/types/`. We only flag files strictly under such a directory.
  const typesDirIdx = fp.indexOf("/types/");
  if (typesDirIdx === -1) return null;
  if (fp.includes(CANONICAL)) return null;
  // Also exempt .svelte-kit, node_modules, dist, and test fixtures — not our concern
  if (fp.includes("/node_modules/")) return null;
  if (fp.includes("/.svelte-kit/")) return null;
  if (fp.includes("/dist/")) return null;

  return {
    rule: "11",
    reason: `File lives inside a "types/" directory outside src/lib/types/`,
  };
}

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Types must live only in src/lib/types/ (Critical Rules 11 and 11b).",
    },
    schema: [],
    messages: {
      wrongLocation:
        "{{reason}}. Move to src/lib/types/ (CLAUDE.md Critical Rule {{rule}}).",
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const result = checkPath(filename);
    if (!result) return {};

    return {
      Program(node) {
        context.report({
          node,
          messageId: "wrongLocation",
          data: { rule: result.rule, reason: result.reason },
        });
      },
    };
  },
};
