/**
 * Rule 7: Zero `interface` declarations.
 *
 * All type definitions must use `type` aliases. The only exception is
 * `declare global { interface Window { ... } }` where TypeScript requires
 * interface for declaration merging.
 *
 * Detects:
 *   - `interface X {}`                    → error
 *   - `export interface X {}`             → error
 *   - `export default interface X {}`     → error
 *   - Interfaces inside namespaces        → error
 *   - Indented / commented variants       → error (AST is whitespace-immune)
 *
 * Exempts:
 *   - `declare global { interface Window { ... } }`
 *   - `declare global { interface <anything> { ... } }` (any declaration merging)
 */

"use strict";

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `interface` declarations; use `type` aliases instead (Critical Rule 7).",
    },
    schema: [],
    messages: {
      noInterface:
        "Use `type {{name}} = {...}` instead of `interface {{name}}`. See CLAUDE.md Critical Rule 7.",
    },
  },

  create(context) {
    /**
     * Walk up ancestors to see if we're inside `declare global { ... }`.
     */
    function isInsideDeclareGlobal(node) {
      let parent = node.parent;
      while (parent) {
        if (
          parent.type === "TSModuleDeclaration" &&
          parent.declare === true &&
          parent.global === true
        ) {
          return true;
        }
        // Also handle the `declare global` form which parses as TSModuleDeclaration
        // with id.name === "global"
        if (
          parent.type === "TSModuleDeclaration" &&
          parent.id &&
          parent.id.name === "global"
        ) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    return {
      TSInterfaceDeclaration(node) {
        if (isInsideDeclareGlobal(node)) {
          return;
        }
        context.report({
          node,
          messageId: "noInterface",
          data: { name: node.id.name },
        });
      },
    };
  },
};
