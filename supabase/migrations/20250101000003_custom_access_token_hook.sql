-- Custom Access Token Hook: GoTrue calls this on every token issue/refresh
-- and merges the returned claims into the JWT. RLS policies read app_role
-- and school_id straight off auth.jwt() instead of joining user_profiles
-- on every row check — this matters once a school has thousands of rows.
--
-- IMPORTANT: the app-level role is stored under the claim name `app_role`,
-- NOT `role`. GoTrue already sets a top-level `role` claim to 'authenticated'
-- (or 'anon'/'service_role'), and PostgREST uses that exact claim to pick
-- which Postgres role to run the query as. Overwriting it with 'student' or
-- 'teacher' would make PostgREST try `SET ROLE student`, which doesn't exist
-- as a Postgres role, and every authenticated request would fail outright.
--
-- Wired up in supabase/config.toml under [auth.hook.custom_access_token].
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims   jsonb;
  profile  record;
begin
  select role, school_id
  into profile
  from public.user_profiles
  where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  -- NOTE: `profile IS NOT NULL` on a composite/record only holds when
  -- EVERY field is non-null (Postgres row-comparison semantics) — school_id
  -- is legitimately NULL for a super_admin, which made that check silently
  -- fail to add claims for exactly the account that matters most. FOUND is
  -- the correct "did the SELECT match a row" test regardless of NULL columns.
  if found then
    claims := claims
      || jsonb_build_object('app_role', profile.role)
      || jsonb_build_object('school_id', profile.school_id);
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- GoTrue's hook-invoking role needs execute rights on this function.
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- Helper functions used throughout RLS policies.
create or replace function public.jwt_role() returns text
language sql stable as $$
  select coalesce(auth.jwt() ->> 'app_role', '');
$$;

create or replace function public.jwt_school_id() returns uuid
language sql stable as $$
  select nullif(auth.jwt() ->> 'school_id', '')::uuid;
$$;
