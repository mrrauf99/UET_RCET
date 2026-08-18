import type { Metadata } from "next";
import { PageSection, PageShell } from "@/components/layout/PageShell";
import { LinkButton } from "@/components/ui/LinkButton";
import { getUniversity } from "@/lib/content";

export const metadata: Metadata = {
  title: "Alumni",
  description: "Stay connected with Rachna College of Engineering and Technology after graduation.",
  alternates: { canonical: "/alumni" },
};

export default async function AlumniPage() {
  const university = await getUniversity();

  return (
    <PageShell
      title="Alumni"
      lead="Information and contacts for RCET graduates."
    >
      <PageSection id="stay-in-touch" title="Stay in touch">
        <p className="max-w-prose text-lg">
          Graduates can share news or update their contact details by emailing{" "}
          <a href={`mailto:${university.email}`} className="text-link underline">
            {university.email}
          </a>
          .
        </p>
        <LinkButton href="#footer-contact" variant="secondary" className="mt-6">
          Contact the college
        </LinkButton>
      </PageSection>
    </PageShell>
  );
}
