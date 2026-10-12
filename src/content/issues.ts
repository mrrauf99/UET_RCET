import type { ContentIssue } from "../types/content";

export const contentIssues = [
  {
    "id": "hero-copy",
    "status": "TODO",
    "affects": [
      "hero"
    ],
    "description": "The hero is image-only. Obtain approved headline, description, and CTA copy.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "image-approval",
    "status": "TODO",
    "affects": [
      "images"
    ],
    "description": "The observed source URLs in images.ts are an inventory only. Obtain approved local assets and meaningful alt text; do not download or hotlink these URLs.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "campus-life-copy",
    "status": "TODO",
    "affects": [
      "campusLife"
    ],
    "description": "The original campus-life paragraph mentions GIK Institute twice. Obtain RCET-specific approved copy.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "hostels-gallery",
    "status": "TODO",
    "affects": [
      "campusLife"
    ],
    "description": "Hostels reuses the Sports gallery images. Verify hostel details and photographs.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "statistics",
    "status": "TODO",
    "affects": [
      "stats"
    ],
    "description": "No campus statistics section exists on the homepage. Obtain dated, authoritative statistics.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "news-feed",
    "status": "TODO",
    "affects": [
      "newsItems"
    ],
    "description": "No homepage news feed was observed. Obtain a dated news/events data source.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "event-details",
    "status": "TODO",
    "affects": [
      "newsItems"
    ],
    "description": "IEEE Technexus 2026 appears as NEW in mobile navigation only. Verify event timing, status, venue, and registration.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "cs-program-name",
    "status": "TODO",
    "affects": [
      "programs"
    ],
    "description": "Homepage: B.Sc. Computer Science and Engineering. Department page: B.Sc. Computer Science. Obtain the official degree name.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/",
      "https://rcet.uet.edu.pk/departments/computer-science"
    ]
  },
  {
    "id": "program-admissions",
    "status": "TODO",
    "affects": [
      "programs"
    ],
    "description": "Verify all eight listed programs, current admissions, durations, eligibility, accreditation, and detail links.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "coordinator-message",
    "status": "TODO",
    "affects": [
      "coordinatorMessage"
    ],
    "description": "The homepage names Dr. Haroon Farooq and displays a truncated message. Verify current leadership and obtain the full approved message.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "facilities-overview",
    "status": "TODO",
    "affects": [
      "extractedPages"
    ],
    "description": "The facilities overview claims proximity to several industries including Kamra Aeronautical Complex without substantiation. Confirm RCET-specific location and industry claims.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/campus/facilities"
    ]
  },
  {
    "id": "facilities-inventory",
    "status": "TODO",
    "affects": [
      "facilities"
    ],
    "description": "Confirm sports amenity claims and laboratory inventory. IME content still refers to equipment due in Spring 2023.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/campus/sports",
      "https://rcet.uet.edu.pk/departments/industrial-manufacturing-engineering"
    ]
  },
  {
    "id": "transportation-copy",
    "status": "TODO",
    "affects": [
      "extractedPages"
    ],
    "description": "Transportation text repeats student-society language. Verify the dated bus timetable, routes, and arrival times.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/campus/transportation"
    ]
  },
  {
    "id": "alumni-content",
    "status": "TODO",
    "affects": [
      "extractedPages"
    ],
    "description": "Alumni contains only Coming Soon. Obtain approved alumni content.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/alumni"
    ]
  },
  {
    "id": "faculty-profiles",
    "status": "TODO",
    "affects": [
      "departmentTabs"
    ],
    "description": "Some See Profile links point to https://staff.uet.edu.pk/profile/ without a person ID. Reconfirm faculty names, roles, degrees, and valid profile links.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/departments/electrical-engineering",
      "https://rcet.uet.edu.pk/departments/natural-sciences-humanities"
    ]
  },
  {
    "id": "footer",
    "status": "TODO",
    "affects": [
      "footer"
    ],
    "description": "Footer says © 2024. Verify copyright/credit and configure an institution-owned map embed.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "external-links",
    "status": "TODO",
    "affects": [
      "navigation",
      "footer"
    ],
    "description": "External destinations were recorded from links, not exhaustively checked. Verify jobs, admissions, downloads, tenders, automation, campus links, and Terms & Conditions.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "missing-admissions-contact-copy",
    "status": "TODO",
    "affects": [
      "callsToAction"
    ],
    "description": "The current homepage has a footer Admission link and contact information, but no standalone Admissions or Contact CTA sections. Obtain approved section copy.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "peos-repeat-plos",
    "status": "TODO",
    "affects": [
      "departments"
    ],
    "description": "Some department PEO pages repeat PLO descriptions word for word (Electrical Engineering's PEO 1-3 are PLO 1-3). The site hides PEOs that only duplicate PLOs; obtain the actual program educational objectives.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  },
  {
    "id": "live-accessibility",
    "status": "TODO",
    "affects": [
      "navigation",
      "programs",
      "campusLife"
    ],
    "description": "Observed issues include multiple h1 elements, unlabeled selects, nested button/link markup, placeholder alt text, clickable non-button department tabs, and non-link View Details spans. Rebuild these interactions accessibly.",
    "sourceUrls": [
      "https://rcet.uet.edu.pk/"
    ]
  }
] satisfies readonly ContentIssue[];

