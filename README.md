# RCET website

The public website for Rachna College of Engineering and Technology (RCET), Gujranwala, a constituent college of UET Lahore. It is built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4. It includes a built-in accessibility toolbar.

## Run it

Requires Node.js 20.9 or newer (tested on Node 24).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (every route is prerendered as static HTML) |
| `npm start` | Serves the production build |
| `npm run lint` | oxlint with the React, Next.js, import, TypeScript and jsx-a11y plugins |
| `npm run typecheck` | Generates route types, then runs `tsc --noEmit` |

Set `NEXT_PUBLIC_SITE_URL` to change the canonical domain used in metadata, `sitemap.xml` and `robots.txt`. The default is `https://rcet.uet.edu.pk`.

## Folder map

```
public/cursors/               large cursor images for the accessibility toolbar
src/
  app/                        routes (App Router); one folder per URL
    layout.tsx                fonts, metadata, pre-paint accessibility script, header/main/footer
    globals.css               design tokens for every display mode, Tailwind theme, toolbar styles
    page.tsx                  homepage (assembles the section components)
    departments/[slug]/       department pages, generated from content at build time
    sitemap.ts, robots.ts, not-found.tsx
  components/
    ui/                       Button, LinkButton, Card, Container, SectionHeading, Icon, ImageFrame, Select
    layout/                   SiteHeader, MainNav, MobileNav, SiteFooter, PageShell, SkipLink, Wordmark, GirihPattern, GirihSeam
    sections/                 homepage and page sections (Hero, Programs, Departments, …)
    a11y/                     accessibility toolbar, its panels and reading aids
  content/                    typed content: the single source of truth for copy and data
  lib/
    content.ts                async getters over src/content (swap this file for a CMS)
    a11y/                     toolbar preferences, store, speech, focus sound, voice control
  types/content.ts            TypeScript types for every content kind
```

## How to add a page

1. Create `src/app/<route>/page.tsx` as a server component.
2. Export `metadata` (title, description, `alternates.canonical`).
3. Wrap the content in `PageShell`. It renders the single `h1` and the optional lead. Split the body into `PageSection` blocks:

   ```tsx
   import type { Metadata } from "next";
   import { PageSection, PageShell } from "@/components/layout/PageShell";

   export const metadata: Metadata = {
     title: "Library",
     description: "Opening hours and services of the RCET central library.",
     alternates: { canonical: "/library" },
   };

   export default async function LibraryPage() {
     return (
       <PageShell title="Library">
         <PageSection id="hours" title="Opening hours">
           <p>…</p>
         </PageSection>
       </PageShell>
     );
   }
   ```

4. Read data through `src/lib/content.ts`. The small media maps (`department-media.ts`, `faculty-photos.ts`) are the only content files imported directly.
5. Add the route to `STATIC_ROUTES` in `src/app/sitemap.ts`. If it belongs in the menu, add it to `src/content/site-navigation.ts`.
6. Run `npm run lint`, `npm run typecheck` and `npm run build`.

## How to add or change content

All copy and data live in typed files under `src/content/`. The types are in `src/types/content.ts`.

- **Programs, departments:** `src/content/academics.ts`. A new department automatically gets a page, a card, a menu entry and a sitemap entry.
- **News and events:** add a `NewsItem` to `src/content/news.ts`. The `/news` page lists it as soon as an item exists.
- **Photos:** copy the approved file into `public/images/`. Then set `approvedLocalPath` (for example `/images/library.jpg`) and `approvedAlt` on its entry in `src/content/images.ts`. Until then the site shows a navy pattern placeholder. Images from the old website are never hotlinked.
- **Student societies:** `src/content/student-life.ts`.

Rules:

- Never invent content. Facts that still need confirmation are listed in `src/content/issues.ts`. Keep a field `null` rather than guessing; empty fields render nothing.
- Every content entry carries a `source` (URL, date checked, status). Update it when you verify something.

To move to a CMS, reimplement the functions in `src/lib/content.ts` with the same signatures. They are already `async`.

## Accessibility toolbar

The toolbar opens from **Accessibility** in the header or the round floating button. It's modelled on the Recite Me toolbar used by the University of Northampton, but built in-house. Its tools:

- **Listening:** read aloud (with a player), focus sound, voice control.
- **Text:** smaller and bigger text, font options (Arial, Verdana, Georgia), focus text.
- **Language and colour:** translation, colour themes and presets.
- **Reading aids:** ruler, cursor size, screen mask.
- **Page tools:** page options, page structure.
- **Extras:** help, reset, and a dark toolbar.

How it works:

- Preferences are stored in `localStorage` under `rcet:a11y:v1`.
- They're applied as `data-*` attributes on `<html>` by a small inline script before the first paint, so there's no flash.
- Everything is driven by CSS variables in `globals.css`.

Read aloud and voice control use the browser's Web Speech API. Voice control only appears in browsers that support speech recognition, such as Chrome, Edge and Safari.

Accessibility target: **WCAG 2.2 AA in every display mode.** Verify changes with keyboard-only use and an axe scan.
