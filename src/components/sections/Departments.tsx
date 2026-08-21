import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { shortDepartmentName } from "@/lib/format";
import type { Department, Facility, ImageAsset, Program } from "@/types/content";

interface DepartmentsProps {
  departments: readonly Department[];
  programs: readonly Program[];
  facilities: readonly Facility[];
  images: ReadonlyMap<string, ImageAsset>;
}

export function Departments({ departments, programs, facilities, images }: DepartmentsProps) {
  return (
    <section aria-labelledby="departments-title" className="bg-muted py-(--space-section)">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="departments-title" title="Departments" lead="Explore the programs and laboratories listed by RCET's five departments." />
          <LinkButton href="/departments" variant="secondary" icon="arrow-right">All departments</LinkButton>
        </div>
        <ul className="mt-10 divide-y divide-border-strong border-y border-border-strong">
          {departments.map((department) => {
            const listedPrograms = programs.filter((program) => program.departmentId === department.id);
            const labs = facilities.filter((facility) => facility.source.sourceUrl === department.href && /\blab\b/i.test(facility.name));
            return (
              <li key={department.id} className="grid gap-6 py-8 md:grid-cols-[15rem_1fr] lg:gap-10">
                <ImageFrame image={images.get(department.id) ?? null} ratio="4/3" chamfer sizes="(min-width: 768px) 240px, 100vw" className="rounded-md" />
                <div>
                  <h3 className="text-2xl">
                    <Link href={`/departments/${department.id}`} className="inline-flex min-h-11 items-center decoration-accent underline-offset-4 hover:underline">{shortDepartmentName(department.name)}</Link>
                  </h3>
                  <div className="mt-5 grid gap-6 lg:grid-cols-2">
                    <div>
                      <h4 className="font-body text-base font-bold">Listed programs</h4>
                      <ul className="mt-2 space-y-2 text-fg-muted">
                        {listedPrograms.map((program) => <li key={program.id}>{program.name}</li>)}
                      </ul>
                    </div>
                    {labs.length > 0 ? (
                      <div>
                        <h4 className="font-body text-base font-bold">Laboratories</h4>
                        <p className="mt-2 text-fg-muted">{labs.slice(0, 2).map((lab) => lab.name).join("; ")}.</p>
                        <Link href={`/departments/${department.id}#labs`} className="mt-2 inline-flex min-h-11 items-center text-link underline underline-offset-4">View {labs.length === 1 ? "the listed lab" : `all ${labs.length} listed labs`}</Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
