-- ═════════════════════════════════════════════════════════════
--  SEED DATA — class_subjects whitelist, badges, one demo school.
--  Applied after migrations on `supabase db reset` / first `supabase start`.
--  The super_admin auth user is NOT created here (auth.users needs the
--  Admin API, not raw SQL) — run `npm run seed:super-admin` in api/ instead.
-- ═════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
--  CLASS → SUBJECT WHITELIST (exact matrix from the MVP spec)
-- ─────────────────────────────────────────────────────────────
insert into class_subjects (class_num, subject, has_exams) values
  -- Class 1
  (1, 'English', true), (1, 'Mathematics', true),
  -- Class 2
  (2, 'English', true), (2, 'Mathematics', true),
  -- Class 3
  (3, 'English', true), (3, 'Mathematics', true), (3, 'World Around Us', true),
  (3, 'Arts', false), (3, 'Physical Education', false),
  -- Class 4
  (4, 'English', true), (4, 'Mathematics', true), (4, 'World Around Us', true),
  (4, 'Arts', false), (4, 'Physical Education', false),
  -- Class 5
  (5, 'English', true), (5, 'Mathematics', true), (5, 'World Around Us', true),
  (5, 'Arts', false), (5, 'Physical Education', false),
  -- Class 6
  (6, 'English', true), (6, 'Mathematics', true), (6, 'Science', true), (6, 'Social Science', true),
  (6, 'Arts', false), (6, 'Physical Education', false),
  -- Class 7
  (7, 'English', true), (7, 'Mathematics', true), (7, 'Science', true), (7, 'Social Science', true),
  (7, 'Arts', false), (7, 'Physical Education', false),
  -- Class 8
  (8, 'English', true), (8, 'Mathematics', true), (8, 'Science', true), (8, 'Social Science', true),
  (8, 'Arts', false), (8, 'Physical Education', false),
  -- Class 9
  (9, 'English', true), (9, 'Mathematics', true), (9, 'Science', true), (9, 'Social Science', true),
  (9, 'Arts', false), (9, 'Physical Education', false),
  -- Class 10 (no Arts at Class 10, per the matrix)
  (10, 'English', true), (10, 'Mathematics', true), (10, 'Science', true), (10, 'Social Science', true),
  (10, 'Physical Education', false)
on conflict (class_num, subject) do nothing;

-- ─────────────────────────────────────────────────────────────
--  BADGES
-- ─────────────────────────────────────────────────────────────
insert into badges (name, description, icon, criteria_type, criteria_value) values
  ('7-Day Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 7),
  ('30-Day Legend', 'Maintain a 30-day streak', '🏆', 'streak', 30),
  ('XP Rookie', 'Earn 500 XP', '⭐', 'xp', 500),
  ('XP Champion', 'Earn 5000 XP', '💎', 'xp', 5000),
  ('Word Master', '90%+ on word pronunciation', '🎤', 'english_accuracy', 90),
  ('Fluent Reader', '90%+ on sentence reading', '📖', 'english_fluency', 90),
  ('Task Hero', 'Complete 20 tasks', '✅', 'tasks_done', 20),
  ('Exam Ace', 'Score 90%+ on any exam', '🎯', 'exam_score', 90)
on conflict (name) do nothing;

-- ─────────────────────────────────────────────────────────────
--  DEMO SCHOOL (for local dev / first pilot dry-run)
-- ─────────────────────────────────────────────────────────────
insert into schools (id, name, code, city, state, board)
values ('00000000-0000-0000-0000-000000000001', 'Demo Public School', 'DEMO-2024', 'New Delhi', 'Delhi', 'CBSE')
on conflict (code) do nothing;
