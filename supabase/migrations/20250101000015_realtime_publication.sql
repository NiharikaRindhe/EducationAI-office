-- Tables the frontend subscribes to directly via Supabase Realtime
-- (postgres_changes), not proxied through the Node API. RLS on these
-- tables (already defined) governs what each subscribed client actually
-- receives — adding a table here only makes it eligible to broadcast.
alter publication supabase_realtime add table live_sessions;
alter publication supabase_realtime add table session_participants;
alter publication supabase_realtime add table announcements;
