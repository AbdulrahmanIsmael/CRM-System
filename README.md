# Nexus CRM

- Nexus CRM is a modern CRM system built for freelancers and independent professionals.
- It helps manage clients, deals, projects, tasks, invoices, reports, communications, and business analytics from one dashboard.
- The project is designed with a focus on real-world business workflows, clean UI, responsive design, and a scalable architecture.

## Features

- **Dashboard** — KPIs, revenue, pipeline, tasks, projects, activity, and upcoming events
- **Contacts** — Manage clients and companies with search, tags, and linked CRM data
- **Deals** — Kanban pipeline with customizable stages
- **Projects** — Track projects, progress, tasks, invoices, and final reports
- **Invoices** — Fixed or itemized invoices with branded PDF export
- **Reports** — Rich-text project reports with reorderable sections and images
- **Tasks & Calendar** — Manage tasks, events, priorities, and due dates
- **Analytics** — Revenue, conversion, invoice, and productivity insights
- **Global Search** — Search across contacts, deals, projects, invoices, tasks, events, and communications
- **Profile & Settings** — Business information, profile images, theme, language, security, and account deletion
- **Internationalization** — English and Arabic with full RTL/LTR support
- **Dark & Light Mode** — Responsive theme system with Nexus design tokens

## Tech Stack

- **Next.js 16** — App Router, Server Components, SSR
- **TypeScript** — Type-safe application development
- **Tailwind CSS v4** — UI styling
- **Supabase** — Authentication, PostgreSQL database, and Storage
- **next-intl** — Arabic and English localization
- **React Hook Form + Zod** — Form handling and validation
- **Recharts** — Data visualization
- **Lucide React** — Icons

## Getting Started

Install dependencies:

```bash
npm install
````

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-server-side-secret
```

`SUPABASE_SERVICE_ROLE_KEY` is only used for server-side account deletion and must never be exposed to the client or committed to Git.

## Supabase

For a new Supabase project, run:

```text
supabase/setup.sql
```

in the Supabase SQL Editor.

For existing projects, use the versioned migrations inside:

```text
supabase/migrations/
```

The current setup includes:

- User profiles
- Contacts and tags
- Deals and pipeline stages
- Projects
- Invoices and invoice items
- Tasks and calendar events
- Activity and communication logs
- Project reports
- Profile and report image storage
- Row Level Security (RLS)
- User signup automation

More details are available in:

```text
supabase.md
database_design.md
system_overview.md
```

## Notes

Keep `.env.local` private and never commit secrets to GitHub.

The application uses localized metadata, structured data, sitemap/robots configuration, accessible UI patterns, and Server Components where practical to improve SEO and performance.
