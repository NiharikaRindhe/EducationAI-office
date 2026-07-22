-- ═════════════════════════════════════════════════════════════
--  RAG PRODUCTION HARDENING
--  1. Storage buckets: the original PDFs (re-ingestion source of
--     truth), extracted figures (served into chat), and student
--     photo uploads for vision doubt-solving.
--  2. chapter_map on ingestion jobs — NCERT layouts are stable;
--     ten minutes of manual chapter→page mapping in the upload
--     form beats a heuristic silently mis-tagging chapters.
--  3. analyze_rag_tables() — ivfflat indexes were created on
--     empty tables; planner stats must be refreshed after a bulk
--     ingest or the index is planned badly.
-- ═════════════════════════════════════════════════════════════

-- ─── Buckets ─────────────────────────────────────────────────
-- Public read: figure/photo URLs render in <img> tags in the chat UI
-- without signed-URL churn. Object names are UUIDs (unguessable), the
-- content is textbook figures and student photos of textbook problems,
-- and the school server is LAN-scoped. Writes are service-role only
-- (no INSERT/UPDATE policies for authenticated).
insert into storage.buckets (id, name, public)
values ('ncert', 'ncert', true),
       ('chat-uploads', 'chat-uploads', true)
on conflict (id) do nothing;

create policy rag_buckets_public_read on storage.objects
  for select using (bucket_id in ('ncert', 'chat-uploads'));

-- ─── Manual chapter map (optional, per upload) ───────────────
-- [{ "chapter": 1, "title": "Nutrition in Plants", "fromPage": 1, "toPage": 14 }, ...]
-- When present it overrides heading-based chapter detection entirely.
alter table ncert_ingestion_jobs add column chapter_map jsonb;

-- ─── Planner stats refresh after bulk ingest ─────────────────
create or replace function analyze_rag_tables()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  analyze text_chunks;
  analyze book_images;
end;
$$;

revoke execute on function analyze_rag_tables() from public, anon, authenticated;
grant execute on function analyze_rag_tables() to service_role;
