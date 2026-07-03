-- ─────────────────────────────────────────────────────────────
--  QUESTION BANK — reusable question pool. 'global' (EduAI-authored,
--  shared across all schools) or 'school' (teacher-contributed, scoped
--  to one school). Exams COPY rows from here into `questions` at
--  publish time, so a later bank edit never mutates a past exam.
-- ─────────────────────────────────────────────────────────────
create table question_bank (
  id              uuid primary key default gen_random_uuid(),
  scope           text not null default 'global' check (scope in ('global', 'school')),
  school_id       uuid references schools(id),  -- null when scope = 'global'
  class_num       int  not null check (class_num between 1 and 10),
  subject         text not null,
  chapter_num     int,
  type            text not null check (type in ('mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank')),
  difficulty      text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  text            text not null,
  options         jsonb,           -- [{ id, text, is_correct }] for MCQ
  correct_answer  text,            -- True/False, Fill-blank
  rubric          text,            -- short/long answer AI-scoring rubric
  marks           int not null default 1,
  source          text not null default 'eduai' check (source in ('eduai', 'teacher', 'ai_generated')),
  created_by      uuid references user_profiles(id),
  created_at      timestamptz not null default now(),
  constraint school_scope_requires_school check (scope = 'global' or school_id is not null)
);

create index on question_bank (class_num, subject);
create index on question_bank (school_id) where scope = 'school';

-- ─────────────────────────────────────────────────────────────
--  EXAMS
-- ─────────────────────────────────────────────────────────────
create table exams (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id),
  created_by      uuid not null references teacher_profiles(user_id),
  title           text not null,
  subject         text not null,
  class_num       int not null check (class_num between 1 and 10),
  duration_min    int not null default 30,
  total_marks     int not null default 0,  -- kept in sync by trigger below, not a generated column
  status          text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index on exams (school_id, class_num);
create index on exams (created_by);

-- ─────────────────────────────────────────────────────────────
--  QUESTIONS — belong to one exam. Copied from question_bank at
--  publish time (or hand-written directly in the exam builder).
-- ─────────────────────────────────────────────────────────────
create table questions (
  id              uuid primary key default gen_random_uuid(),
  exam_id         uuid not null references exams(id) on delete cascade,
  bank_id         uuid references question_bank(id),  -- traceability, nullable
  type            text not null check (type in ('mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank')),
  text            text not null,
  options         jsonb,
  correct_answer  text,
  marks           int not null default 1,
  rubric          text,
  ai_scoring      boolean not null default true,
  order_index     int not null default 0,
  created_at      timestamptz not null default now()
);

create index on questions (exam_id, order_index);

-- Recompute exams.total_marks whenever its questions change.
-- The earlier design used `GENERATED ALWAYS AS (0) STORED` — a bug that
-- would have shipped every exam worth zero marks. This trigger is the fix.
create or replace function recompute_exam_total_marks()
returns trigger
language plpgsql
as $$
declare
  affected_exam_id uuid;
begin
  affected_exam_id := coalesce(new.exam_id, old.exam_id);
  update exams
  set total_marks = (select coalesce(sum(marks), 0) from questions where exam_id = affected_exam_id)
  where id = affected_exam_id;
  return null;
end;
$$;

create trigger questions_recompute_total_marks
  after insert or update of marks or delete on questions
  for each row execute function recompute_exam_total_marks();

-- ─────────────────────────────────────────────────────────────
--  EXAM ASSIGNMENTS, SUBMISSIONS, ANSWERS
-- ─────────────────────────────────────────────────────────────
create table exam_assignments (
  id              uuid primary key default gen_random_uuid(),
  exam_id         uuid not null references exams(id) on delete cascade,
  student_id      uuid not null references student_profiles(user_id),
  admit_card_url  text,
  assigned_at     timestamptz not null default now(),
  unique (exam_id, student_id)
);

create table exam_submissions (
  id              uuid primary key default gen_random_uuid(),
  exam_id         uuid not null references exams(id),
  student_id      uuid not null references student_profiles(user_id),
  question_seed   text,  -- seeds the per-student randomized paper order
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  auto_submitted  boolean not null default false,  -- true if tab-switch/fullscreen limit triggered it
  total_score     numeric(6, 2),
  max_score       int,
  is_reviewed     boolean not null default false,  -- all subjective answers reviewed by teacher
  xp_awarded      int not null default 0,
  unique (exam_id, student_id)
);

create index on exam_submissions (exam_id, student_id);

-- One row per question per submission. Upserted on (submission, question)
-- as the student answers — this is what makes auto-save/crash-resume work;
-- a lab PC losing power mid-exam must not lose the student's answers.
create table exam_answers (
  id                    uuid primary key default gen_random_uuid(),
  exam_submission_id    uuid not null references exam_submissions(id) on delete cascade,
  question_id           uuid not null references questions(id),
  student_answer        text,
  selected_option_id    text,
  is_correct            boolean,
  auto_score            numeric(4, 1),
  ai_score              numeric(4, 1),
  ai_covered_points     text[],
  ai_missing_points     text[],
  ai_feedback           text,
  ai_scored_at          timestamptz,
  final_score           numeric(4, 1),
  teacher_note          text,
  teacher_reviewed_at   timestamptz,
  teacher_overrode_ai   boolean not null default false,
  updated_at            timestamptz not null default now(),
  unique (exam_submission_id, question_id)
);

create trigger exam_answers_set_updated_at
  before update on exam_answers
  for each row execute function set_updated_at();

create index on exam_answers (exam_submission_id);
