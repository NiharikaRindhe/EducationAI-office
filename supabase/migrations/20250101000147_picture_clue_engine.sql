-- ═════════════════════════════════════════════════════════════
--  PICTURE CLUE READ — sentence-to-matching-picture reading check
--  (ported from EducationAI-Games-master's Grade4 "PictureMatch";
--  the source used 14 illustration PNGs, rebuilt here with emoji
--  instead since Batch1 has no image-asset pipeline, restyled to
--  this app's Adventure Island theme). Seeded as level 1 of a new
--  'reading-picture' skill. Class 2 gets simple single sentences;
--  Class 3 gets subtler distractors. No curriculum_chapters row
--  exists yet for Class 2/3 English reading beyond phonics, so
--  chapter_ref is null.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('picread-2', 'picture-clue-read', 'English', 'reading-picture', 2, 1, null, 'Reading Explorer', '🖼️',
    '{"questions": [
      {"text": "The red apple sits on top of the table.", "correctIdx": 0,
       "options": [{"emoji": "🍎", "label": "Apple on the table"}, {"emoji": "🐱", "label": "Cat on a mat", "distractor": "You may have missed \"apple\" in the sentence."}, {"emoji": "🌸", "label": "Flower in a pot", "distractor": "This shows a flower, not an apple."}]},
      {"text": "The cat rests on a soft mat.", "correctIdx": 1,
       "options": [{"emoji": "🐕", "label": "Dog with a ball", "distractor": "Dog and cat are both animals — re-read who is resting."}, {"emoji": "🐱", "label": "Cat on a mat"}, {"emoji": "🐔", "label": "Hen near eggs", "distractor": "A hen is a bird, not a cat."}]},
      {"text": "The dog plays with a round ball.", "correctIdx": 2,
       "options": [{"emoji": "🦮", "label": "Dog on a leash", "distractor": "The sentence says ball, not leash."}, {"emoji": "🐱", "label": "Cat on a mat", "distractor": "The subject is a dog, not a cat."}, {"emoji": "🐕", "label": "Dog with a ball"}]}
    ]}', true),
  ('picread-3', 'picture-clue-read', 'English', 'reading-picture', 3, 1, null, 'Reading Explorer', '🖼️',
    '{"questions": [
      {"text": "The hen sits quietly beside her many eggs.", "correctIdx": 2,
       "options": [{"emoji": "🍳", "label": "Breakfast on a table", "distractor": "Eggs are mentioned, but the sentence is about a hen, not a meal."}, {"emoji": "🥐", "label": "A fluffy bun", "distractor": "Bun sounds like food, but the sentence is about a hen and her eggs."}, {"emoji": "🐔", "label": "Hen beside eggs"}]},
      {"text": "Six colorful flowers grow in a row.", "correctIdx": 1,
       "options": [{"emoji": "🌷", "label": "One flower in a pot", "distractor": "The sentence says six flowers in a row, not one in a pot."}, {"emoji": "🌼", "label": "Six flowers in a row"}, {"emoji": "🔺", "label": "Colorful shapes", "distractor": "Shapes are not flowers — re-read the noun."}]},
      {"text": "There are three different shapes on the page.", "correctIdx": 2,
       "options": [{"emoji": "🌼", "label": "Six flowers", "distractor": "Flowers are not shapes — re-read the noun."}, {"emoji": "🚀", "label": "A rocket blasting off", "distractor": "A rocket is one shape, but the sentence says three different shapes."}, {"emoji": "🔺", "label": "Three shapes"}]}
    ]}', true)
on conflict (game_id) do nothing;
