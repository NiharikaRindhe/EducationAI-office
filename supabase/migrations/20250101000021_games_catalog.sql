-- ═════════════════════════════════════════════════════════════
--  CURRICULUM CHAPTERS + GAMES CATALOG + GAME ATTEMPTS
--  Foundation for the Batch 1 (Classes 1-4) game/curriculum rework
--  (see BATCH1_UI_CONTENT_PLAN.md). curriculum_chapters is reference
--  data (NCERT chapter list per class+subject); games_catalog is one
--  engine instance parameterized per class via `params`; game_attempts
--  is the per-student scoreboard that chapter_ref ties back into
--  subject_progress, so completing games makes the Progress page real.
-- ═════════════════════════════════════════════════════════════

create table curriculum_chapters (
  id            uuid primary key default gen_random_uuid(),
  class_num     int  not null check (class_num between 1 and 10),
  subject       text not null,
  chapter_num   int  not null,
  chapter_ref   text not null unique,   -- stable slug, e.g. 'c1-math-addsub'
  title         text not null,
  created_at    timestamptz not null default now()
);

create index on curriculum_chapters (class_num, subject);

create table games_catalog (
  game_id       text primary key,       -- stable slug, e.g. 'cnt-1'
  engine        text not null,          -- 'count-add', 'letter-trace', 'phonics-pop', ...
  subject       text not null,
  skill_tag     text not null,          -- groups levels of the same skill for locking
  class_num     int  not null check (class_num between 1 and 10),
  level         int  not null default 1,
  chapter_ref   text references curriculum_chapters (chapter_ref),
  name          text not null,
  icon          text,
  params        jsonb not null default '{}',
  is_active     boolean not null default true,  -- flips on once the engine ships in the UI
  created_at    timestamptz not null default now(),
  unique (skill_tag, class_num, level)
);

create index on games_catalog (class_num, subject) where is_active;
create index on games_catalog (engine);

create table game_attempts (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references student_profiles (user_id),
  game_id           text not null references games_catalog (game_id),
  stars             int  not null default 0 check (stars between 0 and 3),
  best_score        int,
  attempts_count    int  not null default 0,
  last_played_at    timestamptz,
  unique (student_id, game_id)
);

create index on game_attempts (student_id);

-- ─── RLS ─────────────────────────────────────────────────────
alter table curriculum_chapters enable row level security;
alter table games_catalog enable row level security;
alter table game_attempts enable row level security;

-- Reference data, same shape as class_subjects/badges: every authenticated
-- role can read it, only super_admin can write it directly.
create policy curriculum_chapters_authenticated_read on curriculum_chapters
  for select using (auth.role() = 'authenticated');

create policy curriculum_chapters_super_admin_write on curriculum_chapters
  for all using (jwt_role() = 'super_admin');

create policy games_catalog_authenticated_read on games_catalog
  for select using (auth.role() = 'authenticated');

create policy games_catalog_super_admin_write on games_catalog
  for all using (jwt_role() = 'super_admin');

-- game_attempts carries stars/score, the same "XP-bearing" trust boundary
-- as exam_submissions/student_badges: students can read their own rows,
-- but stars/XP are only ever written by the Node API (service-role key)
-- after validating the attempt server-side — no direct student write policy.
create policy game_attempts_student_own_read on game_attempts
  for select using (student_id = auth.uid());

create policy game_attempts_teacher_read on game_attempts
  for select using (
    student_id in (select id from user_profiles where school_id = jwt_school_id())
  );

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on curriculum_chapters, games_catalog, game_attempts to postgres, service_role;
grant select on curriculum_chapters, games_catalog to authenticated;
grant select on game_attempts to authenticated;
grant select on curriculum_chapters, games_catalog to anon;

-- ═════════════════════════════════════════════════════════════
--  CURRICULUM SEED — derived from the engine x class matrix in
--  BATCH1_UI_CONTENT_PLAN.md §5.2-§5.4. Only chapters explicitly named
--  in that plan are seeded (no invented NCERT chapter titles); English
--  Classes 3-4 and the non-curricular Class 1-2 "World Around Me"
--  picture pool are intentionally left out until real book TOCs are
--  ingested (see IMPLEMENTATION_STATUS.md).
-- ═════════════════════════════════════════════════════════════

insert into curriculum_chapters (class_num, subject, chapter_num, chapter_ref, title) values
  -- Class 1 Mathematics
  (1, 'Mathematics', 1, 'c1-math-counting', 'Numbers 1-9, 10-20, 21-50'),
  (1, 'Mathematics', 2, 'c1-math-addsub',   'Addition & Subtraction'),
  (1, 'Mathematics', 3, 'c1-math-shapes',   'Shapes, Space & Patterns'),
  (1, 'Mathematics', 4, 'c1-math-measure',  'Longer & Shorter (Measurement)'),
  (1, 'Mathematics', 5, 'c1-math-time',     'Time: Before & After'),
  (1, 'Mathematics', 6, 'c1-math-money',    'Money: Coin Recognition'),
  (1, 'Mathematics', 7, 'c1-math-data',     'How Many? Data Handling'),
  -- Class 2 Mathematics
  (2, 'Mathematics', 1, 'c2-math-counting', 'Counting in Groups & Tens, Tens and Ones'),
  (2, 'Mathematics', 2, 'c2-math-addsub',   'Add our Points, Give & Take, Birds Come Birds Go'),
  (2, 'Mathematics', 3, 'c2-math-muldiv',   'Counting in Groups (Skip-Counting)'),
  (2, 'Mathematics', 4, 'c2-math-shapes',   'Long/Round, Footprints, Lines & Patterns'),
  (2, 'Mathematics', 5, 'c2-math-measure',  'Longest Step, How Much Can You Carry, Jugs & Mugs'),
  (2, 'Mathematics', 6, 'c2-math-time',     'Days & Calendar (My Funday)'),
  (2, 'Mathematics', 7, 'c2-math-data',     'Tally: How Many Ponytails'),
  -- Class 3 Mathematics
  (3, 'Mathematics', 1, 'c3-math-counting',  'Fun with Numbers (to 999)'),
  (3, 'Mathematics', 2, 'c3-math-addsub',    'Give & Take, Fun with Give & Take'),
  (3, 'Mathematics', 3, 'c3-math-muldiv',    'How Many Times (x) / Can We Share (÷)'),
  (3, 'Mathematics', 4, 'c3-math-shapes',    'Shapes and Designs'),
  (3, 'Mathematics', 5, 'c3-math-measure',   'cm/m, g/kg, Litres'),
  (3, 'Mathematics', 6, 'c3-math-time',      'Calendar & Clock Hours (Time Goes On)'),
  (3, 'Mathematics', 7, 'c3-math-money',     'Rupees and Paise'),
  (3, 'Mathematics', 8, 'c3-math-fractions', 'Half & Quarter via Sharing'),
  (3, 'Mathematics', 9, 'c3-math-data',      'Pictographs (Smart Charts)'),
  -- Class 4 Mathematics
  (4, 'Mathematics', 1, 'c4-math-counting',  'Large Numbers & Estimation (A Trip to Bhopal)'),
  (4, 'Mathematics', 2, 'c4-math-addsub',    'Word Problem Sums (Trip to Bhopal, Junk Seller)'),
  (4, 'Mathematics', 3, 'c4-math-muldiv',    'Tables Mastery & Division (Tables & Shares)'),
  (4, 'Mathematics', 4, 'c4-math-shapes',    'Building with Bricks, Carts and Wheels'),
  (4, 'Mathematics', 5, 'c4-math-measure',   'm/km, ml, Perimeter (Fields & Fences)'),
  (4, 'Mathematics', 6, 'c4-math-time',      'Minutes, Duration, Timetable (Tick Tick Tick)'),
  (4, 'Mathematics', 7, 'c4-math-money',     'Buy & Sell Problems (The Junk Seller)'),
  (4, 'Mathematics', 8, 'c4-math-fractions', 'Halves & Quarters'),
  (4, 'Mathematics', 9, 'c4-math-data',      'Bar Charts (Smart Charts)'),
  -- Class 1 English (foundational)
  (1, 'English', 0, 'c1-eng-alphabet', 'Alphabet & Letter Tracing'),
  (1, 'English', 0, 'c1-eng-phonics',  'Phonics & Letter Sounds'),
  -- Class 1 English (Marigold, units explicitly named in the plan)
  (1, 'English', 1, 'c1-eng-happy-child', 'A Happy Child'),
  (1, 'English', 2, 'c1-eng-one-kitten',  'One Little Kitten'),
  (1, 'English', 3, 'c1-eng-a-kite',      'A Kite'),
  (1, 'English', 4, 'c1-eng-clouds',      'Clouds'),
  (1, 'English', 5, 'c1-eng-lalu-peelu',  'Lalu and Peelu'),
  -- Class 2 English (foundational)
  (2, 'English', 0, 'c2-eng-alphabet', 'Alphabet & Letter Tracing'),
  (2, 'English', 0, 'c2-eng-phonics',  'Phonics & Letter Sounds'),
  -- Class 2 English (Marigold, units explicitly named in the plan)
  (2, 'English', 1, 'c2-eng-first-day',   'First Day At School'),
  (2, 'English', 2, 'c2-eng-zoo-manners', 'Zoo Manners'),
  (2, 'English', 3, 'c2-eng-music-man',   'I Am the Music Man'),
  -- Class 3 World Around Us (Looking Around, chapters named in the plan)
  (3, 'World Around Us', 1, 'c3-wau-plant-fairy', 'The Plant Fairy'),
  (3, 'World Around Us', 2, 'c3-wau-water',        'Water O'' Water / Drop by Drop'),
  (3, 'World Around Us', 3, 'c3-wau-foods',        'Foods We Eat'),
  (3, 'World Around Us', 4, 'c3-wau-animals',      'Our Friends - Animals'),
  (3, 'World Around Us', 5, 'c3-wau-left-right',   'Left-Right'),
  (3, 'World Around Us', 6, 'c3-wau-families',     'Families Can Be Different'),
  (3, 'World Around Us', 7, 'c3-wau-games',        'Games We Play'),
  -- Class 4 World Around Us (Looking Around, chapters named in the plan)
  (4, 'World Around Us', 1, 'c4-wau-animals',  'Ear to Ear / A Day with Nandu'),
  (4, 'World Around Us', 2, 'c4-wau-water',    'A River''s Tale / Too Much Water'),
  (4, 'World Around Us', 3, 'c4-wau-farming',  'Basva''s Farm / From Market to Home'),
  (4, 'World Around Us', 4, 'c4-wau-families', 'Changing Families, Changing Times')
on conflict (chapter_ref) do nothing;

-- ═════════════════════════════════════════════════════════════
--  GAMES CATALOG SEED
--  count-add / letter-trace / phonics-pop are the 3 engines already
--  coded in Games.tsx (is_active = true, ready to be parameterized in
--  the Build Order phase 3 UI pass). times-table / equal-share are
--  seeded inactive as the next two engines in the plan's example
--  matrix (§6.1) so their chapter linkage exists before the engine
--  code does.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('cnt-1', 'count-add', 'Mathematics', 'arithmetic', 1, 1, 'c1-math-addsub', 'Count & Add Stars', '🔢',
    '{"max": 9, "ops": ["+"]}', true),
  ('cnt-2', 'count-add', 'Mathematics', 'arithmetic', 2, 1, 'c2-math-addsub', 'Count & Add Stars', '🔢',
    '{"max": 99, "ops": ["+", "-"]}', true),
  ('cnt-3', 'count-add', 'Mathematics', 'arithmetic', 3, 1, 'c3-math-addsub', 'Count & Add Stars', '🔢',
    '{"max": 999, "ops": ["+", "-"]}', true),
  ('cnt-4', 'count-add', 'Mathematics', 'arithmetic', 4, 1, 'c4-math-addsub', 'Count & Add Stars', '🔢',
    '{"max": 9999, "ops": ["+", "-"], "wordProblems": true}', true),

  ('trace-1', 'letter-trace', 'English', 'literacy-tracing', 1, 1, 'c1-eng-alphabet', 'Alphabet Tracing', '✍️',
    '{"letters": ["A", "B", "C", "D", "E"], "case": "upper"}', true),
  ('trace-2', 'letter-trace', 'English', 'literacy-tracing', 2, 1, 'c2-eng-alphabet', 'Alphabet Tracing', '✍️',
    '{"letters": ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"], "case": "lower"}', true),

  ('phon-1', 'phonics-pop', 'English', 'phonics', 1, 1, 'c1-eng-phonics', 'Phonics Pop', '🎈',
    '{"mode": "picture-to-letter", "pairs": [{"emoji": "🍎", "letter": "A"}, {"emoji": "🐝", "letter": "B"}, {"emoji": "🐱", "letter": "C"}, {"emoji": "🐶", "letter": "D"}, {"emoji": "🐘", "letter": "E"}]}', true),
  ('phon-2', 'phonics-pop', 'English', 'phonics', 2, 1, 'c2-eng-phonics', 'Phonics Pop', '🎈',
    '{"mode": "picture-to-letter", "pairs": [{"emoji": "🦊", "letter": "F"}, {"emoji": "🦒", "letter": "G"}, {"emoji": "🏠", "letter": "H"}, {"emoji": "🍦", "letter": "I"}, {"emoji": "🪼", "letter": "J"}]}', true),

  ('tbl-3', 'times-table', 'Mathematics', 'multiplication', 3, 1, 'c3-math-muldiv', 'Times Table Race', '✖️',
    '{"tables": [2, 3, 4, 5]}', false),
  ('div-4', 'equal-share', 'Mathematics', 'division', 4, 1, 'c4-math-muldiv', 'Equal Share', '➗',
    '{"divisorMax": 9}', false)
on conflict (game_id) do nothing;
