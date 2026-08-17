-- Teacher control over when students see their marks.
--
-- Until now a score appeared on the student's screen the moment grading
-- finished. For objective questions that is fine. For anything the AI marked,
-- it means a child sees a machine-generated score — and acts on it, and tells
-- their parents about it — before any teacher has looked at the paper. It also
-- means a whole class can compare marks mid-lesson while the teacher is still
-- running the period.
--
-- `results_released_at` is the gate: NULL means withheld, a timestamp means
-- released and records when.
--
-- Existing exams are backfilled as RELEASED. Their students can already see
-- these scores; retroactively hiding marks a child was shown last week would
-- be a worse surprise than the gap this closes.

alter table exams
  add column if not exists results_released_at timestamptz,
  add column if not exists results_released_by uuid references user_profiles (id) on delete set null;

comment on column exams.results_released_at is
  'When marks were made visible to students. NULL = withheld pending teacher review.';

update exams
   set results_released_at = created_at
 where results_released_at is null
   and status in ('published', 'closed');

-- The student-facing read path filters on this, so it is worth an index for
-- the "which of my exams have marks out" question.
create index if not exists exams_results_released_idx
  on exams (id) where results_released_at is not null;
