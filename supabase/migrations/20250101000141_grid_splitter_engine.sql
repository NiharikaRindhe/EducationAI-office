-- ═════════════════════════════════════════════════════════════
--  GRID SPLITTER — distributive-property split-the-grid (ported
--  from EducationAI-Games-master's Grade3 "GridSplitter", restyled
--  to this app's Adventure Island theme). Seeded as level 2 of the
--  'area' skill (area-builder is level 1), Class 4 only, so it
--  unlocks once area-builder-4 is 2-starred.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('split-4', 'grid-splitter', 'Mathematics', 'area', 4, 2, 'c4-math-muldiv', 'Grid Splitter', '✂️',
    '{"minA": 11, "maxA": 19, "minB": 2, "maxB": 9}', true)
on conflict (game_id) do nothing;
