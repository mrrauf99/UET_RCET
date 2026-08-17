import { parseTabBody } from "@/lib/department-content";

export function TabContent({ body }: { body: string }) {
  const blocks = parseTabBody(body);
  if (blocks.length === 0) return <p className="text-fg-muted">No information has been published yet.</p>;

  return (
    <div className="flex max-w-prose flex-col gap-3">
      {blocks.map((block) => {
        if (block.kind === "heading") {
          return (
            <h3 key={block.id} className="mt-4 text-xl first:mt-0">
              {block.text}
            </h3>
          );
        }
        if (block.kind === "paragraph") return <p key={block.id}>{block.text}</p>;
        return (
          // Wide outcome tables scroll inside their own region; keyboard users need focus on it to scroll (WCAG 2.1.1).
          <section
            key={block.id}
            aria-label="Table (scrolls sideways on small screens)"
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable regions must be focusable
            tabIndex={0}
            className="-mx-(--space-gutter) overflow-x-auto px-(--space-gutter)"
          >
            <table className="w-full min-w-[36rem] border-collapse text-start text-sm">
              <thead>
                <tr>
                  {block.header.map((cell) => (
                    <th key={cell} scope="col" className="border-b-2 border-fg py-2 pe-4 text-start font-bold">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join("|")} className="border-b border-border">
                    {row.map((cell, cellIndex) =>
                      cellIndex === 0 ? (
                        <th key={`${block.header[cellIndex] ?? "row"}:${cell}`} scope="row" className="py-2 pe-4 text-start align-top font-bold whitespace-nowrap">
                          {cell}
                        </th>
                      ) : (
                        <td key={`${block.header[cellIndex] ?? cellIndex}:${cell}`} className="py-2 pe-4 align-top">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
