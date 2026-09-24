# Nexus CRM

Nexus CRM is a modern CRM for freelancers and independent professionals.
It brings clients, deals, projects, tasks, invoices, reports, communications, and business analytics into one workflow.

Built as a serious portfolio project with a focus on real business workflows, clean UI, responsive design, Arabic/English support, and a scalable Next.js architecture.

## Features

- **Dashboard** — live KPIs, revenue, pipeline, tasks, activity, projects, and events
- **Contacts** — people/companies, tags, nationality, phone country code, lead source, notes, and linked CRM data
- **Deals** — customizable Kanban sales pipeline
- **Projects** — project tracking, task progress, budgets, dates, linked deals and invoices
- **Invoices** — fixed or itemized invoices with branded PDF output
- **Reports** — editable project reports with rich text, reorderable sections, images, and PDF output
- **Tasks & Calendar** — priorities, deadlines, events, and CRM links
- **Analytics** — revenue, conversion, invoice, and productivity views
- **Global + Live Search** — search across CRM data with debounced live search on list pages
- **Profile & Settings** — business details, profile media, theme, language, security, and account deletion
- **Arabic / English** — RTL/LTR-aware UI and localized dates, currency, metadata, and PDFs
- **Dark / Light Mode** — persistent theme switching
- **Loading UX** — route loading, operation overlays, search and language transition states

## Tech Stack

- **Next.js 16** — App Router, Server Components, SSR
- **TypeScript** — type-safe application development
- **Tailwind CSS v4** — styling and design system
- **Supabase** — Auth, PostgreSQL, Storage, and Row Level Security
- **next-intl** — Arabic and English localization
- **React Hook Form + Zod** — forms and validation
- **Motion** — UI transitions and interactions
- **Recharts** — analytics charts
- **Lucide React** — icons

## Getting Started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

## Environment

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret
```

`SUPABASE_SERVICE_ROLE_KEY` is only used by the server-side account deletion route. Never expose it to browser code or commit it to Git.

## Supabase

For a fresh database, run this once in the Supabase SQL Editor:

```text
supabase/setup.sql
```

For an existing database, apply the versioned migrations in:

```text
supabase/migrations/
```

The current contact enrichment migration is:

```text
supabase/migrations/20260923_contact_enrichment.sql
```

More setup details are in `supabase.md`.

## Project Structure

```text
src/
├── app/            # Routes, layouts, API routes, metadata
├── components/     # UI and feature components
├── lib/            # Supabase clients, CRM helpers, sanitization, SEO
├── hooks/          # Reusable client hooks
├── store/          # Application state
├── types/          # Shared TypeScript types
└── constants/      # Shared configuration
```

## Status

The current build covers the main freelancer CRM workflow from contact acquisition and sales pipeline management through project delivery, invoicing, reporting, and analytics.

The longer-term backend direction is a custom Node.js + Express + MySQL service.
