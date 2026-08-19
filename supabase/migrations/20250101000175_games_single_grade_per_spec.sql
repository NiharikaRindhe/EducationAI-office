-- Restrict every EducationAI-sourced game to its single documented grade.
--
-- Ground truth: Interactive_Games_Features_Grades_1-4.docx, which lists
-- exactly 16 games, one per grade level (Count/Tracing → Grade 1; Crossword/
-- Distance Finder/Hopper/Sentence Strip → Grade 2; Area Builder/Grid Splitter/
-- Missing Side/Missing Word/Sentence Builder → Grade 3; Fraction Compare/
-- Fraction Pie/Number Arrange/Picture Match/Sequencing Tiles → Grade 4). No
-- game is documented as belonging to two grades.
--
-- The catalog had each of these seeded into its native grade AND one adjacent
-- grade as a locked "harder tier" — a reasonable-looking idea that directly
-- contradicts the spec, and the visible symptom was a Class 2 child (aarav)
-- being offered "Alphabet Tracing", a Grade 1 game.
--
-- The fix is narrower than it looks: every survivor already has a level-1
-- predecessor in its correct home grade (the app-native 'quest' game of the
-- same skill_tag), so nothing about the unlock chain needs to change — this
-- migration only removes the cross-grade copies and relocates the two engines
-- (grid-splitter, picture-clue-read) whose *only* existing rows were in the
-- wrong grade entirely.

-- ── 1. Deactivate every cross-grade duplicate ───────────────────────────────
-- Not deleted: a game a child has already attempted keeps its history.

update public.games_catalog set is_active = false
where game_id in (
  'cnt-2', 'cnt-3', 'cnt-4',          -- count-add: Grade 1 only (cnt-1 stays)
  'trace-2',                          -- letter-trace: Grade 1 only (trace-1 stays)
  'cross-3',                          -- crossword: Grade 2 only (cross-2 stays)
  'dist-3',                           -- number-distance: Grade 2 only (dist-2 stays)
  'hop-3', 'hop-4',                   -- number-hop: Grade 2 only (hop-2 stays)
  'wb1-happy',                        -- word-build: Grade 2 only (wb2-school stays)
  'area-4',                           -- area-builder: Grade 3 only (area-3 stays)
  'ctxfill-4',                        -- context-fill: Grade 3 only (ctxfill-3 stays)
  'grammar-4',                        -- sentence-grammar: Grade 3 only (grammar-3 stays)
  'divgrid-4',                        -- division-grid: Grade 3 only (divgrid-3 stays)
  'fraccmp-3',                        -- fraction-compare: Grade 4 only (fraccmp-4 stays)
  'frac-pie-3',                       -- fraction-pie: Grade 4 only (frac-pie-4 stays)
  'slide-3',                          -- number-slide: Grade 4 only (slide-4 stays)
  'story-3',                          -- story-order: Grade 4 only (story-4 stays)
  'picread-2'                         -- picture-clue-read: Grade 4 only (picread-3 relocated below)
);

-- ── 2. New Grade 4 chapter for the relocated Reading Explorer ──────────────
-- "Picture Match" has no documented home before Grade 4, so Grade 4 English
-- needs a chapter for it that didn't exist yet.

insert into public.curriculum_chapters (class_num, subject, chapter_num, chapter_ref, title) values
  (4, 'English', 4, 'c4-eng-picture-reading', 'Reading with Picture Clues')
on conflict (chapter_ref) do nothing;

-- ── 3. Relocate the two engines with no correct-grade row at all ───────────

-- Grid Splitter ("Missing Side"'s sibling, distributive-law area model) was
-- seeded only at Class 4; the spec places it at Class 3, alongside its
-- level-1 predecessor Area Builder (already area-3, area/3/1) — so it lands
-- at area/3/2 with no unlock-chain change needed.
update public.games_catalog
set class_num = 3, chapter_ref = 'c3-math-muldiv'
where game_id = 'split-4';

-- Picture Match ("Reading Explorer") was seeded at Classes 2 and 3; the spec
-- places it at Class 4. No class-4 game currently uses skill_tag
-- 'reading-picture', so it lands at level 1 with no predecessor required.
update public.games_catalog
set class_num = 4, chapter_ref = 'c4-eng-picture-reading'
where game_id = 'picread-3';

-- ── 4. Retire the chapters invented for the games that no longer belong ────
-- These were seeded in 20250101000174 specifically to house the cross-grade
-- copies removed above. Deactivated games still reference them by FK, so the
-- reference is cleared first.

update public.games_catalog set chapter_ref = null
where chapter_ref in (
  'c2-eng-picture-reading', 'c3-eng-word-puzzles',
  'c3-eng-story-order', 'c4-eng-context-clues', 'c4-eng-sentences'
);

delete from public.curriculum_chapters
where chapter_ref in (
  'c2-eng-picture-reading',  -- was picread-2, now retired
  'c3-eng-picture-reading',  -- was picread-3, relocated to c4-eng-picture-reading
  'c3-eng-word-puzzles',     -- was cross-3, now retired
  'c3-eng-story-order',      -- was story-3, now retired
  'c4-eng-context-clues',    -- was ctxfill-4, now retired
  'c4-eng-sentences'         -- was grammar-4, now retired
);

-- ── 5. Known side effect — NOT fixed here ───────────────────────────────────
-- Three chapters that pre-date this migration (i.e. real curriculum, not an
-- artifact of the games catalog) lose their only interactive game as a direct
-- consequence of step 1, because every game that pointed to them was a
-- cross-grade copy of a game whose documented home is a different grade:
--   c2-eng-alphabet  (Class 2 "Alphabet & Letter Tracing" — was trace-2)
--   c3-math-addsub   (Class 3 "Give & Take"               — was cnt-3, hop-3, dist-3)
--   c4-math-addsub   (Class 4 addition/subtraction         — was cnt-4, hop-4)
-- These chapters and their curriculum content are untouched; they simply have
-- no dedicated game right now. Left as-is rather than backfilled with
-- invented content the reference document does not call for.

-- ── 6. Retired rows must vacate their (skill_tag, class_num, level) slot ───
-- The unique index has no is_active filter, so a deactivated row still blocks
-- an active row from reusing that (skill_tag, class_num, level) combination.
-- Bumped out of any realistic range (max active level is 3) rather than to a
-- single magic value, since two retired rows could otherwise collide with
-- each other.

update public.games_catalog set level = level + 1000
where game_id in (
  'cnt-2', 'cnt-3', 'cnt-4', 'trace-2', 'cross-3', 'dist-3', 'hop-3', 'hop-4',
  'wb1-happy', 'area-4', 'ctxfill-4', 'grammar-4', 'fraccmp-3', 'frac-pie-3',
  'slide-3', 'story-3', 'divgrid-4', 'picread-2'
);

-- ── 7. hop-2 lost its unlock predecessor ────────────────────────────────────
-- number-hop's Grade 2 home (hop-2) was locked behind count-add's Grade 2 copy
-- (cnt-2, arithmetic/class2/level1) — which step 1 just retired, since
-- count-add's only documented home is Grade 1. With no level-1 game left in
-- class2/arithmetic, hop-2 would be permanently unlockable-behind-nothing.
-- It becomes the direct, ungated Grade 2 game instead.

update public.games_catalog set level = 1 where game_id = 'hop-2';
