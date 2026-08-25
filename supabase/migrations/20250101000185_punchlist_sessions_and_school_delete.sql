-- UI testing punch list leftovers (sheet items #1, #32, #34).
--
-- 1. Same-login / shared-lab hygiene: a second sign-in on the same account
--    must kick the first machine. Password-reset already deletes every
--    session; login needs to keep the session that just succeeded.
-- 2. School "deletion" is a soft hide (deleted_at) so audit history and
--    student rows are not destroyed. Deactivate stays reversible; delete is not.

create or replace function public.revoke_other_user_sessions(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  v_keep uuid;
  v_deleted integer;
begin
  select id into v_keep
  from auth.sessions
  where user_id = p_user_id
  order by created_at desc
  limit 1;

  if v_keep is null then
    return 0;
  end if;

  delete from auth.sessions
  where user_id = p_user_id
    and id is distinct from v_keep;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.revoke_other_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_other_user_sessions(uuid) to service_role;

alter table public.schools
  add column if not exists deleted_at timestamptz;
