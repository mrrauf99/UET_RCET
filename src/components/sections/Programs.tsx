import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LinkButton } from "@/components/ui/LinkButton";
import { ADMISSIONS_PORTAL_URL } from "@/lib/site";
import type { Department, Program } from "@/types/content";
import { shortDepartmentName } from "@/lib/format";
import { ProgramFinder } from "./ProgramFinder";

interface ProgramsProps {
  programs: readonly Program[];
  departments: readonly Department[];
}

export function Programs({ programs, departments }: ProgramsProps) {
  const names = new Map(departments.map((department) => [department.id, shortDepartmentName(department.name)]));
  const rows = programs.map((program) => ({ program, departmentName: names.get(program.departmentId) ?? "" }));

  return (
    <section id="programs" aria-labelledby="programs-title" className="py-(--space-section)">
      <Container>
        <SectionHeading
          id="programs-title"
          title="Programs"
          lead="Explore RCET’s listed undergraduate and postgraduate programs. Select a program to view its department; check current availability and eligibility on the UET portal."
        />
        <ProgramFinder rows={rows} departments={departments.map((d) => ({ id: d.id, name: shortDepartmentName(d.name) }))} />
        <LinkButton href={ADMISSIONS_PORTAL_URL} external className="mt-8">Apply via UET portal</LinkButton>
      </Container>
    </section>
  );
}
