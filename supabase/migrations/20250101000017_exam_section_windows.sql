-- ═════════════════════════════════════════════════════════════
--  PER-SECTION EXAM WINDOWS
--
--  7-A has its lab period on Monday, 7-B on Wednesday — the same
--  exam needs a different open/close window per section. The window
--  lives on each student's assignment row (stamped per-section at
--  publish time); exams.starts_at/ends_at remain the fallback when
--  an assignment has no window of its own.
-- ═════════════════════════════════════════════════════════════

alter table exam_assignments
  add column class_section_id uuid references class_sections(id) on delete set null,
  add column starts_at timestamptz,
  add column ends_at timestamptz;

create index on exam_assignments (class_section_id);
