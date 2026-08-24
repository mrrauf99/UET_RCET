import type { MetadataRoute } from "next";
import { getDepartments } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

const STATIC_ROUTES = ["", "/about", "/departments", "/admissions", "/faculty", "/facilities", "/alumni", "/news", "/rachna-gpt"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const departments = await getDepartments();
  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE_URL}${route}`,
      changeFrequency: route === "/news" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route === "/admissions" ? 0.9 : 0.7,
    })),
    ...departments.map((department) => ({
      url: `${SITE_URL}/departments/${department.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
