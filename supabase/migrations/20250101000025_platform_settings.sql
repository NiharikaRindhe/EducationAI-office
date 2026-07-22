-- ═════════════════════════════════════════════════════════════
--  PLATFORM SETTINGS — runtime-editable key/value config the
--  Super Admin controls without a redeploy: which model serves
--  each AI tier, and global on/off switches per AI tier.
--
--  Env vars (AI_CHAT_MODEL etc.) remain the fallback when a key
--  is absent, so a fresh install with no rows behaves exactly as
--  before. See api/src/lib/ai.ts for the read path.
-- ═════════════════════════════════════════════════════════════

create table platform_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references user_profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

-- ─── RLS ─────────────────────────────────────────────────────
alter table platform_settings enable row level security;

-- Every authenticated request needs to read feature-flag settings
-- (e.g. "is AI chat enabled?") to decide what to show — not just admins.
create policy platform_settings_read on platform_settings
  for select using (auth.role() = 'authenticated');

create policy platform_settings_super_admin_write on platform_settings
  for all using (jwt_role() = 'super_admin');

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on platform_settings to postgres, service_role;
grant select, insert, update, delete on platform_settings to authenticated;
