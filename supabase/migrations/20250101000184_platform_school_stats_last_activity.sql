-- Adds last_activity_at to platform_school_stats() so the Super Admin
-- dashboard can flag "dormant" schools (nobody has logged in for a while) —
-- a stronger churn/at-risk signal than the existing 15-minute active_now
-- window, which is only ever non-zero at the exact moment someone is online.
--
-- Postgres refuses to CREATE OR REPLACE a RETURNS TABLE function whose
-- output row type changes — even just appending a column — so the old
-- signature has to be dropped first (confirmed against a real reset: this
-- migration originally used create-or-replace and failed with "cannot
-- change return type of existing function", SQLSTATE 42P13).
drop function if exists public.platform_school_stats();

create function public.platform_school_stats()
returns table (
  school_id        uuid,
  students         bigint,
  teachers         bigint,
  staff            bigint,
  active_now       bigint,
  open_tickets     bigint,
  last_activity_at timestamptz
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
    count(*) filter (
      where up.last_seen_at is not null
        and up.last_seen_at > now() - interval '15 minutes'
    ) as active_now,
    coalesce(t.open_tickets, 0) as open_tickets,
    max(up.last_seen_at) as last_activity_at
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

revoke all on function public.platform_school_stats() from public, anon, authenticated;
grant execute on function public.platform_school_stats() to service_role;
