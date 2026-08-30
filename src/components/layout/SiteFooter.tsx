import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { telHref } from "@/lib/format";
import type { ContentLink, FooterContent, UniversityInfo } from "@/types/content";
import { CampusMap } from "@/components/sections/CampusMap";

// Evaluated at build time; pages are statically generated.
const currentYear = new Date().getFullYear();
const copyrightStartYear = 2003;

interface SiteFooterProps {
  footer: FooterContent;
  university: UniversityInfo;
}

function FooterLinkList({ links }: { links: readonly ContentLink[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-1">
      {links.map((link) => (
        <li key={link.href}>
          {link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 hover:underline"
            >
              <Icon name="chevron-down" className="size-4 -rotate-90" />
              {link.label}
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

export function SiteFooter({ footer, university }: SiteFooterProps) {
  const phoneHref = telHref(university.phone);

  return (
    <footer className="band">
      <Container width="wide" className="py-10 lg:py-12">
        <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-[0.9fr_1fr_1fr_1fr] xl:gap-10">
          <Link href="/" aria-label={`${university.name} home`} className="flex items-center justify-center self-center">
            <Image src="/images/rcet-logo.png" alt={university.name} width={240} height={240} className="size-44 object-contain lg:size-52 xl:size-60" />
          </Link>

          <div className="min-w-0">
            <h2 id="footer-contact" className="border-b-2 border-on-band pb-3 font-display text-xl font-semibold">
              {footer.contactHeading}
            </h2>
            <address className="mt-3 text-base leading-relaxed not-italic">
              <p>{university.address}</p>
              <p>Phone: <a href={phoneHref} className="inline-flex min-h-11 items-center hover:underline">{university.phone}</a></p>
              <p>Email: <a href={`mailto:${university.email}`} className="inline-flex min-h-11 max-w-full items-center break-all hover:underline">{university.email}</a></p>
            </address>
          </div>

          <nav aria-labelledby="footer-important" className="min-w-0">
            <h2 id="footer-important" className="border-b-2 border-on-band pb-3 font-display text-xl font-semibold">
              {footer.linksHeading}
            </h2>
            <FooterLinkList links={footer.links} />
          </nav>

          <CampusMap university={university} heading={footer.locationHeading} />
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-on-band/20 pt-6 text-center text-sm text-on-band-muted md:flex-row md:justify-between md:text-start">
          <p>
            © {copyrightStartYear}–{currentYear} {university.name}, {university.location}.
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
