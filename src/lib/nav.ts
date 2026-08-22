export function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
