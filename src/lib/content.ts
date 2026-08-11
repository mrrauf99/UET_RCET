import { departments, faculties, programs } from "@/content/academics";
import { facilities } from "@/content/facilities";
import { callsToAction, campusLife, coordinatorMessage, footer, hero, introduction, stats } from "@/content/homepage";
import { imageAssets } from "@/content/images";
import { newsItems } from "@/content/news";
import { departmentTabs, extractedPages } from "@/content/pages";
import { footerExploreLinks, primaryNavigation, uetCampusLinks } from "@/content/site-navigation";
import { studentSocieties } from "@/content/student-life";
import { university } from "@/content/university";
import type { Department, ImageAsset, NewsItem, Program } from "@/types/content";

// Async on purpose: the signatures stay stable when this file is swapped for a CMS client.

export async function getUniversity() {
  return university;
}

export async function getNavigation() {
  return { primary: primaryNavigation, footerExplore: footerExploreLinks, uetCampuses: uetCampusLinks };
}

export async function getFooter() {
  return footer;
}

export async function getHomepage() {
  return { hero, introduction, coordinatorMessage, campusLife, stats, callsToAction };
}

export async function getDepartments(): Promise<readonly Department[]> {
  return departments;
}

export async function getDepartment(slug: string): Promise<Department | null> {
  return departments.find((department) => department.id === slug) ?? null;
}

export async function getDepartmentTabs(departmentId: string) {
  return departmentTabs.filter((tab) => tab.id.startsWith(`${departmentId}-`));
}

export async function getFaculties() {
  return faculties;
}

export async function getPrograms(filter: { departmentId?: string; level?: Program["level"] } = {}): Promise<readonly Program[]> {
  return programs.filter(
    (program) =>
      (!filter.departmentId || program.departmentId === filter.departmentId) &&
      (!filter.level || program.level === filter.level),
  );
}

export async function getFacilities() {
  return facilities;
}

export async function getNews(filter: { kind?: NewsItem["kind"]; limit?: number } = {}): Promise<readonly NewsItem[]> {
  const items = newsItems.filter((item) => !filter.kind || item.kind === filter.kind);
  return filter.limit ? items.slice(0, filter.limit) : items;
}

/** Returns null until an image has an approved local copy; old-site URLs are never served. */
export async function getImage(id: string): Promise<ImageAsset | null> {
  const asset = imageAssets.find((image) => image.id === id);
  return asset?.approvedLocalPath ? asset : null;
}

export async function getPage(id: string) {
  return extractedPages.find((page) => page.id === id) ?? null;
}

export async function getStudentSocieties() {
  return studentSocieties;
}
