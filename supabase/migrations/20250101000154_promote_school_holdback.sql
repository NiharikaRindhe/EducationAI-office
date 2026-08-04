-- ═════════════════════════════════════════════════════════════
--  ROLLOVER v2 — hold-backs + enrollment history
--
--  Replaces promote_school(uuid, text, text, uuid). Three additions:
--
--  1. HOLD-BACKS. A student in `p_hold_back` repeats their class rather
--     than advancing. Previously every active student moved up with no
--     way to express "this child is repeating Class 6", which meant the
--     rollover simply could not be run at a school that holds anyone back.
--
--  2. ENROLLMENT HISTORY. Each run closes out the year being left
--     (recording promoted / held_back / graduated per student) and opens
--     a row for the new year. See 20250101000153.
--
--  3. Held-back Class 4 students keep their PIN. Class 4 is the PIN->password
--     boundary, so clearing the PIN of a child who is *staying* in Class 4
--     would lock them out — the same lockout the previous migration fixed
--     for the promoted case.
-- ═════════════════════════════════════════════════════════════

drop function if exists promote_school(uuid, text, text, uuid);

create or replace function promote_school(
  p_school_id uuid,
  p_from_year text,
  p_to_year   text,
  p_run_id    uuid,
  p_hold_back uuid[] default '{}'
)
returns table (promoted_count int, passed_out_count int, held_back_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_passed_out int := 0;
  v_promoted   int := 0;
  v_held_back  int := 0;
  v_hold       uuid[] := coalesce(p_hold_back, '{}');
begin
  -- 0. Make sure the year being closed actually has enrollment rows. A
  --    school that added students after the backfill migration would
  --    otherwise close out a year that has no record of them.
  insert into student_enrollments (student_id, school_id, academic_year, class_num, section, outcome)
  select sp.user_id, p_school_id, p_from_year, sp.class_num, sp.section, 'enrolled'
    from student_profiles sp
    join user_profiles up on up.id = sp.user_id
   where up.school_id = p_school_id
     and up.role = 'student'
     and up.is_active = true
  on conflict (student_id, academic_year) do nothing;

  -- 1. Record how the closing year ended for each student.
  --
  --    Hold-back is tested BEFORE the Class 10 check, and the order matters:
  --    a held-back Class 10 student is repeating the year, not graduating.
  --    With the checks the other way round they were labelled 'graduated'
  --    while step 2 (correctly) left them active — a record that contradicted
  --    itself, and a held_back_count that under-reported them.
  update student_enrollments se
     set outcome = case
                     when se.student_id = any(v_hold) then 'held_back'
                     when se.class_num = 10           then 'graduated'
                     else 'promoted'
                   end
   where se.school_id = p_school_id
     and se.academic_year = p_from_year;

  select count(*) into v_held_back
    from student_enrollments
   where school_id = p_school_id and academic_year = p_from_year and outcome = 'held_back';

  -- 2. Class 10 leaves the platform. Held-back Class 10 students stay:
  --    they are repeating the year, not graduating.
  with deactivated as (
    update user_profiles up
       set is_active = false
      from student_profiles sp
     where sp.user_id = up.id
       and up.school_id = p_school_id
       and up.role = 'student'
       and up.is_active = true
       and sp.class_num = 10
       and not (sp.user_id = any(v_hold))
    returning up.id
  )
  select count(*) into v_passed_out from deactivated;

  -- 3. Continuing classes move up exactly one, in a SINGLE statement built
  --    from a snapshot of the starting classes.
  --
  --    This has to stay one statement. Splitting it — "Class 4 -> 5" then
  --    "increment 1-9" — re-promotes the Class 4 cohort to 6, because the
  --    second statement sees the first one's effect and they are now Class 5,
  --    still inside 1-9. The snapshot CTE fixes each student's starting class
  --    up front so nobody is promoted twice.
  --
  --    The Class 4 -> 5 PIN clear rides along in the same UPDATE, so the
  --    "PIN cleared but still Class 4" lockout window never exists.
  with cohort as (
    select sp.user_id, sp.class_num as old_class
      from student_profiles sp
      join user_profiles up on up.id = sp.user_id
     where up.school_id = p_school_id
       and up.role = 'student'
       and up.is_active = true
       and sp.class_num between 1 and 9
       and not (sp.user_id = any(v_hold))
  ),
  promoted as (
    update student_profiles sp
       set class_num = c.old_class + 1,
           pin_hash  = case when c.old_class = 4 then null else sp.pin_hash end
      from cohort c
     where sp.user_id = c.user_id
    returning sp.user_id
  )
  select count(*) into v_promoted from promoted;

  -- 4. Open the new year for everyone still active — including held-back
  --    students, who get a fresh row at their unchanged class.
  insert into student_enrollments (student_id, school_id, academic_year, class_num, section, outcome)
  select sp.user_id, p_school_id, p_to_year, sp.class_num, sp.section, 'enrolled'
    from student_profiles sp
    join user_profiles up on up.id = sp.user_id
   where up.school_id = p_school_id
     and up.role = 'student'
     and up.is_active = true
  on conflict (student_id, academic_year) do nothing;

  -- 5. Carry the section structure into the new academic year.
  insert into class_sections (school_id, academic_year, class_num, section_label, is_active)
  select p_school_id, p_to_year, cs.class_num, cs.section_label, true
    from class_sections cs
   where cs.school_id = p_school_id
     and cs.academic_year = p_from_year
  on conflict (school_id, academic_year, class_num, section_label) do nothing;

  -- 6. Close out the run in the same transaction as the work it describes.
  update promotion_runs
     set status           = 'completed',
         promoted_count   = v_promoted,
         passed_out_count = v_passed_out,
         completed_at     = now()
   where id = p_run_id;

  return query select v_promoted, v_passed_out, v_held_back;
end;
$$;

revoke all on function promote_school(uuid, text, text, uuid, uuid[]) from public, anon, authenticated;
