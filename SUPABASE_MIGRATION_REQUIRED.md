# Supabase Setup / Migration Guide

## Fresh Supabase project

Use the consolidated bootstrap script:

```text
supabase/setup.sql
```

Run the whole file once in the Supabase SQL Editor.

## Existing database

Do not rerun the full bootstrap against a production database as a normal migration workflow. Apply the versioned migration(s) under `supabase/migrations/` for incremental changes.

Current incremental migration:

```text
supabase/migrations/20260921_reports_and_profile_assets.sql
```

For the complete developer setup, see [`supabase.md`](./supabase.md).

# Supabase migration required

After the base Nexus CRM schema is installed, run the following file once in Supabase SQL Editor:

`supabase/migrations/20260921_reports_and_profile_assets.sql`

It adds:

- `profiles.cover_image_url`
- `project_reports`
- `report_sections`
- `report_section_images`
- `profile-assets` Storage bucket (public, image-only)
- `report-assets` Storage bucket (private, image-only)
- Row Level Security policies for the new tables and Storage objects

Do not rerun the base schema just for these features. Existing CRM RLS remains unchanged.

## Self-service account deletion

No additional database migration is required for account deletion. The Settings Danger Zone uses the server-only Next.js route `/api/account/delete`, which removes the user-owned Storage objects and then calls Supabase Auth's admin delete API.

Set this server-only environment variable in local and production environments:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never expose or commit the service-role/secret key.
