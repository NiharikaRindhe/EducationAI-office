-- ═════════════════════════════════════════════════════════════
--  FRACTION PIE — multi-pie fraction builder (ported from
--  EducationAI-Games-master's Grade4 "FractionPie", restyled to
--  this app's Adventure Island theme). Seeded as level 2 of the
--  existing 'fractions' skill (quest's fractions generator is level
--  1), unlocking as a harder follow-on via the existing
--  computeLocked progression rule.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('frac-pie-3', 'fraction-pie', 'Mathematics', 'fractions', 3, 2, 'c3-math-fractions', 'Fraction Pie Builder', '🥧',
    '{"challenges":[{"num":1,"den":2},{"num":1,"den":4},{"num":3,"den":4},{"num":1,"den":3},{"num":2,"den":3}]}', true),
  ('frac-pie-4', 'fraction-pie', 'Mathematics', 'fractions', 4, 2, 'c4-math-fractions', 'Fraction Pie Builder', '🥧',
    '{"challenges":[{"num":2,"den":5},{"num":3,"den":4},{"num":5,"den":4},{"num":7,"den":4},{"num":4,"den":3}]}', true)
on conflict (game_id) do nothing;
