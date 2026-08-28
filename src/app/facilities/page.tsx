import type { Metadata } from "next";
import Image from "next/image";
import { PageSection, PageShell } from "@/components/layout/PageShell";
import { StudentSocietyList } from "@/components/sections/StudentSocietyList";
import { getDepartments, getFacilities, getImage, getStudentSocieties } from "@/lib/content";
import { capitalize, shortDepartmentName } from "@/lib/format";
import type { Facility, ImageAsset } from "@/types/content";

export const metadata: Metadata = {
  title: "Facilities",
  description: "Library, auditorium, sports grounds, teaching laboratories and student societies at RCET Gujranwala.",
  alternates: { canonical: "/facilities" },
};

const CAMPUS_IDS = ["central-library", "auditorium", "mosque"];
const SPORT_IDS = ["cricket-ground", "football-field", "basketball-court", "badminton-court", "gymnasium"];

type Photos = ReadonlyMap<string, ImageAsset>;

function FacilityGrid({ items, photos }: { items: readonly Facility[]; photos: Photos }) {
  const withPhoto = items.filter((item) => photos.has(item.id));
  const withoutPhoto = items.filter((item) => !photos.has(item.id));
  return (
    <div className="flex flex-col gap-8">
      {withPhoto.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {withPhoto.map((item) => (
            <li key={item.id} className="reveal overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <div className="relative aspect-4/3">
                <Image
                  src={photos.get(item.id)?.approvedLocalPath ?? ""}
                  alt={photos.get(item.id)?.approvedAlt ?? ""}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <p className="p-4 font-bold">{capitalize(item.name)}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {withoutPhoto.length > 0 ? <NameList items={withoutPhoto} /> : null}
    </div>
  );
}

function NameList({ items }: { items: readonly Facility[] }) {
  return (
    <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="flex min-h-12 items-center gap-3 border-b border-border py-2">
          <span aria-hidden="true" className="size-2 shrink-0 rotate-45 bg-accent" />
          {capitalize(item.name)}
        </li>
      ))}
    </ul>
  );
}

export default async function FacilitiesPage() {
  const [facilities, departments, societies] = await Promise.all([getFacilities(), getDepartments(), getStudentSocieties()]);
  const photoEntries = await Promise.all(
    facilities.map(async (facility) => [facility.id, facility.imageIds[0] ? await getImage(facility.imageIds[0]) : null] as const),
  );
  const photos: Photos = new Map(
    photoEntries.filter((entry): entry is readonly [string, ImageAsset] => entry[1] !== null),
  );
  const pick = (ids: readonly string[]) => facilities.filter((facility) => ids.includes(facility.id));
  const labsByDepartment = departments
    .map((department) => ({
      department,
      labs: facilities.filter((facility) => facility.id.startsWith(`${department.id}-`) && /\blab\b/i.test(facility.name)),
    }))
    .filter((group) => group.labs.length > 0);

  return (
    <PageShell
      title="Facilities"
      lead="Shared campus spaces, sports grounds and the teaching laboratories run by each department."
    >
      <PageSection id="campus" title="Campus">
        <FacilityGrid items={pick(CAMPUS_IDS)} photos={photos} />
      </PageSection>
      <PageSection id="sport" title="Sport">
        <FacilityGrid items={pick(SPORT_IDS)} photos={photos} />
      </PageSection>
      <PageSection id="laboratories" title="Laboratories">
        <div className="flex flex-col gap-10">
          {labsByDepartment.map(({ department, labs }) => (
            <div key={department.id}>
              <h3 className="text-xl">{shortDepartmentName(department.name)}</h3>
              <div className="mt-4">
                <FacilityGrid items={labs} photos={photos} />
              </div>
            </div>
          ))}
        </div>
      </PageSection>
      <PageSection id="societies" title="Student societies">
        <StudentSocietyList societies={societies} />
      </PageSection>
    </PageShell>
  );
}
