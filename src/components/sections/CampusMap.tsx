import type { UniversityInfo } from "@/types/content";

export function CampusMap({ university, heading }: { university: UniversityInfo; heading: string }) {
  const query = encodeURIComponent(university.address);

  return (
    <section id="visit" aria-labelledby="visit-title" className="min-w-0">
      <h2 id="visit-title" className="border-b-2 border-on-band pb-3 font-display text-xl font-semibold">{heading}</h2>
      <div className="mt-3 h-56 overflow-hidden bg-surface sm:h-60">
        {/* Keyless embed; lazy loading keeps Google's scripts off the critical path until the map nears the viewport.
            No sandbox: the cross-origin map needs scripts, same-origin storage and popups to work. */}
        {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
        <iframe
          src={`https://www.google.com/maps?q=${query}&z=15&output=embed`}
          title={`Map showing ${university.name}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="size-full border-0"
        />
      </div>
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${query}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:no-underline">
        Get directions<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </section>
  );
}
