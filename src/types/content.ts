type VerificationStatus = "observed" | "needs-review";

export interface ContentSource {
  readonly sourceUrl: string;
  readonly checkedAt: string;
  readonly status: VerificationStatus;
  readonly notes: readonly string[];
}

export interface ContentLink {
  readonly label: string;
  readonly href: string;
  readonly external: boolean;
}

export type NavItem =
  | (ContentLink & { readonly id: string; readonly kind: "link" })
  | {
      readonly id: string;
      readonly kind: "group";
      readonly label: string;
      readonly children: readonly NavItem[];
    };

export interface ImageAsset {
  readonly id: string;
  readonly sourceUrl: string;
  readonly purpose: string;
  readonly originalAlt: readonly string[];
  readonly sourcePages: readonly string[];
  readonly loadedWhenChecked: boolean;
  readonly approvedLocalPath: string | null;
  readonly approvedAlt: string | null;
}

export interface Department {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly facultyId: string;
  readonly imageId: string;
  readonly description: string | null;
  readonly source: ContentSource;
}

export interface Program {
  readonly id: string;
  readonly name: string;
  readonly level: "undergraduate" | "postgraduate";
  readonly departmentId: string;
  readonly detailsHref: string | null;
  readonly duration: string | null;
  readonly admissionStatus: "unverified" | "open" | "closed";
  readonly source: ContentSource;
}

export interface Facility {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly imageIds: readonly string[];
  readonly source: ContentSource;
}

export interface NewsItem {
  readonly id: string;
  readonly kind: "news" | "event";
  readonly title: string;
  readonly summary: string | null;
  readonly href: string;
  readonly publishedAt: string | null;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly imageId: string | null;
  readonly source: ContentSource;
}

export interface UniversityInfo {
  readonly name: string;
  readonly shortName: string;
  readonly affiliation: string;
  readonly establishedYear: number;
  readonly location: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly vision: string;
  readonly mission: string;
  readonly source: ContentSource;
}

export interface HeroContent {
  readonly heading: string | null;
  readonly description: string | null;
  readonly imageIds: readonly string[];
  readonly callsToAction: readonly ContentLink[];
  readonly source: ContentSource;
}

export interface IntroductionContent {
  readonly heading: string;
  readonly body: string;
  readonly imageId: string;
  readonly link: ContentLink;
  readonly source: ContentSource;
}

export interface CoordinatorMessage {
  readonly heading: string;
  readonly name: string;
  readonly role: string;
  readonly excerpt: string;
  readonly fullMessage: string | null;
  readonly imageId: string;
  readonly source: ContentSource;
}

export interface CampusLifeContent {
  readonly heading: string;
  readonly originalBody: string;
  readonly approvedBody: string | null;
  readonly categories: readonly {
    readonly id: string;
    readonly label: string;
    readonly imageIds: readonly string[];
  }[];
  readonly source: ContentSource;
}

export interface FooterContent {
  readonly contactHeading: string;
  readonly linksHeading: string;
  readonly locationHeading: string;
  readonly links: readonly ContentLink[];
  readonly originalCopyright: string;
  readonly originalCredit: string;
  readonly mapEmbedUrl: string | null;
  readonly source: ContentSource;
}

export interface CallToAction {
  readonly id: string;
  readonly placement: string;
  readonly label: string;
  readonly href: string | null;
  readonly behavior: "link" | "button";
  readonly source: ContentSource;
}

export interface ExtractedPage {
  readonly id: string;
  readonly title: string;
  readonly href: string;
  readonly originalBody: string;
  readonly links: readonly ContentLink[];
  readonly imageIds: readonly string[];
  readonly source: ContentSource;
}

export interface StudentSociety {
  readonly id: string;
  readonly name: string;
  readonly foundedYear: number;
  readonly source: ContentSource;
}
