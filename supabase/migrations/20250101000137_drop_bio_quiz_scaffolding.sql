-- ═════════════════════════════════════════════════════════════
--  Remove the 'bio-quiz' games_catalog scaffolding.
--
--  Those rows were seeded for an adapted Biology quiz that has since
--  been replaced by the real EducationAI-Games-master Biology module,
--  which is mounted verbatim and tracks its own topic mastery in
--  localStorage rather than through games_catalog/game_attempts.
--  Nothing renders these rows any more, so they are dead data that
--  would otherwise surface in GET /student/games.
--
--  The Class 9/10 Science curriculum_chapters rows go too: they were
--  added only to satisfy the games_catalog.chapter_ref FK above, and
--  leaving them would inflate the denominator in subject_progress
--  (total_chapters) for a subject with no chapter-linked games.
-- ═════════════════════════════════════════════════════════════

delete from game_attempts where game_id in (select game_id from games_catalog where engine = 'bio-quiz');
delete from games_catalog where engine = 'bio-quiz';

delete from curriculum_chapters
 where chapter_ref in ('c9-sci-cell', 'c9-sci-tissues', 'c10-sci-life-processes', 'c10-sci-control-coordination');
