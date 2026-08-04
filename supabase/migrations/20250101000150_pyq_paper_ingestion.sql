-- ═════════════════════════════════════════════════════════════
--  PYQ PAPER TAGGING ON NCERT INGESTION JOBS
--  Previous-year question papers are uploaded as PDFs through the
--  same ingestion pipeline as textbooks (storage → chunking →
--  embedding), not typed in row-by-row like the CSV question bank
--  import. These columns let a Super Admin tag an upload as a PYQ
--  paper instead of a textbook, so the library and the AI tutor's
--  citations can tell the two apart.
-- ═════════════════════════════════════════════════════════════

alter table ncert_ingestion_jobs
  add column is_pyq    boolean not null default false,
  add column pyq_year  int,
  add column pyq_source text;

alter table ncert_ingestion_jobs
  add constraint ncert_ingestion_jobs_pyq_year_check
    check (pyq_year is null or pyq_year between 1990 and 2100);

create index on ncert_ingestion_jobs (is_pyq) where is_pyq;
