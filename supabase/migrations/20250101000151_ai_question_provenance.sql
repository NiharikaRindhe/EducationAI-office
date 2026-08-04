-- ═════════════════════════════════════════════════════════════
--  AI QUESTION PROVENANCE
--  question_bank.source already allows 'ai_generated', but nothing
--  recorded WHERE a generated question came from. A teacher asked to
--  trust an AI-written question in a real exam needs to be able to
--  check it against the book — so every generated question carries the
--  book, chapter and pages of the excerpts it was grounded in:
--    { "bookTitle": "...", "chapterNum": 3, "chapterTitle": "...",
--      "pages": [41, 42], "model": "...", "generatedAt": "..." }
--  Null for hand-written and CSV-imported questions.
-- ═════════════════════════════════════════════════════════════

alter table question_bank
  add column if not exists source_citation jsonb;

-- Lets a teacher pull up "everything the AI wrote for this class+subject"
-- to review in bulk, which is the natural QA pass before an exam.
create index if not exists question_bank_ai_generated_idx
  on question_bank (class_num, subject)
  where source = 'ai_generated';
