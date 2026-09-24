# Nexus CRM - Supabase Setup

This is the practical Supabase setup guide for Nexus CRM.

## 1. Create a Supabase project

Create a new Supabase project and enable Email authentication.

Set the local/production application URLs used by the project.

## 2. Fresh database setup

Run this file once in **Supabase SQL Editor**:

```text
supabase/setup.sql
```

It creates the CRM tables, RLS policies, timestamp triggers, signup trigger, Reports tables, and Storage configuration.

## 3. Existing database

For a database that already contains Nexus CRM data, use the incremental migrations instead of rerunning the full bootstrap:

```text
supabase/migrations/20260921_reports_and_profile_assets.sql
supabase/migrations/20260923_contact_enrichment.sql
```

The contact migration is additive and keeps the old `phone` column for compatibility.

## 4. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret
```

Only the public URL/key belong in `NEXT_PUBLIC_*` variables.

`SUPABASE_SERVICE_ROLE_KEY` is server-only and is used for account deletion. Do not commit it or expose it to client-side code.

## 5. Storage

Nexus CRM uses two buckets:

| Bucket | Access | Limit | Purpose |
|---|---|---:|---|
| `profile-assets` | Public | 5 MB | Avatar, cover image, business logo |
| `report-assets` | Private | 10 MB | Report section images |

Supported image types are PNG, JPEG/JPG, and WebP.

Objects are stored under a user UUID folder so Storage policies can enforce ownership.

## 6. Contacts

Contacts now support:

- Nationality
- Country code + phone number
- Lead/source selection

The app keeps the legacy `phone` column for existing data. New records write the structured phone fields as well as the combined legacy value.

Lead-source options include major freelance platforms and professional channels such as Khamsat, Mostaql, Upwork, Fiverr, Freelancer, PeoplePerHour, Guru, Toptal, Workana, Contra, 99designs, DesignCrowd, Dribbble, Malt, Worksome, LinkedIn, Behance, Facebook, Instagram, referrals, direct/outside-platform leads, and Other.

## 7. Reports

Reports are stored in:

```text
project_reports
report_sections
report_section_images
```

Section content uses sanitized rich-text HTML. Report images use the private `report-assets` bucket and signed URLs.

## 8. Row Level Security

Business records are scoped to the authenticated user through `user_id = auth.uid()` policies.

Child records also verify ownership through their parent resources where needed.

## 9. Account deletion

Settings → Danger Zone uses `/api/account/delete`.

The server removes the user's Storage files and then uses Supabase Auth's admin delete operation. The required secret is:

```env
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret
```

## 10. Development

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
npm run start
```

Keep `.env.local` private and never commit secrets.
