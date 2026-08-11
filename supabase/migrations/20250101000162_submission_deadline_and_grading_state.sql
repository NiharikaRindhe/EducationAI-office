-- ═════════════════════════════════════════════════════════════
--  P0 EXAM INTEGRITY — authoritative deadline + grading state
--
--  1. deadline_at
--     The deadline was recomputed on every request from
--     duration_min and the window. That means an admin editing
--     the exam mid-attempt silently moves a student's deadline,
--     forward or backward, while they are writing. Stamp it once
--     when the attempt starts and never move it.
--
--  2. Grading state
--     Grading ran inline with submit: the row was marked
--     submitted, then the AI was called in the same request. A
--     slow or failing provider surfaced as a failed submission to
--     a student who had, in fact, submitted. Grading becomes a
--     tracked state the worker drives, so an AI outage delays a
--     score instead of losing a paper.
--
--  3. auto_submit_reason
--     Distinguishes an abandoned attempt swept up by the expiry
--     job from a student clicking Submit, and from the existing
--     proctoring auto-submit.
-- ═════════════════════════════════════════════════════════════

alter table exam_submissions
  add column deadline_at        timestamptz,
  add column grading_status     text not null default 'pending'
    check (grading_status in ('pending', 'in_progress', 'graded', 'failed')),
  add column grading_attempts   int  not null default 0,
  add column grading_error      text,
  add column auto_submit_reason text
    check (auto_submit_reason is null or auto_submit_reason in ('expired', 'proctoring'));

-- Already-graded historical rows must not be re-queued by the worker.
update exam_submissions set grading_status = 'graded' where submitted_at is not null;

-- The expiry sweep's hot query: open attempts already past their deadline.
create index exam_submissions_expiry_idx
  on exam_submissions (deadline_at)
  where submitted_at is null;

-- The grading queue's hot query.
create index exam_submissions_grading_idx
  on exam_submissions (grading_status)
  where submitted_at is not null;
