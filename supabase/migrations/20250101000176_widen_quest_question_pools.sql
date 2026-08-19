-- Widen the question pools that were smaller than a game is long.
--
-- A Batch 1 quest deals 5 rounds. QuestEngine now refuses to ask the same
-- question twice in one session (see buildDeck), so a pool of 4 no longer
-- repeats — it simply deals a 4-round game. That is honest but thin, and it
-- gives a child nothing new on a second play.
--
-- These are the pools that sat at or below the round count. Every question
-- added stays inside the chapter the game already belongs to; nothing here
-- introduces a new topic.

-- ── Class 3 EVS picture quizzes (4 questions each) ─────────────────────────

update public.games_catalog set params = jsonb_set(params, '{questions}',
  (params->'questions') || '[
    {"q": "Your mother''s mother is your…",      "o": ["👵 grandmother", "👧 sister", "🧑‍🏫 teacher"], "a": 0},
    {"q": "Who looks after you when you are ill?", "o": ["👨‍👩‍👧 family", "🚌 bus driver", "🌳 tree"],    "a": 0},
    {"q": "A baby dog is called a…",             "o": ["🐶 puppy", "🐱 kitten", "🐄 calf"],           "a": 0}
  ]'::jsonb)
where game_id = 'e3-family';

update public.games_catalog set params = jsonb_set(params, '{questions}',
  (params->'questions') || '[
    {"q": "Which game is played in water?",   "o": ["🏊 swimming", "🏏 cricket", "♟️ chess"],   "a": 0},
    {"q": "How many players are in a kabaddi team?", "o": ["7", "2", "20"],                  "a": 0},
    {"q": "Which do we need to play badminton?", "o": ["🏸 racket", "🏀 basket", "🎣 rod"],    "a": 0}
  ]'::jsonb)
where game_id = 'e3-games';

-- ── Class 4 EVS picture quizzes (4 questions each) ─────────────────────────

update public.games_catalog set params = jsonb_set(params, '{questions}',
  (params->'questions') || '[
    {"q": "Who is younger than a child?",        "o": ["👶 baby", "👵 grandmother", "🧑 adult"],       "a": 0},
    {"q": "Long ago people travelled mostly by…", "o": ["🐂 bullock cart", "✈️ aeroplane", "🚄 train"], "a": 0},
    {"q": "Which helps a family stay in touch far away?", "o": ["📱 phone", "🪑 chair", "🥄 spoon"],   "a": 0}
  ]'::jsonb)
where game_id = 'e4-family';

update public.games_catalog set params = jsonb_set(params, '{questions}',
  (params->'questions') || '[
    {"q": "What does a farmer need most for crops?", "o": ["💧 water", "📺 television", "👟 shoes"], "a": 0},
    {"q": "Which animal helps plough a field?",      "o": ["🐂 ox", "🐅 tiger", "🐬 dolphin"],       "a": 0},
    {"q": "Milk reaches our home from a…",           "o": ["🐄 dairy", "🏭 steel factory", "📚 library"], "a": 0}
  ]'::jsonb)
where game_id = 'e4-farm';

update public.games_catalog set params = jsonb_set(params, '{questions}',
  (params->'questions') || '[
    {"q": "Where does a river begin?",        "o": ["🏔️ mountains", "🌊 sea", "🏠 house"],       "a": 0},
    {"q": "Which uses the LEAST water?",      "o": ["🚿 quick shower", "🛁 full bathtub", "🚰 running tap"], "a": 0},
    {"q": "Water we can drink is called…",    "o": ["💧 fresh water", "🧂 salt water", "🛢️ oil"],  "a": 0}
  ]'::jsonb)
where game_id = 'e4-water';

-- ── Word-match vocabulary lists (5 words each = exactly the round count) ───
-- Three more words per chapter, all drawn from that Marigold story.

update public.games_catalog set params = jsonb_set(params, '{words}',
  (params->'words') || '[{"w":"nest","e":"🪹"},{"w":"corn","e":"🌽"},{"w":"farm","e":"🚜"}]'::jsonb)
where game_id = 'w1-lalu';

update public.games_catalog set params = jsonb_set(params, '{words}',
  (params->'words') || '[{"w":"sky","e":"🌤️"},{"w":"grass","e":"🌿"},{"w":"song","e":"🎵"}]'::jsonb)
where game_id = 'w1-happy';

update public.games_catalog set params = jsonb_set(params, '{words}',
  (params->'words') || '[{"w":"rain","e":"🌧️"},{"w":"sun","e":"☀️"},{"w":"wind","e":"🍃"}]'::jsonb)
where game_id = 'w1-clouds';

update public.games_catalog set params = jsonb_set(params, '{words}',
  (params->'words') || '[{"w":"tail","e":"🎏"},{"w":"tree","e":"🌳"},{"w":"bird","e":"🐦"}]'::jsonb)
where game_id = 'w1-kite';

update public.games_catalog set params = jsonb_set(params, '{words}',
  (params->'words') || '[{"w":"cat","e":"🐈"},{"w":"nap","e":"😴"},{"w":"box","e":"📦"}]'::jsonb)
where game_id = 'w1-kitten';

update public.games_catalog set params = jsonb_set(params, '{words}',
  (params->'words') || '[{"w":"tiger","e":"🐅"},{"w":"deer","e":"🦌"},{"w":"cage","e":"🔒"}]'::jsonb)
where game_id = 'w2-zoo';

update public.games_catalog set params = jsonb_set(params, '{words}',
  (params->'words') || '[{"w":"flute","e":"🪈"},{"w":"dance","e":"💃"},{"w":"band","e":"🎺"}]'::jsonb)
where game_id = 'w2-music';

update public.games_catalog set params = jsonb_set(params, '{words}',
  (params->'words') || '[{"w":"class","e":"🪑"},{"w":"friend","e":"🧒"},{"w":"board","e":"📋"}]'::jsonb)
where game_id = 'w2-school';

-- ── Two Class 2 games shared one tile picture ──────────────────────────────
-- Distance Finder and The Hopper both showed 🐸 and sit in the same chapter,
-- so a child saw two identical, unlabelled tiles side by side with no way to
-- tell them apart. The Hopper keeps the frog (it IS a jumping game); Distance
-- Finder takes the ruler that matches what it teaches.
update public.games_catalog set icon = '📏' where game_id = 'dist-2';
