-- ═════════════════════════════════════════════════════════════
--  NCERT INGESTION JOBS
--  Tracks the lifecycle of an NCERT PDF upload through the
--  ingestion pipeline: queued → chunking → embedding → done.
--  One row per upload attempt; status + counts updated in-place
--  as each stage completes. Failed stages write error_message.
-- ═════════════════════════════════════════════════════════════
create table ncert_ingestion_jobs (
  id              uuid primary key default gen_random_uuid(),
  class_num       int  not null check (class_num between 1 and 10),
  subject         text not null,
  book_title      text not null,
  original_filename text not null,
  storage_path    text,                  -- Supabase Storage path once uploaded
  status          text not null default 'queued'
                    check (status in ('queued', 'chunking', 'embedding', 'done', 'error')),
  total_pages     int,
  chunks_created  int  not null default 0,
  chunks_embedded int  not null default 0,
  error_message   text,
  uploaded_by     uuid references user_profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger ncert_ingestion_jobs_set_updated_at
  before update on ncert_ingestion_jobs
  for each row execute function set_updated_at();

create index on ncert_ingestion_jobs (status);
create index on ncert_ingestion_jobs (class_num, subject);

-- ─── RLS ─────────────────────────────────────────────────────
alter table ncert_ingestion_jobs enable row level security;

-- Only super_admin can manage ingestion jobs
create policy ncert_ingestion_jobs_super_admin_all on ncert_ingestion_jobs
  for all using (jwt_role() = 'super_admin');

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on ncert_ingestion_jobs to postgres, service_role;
grant select, insert, update on ncert_ingestion_jobs to authenticated;
