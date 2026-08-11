-- ═════════════════════════════════════════════════════════════
--  P0 EXAM INTEGRITY — transactional, idempotent publication
--
--  publishExam() performed three independent writes:
--      1. upsert proctoring_settings
--      2. insert exam_assignments
--      3. update exams.status = 'published'
--
--  A failure between 2 and 3 left a DRAFT exam that students were
--  already assigned to. A failure between 1 and 2 left settings
--  for an unpublished paper. And because exam_assignments had no
--  unique key on (exam_id, student_id), a retry after a partial
--  failure inserted the whole assignment set a SECOND time —
--  every student silently assigned twice.
--
--  This moves all three into one function so they commit or roll
--  back together, and makes a retry converge on the same result
--  instead of compounding.
-- ═════════════════════════════════════════════════════════════

-- ─── Deduplicate before constraining ─────────────────────────
delete from exam_assignments a
using exam_assignments b
where a.exam_id = b.exam_id
  and a.student_id = b.student_id
  and a.ctid > b.ctid;

alter table exam_assignments
  add constraint exam_assignments_exam_student_key unique (exam_id, student_id);

-- ─── Atomic publish ──────────────────────────────────────────
-- Assignment rows are computed in the API (teaching-scope checks live there,
-- with the rest of the authorization logic) and passed in as JSON. This
-- function owns only atomicity, never who may be assigned.
create or replace function publish_exam(
  p_exam_id              uuid,
  p_teacher_id           uuid,
  p_assignments          jsonb,
  p_randomize_questions  boolean,
  p_shuffle_options      boolean,
  p_auto_submit_on_switch boolean,
  p_switch_limit         int
)
returns exams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam exams;
begin
  -- Re-assert ownership and draft status inside the transaction: the checks
  -- the API did earlier could have been invalidated by a concurrent request.
  select * into v_exam from exams
   where id = p_exam_id and created_by = p_teacher_id
   for update;

  if not found then
    raise exception 'Exam not found or not yours' using errcode = 'P0002';
  end if;

  -- Idempotent: re-publishing an already-published exam re-syncs its
  -- assignments and settings rather than erroring or duplicating.
  if v_exam.status not in ('draft', 'published') then
    raise exception 'Exam is % and can no longer be published', v_exam.status
      using errcode = 'P0001';
  end if;

  insert into proctoring_settings (
    exam_id, randomize_questions, shuffle_options, auto_submit_on_switch, switch_limit
  )
  values (
    p_exam_id, p_randomize_questions, p_shuffle_options, p_auto_submit_on_switch, p_switch_limit
  )
  on conflict (exam_id) do update set
    randomize_questions   = excluded.randomize_questions,
    shuffle_options       = excluded.shuffle_options,
    auto_submit_on_switch = excluded.auto_submit_on_switch,
    switch_limit          = excluded.switch_limit;

  insert into exam_assignments (exam_id, student_id, class_section_id, starts_at, ends_at)
  select
    p_exam_id,
    (a->>'student_id')::uuid,
    nullif(a->>'class_section_id', '')::uuid,
    nullif(a->>'starts_at', '')::timestamptz,
    nullif(a->>'ends_at', '')::timestamptz
  from jsonb_array_elements(p_assignments) as a
  on conflict (exam_id, student_id) do update set
    class_section_id = excluded.class_section_id,
    starts_at        = excluded.starts_at,
    ends_at          = excluded.ends_at;

  update exams set status = 'published' where id = p_exam_id
  returning * into v_exam;

  return v_exam;
end;
$$;

-- The API calls this with the service role.
grant execute on function publish_exam(uuid, uuid, jsonb, boolean, boolean, boolean, int) to service_role;
