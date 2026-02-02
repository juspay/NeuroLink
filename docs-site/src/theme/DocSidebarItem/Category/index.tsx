import React from "react";
import Category from "@theme-original/DocSidebarItem/Category";
import type CategoryType from "@theme/DocSidebarItem/Category";
import type { WrapperProps } from "@docusaurus/types";
import {
  parseBadgeFromLabel,
  SidebarBadge,
  type BadgeType,
} from "@site/src/components/SidebarBadge";

type Props = WrapperProps<typeof CategoryType>;

/**
 * Check if any items in a category (recursively) have a badge marker.
 * This enables badge propagation - parent categories show badges if any child has one.
 */
function hasChildWithBadge(items: Props["item"]["items"]): BadgeType | null {
  for (const item of items) {
    if (item.type === "link") {
      const { badge } = parseBadgeFromLabel(item.label);
      if (badge) return badge;
    } else if (item.type === "category" && item.items) {
      // Check if this category label has a badge
      const { badge: categoryBadge } = parseBadgeFromLabel(item.label);
      if (categoryBadge) return categoryBadge;

      // Recursively check children
      const childBadge = hasChildWithBadge(item.items);
      if (childBadge) return childBadge;
    }
  }
  return null;
}

export default function CategoryWrapper(props: Props): React.ReactElement {
  const { item } = props;
  const { cleanLabel, badge: labelBadge } = parseBadgeFromLabel(item.label);

  // Check if any children have badges (for propagation)
  const childBadge = item.items ? hasChildWithBadge(item.items) : null;

  // Priority: explicit label badge > child badge (propagation)
  const badge: BadgeType | null = labelBadge || childBadge;

  // Create a modified item with the clean label
  const modifiedItem = {
    ...item,
    label: cleanLabel,
  };

  // Create modified props with the cleaned item
  const modifiedProps = {
    ...props,
    item: modifiedItem,
  };

  return (
    <div className="sidebar-category-wrapper">
      <div>
        <Category {...modifiedProps} />
      </div>
      {badge && (
        <span className="sidebar-badge-right">
          <SidebarBadge type={badge} />
        </span>
      )}
    </div>
  );
}
