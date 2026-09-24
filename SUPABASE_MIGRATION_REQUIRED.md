# Supabase Setup / Migrations

## Fresh Supabase project

Run the complete bootstrap once:

```text
supabase/setup.sql
```

Use the Supabase SQL Editor. It creates the current Nexus CRM schema, RLS policies, signup automation, report tables, and Storage buckets.

## Existing database

Do **not** rerun the full bootstrap as a normal production migration. Apply the versioned migrations in `supabase/migrations/` instead.

Current incremental migrations:

```text
supabase/migrations/20260921_reports_and_profile_assets.sql
supabase/migrations/20260923_contact_enrichment.sql
```

### `20260921_reports_and_profile_assets.sql`

Adds Reports and profile media support:

- `profiles.cover_image_url`
- `project_reports`
- `report_sections`
- `report_section_images`
- `profile-assets` bucket
- `report-assets` bucket
- RLS/Storage policies for the new resources

### `20260923_contact_enrichment.sql`

Adds the new contact fields without removing the existing `phone` column:

- `phone_country_code`
- `phone_number`
- `nationality`
- `lead_source`

It also adds an index for filtering contacts by lead source.

Existing contact data is preserved. Legacy `phone` values remain available and are still used as a fallback when displaying old records.

## Account deletion

The Settings Danger Zone uses the server-side route:

```text
/api/account/delete
```

It removes user-owned profile/report files and then deletes the authenticated Supabase user.

Configure the server-only secret:

```env
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret
```

Never expose this key in client components, `NEXT_PUBLIC_*` variables, or Git.
