import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { telHref } from "@/lib/format";
import { ADMISSIONS_PORTAL_URL } from "@/lib/site";
import type { NavItem, UniversityInfo } from "@/types/content";
import { MainNav } from "./MainNav";
import { MobileNav } from "./MobileNav";
import { Wordmark } from "./Wordmark";

interface SiteHeaderProps {
  navigation: readonly NavItem[];
  university: UniversityInfo;
  utilityActions?: ReactNode;
}

export function SiteHeader({ navigation, university, utilityActions }: SiteHeaderProps) {
  const phoneHref = telHref(university.phone);
  const utilityLinks = [
    { label: `Call ${university.phone}`, href: phoneHref, external: false },
    { label: university.email, href: `mailto:${university.email}`, external: false },
    { label: "Apply via UET portal", href: ADMISSIONS_PORTAL_URL, external: true },
  ];

  return (
    <>
      <div className="band border-b border-on-band/15 text-sm">
        <Container width="wide" className="flex min-h-11 items-center justify-between gap-4">
          <nav aria-label="Contact" className="flex w-full flex-wrap items-center justify-between gap-x-4">
          <ul className="flex flex-wrap items-center gap-x-5 text-on-band-muted">
            <li>
              <a href={phoneHref} className="flex min-h-11 items-center gap-2 hover:text-on-band hover:underline">
                <Icon name="phone" className="size-4" />
                <span>{university.phone}</span>
              </a>
            </li>
            <li className="hidden sm:block">
              <a
                href={`mailto:${university.email}`}
                className="flex min-h-11 items-center gap-2 hover:text-on-band hover:underline"
              >
                <Icon name="mail" className="size-4" />
                <span>{university.email}</span>
              </a>
            </li>
            <li className="hidden md:block">
              <a
                href={ADMISSIONS_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-2 hover:text-on-band hover:underline"
              >
                Apply via UET portal
                <Icon name="external" className="size-4" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
          {utilityActions ? <div className="flex items-center">{utilityActions}</div> : null}
          </nav>
        </Container>
      </div>

      <header className="band sticky top-(--toolbar-offset) z-30 shadow-md [view-transition-class:chrome] [view-transition-name:site-header]">
        <Container width="wide" className="flex min-h-(--header-height) items-center justify-between gap-3 sm:gap-6">
          <Wordmark name={university.name} />
          <div className="flex items-center gap-2">
            <MainNav items={navigation} />
            <MobileNav items={navigation} utilityLinks={utilityLinks} />
          </div>
        </Container>
      </header>
    </>
  );
}
