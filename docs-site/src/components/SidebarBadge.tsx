import type { ReactElement } from "react";
import styles from "./SidebarBadge.module.css";

export type BadgeType = "new" | "beta" | "deprecated" | "experimental";

interface SidebarBadgeProps {
  type: BadgeType;
}

const badgeLabels: Record<BadgeType, string> = {
  new: "new",
  beta: "beta",
  deprecated: "deprecated",
  experimental: "exp",
};

export function SidebarBadge({ type }: SidebarBadgeProps): ReactElement {
  return (
    <span className={`${styles.badge} ${styles[type]}`}>
      {badgeLabels[type]}
    </span>
  );
}

// Regex patterns to match badge markers in labels
const BADGE_PATTERNS: Record<BadgeType, RegExp> = {
  new: /\s*\[new\]\s*/i,
  beta: /\s*\[beta\]\s*/i,
  deprecated: /\s*\[deprecated\]\s*/i,
  experimental: /\s*\[experimental\]\s*/i,
};

interface ParsedLabel {
  cleanLabel: string;
  badge: BadgeType | null;
}

/**
 * Parses a sidebar label to extract any badge markers.
 * Supports: [new], [beta], [deprecated], [experimental]
 *
 * Example:
 * - "My Feature [new]" -> { cleanLabel: "My Feature", badge: "new" }
 * - "Old API [deprecated]" -> { cleanLabel: "Old API", badge: "deprecated" }
 *
 * Note: Badge priority is determined by iteration order of BADGE_PATTERNS.
 * If multiple badges are present in a label, only the first match is returned.
 * Current priority: new > beta > deprecated > experimental
 */
export function parseBadgeFromLabel(label: string): ParsedLabel {
  for (const [badgeType, pattern] of Object.entries(BADGE_PATTERNS)) {
    if (pattern.test(label)) {
      return {
        cleanLabel: label.replace(pattern, "").trim(),
        badge: badgeType as BadgeType,
      };
    }
  }

  return {
    cleanLabel: label,
    badge: null,
  };
}

export default SidebarBadge;
