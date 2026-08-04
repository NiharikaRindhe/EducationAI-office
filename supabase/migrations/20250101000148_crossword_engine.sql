-- ═════════════════════════════════════════════════════════════
--  CROSSWORD — two intersecting words filled from a shared
--  letter-tile pool (ported from EducationAI-Games-master's Grade2
--  "Crossword", restyled to this app's Adventure Island theme).
--  Seeded as level 1 of a new 'words-crossword' skill. Class 2 gets
--  3-4 letter words; Class 3 gets longer words.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('cross-2', 'crossword', 'English', 'words-crossword', 2, 1, null, 'Word Crossword', '📝',
    '{"puzzles": [
      {"words": [{"id": "cat", "answer": "CAT", "clue": "A furry pet that says meow", "emoji": "🐱"}, {"id": "cap", "answer": "CAP", "clue": "You wear it on your head", "emoji": "🧢"}]},
      {"words": [{"id": "sun", "answer": "SUN", "clue": "It shines in the sky", "emoji": "☀️"}, {"id": "run", "answer": "RUN", "clue": "Move fast with your legs", "emoji": "🏃"}]}
    ]}', true),
  ('cross-3', 'crossword', 'English', 'words-crossword', 3, 1, null, 'Word Crossword', '📝',
    '{"puzzles": [
      {"words": [{"id": "plant", "answer": "PLANT", "clue": "A living thing that grows in soil", "emoji": "🌱"}, {"id": "ant", "answer": "ANT", "clue": "A tiny insect that lives in colonies", "emoji": "🐜"}]},
      {"words": [{"id": "river", "answer": "RIVER", "clue": "Flowing water that leads to the sea", "emoji": "🏞️"}, {"id": "read", "answer": "READ", "clue": "What you do with a book", "emoji": "📖"}]}
    ]}', true)
on conflict (game_id) do nothing;
