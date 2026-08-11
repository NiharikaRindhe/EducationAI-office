-- Shared, persistent rate-limit counters.
--
-- The limiter was an in-process Map. That has two consequences the audit
-- flagged: every deploy or crash reset every counter (so an attacker being
-- throttled only had to wait for a restart), and running more than one API
-- replica behind nginx multiplied every limit by the replica count.
--
-- Postgres rather than Redis on purpose. These schools run a single
-- docker-compose box on-premise; Redis would be another service to install,
-- monitor and back up at every site, for counters measured in the hundreds per
-- day. The database is already there, already backed up, and already the thing
-- the API cannot run without.

create table if not exists rate_limit_counters (
  key         text primary key,
  count       integer     not null default 0,
  reset_at    timestamptz not null,
  updated_at  timestamptz not null default now()
);

-- Sweeping expired rows is a range scan over this.
create index if not exists rate_limit_counters_reset_at_idx
  on rate_limit_counters (reset_at);

alter table rate_limit_counters enable row level security;
-- No policies: this table is service-role only. End users never read their own
-- limiter state, and exposing it would tell an attacker exactly how many
-- attempts they have left.

revoke all on rate_limit_counters from anon, authenticated;

/**
 * Consume one unit against a fixed window, atomically.
 *
 * Returns the post-increment count so the caller can decide. Doing the whole
 * read-modify-write in one statement matters: the naive "select then update"
 * lets two simultaneous logins both see count = max - 1 and both proceed,
 * which is precisely the burst a login limiter exists to stop.
 *
 * A window that has already elapsed is restarted rather than accumulated, so
 * this is a fixed window, matching the behaviour of the middleware it replaces.
 */
create or replace function consume_rate_limit(
  p_key       text,
  p_window_ms integer,
  p_max       integer
)
returns table (allowed boolean, current_count integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count    integer;
  v_reset_at timestamptz;
begin
  insert into rate_limit_counters as r (key, count, reset_at, updated_at)
  values (p_key, 1, now() + make_interval(secs => p_window_ms / 1000.0), now())
  on conflict (key) do update
    set count = case when r.reset_at <= now() then 1 else r.count + 1 end,
        reset_at = case
                     when r.reset_at <= now()
                       then now() + make_interval(secs => p_window_ms / 1000.0)
                     else r.reset_at
                   end,
        updated_at = now()
  returning r.count, r.reset_at into v_count, v_reset_at;

  return query select (v_count <= p_max), v_count, v_reset_at;
end;
$$;

-- Revoking from PUBLIC also removes service_role's inherited EXECUTE, so the
-- API must be granted it back explicitly. Without this the RPC fails, the
-- middleware silently falls back to per-process limiting, and the shared
-- counter is never written — which looks exactly like it working.
revoke all on function consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function consume_rate_limit(text, integer, integer) to service_role;

/** Drop windows that closed a while ago. Called from the sweeper job. */
create or replace function prune_rate_limit_counters()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  -- One hour of grace: a row is useless once its window closes, but keeping
  -- it briefly makes the table readable when investigating a lockout report.
  delete from rate_limit_counters where reset_at < now() - interval '1 hour';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function prune_rate_limit_counters() from public, anon, authenticated;
grant execute on function prune_rate_limit_counters() to service_role;
