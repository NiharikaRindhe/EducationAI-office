-- Surface whether a student's most recent enrollment outcome is 'graduated'.
--
-- Academic Year Rollover marks a Class 10 pass-out with
-- student_enrollments.outcome = 'graduated' and deactivates their account
-- (20250101000155), but sets neither exited_at nor any other flag the
-- directory view already exposes — so a graduated student and an arbitrarily
-- deactivated one were indistinguishable on every roster screen (sheet item
-- #53). This adds a `graduated` column so School Admin's enrolment filter can
-- offer it as its own option instead of only "current / left the school / all".

create or replace view public.student_directory as
  select
    up.id,
    up.school_id,
    sc.name as school_name,
    sc.code as school_code,
    up.full_name,
    up.is_active,
    up.has_logged_in_ever,
    up.last_seen_at,
    sp.class_num,
    sp.section,
    sp.batch_id,
    sp.roll_number,
    sp.avatar,
    sp.xp,
    sp.level,
    sp.streak,
    sp.longest_streak,
    sp.class_num * 1000 + ascii(upper("left"(sp.section, 1))) as class_sort,
    up.exited_at,
    up.exit_reason,
    (up.exited_at is not null) as has_left,
    -- Appended, same reasoning as has_left above: any outcome row at all is
    -- enough — a student only ever accumulates one 'graduated' row, on the
    -- rollover that moved them out of Class 10, never more than once.
    exists (
      select 1 from student_enrollments se
      where se.student_id = up.id and se.outcome = 'graduated'
    ) as graduated
  from user_profiles up
    join student_profiles sp on sp.user_id = up.id
    join schools sc on sc.id = up.school_id
  where up.role = 'student';
