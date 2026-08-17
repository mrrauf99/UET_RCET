import type { Metadata } from "next";
import Link from "next/link";
import { PageSection, PageShell } from "@/components/layout/PageShell";
import { FacultyList } from "@/components/sections/FacultyList";
import { getDepartments, getDepartmentTabs } from "@/lib/content";
import { parseFaculty } from "@/lib/department-content";
import { shortDepartmentName } from "@/lib/format";

export const metadata: Metadata = {
  title: "Faculty",
  description: "Teaching staff of each RCET department, with designations, qualifications and contact emails.",
  alternates: { canonical: "/faculty" },
};

export default async function FacultyPage() {
  const departments = await getDepartments();
  const groups = await Promise.all(
    departments.map(async (department) => {
      const tab = (await getDepartmentTabs(department.id)).find((item) => item.id === `${department.id}-faculty`);
      return { department, people: tab ? parseFaculty(tab.originalBody) : [] };
    }),
  );

  return (
    <PageShell
      title="Faculty"
      lead="Teaching staff listed by department, as published by each department."
    >
      <nav aria-label="Departments on this page">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {groups.map(({ department }) => (
            <li key={department.id}>
              <Link href={`#${department.id}`} className="inline-flex min-h-11 items-center text-link underline">
                {shortDepartmentName(department.name)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {groups.map(({ department, people }) => (
        <PageSection key={department.id} id={department.id} title={shortDepartmentName(department.name)}>
          {people.length > 0 ? (
            <FacultyList people={people} />
          ) : (
            <p className="text-fg-muted">This department has not published a faculty list yet.</p>
          )}
        </PageSection>
      ))}
    </PageShell>
  );
}
