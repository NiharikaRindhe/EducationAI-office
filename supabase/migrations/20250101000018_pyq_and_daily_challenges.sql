-- ═════════════════════════════════════════════════════════════
--  PYQ (Previous Year Questions) — reuses question_bank rather than
--  a parallel table, since a PYQ is structurally just a question with
--  provenance (which year/board paper it came from). Teachers can tag
--  their own contributions as PYQ from the same add-to-bank flow.
-- ═════════════════════════════════════════════════════════════
alter table question_bank add column is_pyq boolean not null default false;
alter table question_bank add column pyq_year int;
alter table question_bank add column pyq_source text;  -- e.g. "CBSE Board 2024", "SPS Term 2 2023"

create index on question_bank (class_num, subject, is_pyq) where is_pyq;

-- A handful of seeded rows so the PYQ Hub isn't empty before any school's
-- teachers have contributed — same rationale as the 2 seeded RAG chunks
-- that proved the chat pipeline before real NCERT content was ingested.
insert into question_bank (scope, class_num, subject, type, difficulty, text, correct_answer, marks, source, is_pyq, pyq_year, pyq_source)
values
  ('global', 7, 'Science', 'short_answer', 'medium', 'State and explain the law of conservation of mass with an example.', null, 3, 'eduai', true, 2023, 'CBSE Class 7 Science Term 1'),
  ('global', 7, 'Mathematics', 'mcq', 'easy', 'Which of the following is a rational number?', null, 1, 'eduai', true, 2023, 'CBSE Class 7 Maths Term 1'),
  ('global', 9, 'Science', 'long_answer', 'hard', 'Describe the structure of a plant cell with a labelled diagram and explain the function of the cell wall.', null, 5, 'eduai', true, 2024, 'CBSE Class 9 Science Board Practice'),
  ('global', 9, 'Mathematics', 'short_answer', 'medium', 'Prove that the sum of the angles of a triangle is 180 degrees.', null, 3, 'eduai', true, 2024, 'CBSE Class 9 Maths Board Practice'),
  ('global', 10, 'Science', 'long_answer', 'hard', 'Explain the process of respiration in humans, distinguishing between aerobic and anaerobic respiration.', null, 5, 'eduai', true, 2024, 'CBSE Class 10 Science Board 2024'),
  ('global', 10, 'Social Science', 'short_answer', 'medium', 'Explain any three features of a federal system of government.', null, 3, 'eduai', true, 2023, 'CBSE Class 10 SST Board 2023');

-- ═════════════════════════════════════════════════════════════
--  DAILY CHALLENGES
--  Small, recurring goals separate from tasks/exams (which are
--  teacher-assigned) — these are system-generated, reset daily, and
--  exist purely to give students a reason to open the app/lab PC
--  even on a day with no assigned work. Evaluated on-read (same
--  pattern as badge awarding in gamification.service.ts) rather than
--  hooked into every XP-earning code path individually.
-- ═════════════════════════════════════════════════════════════
create table challenge_templates (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null,
  batch_id        int check (batch_id between 1 and 3),  -- null = all batches
  metric          text not null check (metric in
                    ('xp_earned', 'tasks_completed', 'exam_attempted', 'notes_created', 'chat_messages')),
  target_value    int not null,
  xp_reward       int not null default 20,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table student_daily_challenges (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references student_profiles(user_id),
  template_id     uuid not null references challenge_templates(id),
  challenge_date  date not null,
  progress        int not null default 0,
  completed_at    timestamptz,
  xp_awarded      boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (student_id, template_id, challenge_date)
);

create index on student_daily_challenges (student_id, challenge_date);

insert into challenge_templates (title, description, batch_id, metric, target_value, xp_reward) values
  ('Early Bird', 'Earn 20 XP today', null, 'xp_earned', 20, 15),
  ('Task Tackler', 'Complete 1 task today', null, 'tasks_completed', 1, 15),
  ('Note Taker', 'Save a note today', 2, 'notes_created', 1, 10),
  ('Note Taker', 'Save a note today', 3, 'notes_created', 1, 10),
  ('Curious Mind', 'Ask the AI tutor 2 questions today', 2, 'chat_messages', 2, 15),
  ('Curious Mind', 'Ask the AI tutor 2 questions today', 3, 'chat_messages', 2, 15),
  ('Exam Ready', 'Attempt an exam today', null, 'exam_attempted', 1, 25),
  ('Power Hour', 'Earn 50 XP today', null, 'xp_earned', 50, 30);

-- ─── RLS ─────────────────────────────────────────────────────
alter table challenge_templates enable row level security;
alter table student_daily_challenges enable row level security;

create policy challenge_templates_authenticated_read on challenge_templates
  for select using (auth.role() = 'authenticated');

create policy student_daily_challenges_own_read on student_daily_challenges
  for select using (student_id = auth.uid());

grant select on challenge_templates to anon;
