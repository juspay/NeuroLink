/**
 * Rule 8: No "Types" or "Type" suffix in filenames under src/lib/types/.
 *
 * The folder IS the types folder — redundant suffixes violate the convention.
 *   src/lib/types/mcp.ts          ✓
 *   src/lib/types/mcpTypes.ts     ✗  (redundant "Types")
 *   src/lib/types/mcpType.ts      ✗  (redundant "Type")
 *   src/lib/types/index.ts        ✓  (allowed — canonical barrel name)
 *
 * Implementation: ESLint visits every file in the project. For each file
 * matching the types-folder pattern, check the basename. Runs once per file
 * via a cheap `Program` listener.
 */

"use strict";

function violatesSuffixRule(filename) {
  const normalized = filename.replace(/\\/g, "/");
  // Must be in src/lib/types/ at the top level (not a subfolder)
  const m = normalized.match(/\/src\/lib\/types\/([^/]+)\.tsx?$/);
  if (!m) return null;
  const basename = m[1];
  if (basename === "index") return null;
  // Forbidden: name ending in "Types" or "Type" (case-sensitive, as TS convention)
  if (/(Types|Type)$/.test(basename)) return basename;
  return null;
}

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        'Type filenames inside src/lib/types/ must not carry a redundant "Types"/"Type" suffix (Critical Rule 8).',
    },
    schema: [],
    messages: {
      badSuffix:
        'File "{{name}}.ts" has redundant suffix. The folder IS the types folder — rename to drop the "Types"/"Type" suffix. See CLAUDE.md Critical Rule 8.',
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const bad = violatesSuffixRule(filename);
    if (!bad) return {};

    return {
      Program(node) {
        context.report({ node, messageId: "badSuffix", data: { name: bad } });
      },
    };
  },
};
