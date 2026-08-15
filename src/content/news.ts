import type { NewsItem } from "../types/content";

export const newsItems = [
  {
    "id": "ieee-technexus-2026",
    "kind": "event",
    "title": "IEEE Technexus 2026",
    "summary": null,
    "href": "https://ieee-technexus.vercel.app/",
    "publishedAt": null,
    "startsAt": null,
    "endsAt": null,
    "imageId": null,
    "source": {
      "sourceUrl": "https://rcet.uet.edu.pk/",
      "checkedAt": "2026-10-02",
      "status": "needs-review",
      "notes": [
        "Observed as a NEW link in the mobile Academics menu; there is no homepage news feed.",
        "TODO: Verify event dates, venue, registration, and whether the event is upcoming or past."
      ]
    }
  }
] satisfies readonly NewsItem[];

