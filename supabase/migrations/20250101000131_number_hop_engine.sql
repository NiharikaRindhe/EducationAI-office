-- ═════════════════════════════════════════════════════════════
--  NUMBER HOP — visual number-line add/subtract/missing-addend
--  engine (ported from EducationAI-Games-master's "Hopper" game,
--  restyled to this app's Adventure Island theme). Seeded as
--  level 2 of the existing 'arithmetic' skill (count-add is level
--  1), so it unlocks as a harder follow-on once a student has 2+
--  stars on count-add — using the progression rule already built
--  into games.service.ts's computeLocked, not a parallel system.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('hop-2', 'number-hop', 'Mathematics', 'arithmetic', 2, 2, 'c2-math-addsub', 'The Number Hopper', '🐸', '{"startLevel": 0}', true),
  ('hop-3', 'number-hop', 'Mathematics', 'arithmetic', 3, 2, 'c3-math-addsub', 'The Number Hopper', '🐸', '{"startLevel": 1}', true),
  ('hop-4', 'number-hop', 'Mathematics', 'arithmetic', 4, 2, 'c4-math-addsub', 'The Number Hopper', '🐸', '{"startLevel": 2}', true)
on conflict (game_id) do nothing;
