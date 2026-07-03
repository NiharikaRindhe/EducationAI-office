-- ─────────────────────────────────────────────────────────────
--  ENGLISH ASSESSMENT — avatar speak & repeat (Batch 1 words,
--  Batch 1-2 short sentences). Content is EduAI-hardcoded, never
--  teacher/AI-generated (see content ownership model).
-- ─────────────────────────────────────────────────────────────
create table english_assessment_items (
  id            uuid primary key default gen_random_uuid(),
  class_num     int not null check (class_num between 1 and 8),
  type          text not null check (type in
                  ('word_repeat', 'word_see_say', 'sentence_read', 'passage_read', 'listen_respond')),
  content       text not null,
  audio_url     text,
  difficulty    text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  unit          text,
  chapter       text,
  created_at    timestamptz not null default now()
);

create table english_assessment_attempts (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references student_profiles(user_id),
  item_id         uuid not null references english_assessment_items(id),
  class_num       int not null,
  audio_url       text,
  transcript      text,
  accuracy_score  int check (accuracy_score between 0 and 10),
  fluency_score   int check (fluency_score between 0 and 10),
  wpm             int,
  ai_feedback     text,
  result          text check (result in ('correct', 'close', 'incorrect')),
  xp_earned       int not null default 0,
  attempted_at    timestamptz not null default now()
);

create index on english_assessment_attempts (student_id, attempted_at);
