-- Surface the exit fields on the directory view.
--
-- Every roster screen reads student_directory, so without these columns the
-- directory cannot tell a leaver from a currently-enrolled student, and the
-- default "who is in my school" list would keep counting people who left.

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
    -- Appended rather than inserted: CREATE OR REPLACE VIEW can only add
    -- columns at the end, and dropping the view would take its dependents
    -- with it.
    sp.exited_at,
    sp.exit_reason,
    -- Boolean rather than making every caller test the timestamp for NULL;
    -- PostgREST filters on a plain column far more cleanly than on `is.null`.
    (sp.exited_at is not null) as has_left
  from user_profiles up
    join student_profiles sp on sp.user_id = up.id
    join schools sc on sc.id = up.school_id
  where up.role = 'student';
