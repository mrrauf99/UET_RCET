import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { DepartmentTabs, type DepartmentTab } from "@/components/sections/DepartmentTabs";
import { FacultyList } from "@/components/sections/FacultyList";
import { LabList } from "@/components/sections/LabList";
import { TabContent } from "@/components/sections/TabContent";
import { Icon } from "@/components/ui/Icon";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { departmentBannerImages, departmentCardImages } from "@/content/department-media";
import { facultyPhotos } from "@/content/faculty-photos";
import { getDepartment, getDepartments, getDepartmentTabs, getImage, getPage, getPrograms } from "@/lib/content";
import { parseChairmanMessage, parseFaculty, parseLabs } from "@/lib/department-content";
import { shortDepartmentName } from "@/lib/format";
import { ADMISSIONS_PORTAL_URL } from "@/lib/site";
import type { ImageAsset } from "@/types/content";

export const dynamicParams = false;

export async function generateStaticParams() {
  const departments = await getDepartments();
  return departments.map((department) => ({ slug: department.id }));
}

export async function generateMetadata({ params }: PageProps<"/departments/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const department = await getDepartment(slug);
  if (!department) return {};
  return {
    title: shortDepartmentName(department.name),
    description: department.description?.slice(0, 155) ?? `${department.name} at RCET Gujranwala.`,
    alternates: { canonical: `/departments/${slug}` },
  };
}

const levelLabel = { undergraduate: "Undergraduate", postgraduate: "Postgraduate" } as const;

// Names on the landing page drop titles the faculty list keeps ("Dr. X" vs "Engr. Dr. X").
const bareName = (name: string) => name.replace(/^((engr|dr|mr|ms|mrs|prof)\.?\s+)+/i, "").toLowerCase();

function TabHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="text-2xl">
      {children}
    </h2>
  );
}

export default async function DepartmentPage({ params }: PageProps<"/departments/[slug]">) {
  const { slug } = await params;
  const department = await getDepartment(slug);
  if (!department) notFound();

  const [programs, tabs, photo, landing] = await Promise.all([
    getPrograms({ departmentId: slug }),
    getDepartmentTabs(slug),
    getImage(departmentCardImages[slug] ?? department.imageId),
    getPage(`departments-${slug}`),
  ]);
  const tab = (suffix: string) => tabs.find((item) => item.id === `${slug}-${suffix}`);
  const faculty = tab("faculty");
  const people = faculty ? parseFaculty(faculty.originalBody) : [];
  const labsTab = tab("labs");
  const labs = labsTab ? parseLabs(labsTab.originalBody) : [];
  const labImages = await Promise.all((labsTab?.imageIds ?? []).map((id) => getImage(id)));
  const labPhotos = new Map(
    labImages
      .filter((image): image is ImageAsset => image !== null)
      .map((image) => [image.purpose.replace(/^Laboratory photograph:\s*/, "").toLowerCase(), image]),
  );
  const chairman = landing ? parseChairmanMessage(landing.originalBody) : null;
  const chairmanPhoto = chairman
    ? Object.entries(facultyPhotos).find(([name]) => bareName(name) === bareName(chairman.name))?.[1]
    : undefined;
  const plos = tab("plos")?.originalBody;
  const peos = tab("peos")?.originalBody;

  const panels: (DepartmentTab | null)[] = [
    {
      id: "introduction",
      label: "Introduction",
      content: (
        <div className="flex flex-col gap-16">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            <div>
              <TabHeading id="introduction-title">Introduction</TabHeading>
              <p className="mt-6 max-w-prose text-lg">
                {department.description ?? "No introduction has been published yet."}
              </p>
            </div>
            {photo ? <ImageFrame image={photo} ratio="4/3" chamfer sizes="(min-width: 1024px) 40vw, 100vw" /> : null}
          </div>
          {chairman ? (
            <figure className="reveal surface grid gap-8 rounded-lg border border-border p-6 shadow-sm sm:p-10 md:grid-cols-[auto_1fr] md:items-start">
              {chairmanPhoto ? (
                // The name is printed in the caption, so the portrait is decorative.
                <Image
                  src={chairmanPhoto}
                  alt=""
                  width={160}
                  height={160}
                  className="size-32 rounded-full border border-border object-cover md:size-40"
                />
              ) : null}
              <div>
                <h3 className="text-xl">Chairman’s message</h3>
                <Icon name="quote" className="mt-6 size-9 text-accent" />
                <blockquote className="pull-quote mt-3 flex max-w-prose flex-col gap-4 text-lg text-fg-muted">
                  {chairman.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </blockquote>
                <figcaption className="mt-6 border-t border-border pt-4 font-bold">
                  {chairman.name}
                  <span className="block text-sm font-normal text-fg-muted">Chairman, {shortDepartmentName(department.name)}</span>
                </figcaption>
              </div>
            </figure>
          ) : null}
        </div>
      ),
    },
    {
      id: "programs",
      label: "Programs Offered",
      content: (
        <>
          <TabHeading id="programs-title">Programs offered</TabHeading>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {programs.map((program) => (
              <li key={program.id} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                <span className="text-lg font-bold">{program.name}</span>
                <span className="text-sm text-fg-muted">
                  {levelLabel[program.level]}
                  {program.duration ? ` · ${program.duration}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-prose text-fg-muted">
            Check current program availability, dates and eligibility on the UET admissions portal.
          </p>
          <LinkButton href={ADMISSIONS_PORTAL_URL} external className="mt-4">
            Apply via UET portal
          </LinkButton>
        </>
      ),
    },
    people.length > 0
      ? {
          id: "faculty",
          label: "Faculty",
          content: (
            <>
              <TabHeading id="faculty-title">Faculty</TabHeading>
              <div className="mt-6">
                <FacultyList people={people} />
              </div>
            </>
          ),
        }
      : null,
    labsTab
      ? {
          id: "labs",
          label: "Labs",
          content: (
            <>
              <TabHeading id="labs-title">Laboratories</TabHeading>
              <div className="mt-6">
                <LabList labs={labs} photos={labPhotos} />
              </div>
            </>
          ),
        }
      : null,
    plos
      ? {
          id: "plos",
          label: "PLOs",
          content: (
            <>
              <TabHeading id="plos-title">Program learning outcomes</TabHeading>
              <div className="mt-6">
                <TabContent body={plos} />
              </div>
            </>
          ),
        }
      : null,
    peos
      ? {
          id: "peos",
          label: "PEOs",
          content: (
            <>
              <TabHeading id="peos-title">Program educational objectives</TabHeading>
              <div className="mt-6">
                <TabContent body={peos} />
              </div>
            </>
          ),
        }
      : null,
  ];

  return (
    <PageShell
      title={shortDepartmentName(department.name)}
      banner={departmentBannerImages[slug] ?? null}
      contained={false}
      hideBannerTitle
    >
      <DepartmentTabs label={`${shortDepartmentName(department.name)} sections`} tabs={panels.filter((panel) => panel !== null)} />
    </PageShell>
  );
}
