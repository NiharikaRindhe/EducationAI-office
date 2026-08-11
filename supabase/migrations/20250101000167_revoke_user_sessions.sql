-- Server-side session revocation that actually revokes.
--
-- The API called `supabase.auth.admin.signOut(userId, 'global')`. That method
-- takes a JWT, not a user id, so every call returned
--   "invalid JWT: unable to parse or verify signature"
-- and the helper logged it and moved on. Revocation was a no-op on every path
-- that did not also change the password (GoTrue drops sessions itself on a
-- password change, which is why credential resets appeared to work and
-- deactivation and school suspension quietly did not).
--
-- There is no admin "sign out user by id" in the client library, so this does
-- it at the source: delete the user's rows from auth.sessions.
-- auth.refresh_tokens is ON DELETE CASCADE from sessions, so the refresh
-- tokens go with them and no further access token can be minted.
--
-- Access tokens already issued stay cryptographically valid until they expire
-- (~1h). requireAuth re-reads is_active and the school's status from the
-- database on every request, so a deactivated account is still refused
-- immediately; this closes the refresh loop behind it.

create or replace function public.revoke_user_sessions(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  v_deleted integer;
begin
  delete from auth.sessions where user_id = p_user_id;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Service role only: this is an administrative action, never something an end
-- user invokes. Revoking from PUBLIC also strips service_role's inherited
-- EXECUTE, so it is granted back explicitly.
revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;
