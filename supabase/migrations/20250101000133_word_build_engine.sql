-- ═════════════════════════════════════════════════════════════
--  WORD BUILD — letter-pool spelling game (ported from
--  EducationAI-Games-master's Grade2 "SentenceStrip", restyled to
--  this app's Adventure Island theme). Seeded as level 2 of existing
--  English word-match chapters (quest's word-match generator is
--  level 1): same vocabulary, but the student spells the word from a
--  mixed letter pool instead of picking a whole-word MCQ answer.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('wb1-happy', 'word-build', 'English', 'words-happy', 1, 2, 'c1-eng-happy-child', 'Word Builder', '🔤',
    '{"words":[
      {"sentence":"The ______ shines in the sky.","answer":"SUN","emoji":"☀️","distractors":["M","T","P"]},
      {"sentence":"A ______ has green leaves.","answer":"TREE","emoji":"🌳","distractors":["B","Q","X"]},
      {"sentence":"We live in a ______.","answer":"HOUSE","emoji":"🏠","distractors":["K","Z","W"]}
    ]}', true),
  ('wb2-school', 'word-build', 'English', 'words-school', 2, 2, 'c2-eng-first-day', 'Word Builder', '🔤',
    '{"words":[
      {"sentence":"I carry my books in a ______.","answer":"BAG","emoji":"🎒","distractors":["M","T","P"]},
      {"sentence":"I read from a ______.","answer":"BOOK","emoji":"📖","distractors":["W","X","Z"]},
      {"sentence":"I write with a ______.","answer":"PENCIL","emoji":"✏️","distractors":["Q","Y","U"]}
    ]}', true)
on conflict (game_id) do nothing;
