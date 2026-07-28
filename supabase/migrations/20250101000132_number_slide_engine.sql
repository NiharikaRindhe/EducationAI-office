-- ═════════════════════════════════════════════════════════════
--  NUMBER SLIDE — sliding number-ordering puzzle (ported from
--  EducationAI-Games-master's Grade4 "NumberArrange", restyled to
--  this app's Adventure Island theme). Seeded as level 2 of the
--  existing 'counting' skill (the quest generator is level 1), so
--  it unlocks as a harder follow-on via games.service.ts's existing
--  computeLocked progression rule.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('slide-3', 'number-slide', 'Mathematics', 'counting', 3, 2, 'c3-math-counting', 'Number Slide', '🧩', '{"startSize": 3}', true),
  ('slide-4', 'number-slide', 'Mathematics', 'counting', 4, 2, 'c4-math-counting', 'Number Slide', '🧩', '{"startSize": 4}', true)
on conflict (game_id) do nothing;
