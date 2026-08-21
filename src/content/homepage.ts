import type { HeroContent, IntroductionContent, CoordinatorMessage, CampusLifeContent, FooterContent, CallToAction } from "../types/content";

export const hero = {
  "heading": null,
  "description": null,
  "imageIds": [
    "image-026",
    "image-002",
    "image-003",
    "image-004",
    "image-005"
  ],
  "callsToAction": [],
  "source": {
    "sourceUrl": "https://rcet.uet.edu.pk/",
    "checkedAt": "2026-10-02",
    "status": "needs-review",
    "notes": [
      "The live hero has four campus photographs and carousel controls, without visible headline, description, or CTA.",
      "TODO: Approve hero copy and photography before implementation."
    ]
  }
} satisfies HeroContent;

export const introduction = {
  "heading": "Introduction",
  "body": "Established in 2002, RCET is a constituent college of UET Lahore in Gujranwala. Its five departments cover computing, electrical engineering, mechanical engineering, industrial and manufacturing engineering, and natural sciences and humanities.",
  "imageId": "image-006",
  "link": {
    "label": "Read More →",
    "href": "https://rcet.uet.edu.pk/about-us",
    "external": false
  },
  "source": {
    "sourceUrl": "https://rcet.uet.edu.pk/",
    "checkedAt": "2026-10-02",
    "status": "observed",
    "notes": []
  }
} satisfies IntroductionContent;

export const coordinatorMessage = {
  "heading": "Campus Coordinator Message",
  "name": "Dr. Haroon Farooq",
  "role": "Campus Coordinator RCET",
  "excerpt": "\" It gives me immense pleasure to welcome you to the Rachna College of Engineering and Technology (RCET), an esteemed higher education institution where we collectively embark on a journey of knowledge, growth, and discovery. As the head of this prestigious institution, I am committed to taking its mission forward, while ensuring a conducive and stimulating environment that fosters creativity, adaptability, and a sense of responsibility towards the society... \"",
  "fullMessage": null,
  "imageId": "image-012",
  "source": {
    "sourceUrl": "https://rcet.uet.edu.pk/",
    "checkedAt": "2026-10-02",
    "status": "needs-review",
    "notes": [
      "TODO: Verify the current campus coordinator and obtain the complete approved message; only an excerpt is displayed."
    ]
  }
} satisfies CoordinatorMessage;

export const campusLife = {
  "heading": "Campus Life",
  "originalBody": "RCET Institute is located in a region rich in history and culture. You will enjoy living within walking distance of state-of-the-art classrooms and labs, as well as beautiful dining facilities, a lively social scene, student societies, extracurricular activities, and a diverse community working to make a positive difference. GIK Institute helps you to discover and refine your abilities, guides you through new obstacles, and encourages you to help others along their journey. With a supportive community and ample opportunities to get involved, GIK Institute is the perfect place to pursue your passions and achieve your goals.",
  "approvedBody": null,
  "categories": [
    {
      "id": "students",
      "label": "STUDENTS",
      "imageIds": [
        "image-013",
        "image-014",
        "image-015",
        "image-016"
      ]
    },
    {
      "id": "hostels",
      "label": "HOSTELS",
      "imageIds": [
        "image-017",
        "image-018",
        "image-019",
        "image-017"
      ]
    },
    {
      "id": "societies",
      "label": "SOCIETIES",
      "imageIds": [
        "image-020",
        "image-021",
        "image-022",
        "image-023"
      ]
    },
    {
      "id": "sports",
      "label": "SPORTS",
      "imageIds": [
        "image-017",
        "image-018",
        "image-019",
        "image-017"
      ]
    }
  ],
  "source": {
    "sourceUrl": "https://rcet.uet.edu.pk/",
    "checkedAt": "2026-10-02",
    "status": "needs-review",
    "notes": [
      "TODO: Replace the two GIK Institute references with institution-approved RCET content.",
      "The Hostels and Sports galleries reuse identical images; verify hostel photography."
    ]
  }
} satisfies CampusLifeContent;

export const footer = {
  "contactHeading": "Contact Us",
  "linksHeading": "Important Links",
  "locationHeading": "Our Location",
  "links": [
    {
      "label": "Career at UET",
      "href": "https://jobs.uet.edu.pk/",
      "external": true
    },
    {
      "label": "Apply via UET portal",
      "href": "https://admission.uet.edu.pk/",
      "external": true
    },
    {
      "label": "Downloads",
      "href": "https://www.uet.edu.pk/uet_students/student/downloads/",
      "external": true
    },
    {
      "label": "Tender Notice",
      "href": "https://www.uet.edu.pk/newsannouncement/tender-notice/",
      "external": true
    },
    {
      "label": "UET Automation",
      "href": "https://kics.edu.pk/essl/",
      "external": true
    }
  ],
  "originalCopyright": "© 2024 Rachna College of Engineering and Technology, Gujranwala",
  "originalCredit": "Developed by Department of Computer Science and Engineering",
  "mapEmbedUrl": null,
  "source": {
    "sourceUrl": "https://rcet.uet.edu.pk/",
    "checkedAt": "2026-10-02",
    "status": "needs-review",
    "notes": [
      "TODO: Confirm current footer credit and copyright wording.",
      "TODO: Configure an institution-owned map embed; do not reuse the current provider key."
    ]
  }
} satisfies FooterContent;

export const callsToAction = [
  {
    "id": "introduction-read-more",
    "placement": "Introduction",
    "label": "Read More →",
    "href": "https://rcet.uet.edu.pk/about-us",
    "behavior": "link",
    "source": {
      "sourceUrl": "https://rcet.uet.edu.pk/",
      "checkedAt": "2026-10-02",
      "status": "observed",
      "notes": []
    }
  },
  {
    "id": "admission",
    "placement": "Footer important links",
    "label": "Apply via UET portal",
    "href": "https://admission.uet.edu.pk/",
    "behavior": "link",
    "source": {
      "sourceUrl": "https://rcet.uet.edu.pk/",
      "checkedAt": "2026-10-02",
      "status": "observed",
      "notes": []
    }
  },
  {
    "id": "email",
    "placement": "Footer Contact Us",
    "label": "admin.rcet@uet.edu.pk",
    "href": "mailto:admin.rcet@uet.edu.pk",
    "behavior": "link",
    "source": {
      "sourceUrl": "https://rcet.uet.edu.pk/",
      "checkedAt": "2026-10-02",
      "status": "observed",
      "notes": []
    }
  },
  {
    "id": "chat",
    "placement": "Floating chatbot",
    "label": "Open chat",
    "href": null,
    "behavior": "button",
    "source": {
      "sourceUrl": "https://rcet.uet.edu.pk/",
      "checkedAt": "2026-10-02",
      "status": "observed",
      "notes": []
    }
  }
] satisfies readonly CallToAction[];

