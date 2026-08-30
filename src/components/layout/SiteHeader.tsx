import { Container } from "@/components/ui/Container";
import { telHref } from "@/lib/format";
import { ADMISSIONS_PORTAL_URL } from "@/lib/site";
import type { NavItem, UniversityInfo } from "@/types/content";
import { MainNav } from "./MainNav";
import { MobileNav } from "./MobileNav";
import { Wordmark } from "./Wordmark";

interface SiteHeaderProps {
  navigation: readonly NavItem[];
  university: UniversityInfo;
}

export function SiteHeader({ navigation, university }: SiteHeaderProps) {
  const phoneHref = telHref(university.phone);
  const utilityLinks = [
    { label: `Call ${university.phone}`, href: phoneHref, external: false },
    { label: university.email, href: `mailto:${university.email}`, external: false },
    { label: "Apply via UET portal", href: ADMISSIONS_PORTAL_URL, external: true },
  ];

  return (
    <header className="band sticky top-(--toolbar-offset) z-30 shadow-md [view-transition-class:chrome] [view-transition-name:site-header]">
      <Container width="wide" className="flex min-h-(--header-height) items-center justify-between gap-3 sm:gap-6">
        <Wordmark name={university.name} />
        <div className="flex items-center gap-2">
          <MainNav items={navigation} />
          <MobileNav items={navigation} utilityLinks={utilityLinks} />
        </div>
      </Container>
    </header>
  );
}
