import type { NavItem } from "@/types/content";

export function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// A parent link like /departments also prefix-matches its children; only the most specific sibling is current.
export function isCurrentAmong(pathname: string, href: string, siblingHrefs: readonly string[]) {
  return (
    isCurrentPath(pathname, href) &&
    !siblingHrefs.some((other) => other.length > href.length && isCurrentPath(pathname, other))
  );
}

export const childHrefs = (children: readonly NavItem[]) =>
  children.flatMap((child) => (child.kind === "link" ? [child.href] : []));
