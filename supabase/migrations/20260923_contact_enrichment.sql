-- Nexus CRM: contact enrichment
-- Safe, additive migration for existing installations.

alter table public.contacts
  add column if not exists phone_country_code text default '+20',
  add column if not exists phone_number text,
  add column if not exists nationality text,
  add column if not exists lead_source text default 'direct';

create index if not exists idx_contacts_user_lead_source
  on public.contacts(user_id, lead_source);

-- Keep legacy `phone` untouched so existing contact data remains available.
