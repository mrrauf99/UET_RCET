import type { Metadata } from "next";
import { PageSection, PageShell } from "@/components/layout/PageShell";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { getImage, getPage, getUniversity } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description: "History, vision and mission of Rachna College of Engineering and Technology, Gujranwala.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [university, about, campus] = await Promise.all([getUniversity(), getPage("about-us"), getImage("image-006")]);
  // The extracted body begins with the page's own "About Us" title.
  const paragraphs = (about?.originalBody ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== "About Us");

  return (
    <PageShell
      title={`About ${university.shortName}`}
      lead={`${university.affiliation.replace(/\.$/, "")}, established in ${university.establishedYear}.`}
    >
      <PageSection id="history" title="Our history">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div className="flex max-w-prose flex-col gap-4 text-lg">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
          {campus ? <ImageFrame image={campus} ratio="4/5" chamfer sizes="(min-width: 1024px) 40vw, 100vw" /> : null}
        </div>
      </PageSection>
      <PageSection id="vision" title="Vision">
        <p className="max-w-prose text-lg">{university.vision}</p>
      </PageSection>
      <PageSection id="mission" title="Mission">
        <p className="max-w-prose text-lg">{university.mission}</p>
      </PageSection>
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/departments" icon="arrow-right">
          Our departments
        </LinkButton>
        <LinkButton href="#footer-contact" variant="secondary">
          Contact us
        </LinkButton>
      </div>
    </PageShell>
  );
}
