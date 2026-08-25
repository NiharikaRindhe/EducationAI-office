-- ═════════════════════════════════════════════════════════════
--  PDF SIMULATOR — page-grounded simulations, tutor chat and
--  notes layered onto an already-ingested NCERT book.
--
--  Deliberately NOT a new value in ncert_ingestion_jobs.status:
--  that column reaching 'done' means "RAG is ready, the AI tutor
--  can answer from this book" and student.routes already depends
--  on that meaning. Threading a ~9-minute classification pass
--  through the same single-concurrency queue would delay RAG
--  readiness for every book behind it, and would mean touching
--  claim_next_ingestion_job / requeue_stale_ingestion_jobs — the
--  hardened claiming logic 20250101000130 exists to protect.
--  So simulations get their own decoupled lifecycle column and
--  their own claim/requeue functions, modeled on that migration.
-- ═════════════════════════════════════════════════════════════

alter table ncert_ingestion_jobs
  add column sim_status text not null default 'disabled'
    check (sim_status in ('disabled', 'queued', 'running', 'ready', 'error')),
  add column sim_pages_total int,
  add column sim_pages_done  int not null default 0,
  add column sim_error       text,
  add column sim_locked_at   timestamptz,
  add column sim_locked_by   text;

create index on ncert_ingestion_jobs (sim_status, created_at);

-- ─── sim_pages ──────────────────────────────────────────────
--  Server-side page text, extracted once during the simulating
--  pass. This is the ONLY source of grounding text for reader
--  chat and highlight-explain — the client sends a page number,
--  never page text, closing the prompt-injection hole the
--  original upstream design had (client posted its own scraped
--  text straight into the LLM context).
create table sim_pages (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references ncert_ingestion_jobs(id) on delete cascade,
  page_number   int  not null,
  text          text not null,
  word_count    int  not null default 0,
  content_hash  text,
  created_at    timestamptz not null default now(),
  unique (job_id, page_number)
);

create index on sim_pages (content_hash);

-- ─── sim_annotations ────────────────────────────────────────
--  Validated SimSpec JSON per page. content_hash is what makes
--  cross-book, cross-school dedup work: two ncert_ingestion_jobs
--  rows (a platform upload and a school's re-upload of the same
--  PDF, or two schools uploading the same file) whose page text
--  hashes identically skip re-classification entirely and just
--  copy the existing annotations onto the new job_id.
create table sim_annotations (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references ncert_ingestion_jobs(id) on delete cascade,
  page_number   int  not null,
  quote         text not null,
  spec          jsonb not null,
  spec_version  text not null default '2.0',
  content_hash  text,
  created_at    timestamptz not null default now()
);

create index on sim_annotations (job_id, page_number);
create index on sim_annotations (content_hash);

-- ─── sim_notes ──────────────────────────────────────────────
--  Student's own highlight/notes while reading. Deliberately
--  separate from the generic `notes` table (title/content/tags,
--  no page or highlight concept) rather than overloading it.
create table sim_notes (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references ncert_ingestion_jobs(id) on delete cascade,
  student_id    uuid not null references user_profiles(id) on delete cascade,
  school_id     uuid references schools(id),
  page_number   int  not null,
  highlight     text not null default '',
  note          text not null default '',
  color         text not null default 'yellow',
  starred       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger sim_notes_set_updated_at
  before update on sim_notes
  for each row execute function set_updated_at();

create index on sim_notes (job_id, student_id);
create index on sim_notes (student_id, page_number);

-- ─── RLS ─────────────────────────────────────────────────────
alter table sim_pages       enable row level security;
alter table sim_annotations enable row level security;
alter table sim_notes       enable row level security;

create policy sim_pages_super_admin_all on sim_pages
  for all using (jwt_role() = 'super_admin');

create policy sim_annotations_super_admin_all on sim_annotations
  for all using (jwt_role() = 'super_admin');

-- Read-only for students/teachers/school_admin — school scoping matches
-- the text_chunks_authenticated_read pattern (20250101000179): a NULL
-- school_id on the owning job is a platform-wide book, visible to every
-- school; a set school_id is only visible to that school. Class/subject
-- whitelist scoping is enforced in the service layer (supabaseAdmin
-- reads, same as text_chunks/book_images) rather than here — RLS on
-- these tables is defense-in-depth against a leaked anon key, not the
-- primary gate.
create policy sim_pages_authenticated_read on sim_pages
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from ncert_ingestion_jobs j
       where j.id = sim_pages.job_id
         and (j.school_id is null or j.school_id = jwt_school_id())
    )
  );

create policy sim_annotations_authenticated_read on sim_annotations
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from ncert_ingestion_jobs j
       where j.id = sim_annotations.job_id
         and (j.school_id is null or j.school_id = jwt_school_id())
    )
  );

-- sim_notes: a student's own rows only, same idiom as notes_student_own
-- (20250101000013).
create policy sim_notes_student_own on sim_notes
  for all using (student_id = auth.uid());

create policy sim_notes_super_admin_all on sim_notes
  for all using (jwt_role() = 'super_admin');

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on sim_pages, sim_annotations, sim_notes to postgres, service_role;
grant select on sim_pages, sim_annotations to authenticated;
grant select, insert, update, delete on sim_notes to authenticated;

-- ─── Job claiming — copy of claim_next_ingestion_job /
--  requeue_stale_ingestion_jobs (20250101000130), operating on the
--  new sim_status/sim_locked_at lane instead of status/locked_at.
--  Same FOR UPDATE SKIP LOCKED reasoning, same staleness window.
-- ─────────────────────────────────────────────────────────────
create or replace function claim_next_sim_job(worker_id text)
returns setof ncert_ingestion_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed uuid;
begin
  select id into claimed
    from ncert_ingestion_jobs
   where sim_status = 'queued'
   order by created_at
   limit 1
     for update skip locked;

  if claimed is null then
    return;
  end if;

  return query
    update ncert_ingestion_jobs
       set sim_status    = 'running',
           sim_locked_at = now(),
           sim_locked_by = worker_id,
           sim_error     = null
     where id = claimed
    returning *;
end;
$$;

create or replace function requeue_stale_sim_jobs(stale_after interval default '15 minutes')
returns table (id uuid)
language sql
security definer
set search_path = public
as $$
  update ncert_ingestion_jobs
     set sim_status    = 'queued',
         sim_locked_at = null,
         sim_locked_by = null
   where sim_status = 'running'
     and (sim_locked_at is null or sim_locked_at < now() - stale_after)
  returning ncert_ingestion_jobs.id;
$$;

revoke execute on function claim_next_sim_job(text) from public, anon, authenticated;
revoke execute on function requeue_stale_sim_jobs(interval) from public, anon, authenticated;
grant execute on function claim_next_sim_job(text) to service_role;
grant execute on function requeue_stale_sim_jobs(interval) to service_role;

-- ─── Feature catalog entry ──────────────────────────────────
--  Mirrors FEATURE_KEYS in api/src/lib/entitlements.ts. Added to the
--  'school' and 'enterprise' packages (an AI-classification feature,
--  same tier as ai_tutor/virtual_labs) but not 'starter'.
insert into feature_catalog (key, label, description, sort_order) values
  ('pdf_simulator', 'PDF Simulator', 'Turns textbook pages into interactive simulations with a page-grounded AI tutor.', 90);

insert into package_features (package_key, feature_key) values
  ('school',     'pdf_simulator'),
  ('enterprise', 'pdf_simulator');

-- Existing schools: same grandfathering call as the original entitlements
-- migration (20250101000157) — a school already provisioned with SOME
-- entitlement rows does NOT automatically pick up a brand-new feature key
-- (entitlementsFor() only grandfathers a school with ZERO rows), so
-- without this every already-onboarded school would silently lose access
-- to a feature their package nominally includes.
insert into school_entitlements (school_id, feature_key, enabled)
select s.id, 'pdf_simulator', true
from schools s
on conflict (school_id, feature_key) do nothing;
