-- Absolute session expiry support.
--
-- A Supabase session refreshes indefinitely: each refresh mints a token with a
-- fresh `iat`, so the access token's age says nothing about how long the person
-- has actually been signed in. On a shared lab computer that matters — a
-- session started weeks ago on a machine forty children use can still be alive.
--
-- The session's own creation time lives in auth.sessions, which is not exposed
-- through PostgREST. This function is the narrow, read-only window onto it:
-- one timestamp, for one session id, for the API only.

create or replace function public.session_started_at(p_session_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = auth, public
as $$
  select created_at from auth.sessions where id = p_session_id;
$$;

-- Deliberately service_role only. Revoking from PUBLIC also strips the EXECUTE
-- that service_role inherits from it, so it has to be granted back explicitly.
revoke all on function public.session_started_at(uuid) from public, anon, authenticated;
grant execute on function public.session_started_at(uuid) to service_role;
