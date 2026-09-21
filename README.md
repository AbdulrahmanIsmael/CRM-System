# Nexus CRM

A personal CRM system built for freelancers and independent professionals to manage clients, track deal pipelines, and run their business operations from a single, unified dashboard.

## Vision

Nexus CRM is the operational backbone of a freelance business — designed to transition from solo freelancer to managing a structured, professional service business. It handles client relationships, deal tracking, project management, communications, and business analytics in one place.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **State Management** | Redux Toolkit |
| **Server State** | TanStack Query |
| **Backend (Current)** | Supabase (Auth, Database, Storage) |
| **Backend (Planned)** | Node.js, Express, MySQL |
| **i18n** | next-intl (Arabic + English) |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |

## Core Features

- **Dashboard** — live Supabase KPIs, revenue charts, pipeline, tasks, activity, projects, and upcoming events
- **Contacts** — client/contact management, search, edit/delete, linked CRM data
- **Deal Pipeline** — Kanban pipeline with customizable stages and edit/delete flows
- **Projects** — project tracking, task-derived progress, linked invoices, and final reports
- **Invoices** — fixed or itemized invoices, PDF layout customization, branded PDF export
- **Reports** — persistent project completion reports with reorderable sections, rich text, section images, Arabic/English PDF output
- **Tasks** — task management with priorities, links, edit/delete, and status updates
- **Calendar** — events with create/edit/delete flows and linked CRM entities
- **Analytics** — revenue, conversion, invoice, and productivity analytics
- **Profile & Settings** — freelancer profile, business details, avatar/cover uploads, security settings, and deal-stage management
- **Global Search** — cross-entity search for contacts, deals, projects, invoices, tasks, events, and communications
- **i18n** — English + Arabic with RTL/LTR-aware layouts throughout the CRM
- **Theme** — polished dark and light modes with Nexus design tokens

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages & layouts)
│   ├── (auth)/             # Auth pages (login, register)
│   ├── (dashboard)/        # Dashboard layout group
│   │   ├── dashboard/
│   │   ├── contacts/
│   │   ├── deals/
│   │   ├── projects/
│   │   ├── invoices/
│   │   ├── tasks/
│   │   ├── calendar/
│   │   ├── analytics/
│   │   └── settings/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # Shared UI components
│   ├── ui/                 # Base UI primitives (Button, Input, Modal, etc.)
│   ├── layout/             # Layout components (Sidebar, Header, etc.)
│   └── shared/             # Shared composite components
├── lib/                    # Utilities, helpers, and configurations
│   ├── supabase/           # Supabase client and helpers
│   └── utils.ts
├── store/                  # Redux Toolkit store and slices
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── constants/              # App-wide constants and configuration
```

## Color System

| Role | Hex |
|---|---|
| Primary | `#2F39A9` |
| Primary Light | `#4B54C5` |
| Secondary | `#2E6FA0` |
| Accent | `#49A4BB` |
| Success | `#15D8B3` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Background | `#0B0F1A` |
| Surface | `#111827` |
| Surface Light | `#1E2738` |
| Text Primary | `#F1F5F9` |
| Text Secondary | `#94A3B8` |
| Border | `#1E293B` |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Roadmap / Current Status

- [x] Project setup (Next.js, Tailwind CSS, TypeScript)
- [x] Authentication (Supabase Auth)
- [x] Dashboard layout and navigation
- [x] Contacts module
- [x] Deal pipeline (Kanban board)
- [x] Projects module
- [x] Invoicing system + branded PDF export
- [x] Task management
- [x] Calendar with event CRUD
- [x] Analytics dashboard
- [x] Profile & settings
- [x] Arabic / English + RTL / LTR
- [x] Dark / light theme
- [x] Persistent project completion reports with rich text and images
- [ ] Custom backend migration (Node.js + Express + MySQL)


## License

Private — All rights reserved.

## Reports & Profile Media

This build adds one database/storage migration for Reports and profile media:

```text
supabase/migrations/20260921_reports_and_profile_assets.sql
```

Run it once in **Supabase SQL Editor**. It adds:

- `profiles.cover_image_url`
- `project_reports`
- `report_sections`
- `report_section_images`
- `profile-assets` Storage bucket (public, image-only, user-folder write policies)
- `report-assets` Storage bucket (private, image-only, user-folder RLS policies)

The migration expects the base schema/functions from `database_design.md` to already be installed. Normal CRM reads/writes continue to use the existing per-user RLS model.

### Development

```bash
npm install
npm run dev

npm run build
```

Keep `.env.local` local to your environment and do not commit it.

## SEO, metadata, schemas, and crawling

The App Router uses localized `generateMetadata` for the English and Arabic routes, including canonical URLs, `hreflang` alternates, Open Graph/Twitter cards, robots directives, and page-specific descriptions. JSON-LD is included for the Nexus CRM web application plus `WebPage`/`BreadcrumbList` schemas. The application also provides `/robots.txt` and `/sitemap.xml`.

Nexus CRM is currently an authenticated/private application, so dashboard and authentication routes are intentionally marked `noindex` and the robots policy disallows crawling. The generated sitemap is intentionally empty until public marketing/docs pages exist.

Set `NEXT_PUBLIC_SITE_URL` in `.env.local` to the real production origin (for example `https://crm.example.com`) so canonical, Open Graph, JSON-LD, and sitemap URLs use the deployed domain.

The project no longer depends on Google Fonts at build time; the UI uses local system font stacks so `next build` does not fail when the build environment cannot reach `fonts.googleapis.com`.

Analytics data fetching was moved to a Server Component and only the Recharts visualization remains client-side.