-- ═════════════════════════════════════════════════════════════
--  AREA BUILDER — drag-to-shade area-as-multiplication (ported
--  from EducationAI-Games-master's Grade3 "AreaBuilder", restyled
--  to this app's Adventure Island theme). Seeded as level 1 of a
--  new 'area' skill — Class 3 gets single-region grids, Class 4
--  gets the harder decomposed multi-region version (grid-splitter
--  is level 2 of this same skill for Class 4 only).
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('area-3', 'area-builder', 'Mathematics', 'area', 3, 1, 'c3-math-muldiv', 'Area Builder', '🟦',
    '{"rowMin": 2, "rowMax": 9, "colMin": 2, "colMax": 9, "decompose": false}', true),
  ('area-4', 'area-builder', 'Mathematics', 'area', 4, 1, 'c4-math-muldiv', 'Area Builder', '🟦',
    '{"rowMin": 2, "rowMax": 15, "colMin": 2, "colMax": 15, "decompose": true}', true)
on conflict (game_id) do nothing;
