-- ═════════════════════════════════════════════════════════════
--  AI USAGE LOG — token accounting per call, for the Super Admin
--  AI Console (spend by school / model / feature tier).
--
--  Written by the API's service-role client only (never by users
--  directly), so there is no user-facing insert policy — just
--  service_role writes and a super_admin-only read policy.
-- ═════════════════════════════════════════════════════════════

create table ai_usage_log (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid references schools(id) on delete set null,
  user_id           uuid references user_profiles(id) on delete set null,
  tier              text not null check (tier in ('chat', 'grading', 'qgen', 'vision')),
  provider          text not null check (provider in ('cloud', 'ollama')),
  model             text not null,
  prompt_tokens     int not null default 0,
  completion_tokens int not null default 0,
  created_at        timestamptz not null default now()
);

create index on ai_usage_log (created_at);
create index on ai_usage_log (school_id, created_at);
create index on ai_usage_log (tier, created_at);

-- ─── RLS ─────────────────────────────────────────────────────
alter table ai_usage_log enable row level security;

create policy ai_usage_log_super_admin_read on ai_usage_log
  for select using (jwt_role() = 'super_admin');

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on ai_usage_log to postgres, service_role;
grant select on ai_usage_log to authenticated;
