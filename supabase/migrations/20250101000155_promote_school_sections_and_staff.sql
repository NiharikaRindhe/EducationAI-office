-- ═════════════════════════════════════════════════════════════
--  ROLLOVER v3 — sections, staff, timetable, announcements
--
--  A probe of v2 on a throwaway school found three silent breakages and
--  one cross-cohort leak. All four are fixed here.
--
--  1. TEACHERS LOST EVERY CLASS. `teaching_assignments.class_section_id`
--     points at a `class_sections` row, and those rows are per-year. v2
--     created fresh rows for the new year but left assignments pointing at
--     the old ones, while getTeachingScope() filters on
--     class_sections.academic_year = current year. Measured: 0 assignments
--     visible in the new year where there should have been 2. Because the
--     exam builder, question bank and AI generator all scope by teaching
--     assignment, every teacher woke up on April 1st unable to do anything.
--
--  2. CLASS TEACHERS DROPPED. The v2 section copy did not carry
--     class_teacher_id, so every class-teacher link was silently lost.
--
--  3. STUDENTS ORPHANED INTO NON-EXISTENT SECTIONS. student_profiles.section
--     is free text with no FK to class_sections, so v2 carried the label
--     forward blindly. A school with Class 2 = A,B,C and Class 3 = A,B put
--     its three 2-C children into "Class 3-C", a section the school does
--     not have. They appear in no section roster and no timetable.
--
--  4. ANNOUNCEMENTS LEAKED TO THE WRONG CHILDREN. `announcements` is keyed
--     by class_num + section with no academic year, so last year's
--     "Class 2-A" notice was served to the NEW Class 2-A — a different set
--     of students.
--
--  The section decision cannot be made automatically: schools differ on
--  whether sections carry, get reshuffled, or shrink in higher classes. So
--  p_section_map carries the admin's explicit choice for the mismatched
--  cases, and step 5 is a backstop that makes orphaning structurally
--  impossible even if the API is bypassed.
-- ═════════════════════════════════════════════════════════════

-- Audit completeness: v2 returned held_back_count but never stored it.
alter table promotion_runs add column if not exists held_back_count int not null default 0;

drop function if exists promote_school(uuid, text, text, uuid, uuid[]);

create or replace function promote_school(
  p_school_id  uuid,
  p_from_year  text,
  p_to_year    text,
  p_run_id     uuid,
  p_hold_back  uuid[] default '{}',
  -- [{"fromClass":2,"fromSection":"C","toSection":"A"}, ...]
  -- Where a promoting section has no counterpart in the class above, this
  -- says where those students land. Absent entries keep their label.
  p_section_map jsonb default '[]'::jsonb
)
returns table (
  promoted_count       int,
  passed_out_count     int,
  held_back_count      int,
  sections_created     int,
  assignments_carried  int,
  timetable_carried    int,
  announcements_closed int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_passed_out    int := 0;
  v_promoted      int := 0;
  v_held_back     int := 0;
  v_sections_new  int := 0;
  v_assignments   int := 0;
  v_timetable     int := 0;
  v_announce      int := 0;
  v_hold          uuid[] := coalesce(p_hold_back, '{}');
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
  --    while step 3 (correctly) left them active — a record that contradicted
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
  --    they are repeating the year, not graduating. Their records are kept
  --    in full — only the login is closed (is_active is enforced at auth).
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

  -- 3. Continuing classes move up exactly one AND land in their mapped
  --    section, in a SINGLE statement built from a snapshot.
  --
  --    This has to stay one statement. Splitting it — "Class 4 -> 5" then
  --    "increment 1-9" — re-promotes the Class 4 cohort to 6, because the
  --    second statement sees the first one's effect and they are now Class 5,
  --    still inside 1-9. The snapshot CTE fixes each student's starting class
  --    up front so nobody is promoted twice.
  --
  --    The Class 4 -> 5 PIN clear rides along in the same UPDATE, so the
  --    "PIN cleared but still Class 4" lockout window never exists.
  with map as (
    select (e->>'fromClass')::int              as from_class,
           upper(trim(e->>'fromSection'))      as from_section,
           upper(trim(e->>'toSection'))        as to_section
      from jsonb_array_elements(coalesce(p_section_map, '[]'::jsonb)) e
     where coalesce(trim(e->>'toSection'), '') <> ''
  ),
  cohort as (
    select sp.user_id,
           sp.class_num as old_class,
           sp.section   as old_section
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
           section   = coalesce(m.to_section, sp.section),
           pin_hash  = case when c.old_class = 4 then null else sp.pin_hash end
      from cohort c
      left join map m
        on m.from_class = c.old_class
       and m.from_section = upper(trim(c.old_section))
     where sp.user_id = c.user_id
    returning sp.user_id
  )
  select count(*) into v_promoted from promoted;

  -- 4. Carry the section structure into the new year, INCLUDING the class
  --    teacher and the active flag. v2 dropped both.
  --
  --    The semantics are "the section slot persists, a new cohort moves into
  --    it": the class teacher of 3-A stays the class teacher of 3-A.
  insert into class_sections (school_id, academic_year, class_num, section_label, class_teacher_id, is_active)
  select p_school_id, p_to_year, cs.class_num, cs.section_label, cs.class_teacher_id, cs.is_active
    from class_sections cs
   where cs.school_id = p_school_id
     and cs.academic_year = p_from_year
  on conflict (school_id, academic_year, class_num, section_label) do nothing;

  -- 5. Backstop: every (class, section) an active student now occupies must
  --    exist as a section row. This is what makes orphaning impossible — it
  --    holds even if p_section_map is empty, wrong, or the API is bypassed
  --    entirely. Without it, a 2-C student in a school with no 3-C vanishes
  --    from every roster.
  with created as (
    insert into class_sections (school_id, academic_year, class_num, section_label)
    select distinct p_school_id, p_to_year, sp.class_num, upper(trim(sp.section))
      from student_profiles sp
      join user_profiles up on up.id = sp.user_id
     where up.school_id = p_school_id
       and up.role = 'student'
       and up.is_active = true
       and coalesce(trim(sp.section), '') <> ''
    on conflict (school_id, academic_year, class_num, section_label) do nothing
    returning id
  )
  select count(*) into v_sections_new from created;

  -- 6. Open the new year for everyone still active — including held-back
  --    students, who get a fresh row at their unchanged class. Runs after
  --    step 3 so it records the post-remap section.
  insert into student_enrollments (student_id, school_id, academic_year, class_num, section, outcome)
  select sp.user_id, p_school_id, p_to_year, sp.class_num, sp.section, 'enrolled'
    from student_profiles sp
    join user_profiles up on up.id = sp.user_id
   where up.school_id = p_school_id
     and up.role = 'student'
     and up.is_active = true
  on conflict (student_id, academic_year) do nothing;

  -- 7. Re-point teaching assignments at the new year's section rows, matched
  --    by class + section label. Fixes the "every teacher loses every class"
  --    breakage. Sections that no longer exist simply carry nothing.
  with carried as (
    insert into teaching_assignments (school_id, teacher_id, class_section_id, subject)
    select ta.school_id, ta.teacher_id, new_cs.id, ta.subject
      from teaching_assignments ta
      join class_sections old_cs on old_cs.id = ta.class_section_id
      join class_sections new_cs
        on new_cs.school_id     = old_cs.school_id
       and new_cs.academic_year = p_to_year
       and new_cs.class_num     = old_cs.class_num
       and new_cs.section_label = old_cs.section_label
     where ta.school_id = p_school_id
       and old_cs.academic_year = p_from_year
    on conflict (teacher_id, class_section_id, subject) do nothing
    returning id
  )
  select count(*) into v_assignments from carried;

  -- 8. Copy the timetable into the new year as an editable starting point.
  --    Rebuilding a whole school's grid from blank every April is hours of
  --    work; the slots are matched to the new year's section rows the same
  --    way assignments are.
  with carried as (
    insert into timetable_slots (school_id, academic_year, class_section_id, day_of_week,
                                 period_no, starts_at, ends_at, subject, teacher_id, lab_id)
    select ts.school_id, p_to_year, new_cs.id, ts.day_of_week,
           ts.period_no, ts.starts_at, ts.ends_at, ts.subject, ts.teacher_id, ts.lab_id
      from timetable_slots ts
      join class_sections old_cs on old_cs.id = ts.class_section_id
      join class_sections new_cs
        on new_cs.school_id     = old_cs.school_id
       and new_cs.academic_year = p_to_year
       and new_cs.class_num     = old_cs.class_num
       and new_cs.section_label = old_cs.section_label
     where ts.school_id = p_school_id
       and ts.academic_year = p_from_year
    on conflict do nothing
    returning id
  )
  select count(*) into v_timetable from carried;

  -- 9. Close every standing announcement.
  --
  --    announcements carries class_num + section but no academic year, so
  --    once the cohorts shift, "Class 2-A, bring your art supplies Monday"
  --    is served to a completely different set of children — last year's
  --    Class 1-A. Every notice written before the rollover was addressed to
  --    the outgoing cohort, so they all close.
  with closed as (
    update announcements
       set is_active = false
     where school_id = p_school_id
       and is_active = true
    returning id
  )
  select count(*) into v_announce from closed;

  -- 10. Close out the run in the same transaction as the work it describes.
  update promotion_runs
     set status           = 'completed',
         promoted_count   = v_promoted,
         passed_out_count = v_passed_out,
         held_back_count  = v_held_back,
         completed_at     = now()
   where id = p_run_id;

  return query select v_promoted, v_passed_out, v_held_back,
                      v_sections_new, v_assignments, v_timetable, v_announce;
end;
$$;

revoke all on function promote_school(uuid, text, text, uuid, uuid[], jsonb) from public, anon, authenticated;

-- The API calls this with the service-role key, so service_role needs EXECUTE
-- explicitly. 20250101000014_grants.sql granted "all functions in schema
-- public" as a one-time statement, which does not reach functions created by
-- later migrations, and the blanket REVOKE above strips the PUBLIC default
-- this would otherwise have inherited. Without this grant the rollover fails
-- with "permission denied for function promote_school" the moment it is run
-- from the app — a break that stayed invisible while the function was only
-- ever exercised from psql as the postgres superuser.
grant execute on function promote_school(uuid, text, text, uuid, uuid[], jsonb) to service_role;
