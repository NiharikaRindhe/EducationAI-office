-- ─────────────────────────────────────────────────────────────
--  Off-subject nudge: chats stay locked to one subject (that's what
--  scopes RAG retrieval to the right book — a real safety property,
--  not just organization), but a student can still ask a Mathematics
--  question inside their Science chat. Rather than silently answering
--  with no textbook grounding, chat.service.ts also searches the
--  student's OTHER subjects for the same class; if one of them matches
--  meaningfully better, the student gets a small heads-up alongside the
--  answer ("this looks like Mathematics — you're in Science").
-- ─────────────────────────────────────────────────────────────

create or replace function search_text_chunks_cross_subject(
  query_embedding   vector(1024),
  match_class       int,
  exclude_subject   text,
  match_count       int   default 1,
  min_similarity    float default 0.55
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
    and 1 - (embedding <=> query_embedding) > min_similarity
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Persisted so the notice survives a reload of the chat history, not just
-- the live response right after sending.
alter table chat_messages add column subject_warning text;
