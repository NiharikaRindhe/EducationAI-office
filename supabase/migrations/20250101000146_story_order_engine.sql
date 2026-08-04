-- ═════════════════════════════════════════════════════════════
--  STORY ORDER — tap sentence-tiles into the correct story order
--  (ported from EducationAI-Games-master's Grade4 "SequencingTiles",
--  restyled to this app's Adventure Island theme; tap-to-place only,
--  drag-drop dropped to stay touch-first). Seeded as level 1 of a
--  new 'story-sequencing' skill. Class 3 gets stories with explicit
--  sequence words (first/next/finally); Class 4 gets implicit
--  cause-and-effect stories. No curriculum_chapters row exists yet
--  for Class 3/4 English, so chapter_ref is null.
-- ═════════════════════════════════════════════════════════════

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  ('story-3', 'story-order', 'English', 'story-sequencing', 3, 1, null, 'Story Sequencer', '📖',
    '{"stories": [
      {"title": "The Bird House", "tiles": [
        {"id": "A", "text": "Finally, a little blue bird flew inside."},
        {"id": "B", "text": "First, Tim painted the wooden bird house."},
        {"id": "C", "text": "Next, he hung it up on a tall tree branch."}
      ], "correctOrder": ["B", "C", "A"]},
      {"title": "Baking Cookies", "tiles": [
        {"id": "A", "text": "Then, she put the tray into the hot oven."},
        {"id": "B", "text": "First, Mom mixed the cookie dough in a big bowl."},
        {"id": "C", "text": "Last, we ate the warm cookies with milk."}
      ], "correctOrder": ["B", "A", "C"]}
    ]}', true),
  ('story-4', 'story-order', 'English', 'story-sequencing', 4, 1, null, 'Story Sequencer', '📖',
    '{"stories": [
      {"title": "Lost Toy", "tiles": [
        {"id": "A", "text": "He looked under his bed and found his toy car."},
        {"id": "B", "text": "Sam felt very sad because his favorite toy was missing."},
        {"id": "C", "text": "He wiped his tears and started smiling again."}
      ], "correctOrder": ["B", "A", "C"]},
      {"title": "The Muddy Puppy", "tiles": [
        {"id": "A", "text": "Max jumped into a deep puddle of mud."},
        {"id": "B", "text": "Dad used the garden hose to wash him clean."},
        {"id": "C", "text": "The puppy ran through the wet grass after the rain."}
      ], "correctOrder": ["C", "A", "B"]}
    ]}', true)
on conflict (game_id) do nothing;
