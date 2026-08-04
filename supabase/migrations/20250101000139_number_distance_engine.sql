-- ═════════════════════════════════════════════════════════════
--  NUMBER DISTANCE — number-line distance finder (ported from
--  EducationAI-Games-master's Grade2 "Distance", restyled to this
--  app's Adventure Island theme). Seeded as level 1 of a new
--  'measure-distance' skill — Class 2 gets a within-20 range,
--  Class 3 gets within-100.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('dist-2', 'number-distance', 'Mathematics', 'measure-distance', 2, 1, 'c2-math-addsub', 'Distance Finder', '🐸', '{"min": 1, "max": 20}', true),
  ('dist-3', 'number-distance', 'Mathematics', 'measure-distance', 3, 1, 'c3-math-addsub', 'Distance Finder', '🐸', '{"min": 1, "max": 99}', true)
on conflict (game_id) do nothing;
