-- ═════════════════════════════════════════════════════════════
--  SCHOOL FEATURE ENTITLEMENTS — what a school has actually
--  bought, set from a package at registration.
--
--  Two layers, deliberately separated:
--
--    1. ENTITLEMENT (this file)  — what the school PAID FOR.
--       Super Admin only. A School Admin can never grant itself
--       a feature.
--
--    2. LOCAL PREFERENCE (class_features) — what the school
--       CHOOSES to use, per class. School Admin controlled, but
--       may only switch things OFF within what layer 1 grants.
--
--  Effective access = entitled AND locally enabled.
--
--  Before this migration `schools.plan` was captured at
--  registration, shown in the UI, and read by nothing — a
--  decorative label. This makes it mean something.
-- ═════════════════════════════════════════════════════════════

-- ─── The gateable feature surface ────────────────────────────
-- Deliberately NOT everything. Core teaching workflow (auth,
-- timetable, tasks, notes, exams, announcements, tickets,
-- badges/streak/profile) is always on — a school that can't
-- take an exam isn't a school, it's a demo.
create table feature_catalog (
  key         text primary key,
  label       text not null,
  description text,
  sort_order  int  not null default 0
);

insert into feature_catalog (key, label, description, sort_order) values
  ('ai_tutor',              'AI Doubt Tutor',        'Students can ask the AI questions grounded in their textbooks.', 10),
  ('ai_exam_generator',     'AI Exam Generator',     'Teachers generate exam questions from indexed books.',           20),
  ('virtual_labs',          'Virtual Science Labs',  'Chemistry, Physics and Biology simulations.',                    30),
  ('games',                 'Learning Games',        'Interactive games for Classes 1-4.',                             40),
  ('leaderboard',           'Leaderboard',           'Class and school ranking boards.',                               50),
  ('pyq_hub',               'Past Year Questions',   'Board PYQ browser for exam preparation.',                        60),
  ('reports_analytics',     'Reports & Analytics',   'Teacher performance heatmaps, PTM and task reports.',            70),
  ('school_content_upload', 'School Book Uploads',   'School may upload its own books beyond the NCERT library.',      80);

-- ─── Packages sold at registration ───────────────────────────
create table packages (
  key         text primary key,
  label       text not null,
  description text,
  sort_order  int  not null default 0
);

insert into packages (key, label, description, sort_order) values
  ('starter',    'Starter',    'Core teaching workflow plus games and leaderboard.',     10),
  ('school',     'School',     'Adds the AI tutor, virtual labs, PYQ and reporting.',    20),
  ('enterprise', 'Enterprise', 'Everything, including AI generation and own uploads.',   30),
  ('custom',     'Custom',     'Hand-picked features; ignores the package defaults.',    40);

-- Which features each package grants. Editable data, not hardcoded in
-- the app — repackaging later is an UPDATE, not a redeploy.
create table package_features (
  package_key text not null references packages(key)        on delete cascade,
  feature_key text not null references feature_catalog(key) on delete cascade,
  primary key (package_key, feature_key)
);

insert into package_features (package_key, feature_key) values
  ('starter',    'games'),
  ('starter',    'leaderboard'),

  ('school',     'games'),
  ('school',     'leaderboard'),
  ('school',     'ai_tutor'),
  ('school',     'virtual_labs'),
  ('school',     'pyq_hub'),
  ('school',     'reports_analytics'),

  ('enterprise', 'games'),
  ('enterprise', 'leaderboard'),
  ('enterprise', 'ai_tutor'),
  ('enterprise', 'virtual_labs'),
  ('enterprise', 'pyq_hub'),
  ('enterprise', 'reports_analytics'),
  ('enterprise', 'ai_exam_generator'),
  ('enterprise', 'school_content_upload');
  -- 'custom' intentionally grants nothing by default — it is driven
  -- entirely by per-school rows below.

-- ─── Per-school effective entitlement ────────────────────────
-- Seeded from the package at registration, then independently
-- adjustable (a school can buy a single extra feature without
-- being moved to a whole new package).
create table school_entitlements (
  school_id   uuid    not null references schools(id)           on delete cascade,
  feature_key text    not null references feature_catalog(key)  on delete cascade,
  enabled     boolean not null default true,
  updated_by  uuid    references user_profiles(id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (school_id, feature_key)
);

create index on school_entitlements (school_id) where enabled;

-- `custom` is a legitimate plan value now that entitlements can diverge
-- from any named package.
alter table schools drop constraint if exists schools_plan_check;
alter table schools add constraint schools_plan_check
  check (plan in ('starter', 'school', 'enterprise', 'custom'));

-- ─── Grandfather every existing school ───────────────────────
-- Enforcement starts the moment this ships. Seeding from each school's
-- current `plan` would silently cut off students who are using labs and
-- the tutor today, so existing schools get everything and are downgraded
-- deliberately from the Super Admin console instead.
insert into school_entitlements (school_id, feature_key, enabled)
select s.id, f.key, true
from schools s
cross join feature_catalog f
on conflict (school_id, feature_key) do nothing;

-- ─── RLS ─────────────────────────────────────────────────────
alter table feature_catalog     enable row level security;
alter table packages            enable row level security;
alter table package_features    enable row level security;
alter table school_entitlements enable row level security;

-- The catalog and package definitions are not secret: every authenticated
-- user reads them to render "this needs an upgrade" states correctly.
create policy feature_catalog_read on feature_catalog
  for select using (auth.role() = 'authenticated');
create policy packages_read on packages
  for select using (auth.role() = 'authenticated');
create policy package_features_read on package_features
  for select using (auth.role() = 'authenticated');

create policy feature_catalog_super_admin_all on feature_catalog
  for all using (jwt_role() = 'super_admin');
create policy packages_super_admin_all on packages
  for all using (jwt_role() = 'super_admin');
create policy package_features_super_admin_all on package_features
  for all using (jwt_role() = 'super_admin');

-- A school may READ its own entitlements (to hide unentitled nav), but
-- only the Super Admin may WRITE them. This is the whole point of the
-- layer split — no self-service upgrades.
create policy school_entitlements_read_own on school_entitlements
  for select using (school_id = jwt_school_id() or jwt_role() = 'super_admin');

create policy school_entitlements_super_admin_all on school_entitlements
  for all using (jwt_role() = 'super_admin');

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on feature_catalog, packages, package_features, school_entitlements
  to postgres, service_role;
grant select on feature_catalog, packages, package_features to authenticated;
grant select on school_entitlements to authenticated;
