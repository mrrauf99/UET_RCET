import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Jost } from "next/font/google";
import { A11yTrigger } from "@/components/a11y/A11yTrigger";
import { A11yToolbar } from "@/components/a11y/A11yToolbar";
import { ReadingAids } from "@/components/a11y/ReadingAids";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { PREFERENCES_INIT_SCRIPT } from "@/lib/a11y/prefs";
import { getFooter, getNavigation, getUniversity } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  // Next has no metric overrides for this family; Verdana's wide proportions limit layout shift.
  fallback: ["Verdana", "Arial", "sans-serif"],
});

const description =
  "Rachna College of Engineering and Technology (RCET), Gujranwala, is a constituent college of the University of Engineering and Technology, Lahore.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | RCET Gujranwala",
    default: "Rachna College of Engineering and Technology | UET Lahore, Gujranwala",
  },
  description,
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "Rachna College of Engineering and Technology",
    description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a1f55" },
    { media: "(prefers-color-scheme: dark)", color: "#13224a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [university, navigation, footer] = await Promise.all([getUniversity(), getNavigation(), getFooter()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: university.name,
    alternateName: university.shortName,
    url: SITE_URL,
    email: university.email,
    telephone: university.phone,
    foundingDate: String(university.establishedYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jora Sian, Ghakhar Mandi",
      addressLocality: "Gujranwala",
      addressCountry: "PK",
    },
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: "University of Engineering and Technology, Lahore",
      url: "https://www.uet.edu.pk/",
    },
  };

  return (
    <html
      lang="en"
      data-theme="light"
      data-contrast="default"
      data-motion="no-preference"
      data-text-scale="100"
      // Lets Next turn smooth scrolling off during route changes so pages don't glide to the top.
      data-scroll-behavior="smooth"
      className={`${jost.variable} ${atkinson.variable}`}
      // The pre-paint script rewrites <html> attributes before hydration on purpose.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <SkipLink />
        <SiteHeader
          navigation={navigation.primary}
          university={university}
          utilityActions={<A11yTrigger placement="header" />}
        />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter
          footer={footer}
          university={university}
          exploreLinks={navigation.footerExplore}
          campusLinks={navigation.uetCampuses}
        />
        <A11yTrigger placement="floating" />
        <A11yToolbar />
        <ReadingAids />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
