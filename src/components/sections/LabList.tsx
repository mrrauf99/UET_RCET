import Image from "next/image";
import type { Lab } from "@/lib/department-content";
import type { ImageAsset } from "@/types/content";

// Long inventories collapse so the grid stays scannable; the rest is one click away.
const PREVIEW_COUNT = 5;

export function LabList({ labs, photos }: { labs: readonly Lab[]; photos: ReadonlyMap<string, ImageAsset> }) {
  if (labs.length === 0) return <p className="text-fg-muted">No information has been published yet.</p>;

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {labs.map((lab) => {
        const photo = photos.get(lab.name.toLowerCase());
        const preview = lab.equipment.slice(0, PREVIEW_COUNT);
        const rest = lab.equipment.slice(PREVIEW_COUNT);
        return (
          <li key={lab.name} className="reveal flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
            {photo?.approvedLocalPath ? (
              <div className="relative aspect-video bg-band">
                <Image
                  src={photo.approvedLocalPath}
                  alt={photo.approvedAlt ?? ""}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              // Most labs have no approved photo yet; a brick rule keeps cards consistent without empty image boxes.
              <div aria-hidden="true" className="h-1 bg-accent" />
            )}
            <div className="flex flex-1 flex-col gap-3 p-6">
              <h3 className="text-xl">{lab.name}</h3>
              {lab.equipment.length > 0 ? (
                <>
                  <p className="text-sm font-bold text-fg-muted">
                    {lab.equipment.length === 1 ? "1 item of equipment" : `${lab.equipment.length} items of equipment`}
                  </p>
                  <ul className="flex flex-col gap-1.5 text-fg-muted">
                    {preview.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rotate-45 bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {rest.length > 0 ? (
                    <details className="group mt-auto">
                      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 font-bold text-link underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">Show {rest.length} more</span>
                        <span className="hidden group-open:inline">Show less</span>
                      </summary>
                      <ul className="pop-in flex flex-col gap-1.5 text-fg-muted">
                        {rest.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rotate-45 bg-accent" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
