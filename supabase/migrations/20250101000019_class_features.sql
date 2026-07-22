-- ═════════════════════════════════════════════════════════════
--  CLASS FEATURES — feature toggles (AI chat, leaderboard)
--  scoped to a school and class level.
-- ═════════════════════════════════════════════════════════════

create table class_features (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references schools(id) on delete cascade,
  class_num           int not null check (class_num between 1 and 10),
  ai_chat_enabled     boolean not null default true,
  leaderboard_enabled boolean not null default true,
  created_at          timestamptz not null default now(),
  unique (school_id, class_num)
);

create index on class_features (school_id, class_num);

-- ─── RLS ─────────────────────────────────────────────────────
alter table class_features enable row level security;

create policy class_features_select on class_features
  for select using (school_id = jwt_school_id() or jwt_role() = 'super_admin');

create policy class_features_school_admin_all on class_features
  for all using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

create policy class_features_super_admin_all on class_features
  for all using (jwt_role() = 'super_admin');

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on class_features to postgres, service_role;
grant select, insert, update, delete on class_features to authenticated;
