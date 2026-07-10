-- ═════════════════════════════════════════════════════════════
--  QUEST ENGINE — full chapter coverage for Classes 1-4
--  One parameterized visual-MCQ engine ("quest") whose `generator`
--  param picks the mechanic (counting, place-value, times-table,
--  equal-share, patterns, measure, clock, calendar, daytime, money,
--  fractions, tally, skip-count, word-match, picture-quiz).
--  After this migration every chapter in curriculum_chapters has at
--  least one active game, so the Journey map has no dead nodes.
--  Question text here is generic kid knowledge / arithmetic, NOT
--  NCERT book text (that still comes via the ingestion pipeline).
-- ═════════════════════════════════════════════════════════════

-- Convert the two inactive stub engines to quest and switch them on.
update games_catalog set engine = 'quest', is_active = true,
  params = '{"generator":"times-table","tables":[2,3,4,5]}'
  where game_id = 'tbl-3';
update games_catalog set engine = 'quest', is_active = true,
  params = '{"generator":"equal-share","divisorMax":9,"maxItems":45}'
  where game_id = 'div-4';

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  -- ── Class 1 Mathematics ─────────────────────────────────────
  ('q1-count',   'quest', 'Mathematics', 'counting',    1, 1, 'c1-math-counting', 'How Many?',       '🐥', '{"generator":"counting","max":20}', true),
  ('q1-pattern', 'quest', 'Mathematics', 'patterns',    1, 1, 'c1-math-shapes',   'Pattern Play',    '🔷', '{"generator":"patterns","level":1}', true),
  ('q1-measure', 'quest', 'Mathematics', 'measurement', 1, 1, 'c1-math-measure',  'Long or Short?',  '📏', '{"generator":"measure","mode":"length"}', true),
  ('q1-time',    'quest', 'Mathematics', 'time',        1, 1, 'c1-math-time',     'Day & Night',     '🌞', '{"generator":"daytime"}', true),
  ('q1-money',   'quest', 'Mathematics', 'money',       1, 1, 'c1-math-money',    'Coin Count',      '🪙', '{"generator":"money","maxAmount":10}', true),
  ('q1-data',    'quest', 'Mathematics', 'data',        1, 1, 'c1-math-data',     'Sort & Count',    '🧺', '{"generator":"tally","max":5}', true),
  -- ── Class 2 Mathematics ─────────────────────────────────────
  ('q2-count',   'quest', 'Mathematics', 'counting',    2, 1, 'c2-math-counting', 'Tens & Ones',     '🔟', '{"generator":"place-value","max":99}', true),
  ('q2-skip',    'quest', 'Mathematics', 'multiplication', 2, 1, 'c2-math-muldiv','Skip Counting',   '🦘', '{"generator":"skip-count","steps":[2,5,10]}', true),
  ('q2-pattern', 'quest', 'Mathematics', 'patterns',    2, 1, 'c2-math-shapes',   'Lines & Patterns','🔶', '{"generator":"patterns","level":2}', true),
  ('q2-measure', 'quest', 'Mathematics', 'measurement', 2, 1, 'c2-math-measure',  'Jugs & Mugs',     '🫙', '{"generator":"measure","mode":"capacity"}', true),
  ('q2-time',    'quest', 'Mathematics', 'time',        2, 1, 'c2-math-time',     'My Funday',       '📅', '{"generator":"calendar"}', true),
  ('q2-data',    'quest', 'Mathematics', 'data',        2, 1, 'c2-math-data',     'Tally Marks',     '✋', '{"generator":"tally","max":8}', true),
  -- ── Class 3 Mathematics ─────────────────────────────────────
  ('q3-count',   'quest', 'Mathematics', 'counting',    3, 1, 'c3-math-counting', 'Numbers to 999',  '💯', '{"generator":"place-value","max":999}', true),
  ('q3-share',   'quest', 'Mathematics', 'division',    3, 1, 'c3-math-muldiv',   'Can We Share?',   '🍪', '{"generator":"equal-share","divisorMax":5,"maxItems":20}', true),
  ('q3-pattern', 'quest', 'Mathematics', 'patterns',    3, 1, 'c3-math-shapes',   'Shapes & Designs','🔺', '{"generator":"patterns","level":3}', true),
  ('q3-measure', 'quest', 'Mathematics', 'measurement', 3, 1, 'c3-math-measure',  'cm, m & kg',      '⚖️', '{"generator":"measure","mode":"metric"}', true),
  ('q3-time',    'quest', 'Mathematics', 'time',        3, 1, 'c3-math-time',     'Clock Explorer',  '⏰', '{"generator":"clock","level":"hours"}', true),
  ('q3-money',   'quest', 'Mathematics', 'money',       3, 1, 'c3-math-money',    'Rupee Shop',      '💰', '{"generator":"money","maxAmount":100}', true),
  ('q3-fraction','quest', 'Mathematics', 'fractions',   3, 1, 'c3-math-fractions','Half & Quarter',  '🍕', '{"generator":"fractions","parts":[2,4]}', true),
  ('q3-data',    'quest', 'Mathematics', 'data',        3, 1, 'c3-math-data',     'Smart Charts',    '📊', '{"generator":"tally","max":10}', true),
  -- ── Class 4 Mathematics ─────────────────────────────────────
  ('q4-count',   'quest', 'Mathematics', 'counting',    4, 1, 'c4-math-counting', 'Big Numbers',     '🚂', '{"generator":"place-value","max":9999}', true),
  ('q4-table',   'quest', 'Mathematics', 'multiplication', 4, 1, 'c4-math-muldiv','Table Race',      '✖️', '{"generator":"times-table","tables":[2,3,4,5,6,7,8,9,10]}', true),
  ('q4-pattern', 'quest', 'Mathematics', 'patterns',    4, 1, 'c4-math-shapes',   'Bricks & Wheels', '🧱', '{"generator":"patterns","level":4}', true),
  ('q4-measure', 'quest', 'Mathematics', 'measurement', 4, 1, 'c4-math-measure',  'm, km & ml',      '📐', '{"generator":"measure","mode":"metric-big"}', true),
  ('q4-time',    'quest', 'Mathematics', 'time',        4, 1, 'c4-math-time',     'Tick Tick Tick',  '⏱️', '{"generator":"clock","level":"minutes"}', true),
  ('q4-money',   'quest', 'Mathematics', 'money',       4, 1, 'c4-math-money',    'Market Day',      '🛒', '{"generator":"money","maxAmount":500}', true),
  ('q4-fraction','quest', 'Mathematics', 'fractions',   4, 1, 'c4-math-fractions','Halves & Quarters','🍰','{"generator":"fractions","parts":[2,3,4]}', true),
  ('q4-data',    'quest', 'Mathematics', 'data',        4, 1, 'c4-math-data',     'Bar Charts',      '📊', '{"generator":"tally","max":12}', true),

  -- ── English word games (one per Marigold unit) ──────────────
  ('w1-happy',  'quest', 'English', 'words-happy',  1, 1, 'c1-eng-happy-child', 'Word Match', '😊',
    '{"generator":"word-match","words":[{"w":"happy","e":"😊"},{"w":"tree","e":"🌳"},{"w":"house","e":"🏠"},{"w":"sun","e":"☀️"},{"w":"bird","e":"🐦"}]}', true),
  ('w1-kitten', 'quest', 'English', 'words-kitten', 1, 1, 'c1-eng-one-kitten',  'Word Match', '🐱',
    '{"generator":"word-match","words":[{"w":"kitten","e":"🐱"},{"w":"milk","e":"🥛"},{"w":"fish","e":"🐟"},{"w":"paw","e":"🐾"},{"w":"ball","e":"⚽"}]}', true),
  ('w1-kite',   'quest', 'English', 'words-kite',   1, 1, 'c1-eng-a-kite',      'Word Match', '🪁',
    '{"generator":"word-match","words":[{"w":"kite","e":"🪁"},{"w":"cloud","e":"☁️"},{"w":"string","e":"🧵"},{"w":"wind","e":"🍃"},{"w":"sky","e":"🌤️"}]}', true),
  ('w1-clouds', 'quest', 'English', 'words-clouds', 1, 1, 'c1-eng-clouds',      'Word Match', '🌧️',
    '{"generator":"word-match","words":[{"w":"rain","e":"🌧️"},{"w":"cloud","e":"☁️"},{"w":"water","e":"💧"},{"w":"umbrella","e":"☂️"},{"w":"rainbow","e":"🌈"}]}', true),
  ('w1-lalu',   'quest', 'English', 'words-lalu',   1, 1, 'c1-eng-lalu-peelu',  'Word Match', '🐔',
    '{"generator":"word-match","words":[{"w":"hen","e":"🐔"},{"w":"chick","e":"🐥"},{"w":"egg","e":"🥚"},{"w":"red","e":"🔴"},{"w":"yellow","e":"🟡"}]}', true),
  ('w2-school', 'quest', 'English', 'words-school', 2, 1, 'c2-eng-first-day',   'Word Match', '🏫',
    '{"generator":"word-match","words":[{"w":"school","e":"🏫"},{"w":"bag","e":"🎒"},{"w":"book","e":"📖"},{"w":"pencil","e":"✏️"},{"w":"teacher","e":"🧑‍🏫"}]}', true),
  ('w2-zoo',    'quest', 'English', 'words-zoo',    2, 1, 'c2-eng-zoo-manners', 'Word Match', '🦁',
    '{"generator":"word-match","words":[{"w":"lion","e":"🦁"},{"w":"monkey","e":"🐒"},{"w":"elephant","e":"🐘"},{"w":"bear","e":"🐻"},{"w":"snake","e":"🐍"}]}', true),
  ('w2-music',  'quest', 'English', 'words-music',  2, 1, 'c2-eng-music-man',   'Word Match', '🥁',
    '{"generator":"word-match","words":[{"w":"music","e":"🎵"},{"w":"drum","e":"🥁"},{"w":"bell","e":"🔔"},{"w":"sing","e":"🎤"},{"w":"piano","e":"🎹"}]}', true),

  -- ── World Around Us picture quizzes (Classes 3-4) ───────────
  ('e3-plants', 'quest', 'World Around Us', 'wau-plants', 3, 1, 'c3-wau-plant-fairy', 'Plant Quiz', '🌱',
    '{"generator":"picture-quiz","questions":[
      {"q":"Which one is a plant?","o":["🌱","🐟","🪨"],"a":0},
      {"q":"Which part is the leaf?","o":["🍃","🥚","🧱"],"a":0},
      {"q":"What do plants need to grow?","o":["💧 water","🍫 chocolate","👟 shoes"],"a":0},
      {"q":"Which grows on a tree?","o":["🍎 apple","🚗 car","📺 TV"],"a":0},
      {"q":"Which is a flower?","o":["🌻","🐚","🥾"],"a":0}]}', true),
  ('e3-water',  'quest', 'World Around Us', 'wau-water',  3, 1, 'c3-wau-water', 'Water Quiz', '💧',
    '{"generator":"picture-quiz","questions":[
      {"q":"Which do we drink?","o":["💧 water","🪨 stone","🔥 fire"],"a":0},
      {"q":"Where does rain come from?","o":["☁️ clouds","🌳 trees","🐟 fish"],"a":0},
      {"q":"Which can hold water?","o":["🪣 bucket","📖 book","👟 shoe"],"a":0},
      {"q":"Where do fish live?","o":["💧 water","🔥 fire","🌵 desert"],"a":0},
      {"q":"Which saves water?","o":["🚿 short bath","🚰 open tap","🌊 flooding"],"a":0}]}', true),
  ('e3-food',   'quest', 'World Around Us', 'wau-food',   3, 1, 'c3-wau-foods', 'Food Quiz', '🍎',
    '{"generator":"picture-quiz","questions":[
      {"q":"Which is a fruit?","o":["🍌 banana","🥕 carrot","🍚 rice"],"a":0},
      {"q":"Who gives us milk?","o":["🐄 cow","🐍 snake","🦅 eagle"],"a":0},
      {"q":"Which is a vegetable?","o":["🥕 carrot","🍫 chocolate","🍬 candy"],"a":0},
      {"q":"What do hens give us?","o":["🥚 eggs","🍎 apples","🥛 milk"],"a":0},
      {"q":"Which food is healthy?","o":["🥗 salad","🍭 lollipop","🍟 chips"],"a":0}]}', true),
  ('e3-animals','quest', 'World Around Us', 'wau-animals', 3, 1, 'c3-wau-animals', 'Animal Quiz', '🐾',
    '{"generator":"picture-quiz","questions":[
      {"q":"Which animal lives in water?","o":["🐟 fish","🐔 hen","🐐 goat"],"a":0},
      {"q":"Which animal can fly?","o":["🦅 eagle","🐄 cow","🐕 dog"],"a":0},
      {"q":"Which animal says moo?","o":["🐄 cow","🐱 cat","🦁 lion"],"a":0},
      {"q":"Which is a pet animal?","o":["🐶 dog","🐅 tiger","🦈 shark"],"a":0},
      {"q":"Where does a bird live?","o":["🪹 nest","🕳️ burrow","🌊 sea"],"a":0}]}', true),
  ('e3-lr',     'quest', 'World Around Us', 'wau-directions', 3, 1, 'c3-wau-left-right', 'Which Way?', '🧭',
    '{"generator":"picture-quiz","questions":[
      {"q":"Which arrow points UP?","o":["⬆️","⬇️","➡️"],"a":0},
      {"q":"Which arrow points LEFT?","o":["⬅️","➡️","⬆️"],"a":0},
      {"q":"Which arrow points DOWN?","o":["⬇️","⬆️","⬅️"],"a":0},
      {"q":"Which arrow points RIGHT?","o":["➡️","⬅️","⬇️"],"a":0},
      {"q":"Which hand do most people write with?","o":["✋ right","🤚 left","🦶 foot"],"a":0}]}', true),
  ('e3-family', 'quest', 'World Around Us', 'wau-family', 3, 1, 'c3-wau-families', 'Family Quiz', '👨‍👩‍👧',
    '{"generator":"picture-quiz","questions":[
      {"q":"Which shows a family?","o":["👨‍👩‍👧","🚗","🌳"],"a":0},
      {"q":"Your father''s father is your…","o":["👴 grandfather","👧 sister","🧑‍🏫 teacher"],"a":0},
      {"q":"A baby cat is called a…","o":["🐱 kitten","🐶 puppy","🐄 calf"],"a":0},
      {"q":"How many people are in 👨‍👩‍👧?","o":["3","1","5"],"a":0}]}', true),
  ('e3-games',  'quest', 'World Around Us', 'wau-games',  3, 1, 'c3-wau-games', 'Games Quiz', '🏏',
    '{"generator":"picture-quiz","questions":[
      {"q":"Which game uses a bat?","o":["🏏 cricket","🏊 swimming","♟️ chess"],"a":0},
      {"q":"Which is played with feet?","o":["⚽ football","🏏 cricket","🎯 darts"],"a":0},
      {"q":"Where do we swim?","o":["🏊 pool","🛣️ road","🛏️ bed"],"a":0},
      {"q":"Which game has a king and queen?","o":["♟️ chess","⚽ football","🏏 cricket"],"a":0}]}', true),
  ('e4-animals','quest', 'World Around Us', 'wau-animals', 4, 1, 'c4-wau-animals', 'Animal Explorer', '🐘',
    '{"generator":"picture-quiz","questions":[
      {"q":"Which animal has a trunk?","o":["🐘 elephant","🐕 dog","🐔 hen"],"a":0},
      {"q":"Which animal has stripes?","o":["🐅 tiger","🐄 cow","🐖 pig"],"a":0},
      {"q":"Which is the biggest land animal?","o":["🐘 elephant","🐱 cat","🐜 ant"],"a":0},
      {"q":"Which animal hops?","o":["🐇 rabbit","🐢 turtle","🐍 snake"],"a":0},
      {"q":"Which animal works on farms?","o":["🐂 ox","🦈 shark","🦉 owl"],"a":0}]}', true),
  ('e4-water',  'quest', 'World Around Us', 'wau-water',  4, 1, 'c4-wau-water', 'River Tale', '🏞️',
    '{"generator":"picture-quiz","questions":[
      {"q":"Where does a river finally reach?","o":["🌊 sea","🏔️ mountain","🏠 house"],"a":0},
      {"q":"Rain fills up…","o":["🏞️ lakes","📚 books","🚗 cars"],"a":0},
      {"q":"Which should we save?","o":["💧 water","🗑️ garbage","💨 smoke"],"a":0},
      {"q":"Which makes river water dirty?","o":["🗑️ throwing garbage","🐟 fish swimming","☁️ clouds"],"a":0}]}', true),
  ('e4-farm',   'quest', 'World Around Us', 'wau-farm',   4, 1, 'c4-wau-farming', 'Farm to Home', '🌾',
    '{"generator":"picture-quiz","questions":[
      {"q":"Where does rice grow?","o":["🌾 farm","🏭 factory","🛒 shop"],"a":0},
      {"q":"Who grows our food?","o":["🧑‍🌾 farmer","🧑‍✈️ pilot","🧑‍🎨 painter"],"a":0},
      {"q":"Bread is made from…","o":["🌾 wheat","🪨 stones","🧵 thread"],"a":0},
      {"q":"Where do we buy vegetables?","o":["🛒 market","🏥 hospital","🏦 bank"],"a":0}]}', true),
  ('e4-family', 'quest', 'World Around Us', 'wau-family', 4, 1, 'c4-wau-families', 'Changing Times', '🏡',
    '{"generator":"picture-quiz","questions":[
      {"q":"Who is usually the oldest at home?","o":["👵 grandmother","👶 baby","🧒 child"],"a":0},
      {"q":"Many relatives living together is a…","o":["👨‍👩‍👧‍👦 big family","🚌 bus","🏫 school"],"a":0},
      {"q":"Long ago people wrote letters. Now we…","o":["📱 call or message","🕊️ send pigeons","🔥 light fires"],"a":0},
      {"q":"Which is a change at home over time?","o":["📺 new TV","🌞 the sun","🌙 the moon"],"a":0}]}', true)
on conflict (game_id) do nothing;
