-- ═════════════════════════════════════════════════════════════
--  BIOLOGY HUB — Class 9-10 NCERT diagram study + memory-quiz mode
--  (ported from EducationAI-Games-master's Biology module, restyled
--  to this app's Batch 3 sky theme). Reuses the existing games_catalog
--  / game_attempts contract as-is (listGamesForStudent /
--  submitGameAttempt are already class-agnostic — no backend changes
--  needed): one 'bio-quiz' game per diagram topic. Tagged subject
--  'Science' per the class_subjects whitelist (NCERT Class 9-10
--  teaches Science as one combined subject, not split Physics/
--  Chemistry/Biology) — skill_tag differentiates topics the same way
--  it already differentiates 'counting' vs 'patterns' in Mathematics.
--  Study Mode (hover/click, no scoring) ships with no attempt-tracking,
--  same as the existing ConceptMap page; only Memory Quiz mode scores.
-- ═════════════════════════════════════════════════════════════

insert into curriculum_chapters (class_num, subject, chapter_num, chapter_ref, title) values
  (9,  'Science', 5, 'c9-sci-cell',                  'The Fundamental Unit of Life'),
  (9,  'Science', 6, 'c9-sci-tissues',                'Tissues'),
  (10, 'Science', 6, 'c10-sci-life-processes',        'Life Processes'),
  (10, 'Science', 7, 'c10-sci-control-coordination',  'Control and Coordination')
on conflict (chapter_ref) do nothing;

insert into games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
  -- Unit 1: The Fundamental Unit of Life (Class 9)
  ('bio-animal-cell',  'bio-quiz', 'Science', 'animal_cell',  9, 1, 'c9-sci-cell', 'Animal Cell Structure',  '🔬', '{"topicId":"animal_cell"}', true),
  ('bio-plant-cell',   'bio-quiz', 'Science', 'plant_cell',   9, 1, 'c9-sci-cell', 'Plant Cell Structure',   '🌱', '{"topicId":"plant_cell"}', true),
  ('bio-mitosis',      'bio-quiz', 'Science', 'mitosis',      9, 1, 'c9-sci-cell', 'Mitosis',                '🧬', '{"topicId":"mitosis"}', true),
  ('bio-meiosis1',     'bio-quiz', 'Science', 'meiosis_1',    9, 1, 'c9-sci-cell', 'Meiosis I',              '🧬', '{"topicId":"meiosis_1"}', true),
  ('bio-meiosis2',     'bio-quiz', 'Science', 'meiosis_2',    9, 1, 'c9-sci-cell', 'Meiosis II',             '🧬', '{"topicId":"meiosis_2"}', true),
  -- Unit 2: Tissues (Class 9)
  ('bio-plant-tissue',      'bio-quiz', 'Science', 'plant_tissue',              9, 1, 'c9-sci-tissues', 'Meristematic Tissue', '🌿', '{"topicId":"plant_tissue"}', true),
  ('bio-permanent-tissue',  'bio-quiz', 'Science', 'permanent_tissue',          9, 1, 'c9-sci-tissues', 'Permanent Tissue',    '🪵', '{"topicId":"permanent_tissue"}', true),
  ('bio-epithelial-tissue', 'bio-quiz', 'Science', 'epithelial_tissue',         9, 1, 'c9-sci-tissues', 'Epithelial Tissue',   '🧫', '{"topicId":"epithelial_tissue"}', true),
  ('bio-muscular-tissue',   'bio-quiz', 'Science', 'muscular_tissue',           9, 1, 'c9-sci-tissues', 'Muscular Tissue',     '💪', '{"topicId":"muscular_tissue"}', true),
  ('bio-connective-tissue', 'bio-quiz', 'Science', 'connective_tissue_topic',   9, 1, 'c9-sci-tissues', 'Connective Tissue',   '🦴', '{"topicId":"connective_tissue_topic"}', true),
  ('bio-nervous-tissue',    'bio-quiz', 'Science', 'nervous_tissue',            9, 1, 'c9-sci-tissues', 'Nervous Tissue',      '⚡', '{"topicId":"nervous_tissue"}', true),
  -- Unit 3: Life Processes (Class 10)
  ('bio-alimentary',  'bio-quiz', 'Science', 'alimentary_canal',   10, 1, 'c10-sci-life-processes', 'Alimentary Canal',       '🍽️', '{"topicId":"alimentary_canal"}', true),
  ('bio-respiratory', 'bio-quiz', 'Science', 'respiratory_system', 10, 1, 'c10-sci-life-processes', 'Respiratory System',     '🫁', '{"topicId":"respiratory_system"}', true),
  ('bio-heart',       'bio-quiz', 'Science', 'heart',              10, 1, 'c10-sci-life-processes', 'The Human Heart',        '❤️', '{"topicId":"heart"}', true),
  ('bio-excretory',   'bio-quiz', 'Science', 'excretory_system',   10, 1, 'c10-sci-life-processes', 'Excretory System',       '🩺', '{"topicId":"excretory_system"}', true),
  -- Unit 4: Control and Coordination (Class 10)
  ('bio-neuron', 'bio-quiz', 'Science', 'neuron',      10, 1, 'c10-sci-control-coordination', 'The Neuron',       '🧠', '{"topicId":"neuron"}', true),
  ('bio-brain',  'bio-quiz', 'Science', 'human_brain', 10, 1, 'c10-sci-control-coordination', 'The Human Brain',  '🧠', '{"topicId":"human_brain"}', true)
on conflict (game_id) do nothing;
