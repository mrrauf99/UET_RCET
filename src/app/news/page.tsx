import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Icon } from "@/components/ui/Icon";
import { getNews } from "@/lib/content";

export const metadata: Metadata = {
  title: "News and events",
  description: "News and upcoming events at Rachna College of Engineering and Technology, Gujranwala.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const items = await getNews();

  return (
    <PageShell title="News and events">
      {items.length === 0 ? (
        <p className="text-lg">No news or events have been published yet.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item) => {
            const external = /^https?:\/\//.test(item.href);
            return (
              <li key={item.id} className="flex flex-col gap-2 py-6">
                <span className="text-sm font-bold text-fg-muted">{item.kind === "event" ? "Event" : "News"}</span>
                <h2 className="text-xl">
                  <a href={item.href} className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
                    {item.title}
                    {external ? (
                      <>
                        <Icon name="external" className="size-4" />
                        <span className="sr-only"> (external site)</span>
                      </>
                    ) : null}
                  </a>
                </h2>
                {item.summary ? <p className="max-w-prose text-fg-muted">{item.summary}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
