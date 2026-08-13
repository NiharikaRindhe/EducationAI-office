-- Per-school counts for the Super Admin overview, aggregated in the database.
--
-- getOverview() was reading EVERY row of user_profiles and support_tickets into
-- Node and counting them in a loop. At four demo schools that is invisible; at
-- a hundred schools of five hundred students it is fifty thousand rows shipped
-- over the wire on every dashboard load, and the "active now" figure is derived
-- from a snapshot that is already stale by the time it arrives.
--
-- Counting where the data lives is both correct and constant-cost.

create or replace function public.platform_school_stats()
returns table (
  school_id    uuid,
  students     bigint,
  teachers     bigint,
  staff        bigint,
  active_now   bigint,
  open_tickets bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id as school_id,
    count(*) filter (where up.role = 'student')                         as students,
    count(*) filter (where up.role = 'teacher')                         as teachers,
    count(*) filter (where up.role in ('school_admin', 'lab_incharge')) as staff,
    -- "Active now" matches the 15-minute window the dashboard has always used.
    count(*) filter (
      where up.last_seen_at is not null
        and up.last_seen_at > now() - interval '15 minutes'
    ) as active_now,
    coalesce(t.open_tickets, 0) as open_tickets
  from schools s
  left join user_profiles up on up.school_id = s.id
  left join lateral (
    select count(*) as open_tickets
    from support_tickets st
    where st.school_id = s.id
      and st.status in ('open', 'in_progress')
  ) t on true
  group by s.id, t.open_tickets;
$$;

-- Platform-wide figures only the Super Admin sees, so this is service-role
-- only. Revoking from PUBLIC also strips service_role's inherited EXECUTE.
revoke all on function public.platform_school_stats() from public, anon, authenticated;
grant execute on function public.platform_school_stats() to service_role;
