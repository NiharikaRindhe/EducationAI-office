-- ─────────────────────────────────────────────────────────────
--  RAG: TEXT CHUNKS + BOOK IMAGES
--  vector(1024) — mxbai-embed-large via local Ollama (the embedding
--  model actually available on the school-server class of hardware),
--  not OpenAI's 1536-dim or nomic-embed-text's 768-dim. No `stream`
--  column: Batch 4 / JEE-NEET streams were removed in v2, platform is
--  Classes 1-10 only.
-- ─────────────────────────────────────────────────────────────
create table text_chunks (
  id              uuid primary key default gen_random_uuid(),
  class_num       int not null check (class_num between 1 and 10),
  subject         text not null,
  book_title      text not null,
  chapter_num     int,
  chapter_title   text,
  page_num        int,
  content         text not null,
  token_count     int,
  embedding       vector(1024),
  created_at      timestamptz not null default now()
);

create index on text_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on text_chunks (class_num, subject);

create table book_images (
  id              uuid primary key default gen_random_uuid(),
  class_num       int not null check (class_num between 1 and 10),
  subject         text not null,
  book_title      text,
  chapter_num     int,
  chapter_title   text,
  page_num        int,
  image_url       text not null,
  caption         text,
  embedding       vector(1024),
  created_at      timestamptz not null default now()
);

create index on book_images using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on book_images (class_num, subject);

-- ─────────────────────────────────────────────────────────────
--  CHAT SESSIONS + MESSAGES (Batch 2-3 only; no chat for Batch 1)
-- ─────────────────────────────────────────────────────────────
create table chat_sessions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references student_profiles(user_id),
  class_num       int,
  subject         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger chat_sessions_set_updated_at
  before update on chat_sessions
  for each row execute function set_updated_at();

create table chat_messages (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references chat_sessions(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  content          text,
  image_url        text,             -- student-uploaded photo (vision input)
  sources          jsonb,            -- [{ chunk_id, book_title, chapter, page, excerpt }]
  returned_images  jsonb,            -- [{ image_id, url, caption, chapter, page }]
  tokens_used      int,
  created_at       timestamptz not null default now()
);

create index on chat_messages (session_id, created_at);

-- ─────────────────────────────────────────────────────────────
--  pgvector SEARCH FUNCTIONS
-- ─────────────────────────────────────────────────────────────
create or replace function search_text_chunks(
  query_embedding   vector(1024),
  match_class       int,
  match_subject     text,
  match_count       int   default 5,
  min_similarity    float default 0.65
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
    and 1 - (embedding <=> query_embedding) > min_similarity
  order by embedding <=> query_embedding
  limit match_count;
$$;

create or replace function search_book_images(
  query_embedding   vector(1024),
  match_class       int,
  match_subject     text,
  match_count       int   default 3,
  min_similarity    float default 0.72
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
    and 1 - (embedding <=> query_embedding) > min_similarity
  order by embedding <=> query_embedding
  limit match_count;
$$;
