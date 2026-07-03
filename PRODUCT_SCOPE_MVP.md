# EduAI — MVP Product Scope (School Lab Only)

> **Decision date:** June 29, 2026
> **Scope:** School computer lab use only — NO home use, NO parent portal
> **Phase 2 (Year 2):** Home access, parent portal, mobile app, WhatsApp notifications
> **Portals:** Super Admin · School Admin · Teacher · Student

---

## What Changed & Why It Simplifies Everything

By locking the MVP to **school lab only**, these problems disappear completely:

| Problem (Home Use) | Gone Because |
|--------------------|-------------|
| Batch 1 kids can't navigate alone | Teacher is physically present in lab |
| Parent needs to sit with young children | Teacher supervises the lab |
| Mobile-first design for parents' phones | Lab = desktop/laptop only |
| Offline mode for patchy home internet | School has dedicated broadband |
| WhatsApp parent notifications | Not needed yet |
| Screen time limits for young children | Teacher manages the class period |
| At-home exam proctoring (webcam) | Teacher can see every screen in lab |
| Parent portal | Completely deferred to Year 2 |

**What this means for your team:**
- Build 4 portals instead of 5
- Design for desktop only (no mobile breakpoints needed in MVP)
- No WhatsApp/email notification infrastructure needed
- No offline mode
- Proctoring reduces to: question randomization + tab-switch detection only (teacher physically present)
- Batch 1 UX still needs to be child-friendly, but teacher guides navigation

---

## The 4 Portals — Exact Scope

---

### Portal 1 — Super Admin
**Who:** EduAI company team (you)
**URL:** `admin.eduai.com` or `/super-admin`

#### What Super Admin Can Do

```
School Management
  ├── Create new school account (name, code, city, board, plan)
  ├── Activate / deactivate a school
  ├── View all schools with stats (students, teachers, active today)
  └── Edit school details and plan tier

Content Management
  ├── Upload NCERT PDFs (triggers ingestion pipeline)
  ├── Manage question bank (add, edit, delete, tag by class/subject)
  ├── Manage badge definitions (create new badge criteria)
  └── Manage English assessment word/sentence bank

Platform Analytics
  ├── Total schools, students, teachers on platform
  ├── Daily/weekly active users (platform-wide)
  ├── AI API cost tracker (Claude + OpenAI usage by school)
  ├── Feature usage heatmap (which features schools actually use)
  └── Schools not logging in (churn risk flag)

Billing
  ├── Subscription status per school
  ├── Student count vs billed count per school
  └── Invoice generation

Announcements
  └── Push platform-wide notice (maintenance, new feature) → shows in all school admin dashboards
```

#### Super Admin — Pages Needed

```
/super-admin/dashboard          → Platform overview stats
/super-admin/schools            → All schools list + filters
/super-admin/schools/new        → Create school form
/super-admin/schools/:id        → School detail + edit + deactivate
/super-admin/content            → NCERT PDF upload + question bank
/super-admin/analytics          → Platform-wide usage charts
/super-admin/billing            → Subscription management
```

---

### Portal 2 — School Admin
**Who:** Principal, vice-principal, or IT coordinator at each school (1–2 people per school)
**URL:** `/school-admin`

#### What School Admin Can Do

```
First-Time Setup Wizard (shown only on first login)
  Step 1: Upload student roster CSV
           CSV columns: full_name, class, section, roll_number
           → System auto-creates student accounts
           → Generates random passwords
  Step 2: Upload teacher roster CSV
           CSV columns: full_name, employee_id, subject, classes_taught
           → System auto-creates teacher accounts
  Step 3: Set academic year and sections
           → Define sections per class (e.g., Class 7 has A, B, C)
  Step 4: Download credential sheets
           → PDF per section: student name + username + password
           → School prints and distributes on day 1

User Management
  ├── View all students (search by name, filter by class/section)
  ├── Add single student (for mid-year admissions)
  ├── Deactivate student (student left school)
  ├── Reset student password
  ├── View all teachers
  ├── Add single teacher
  ├── Deactivate teacher
  └── Reset teacher password

Credential Management
  ├── Download student login cards PDF (per class/section)
  ├── Regenerate passwords (bulk reset if cards are lost)
  └── View login activity (who has never logged in — follow up)

Feature Controls (per class or school-wide)
  ├── Enable/disable AI Chat per batch
  ├── Enable/disable Leaderboard per class
  └── Enable/disable Games (Batch 1) for focused exam periods

School Reports
  ├── School-wide performance dashboard (all classes, all subjects)
  ├── Class-wise comparison (which class is performing best)
  ├── Teacher activity (which teachers assign most tasks/exams)
  ├── Student login frequency (who is coming to lab regularly)
  └── Export report as PDF (for principal/management presentations)
```

#### School Admin — Pages Needed

```
/school-admin/dashboard          → School overview stats
/school-admin/setup              → First-time setup wizard
/school-admin/students           → All students, filters, search
/school-admin/students/import    → CSV bulk import
/school-admin/teachers           → All teachers, filters
/school-admin/credentials        → Download login cards, reset passwords
/school-admin/features           → Enable/disable features per class
/school-admin/reports            → School-wide performance
```

---

### Portal 3 — Teacher
**Who:** Class/subject teacher
**URL:** `/teacher`

This is the most actively used portal — teacher uses it every single class period.

#### Two Modes Teacher Works In

```
MODE A — LIVE SESSION (Teacher is running class in the lab)
  Teacher clicks "Start Session" for their class
  ↓
  Students in that class see "Class is live — join now" on their screen
  ↓
  Teacher controls the board:
    · Show a chapter/topic (students see it on their screen)
    · Launch a quiz (students answer on their device)
    · See real-time: how many answered, % correct
    · Reveal answer + discuss
    · Move to next question / next topic
  ↓
  Teacher ends session → session log saved (what was covered today)

MODE B — ASSIGNMENT MODE (Students do it in the next lab period or as directed)
  Teacher creates a task or exam
  Assigns to: whole class / specific section / specific students
  Students see it in "My Tasks" / "My Exams" in their dashboard
  Due date determines when they need to complete it
```

#### What Teacher Can Do

```
My Classes
  ├── List of classes/sections I teach (e.g., 7-A Maths, 7-B Maths, 9-A Science)
  └── Quick stats: active today, tasks pending, exams due

Live Session
  ├── Start session for a class (one at a time)
  ├── Session board: display chapter content, launch quiz
  ├── Real-time response view: see % of class that answered + % correct
  ├── Timer control (for timed questions)
  └── End session → session saved to activity log

Assign Tasks
  ├── Task title, subject, type (reading / practice / PYQ / custom)
  ├── Assign to: class / section / individual students
  ├── Due date + XP reward
  └── Optional: instructions text

Create Exam
  ├── Exam details: title, subject, class, duration
  ├── Question types: MCQ, True/False, Short Answer, Long Answer
  ├── For Short/Long: write rubric (used by AI scoring)
  ├── Question randomization: ON/OFF (different paper per student)
  ├── Option shuffle: ON/OFF
  ├── Publish exam → generates admit cards
  └── Assign to: class / section / students

Grade Submissions
  ├── MCQ / True/False: auto-graded ✓
  ├── Short / Long Answer:
  │     · See student's answer
  │     · See AI suggested score + covered/missed points
  │     · Accept AI score OR type own score
  │     · Add teacher comment
  └── Publish results → merit list generated

View Students
  ├── All students in my classes (search by name)
  ├── At-risk panel: students with low scores or inactive 3+ days
  ├── Student drill-down: profile, subject scores, exam history, task completion
  └── Assign task directly from student profile

Reports
  ├── Class performance heatmap (students × subjects, color-coded scores)
  ├── Subject trend: class average per subject over time
  ├── Exam analysis: score distribution, question difficulty
  └── Export PDF (for PTM / management sharing)

Announcements
  └── Post announcement to a class → shows in all students' dashboards
```

#### Teacher — Pages Needed

```
/teacher/dashboard               → My classes overview + stats
/teacher/session/:class_id       → Live session board (real-time)
/teacher/students                → Student list with filters
/teacher/students/:id            → Student drill-down
/teacher/assign-tasks            → Task creation + assignment
/teacher/create-exam             → Exam builder
/teacher/exams                   → All my exams (draft/published/closed)
/teacher/exams/:id/submissions   → All student submissions
/teacher/exams/:id/grade         → Grade subjective answers
/teacher/exams/:id/results       → Merit list + publish
/teacher/reports                 → Performance heatmap + export
```

---

### Portal 4 — Student
**Who:** Students in school computer lab
**Device:** Desktop or laptop in school
**Context:** Supervised by teacher, during class period or designated lab time

#### Batch 1 — Class 1–4 (Ages 6–10, in lab with teacher)

Since teacher is physically present in the lab, the UI still needs to be very simple and child-friendly but teacher handles navigation for very young children.

```
Pages
  /batch1/home         → Today's tasks from teacher + subject cards + XP bar
  /batch1/stories      → Story reader with quiz (teacher assigns which story)
  /batch1/exams        → Mini quizzes (star-based, teacher-assigned)
  /batch1/games        → Mini games (teacher unlocks per session)
  /batch1/badges       → Badge collection
  /batch1/show-tell    → Take photo of object → AI identifies it (vision)
  /batch1/progress     → Simple progress bars per subject
  /batch1/profile      → Avatar picker + name

REMOVED from Batch 1 MVP:
  ✗ AI text chat (children can't type — replaced by avatar Q&A via games)
  ✗ Notes manager
  ✗ PYQ Hub
  ✗ Streak calendar (teacher manages lab attendance)
  ✗ Pomodoro timer
```

#### Batch 2 — Class 5–8 (Ages 10–14)

```
Pages
  /batch2/home              → Dashboard: tasks, subject progress, leaderboard preview
  /batch2/subjects          → NCERT chapter list per subject
  /batch2/chat              → AI doubt solver (teacher may enable/disable per session)
  /batch2/exams             → Take assigned exams / view completed results
  /batch2/notes             → Notes manager (in lab, during class)
  /batch2/pyq               → Past year questions
  /batch2/leaderboard       → Class leaderboard
  /batch2/daily-challenges  → Daily CBSE-pattern challenge
  /batch2/badges            → Badge collection
  /batch2/profile           → Profile settings

REMOVED from Batch 2 MVP:
  ✗ Streak calendar (simplify to just current streak counter in topbar)
```

#### Batch 3 — Class 9–10 (Ages 14–16)

```
Pages
  /batch3/home              → Dashboard: board countdown, weak areas, tasks
  /batch3/subjects          → Chapter checklist + board-tagged chapters
  /batch3/board-prep        → Past papers, important topics, answer writing tips
  /batch3/chat              → AI doubt solver with LaTeX
  /batch3/concept-map       → Visual concept maps
  /batch3/daily-challenges  → HOTS, Case Study, A&R questions
  /batch3/exams             → Take/view exams
  /batch3/notes             → Study notes
  /batch3/pyq               → Board PYQ papers
  /batch3/pomodoro          → Focus timer (for self-paced lab sessions)
  /batch3/badges            → Badges
  /batch3/profile           → Profile

REMOVED from Batch 3 MVP:
  ✗ Streak calendar (simplify)
```

#### Batch 4 — Class 11–12 (Ages 16–18)

```
Pages
  /batch4/home              → Dashboard: JEE/NEET countdown, readiness gauge
  /batch4/onboarding        → Stream + target year setup (once)
  /batch4/jee-neet-prep     → JEE/NEET hub (weightage, rank predictor, mock pattern)
  /batch4/schedule-planner  → AI study planner
  /batch4/subjects          → NCERT syllabus per stream
  /batch4/chat              → AI problem solver
  /batch4/concept-map       → Concept maps
  /batch4/weightage         → Topic weightage table
  /batch4/exams             → Take/view exams
  /batch4/notes             → Notes
  /batch4/pyq               → JEE/NEET PYQ archive
  /batch4/pomodoro          → Focus timer
  /batch4/career            → Career path AI
  /batch4/badges            → Badges
  /batch4/profile           → Profile

REMOVED from Batch 4 MVP:
  ✗ Streak calendar (simplify)
  ✗ AI-PI mock interview (Year 2)
  ✗ Group Discussion rooms (Year 2)
```

---

## What is IN vs OUT for MVP

### IN — Build Now

| Feature | Portal |
|---------|--------|
| Super Admin full portal | Super Admin |
| School Admin with CSV import + credential PDF | School Admin |
| Teacher live session mode | Teacher |
| Teacher real-time response dashboard | Teacher |
| Task assignment (class/section/individual) | Teacher |
| Exam builder (MCQ, T/F, Short, Long Answer + rubric) | Teacher |
| Question randomization + option shuffle | Teacher |
| AI scoring for subjective answers | Teacher + Backend |
| Merit list + result publishing | Teacher |
| Performance heatmap report | Teacher |
| Batch 1–4 student dashboards | Student |
| RAG AI chatbot (Batch 2–4) | Student |
| Textbook image retrieval in chat | Student |
| Student image upload (vision input) in chat | Student |
| Show & Tell vision AI (Batch 1) | Student |
| Avatar English assessment (Batch 1 words, Batch 2 sentences) | Student |
| Games (Batch 1) | Student |
| Concept maps (Batch 3, 4) | Student |
| PYQ hub (Batch 2, 3, 4) | Student |
| Study planner AI (Batch 4) | Student |
| Career path AI (Batch 4) | Student |
| JEE/NEET prep hub (Batch 4) | Student |
| Leaderboard (class-scoped) | Student |
| XP + Badges gamification | Student |
| Notes manager (Batch 2–4) | Student |
| Pomodoro timer (Batch 3, 4) | Student |
| Tab-switch detection during exams | Student |
| Admit card generation | Teacher |
| Bulk student CSV import | School Admin |
| Login credential sheet PDF generation | School Admin |

### OUT — Year 2

| Feature | Reason Deferred |
|---------|----------------|
| Parent portal | No home use in MVP |
| WhatsApp parent notifications | No home use in MVP |
| Mobile app | Lab = desktop |
| Offline mode | School has broadband |
| Webcam face detection proctoring | Teacher physically present in lab |
| Home access toggle per student | Not needed |
| Screen time limits | Teacher manages class period |
| AI-PI mock interview | Complex, defer |
| Group Discussion (WebRTC) rooms | Complex, defer |
| Psychometric career aptitude test | Defer |
| Reading comprehension highlight interaction | Defer |
| Audio answer recording (exams) | Defer |
| Coding question type (Judge0) | Defer |
| Live class AI summary (Zoom/Meet integration) | Defer |
| At-risk WhatsApp alert to teacher | Defer |
| School ERP integration | Defer |

---

## Database Changes — Simplified

Since no home use, **remove from MVP schema:**

```sql
-- REMOVE these tables for now (add in Year 2)
-- parent_profiles         → no parent portal
-- parent_messages         → no parent messaging
-- No need for parent_phone on student_profiles yet

-- SIMPLIFY streak_logs
-- No need for home vs school context tracking
-- Streak = did student log in today (any login counts)

-- REMOVE from student_profiles
-- target_year            → Batch 4 only, keep
-- prep_level             → Batch 4 only, keep
-- parent_phone           → not needed yet
-- parent_name            → not needed yet
-- parent_whatsapp_opt_in → not needed yet
```

**ADD for school-lab-only MVP:**

```sql
-- Live session tracking
CREATE TABLE live_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID NOT NULL REFERENCES teacher_profiles(user_id),
  school_id       UUID NOT NULL REFERENCES schools(id),
  class_num       INT NOT NULL,
  section         TEXT NOT NULL,
  subject         TEXT,
  started_at      TIMESTAMPTZ DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true
);

-- Students who joined a live session
CREATE TABLE session_participants (
  session_id      UUID NOT NULL REFERENCES live_sessions(id),
  student_id      UUID NOT NULL REFERENCES student_profiles(user_id),
  joined_at       TIMESTAMPTZ DEFAULT now(),
  left_at         TIMESTAMPTZ,
  PRIMARY KEY (session_id, student_id)
);

-- Teacher announcements to a class
CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID NOT NULL REFERENCES teacher_profiles(user_id),
  school_id       UUID NOT NULL REFERENCES schools(id),
  class_num       INT,
  section         TEXT,
  title           TEXT NOT NULL,
  body            TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ    -- auto-hide after this date
);

-- Student login credential tracking (who has activated their account)
ALTER TABLE student_profiles
  ADD COLUMN has_logged_in_ever BOOLEAN DEFAULT false,
  ADD COLUMN first_login_at TIMESTAMPTZ;
-- School admin uses this to see who still hasn't activated
```

---

## New API Routes — MVP Additions

### Live Session Routes

```
POST   /api/teacher/session/start        → Start live session for a class
  Body: { class_num, section, subject }
  Response: { session_id } + broadcasts to all students in that class via Supabase Realtime

POST   /api/teacher/session/:id/end      → End live session
GET    /api/teacher/session/:id/responses → Real-time responses from students
POST   /api/student/session/join         → Student joins live session
GET    /api/student/session/active       → Is there an active session for my class right now?
```

### Announcement Routes

```
POST   /api/teacher/announcements        → Create announcement for a class
GET    /api/student/announcements        → Get active announcements for student's class
DELETE /api/teacher/announcements/:id    → Remove announcement
```

### School Admin Routes

```
POST   /api/school-admin/students/import  → CSV bulk import
  Body: multipart/form-data with CSV file
  → Creates accounts, returns { created: 45, errors: [{ row: 3, reason: "..." }] }

GET    /api/school-admin/credentials/download
  Query: { class_num, section }
  → Returns PDF blob (login cards for all students in that class/section)

GET    /api/school-admin/login-activity
  → Returns students who have never logged in (for follow-up)
```

---

## How a Typical School Day Works (Lab Use)

```
08:45 — School admin has already set up all accounts on Day 1
         Students have their printed login cards

09:00 — CLASS PERIOD STARTS
         Teacher arrives at computer lab
         Teacher logs in → clicks "Start Session" for Class 7-A Maths
         
09:01 — STUDENT SCREENS
         Students see: "🟢 Class is Live — Maths with Sir/Ma'am"
         Students log in (username + password from their card)
         
09:05 — TEACHER LAUNCHES ACTIVITY
         Teacher selects: "Chapter 5 Quiz — Fractions" → clicks Launch
         10 questions, timer: 2 min each
         
09:05–09:25 — STUDENTS ANSWER QUIZ
         Each student gets different question order (randomization)
         Teacher sees real-time: "21/30 students answered Q1 — 67% correct"
         Teacher pauses, discusses wrong answers on board
         
09:25–09:35 — AI DOUBT SOLVER
         Teacher says: "Open AI Chat, ask it about fractions"
         Students type doubts → get NCERT-referenced answers
         
09:35 — SESSION ENDS
         Teacher clicks End Session
         Each student sees: today's XP earned, quiz score
         Teacher sees: class performance summary for today
         
09:40 — PERIOD OVER, NEXT CLASS ENTERS
```

---

## Revised Implementation Priority

```
SPRINT 1 (Weeks 1–3) — Foundation
  [ ] Supabase project + all migrations
  [ ] Auth: school admin creates accounts (not self-register)
  [ ] Super Admin portal: create school, set plan
  [ ] School Admin portal: CSV import, credential PDF download
  [ ] Teacher portal: basic dashboard, student list

SPRINT 2 (Weeks 4–6) — Core Classroom Flow
  [ ] Teacher: Live session start/end + Supabase Realtime broadcast
  [ ] Student: "Class is live" notification + join session
  [ ] Teacher: Real-time response dashboard during session
  [ ] Teacher: Task assignment (class / section / individual)
  [ ] Student: My Tasks + status cycling

SPRINT 3 (Weeks 7–9) — Exams & Assessment
  [ ] Teacher: Exam builder (all question types + rubric)
  [ ] Teacher: Publish exam + admit card generation
  [ ] Student: Take exam (randomized paper, tab-switch detection)
  [ ] Backend: Auto-grade MCQ/T-F, AI-score subjective
  [ ] Teacher: Review submissions + override AI score + publish results
  [ ] Teacher: Merit list generation

SPRINT 4 (Weeks 10–12) — AI Features
  [ ] RAG chatbot (Batch 2–4 AI chat with NCERT retrieval)
  [ ] Textbook image return in chat
  [ ] Student image upload → vision analysis
  [ ] Show & Tell vision AI (Batch 1)
  [ ] AI study planner (Batch 4)
  [ ] Career path AI (Batch 4)

SPRINT 5 (Weeks 13–15) — Reports & Polish
  [ ] Teacher: Performance heatmap report + PDF export
  [ ] School Admin: School-wide reports
  [ ] Super Admin: Platform analytics dashboard
  [ ] Avatar English assessment (Batch 1 words, Batch 2 sentences)
  [ ] Gamification: XP, badges, leaderboard (real data)
  [ ] Batch 4: JEE/NEET prep hub, weightage, rank predictor

SPRINT 6 (Weeks 16–17) — QA & Launch
  [ ] End-to-end testing per portal
  [ ] School onboarding flow test (CSV import → student first login)
  [ ] Performance testing (30 students in lab simultaneously)
  [ ] Security audit (RLS, school isolation)
  [ ] Pilot with 1–2 schools
```

---

## What You're Selling to Schools — The Pitch in 1 Paragraph

> "EduAI is a school computer lab platform that runs during class periods. Your teacher logs in, starts a session, and every student in the lab follows along on their screen — live quizzes, AI doubt solver, NCERT-based content, all in one place. No app to install, no homework pressure, no parent training needed. The school admin sets up all student accounts in 10 minutes by uploading a CSV. Students get a printed login card on day 1. That's it."

---

## Year 2 — Home Use Additions (After 1 Year of Success)

```
When you're ready to expand to home use, add:
  → Parent portal (lightweight: today's activity + subject scores)
  → WhatsApp weekly report to parents
  → Mobile-responsive UI (or native app)
  → Offline mode for patchy home internet
  → Home access toggle per school/class
  → Batch 1 avatar-guided home mode (parent co-use)
  → Webcam proctoring for home-based exams
  → At-home streak tracking
  → Screen time controls for younger batches
```

---

*Related documents:*
- *`FULL_BACKEND_SPEC.md` — complete DB schema and API routes*
- *`RAG_CHATBOT_ARCHITECTURE.md` — AI chatbot and NCERT ingestion pipeline*
- *`NEW_FEATURES_PLAN.md` — AI proctoring, AI scoring, avatar English assessment*
