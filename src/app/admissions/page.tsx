import type { Metadata } from "next";
import { PageSection, PageShell } from "@/components/layout/PageShell";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDepartments, getPrograms, getUniversity } from "@/lib/content";
import { levelLabels, shortDepartmentName, telHref } from "@/lib/format";
import { ADMISSIONS_PORTAL_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Admissions",
  description: "How to apply to undergraduate and postgraduate programs at RCET Gujranwala through UET Lahore.",
  alternates: { canonical: "/admissions" },
};

export default async function AdmissionsPage() {
  const [university, programs, departments] = await Promise.all([getUniversity(), getPrograms(), getDepartments()]);
  const names = new Map(departments.map((department) => [department.id, shortDepartmentName(department.name)]));

  return (
    <PageShell
      title="Admissions"
      lead="Applications for RCET programs are made through the UET Lahore admissions portal."
    >
      <PageSection id="how-to-apply" title="How to apply">
        <ol className="flex max-w-prose list-decimal flex-col gap-3 ps-6 text-lg">
          <li>Choose a program from the list below.</li>
          <li>Check current dates, eligibility and requirements on the UET Lahore admissions portal.</li>
          <li>Apply via UET portal.</li>
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href={ADMISSIONS_PORTAL_URL} external size="lg">
            Apply via UET portal
          </LinkButton>
          <LinkButton href="#contact" variant="secondary" size="lg">
            Contact the college
          </LinkButton>
        </div>
      </PageSection>

      <PageSection id="programs" title="Programs at RCET">
        <ul className="divide-y divide-border border-y border-border">
          {programs.map((program) => (
            <li key={program.id} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
              <span className="text-lg font-bold">{program.name}</span>
              <span className="text-sm text-fg-muted">
                {names.get(program.departmentId)} · {levelLabels[program.level]}
              </span>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="contact" title="Questions">
        <p className="max-w-prose text-lg">
          Call <a href={telHref(university.phone)} className="text-link underline">{university.phone}</a>{" "}
          or email <a href={`mailto:${university.email}`} className="text-link underline">{university.email}</a>.
        </p>
      </PageSection>
    </PageShell>
  );
}
