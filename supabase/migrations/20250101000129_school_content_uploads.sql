-- ═════════════════════════════════════════════════════════════
--  SCHOOL-SCOPED CONTENT UPLOADS
--  School Admins can now upload their own supplementary PDFs
--  (school_id set), alongside the Super Admin's platform-wide
--  NCERT library (school_id null — unchanged, still visible to
--  every school). A school's own upload only ever powers RAG
--  retrieval for that school's own students; it can never leak
--  into another school's chat.
--
--  Per-(class, subject) upload limit for school admins is
--  enforced in application code (SCHOOL_UPLOAD_LIMIT_PER_SUBJECT
--  in superAdminContent.service.ts), not the DB — it's a soft,
--  changeable business rule, not a data-integrity constraint.
-- ═════════════════════════════════════════════════════════════

alter table ncert_ingestion_jobs add column school_id uuid references schools(id);
alter table text_chunks add column school_id uuid references schools(id);
alter table book_images add column school_id uuid references schools(id);

create index on ncert_ingestion_jobs (school_id, class_num, subject);
create index on text_chunks (school_id);
create index on book_images (school_id);

-- ─── Retrieval: also search the student's OWN school's uploads ───
-- Dropped first: adding a parameter changes the function's arg-type
-- signature, so `create or replace` would otherwise leave the old
-- 5-arg version in place as a second overload instead of replacing it.
drop function if exists search_text_chunks(vector(1024), int, text, int, float);
create or replace function search_text_chunks(
  query_embedding   vector(1024),
  match_class       int,
  match_subject     text,
  match_count       int   default 5,
  min_similarity    float default 0.5,
  match_school_id   uuid  default null
)
returns table (
  id            uuid,
  content       text,
  book_title    text,
  chapter_num   int,
  chapter_title text,
  page_num      int,
  similarity    float
)
language sql stable as $$
  select id, content, book_title, chapter_num, chapter_title, page_num,
         1 - (embedding <=> query_embedding) as similarity
  from text_chunks
  where class_num = match_class
    and subject   = match_subject
    and (school_id is null or school_id = match_school_id)
    and 1 - (embedding <=> query_embedding) > min_similarity
  order by embedding <=> query_embedding
  limit match_count;
$$;

drop function if exists search_book_images(vector(1024), int, text, int, float);
create or replace function search_book_images(
  query_embedding   vector(1024),
  match_class       int,
  match_subject     text,
  match_count       int   default 3,
  min_similarity    float default 0.72,
  match_school_id   uuid  default null
)
returns table (
  id            uuid,
  image_url     text,
  caption       text,
  chapter_title text,
  page_num      int,
  similarity    float
)
language sql stable as $$
  select id, image_url, caption, chapter_title, page_num,
         1 - (embedding <=> query_embedding) as similarity
  from book_images
  where class_num = match_class
    and subject   = match_subject
    and (school_id is null or school_id = match_school_id)
    and 1 - (embedding <=> query_embedding) > min_similarity
  order by embedding <=> query_embedding
  limit match_count;
$$;

drop function if exists search_text_chunks_cross_subject(vector(1024), int, text, int, float);
create or replace function search_text_chunks_cross_subject(
  query_embedding   vector(1024),
  match_class       int,
  exclude_subject   text,
  match_count       int   default 1,
  min_similarity    float default 0.55,
  match_school_id   uuid  default null
)
returns table (
  subject       text,
  similarity    float
)
language sql stable as $$
  select subject,
         1 - (embedding <=> query_embedding) as similarity
  from text_chunks
  where class_num = match_class
    and subject <> exclude_subject
    and (school_id is null or school_id = match_school_id)
    and 1 - (embedding <=> query_embedding) > min_similarity
  order by embedding <=> query_embedding
  limit match_count;
$$;
