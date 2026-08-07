-- ═════════════════════════════════════════════════════════════
--  ONE ACTIVE LIVE SESSION PER CLASS+SECTION
--
--  Found live in this school's data: a live_sessions row for Class 3-A
--  (a different teacher, started 2026-07-10) still is_active with no
--  ended_at — five days after every other participant had moved on. Nothing
--  in the schema ever forced it closed.
--
--  Two consequences, both reproduced directly against this school:
--
--  1. The class's PIN-login gate (requireActiveSessionFor in
--     auth.service.ts) stayed unlocked indefinitely with no one aware of
--     it — any Batch 1 student could still log in to a "live" 3-A lab
--     period that ended weeks ago.
--
--  2. The moment a SECOND session (a different teacher, or the same
--     teacher after a stale row like this) went active for that same
--     class+section, every .maybeSingle()/.single() read scoped to
--     (school, class, section) started throwing on the >1-row result.
--     Several of those call sites only destructure `{ data }` and drop the
--     error, so the throw surfaced as "no session found" — a genuinely
--     live class read as not live, to both the teacher's own dashboard and
--     the student's PIN-login roster.
--
--  api/src/services/liveSession.service.ts now clears both the
--  class+section's previous session AND the starting teacher's own other
--  sessions before inserting a new one, which is what makes a normal
--  startSession() call never hit this index. It exists to make the
--  invariant durable against whatever this app-layer cleanup doesn't
--  anticipate — a race between two concurrent start requests, a direct DB
--  write, a future code path that inserts without going through
--  startSession() at all.
-- ═════════════════════════════════════════════════════════════

-- Clean up the two sessions already found stale before the index can be
-- added — a partial unique index cannot be created over rows that already
-- violate it. This closes the leaked PIN-login gate for 3-A immediately.
update live_sessions
   set is_active = false,
       ended_at = now()
 where is_active = true
   and id not in (
     select id from (
       select id,
              row_number() over (
                partition by school_id, class_num, section
                order by started_at desc
              ) as rn
         from live_sessions
        where is_active = true
     ) ranked
     where rn = 1
   );

create unique index live_sessions_one_active_per_section
  on live_sessions (school_id, class_num, section)
  where is_active;
