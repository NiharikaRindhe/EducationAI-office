# EduAI — Revised MVP Specification (v2)

> **Decision date:** July 02, 2026
> **Scope:** School computer lab only · Classes 1–10 · English-only platform · No language subjects (Hindi/Sanskrit excluded)
> **Batches:** Batch 1 (Class 1–4) · Batch 2 (Class 5–8) · Batch 3 (Class 9–10)
> **Portals:** Super Admin · School Admin · Teacher · Student
> **Stack policy:** 100% open-source, deployable locally (per-school server) · LLM + vision inference via **Ollama Cloud API** (hosted, open-weight models — Qwen/DeepSeek/Llama-class) · everything else (DB, auth, storage, exams, live sessions, embeddings, speech scoring) fully self-hosted and LAN-capable with zero internet dependency
> **Supersedes:** `MVP_PRODUCT_SCOPE.md` (Batch 4 sections), `FULL_BACKEND_SPEC.md` (parent + Batch 4 + cloud-service sections)

---

## Table of Contents

1. [What Changed in v2](#1-what-changed-in-v2)
2. [Class → Batch → Subject Mapping](#2-class--batch--subject-mapping)
3. [Login & Batch Routing (the "does he select his class?" answer)](#3-login--batch-routing)
4. [Batch-Wise Features & UI](#4-batch-wise-features--ui)
5. [Content Ownership Model](#5-content-ownership-model)
6. [The Four Portals](#6-the-four-portals)
7. [Backend Changes (from FULL_BACKEND_SPEC.md)](#7-backend-changes)
8. [Open-Source Local Tech Stack](#8-open-source-local-tech-stack)
9. [External Modules (Junior's Deliverables)](#9-external-modules)
10. [Content Preparation Checklist (Before Pilot)](#10-content-preparation-checklist)
11. [Team & Roles](#11-team--roles)
12. [Compliance & Safety](#12-compliance--safety)
13. [Revised Sprint Plan](#13-revised-sprint-plan)

---

## 1. What Changed in v2

| # | Decision | Consequence |
|---|----------|-------------|
| 1 | **Classes 1–10 only** — no Class 11–12 | Batch 4 removed entirely: JEE/NEET hub, study planner, career AI, weightage, rank predictor, stream onboarding — all deleted, not deferred |
| 2 | **English-only platform** | No i18n layer in MVP; all UI copy, content, AI responses in English; NCERT ingestion = English-medium books only |
| 3 | **No language subjects** | Hindi and Sanskrit excluded from subjects, question bank, RAG ingestion, tasks, exams, and progress tracking |
| 4 | **No parent portal / no parent role** | `parent_profiles`, `parent_messages`, WhatsApp (WATI), email (Resend), weekly-report job — all removed |
| 5 | **No self-registration** | Accounts created only by School Admin (CSV import or add-single). Public register route deleted |
| 6 | **Fully open-source + local** | Cloud services (Railway, Upstash, OpenAI, hosted Supabase) replaced with self-hosted equivalents; AI provider becomes a config switch |
| 7 | **Games + Virtual Labs are external modules** | Built by junior developer; integrated via a single events API (see §9) |

---

## 2. Class → Batch → Subject Mapping

Language subjects (Hindi, Sanskrit) are **excluded everywhere** — they exist in the school timetable but not on the platform.

| Class | Batch | English | Mathematics | World Around Us | Science | Social Science | Arts | Physical Education |
|-------|-------|:-------:|:-----------:|:---------------:|:-------:|:--------------:|:----:|:------------------:|
| 1 | 1 | ✅ | ✅ | — | — | — | — | — |
| 2 | 1 | ✅ | ✅ | — | — | — | — | — |
| 3 | 1 | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| 4 | 1 | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| 5 | 2 | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| 6 | 2 | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| 7 | 2 | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| 8 | 2 | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| 9 | 3 | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| 10 | 3 | ✅ | ✅ | — | ✅ | ✅ | — | ✅ |

This mapping is enforced in the database (see §7, `class_subjects` table). Any task, exam, quiz, chat scope, or progress entry referencing a subject not whitelisted for that class is rejected at the API layer.

**Subject roles on the platform:**

- **English, Mathematics, World Around Us, Science, Social Science** → full academic pipeline (content, quizzes, exams, AI chat, PYQs where applicable)
- **Arts, Physical Education** → activity/task tracking only in MVP (teacher assigns activity tasks, awards XP). No exams, no AI chat scope, no question bank. Keep the door open for Year 2 content.

---

## 3. Login & Batch Routing

**The rule: the student never selects his class, section, or batch. Ever.**

There is **one common login page** for the whole platform. The class lives on the student's account (set during the School Admin's CSV import). On successful login the backend reads `class_num`, derives `batch_id`, and auto-routes:

```
class_num 1–4   →  batch_id 1  →  redirect /batch1/home
class_num 5–8   →  batch_id 2  →  redirect /batch2/home
class_num 9–10  →  batch_id 3  →  redirect /batch3/home
```

So when a Class 3 student logs in:

1. He lands on the shared login page.
2. Auth succeeds → server sees `class_num = 3` → `batch_id = 1`.
3. He is routed to the **Batch 1 UI** — one shared UI shell for all of Class 1–4.
4. **Inside** that shell, every piece of content is filtered by *his* class: Class 3 stories, Class 3 quizzes, Class 3 word/sentence items. A Class 1 student sees the same screens but Class 1 content.

> **One UI per batch, content scoped per class.** The batch defines the *experience* (layout, complexity, navigation); the class defines the *content*.

At year-end, the School Admin runs a bulk "Promote Academic Year" action → `class_num` increments → routing and content update automatically. A student crossing a batch boundary (Class 4 → 5, Class 8 → 9) simply lands in the next batch UI on his first login of the new year.

### Batch 1 login exception (kids can't type)

Class 1–4 students cannot reliably type `usernames` + random passwords. Batch 1 uses **name-pick + PIN login**:

1. Teacher starts the lab session for a class/section.
2. Each machine shows the class list (names + avatars).
3. Student taps his own name.
4. Student enters a **4-digit PIN** (or picture-sequence for Class 1–2).

School Admin prints PIN cards instead of password cards for Batch 1. The PIN endpoint is heavily rate-limited and only active while a live session for that class exists.

Batch 2 and 3 use standard username + password from printed credential cards.

---

## 4. Batch-Wise Features & UI

### 4.1 Batch 1 — Class 1–4 (ages 6–10)

Teacher is physically present and drives navigation for the youngest students. The UI must work for a 6-year-old anyway.

**Features (deliberately few):**

| Feature | Notes |
|---------|-------|
| **Avatar speak & repeat** | Class 1–2: single **words** · Class 3–4: **short sentences**. Avatar says it, child repeats into mic, local speech-to-text scores accuracy, stars awarded. Content pulled from the EduAI-hardcoded word/sentence bank per class |
| **Games** | Junior's module. Subject-tagged mini games. **Teacher unlocks per session** — games are off by default so lab time stays focused |
| **Story reader + picture quiz** | Teacher assigns the story; audio narration button on every page; quiz answers are tap-only |
| **Star-based mini quizzes** | Launched by teacher in live session; tap/drag question types only (match, sort, drag-to-bucket, pick-the-picture) — never typing |
| **Show & Tell (vision AI)** | Child photographs an object → AI identifies it + fun facts. The demo feature — lead sales demos with it |
| **Badges & XP** | Same engine as other batches, bigger and shinier visuals |
| **Simple progress bars** | Per subject, no numbers-heavy stats |

**UI rules:**

- Home screen = **max 5–6 large cards** (Stories · Games · Quizzes · Badges · Show & Tell). No scrolling on home.
- Font ≥ 20px, buttons ≥ 64px tall, high contrast, rounded and playful.
- **Every label has a speaker icon** — tap to hear it read aloud (pre-generated audio files, works fully offline).
- Instant sound + animation feedback on every tap.
- Navigation is flat (one level deep) with a big always-visible Home button.
- A mascot avatar appears on every screen.

**Explicitly NOT in Batch 1:** AI text chat, notes, PYQs, leaderboard, streak calendar, typed passwords, dense tables, free-text input of any kind (except the PIN).

### 4.2 Batch 2 — Class 5–8 (ages 10–14)

**Features:**

| Feature | Notes |
|---------|-------|
| **AI Chat (RAG)** | Doubt solver grounded in English-medium NCERT for the student's class + whitelisted subjects. **Returns textbook diagrams inline** when the referenced concept has an image in the book (dual retrieval: text chunks + book images, with chapter/page citation). Teacher can enable/disable per session; all transcripts visible to teacher |
| **Tasks** | Teacher-assigned from EduAI templates (Reading / Practice / PYQ / Custom). Status cycle: not started → in progress → in review → completed. XP on completion |
| **Quizzes** | Live-session quizzes (teacher launches, real-time % answered / % correct on teacher board) + assigned practice quizzes |
| **Exams** | MCQ + True/False (auto-graded) and Short/Long Answer (**AI-scored against teacher's rubric, teacher rechecks** — see §5). Question randomization + option shuffle |
| **Streaks** | Simple current-streak counter in the topbar (login-based). No calendar |
| **Leaderboard** | Class-scoped. Two boards: **XP** and **exam average** — teacher/school admin chooses which is displayed. School admin can disable entirely |
| **Notes** | Student's own in-lab notes, filterable by subject |
| **Badges & XP** | Full gamification |

**UI rules:** dashboard-first (today's tasks, subject progress cards, streak counter, leaderboard preview, announcements strip). Sidebar: Home · Subjects · AI Chat · Exams · Notes · Leaderboard · Badges · Profile. Font 14–16px, light gamification, subject-colored cards, simple English microcopy.

### 4.3 Batch 3 — Class 9–10 (ages 14–16)

**Features:**

| Feature | Notes |
|---------|-------|
| **AI Chat (RAG)** | Same engine as Batch 2 plus LaTeX rendering for math/science |
| **Tasks** | Same template system |
| **Proctored exams** | Syllabus-based. Proctoring = **question randomization + option shuffle + tab-switch detection + fullscreen enforcement**. No webcam (teacher is physically present). Auto-submit after N tab switches (teacher-configurable) |
| **PYQs** | Official board-pattern past papers, **fed from backend by EduAI** (Super Admin content portal). Filterable by year + subject. Teachers assign PYQ sets as tasks |
| **Virtual Labs** | Junior's module: Physics + Chemistry interactive labs. Completion logged as activity + XP |
| **Board-prep hub** | Important topics, answer-writing tips, board-tagged chapters, board countdown on the Class 10 dashboard |
| **Concept maps** | Visual maps for board chapters |
| **Streaks + Leaderboard** | Same as Batch 2 |
| **Notes** | Same as Batch 2 |

**UI rules:** more mature palette (deep blue/teal), denser information allowed, minimal cartoons, serious-but-motivating tone. Sidebar: Home · Subjects · Board Prep · AI Chat · Virtual Labs · PYQ · Exams · Concept Maps · Notes · Leaderboard · Profile.

---

## 5. Content Ownership Model

Who creates what — the single most important operational table in this document.

| Content | Hardcoded by EduAI | Template (we provide, teacher fills) | Teacher creates | **"Generate with AI"** | Final approval |
|---------|:--:|:--:|:--:|:--:|----|
| **NCERT content / RAG data** | ✅ ingestion pipeline | — | — | — | EduAI content team |
| **PYQ papers (Class 9–10)** | ✅ **only** — must be authentic board papers | — | ✗ (assign only) | ✗ **never** | EduAI content QA |
| **Question bank (MCQ/TF/subjective, tagged by class · subject · chapter · difficulty)** | ✅ base bank | — | teacher can contribute to own school's bank | — | EduAI (global) / teacher (school) |
| **Exam questions** | pick from bank | exam shell presets (duration, marks scheme) | ✅ exam builder | ✅ **"Generate N questions from Chapter X"** → RAG-drafted → editable preview | **Teacher must review before publish — mandatory step, no auto-publish** |
| **Quizzes** | ready-made chapter quizzes | one-click: pick chapter → auto-pull 10 Qs | ✅ hand-pick | ✅ quick-generate for live session | Teacher previews before launch |
| **Tasks** | — | ✅ Reading / Practice / PYQ / Custom templates with default instructions + XP | ✅ custom | (Phase 1.5: AI suggests from weak areas) | Teacher |
| **Subjective rubrics** | sample rubrics for 2/3/5-mark patterns | rubric template (key-points fields) | ✅ | ✅ AI drafts question + rubric together | Teacher |
| **Subjective answer scoring** | AI scoring engine (system) | — | teacher can score fully manually | automatic on submit: score + covered points + missing points + feedback | **Teacher always sees the AI score and can override (`final_score`). Results publish only after every subjective answer is reviewed** |
| **Avatar word/sentence bank (Batch 1)** | ✅ | — | ✗ | ✗ | EduAI |
| **Stories (Batch 1)** | ✅ story bank | — | ✗ (assign only) | Year 2: AI story generator with human review | EduAI |
| **Badges** | ✅ criteria definitions | — | ✗ | ✗ | EduAI |
| **Games / Virtual Labs** | ✅ built-in (junior) | — | unlock/assign only | ✗ | EduAI |
| **Announcements** | — | simple template | ✅ teacher/school admin | ✗ | — |

**Rules of thumb:**

1. **Hardcode anything that must be authoritative** — NCERT content, PYQs, question bank, word/story banks, badges, games, labs.
2. **Template anything repetitive** — task types, exam shells, rubric formats.
3. **Teacher creates anything class-specific** — exams, assignments, announcements.
4. **"Generate with AI" lives in exactly two places** — the exam builder and the quiz builder — and always ends in a mandatory teacher preview/edit step before anything reaches a student.
5. **AI never has the final word on a grade.** AI produces a suggested score + report; the teacher's `final_score` is what publishes. Every override is written to the audit log.

---

## 6. The Four Portals

### 6.1 Super Admin (EduAI company)

- School management: create/activate/deactivate schools, plan tiers
- **Content portal:** NCERT PDF ingestion, PYQ paper upload, global question bank manager, Batch 1 word/sentence/story banks, badge definitions
- Platform analytics: active schools/students/teachers, feature usage, AI usage per school, churn-risk flags
- Billing: subscription status, student-count vs billed-count, invoices
- Platform-wide announcements

### 6.2 School Admin (1–2 per school)

- **First-time setup wizard:** student CSV → auto accounts · teacher CSV → auto accounts · sections per class · **credential sheet download** (password cards for Batch 2–3, PIN cards for Batch 1)
- User management: search/add/deactivate students & teachers, password/PIN resets, promote-academic-year bulk action
- **Feature toggles per class:** AI Chat on/off, Games on/off, Leaderboard on/off (and leaderboard basis: XP vs exam average)
- Login activity: who has never logged in (follow-up list)
- School-wide reports + PDF export

### 6.3 Teacher

- **Live session mode:** start session → students join → display content / launch quiz → real-time answered-% and correct-% → discuss → end session (logged)
- Task assignment (template-based; class / section / individual)
- **Exam builder:** all question types, rubric editor, bank picker, **Generate-with-AI button**, randomization/shuffle toggles, publish → admit cards
- **Grading queue:** subjective answers with AI score + covered/missed report side-by-side; accept or override; publish results → merit list
- Student list + drill-down + at-risk panel (low scores or 3+ days inactive)
- Reports: class heatmap, subject trends, exam item analysis, PDF export
- Announcements to a class
- "Raise hand" indicator during live sessions (student flags a doubt; teacher sees who's stuck)

### 6.4 Student

Three batch UIs behind one login (see §3 and §4). No settings beyond avatar + profile basics.

**New role added: Lab In-charge** (limited account per school): reset student PINs/passwords, view login activity, start/close lab availability. **No access** to grades, exams, or reports. This is the person your support team will talk to weekly — give them a home.

---

## 7. Backend Changes

Changes required against `FULL_BACKEND_SPEC.md`, in priority order.

### P0 — before anything else

1. **Remove Batch 4.** Drop `study_plans`, `study_tasks`. Remove `stream`, `target_year`, `prep_level`, `onboarded` from `student_profiles`. Delete `/api/ai/study-plan`, `/api/ai/career-path`, `/api/student/study-plan/*`, all `/batch4/*` routing. Drop `stream` from `text_chunks` and `book_images`.
2. **Class range 1–10.** All `CHECK (class_num BETWEEN 1 AND 12)` → `BETWEEN 1 AND 10`. `batch_id` generated column drops the 11–12 branch.
3. **Remove parent role.** Drop `parent_profiles`, `parent_messages`; remove `'parent'` from role CHECK; delete `/api/parent/**`, the weekly-report job, and the WATI + Resend integrations.
4. **Subject whitelist.**

```sql
CREATE TABLE class_subjects (
  class_num  INT  NOT NULL CHECK (class_num BETWEEN 1 AND 10),
  subject    TEXT NOT NULL,
  has_exams  BOOLEAN DEFAULT true,   -- false for Arts, Physical Education
  PRIMARY KEY (class_num, subject)
);
-- Seed exactly from the matrix in §2 (no Hindi, no Sanskrit).
```

Validate every task, exam, quiz, chat scope, and progress row against it at the API layer.

5. **Remove self-registration.** Delete `/api/auth/verify-school` + public `/api/auth/register`. Accounts come only from School Admin import / add-single.
6. **Fix `exams.total_marks`.** `GENERATED ALWAYS AS (0) STORED` is a placeholder that will ship as a bug. Replace with a trigger that recomputes `SUM(questions.marks)` on question insert/update/delete, or expose it via a view.
7. **RLS gaps.** `tasks`, `questions`, `exam_assignments` have RLS **enabled but no policies** — they will silently block all access. Write policies for each. The `'admin'` role has zero policies; split it into `school_admin` and add its policy set.
8. **Exam auto-save.** New endpoint `PUT /api/student/exam/:id/answer` — per-question upsert, debounced client-side. On reconnect/crash, the paper resumes from saved `exam_answers`. A lab PC will crash mid-exam; this is not optional.
9. **Question bank table.** The spec ties `questions` to `exam_id` only. Add:

```sql
CREATE TABLE question_bank (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope       TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global','school')),
  school_id   UUID REFERENCES schools(id),      -- NULL when scope = 'global'
  class_num   INT  NOT NULL CHECK (class_num BETWEEN 1 AND 10),
  subject     TEXT NOT NULL,
  chapter_num INT,
  type        TEXT NOT NULL CHECK (type IN ('mcq','true_false','short_answer','long_answer','fill_blank')),
  difficulty  TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  text        TEXT NOT NULL,
  options     JSONB,
  correct_answer TEXT,
  rubric      TEXT,
  marks       INT DEFAULT 1,
  source      TEXT DEFAULT 'eduai' CHECK (source IN ('eduai','teacher','ai_generated')),
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

Exam/quiz builders copy from the bank into `questions` at publish time (so later bank edits don't mutate past exams).

10. **Live-session tables.** `live_sessions`, `session_participants`, `announcements` (defined in the MVP scope doc) are missing from the backend spec — add them.
11. **Audit log.**

```sql
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  UUID,
  actor_id   UUID NOT NULL,
  action     TEXT NOT NULL,        -- 'score_override' | 'password_reset' | 'result_publish' | ...
  entity     TEXT NOT NULL,
  entity_id  UUID,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

12. **English-only RAG.** Ingest English-medium NCERT only; ingestion pipeline rejects Hindi/Sanskrit titles; chat scope validated against `class_subjects`.
13. **Image-in-chat-response.** Keep the dual-retrieval design (`search_text_chunks` + `search_book_images`); the chat pipeline must always run both and return `returned_images` with chapter/page references so the frontend renders diagrams inline.

### P1

14. **Batch 1 PIN login.** `ALTER TABLE student_profiles ADD COLUMN pin_hash TEXT;` + `POST /api/auth/pin-login` `(school, class_num, section, student_id, pin)` — active only during a live session for that class, aggressively rate-limited.
15. **Simplify proctoring.** Drop `camera_required`, `gaze_tracking`, `gaze_sensitivity_sec` from `proctoring_settings`; restrict `proctoring_events.event_type` to `('tab_switch','fullscreen_exit')`.
16. **Remove unused question types.** Drop `audio_answer`, `coding`, `reading_comp` from the `questions.type` CHECK; remove Judge0 entirely.
17. **Teacher RLS scope.** `teacher_sees_school_students` currently exposes every student in the school; restrict drill-down to `classes_taught` overlap (school-wide visibility stays with School Admin).
18. **Leaderboard basis.** Add `score_basis TEXT CHECK (score_basis IN ('xp','exam_avg'))` and an `exam_avg` column to `leaderboard_snapshots`; School Admin/teacher picks which board displays.
19. **Roles.** `role CHECK (role IN ('student','teacher','school_admin','lab_incharge','super_admin'))`.

### P2

20. **Badge engine → event-driven.** Fire `evaluateAndAwardBadges(studentId)` right after each XP update instead of a 30-minute cron. Cheaper, and the confetti is instant.
21. **Trim cron.** Keep streak reset (daily) + leaderboard recompute (hourly). Delete the weekly parent report job.

---

## 8. Open-Source Local Tech Stack

Every cloud dependency in the original spec, replaced. LLM/vision inference is the one layer that stays cloud — via **Ollama Cloud API**, not a self-managed GPU box — because per-school GPU hardware is expensive, hard to support remotely, and a single point of failure the support team can't fix over a phone call.

| Original (cloud) | Replacement |
|------------------|-------------|
| Supabase hosted Pro | **Self-hosted Supabase** (Docker Compose: Postgres + GoTrue Auth + PostgREST + Realtime + Storage + Studio) — school server |
| Railway (Node API) | Node API container, same Docker Compose — school server |
| Upstash Redis | **Self-hosted Redis** container (rate limiting + caching) — school server |
| Vercel (frontend) | Static build served by **Nginx** container — school server |
| Claude API (chat, subjective scoring) | **Ollama Cloud API** — hosted inference on open-weight models (Qwen/DeepSeek/Llama-class). Same client + same OpenAI-compatible endpoint shape as self-hosted Ollama, so switching between Ollama Cloud and a future self-hosted or Claude/OpenAI fallback is a config change (base URL + API key), never a rewrite |
| OpenAI Embeddings (1536-dim) | **nomic-embed-text**, run **locally on the school server via a lightweight local Ollama instance (CPU only)** → all `vector(1536)` columns become `vector(768)`. Kept local deliberately: embeddings are needed for every chat turn's retrieval step, so they must not depend on internet reachability or incur per-call cost |
| OpenAI Whisper (hosted) | **faster-whisper**, local CPU, for Batch 1 avatar speech scoring — short clips, `base`/`small` model is enough, no GPU needed |
| Vision (Show & Tell + NCERT diagram captioning) | **Ollama Cloud API** vision model — both the real-time Show & Tell calls and the one-time bulk diagram-captioning during ingestion go through the cloud API; local vision models are too weak for this to be worth self-hosting |
| WATI (WhatsApp), Resend (email) | **Removed** (no parent notifications in MVP) |
| Judge0 | **Removed** (no coding questions) |

### Deployment model

One **school server** per lab, wired LAN to student machines:

- **Hardware:** mini PC / desktop — i5/i7, 16–32 GB RAM, NVMe SSD. **No GPU required** — the only on-box model work is CPU-bound (embeddings, speech scoring); the LLM/vision layer is a network call to Ollama Cloud. This removes the single largest hardware line item (~₹80,000–1,25,000 / $1,000–1,500) from the per-school cost.
- **Software:** single `docker-compose.yml` bringing up Supabase stack + Node API + Redis + Nginx + a small local Ollama instance serving *only* the embedding and speech models — the big chat/vision models never run on-prem.
- **Networking — two tiers, be explicit about which is which:**
  - **Fully offline-capable (school LAN only):** login, live sessions, tasks, quizzes, exams (incl. RAG *retrieval* against the local vector DB), gamification, reports. Internet outage never blocks a class.
  - **Requires internet:** AI chat *answers*, AI subjective scoring, Show & Tell / vision captioning — anything that calls Ollama Cloud. Design the graceful-degradation path now: chat shows "AI tutor is temporarily unavailable — try again shortly" instead of erroring the whole page; subjective-scoring jobs queue and retry on reconnect rather than blocking exam submission or result publishing.
- **Cost control:** Ollama Cloud is usage-based, not a fixed capex line — keep the existing daily-message-quota rate limiter (per student) so a single school's AI usage can't run away on cost.
- **Sync:** a background job pushes analytics/billing/health data to EduAI's central server whenever internet is available; central dashboard shows per-school health, last backup, last sync, disk space.
- **Backups:** nightly `pg_dump` + local retention + copy to central when online. **Test the restore procedure** before the first pilot — a school will lose a disk.

Self-hosting Supabase means backups, upgrades, and monitoring are fully your responsibility — script them from day one; nothing is managed for you. Ollama Cloud is the one exception: inference availability, model versioning, and uptime are Ollama's responsibility, not yours — but that also means an EduAI-side outage on their end degrades AI features platform-wide, so the fallback UX above is not optional polish.

---

## 9. External Modules

Two modules are being built separately (junior developer). Integration contract:

| Module | Batch | Mount point | Integration requirements |
|--------|-------|-------------|--------------------------|
| **Games** | 1 | `/batch1/games` | Locked by default; teacher unlocks per live session (read `live_sessions` + a `games_enabled` flag). Each game completion must call **one** platform endpoint |
| **Virtual Labs (Physics + Chemistry)** | 3 | `/batch3/labs` | Lab completion logged as activity; optional per-lab quiz can pull from question bank |

**The single events API both modules must use:**

```
POST /api/activity/event
Body: {
  student_id,          -- from the session token, not the module
  module: 'game' | 'virtual_lab',
  item_id,             -- which game / which lab
  result: { score?, completed: boolean, duration_sec },
  xp_suggested         -- capped server-side per module per day
}
→ Server validates, awards XP (capped), triggers badge evaluation, logs activity.
```

Rules for the junior: modules **never** write XP or badges directly, never touch the database, authenticate with the student's existing session token, and must run on low-spec lab PCs (test at 4 GB RAM, 1366×768, keyboard+mouse only).

---

## 10. Content Preparation Checklist

Software without content demos empty. Prepare in parallel with development:

- [ ] **NCERT ingestion:** English-medium PDFs, Classes 1–10, whitelisted subjects only → text chunks + diagram extraction + embeddings
- [ ] **Question bank:** minimum ~50 tagged questions per chapter for English, Maths, Science, Social Science, World Around Us (Classes 5–10 priority) — mix of MCQ/TF/short/long with rubrics
- [ ] **PYQ papers:** CBSE Class 10 (and Class 9 school-pattern) — last 5–8 years, tagged by year + subject
- [ ] **Batch 1 banks:** word bank (Class 1–2), short-sentence bank (Class 3–4), story bank with picture quizzes, pre-generated audio narration files
- [ ] **Ready-made chapter quizzes:** one 10-question quiz per chapter so teachers can run a live session on day 1 with zero prep
- [ ] **Task templates:** Reading / Practice / PYQ / Custom with default instructions + XP values
- [ ] **Badge set:** seed definitions (streak, XP, tasks, exam score, English accuracy/fluency)
- [ ] **Sample rubrics:** 2-mark, 3-mark, 5-mark answer patterns per subject

---

## 11. Team & Roles

| Level | Role | Count | Responsibilities |
|-------|------|-------|------------------|
| EduAI | Owner | 1 | School creation, plans, billing |
| EduAI | Content Manager | 1 | NCERT/PYQ ingestion, question bank, Batch 1 banks, badge definitions |
| EduAI | Support Agent | 1 (can overlap) | Read-only access + password/PIN resets; school WhatsApp support line |
| School | School Admin | 1–2 | Setup, users, credentials, feature toggles, reports |
| School | Lab In-charge | 1 | PIN/password resets, login activity, lab availability — **no grade access** |
| School | Teachers | per subject | Live sessions, tasks, exams, grading |

One person can hold multiple EduAI roles in the software at pilot scale; keep the roles separate in the permission model anyway.

---

## 12. Compliance & Safety

- **DPDP Act:** the school collects parental consent at admission; your school agreement includes a data-processing addendum. Provide per-student data export and deletion. All audit-logged.
- **AI chat with minors:** English-only, curriculum-scoped system prompt; refusal behavior for off-topic/unsafe requests; **all transcripts visible to the teacher and School Admin**; per-session teacher kill switch (already in feature toggles); daily message quota per student (rate limiter).
- **Ollama Cloud data flow:** chat messages, uploaded images (Show & Tell), and subjective-answer text are sent off the school LAN to Ollama Cloud for inference. Confirm Ollama Cloud's data retention and no-training-on-inputs policy before pilot, and disclose this specific data flow in the school's data-processing addendum — everything else (student records, scores, PII) never leaves the school server.
- **Exam integrity:** randomization + shuffle + tab-switch/fullscreen detection + server-side timestamps + copy/paste disabled in exam mode + auto-save/resume. Teacher presence is the primary proctor.
- **No behavioral tracking, no ads, no third-party analytics** on student accounts.

---

## 13. Revised Sprint Plan

```
SPRINT 1 (Weeks 1–3) — Foundation + Security
  [ ] Docker Compose stack (self-hosted Supabase, Node API, Redis, Nginx)
  [ ] All migrations incl. class_subjects, question_bank, live_sessions, audit_logs
  [ ] COMPLETE RLS policy set (all tables, all roles) — moved up from Sprint 6
  [ ] Auth: admin-created accounts only, JWT custom claims, batch auto-routing
  [ ] Super Admin: create school, plans
  [ ] School Admin: CSV import, credential PDF (passwords) + PIN cards, promote-year action

SPRINT 2 (Weeks 4–6) — Core Classroom Flow
  [ ] Live session start/end + Realtime broadcast + student join
  [ ] Batch 1 name-pick + PIN login (session-gated)
  [ ] Real-time response dashboard + raise-hand
  [ ] Task templates + assignment + status cycling
  [ ] Ready-made chapter quizzes launchable in session

SPRINT 3 (Weeks 7–9) — Exams & Assessment
  [ ] Exam builder (bank picker + manual + Generate-with-AI preview flow)
  [ ] Publish + admit cards; randomized paper; tab-switch/fullscreen detection
  [ ] Per-question auto-save + crash resume
  [ ] Auto-grade MCQ/TF; AI subjective scoring + teacher grading queue + override + audit log
  [ ] Merit list + result publishing (gated on full review)

SPRINT 4 (Weeks 10–12) — AI Features (local stack)
  [ ] Ollama + Qwen 3 8B serving; nomic-embed re-embedding (768-dim)
  [ ] RAG chat with inline textbook images + citations (Batch 2–3)
  [ ] faster-whisper avatar assessment (Batch 1 words/sentences)
  [ ] Show & Tell vision pipeline
  [ ] Provider switch (local ↔ cloud) with per-school config

SPRINT 5 (Weeks 13–15) — Content, Modules & Reports
  [ ] Integrate junior's Games (Batch 1) + Virtual Labs (Batch 3) via events API
  [ ] Board-prep hub + concept maps + PYQ hub
  [ ] Gamification live: XP, badges (event-driven), leaderboard (XP + exam-avg basis)
  [ ] Teacher reports (heatmap, item analysis, PDF) + School Admin reports
  [ ] Super Admin analytics + central sync + health dashboard

SPRINT 6 (Weeks 16–17) — QA & Pilot
  [ ] E2E tests per portal; CSV-import → first-login flow test
  [ ] Load test: 30 concurrent students on real lab hardware over wired LAN
  [ ] Backup + RESTORE drill on the school-server image
  [ ] Security audit: RLS, school isolation, PIN rate limits, exam integrity
  [ ] Pilot with 1–2 schools (with onboarding kit: day-0 checklist, teacher training video, printed cards)
```

---

*Cross-references:*
- *`EduAI_Features_By_Class.xlsx` — feature × class matrix, UI guidelines, content ownership, backend change list*
- *`FULL_BACKEND_SPEC.md` — apply §7 changes on top of it*
- *`RAG_CHATBOT_ARCHITECTURE.md` — swap embedding model + provider switch per §8*
