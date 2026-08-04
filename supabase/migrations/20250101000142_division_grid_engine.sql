-- ═════════════════════════════════════════════════════════════
--  DIVISION GRID — "Division Detective", division as grid-row-
--  building (ported from EducationAI-Games-master's Grade3
--  "MissingSide", restyled to this app's Adventure Island theme).
--  Both classes already have a level-1 'division' game via
--  QuestEngine's 'equal-share' generator (q3-share, div-4), so this
--  ships as level 2 of that *existing* skill on both classes —
--  Class 3 gets exact division (no remainders), Class 4 gets
--  remainders — unlocking once the level-1 game is 2-starred.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('divgrid-3', 'division-grid', 'Mathematics', 'division', 3, 2, 'c3-math-muldiv', 'Division Detective', '🔍',
    '{"divisorMin": 2, "divisorMax": 6, "quotientMin": 2, "quotientMax": 9, "hasRemainder": false}', true),
  ('divgrid-4', 'division-grid', 'Mathematics', 'division', 4, 2, 'c4-math-muldiv', 'Division Detective', '🔍',
    '{"divisorMin": 3, "divisorMax": 9, "quotientMin": 3, "quotientMax": 12, "hasRemainder": true}', true)
on conflict (game_id) do nothing;
