import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import type { ContentLink, FooterContent, UniversityInfo } from "@/types/content";
import { GirihPattern } from "./GirihPattern";

// Evaluated at build time; pages are statically generated.
const currentYear = new Date().getFullYear();

interface SiteFooterProps {
  footer: FooterContent;
  university: UniversityInfo;
  exploreLinks: readonly ContentLink[];
  campusLinks: readonly ContentLink[];
}

function FooterLinkList({ links }: { links: readonly ContentLink[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-1">
      {links.map((link) => (
        <li key={link.href}>
          {link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 hover:underline"
            >
              {link.label}
              <Icon name="external" className="size-4 text-on-band-muted" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Link href={link.href} className="inline-flex min-h-11 items-center hover:underline">
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter({ footer, university, exploreLinks, campusLinks }: SiteFooterProps) {
  const phoneHref = `tel:+92${university.phone.replace(/\D/g, "").replace(/^0/, "")}`;

  return (
    <footer className="band relative overflow-hidden">
      <GirihPattern className="absolute inset-y-0 right-0 hidden h-full w-1/3 text-on-band-muted lg:block [mask-image:linear-gradient(to_left,black,transparent)]" />
      <Container width="wide" className="relative py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-4">
              <Image src="/images/rcet-logo.png" alt="" width={72} height={72} className="size-18 shrink-0" />
              <p className="font-display text-xl font-semibold">{university.name}</p>
            </div>
            <p className="mt-2 max-w-sm text-on-band-muted">{university.affiliation}</p>
            <h2 id="footer-contact" className="mt-8 font-display text-base font-semibold">
              {footer.contactHeading}
            </h2>
            <address className="mt-4 flex flex-col gap-3 not-italic">
              <span className="flex gap-2">
                <Icon name="map-pin" className="mt-0.5 size-5 text-on-band-muted" />
                {university.address}
              </span>
              <a href={phoneHref} className="flex min-h-11 items-center gap-2 hover:underline">
                <Icon name="phone" className="size-5 text-on-band-muted" />
                {university.phone}
              </a>
              <a href={`mailto:${university.email}`} className="flex min-h-11 items-center gap-2 hover:underline">
                <Icon name="mail" className="size-5 text-on-band-muted" />
                {university.email}
              </a>
            </address>
          </div>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="font-display text-base font-semibold">
              Explore RCET
            </h2>
            <FooterLinkList links={exploreLinks} />
          </nav>

          <nav aria-labelledby="footer-important">
            <h2 id="footer-important" className="font-display text-base font-semibold">
              {footer.linksHeading}
            </h2>
            <FooterLinkList links={footer.links} />
          </nav>

          <nav aria-labelledby="footer-campuses">
            <h2 id="footer-campuses" className="font-display text-base font-semibold">
              UET campuses
            </h2>
            <FooterLinkList links={campusLinks} />
          </nav>
        </div>

        <div className="mt-16 flex flex-col items-center gap-2 border-t border-on-band/20 pt-6 text-center text-sm text-on-band-muted md:flex-row md:justify-between md:text-start">
          <p>
            © {university.establishedYear}–{currentYear} {university.name}, {university.location}.
          </p>
          <p>
            Developed by{" "}
            <a
              href="https://abdulrauf.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-on-band underline underline-offset-4 hover:no-underline"
            >
              Abdul Rauf
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            (CS Student)
          </p>
        </div>
      </Container>
    </footer>
  );
}
