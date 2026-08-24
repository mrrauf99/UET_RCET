import type { ContentLink, NavItem } from "../types/content";
import { departments } from "./academics";
import { campusLinks } from "./navigation";

const departmentLinks: readonly NavItem[] = departments.map((department) => ({
  id: department.id,
  kind: "link",
  label: department.name.replace(/^Department of /, ""),
  href: `/departments/${department.id}`,
  external: false,
}));

export const primaryNavigation = [
  { id: "home", kind: "link", label: "Home", href: "/", external: false },
  { id: "admissions", kind: "link", label: "Admissions", href: "/admissions", external: false },
  {
    id: "departments",
    kind: "group",
    label: "Departments",
    children: [
      ...departmentLinks,
      { id: "all-departments", kind: "link", label: "All departments", href: "/departments", external: false },
    ],
  },
  { id: "faculty", kind: "link", label: "Faculty", href: "/faculty", external: false },
  { id: "facilities", kind: "link", label: "Facilities", href: "/facilities", external: false },
  { id: "news", kind: "link", label: "News", href: "/news", external: false },
  { id: "about", kind: "link", label: "About Us", href: "/about", external: false },
] satisfies readonly NavItem[];

export const footerExploreLinks = [
  { label: "About RCET", href: "/about", external: false },
  { label: "Departments", href: "/departments", external: false },
  { label: "Admissions", href: "/admissions", external: false },
  { label: "Facilities", href: "/facilities", external: false },
  { label: "Faculty", href: "/faculty", external: false },
  { label: "Alumni", href: "/alumni", external: false },
  { label: "News and events", href: "/news", external: false },
  { label: "RachnaGPT", href: "/rachna-gpt", external: false },
] satisfies readonly ContentLink[];

export const uetCampusLinks: readonly ContentLink[] = campusLinks.flatMap((item) =>
  item.kind === "link" ? [{ label: item.label.replace(/^Ksk\b/, "KSK"), href: item.href, external: item.external }] : [],
);
