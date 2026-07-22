-- ─────────────────────────────────────────────────────────────
--  search_text_chunks' default min_similarity (0.65) was calibrated
--  too high for mxbai-embed-large on real NCERT paraphrase-style
--  student questions. Measured live against the Class 7 Science
--  index: a genuinely on-topic question ("Are all the substances in
--  Group A of Table 2.2 edible?") scored only 0.64 against its own
--  correct source chunk — just under the cutoff — so it silently
--  got zero context and the tutor (correctly, post the honesty-prompt
--  fix) had to say "I don't have that." Off-topic control queries
--  topped out at 0.36, so there's a wide, safe gap to lower into.
--  0.50 keeps well clear of that off-topic ceiling while admitting
--  real matches down to ~0.55-0.56.
--  search_book_images' 0.72 default is untouched — measured
--  separately and already well-calibrated (on-topic 0.76+, off-topic
--  ≤0.42 there).
-- ─────────────────────────────────────────────────────────────
create or replace function search_text_chunks(
  query_embedding   vector(1024),
  match_class       int,
  match_subject     text,
  match_count       int   default 5,
  min_similarity    float default 0.5
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
