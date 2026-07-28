-- ═════════════════════════════════════════════════════════════
--  INGESTION JOB CLAIMING
--
--  The ingestion worker used to live inside the API process and
--  assumed it was the only one alive: it picked the oldest queued
--  job with a plain SELECT, and on boot it flipped EVERY job stuck
--  in chunking/embedding back to 'queued'.
--
--  Both assumptions break the moment more than one worker process
--  can exist at the same time — which is now the normal case, not
--  an edge case: the worker runs in its own container, so during
--  any restart/redeploy the old one is still finishing a book while
--  the new one boots. With the old logic the booting worker would
--  requeue the in-flight job and a second worker would start the
--  same book, and because the pipeline is delete-then-insert per
--  book, their deletes and inserts interleave — the book ends up
--  with half its chunks missing and no error anywhere.
--
--  So: claiming is atomic (FOR UPDATE SKIP LOCKED — two workers
--  polling the same instant can never take the same row), and a
--  job is only considered abandoned when its lock has actually
--  gone stale, not merely because some worker happened to boot.
-- ═════════════════════════════════════════════════════════════

alter table ncert_ingestion_jobs
  add column locked_at timestamptz,
  add column locked_by text;

-- Claim ordering: oldest queued first.
create index on ncert_ingestion_jobs (status, created_at);

-- ─── Atomically take the next queued job ─────────────────────
create or replace function claim_next_ingestion_job(worker_id text)
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
   where status = 'queued'
   order by created_at
   limit 1
     for update skip locked;

  if claimed is null then
    return;
  end if;

  return query
    update ncert_ingestion_jobs
       set status        = 'chunking',
           locked_at     = now(),
           locked_by     = worker_id,
           error_message = null
     where id = claimed
    returning *;
end;
$$;

-- ─── Release jobs whose worker died mid-run ──────────────────
-- 15 minutes because PDF text extraction is one synchronous block
-- with no checkpoint to heartbeat from — a large book legitimately
-- holds the lock silently for minutes before the embedding stage
-- starts refreshing it per batch. Too tight a window here would
-- steal a job that's actually still being worked on, which is the
-- exact corruption this migration exists to prevent.
create or replace function requeue_stale_ingestion_jobs(stale_after interval default '15 minutes')
returns table (id uuid)
language sql
security definer
set search_path = public
as $$
  update ncert_ingestion_jobs
     set status    = 'queued',
         locked_at = null,
         locked_by = null
   where status in ('chunking', 'embedding')
     and (locked_at is null or locked_at < now() - stale_after)
  returning ncert_ingestion_jobs.id;
$$;

revoke execute on function claim_next_ingestion_job(text) from public, anon, authenticated;
revoke execute on function requeue_stale_ingestion_jobs(interval) from public, anon, authenticated;
grant execute on function claim_next_ingestion_job(text) to service_role;
grant execute on function requeue_stale_ingestion_jobs(interval) to service_role;
