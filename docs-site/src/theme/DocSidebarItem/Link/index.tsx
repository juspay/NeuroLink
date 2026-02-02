import React from "react";
import Link from "@theme-original/DocSidebarItem/Link";
import type LinkType from "@theme/DocSidebarItem/Link";
import type { WrapperProps } from "@docusaurus/types";
import {
  parseBadgeFromLabel,
  SidebarBadge,
} from "@site/src/components/SidebarBadge";

type Props = WrapperProps<typeof LinkType>;

export default function LinkWrapper(props: Props): React.ReactElement {
  const { item } = props;
  const { cleanLabel, badge } = parseBadgeFromLabel(item.label);

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
    <div className="sidebar-link-wrapper">
      <div>
        <Link {...modifiedProps} />
      </div>
      {badge && (
        <span className="sidebar-badge-right">
          <SidebarBadge type={badge} />
        </span>
      )}
    </div>
  );
}
