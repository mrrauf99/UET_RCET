import type { Metadata } from "next";
import { GirihPattern } from "@/components/layout/GirihPattern";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { departmentCardImages } from "@/content/department-media";
import { getDepartments, getImage, getPrograms } from "@/lib/content";
import { firstSentence, shortDepartmentName } from "@/lib/format";

export const metadata: Metadata = {
  title: "Departments",
  description: "The five academic departments of RCET Gujranwala and the programs each one offers.",
  alternates: { canonical: "/departments" },
};

export default async function DepartmentsPage() {
  const [departments, programs] = await Promise.all([getDepartments(), getPrograms()]);
  const images = await Promise.all(departments.map((department) => getImage(departmentCardImages[department.id] ?? department.imageId)));

  return (
    <PageShell
      title="Departments"
      lead="Five departments teach engineering, computing, sciences and management on the Gujranwala campus."
    >
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department, index) => {
          const image = images[index];
          const summary = firstSentence(department.description);
          const count = programs.filter((program) => program.departmentId === department.id).length;
          return (
            <Card
              key={department.id}
              as="li"
              title={shortDepartmentName(department.name)}
              titleLevel={2}
              href={`/departments/${department.id}`}
              ratio="16/9"
              media={
                image?.approvedLocalPath
                  ? { src: image.approvedLocalPath, alt: "", sizes: "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" }
                  : null
              }
              placeholder={<GirihPattern className="absolute inset-0 size-full text-on-band-muted" />}
              meta={count === 1 ? "1 program" : `${count} programs`}
            >
              {summary ? <p className="line-clamp-3">{summary}</p> : null}
            </Card>
          );
        })}
      </ul>
    </PageShell>
  );
}
