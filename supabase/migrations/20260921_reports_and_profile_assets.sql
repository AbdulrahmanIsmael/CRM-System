-- Nexus CRM: report persistence + profile image storage
-- Run this once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists cover_image_url text;

create table if not exists public.project_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, project_id)
);

create index if not exists idx_project_reports_user on public.project_reports(user_id);
create index if not exists idx_project_reports_project on public.project_reports(project_id);

alter table public.project_reports enable row level security;
drop policy if exists "Users can manage own project reports" on public.project_reports;
create policy "Users can manage own project reports"
  on public.project_reports for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.report_sections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.project_reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content_html text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_report_sections_report_position on public.report_sections(report_id, position);
create index if not exists idx_report_sections_user on public.report_sections(user_id);

alter table public.report_sections enable row level security;
drop policy if exists "Users can manage own report sections" on public.report_sections;
create policy "Users can manage own report sections"
  on public.report_sections for all using (user_id = auth.uid()) with check (
    user_id = auth.uid() and exists (
      select 1 from public.project_reports r where r.id = report_id and r.user_id = auth.uid()
    )
  );

create table if not exists public.report_section_images (
  id uuid primary key default gen_random_uuid(),
  report_section_id uuid not null references public.report_sections(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_section_images_section on public.report_section_images(report_section_id, position);

alter table public.report_section_images enable row level security;
drop policy if exists "Users can manage own report images" on public.report_section_images;
create policy "Users can manage own report images"
  on public.report_section_images for all using (user_id = auth.uid()) with check (
    user_id = auth.uid() and exists (
      select 1 from public.report_sections s where s.id = report_section_id and s.user_id = auth.uid()
    )
  );

drop trigger if exists set_updated_at on public.project_reports;
create trigger set_updated_at before update on public.project_reports
  for each row execute function update_updated_at();

drop trigger if exists set_updated_at on public.report_sections;
create trigger set_updated_at before update on public.report_sections
  for each row execute function update_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-assets','profile-assets',true,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-assets','report-assets',false,10485760,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload profile assets" on storage.objects;
create policy "Users can upload profile assets" on storage.objects for insert
  to authenticated with check (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update profile assets" on storage.objects;
create policy "Users can update profile assets" on storage.objects for update
  to authenticated using (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete profile assets" on storage.objects;
create policy "Users can delete profile assets" on storage.objects for delete
  to authenticated using (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload report assets" on storage.objects;
create policy "Users can upload report assets" on storage.objects for insert
  to authenticated with check (bucket_id = 'report-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can read report assets" on storage.objects;
create policy "Users can read report assets" on storage.objects for select
  to authenticated using (bucket_id = 'report-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update report assets" on storage.objects;
create policy "Users can update report assets" on storage.objects for update
  to authenticated using (bucket_id = 'report-assets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'report-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete report assets" on storage.objects;
create policy "Users can delete report assets" on storage.objects for delete
  to authenticated using (bucket_id = 'report-assets' and (storage.foldername(name))[1] = auth.uid()::text);
