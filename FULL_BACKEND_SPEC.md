# EduAI — Complete Backend Specification

> **Last updated:** June 29, 2026
> **Stack:** Supabase (PostgreSQL + pgvector + Storage + Realtime) · Node.js API (Railway) · Claude API · OpenAI Whisper + Embeddings
> **This document covers:** Every DB table, every API route, auth flow, middleware, background jobs, and service layer for the entire EduAI platform.

---

## Table of Contents

1. [Architecture Summary](#1-architecture-summary)
2. [Complete Database Schema](#2-complete-database-schema)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [API Routes — Full List](#4-api-routes--full-list)
5. [Service Layer](#5-service-layer)
6. [Background Jobs](#6-background-jobs)
7. [Middleware](#7-middleware)
8. [Environment Variables](#8-environment-variables)
9. [Folder Structure — Node.js API](#9-folder-structure--nodejs-api)
10. [Error Handling Standard](#10-error-handling-standard)
11. [Rate Limiting Plan](#11-rate-limiting-plan)
12. [Deployment](#12-deployment)

---

## 1. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
│                     Hosted on Vercel / Netlify                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
         ┌─────────────────────▼──────────────────────┐
         │           NODE.JS API SERVER                │
         │         (Railway — always on)               │
         │                                             │
         │  /api/auth/**       Auth routes             │
         │  /api/student/**    Student routes          │
         │  /api/teacher/**    Teacher routes          │
         │  /api/parent/**     Parent routes           │
         │  /api/chat/**       RAG chatbot             │
         │  /api/ai/**         AI features             │
         │  /api/proctor/**    Proctoring              │
         │  /api/english/**    English assessment      │
         │  /api/admin/**      School admin            │
         └──────┬──────────────────┬───────────────────┘
                │                  │
     ┌──────────▼──────┐   ┌───────▼───────────────────┐
     │  SUPABASE DB     │   │  EXTERNAL SERVICES         │
     │  PostgreSQL      │   │                           │
     │  + pgvector      │   │  Claude API (Anthropic)   │
     │  + Storage       │   │  OpenAI (Whisper/Embed)   │
     │  + Realtime      │   │  WATI (WhatsApp)          │
     │  + Auth          │   │  Resend (Email)           │
     └──────────────────┘   │  Upstash Redis            │
                            │  Judge0 (Code exec)       │
                            └───────────────────────────┘
```

**Why Node.js API server instead of only Supabase Edge Functions:**
- AI routes take 2–4 seconds → Edge Functions have 150ms CPU limit on some plans
- Background jobs need persistent process
- Complex business logic (XP calculations, badge engine) easier in Node.js
- Full npm ecosystem (jsPDF, jszip, etc.)

**Supabase handles directly (no API server needed):**
- Auth token validation (middleware reads Supabase JWT)
- Realtime subscriptions (leaderboard, activity feed — client subscribes directly)
- Storage uploads (client uploads directly with signed URLs)
- RLS policies enforce data access at DB level

---

## 2. Complete Database Schema

> Run all migrations in order. Supabase SQL Editor or `supabase db push`.

### 2.1 Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector for RAG
CREATE EXTENSION IF NOT EXISTS "pg_cron";      -- background jobs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- fuzzy search on student names
```

---

### 2.2 Schools & Multi-Tenancy

```sql
CREATE TABLE schools (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  code          TEXT NOT NULL UNIQUE,        -- e.g. "DPS-NOIDA-2024"
  plan          TEXT DEFAULT 'starter'
                  CHECK (plan IN ('starter', 'school', 'enterprise')),
  city          TEXT,
  state         TEXT,
  board         TEXT DEFAULT 'CBSE'
                  CHECK (board IN ('CBSE', 'ICSE', 'State', 'IB')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Seed one school for dev
INSERT INTO schools (name, code, city, state) VALUES
  ('Demo Public School', 'DEMO-2024', 'New Delhi', 'Delhi');
```

---

### 2.3 Users & Profiles

```sql
-- Core user table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id     UUID NOT NULL REFERENCES schools(id),
  role          TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
  full_name     TEXT NOT NULL,
  phone         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Student-specific data
CREATE TABLE student_profiles (
  user_id       UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  class_num     INT NOT NULL CHECK (class_num BETWEEN 1 AND 12),
  section       TEXT DEFAULT 'A',
  batch_id      INT GENERATED ALWAYS AS (
                  CASE
                    WHEN class_num BETWEEN 1  AND 4  THEN 1
                    WHEN class_num BETWEEN 5  AND 8  THEN 2
                    WHEN class_num BETWEEN 9  AND 10 THEN 3
                    WHEN class_num BETWEEN 11 AND 12 THEN 4
                  END
                ) STORED,
  avatar        TEXT DEFAULT '🦁',
  stream        TEXT CHECK (stream IN ('science', 'commerce', 'arts')), -- Class 11-12 only
  xp            INT DEFAULT 0,
  level         INT GENERATED ALWAYS AS (xp / 1000) STORED,
  streak        INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  target_year   INT,                  -- JEE/NEET target year
  prep_level    TEXT CHECK (prep_level IN ('beginner', 'intermediate', 'advanced')),
  onboarded     BOOLEAN DEFAULT false -- Batch 4 onboarding flag
);

-- Teacher-specific data
CREATE TABLE teacher_profiles (
  user_id           UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  employee_id       TEXT,
  specialization    TEXT,             -- primary subject
  classes_taught    INT[],            -- [6, 7, 8]
  designation       TEXT DEFAULT 'Teacher'
);

-- Parent-specific data
CREATE TABLE parent_profiles (
  user_id       UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  child_id      UUID REFERENCES user_profiles(id)  -- FK to student user_profile
);
```

---

### 2.4 Streak & Activity

```sql
CREATE TABLE streak_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES student_profiles(user_id),
  logged_date   DATE NOT NULL,
  xp_earned     INT DEFAULT 0,
  UNIQUE (student_id, logged_date)    -- one entry per student per day
);

CREATE INDEX ON streak_logs (student_id, logged_date DESC);
```

---

### 2.5 Tasks

```sql
CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id),
  created_by    UUID NOT NULL REFERENCES teacher_profiles(user_id),
  title         TEXT NOT NULL,
  subject       TEXT NOT NULL,
  task_type     TEXT DEFAULT 'custom'
                  CHECK (task_type IN ('quiz','reading','practice','pyq','custom')),
  instructions  TEXT,
  xp_reward     INT DEFAULT 10,
  due_date      DATE,
  batch_id      INT CHECK (batch_id BETWEEN 1 AND 4),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE task_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES student_profiles(user_id),
  status        TEXT DEFAULT 'not_started'
                  CHECK (status IN ('not_started','in_progress','in_review','completed')),
  xp_awarded    INT DEFAULT 0,
  completed_at  TIMESTAMPTZ,
  UNIQUE (task_id, student_id)
);

CREATE INDEX ON task_assignments (student_id, status);
CREATE INDEX ON task_assignments (task_id);
```

---

### 2.6 Exams & Questions

```sql
CREATE TABLE exams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id),
  created_by      UUID NOT NULL REFERENCES teacher_profiles(user_id),
  title           TEXT NOT NULL,
  subject         TEXT NOT NULL,
  class_num       INT NOT NULL,
  duration_min    INT NOT NULL DEFAULT 30,
  total_marks     INT GENERATED ALWAYS AS (
                    -- Computed from questions after creation
                    0
                  ) STORED,
  status          TEXT DEFAULT 'draft'
                    CHECK (status IN ('draft','published','closed')),
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  -- Proctoring config (joins to proctoring_settings)
  proctoring_on   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  type            TEXT NOT NULL
                    CHECK (type IN ('mcq','true_false','short_answer','long_answer',
                                    'reading_comp','fill_blank','audio_answer','coding')),
  text            TEXT NOT NULL,
  options         JSONB,           -- [{ id, text, is_correct }] for MCQ
  correct_answer  TEXT,            -- for True/False, Fill blank
  marks           INT NOT NULL DEFAULT 1,
  rubric          TEXT,            -- for short/long answer AI scoring
  ai_scoring      BOOLEAN DEFAULT true,
  order_index     INT DEFAULT 0,
  passage         TEXT,            -- for reading comprehension
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE exam_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         UUID NOT NULL REFERENCES exams(id),
  student_id      UUID NOT NULL REFERENCES student_profiles(user_id),
  admit_card_url  TEXT,            -- generated PDF URL
  assigned_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (exam_id, student_id)
);

CREATE TABLE exam_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         UUID NOT NULL REFERENCES exams(id),
  student_id      UUID NOT NULL REFERENCES student_profiles(user_id),
  question_seed   TEXT,            -- seed for randomized paper: exam_id+student_id
  started_at      TIMESTAMPTZ DEFAULT now(),
  submitted_at    TIMESTAMPTZ,
  auto_submitted  BOOLEAN DEFAULT false,  -- true if proctoring triggered submit
  total_score     NUMERIC(6,2),
  max_score       INT,
  is_reviewed     BOOLEAN DEFAULT false,  -- all subjective answers reviewed by teacher
  xp_awarded      INT DEFAULT 0,
  UNIQUE (exam_id, student_id)
);

CREATE TABLE exam_answers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_submission_id    UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES questions(id),
  student_answer        TEXT,
  selected_option_id    TEXT,          -- for MCQ: selected option id
  is_correct            BOOLEAN,       -- auto-set for MCQ/T-F
  auto_score            NUMERIC(4,1),  -- for MCQ/T-F/Fill blank
  -- AI subjective scoring
  ai_score              NUMERIC(4,1),
  ai_covered_points     TEXT[],
  ai_missing_points     TEXT[],
  ai_feedback           TEXT,
  ai_scored_at          TIMESTAMPTZ,
  -- Teacher review
  final_score           NUMERIC(4,1),
  teacher_note          TEXT,
  teacher_reviewed_at   TIMESTAMPTZ,
  teacher_overrode_ai   BOOLEAN DEFAULT false
);

CREATE INDEX ON exam_answers (exam_submission_id);
CREATE INDEX ON exam_submissions (exam_id, student_id);
```

---

### 2.7 Proctoring

```sql
CREATE TABLE proctoring_settings (
  exam_id               UUID PRIMARY KEY REFERENCES exams(id) ON DELETE CASCADE,
  camera_required       TEXT DEFAULT 'optional'
                          CHECK (camera_required IN ('required','optional','disabled')),
  gaze_tracking         BOOLEAN DEFAULT true,
  auto_submit_on_switch BOOLEAN DEFAULT true,
  switch_limit          INT DEFAULT 3,
  randomize_questions   BOOLEAN DEFAULT true,
  shuffle_options       BOOLEAN DEFAULT true,
  gaze_sensitivity_sec  INT DEFAULT 4
);

CREATE TABLE proctoring_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_submission_id    UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  event_type            TEXT NOT NULL
                          CHECK (event_type IN ('no_face','multiple_faces',
                                                'gaze_away','tab_switch')),
  severity              TEXT NOT NULL CHECK (severity IN ('warning','violation')),
  metadata              JSONB,
  occurred_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON proctoring_events (exam_submission_id, occurred_at);
```

---

### 2.8 Badges

```sql
CREATE TABLE badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  icon            TEXT,           -- emoji or image URL
  batch_id        INT,            -- NULL = all batches
  criteria_type   TEXT NOT NULL
                    CHECK (criteria_type IN ('streak','xp','exam_score','tasks_done',
                                             'english_accuracy','english_fluency')),
  criteria_value  INT NOT NULL,   -- e.g. streak >= 7, xp >= 1000
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE student_badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES student_profiles(user_id),
  badge_id        UUID NOT NULL REFERENCES badges(id),
  earned_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, badge_id)
);

-- Seed badges
INSERT INTO badges (name, description, icon, criteria_type, criteria_value) VALUES
  ('7-Day Warrior',   'Maintain a 7-day streak',       '🔥', 'streak',         7),
  ('30-Day Legend',   'Maintain a 30-day streak',      '🏆', 'streak',        30),
  ('XP Rookie',       'Earn 500 XP',                   '⭐', 'xp',           500),
  ('XP Champion',     'Earn 5000 XP',                  '💎', 'xp',          5000),
  ('Word Master',     '90%+ on word pronunciation',    '🎤', 'english_accuracy', 90),
  ('Fluent Reader',   '90%+ on sentence reading',      '📖', 'english_fluency',  90),
  ('Task Hero',       'Complete 20 tasks',             '✅', 'tasks_done',       20),
  ('Exam Ace',        'Score 90%+ on any exam',        '🎯', 'exam_score',       90);
```

---

### 2.9 Notes

```sql
CREATE TABLE notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES student_profiles(user_id),
  school_id       UUID NOT NULL REFERENCES schools(id),
  title           TEXT NOT NULL,
  content         TEXT,
  subject         TEXT,
  tags            TEXT[],
  batch_id        INT,
  is_board_tagged BOOLEAN DEFAULT false,  -- Batch 3: tagged for board prep
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON notes (student_id, subject);
```

---

### 2.10 Subject Progress

```sql
CREATE TABLE subject_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES student_profiles(user_id),
  subject           TEXT NOT NULL,
  class_num         INT NOT NULL,
  chapters_done     INT DEFAULT 0,
  total_chapters    INT DEFAULT 0,
  last_chapter      TEXT,
  last_updated      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, subject, class_num)
);
```

---

### 2.11 Leaderboard

```sql
CREATE TABLE leaderboard_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id),
  batch_id        INT NOT NULL,
  class_num       INT,
  section         TEXT,
  student_id      UUID NOT NULL REFERENCES student_profiles(user_id),
  xp_score        INT DEFAULT 0,
  rank            INT,
  rank_change     INT DEFAULT 0,  -- positive = moved up, negative = moved down
  period          TEXT NOT NULL CHECK (period IN ('weekly','monthly','all_time')),
  computed_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON leaderboard_snapshots (school_id, batch_id, period, rank);
```

---

### 2.12 Parent Messages

```sql
CREATE TABLE parent_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID NOT NULL REFERENCES parent_profiles(user_id),
  teacher_id      UUID NOT NULL REFERENCES teacher_profiles(user_id),
  school_id       UUID NOT NULL REFERENCES schools(id),
  content         TEXT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT now(),
  read_at         TIMESTAMPTZ,
  teacher_reply   TEXT,
  replied_at      TIMESTAMPTZ
);
```

---

### 2.13 Study Plans (Batch 4)

```sql
CREATE TABLE study_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES student_profiles(user_id),
  goal            TEXT NOT NULL,      -- 'jee_advanced' | 'jee_mains' | 'neet' | 'boards'
  daily_hours     INT NOT NULL,
  weak_subjects   TEXT[],
  target_date     DATE,
  generated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE study_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  day_of_week     TEXT NOT NULL,      -- 'Monday' | 'Tuesday' | ...
  topic           TEXT NOT NULL,
  subject         TEXT NOT NULL,
  duration_min    INT NOT NULL,
  task_type       TEXT DEFAULT 'study'
                    CHECK (task_type IN ('study','practice','mock','revision')),
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ
);
```

---

### 2.14 RAG — Text Chunks & Book Images

```sql
-- Text chunks from NCERT PDFs
CREATE TABLE text_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_num       INT NOT NULL CHECK (class_num BETWEEN 1 AND 12),
  stream          TEXT CHECK (stream IN ('science','commerce','arts')),
  subject         TEXT NOT NULL,
  book_title      TEXT NOT NULL,
  chapter_num     INT,
  chapter_title   TEXT,
  page_num        INT,
  content         TEXT NOT NULL,
  token_count     INT,
  embedding       vector(1536),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON text_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON text_chunks (class_num, subject);

-- Images extracted from NCERT PDFs
CREATE TABLE book_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_num       INT NOT NULL,
  stream          TEXT,
  subject         TEXT NOT NULL,
  book_title      TEXT,
  chapter_num     INT,
  chapter_title   TEXT,
  page_num        INT,
  image_url       TEXT NOT NULL,
  caption         TEXT,
  embedding       vector(1536),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON book_images USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON book_images (class_num, subject);

-- Chat sessions and messages
CREATE TABLE chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES student_profiles(user_id),
  class_num       INT,
  subject         TEXT,
  stream          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content          TEXT,
  image_url        TEXT,
  sources          JSONB,
  returned_images  JSONB,
  tokens_used      INT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON chat_messages (session_id, created_at);
```

---

### 2.15 English Assessment

```sql
CREATE TABLE english_assessment_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_num       INT NOT NULL CHECK (class_num BETWEEN 1 AND 8),
  type            TEXT NOT NULL
                    CHECK (type IN ('word_repeat','word_see_say','sentence_read',
                                    'passage_read','listen_respond')),
  content         TEXT NOT NULL,
  audio_url       TEXT,
  difficulty      TEXT DEFAULT 'medium'
                    CHECK (difficulty IN ('easy','medium','hard')),
  unit            TEXT,
  chapter         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE english_assessment_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES student_profiles(user_id),
  item_id         UUID NOT NULL REFERENCES english_assessment_items(id),
  class_num       INT NOT NULL,
  audio_url       TEXT,
  transcript      TEXT,
  accuracy_score  INT CHECK (accuracy_score BETWEEN 0 AND 10),
  fluency_score   INT CHECK (fluency_score BETWEEN 0 AND 10),
  wpm             INT,
  ai_feedback     TEXT,
  result          TEXT CHECK (result IN ('correct','close','incorrect')),
  xp_earned       INT DEFAULT 0,
  attempted_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON english_assessment_attempts (student_id, attempted_at);
```

---

### 2.16 Row Level Security (RLS) — Complete

```sql
-- Enable RLS on every table
ALTER TABLE user_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_assignments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_progress           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans                ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE english_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges             ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's school_id from JWT custom claim
CREATE OR REPLACE FUNCTION get_my_school_id() RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'school_id')::UUID;
$$ LANGUAGE sql STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT AS $$
  SELECT (auth.jwt() ->> 'role');
$$ LANGUAGE sql STABLE;

-- SCHOOL ISOLATION: All users can only see their own school's data
CREATE POLICY "school_isolation_users"
  ON user_profiles FOR ALL
  USING (school_id = get_my_school_id());

-- STUDENT: own data only
CREATE POLICY "student_own_profile"
  ON student_profiles FOR ALL
  USING (user_id = auth.uid());

-- TEACHER: can see all students in their school
CREATE POLICY "teacher_sees_school_students"
  ON student_profiles FOR SELECT
  USING (
    get_my_role() = 'teacher' AND
    user_id IN (
      SELECT id FROM user_profiles WHERE school_id = get_my_school_id()
    )
  );

-- PARENT: can only see their child's data
CREATE POLICY "parent_sees_child"
  ON student_profiles FOR SELECT
  USING (
    get_my_role() = 'parent' AND
    user_id IN (
      SELECT child_id FROM parent_profiles WHERE user_id = auth.uid()
    )
  );

-- TASK ASSIGNMENTS: student sees own, teacher sees school's
CREATE POLICY "student_own_tasks"
  ON task_assignments FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "teacher_school_tasks"
  ON task_assignments FOR SELECT
  USING (
    get_my_role() = 'teacher' AND
    task_id IN (SELECT id FROM tasks WHERE school_id = get_my_school_id())
  );

-- EXAMS: school-scoped
CREATE POLICY "school_exams"
  ON exams FOR ALL
  USING (school_id = get_my_school_id());

-- CHAT: student owns their sessions
CREATE POLICY "student_own_chat"
  ON chat_sessions FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "student_own_messages"
  ON chat_messages FOR ALL
  USING (
    session_id IN (SELECT id FROM chat_sessions WHERE student_id = auth.uid())
  );

-- NOTES: student owns, teacher reads
CREATE POLICY "student_own_notes"
  ON notes FOR ALL
  USING (student_id = auth.uid());

-- LEADERBOARD: school-scoped read for all authenticated users
CREATE POLICY "school_leaderboard"
  ON leaderboard_snapshots FOR SELECT
  USING (school_id = get_my_school_id());

-- RAG tables: read-only for all authenticated users (no school filter needed — same content)
CREATE POLICY "auth_read_text_chunks"  ON text_chunks  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_book_images"  ON book_images  FOR SELECT USING (auth.role() = 'authenticated');
```

---

### 2.17 pgvector Search Functions

```sql
-- Text chunk similarity search (scoped by class + subject)
CREATE OR REPLACE FUNCTION search_text_chunks(
  query_embedding   vector(1536),
  match_class       int,
  match_subject     text,
  match_stream      text DEFAULT NULL,
  match_count       int  DEFAULT 5,
  min_similarity    float DEFAULT 0.7
)
RETURNS TABLE (
  id            uuid,
  content       text,
  book_title    text,
  chapter_num   int,
  chapter_title text,
  page_num      int,
  similarity    float
)
LANGUAGE sql STABLE AS $$
  SELECT id, content, book_title, chapter_num, chapter_title, page_num,
         1 - (embedding <=> query_embedding) AS similarity
  FROM text_chunks
  WHERE class_num = match_class
    AND subject   = match_subject
    AND (match_stream IS NULL OR stream = match_stream)
    AND 1 - (embedding <=> query_embedding) > min_similarity
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Book image similarity search
CREATE OR REPLACE FUNCTION search_book_images(
  query_embedding   vector(1536),
  match_class       int,
  match_subject     text,
  match_stream      text DEFAULT NULL,
  match_count       int  DEFAULT 3,
  min_similarity    float DEFAULT 0.75
)
RETURNS TABLE (
  id            uuid,
  image_url     text,
  caption       text,
  chapter_title text,
  page_num      int,
  similarity    float
)
LANGUAGE sql STABLE AS $$
  SELECT id, image_url, caption, chapter_title, page_num,
         1 - (embedding <=> query_embedding) AS similarity
  FROM book_images
  WHERE class_num = match_class
    AND subject   = match_subject
    AND (match_stream IS NULL OR stream = match_stream)
    AND 1 - (embedding <=> query_embedding) > min_similarity
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 3. Authentication & Authorization

### 3.1 JWT Custom Claims

Supabase Auth JWT is extended with custom claims set via a `custom_access_token_hook` Edge Function:

```typescript
// supabase/functions/custom-jwt-hook/index.ts
Deno.serve(async (req) => {
  const { user_id } = await req.json();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, school_id')
    .eq('id', user_id)
    .single();

  return new Response(JSON.stringify({
    claims: {
      role:      profile.role,
      school_id: profile.school_id,
    }
  }));
});
```

**Every JWT now contains:**
```json
{
  "sub": "user-uuid",
  "email": "student@school.com",
  "role": "student",
  "school_id": "school-uuid",
  "exp": 1234567890
}
```

RLS policies use `auth.jwt() ->> 'school_id'` and `auth.jwt() ->> 'role'` directly — no extra DB lookup on every query.

---

### 3.2 Auth Flow — Registration

```
Step 1: Frontend → POST /api/auth/verify-school
  Body: { school_code: "DPS-NOIDA-2024" }
  → Checks schools table
  → Returns: { valid: true, school_id, school_name }

Step 2: Frontend → POST /api/auth/register
  Body: {
    school_code, email, password,
    role: 'student' | 'teacher' | 'parent',
    full_name,
    -- student only:
    class_num, section, avatar,
    -- teacher only:
    employee_id, specialization, classes_taught,
    -- parent only:
    phone, child_name, child_class
  }
  → Server creates Supabase auth user
  → Inserts into user_profiles + role-specific profile table
  → Returns: { user_id, session_token, role, redirect_to }
```

---

### 3.3 Auth Flow — Login

```
POST /api/auth/login
  Body: { school_code, email, password }
  → Verify school_code exists
  → Call supabase.auth.signInWithPassword({ email, password })
  → Fetch role from user_profiles
  → Return: {
      access_token,
      refresh_token,
      role,
      batch_id,      -- students only
      redirect_path  -- '/batch2/home' | '/teacher/dashboard' | '/parent/dashboard'
    }
```

---

### 3.4 Auth Middleware (Node.js)

```typescript
// middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  // Attach to request
  req.user = {
    id:        user.id,
    email:     user.email,
    role:      user.app_metadata?.role,
    school_id: user.app_metadata?.school_id,
  };
  next();
}

export function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage:
// router.get('/teacher/students', requireAuth, requireRole('teacher'), handler)
```

---

## 4. API Routes — Full List

### 4.1 Auth Routes

```
POST   /api/auth/verify-school          → Check if school code is valid
POST   /api/auth/register               → Create account (student/teacher/parent)
POST   /api/auth/login                  → Sign in → returns JWT + redirect path
POST   /api/auth/logout                 → Invalidate session
POST   /api/auth/refresh                → Refresh access token
GET    /api/auth/me                     → Current user profile + role + metadata
POST   /api/auth/forgot-password        → Send reset email via Resend
POST   /api/auth/reset-password         → Apply new password from reset token
```

---

### 4.2 Student Routes

```
-- Profile
GET    /api/student/profile             → Full profile (name, avatar, xp, streak, class, batch)
PUT    /api/student/profile             → Update name, avatar
PUT    /api/student/stream              → Set JEE/NEET/arts/commerce stream (Batch 4)
POST   /api/student/onboard            → Complete Batch 4 onboarding (stream, target_year, prep_level)

-- Streak
POST   /api/student/streak/log         → Log today's activity (idempotent — one per day)
GET    /api/student/streak/calendar    → Last 90 days of streak_logs (for heatmap)
GET    /api/student/streak/stats       → current_streak, longest_streak, total_days

-- XP
POST   /api/student/xp/add            → Add XP for an activity { amount, reason }
GET    /api/student/xp/history        → XP earned last 30 days

-- Tasks
GET    /api/student/tasks              → All assigned tasks (filter: status, due, subject)
PUT    /api/student/tasks/:id/status  → Cycle status (not_started → completed)

-- Exams
GET    /api/student/exams              → All assigned exams (upcoming + completed)
GET    /api/student/exam/:id/paper    → Randomized exam paper for this student
POST   /api/student/exam/:id/start   → Record exam start time
POST   /api/student/exam/:id/submit  → Submit all answers → triggers AI scoring
GET    /api/student/exam/:id/result  → Score + per-question breakdown

-- Study Plan (Batch 4)
GET    /api/student/study-plan         → Current study plan + today's tasks
POST   /api/student/study-plan/generate → Generate AI plan { goal, hours, weak_subjects }
PUT    /api/student/study-plan/task/:id → Mark study task done/undone

-- Badges
GET    /api/student/badges             → All earned badges + locked badges with criteria

-- Notes
GET    /api/student/notes              → All notes (filter: subject, tag)
POST   /api/student/notes              → Create note
PUT    /api/student/notes/:id          → Update note
DELETE /api/student/notes/:id          → Delete note
POST   /api/student/notes/:id/summarize → AI summarizes note → returns 3-point summary

-- Subject Progress
GET    /api/student/progress           → All subjects' chapter completion
PUT    /api/student/progress/:subject  → Update chapter count for subject

-- PYQ
GET    /api/student/pyq                → List of PYQ papers (filter: year, subject)
GET    /api/student/pyq/:id           → PYQ paper questions
POST   /api/student/pyq/:id/submit   → Submit PYQ attempt + score

-- Leaderboard
GET    /api/student/leaderboard        → Batch leaderboard (period: weekly/monthly/all_time)

-- Admit Cards
GET    /api/student/admit-cards        → All admit cards for upcoming exams
GET    /api/student/admit-cards/:exam_id → Single admit card PDF URL
```

---

### 4.3 Teacher Routes

```
-- Dashboard
GET    /api/teacher/dashboard          → Stats (student count, active today, avg score, tasks)
GET    /api/teacher/dashboard/at-risk  → At-risk students list

-- Students
GET    /api/teacher/students           → All students (filter: class, section, at_risk)
GET    /api/teacher/students/:id       → Full student profile + subject scores

-- Tasks
POST   /api/teacher/tasks              → Create + assign task
GET    /api/teacher/tasks              → All tasks created by this teacher
DELETE /api/teacher/tasks/:id          → Delete task

-- Exams
POST   /api/teacher/exams              → Create exam with questions + proctoring settings
GET    /api/teacher/exams              → All exams by this teacher
PUT    /api/teacher/exams/:id          → Update exam (before publishing)
PUT    /api/teacher/exams/:id/publish  → Publish exam (locks questions, sends admit cards)
PUT    /api/teacher/exams/:id/close   → Close exam (stop submissions)
GET    /api/teacher/exams/:id/results  → All student submissions for an exam
GET    /api/teacher/exams/:id/submissions/:student_id → Single student's full submission

-- Subjective Answer Review
PUT    /api/teacher/answers/:id/score  → Finalize score for one subjective answer
POST   /api/teacher/exams/:id/publish-results → Publish result after all reviews done

-- Reports
GET    /api/teacher/reports/class      → Class performance heatmap
GET    /api/teacher/reports/subject    → Subject trend bars
GET    /api/teacher/reports/export     → Generate PDF/CSV report download URL

-- Proctoring Reports
GET    /api/teacher/proctor/:exam_id   → Proctoring summary for all students
GET    /api/teacher/proctor/:exam_id/student/:student_id → Violation timeline

-- Messages
GET    /api/teacher/messages           → Messages from parents
PUT    /api/teacher/messages/:id/reply → Reply to parent message

-- Admit Cards
POST   /api/teacher/exams/:id/admit-cards → Generate + send admit cards (bulk)
GET    /api/teacher/exams/:id/admit-cards → Download ZIP of all admit cards

-- Merit List
GET    /api/teacher/exams/:id/merit-list → Ranked student list + cut-off config
POST   /api/teacher/exams/:id/merit-list/publish → Publish merit list to students
```

---

### 4.4 Parent Routes

```
GET    /api/parent/child/profile       → Child's name, class, avatar, xp, streak
GET    /api/parent/child/progress      → Subject scores + chapter completion
GET    /api/parent/child/activities    → Recent activity feed (last 20 events)
GET    /api/parent/child/exams         → Upcoming + completed exams
GET    /api/parent/child/badges        → Earned badges
GET    /api/parent/reports/weekly      → AI-generated weekly summary
GET    /api/parent/reports/pdf         → Downloadable PDF report card URL
POST   /api/parent/messages            → Send message to teacher
GET    /api/parent/messages            → All sent messages + teacher replies
```

---

### 4.5 RAG Chat Routes

```
POST   /api/chat/session               → Create new chat session { class_num, subject, stream }
GET    /api/chat/session/:id/history   → All messages in session (for chat restore)
GET    /api/chat/sessions              → All sessions for current student

POST   /api/chat/message               → Send message + get AI response
  Body: {
    session_id,
    text,
    image_base64?,     -- student photo upload
    class_num,
    subject,
    stream?
  }
  Response: {
    message_id,
    answer,            -- markdown + LaTeX
    sources,           -- NCERT citations
    textbook_images    -- relevant NCERT diagram URLs
  }

DELETE /api/chat/session/:id           → Clear chat history
```

---

### 4.6 AI Routes (Non-Chat)

```
POST   /api/ai/study-plan              → Generate Batch 4 study plan
  Body: { goal, daily_hours, weak_subjects, target_date, stream }

POST   /api/ai/career-path            → Career recommendations
  Body: { subject_scores, stream, class_num }

POST   /api/ai/note-summarize         → Summarize a student note
  Body: { note_content, subject, class_num }

POST   /api/ai/score-answer           → AI score for one subjective answer (internal)
  Body: { question, rubric, student_answer, max_marks, class_num, subject }

POST   /api/ai/show-and-tell          → Batch 1 vision AI for object photos
  Body: { image_base64, class_num }
  Response: { subject_identified, fun_facts[], ncert_connection, related_image_url? }
```

---

### 4.7 Proctoring Routes

```
POST   /api/proctor/event              → Log a proctoring violation event
  Body: { exam_submission_id, event_type, severity, metadata }

GET    /api/proctor/report/:submission_id → Full violation report for one submission

GET    /api/proctor/exam/:exam_id/summary → All students' proctoring summary for teacher
```

---

### 4.8 English Assessment Routes

```
GET    /api/english/items              → Get assessment items { class_num, type, limit }
POST   /api/english/submit             → Submit audio attempt
  Body: { item_id, audio_base64, class_num }
  Response: { transcript, accuracy_score, fluency_score, wpm, result, ai_feedback, xp_earned }

GET    /api/english/progress           → Student's English assessment stats
GET    /api/english/class-report       → Teacher's class-level English report
```

---

### 4.9 Admin Routes (School Admin)

```
GET    /api/admin/school               → School details
PUT    /api/admin/school               → Update school name, board, city
GET    /api/admin/users                → All users in school
POST   /api/admin/users/bulk-import   → CSV import of students
DELETE /api/admin/users/:id            → Deactivate user
GET    /api/admin/analytics            → Platform-wide usage stats
```

---

## 5. Service Layer

Each domain has a service file with business logic, keeping routes thin:

```
src/services/
  auth.service.ts         → register, login, verifySchool, createJWT
  student.service.ts      → getProfile, updateXP, logStreak, checkBadges
  task.service.ts         → assignTask, cycleStatus, getFiltered
  exam.service.ts         → createExam, randomizePaper, gradeAutomatic, publishResults
  proctor.service.ts      → logEvent, buildReport, checkAutoSubmit
  ai-score.service.ts     → scoreSubjectiveAnswer (Claude call)
  chat.service.ts         → createSession, sendMessage, dualRetrieval, generateAnswer
  english.service.ts      → transcribeAudio, scoreWord, scoreSentence
  badge.service.ts        → evaluateCriteria, awardBadge (called after XP updates)
  leaderboard.service.ts  → computeRanks, getForStudent
  notification.service.ts → sendWhatsApp, sendEmail
  report.service.ts       → generatePDF, buildWeeklySummary
  storage.service.ts      → getSignedUploadUrl, deleteFile
```

### Key Service: Badge Engine

```typescript
// services/badge.service.ts
export async function evaluateAndAwardBadges(studentId: string) {
  const student = await getStudentStats(studentId);

  const allBadges = await supabase.from('badges').select('*');
  const earned    = await supabase.from('student_badges')
                      .select('badge_id').eq('student_id', studentId);
  const earnedIds = new Set(earned.data.map(b => b.badge_id));

  const newBadges = [];

  for (const badge of allBadges.data) {
    if (earnedIds.has(badge.id)) continue; // already earned

    let qualifies = false;
    switch (badge.criteria_type) {
      case 'streak':
        qualifies = student.streak >= badge.criteria_value; break;
      case 'xp':
        qualifies = student.xp >= badge.criteria_value; break;
      case 'tasks_done':
        qualifies = student.completed_tasks >= badge.criteria_value; break;
      case 'exam_score':
        qualifies = student.highest_exam_score >= badge.criteria_value; break;
      case 'english_accuracy':
        qualifies = student.avg_english_accuracy >= badge.criteria_value; break;
      case 'english_fluency':
        qualifies = student.avg_english_fluency >= badge.criteria_value; break;
    }

    if (qualifies) {
      await supabase.from('student_badges').insert({
        student_id: studentId,
        badge_id:   badge.id
      });
      newBadges.push(badge);
    }
  }

  return newBadges; // return newly earned badges to show confetti in UI
}
```

---

### Key Service: At-Risk Detection

```typescript
// services/student.service.ts
export async function getAtRiskStudents(schoolId: string) {
  const students = await supabase
    .from('student_profiles')
    .select('user_id, streak, xp, user_profiles(full_name, school_id)')
    .eq('user_profiles.school_id', schoolId);

  const flagged = [];

  for (const s of students.data) {
    const risks = [];

    if (s.streak === 0)
      risks.push({ type: 'streak_broken', label: 'No activity in 2+ days' });

    const recentScores = await getRecentExamScores(s.user_id, 3);
    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    if (avg < 50)
      risks.push({ type: 'low_score', label: `Avg score ${avg}% in last 3 exams` });

    const tasksCompleted = await getTaskCompletionRate(s.user_id, 7); // last 7 days
    if (tasksCompleted < 0.3)
      risks.push({ type: 'low_tasks', label: 'Completed < 30% of tasks this week' });

    if (risks.length > 0)
      flagged.push({ ...s, risks });
  }

  return flagged;
}
```

---

## 6. Background Jobs

Managed with `pg_cron` (runs inside Supabase PostgreSQL) for simple jobs, and a Node.js cron worker (Railway) for jobs that need external API calls.

### 6.1 Streak Reset (pg_cron — daily at midnight IST)

```sql
-- Runs at 18:30 UTC = 00:00 IST
SELECT cron.schedule(
  'reset-broken-streaks',
  '30 18 * * *',
  $$
    UPDATE student_profiles
    SET streak = 0
    WHERE user_id NOT IN (
      SELECT student_id FROM streak_logs
      WHERE logged_date = CURRENT_DATE
    )
    AND streak > 0;
  $$
);
```

### 6.2 Leaderboard Recalculation (pg_cron — hourly)

```sql
SELECT cron.schedule(
  'recalculate-leaderboard',
  '0 * * * *',
  $$
    INSERT INTO leaderboard_snapshots (school_id, batch_id, student_id, xp_score, rank, rank_change, period, computed_at)
    SELECT
      up.school_id,
      sp.batch_id,
      sp.user_id,
      sp.xp,
      RANK() OVER (PARTITION BY up.school_id, sp.batch_id ORDER BY sp.xp DESC),
      0,
      'weekly',
      now()
    FROM student_profiles sp
    JOIN user_profiles up ON up.id = sp.user_id
    ON CONFLICT DO NOTHING;
  $$
);
```

### 6.3 Badge Engine (Node.js cron — every 30 minutes)

```typescript
// jobs/badge-engine.ts
import cron from 'node-cron';
import { evaluateAndAwardBadges } from '../services/badge.service';

cron.schedule('*/30 * * * *', async () => {
  const activeStudents = await getStudentsActiveToday();
  for (const studentId of activeStudents) {
    const newBadges = await evaluateAndAwardBadges(studentId);
    if (newBadges.length > 0) {
      // Push notification via Supabase Realtime
      await supabase.channel(`student-${studentId}`)
        .send({ type: 'broadcast', event: 'new_badge', payload: { badges: newBadges } });
    }
  }
});
```

### 6.4 Weekly Parent Report (Node.js cron — every Sunday 8am IST)

```typescript
// jobs/weekly-report.ts
cron.schedule('30 2 * * 0', async () => { // 02:30 UTC = 08:00 IST Sunday
  const parents = await getAllActiveParents();

  for (const parent of parents) {
    const report = await buildWeeklySummary(parent.child_id);
    const pdfUrl = await generateReportPDF(report);

    // Send WhatsApp notification
    await sendWhatsAppMessage(parent.phone, {
      template: 'weekly_report',
      params: { child_name: report.child_name, pdf_url: pdfUrl }
    });
  }
});
```

---

## 7. Middleware

```
src/middleware/
  auth.ts           → JWT validation + req.user injection
  role.ts           → requireRole('teacher') helper
  schoolScope.ts    → Inject school_id into all DB queries
  rateLimiter.ts    → Per-route rate limits (AI routes especially)
  validate.ts       → Zod schema validation for request bodies
  logger.ts         → Request logging (method, path, duration, user_id)
  errorHandler.ts   → Catch-all error formatter
```

### Rate Limiter Config

```typescript
// middleware/rateLimiter.ts — uses Upstash Redis

const limits = {
  'POST /api/chat/message':         { requests: 50,  window: '1d' },  // 50 AI chats/day/student
  'POST /api/ai/study-plan':        { requests: 3,   window: '1d' },  // 3 plan generations/day
  'POST /api/ai/career-path':       { requests: 5,   window: '1d' },
  'POST /api/english/submit':       { requests: 100, window: '1d' },  // 100 word attempts/day
  'POST /api/auth/login':           { requests: 10,  window: '1h' },  // brute-force protection
  'POST /api/auth/register':        { requests: 5,   window: '1h' },
  'POST /api/proctor/event':        { requests: 500, window: '1h' },  // high volume during exam
};
```

---

## 8. Environment Variables

```env
# ─── Supabase ─────────────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...                    # frontend-safe
SUPABASE_SERVICE_KEY=eyJ...                 # server-only, never expose

# ─── AI Services ──────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...               # Claude (chat, scoring, vision)
OPENAI_API_KEY=sk-...                       # Whisper (transcription) + Embeddings

# ─── Redis (Rate limiting + caching) ──────────────────
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# ─── Notifications ────────────────────────────────────
WATI_API_KEY=...                            # WhatsApp Business API
WATI_API_URL=https://live-server.wati.io
RESEND_API_KEY=re_...                       # Transactional email

# ─── Code Execution (Batch 4 CS) ──────────────────────
JUDGE0_API_URL=https://judge0.your-domain.com
JUDGE0_API_KEY=...

# ─── App ──────────────────────────────────────────────
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://eduai.yourdomain.com
JWT_SECRET=...                              # For any server-side token signing
```

---

## 9. Folder Structure — Node.js API

```
api/
├── src/
│   ├── index.ts                    # Express app entry, middleware registration
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── student.routes.ts
│   │   ├── teacher.routes.ts
│   │   ├── parent.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── ai.routes.ts
│   │   ├── proctor.routes.ts
│   │   ├── english.routes.ts
│   │   └── admin.routes.ts
│   ├── controllers/                # Thin: parse req → call service → format res
│   │   ├── auth.controller.ts
│   │   ├── student.controller.ts
│   │   ├── teacher.controller.ts
│   │   ├── parent.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── ai.controller.ts
│   │   ├── proctor.controller.ts
│   │   └── english.controller.ts
│   ├── services/                   # All business logic lives here
│   │   ├── auth.service.ts
│   │   ├── student.service.ts
│   │   ├── teacher.service.ts
│   │   ├── exam.service.ts
│   │   ├── chat.service.ts
│   │   ├── ai-score.service.ts
│   │   ├── english.service.ts
│   │   ├── proctor.service.ts
│   │   ├── badge.service.ts
│   │   ├── leaderboard.service.ts
│   │   ├── notification.service.ts
│   │   ├── report.service.ts
│   │   └── storage.service.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimiter.ts
│   │   ├── validate.ts
│   │   ├── errorHandler.ts
│   │   └── logger.ts
│   ├── jobs/                       # Background cron workers
│   │   ├── badge-engine.ts
│   │   ├── weekly-report.ts
│   │   └── leaderboard.ts
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client (service role)
│   │   ├── anthropic.ts            # Claude client
│   │   ├── openai.ts               # OpenAI client (Whisper + Embeddings)
│   │   ├── redis.ts                # Upstash Redis client
│   │   └── wati.ts                 # WhatsApp client
│   ├── schemas/                    # Zod validation schemas for all request bodies
│   │   ├── auth.schema.ts
│   │   ├── exam.schema.ts
│   │   ├── chat.schema.ts
│   │   └── ...
│   └── types/
│       └── index.ts                # Shared TypeScript interfaces
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## 10. Error Handling Standard

All API errors follow this shape:

```typescript
// All errors return this JSON structure
{
  "error": {
    "code":    "STUDENT_NOT_FOUND",        // machine-readable
    "message": "Student not found",        // human-readable
    "status":  404                         // HTTP status (also in response header)
  }
}
```

**Standard error codes:**

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | No token or invalid token |
| `FORBIDDEN` | 403 | Valid token but wrong role |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `SCHOOL_INVALID` | 400 | School code not found |
| `VALIDATION_ERROR` | 422 | Request body fails Zod schema |
| `AI_RATE_LIMIT` | 429 | Student exceeded AI daily quota |
| `EXAM_CLOSED` | 400 | Tried to submit after exam ended |
| `EXAM_ALREADY_SUBMITTED` | 400 | Duplicate submission attempt |
| `AUDIO_TOO_SHORT` | 400 | English assessment audio < 0.5 sec |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 11. Rate Limiting Plan

```
AI routes (expensive):
  /api/chat/message         → 50 req/student/day   (Upstash Redis sliding window)
  /api/ai/study-plan        → 3 req/student/day
  /api/ai/career-path       → 5 req/student/day
  /api/english/submit       → 100 req/student/day

Auth routes (brute-force protection):
  /api/auth/login           → 10 req/IP/hour
  /api/auth/register        → 5 req/IP/hour
  /api/auth/forgot-password → 3 req/email/hour

General API:
  All other routes          → 300 req/student/hour (generous, not AI cost)

Teacher routes:
  /api/teacher/**           → 600 req/teacher/hour

Response caching (Upstash, 1-hour TTL):
  Leaderboard               → Cache per school+batch+period
  Subject progress          → Cache per student (invalidate on update)
  PYQ list                  → Cache per class+subject (static content)
```

---

## 12. Deployment

### Services to Deploy

| Service | Platform | Cost/mo |
|---------|---------|---------|
| Node.js API | Railway (Hobby) | $5 |
| Supabase | Supabase Pro | $25 |
| Redis | Upstash (Pay-per-use) | ~$2–10 |
| Frontend | Vercel (Free) | $0 |
| Python Ingestion Script | Run once locally | $0 |

**Total infrastructure: ~$32–40/month at launch.**

### Railway Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```yaml
# railway.toml
[build]
  builder = "dockerfile"

[deploy]
  healthcheckPath = "/health"
  healthcheckTimeout = 10
  restartPolicyType = "on-failure"
```

### Health Check Endpoint

```typescript
// Always expose this — Railway uses it to confirm app is running
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    version: process.env.npm_package_version,
    uptime:  process.uptime()
  });
});
```

### CI/CD — GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy API
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: eduai-api
```

---

*Cross-reference:*
- *`RAG_CHATBOT_ARCHITECTURE.md` — detailed RAG pipeline, pgvector functions, ingestion script*
- *`NEW_FEATURES_PLAN.md` — AI Proctoring, AI Scoring, Avatar English Assessment implementation*
- *`UI_FEATURES.md` — complete frontend feature list (63 pages, 8 sections)*
