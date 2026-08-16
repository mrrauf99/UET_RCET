import { Container } from "@/components/ui/Container";
import type { Stat } from "@/types/content";

export interface Highlight {
  id: string;
  value: string;
  label: string;
  detail: string;
}

interface CampusHighlightsProps {
  /** Facts derived from verified content at build time. */
  highlights: readonly Highlight[];
  /** Approved institutional statistics; the list stays hidden until any exist. */
  stats: readonly Stat[];
}

export function CampusHighlights({ highlights, stats }: CampusHighlightsProps) {
  return (
    <section aria-labelledby="highlights-title" className="band py-(--space-section)">
      <Container className="grid gap-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 id="highlights-title" className="text-3xl">
            Campus highlights
          </h2>
          <p className="mt-4 max-w-prose text-lg text-on-band-muted">
            One campus in Gujranwala, part of the UET Lahore system, with teaching labs for every department.
          </p>
        </div>
        <dl className="grid gap-px overflow-hidden rounded-md bg-on-band/20 sm:grid-cols-2">
          {[
            ...highlights,
            ...stats.map((stat) => ({
              id: stat.id,
              value: `${stat.value.toLocaleString("en")}${stat.unit ?? ""}`,
              label: stat.label,
              detail: "",
            })),
          ].map((item) => (
            <div key={item.id} className="reveal flex flex-col gap-2 bg-band p-6 md:p-8">
              <dt className="order-2 font-bold">{item.label}</dt>
              <dd className="order-1 font-display text-3xl font-semibold tabular-nums">{item.value}</dd>
              {item.detail ? <dd className="order-3 text-sm text-on-band-muted">{item.detail}</dd> : null}
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
