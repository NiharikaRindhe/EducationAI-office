-- ═════════════════════════════════════════════════════════════
--  STUDENT DIRECTORY VIEW
--  The student roster is read as a paginated, filtered, sorted
--  table by three different portals (School Admin, Teacher,
--  Super Admin). Reading it as user_profiles + an embedded
--  student_profiles forces the filtering and sorting to happen
--  in Node after fetching every row — which is what the old
--  listStudents() did, and what stops working at 1.8k students.
--
--  PostgREST can't ORDER a top-level result by an embedded
--  to-one column, so server-side sort across the join needs the
--  join already flattened. This view does that, letting all
--  three portals use plain .eq()/.order()/.range() with an
--  exact count.
--
--  security_invoker = true so the view is NOT a way around RLS:
--  a direct authenticated query still gets the underlying
--  user_profiles/student_profiles policies. The Node API uses
--  the service-role key (which bypasses RLS by design) and
--  re-applies its own school/section scoping explicitly.
-- ═════════════════════════════════════════════════════════════

create or replace view student_directory with (security_invoker = true) as
select
  up.id,
  up.school_id,
  sc.name                as school_name,
  sc.code                as school_code,
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
  -- Single sortable key for "Class" so one .order() gives the natural
  -- 1-A, 1-B, 2-A ordering instead of needing two order clauses.
  (sp.class_num * 1000 + ascii(upper(left(sp.section, 1)))) as class_sort
from user_profiles up
join student_profiles sp on sp.user_id = up.id
join schools sc on sc.id = up.school_id
where up.role = 'student';

grant select on student_directory to authenticated, service_role;

-- Supports the roll-number half of the directory search box. The
-- full_name half is already covered by user_profiles_full_name_idx
-- (GIN trigram), and class/section filtering by
-- student_profiles_class_num_section_idx.
create index if not exists student_profiles_roll_number_idx
  on student_profiles (roll_number);
