-- ═════════════════════════════════════════════════════════════
--  SENTENCE GRAMMAR — tap word-tiles by part-of-speech into slots
--  (ported from EducationAI-Games-master's Grade3 "SentenceBuilder",
--  restyled to this app's Adventure Island theme; tap-to-place only,
--  drag-drop dropped to stay touch-first). Seeded as level 1 of a
--  new 'grammar' skill. Class 3 gets simple subject+verb sentences;
--  Class 4 gets the expanded adjective+noun+verb+adverb set. No
--  curriculum_chapters row exists yet for Class 3/4 English, so
--  chapter_ref is null.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('grammar-3', 'sentence-grammar', 'English', 'grammar', 3, 1, null, 'Sentence Builder', '🧩',
    '{"sentences": [
      {"slots": [{"id": "subject", "accepts": ["noun", "pronoun"], "label": "SUBJECT"}, {"id": "verb", "accepts": ["verb"], "label": "VERB"}],
       "wordBank": [{"word": "Dogs", "pos": "noun"}, {"word": "Cats", "pos": "noun"}, {"word": "She", "pos": "pronoun"}, {"word": "He", "pos": "pronoun"}, {"word": "bark", "pos": "verb"}, {"word": "purr", "pos": "verb"}, {"word": "sing", "pos": "verb"}],
       "example": "Dogs bark."},
      {"slots": [{"id": "subject", "accepts": ["noun", "pronoun"], "label": "SUBJECT"}, {"id": "verb", "accepts": ["verb"], "label": "VERB"}],
       "wordBank": [{"word": "Fish", "pos": "noun"}, {"word": "Frogs", "pos": "noun"}, {"word": "They", "pos": "pronoun"}, {"word": "We", "pos": "pronoun"}, {"word": "swim", "pos": "verb"}, {"word": "jump", "pos": "verb"}, {"word": "hop", "pos": "verb"}],
       "example": "Frogs jump."}
    ]}', true),
  ('grammar-4', 'sentence-grammar', 'English', 'grammar', 4, 1, null, 'Sentence Builder', '🧩',
    '{"sentences": [
      {"slots": [{"id": "adjective", "accepts": ["adjective"], "label": "ADJECTIVE"}, {"id": "subject", "accepts": ["noun", "pronoun"], "label": "SUBJECT"}, {"id": "verb", "accepts": ["verb"], "label": "VERB"}, {"id": "adverb", "accepts": ["adverb"], "label": "ADVERB"}],
       "wordBank": [{"word": "Hungry", "pos": "adjective"}, {"word": "Sleepy", "pos": "adjective"}, {"word": "dogs", "pos": "noun"}, {"word": "cats", "pos": "noun"}, {"word": "bark", "pos": "verb"}, {"word": "purr", "pos": "verb"}, {"word": "loudly", "pos": "adverb"}, {"word": "softly", "pos": "adverb"}],
       "example": "Hungry dogs bark loudly."},
      {"slots": [{"id": "adjective", "accepts": ["adjective"], "label": "ADJECTIVE"}, {"id": "subject", "accepts": ["noun", "pronoun"], "label": "SUBJECT"}, {"id": "verb", "accepts": ["verb"], "label": "VERB"}, {"id": "adverb", "accepts": ["adverb"], "label": "ADVERB"}],
       "wordBank": [{"word": "Tiny", "pos": "adjective"}, {"word": "Wild", "pos": "adjective"}, {"word": "rabbits", "pos": "noun"}, {"word": "foxes", "pos": "noun"}, {"word": "hop", "pos": "verb"}, {"word": "run", "pos": "verb"}, {"word": "swiftly", "pos": "adverb"}, {"word": "gently", "pos": "adverb"}],
       "example": "Tiny rabbits hop swiftly."}
    ]}', true)
on conflict (game_id) do nothing;
