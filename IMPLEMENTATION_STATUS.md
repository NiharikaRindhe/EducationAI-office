# EduAI — Implementation Status

> **Last updated:** July 7, 2026
> **Scope:** School computer lab MVP — Classes 1–10, English-medium, no parent portal
> **Status:** Backend fully built and tested. Frontend wired for auth + 2 new portals + a representative slice of Teacher/Student pages. Remaining pages still run on mock data (flagged below).

---

## Table of Contents

1. [What This Document Covers](#1-what-this-document-covers)
2. [Architecture Overview](#2-architecture-overview)
3. [Backend — Complete](#3-backend--complete)
4. [Frontend — Page by Page](#4-frontend--page-by-page)
5. [Roles & What Each Can Do](#5-roles--what-each-can-do)
6. [What's NOT Done Yet](#6-whats-not-done-yet)
7. [How to Run It Locally](#7-how-to-run-it-locally)

---

## 1. What This Document Covers

This is a snapshot of exactly what has been **built and tested** as of today — not the plan, the actual state. Two things are true at once:

- The **backend is fully built**: every table, every route, every service described below exists, runs, and was verified against a real database with real HTTP requests (not just typechecked).
- The **frontend is partially wired**: auth and two brand-new admin portals are fully real; a handful of Teacher/Student pages were rewired to prove the integration pattern works; the rest of the ~40 existing pages still render the original mock data from before this backend existed.

Every page below is marked **✅ Wired** (calls the real API) or **⚪ Mock** (still reads hardcoded/localStorage data from `AppContext`).

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND — React 19 + Vite + TypeScript + Tailwind          │
│  http://localhost:5173                                       │
└───────────────────────────┬────────────────────────────────────┘
                            │ fetch (Bearer JWT)
┌───────────────────────────▼────────────────────────────────────┐
│  NODE.JS API — Express + TypeScript                           │
│  http://localhost:4000                                        │
│  Routes: /api/auth  /api/super-admin  /api/school-admin       │
│          /api/teacher  /api/student                           │
└─────┬──────────────────────────────────────────┬───────────────┘
      │                                          │
┌─────▼────────────────────────┐   ┌─────────────▼─────────────────┐
│  SELF-HOSTED SUPABASE         │   │  OLLAMA (single local daemon) │
│  (Docker: Postgres+pgvector,  │   │  http://127.0.0.1:11434       │
│   GoTrue Auth, PostgREST,     │   │  - Embeddings: mxbai-embed-   │
│   Realtime, Storage, Studio)  │   │    large (local, CPU)         │
│  33 tables, full RLS          │   │  - Chat: gpt-oss:20b-cloud     │
└────────────────────────────────┘   │    (proxied to Ollama Cloud   │
                                    │    by the daemon's own auth)  │
                                    └────────────────────────────────┘
```

**Why this shape:** one Node API server handles all business logic (XP, grading, RAG retrieval) using the Supabase **service-role** key, so it can enforce rules RLS alone can't (e.g. "a student can't self-award XP"). Supabase's own Auth/RLS/Realtime are used directly where that's sufficient. Ollama is a single local daemon — the model name alone decides whether inference runs on-box or is proxied to Ollama Cloud; no separate cloud API key is used at the application layer.

---

## 3. Backend — Complete

### 3.1 Database — 33 tables, self-hosted Supabase (PostgreSQL + pgvector)

| Table | Purpose |
|-------|---------|
| `schools` | One row per school (code, name, plan, board, city/state) |
| `user_profiles` | Every login-capable account (student/teacher/school_admin/lab_incharge/super_admin) |
| `student_profiles` | Class, section, batch (auto-derived 1–4→Batch1, 5–8→Batch2, 9–10→Batch3), avatar, XP, streak, PIN hash (Batch 1) |
| `teacher_profiles` | Employee ID, specialization, `classes_taught[]` |
| `class_subjects` | Whitelist of which subjects exist per class (blocks e.g. Hindi/Sanskrit, or wrong-class subjects) |
| `class_sections` | First-class sections per school per academic year (Apr–Mar, e.g. '2026-27') — Class 1 can have A–D while Class 5 has A–C; holds the class teacher; auto-registered on student import |
| `teaching_assignments` | Teacher × section × subject — the source of truth for who teaches what; replaces `classes_taught[]` (kept as fallback for unmapped teachers) |
| `live_sessions` | Teacher-started classroom sessions (class + section + subject) |
| `session_participants` | Students who joined a session, incl. raise-hand flag |
| `announcements` | Teacher posts to a class/section |
| `tasks` / `task_assignments` | Teacher-assigned work; per-student status (not_started → in_progress → in_review → completed) |
| `question_bank` | Reusable questions (global EduAI-authored, or per-school teacher-contributed) |
| `exams` / `questions` | Teacher-built exams and their questions (copied from bank at add-time) |
| `exam_assignments` | Which students an exam is assigned to |
| `exam_submissions` | One per student attempt — randomization seed, timing, total/max score, review status |
| `exam_answers` | One per question per submission — auto-score, AI score, teacher final score, audit trail of overrides |
| `proctoring_settings` / `proctoring_events` | Randomization/shuffle config; tab-switch and fullscreen-exit events during an exam |
| `badges` / `student_badges` | Badge definitions and what each student has earned |
| `notes` | Student's own study notes |
| `subject_progress` | Chapter completion tracking per subject (schema exists, no curriculum content seeded yet) |
| `streak_logs` | One row per student per active day — drives the streak counter |
| `leaderboard_snapshots` | Precomputed rankings (XP basis and exam-average basis), recomputed hourly |
| `audit_logs` | Every score override, with who/what/when |
| `text_chunks` / `book_images` | RAG: NCERT content chunks + diagrams with `vector(1024)` embeddings |
| `chat_sessions` / `chat_messages` | AI doubt-solver conversations, with source citations and returned textbook images |
| `english_assessment_items` / `english_assessment_attempts` | Word/sentence practice content and student attempts |

**Security:** every table has Row Level Security policies (school isolation, role-based access, teachers scoped to `classes_taught` not the whole school). Base table `GRANT`s are separately configured (RLS restricts rows; grants restrict whether a role can touch the table at all — both are required). A `custom_access_token_hook` embeds `app_role` and `school_id` directly into every JWT so RLS checks don't need a table join per request.

**Guard triggers:** students cannot write their own `xp`, exam scores, or grading fields via a direct API/REST call, even bypassing the Node layer — enforced at the database level via triggers that silently keep those columns unchanged on any student-originated `UPDATE`.

---

### 3.2 Authentication

| Flow | How it works |
|------|--------------|
| **Password login** (Teacher, School Admin, Super Admin, any student) | `POST /api/auth/login` — real Supabase Auth (GoTrue) session, ES256-signed JWT |
| **PIN login** (Batch 1 students, Class 1–4) | `POST /api/auth/pin-login` — name-tap + 4-digit PIN, **only works while a teacher has an active live session** for that class/section. Under the hood: the student's password is rotated to a fresh random value and signed in normally — this produces a first-class, refreshable session rather than a hand-rolled token |
| **Roster fetch** | `GET /api/auth/pin-roster?schoolCode=&classNum=&section=` — returns student names/avatars for the PIN screen, empty unless a session is live |
| **Session check** | `GET /api/auth/me` — returns the current user's full profile; used to rehydrate login state on page refresh |

No public self-registration exists — every account is created by a School Admin (CSV import or single-add) or a Super Admin (school creation). Rate limits: 10 login attempts/min/IP, 8 PIN attempts/min/IP+student, 50 AI chat messages/day/student.

---

### 3.3 API Routes — by Portal

#### Super Admin (`/api/super-admin`, role: `super_admin`)
```
GET    /schools                 List all schools
POST   /schools                 Create a school (name, code, city, state, board, plan)
PATCH  /schools/:id/active      Activate / deactivate a school
```

#### School Admin (`/api/school-admin`, role: `school_admin`)
```
GET    /students                List all students in this school
POST   /students                Add one student (auto-generates PIN if Class ≤4, else password)
POST   /students/import         Bulk import, .csv or .xlsx (full_name, class_num, section, roll_number);
                                optional classNum+section form fields pin the whole file to one section
POST   /students/:id/reset-credentials   Regenerate PIN (Class ≤4) or password, returns the new credential
GET    /teachers                List all teachers
POST   /teachers                Add one teacher
POST   /teachers/import         Bulk import, .csv or .xlsx (full_name, employee_id, specialization, classes_taught)
POST   /teachers/:id/reset-password      Regenerate a teacher's password

GET    /class-sections          Sections for the current academic year, with class teacher + student counts
POST   /class-sections          Add a section to a class (e.g. Class 7 gets a "C")
PATCH  /class-sections/:id      Set/unset class teacher, activate/deactivate
GET    /subjects                The class_subjects whitelist (drives the assignment matrix UI)
GET    /teaching-assignments    All teacher×section×subject mappings for this school
POST   /teaching-assignments    Assign a teacher to teach a subject to a section (subject validated per class)
DELETE /teaching-assignments/:id

GET    /lab-incharges                     List lab in-charges at this school
POST   /lab-incharges                     Add one (single-add only — schools typically need just one or two)
POST   /lab-incharges/:id/reset-password  Regenerate a lab in-charge's password
```

#### Lab In-charge (`/api/lab-incharge`, role: `lab_incharge`)
```
GET    /students                          Read-only roster (same data School Admin sees)
POST   /students/:id/reset-credentials    Regenerate PIN (Class ≤4) or password
GET    /teachers                          Read-only roster
POST   /teachers/:id/reset-password       Regenerate a teacher's password
GET    /class-sections                    Sections + student counts, for roster lookup
GET    /sessions/active                   Every currently-live session school-wide, with teacher + class/section
```
No task/exam/grading/CSV-import/account-creation routes are wired to this role at all — "no grade access" is
enforced by which controllers this router exposes, not a separate permission flag.

#### Teacher (`/api/teacher`, role: `teacher`)
```
GET    /dashboard                              Stats scoped to the teacher's exact sections (teaching_assignments)
GET    /my-sections                            Sections this teacher teaches (+ subjects per section, class-teacher
                                               flag, and the subject whitelist per class) — powers every picker
GET    /students                               Student list, scoped to exact (class, section) pairs taught
GET    /students/:id                           Full drill-down (profile, subject progress, badges)
GET    /at-risk                                Students with no recent activity or low exam scores

POST   /sessions/start                         Start a live session (auto-ends any prior one for that class)
POST   /sessions/:id/end                       End a session
GET    /sessions/active                        This teacher's currently active session
GET    /sessions/:id/participants              Who's joined + raised hands

POST   /announcements                          Post to a class/section
DELETE /announcements/:id

POST   /tasks                                  Create + assign (to students / a class+section / multiple of the
                                               teacher's own sections via sectionIds / a whole batch)
GET    /tasks                                  List tasks this teacher created

POST   /question-bank                          Add a question to this school's bank
GET    /question-bank                          List (global + this school's own)

POST   /exams                                  Create an exam (draft)
GET    /exams  |  GET /exams/:id                List / get detail (detail includes per-section windows + counts)
POST   /exams/:id/questions                     Add a hand-written question
POST   /exams/:id/questions/from-bank           Copy questions from the bank
DELETE /exams/:examId/questions/:questionId
POST   /exams/:id/publish                       Assign + lock + randomization; sections mode gives each section
                                               its OWN open/close window (7-A Monday, 7-B Wednesday)
POST   /exams/:id/close
POST   /exams/:id/duplicate                     "Set B" — copies meta + questions into a fresh draft

GET    /exams/:examId/submissions               All submitted attempts
GET    /exams/:examId/submissions/:submissionId Full answer-by-answer detail
PUT    /exams/:examId/answers/:answerId/score   Finalize/override a subjective answer's score
GET    /exams/:examId/merit-list                Ranked results with pass/fail cutoff
GET    /exams/:examId/admit-cards               Download all admit cards as a ZIP of PDFs

POST   /leaderboard/recompute                   Manually trigger a recompute (also runs hourly automatically)
```

#### Student (`/api/student`, role: `student`)
```
GET    /sessions/active                         Is a class live right now for my section?
POST   /sessions/join
PATCH  /sessions/:id/raise-hand
GET    /announcements

GET    /tasks
PATCH  /tasks/:id/status                        Cycle status; awards XP exactly once, on completion

GET    /exams                                   All my assigned exams with computed state (upcoming/open/submitted/closed)
GET    /exams/:examId/paper                     Randomized paper, per-student seed, answers stripped; enforces the
                                               section window (EXAM_NOT_OPEN / EXAM_CLOSED outside it)
PUT    /exam-submissions/:submissionId/answer   Per-question autosave
POST   /exam-submissions/:submissionId/submit
POST   /proctor-event                           Log tab-switch/fullscreen-exit; auto-submits past threshold
GET    /exams/:examId/admit-card                Download own admit card PDF

POST   /notes  |  GET /notes  |  PUT /notes/:id  |  DELETE /notes/:id

GET    /leaderboard?basis=xp|exam_avg&period=weekly|monthly|all_time

GET    /subjects                                Class_subjects whitelist scoped to my own class (Chat/Notes pickers)

GET    /english/items?classNum=&type=
POST   /english/submit                          Transcript + optional duration → scored + XP awarded
GET    /english/progress

POST   /chat/sessions                           Start an AI doubt-solver session (validated against class_subjects)
GET    /chat/sessions
GET    /chat/sessions/:id/history
POST   /chat/sessions/:id/message               RAG: embed → retrieve NCERT chunks + diagrams → answer
```

---

### 3.4 Core Engines

**Gamification (`gamification.service.ts`)** — the single write path for `student_profiles.xp`. Every feature that awards XP (tasks, exams, English assessment) routes through `addXp()`, which always re-evaluates badges afterward. Streak logging is idempotent per calendar day; a streak now **continues as long as the gap since the last logged day is within a 9-day grace window** (`STREAK_GRACE_DAYS`), rather than requiring activity on the literal previous calendar day — a lab used 1-3x/week would otherwise have every streak reset the next time it's checked. Streaks log both on XP-earning activity **and** on simply joining a live session (attendance alone counts), and the daily reset cron only zeros streaks that have genuinely exceeded the grace window, not everyone who didn't happen to have lab that exact day. Verified: an 8-day gap between sessions continues the streak; a 15-day gap resets it (longest-streak preserved either way).

**Exam grading (`grading.service.ts`)** — MCQ/True-False/Fill-blank auto-grade instantly on submit and need no review. Short/Long answers are scored by the AI (Ollama, with the rubric the teacher wrote) if configured, or left `null` for manual grading if not — either way, `final_score` stays null until a human (or the deterministic auto-grader) signs off. `recomputeSubmissionTotals()` is the one place totals, review status, and XP get updated, called after both the initial auto-grade and any teacher override, so it can't drift.

**RAG chat (`chat.service.ts`)** — dual retrieval against `text_chunks` and `book_images` via pgvector, scoped to the student's class + subject. Verified with real inference: seeded two NCERT Class 7 Science chunks, asked a targeted question, and confirmed pgvector retrieved the *correct* chunk (not just the first one) and the model produced a grounded, correctly-cited, non-hallucinated answer.

**English assessment (`english.service.ts`)** — built around client-side transcription (Web Speech API in the browser) rather than a server-side ASR service, so the backend never touches raw audio. Scoring uses the same hybrid pattern as exam grading: AI-graded if Ollama is configured, a normalized-match/word-overlap heuristic if not.

**Admit cards (`admitCard.service.ts`)** — real PDF generation (`pdfkit`) with a QR code (`qrcode`) encoding examId+studentId, bundled into a ZIP (`jszip`) for bulk teacher download.

**Leaderboard (`leaderboard.service.ts`)** — computes two independent rankings (XP-based, exam-average-based) per school+batch+period in one pass; replaces the snapshot wholesale each run since rank has no stable key to diff against.

**Audit log (`auditLog.service.ts`)** — every subjective-score override is recorded with actor, action, and metadata.

---

### 3.5 Background Jobs (`node-cron`, in-process)

| Job | Schedule | What it does |
|-----|----------|---------------|
| Streak reset | Daily, 18:30 UTC (00:00 IST) | Only resets streaks that have exceeded the grace window (see §3.4) — no longer zeros everyone who simply didn't have lab that exact day |
| Leaderboard recompute | Hourly | Recomputes XP + exam-average rankings for every active school × batch × period |

---

### 3.6 AI Integration

Single Ollama daemon (`lib/ollama.ts`), reachability-checked once and cached:

- **Chat completions** (exam subjective scoring, RAG chat answers, English assessment scoring): model `gpt-oss:20b-cloud` — the local daemon proxies to Ollama Cloud transparently using its own signed-in session; the Node app never handles a cloud API key directly.
- **Embeddings**: model `mxbai-embed-large` (1024-dim), always local/CPU — needed on every chat message and must not depend on cloud reachability or incur per-call cost.
- **Every AI-dependent feature degrades gracefully** if the daemon is unreachable: subjective answers stay pending for manual grading, chat shows an "unavailable" message, English assessment falls back to a heuristic score. Nothing 500s.

---

## 4. Frontend — Page by Page

### 4.1 Public Pages

| Page | Route | Status |
|------|-------|--------|
| Landing | `/` | ⚪ Mock (marketing content, unchanged) |
| Features | `/features` | ⚪ Mock |
| Pricing | `/pricing` | ⚪ Mock |
| Register | `/register` | ⚪ Mock — dead-ends by design; no self-registration exists in the backend |

### 4.2 Auth

| Page | Route | Status |
|------|-------|--------|
| Login | `/login` | ✅ **Wired** — two modes: password (all roles) and Batch 1 name-tap + PIN. Redirects using the real `redirectPath` the backend returns based on actual role/batch |

### 4.3 Super Admin Portal — *entirely new*

| Page | Route | Features |
|------|-------|----------|
| Layout | — | Sidebar + TopBar, "superAdmin" theme (slate), real name in footer |
| Schools | `/super-admin/schools` | ✅ **Wired** — list all schools, create a new school (name/code/city/state/board/plan), activate/deactivate |

### 4.4 School Admin Portal — *entirely new*

| Page | Route | Features |
|------|-------|----------|
| Layout | — | Sidebar + TopBar, "schoolAdmin" theme (rose) |
| Dashboard | `/school-admin/dashboard` | ✅ **Wired** — total students/teachers, active vs never-logged-in counts, per-batch breakdown |
| Classes & Sections | `/school-admin/classes` | ✅ **Wired** — add sections per class (each class can differ: 1 has A–D, 5 has A–C), per-section student counts, class-teacher dropdown per section, and a subject×section matrix that maps which teacher teaches what (validated against `class_subjects`) |
| Students | `/school-admin/students` | ✅ **Wired** — bulk import (.csv/.xlsx) with per-row error reporting; scoped "import into Class X-Y" mode (file only needs name + roll no.); single-student add; printable cut-out login slips; CSV credential download; per-student PIN/password reset |
| Teachers | `/school-admin/teachers` | ✅ **Wired** — bulk import (.csv/.xlsx), single add, printable login slips, per-teacher password reset, full list |
| Lab In-charges | `/school-admin/lab-incharges` | ✅ **Wired** — single-add only (no bulk import — schools need one or two), printable login slip, password reset, full list |

### 4.5 Teacher Portal

| Page | Route | Status |
|------|-------|--------|
| Layout | — | ✅ **Wired** — real name in TopBar/Sidebar via `useAuth()` |
| Dashboard | `/teacher/dashboard` | ✅ **Wired** — real stat cards (students/classes/exams/tasks), at-risk panel; scoping now follows `teaching_assignments` (exact sections), with `classes_taught` fallback for unmapped teachers |
| Live Session | `/teacher/live-session` | ✅ **Wired** — pick one of *my* sections + subject, start/end the lab period, live participant grid (5s poll) with raised hands sorted first. This is the switch that unlocks Batch 1 PIN login |
| Students | `/teacher/students` | ✅ **Wired** — real list scoped to exact sections taught (a 7A teacher no longer sees 7B), dynamic class filter tabs, at-risk badges, drill-down into a real profile |
| Assign Tasks | `/teacher/assign-tasks` | ✅ **Wired** — multi-section picker from `/my-sections` ("same task to 7A + 7B + 8C" in one go, or separate tasks for different work), subject dropdown limited to subjects valid for *every* selected class, task list with completion progress |
| Create Exam | `/teacher/create-exam` | ✅ **Wired** — full builder: draft → add questions (all 5 types, MCQ option editor, rubrics) or pull from the question bank → publish to my sections with a per-section window + proctoring settings → close / duplicate as Set B / download admit-card ZIP |
| Exam Review | `/teacher/exams/:examId/review` | ✅ **Wired** — grading queue (submissions list with needs-review badges, answer-by-answer view, AI-suggested score with covered/missing points, one-click confirm or override → audit-logged) + merit list with pass cutoff + print |
| Reports | `/teacher/reports` | ⚪ Mock — no backend endpoint for the heatmap/export view yet |

*Not yet built in the UI at all (backend ready, no page wired to it): standalone Question Bank contribution page (browsing/adding to an exam works inside the builder).*

### 4.6 Student Portal — Batch 1 (Class 1–4, amber theme)

| Page | Route | Status |
|------|-------|--------|
| Layout | — | ✅ **Wired** — batch-mismatch guard now checks real class instead of forcing a mock profile switch; `SessionEndWatcher` force-logs-out the moment the teacher ends the live session (Batch 1 login is only valid while one is active) |
| Home | `/batch1/home` | 🟡 Partial — new **Today panel** at the top is fully real (live session join/raise-hand, pending tasks, open exams); XP/streak banner real via bridge; subject cards/recommended story below remain illustrative |
| Stories | `/batch1/stories` | ⚪ Mock |
| Mini Quizzes | `/batch1/exams` | ✅ **Wired** — shared ExamCenter (amber): real assigned exams, timed randomized paper, autosave, submit |
| Progress | `/batch1/progress` | ⚪ Mock |
| **Tasks** | `/batch1/tasks` | ✅ **Wired** — shared `TaskList` component, real task list from `/api/student/tasks`, click-to-cycle status, XP stat cards computed from real assignments |
| Games | `/batch1/games` | ⚪ Mock |
| Badges | `/batch1/badges` | ⚪ Mock |
| Show & Tell | `/batch1/show-and-tell` | ⚪ Mock — vision AI backend not built this pass |
| Streak | `/batch1/streak` | ⚪ Mock |
| Profile | `/batch1/profile` | ⚪ Mock |

### 4.7 Student Portal — Batch 2 (Class 5–8, indigo theme)

| Page | Route | Status |
|------|-------|--------|
| Layout | — | ✅ **Wired** — real batch-mismatch guard |
| Home | `/batch2/home` | 🟡 Partial — real **Today panel** (live session join/raise-hand, tasks + open exams preview) at the top; subjects grid and leaderboard snippet below still illustrative |
| Subjects | `/batch2/subjects` | ⚪ Mock |
| AI Chat | `/batch2/chat` | ✅ **Wired** — shared `ChatCenter`: subject picker (from the class whitelist), session history sidebar, real RAG answers with NCERT page citations and diagram links, 50/day rate limit surfaced as a friendly message |
| Exams | `/batch2/exams` | ✅ **Wired** — shared ExamCenter (indigo): upcoming/open/completed groups with section windows, timed paper with countdown + autosave + tab-switch proctoring warnings + auto-submit, resume after crash, score once reviewed |
| **Tasks** | `/batch2/tasks` | ✅ **Wired** — new page (previously didn't exist even though teachers could already assign tasks to any class); shared `TaskList` component |
| Notes | `/batch2/notes` | ✅ **Wired** — shared `NotesView`: create/view/delete via `/api/student/notes`, subject filter tabs. The old mock's "AI Summarize" was a fake client-side heuristic with no real backend — dropped rather than shipped as a fake AI feature |
| PYQ Hub | `/batch2/pyq` | ⚪ Mock — no backend content |
| Leaderboard | `/batch2/leaderboard` | ✅ **Wired** — shared `LeaderboardView`: period (weekly/monthly/all-time) + basis (XP/exam-average) + class-vs-batch scope toggles, real podium + rank table, "you" highlighted |
| Daily Challenges | `/batch2/daily-challenges` | ⚪ Mock |
| Streak | `/batch2/streak` | ⚪ Mock |
| Badges | `/batch2/badges` | ⚪ Mock |
| Profile | `/batch2/profile` | ⚪ Mock |

### 4.8 Student Portal — Batch 3 (Class 9–10, sky theme)

| Page | Route | Status |
|------|-------|--------|
| Layout | — | ✅ **Wired** — real batch-mismatch guard |
| Home | `/batch3/home` | 🟡 Partial — real **Today panel** at the top (same as Batch 1/2); banner below real via bridge |
| Board Prep | `/batch3/board-prep` | ⚪ Mock |
| Concept Map | `/batch3/concept-map` | ⚪ Mock |
| Pomodoro | `/batch3/pomodoro` | ⚪ Mock |
| AI Chat | `/batch3/chat` | ✅ **Wired** — shared `ChatCenter` (sky theme), same features as Batch 2 |
| Exams | `/batch3/exams` | ✅ **Wired** — shared ExamCenter (sky theme), same features as Batch 2 |
| **Tasks** | `/batch3/tasks` | ✅ **Wired** — new page (same gap as Batch 2 — never existed); shared `TaskList` |
| Notes | `/batch3/notes` | ✅ **Wired** — shared `NotesView` (sky theme) |
| **Leaderboard** | `/batch3/leaderboard` | ✅ **Wired** — new page (Batch 3 had no leaderboard route at all, even though the backend already scores every batch); shared `LeaderboardView` (sky theme) |
| Subjects, Daily Challenges, PYQ, Streak, Profile | various | ⚪ Mock |

**Removed entirely this session** (per the revised MVP spec — not deferred, deleted): Batch 4 (Class 11–12 / JEE-NEET) and the Parent Portal. Their files no longer exist in `src/routes/`.

### 4.9 Shared Components

| Component | What changed |
|-----------|-------------|
| `Sidebar.tsx` | Added `schoolAdmin`/`superAdmin` themes; teacher/school-admin/super-admin footer now shows real `useAuth()` name instead of hardcoded ("Mrs. Sharma" etc.); fixed a leftover hardcoded "12d" streak badge that disagreed with the real streak shown elsewhere |
| `TopBar.tsx` | Same new themes; XP/streak strip correctly hidden for non-student portals; **always-visible "Log Out" button** for student portals (kiosk hygiene — the next student at a shared lab PC shouldn't have to hunt for it) |
| `ProtectedRoute.tsx` | Gates every route tree by real role from `/api/auth/me`; wrong-role access bounces to that role's own home instead of a dead end. Now also runs `useIdleLogout` (10 min, students only) |
| `useIdleLogout.ts` | **New.** Any mouse/keyboard/touch activity resets a timer; on expiry, logs out and redirects to `/login` with a reason shown to the next user |
| `SessionEndWatcher.tsx` | **New**, mounted in the Batch 1 layout only. Polls `/student/sessions/active` every 15s; force-logs-out the moment a previously-active session disappears, since Batch 1 login is only valid while one is active (verified: the session genuinely returns `null` the instant the teacher ends class) |
| `AuthContext.tsx` | Real login/pinLogin/logout, session persistence (`localStorage` token) and rehydration on page load |
| `AppContext.tsx` | Legacy mock state, kept for pages not yet rewired — has a bridging effect that syncs real student data (name/avatar/XP/streak/class) in from `AuthContext` whenever it changes |
| `api.ts` | Typed fetch client — Bearer token injection, JSON error unwrapping, file upload (now also accepts extra form fields)/download helpers |
| `TodayPanel.tsx` | **New**, shared across all 3 batch Home pages. The first UI anywhere a student can join a live session or raise their hand — this was previously only reachable via direct API call. Also previews pending tasks and open exams |
| `ChatCenter.tsx` | **New**, shared by Batch 2/3. Subject picker + session history + real RAG chat with citations |
| `LeaderboardView.tsx` | **New**, shared by Batch 2/3. Period/basis/scope toggles, podium, rank table |
| `TaskList.tsx` | **New**, shared by all 3 batches (Batch 1's page refactored onto it too) |
| `NotesView.tsx` | **New**, shared by Batch 2/3. CRUD against `/api/student/notes` |
| `Sidebar.tsx` / `TopBar.tsx` | Added a `labIncharge` theme (teal) alongside the existing portal themes |

---

## 5. Roles & What Each Can Do

| Capability | Super Admin | School Admin | Teacher | Lab In-charge | Student |
|---|:---:|:---:|:---:|:---:|:---:|
| Create/manage schools | ✅ | — | — | — | — |
| Import students/teachers via CSV | — | ✅ | — | — | — |
| Add a single student/teacher/lab in-charge | — | ✅ | — | — | — |
| See students outside their own classes | ✅ (all schools) | ✅ (own school) | ❌ (only `classes_taught`) | ✅ (own school, read-only) | — |
| Reset a student's PIN / teacher's password | — | ✅ | — | ✅ | — |
| See which classes are live right now | — | — | own session only | ✅ (whole school) | — |
| Start a live class session | — | — | ✅ | — | join only |
| Assign tasks / build exams | — | — | ✅ | ❌ | complete only |
| Grade subjective answers / override AI score | — | — | ✅ (audit-logged) | ❌ | ❌ |
| Chat with the AI tutor | — | — | — | — | ✅ (rate-limited, 50/day) |
| Self-award XP/streak/scores | ❌ | ❌ | ❌ | ❌ | ❌ (blocked by DB trigger even via direct API call) |

---

## 6. What's NOT Done Yet

**Backend gaps:**
- Show & Tell vision AI (Batch 1 object-photo recognition)
- Super Admin content portal (NCERT PDF upload, global question bank management)
- School Admin feature toggles (enable/disable AI chat, leaderboard basis per class) and reports/export
- Lab In-charge–specific routes (PIN/password reset without grade access)
- The actual Python NCERT ingestion pipeline (only 2 sample chunks were manually seeded to prove the RAG pipeline works)
- Production Docker Compose packaging for a real school-server deployment (currently running via `supabase start`'s dev stack)

**Frontend gaps:**
- Batch 1/2/3 Daily Challenges, PYQ Hub, Badges, Streak (calendar view), and Profile pages are still mock — real backends exist for badges and streak (via `student_profiles`/`student_badges`) but no dedicated pages read them yet; PYQ has no backend content at all
- Subject-progress checklists (`/batch2/subjects`, `/batch3/subjects`, `/batch3/board-prep`, `/batch3/concept-map`, `/batch1/stories`, `/batch1/progress`, `/batch1/games`) are illustrative — `subject_progress` exists in the schema but no curriculum content has been seeded
- Teacher Reports page is UI-only, not connected
- Academic-year *promotion* workflow (Apr: everyone moves up a class, Class 4→5 switches PIN→password, Class 10 passes out) — schema is year-aware now, the workflow UI isn't built
- No Lab In-charge portal UI

---

## 7. How to Run It Locally

```bash
# 1. Start the self-hosted Supabase stack (Docker)
npx supabase start

# 2. Start the backend API
cd api
npm install
npm run dev          # http://localhost:4000

# 3. Start the frontend
npm install
npm run dev           # http://localhost:5173

# 4. Seed a super admin (one-time)
cd api
npx tsx scripts/seedSuperAdmin.ts --email admin@eduai.local --password "YourPassword1"
```

From there: log in as super admin → create a school → seed a school admin (`scripts/seedSchoolAdmin.ts`) → log in as school admin → import students/teachers via CSV → log in as teacher → start a live session → log in as a Batch 1 student via the PIN flow, or any other student via password.

---

*Related documents: `EDUAI_REVISED_MVP_SPEC.md` (product scope this was built against), `FULL_BACKEND_SPEC.md` (original schema design, now superseded by the actual migrations in `supabase/migrations/`), `RAG_CHATBOT_ARCHITECTURE.md` (RAG design, superseded in the embedding-model/provider details by what's in §3.6 above).*
