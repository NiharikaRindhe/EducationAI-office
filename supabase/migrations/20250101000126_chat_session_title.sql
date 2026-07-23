-- ─────────────────────────────────────────────────────────────
--  Students can rename a chat session (e.g. "Chapter 2 doubts" instead
--  of just "Science"). NULL means "no custom title yet" — the API/UI
--  fall back to showing the subject, so every existing session keeps
--  working with no backfill needed.
-- ─────────────────────────────────────────────────────────────
alter table chat_sessions add column title text;
