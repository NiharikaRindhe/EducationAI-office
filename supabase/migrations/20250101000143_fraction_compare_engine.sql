-- ═════════════════════════════════════════════════════════════
--  FRACTION COMPARE — side-by-side pie comparison with <, =, >
--  (ported from EducationAI-Games-master's Grade4 "FractionCompare",
--  restyled to this app's Adventure Island theme; pies are
--  pre-shaded rather than build-it-yourself, since building is
--  already FractionPieEngine's job). Seeded as level 3 of the
--  'fractions' skill (fraction-pie is level 2), so it unlocks once
--  fraction-pie is 2-starred.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('fraccmp-3', 'fraction-compare', 'Mathematics', 'fractions', 3, 3, 'c3-math-fractions', 'Fraction Compare', '⚖️',
    '{"problems": [
      {"a": {"num": 2, "den": 5}, "b": {"num": 3, "den": 5}},
      {"a": {"num": 3, "den": 4}, "b": {"num": 3, "den": 8}},
      {"a": {"num": 1, "den": 2}, "b": {"num": 1, "den": 5}},
      {"a": {"num": 4, "den": 8}, "b": {"num": 1, "den": 2}}
    ]}', true),
  ('fraccmp-4', 'fraction-compare', 'Mathematics', 'fractions', 4, 3, 'c4-math-fractions', 'Fraction Compare', '⚖️',
    '{"problems": [
      {"a": {"num": 2, "den": 3}, "b": {"num": 2, "den": 5}},
      {"a": {"num": 5, "den": 6}, "b": {"num": 3, "den": 4}},
      {"a": {"num": 4, "den": 9}, "b": {"num": 2, "den": 5}},
      {"a": {"num": 7, "den": 8}, "b": {"num": 5, "den": 6}}
    ]}', true)
on conflict (game_id) do nothing;
