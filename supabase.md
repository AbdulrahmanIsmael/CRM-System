# Nexus CRM — Supabase Setup

This document contains everything a developer needs to connect a fresh Supabase project to Nexus CRM.

## 1. Create the Supabase project

Create a Supabase project from the Supabase Dashboard. The official Next.js quickstart uses a Supabase project, the SQL Editor for database setup, and environment variables for the project URL/key. citeturn560590search3turn560590search6

## 2. Run the complete database setup

The complete database bootstrap is stored in:

```text
supabase/setup.sql
```

Open **SQL Editor** in Supabase, paste the entire contents of `supabase/setup.sql`, and run it once for a fresh project.

The script creates or configures:

- `profiles`
- `contacts`
- `tags`
- `contact_tags`
- `deal_stages`
- `deals`
- `projects`
- `invoices`
- `invoice_items`
- `tasks`
- `events`
- `communication_log`
- `activity_log`
- `project_reports`
- `report_sections`
- `report_section_images`
- `updated_at` triggers
- signup automation for profiles and default deal stages
- task/event cascade behavior for contact/project deletion
- Supabase Storage buckets and Storage RLS policies

The database uses PostgreSQL Row Level Security so records are scoped to the authenticated user. Supabase recommends enabling RLS on exposed tables and using policies to control which rows each authenticated user can access. citeturn560590search8turn560590search12

> **Existing production database:** do not use the full bootstrap as your normal migration workflow. Use the versioned files under `supabase/migrations/` for incremental changes so existing data and schema history are preserved.

## 3. Authentication configuration

Nexus CRM uses Supabase Auth with email/password authentication.

Configure the Email provider in Supabase Auth and set the application URL/redirect URLs for each environment you use.

Typical local URL:

```text
http://localhost:3000
```

Typical production URL:

```text
https://your-real-domain.com
```

Keep local and production URLs aligned with the URLs used by the deployed application.

## 4. Environment variables

Copy `.env.example` to `.env.local` in the project root.

The current Nexus CRM code expects:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Supabase's current Next.js documentation also documents a publishable key variable for newer projects; this repository currently uses the `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable, so keep the variable name expected by the application unless the code is intentionally migrated to another key name. citeturn560590search3turn560590search6

### Security

Only public client-side Supabase values belong in `NEXT_PUBLIC_*` variables. Never commit a Supabase service-role/secret key to GitHub, browser code, or `.env.example`.

Service keys bypass RLS and must remain server-side and secret. citeturn560590search0turn560590search5

## 5. Storage configuration

The SQL setup creates two buckets.

| Bucket | Visibility | Limit | Types | Used for |
|---|---|---:|---|---|
| `profile-assets` | Public | 5 MB | PNG, JPEG, WebP | Avatar, cover image, business logo |
| `report-assets` | Private | 10 MB | PNG, JPEG, WebP | Report section images |

Supabase public buckets allow public reads of known asset URLs, while uploads/deletes/updates can still be restricted with Storage policies. Private buckets require authenticated access or signed URLs. citeturn560590search4

### Storage path convention

The application scopes uploaded objects under the authenticated user's UUID as the first folder segment.

Example:

```text
<user-id>/avatar/....webp
<user-id>/cover/....webp
<user-id>/logo/....webp
<user-id>/<report-id>/<section-id>/<uuid>.webp
```

The Storage policies enforce that first folder segment against `auth.uid()`. Supabase documents `storage.foldername(name)` as a helper for this type of per-user object policy. citeturn560590search0turn560590search11

Do not write directly to `storage.objects` for file uploads/deletes; use the Supabase Storage API from the application. Supabase treats the Storage schema as service metadata and recommends using the Storage API for file operations. citeturn560590search2

## 6. Profile image uploads

The profile/settings UI supports direct file selection from the user's device.

Supported files:

```text
PNG
JPEG / JPG
WebP
```

Maximum size:

```text
5 MB per profile asset
```

Profile assets include:

- Avatar
- Cover image
- Business logo

The application uploads the file to Supabase Storage and stores the resulting public URL in `profiles.avatar_url`, `profiles.cover_image_url`, or `profiles.business_logo_url`.

## 7. Reports and report images

A project can have one client-facing report per user/project pair.

Report data is stored in:

```text
project_reports
report_sections
report_section_images
```

`report_sections.content_html` stores the rich-text HTML content. Section order is stored in `position`.

Report images are stored in the private `report-assets` bucket and referenced from `report_section_images.storage_path`. Optional accessibility text is stored in `alt_text`.

## 8. Signup automation

The SQL creates `public.handle_new_user()` and attaches it to the `auth.users` insert event.

When a user signs up, the trigger:

1. Creates their `public.profiles` row.
2. Copies `full_name` from `raw_user_meta_data` when available.
3. Creates the default deal stages:
   - Lead
   - Contacted
   - Proposal Sent
   - Negotiation
   - Won
   - Lost

The function runs as `SECURITY DEFINER` and sets `search_path = public` to keep the function's object resolution controlled.

## 9. Delete/cascade behavior

The setup intentionally uses cascade behavior for the following relationships:

- Delete a contact → linked `tasks` are deleted.
- Delete a contact → linked `events` are deleted.
- Delete a project → linked `tasks` are deleted.
- Delete a project → linked `events` are deleted.
- Delete a project → linked `project_reports` are deleted, which cascades to report sections and report image metadata.
- Delete a report section → linked report image metadata is deleted.

The application should still remove the corresponding Storage objects through the Storage API when report/profile assets are no longer referenced.

## 10. Row Level Security model

Nexus CRM is multi-account data scoped. Every primary business entity has a `user_id` and its RLS policy limits access to the authenticated user.

Core pattern:

```sql
user_id = auth.uid()
```

For child tables such as invoice items, contact tags, report sections, and report images, the policies also verify ownership through their parent row where required.

Supabase documents RLS as the database-level authorization layer for exposed Postgres tables and Storage object policies as the equivalent access-control mechanism for files. citeturn560590search0turn560590search8

## 11. Local development

From the repository root:

```bash
npm install
npm run dev
```

The app should be available at:

```text
http://localhost:3000
```

For a production build:

```bash
npm run build
npm run start
```

## 12. GitHub rules

Commit these project configuration files:

```text
supabase/setup.sql
supabase/migrations/*.sql
supabase.md
database_design.md
system_overview.md
.env.example
```

Do **not** commit:

```text
.env.local
.env.*.local
```

The Supabase API URL and browser-safe public key can be represented through environment variables, but service-role/secret credentials must never be committed. citeturn560590search5

## 13. Existing migrations

The repository keeps incremental migrations under:

```text
supabase/migrations/
```

The current application migration is:

```text
supabase/migrations/20260921_reports_and_profile_assets.sql
```

Use migrations when the database already exists and has application data. Use `supabase/setup.sql` as the consolidated bootstrap for a new environment.

### Self-service account deletion

The Settings **Danger zone** uses a server-only Next.js route at `/api/account/delete`. The route authenticates the current session with Supabase, removes the user's files from `profile-assets` and `report-assets`, and then calls Supabase Auth's admin user deletion with the server-only `SUPABASE_SERVICE_ROLE_KEY`. This key must never be exposed to the browser or committed to Git.

Before using the feature, add this variable to the deployment environment (and to local `.env.local`):

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The deletion endpoint is intentionally excluded from the internationalized middleware matcher, and the browser clears its local auth session after a successful response.

## 14. Quick setup checklist

```text
[ ] Create Supabase project
[ ] Configure Email Auth
[ ] Run supabase/setup.sql on a fresh database
[ ] Copy Supabase URL + key to .env.local
[ ] Set NEXT_PUBLIC_SITE_URL
[ ] Confirm profile-assets bucket exists
[ ] Confirm report-assets bucket exists
[ ] npm install
[ ] npm run build
[ ] npm run dev / npm run start
```
