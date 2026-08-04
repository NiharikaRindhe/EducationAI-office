-- ═════════════════════════════════════════════════════════════
--  CONTEXT FILL — context-clue fill-in-the-blank (ported from
--  EducationAI-Games-master's Grade3 "MissingWord", restyled to
--  this app's Adventure Island theme; the source's free-type Level
--  3 is dropped, multiple-choice only). Seeded as level 1 of a new
--  'reading-context' skill. No curriculum_chapters row exists yet
--  for Class 3/4 English (see BATCH1_UI_CONTENT_PLAN.md — never
--  invent NCERT chapter titles), so chapter_ref is null; these are
--  ungrouped skill games until real book TOCs are ingested.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('ctxfill-3', 'context-fill', 'English', 'reading-context', 3, 1, null, 'Context Clues', '🔎',
    '{"puzzles": [
      {"passage": "The bird built a ______ in the tall tree.", "emoji": "🐦", "options": ["nest", "rock", "river", "cloud"], "correct": "nest",
       "wrong": {"rock": "A rock is hard and heavy — birds cannot build with it.", "river": "A river is water that flows — birds do not live in rivers.", "cloud": "A cloud is water vapor — not solid enough for a home."}},
      {"passage": "She was very hungry, so she ate a big ______.", "emoji": "🍎", "options": ["apple", "pillow", "shoe", "pencil"], "correct": "apple",
       "wrong": {"pillow": "You sleep on a pillow — it is not food.", "shoe": "Shoes go on your feet, not in your mouth!", "pencil": "A pencil is for writing, not eating."}},
      {"passage": "It was raining, so he opened his ______.", "emoji": "☔", "options": ["umbrella", "book", "banana", "chair"], "correct": "umbrella",
       "wrong": {"book": "A book cannot keep you dry in the rain.", "banana": "A banana will not protect you from rain.", "chair": "You sit on a chair — it is not used for rain."}},
      {"passage": "At night, he was tired and went to ______.", "emoji": "🛏️", "options": ["sleep", "swim", "dance", "paint"], "correct": "sleep",
       "wrong": {"swim": "Swimming happens in water — not usually at bedtime!", "dance": "Dancing takes energy — not what you do when tired.", "paint": "Painting is for when you are awake and active."}},
      {"passage": "The dog wagged its ______ when it was happy.", "emoji": "🐕", "options": ["tail", "wing", "fin", "trunk"], "correct": "tail",
       "wrong": {"wing": "Wings are for birds — dogs do not have them.", "fin": "Fins help fish swim — dogs do not have fins.", "trunk": "A trunk is part of an elephant, not a dog."}}
    ]}', true),
  ('ctxfill-4', 'context-fill', 'English', 'reading-context', 4, 1, null, 'Context Clues', '🔎',
    '{"puzzles": [
      {"passage": "Maya loved reading. Every Saturday she visited the ______ and borrowed three books.", "emoji": "📚", "options": ["library", "gym", "airport", "museum"], "correct": "library",
       "wrong": {"gym": "A gym is for exercise, not borrowing books.", "airport": "Airports are for travelling by plane.", "museum": "Museums do not lend books to borrow."}},
      {"passage": "Dad put the cake in the ______ so it could bake for thirty minutes.", "emoji": "🎂", "options": ["oven", "freezer", "sink", "drawer"], "correct": "oven",
       "wrong": {"freezer": "A freezer makes things cold — baking needs heat.", "sink": "A sink is full of water — you cannot bake in it.", "drawer": "Drawers store items — they cannot produce heat."}},
      {"passage": "To help the flowers grow, Lily watered them with a ______.", "emoji": "🌸", "options": ["hose", "hammer", "mirror", "blanket"], "correct": "hose",
       "wrong": {"hammer": "A hammer is a tool for hitting nails, not watering.", "mirror": "Mirrors reflect light — they do not carry water.", "blanket": "Blankets keep you warm — not for watering plants."}},
      {"passage": "The sailor used a ______ to steer the boat across the ocean.", "emoji": "⛵", "options": ["rudder", "ladder", "pillow", "clock"], "correct": "rudder",
       "wrong": {"ladder": "A ladder helps you climb — it does not steer boats.", "pillow": "A pillow is for sleeping, not steering.", "clock": "A clock tells time — it cannot steer a boat."}},
      {"passage": "She pressed the keys on the ______ and a beautiful melody filled the room.", "emoji": "🎹", "options": ["piano", "telescope", "bucket", "fence"], "correct": "piano",
       "wrong": {"telescope": "A telescope has no keys to press.", "bucket": "A bucket holds water — it does not make music.", "fence": "A fence has no keys for making melodies."}}
    ]}', true)
on conflict (game_id) do nothing;
