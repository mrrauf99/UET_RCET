import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { telHref } from "@/lib/format";
import { ADMISSIONS_PORTAL_URL } from "@/lib/site";
import type { UniversityInfo } from "@/types/content";

export function Admissions({ university }: { university: UniversityInfo }) {
  const phone = university.source.status === "observed" ? university.phone : null;
  const phoneHref = phone ? telHref(phone) : null;

  return (
    <section id="admissions" aria-labelledby="admissions-title" className="band py-(--space-section)">
      <Container>
        <h2 id="admissions-title" className="text-3xl">Apply via UET portal</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          <li className="border-t border-on-band-muted pt-5">
            <span aria-hidden="true" className="font-display text-2xl text-on-band-muted">1</span>
            <h3 className="mt-3 text-xl">Choose a program</h3>
            <a href="#programs" className="mt-3 inline-flex min-h-11 items-center text-on-band underline underline-offset-4">Explore RCET programs</a>
          </li>
          <li className="border-t border-on-band-muted pt-5">
            <span aria-hidden="true" className="font-display text-2xl text-on-band-muted">2</span>
            <h3 className="mt-3 text-xl">Check dates and eligibility</h3>
            <p className="mt-3 text-on-band-muted">Check current dates, eligibility and requirements on the UET admissions portal.</p>
          </li>
          <li className="border-t border-on-band-muted pt-5">
            <span aria-hidden="true" className="font-display text-2xl text-on-band-muted">3</span>
            <h3 className="mt-3 text-xl">Apply through UET portal</h3>
            <p className="mt-3 text-on-band-muted">Follow the application instructions on the portal for your chosen program.</p>
          </li>
        </ol>
        <div className="mt-10 flex flex-wrap gap-4">
          <LinkButton href={ADMISSIONS_PORTAL_URL} external variant="on-band">Go to UET admissions portal</LinkButton>
          {phoneHref ? <LinkButton href={phoneHref} icon="phone">Call RCET: {phone}</LinkButton> : null}
        </div>
      </Container>
    </section>
  );
}
