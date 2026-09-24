-- ============================================================
-- NEXUS CRM - COMPLETE SUPABASE SETUP
-- ============================================================
-- Run this entire file once in the Supabase SQL Editor when
-- setting up a fresh Nexus CRM database.
--
-- This file consolidates the original schema plus:
--   - safe signup trigger (profile + default deal stages)
--   - cascade deletion for task/event contact/project links
--   - project reports and report sections
--   - profile/report image Storage buckets + RLS policies
--   - profile cover image support
--
-- For an existing production database, prefer applying the
-- versioned migrations in supabase/migrations/ instead of using
-- this full bootstrap script again.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         text,
  avatar_url        text,
  cover_image_url   text,
  business_name     text,
  business_email    text,
  business_phone    text,
  business_address  text,
  business_logo_url text,
  default_currency  text DEFAULT 'USD',
  default_tax_rate  numeric(5,2) DEFAULT 0,
  payment_terms     text,
  bank_details      text,
  language          text DEFAULT 'en',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_image_url text;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 2. CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('person', 'company')),
  status        text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  first_name    text,
  last_name     text,
  company_name  text,
  company_id    uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  email         text,
  phone         text,
  phone_country_code text DEFAULT ' +20',
  phone_number  text,
  nationality   text,
  lead_source   text DEFAULT 'direct',
  website       text,
  industry      text,
  location      text,
  timezone      text,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_type ON public.contacts(user_id, type);
CREATE INDEX IF NOT EXISTS idx_contacts_user_status ON public.contacts(user_id, status);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own contacts" ON public.contacts;
CREATE POLICY "Users can manage own contacts"
  ON public.contacts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text DEFAULT '#94A3B8',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tags" ON public.tags;
CREATE POLICY "Users can manage own tags"
  ON public.tags FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. CONTACT_TAGS (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_tags (
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own contact tags" ON public.contact_tags;
CREATE POLICY "Users can manage own contact tags"
  ON public.contact_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.contacts c
      WHERE c.id = contact_tags.contact_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.contacts c
      WHERE c.id = contact_tags.contact_id
        AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. DEAL STAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deal_stages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  position   integer NOT NULL,
  color      text DEFAULT '#94A3B8',
  is_won     boolean DEFAULT false,
  is_lost    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.deal_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own deal stages" ON public.deal_stages;
CREATE POLICY "Users can manage own deal stages"
  ON public.deal_stages FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 6. DEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id          uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  stage_id            uuid NOT NULL REFERENCES public.deal_stages(id) ON DELETE RESTRICT,
  title               text NOT NULL,
  value               numeric(12,2) DEFAULT 0,
  currency            text DEFAULT 'USD',
  priority            text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  expected_close_date date,
  notes               text,
  won_at              timestamptz,
  lost_at             timestamptz,
  lost_reason         text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_stage ON public.deals(user_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON public.deals(contact_id);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own deals" ON public.deals;
CREATE POLICY "Users can manage own deals"
  ON public.deals FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 7. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id  uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id     uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  name        text NOT NULL,
  description text,
  status      text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  start_date  date,
  deadline    date,
  budget      numeric(12,2) DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_contact ON public.projects(contact_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
CREATE POLICY "Users can manage own projects"
  ON public.projects FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  project_id      uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_number  text NOT NULL,
  pricing_type    text NOT NULL CHECK (pricing_type IN ('itemized', 'fixed')),
  fixed_amount    numeric(12,2),
  subtotal        numeric(12,2) DEFAULT 0,
  tax_rate        numeric(5,2) DEFAULT 0,
  tax_amount      numeric(12,2) DEFAULT 0,
  discount        numeric(12,2) DEFAULT 0,
  total           numeric(12,2) DEFAULT 0,
  currency        text DEFAULT 'USD',
  status          text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date      date NOT NULL,
  due_date        date NOT NULL,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact ON public.invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON public.invoices(user_id, status);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Users can manage own invoices"
  ON public.invoices FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 9. INVOICE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount      numeric(12,2) NOT NULL,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own invoice items" ON public.invoice_items;
CREATE POLICY "Users can manage own invoice items"
  ON public.invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.user_id = auth.uid()
    )
  );

-- ============================================================
-- 10. TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id   uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id      uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  project_id   uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title        text NOT NULL,
  description  text,
  priority     text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status       text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date     timestamptz,
  completed_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- User-requested behavior: deleting a contact/project also removes linked tasks.
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_contact_id_fkey,
  DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE,
  ADD CONSTRAINT tasks_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON public.tasks(user_id, due_date);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks"
  ON public.tasks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 11. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  type        text DEFAULT 'other' CHECK (type IN ('meeting', 'call', 'follow_up', 'deadline', 'other')),
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  all_day     boolean DEFAULT false,
  contact_id  uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id     uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  project_id  uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  color       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- User-requested behavior: deleting a contact/project also removes linked events.
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_contact_id_fkey,
  DROP CONSTRAINT IF EXISTS events_project_id_fkey;

ALTER TABLE public.events
  ADD CONSTRAINT events_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE,
  ADD CONSTRAINT events_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_events_user_time ON public.events(user_id, start_time);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own events" ON public.events;
CREATE POLICY "Users can manage own events"
  ON public.events FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 12. COMMUNICATION LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.communication_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'message', 'other')),
  subject    text,
  content    text,
  date       timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comms_contact ON public.communication_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_comms_user_date ON public.communication_log(user_id, date DESC);

ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own communication logs" ON public.communication_log;
CREATE POLICY "Users can manage own communication logs"
  ON public.communication_log FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 13. ACTIVITY LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  description text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_user_time ON public.activity_log(user_id, created_at DESC);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
CREATE POLICY "Users can view own activity"
  ON public.activity_log FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own activity" ON public.activity_log;
CREATE POLICY "Users can insert own activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 14. PROJECT REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_reports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_reports_user ON public.project_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_project_reports_project ON public.project_reports(project_id);

ALTER TABLE public.project_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own project reports" ON public.project_reports;
CREATE POLICY "Users can manage own project reports"
  ON public.project_reports FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 15. REPORT SECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    uuid NOT NULL REFERENCES public.project_reports(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  content_html text NOT NULL DEFAULT '',
  position     integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_sections_report_position ON public.report_sections(report_id, position);
CREATE INDEX IF NOT EXISTS idx_report_sections_user ON public.report_sections(user_id);

ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own report sections" ON public.report_sections;
CREATE POLICY "Users can manage own report sections"
  ON public.report_sections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.project_reports r
      WHERE r.id = report_id
        AND r.user_id = auth.uid()
    )
  );

-- ============================================================
-- 16. REPORT SECTION IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_section_images (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_section_id uuid NOT NULL REFERENCES public.report_sections(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path      text NOT NULL,
  alt_text          text,
  position          integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_section_images_section ON public.report_section_images(report_section_id, position);

ALTER TABLE public.report_section_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own report images" ON public.report_section_images;
CREATE POLICY "Users can manage own report images"
  ON public.report_section_images FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.report_sections s
      WHERE s.id = report_section_id
        AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- 17. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.contacts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.deals;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.projects;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.invoices;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.tasks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.events;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.project_reports;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.project_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.report_sections;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.report_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 18. AUTH: AUTO-CREATE PROFILE + DEFAULT DEAL STAGES
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.deal_stages (user_id, name, position, color, is_won, is_lost)
  SELECT *
  FROM (
    VALUES
      (NEW.id, 'Lead',          0, '#94A3B8', false, false),
      (NEW.id, 'Contacted',     1, '#2E6FA0', false, false),
      (NEW.id, 'Proposal Sent', 2, '#49A4BB', false, false),
      (NEW.id, 'Negotiation',   3, '#F59E0B', false, false),
      (NEW.id, 'Won',           4, '#15D8B3', true,  false),
      (NEW.id, 'Lost',          5, '#EF4444', false, true)
  ) AS defaults(user_id, name, position, color, is_won, is_lost)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.deal_stages ds
    WHERE ds.user_id = NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 19. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-assets',
  'profile-assets',
  true,
  5242880,
  ARRAY['image/png','image/jpeg','image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-assets',
  'report-assets',
  false,
  10485760,
  ARRAY['image/png','image/jpeg','image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 20. STORAGE RLS - PROFILE ASSETS
-- ============================================================
DROP POLICY IF EXISTS "Users can upload profile assets" ON storage.objects;
CREATE POLICY "Users can upload profile assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update profile assets" ON storage.objects;
CREATE POLICY "Users can update profile assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete profile assets" ON storage.objects;
CREATE POLICY "Users can delete profile assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public bucket: reads are public by bucket configuration.

-- ============================================================
-- 21. STORAGE RLS - REPORT ASSETS
-- ============================================================
DROP POLICY IF EXISTS "Users can upload report assets" ON storage.objects;
CREATE POLICY "Users can upload report assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'report-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can read report assets" ON storage.objects;
CREATE POLICY "Users can read report assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'report-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update report assets" ON storage.objects;
CREATE POLICY "Users can update report assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'report-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'report-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete report assets" ON storage.objects;
CREATE POLICY "Users can delete report assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'report-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- DONE
-- ============================================================
-- After this script completes:
--   1. Configure Supabase Auth (Email provider + URLs).
--   2. Copy project URL and key into .env.local.
--   3. Run `npm install` and `npm run build`.
-- ============================================================
