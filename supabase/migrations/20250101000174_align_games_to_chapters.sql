-- Align every Batch 1 game to a chapter, and stop games repeating by name.
--
-- Two problems, both visible to a child on the Games screen:
--
--  1. Repetition. Class 1 English offered five separate tiles all called
--     "Word Match", and Class 2 offered three. Each is a genuinely different
--     game — they carry the vocabulary of five different Marigold chapters —
--     but a seven-year-old choosing between five identical labels cannot tell
--     that, and picks the same one twice. Naming each after its own chapter
--     makes the difference visible without changing any gameplay.
--
--  2. Ungrouped games. The Games screen groups by chapter, so a game with
--     chapter_ref = NULL falls outside the curriculum view entirely. Ten games
--     were in that state: Class 3 and Class 4 English had no curriculum_chapters
--     rows at all, so their eight language games had nothing to attach to, and
--     two Class 2 skill games were left over.
--
-- The English chapters added here are skill strands, not invented NCERT story
-- titles. That is the same pattern Class 1 and 2 already use, where
-- "Phonics & Letter Sounds" and "Alphabet & Letter Tracing" sit alongside the
-- real Marigold stories — a skill game belongs to the skill it teaches, and
-- claiming a specific NCERT story it was never written against would be worse
-- than honest grouping.

-- ── 1. Chapter strands for the language skill games ─────────────────────────
-- chapter_num continues after each class's existing English chapters so the
-- ordering on screen stays stable.

insert into public.curriculum_chapters (class_num, subject, chapter_num, chapter_ref, title) values
  -- Class 2 already has 5 story/skill chapters (nums 1-5).
  (2, 'English',  6, 'c2-eng-picture-reading', 'Reading with Picture Clues'),
  (2, 'English',  7, 'c2-eng-word-puzzles',    'Word Puzzles'),

  -- Class 3 English had no chapters at all.
  (3, 'English',  1, 'c3-eng-picture-reading', 'Reading with Picture Clues'),
  (3, 'English',  2, 'c3-eng-word-puzzles',    'Word Puzzles'),
  (3, 'English',  3, 'c3-eng-context-clues',   'Context Clues & Vocabulary'),
  (3, 'English',  4, 'c3-eng-sentences',       'Sentence Building & Grammar'),
  (3, 'English',  5, 'c3-eng-story-order',     'Story Sequencing'),

  -- Class 4 English likewise.
  (4, 'English',  1, 'c4-eng-context-clues',   'Context Clues & Vocabulary'),
  (4, 'English',  2, 'c4-eng-sentences',       'Sentence Building & Grammar'),
  (4, 'English',  3, 'c4-eng-story-order',     'Story Sequencing')
on conflict (chapter_ref) do nothing;

-- ── 2. Attach the ten orphaned games ────────────────────────────────────────

update public.games_catalog set chapter_ref = 'c2-eng-word-puzzles'    where game_id = 'cross-2';
update public.games_catalog set chapter_ref = 'c2-eng-picture-reading' where game_id = 'picread-2';

update public.games_catalog set chapter_ref = 'c3-eng-word-puzzles'    where game_id = 'cross-3';
update public.games_catalog set chapter_ref = 'c3-eng-context-clues'   where game_id = 'ctxfill-3';
update public.games_catalog set chapter_ref = 'c3-eng-sentences'       where game_id = 'grammar-3';
update public.games_catalog set chapter_ref = 'c3-eng-picture-reading' where game_id = 'picread-3';
update public.games_catalog set chapter_ref = 'c3-eng-story-order'     where game_id = 'story-3';

update public.games_catalog set chapter_ref = 'c4-eng-context-clues'   where game_id = 'ctxfill-4';
update public.games_catalog set chapter_ref = 'c4-eng-sentences'       where game_id = 'grammar-4';
update public.games_catalog set chapter_ref = 'c4-eng-story-order'     where game_id = 'story-4';

-- ── 3. Give the repeated "Word Match" tiles their chapter's name ────────────
-- Gameplay and vocabulary are untouched; only the label a child reads changes.

update public.games_catalog set name = 'Lalu and Peelu'    where game_id = 'w1-lalu';
update public.games_catalog set name = 'Clouds'            where game_id = 'w1-clouds';
update public.games_catalog set name = 'A Kite'            where game_id = 'w1-kite';
update public.games_catalog set name = 'One Little Kitten' where game_id = 'w1-kitten';
update public.games_catalog set name = 'A Happy Child'     where game_id = 'w1-happy';

update public.games_catalog set name = 'Zoo Manners'       where game_id = 'w2-zoo';
update public.games_catalog set name = 'The Music Man'     where game_id = 'w2-music';
update public.games_catalog set name = 'First Day At School' where game_id = 'w2-school';
