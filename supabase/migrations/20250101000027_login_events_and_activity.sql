-- ═════════════════════════════════════════════════════════════
--  LOGIN EVENTS + LAST-SEEN — powers "active logins" / "active
--  now" panels on the School Admin and Super Admin dashboards.
--
--  login_events gets one row per successful login (password or
--  PIN). last_seen_at is a lightweight heartbeat on user_profiles,
--  touched by requireAuth at most once per 5 minutes per user
--  (see api/src/middleware/auth.ts) — cheap enough to update on
--  the request path without a write on every single call.
-- ═════════════════════════════════════════════════════════════

alter table user_profiles add column last_seen_at timestamptz;

create table login_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references user_profiles(id) on delete cascade,
  school_id   uuid references schools(id) on delete cascade,
  role        text not null,
  method      text not null check (method in ('password', 'pin')),
  created_at  timestamptz not null default now()
);

create index on login_events (school_id, created_at);
create index on login_events (user_id, created_at);

-- ─── RLS ─────────────────────────────────────────────────────
alter table login_events enable row level security;

create policy login_events_super_admin_read on login_events
  for select using (jwt_role() = 'super_admin');

create policy login_events_school_admin_read on login_events
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on login_events to postgres, service_role;
grant select, insert on login_events to authenticated;
