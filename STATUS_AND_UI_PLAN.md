# EduAI — Status & UI Plan

> **Last updated:** July 7, 2026
> **Scope:** School computer-lab MVP — Classes 1–10, English-medium, no parent portal.
> This document has two halves: **Part A** is an honest snapshot of what is built vs. remaining. **Part B** is the UI design plan for every batch and every admin portal — the design language, layout system, and page-by-page specs for everything still to be built.

---

## PART A — WHAT'S DONE / WHAT'S REMAINING

### A1. Done — Backend (fully built, running, E2E-verified)

| Area | Detail |
|------|--------|
| **Database** | 35 tables on self-hosted Supabase (Postgres + pgvector), full RLS on every table, base-table grants, JWT custom claims (`app_role`, `school_id`), DB guard triggers so students can't self-award XP/scores even via direct REST |
| **Auth** | Password login (all roles), Batch 1 name-tap + 4-digit PIN login (only while a teacher's live session is active), roster fetch, `/me` rehydration, rate limits (10 login/min, 8 PIN/min, 50 chat msgs/day) |
| **Accounts** | Super Admin creates schools; School Admin bulk-imports students/teachers (.csv/.xlsx with per-row errors), single-add, scoped section import, PIN/password resets, printable credential slips; Lab In-charge single-add |
| **Classes & Sections** | `class_sections` (per school, per academic year Apr–Mar) + `teaching_assignments` (teacher × section × subject) as the source of truth for who teaches what; auto-registration on import; legacy `classes_taught[]` fallback |
| **Live sessions** | Teacher start/end per section+subject, participant tracking, raise-hand; session join logs streak; Batch 1 login gated on an active session |
| **Tasks** | Teacher creates + assigns (students / class+section / multi-section / batch); student cycles status; XP awarded exactly once on completion |
| **Exams — full loop** | Builder (5 question types, MCQ option editor, rubrics, question bank pull), publish with **per-section windows** (7-A Monday, 7-B Wednesday), randomized per-student paper (seeded), autosave/crash-resume, tab-switch proctoring with auto-submit, auto-grading (MCQ/TF/fill-blank), AI subjective scoring with rubric (Ollama) or manual fallback, teacher review queue with override + audit log, merit list with pass cutoff, "Set B" duplication, admit-card PDF ZIP with QR codes |
| **Gamification** | Single `addXp()` write path, badge auto-award, streak with 9-day grace window (fits a 1–3×/week lab), streak logs on attendance alone, daily reset cron only zeroes genuinely-stale streaks |
| **Leaderboard** | XP-basis + exam-average-basis rankings per school × batch × period (weekly/monthly/all-time), recomputed hourly, rank-change tracking |
| **RAG chat** | Dual pgvector retrieval (NCERT text chunks + diagrams) scoped to student's class+subject, grounded cited answers, session history, graceful degradation when Ollama is down |
| **English assessment** | Word/sentence practice items, client-side Web Speech transcription, AI or heuristic scoring, XP integration |
| **Notes** | Full CRUD per student with subject tagging |
| **Background jobs** | Daily streak reset (00:00 IST), hourly leaderboard recompute |
| **Lab In-charge API** | Read-only rosters, PIN/password resets, school-wide live-session view — no grade access by construction (routes simply don't exist for this role) |

### A2. Done — Frontend (wired to the real API)

| Portal | Wired pages |
|--------|-------------|
| **Auth** | Login (password + Batch 1 name-tap/PIN), real role-based redirect |
| **Super Admin** (slate) | Schools list/create/activate |
| **School Admin** (rose) | Dashboard, Classes & Sections (section CRUD + subject-teacher matrix), Students (import/add/slips/resets), Teachers (same), Lab In-charges |
| **Lab In-charge** (teal) | Dashboard (live sessions school-wide), Students (roster + resets), Teachers (roster + resets) — *built this session, routes registered in App.tsx* |
| **Teacher** | Dashboard (real stats + at-risk), Live Session panel, Students (scoped to exact sections), Assign Tasks (multi-section), Create Exam (full builder), Exam Review (grading queue + merit list) |
| **Batch 1** (amber) | Today panel on Home (join session/raise hand), Mini Quizzes (ExamCenter), Tasks; SessionEndWatcher force-logout, idle logout, always-visible logout |
| **Batch 2** (indigo) | Today panel, AI Chat (ChatCenter), Exams, Tasks (new page), Notes, Leaderboard |
| **Batch 3** (sky) | Today panel, AI Chat, Exams, Tasks (new), Notes, Leaderboard (new) |

**Shared components built:** `TodayPanel`, `ExamCenter`, `ChatCenter`, `TaskList`, `NotesView`, `LeaderboardView`, `SessionEndWatcher`, `useIdleLogout`, themed `Sidebar`/`TopBar`/`ProtectedRoute`.

### A3. In progress (this session, uncommitted)

- **Migration `20250101000018`** — PYQ tagging on `question_bank` (`is_pyq`, `pyq_year`, `pyq_source` + seed rows) and **daily challenges** (`challenge_templates` + `student_daily_challenges` + RLS + 8 seeded templates). ✅ written
- **`gamification.service.ts`** — added `getStreakCalendar()` (60-day calendar + streak/longest/grace) and `getBadgesForStudent()` (earned + progress-toward-unearned). ✅ written, **not yet exposed as routes**

### A4. Remaining — Backend

| # | Item | Notes |
|---|------|-------|
| 1 | **Student self-serve endpoints** | `GET /student/badges`, `GET /student/streak-calendar`, `GET /student/profile` (aggregate), controllers + routes for the service functions above |
| 2 | **Daily challenges endpoints** | `GET /student/daily-challenges` (evaluate-on-read against today's metrics, award XP once on completion) |
| 3 | **PYQ hub endpoint** | `GET /student/pyq?subject=` (filtered question_bank reads) + teacher tagging in the add-to-bank flow |
| 4 | **Teacher Reports** | Class performance heatmap (avg exam % per student × subject), English assessment class report, task-completion matrix, CSV export |
| 5 | **April promotion workflow** | Class N → N+1 for a new academic year, Class 4→5 converts PIN→password accounts, Class 10 marked passed-out, new-year section carry-forward |
| 6 | **School Admin extras** | Feature toggles (AI chat on/off per class), usage report for the principal, class-teacher PTM printout |
| 7 | **Super Admin content portal** | NCERT PDF upload → ingestion trigger, global question-bank management |
| 8 | **Show & Tell vision AI** | Batch 1 photo-object recognition (needs a vision model; deferred) |
| 9 | **NCERT ingestion pipeline** | Python: PDF → chunks + diagrams → embeddings (only 2 sample chunks seeded today) |
| 10 | **Production packaging** | Docker Compose for a school-server box (currently `supabase start` dev stack) |

### A5. Remaining — Frontend (all currently mock)

| Portal | Pages |
|--------|-------|
| Batch 1 | Stories, Progress, Games, Badges, Show & Tell, Streak, Profile; Home lower half (subject cards) |
| Batch 2 | Subjects, PYQ Hub, Daily Challenges, Streak, Badges, Profile; Home lower half |
| Batch 3 | Board Prep, Concept Map, Pomodoro, Subjects, Daily Challenges, PYQ, Streak, Profile |
| Teacher | Reports (heatmap/export), standalone Question Bank page |
| School Admin | Feature toggles, principal reports |
| Super Admin | Content portal (NCERT upload, global question bank) |
| Public | Landing/Features/Pricing (marketing, fine as-is) |

---

## PART B — UI DESIGN PLAN

### B1. Design system foundations (all portals)

One design system, seven themed skins. Everything below is Tailwind-native — no new CSS framework.

**Shared tokens**

| Token | Value |
|-------|-------|
| Font | Existing app font; sizes step 12/14/16/20/24/32; Batch 1 gets one step larger everywhere |
| Radius | `rounded-2xl` cards, `rounded-xl` buttons/inputs, `rounded-full` pills & avatars |
| Shadow | `shadow-sm` at rest, `shadow-md` on hover — never heavier; depth comes from background contrast, not shadows |
| Surfaces | Page `bg-slate-50`, cards `bg-white ring-1 ring-slate-200/60`; theme color reserved for accents, never full-page washes |
| Motion | 150–200ms ease-out on hover/press; page-level skeletons (never spinners) while loading; number count-ups for XP/stats |
| States | Every list screen designs **empty / loading / error** states explicitly — a fresh school sees empty states first, they are the real first impression |
| Feedback | Toasts top-right (teacher/admin), center-bottom large (students); destructive actions always confirm |

**Theme accents (already established, keep):** Batch 1 amber · Batch 2 indigo · Batch 3 sky · Teacher (current) · School Admin rose · Super Admin slate · Lab In-charge teal.

**Accessibility & kiosk reality:** lab PCs are shared, low-end, sometimes 1366×768. Design for that: no layout that needs >1280px, click targets ≥40px (≥56px Batch 1), all interactions mouse-only-friendly (no hover-required info), logout always one visible click away.

---

### B2. Batch 1 (Class 1–4, amber) — "big, warm, tap-first"

Kids aged 5–9, many barely reading. Design rules: **giant tap targets, emoji-first iconography, one action per screen, celebrations for everything, zero text-dense screens.**

- Base font ~18px, headings 28–32px, buttons ≥56px tall, generous whitespace.
- Every page has the student's animal avatar (🦁🦊…) visible — it's their identity anchor on a shared PC.
- Sounds/confetti on achievements (CSS confetti, optional muted).

**Page specs**

| Page | Design |
|------|--------|
| **Home** (top half done) | Below TodayPanel: replace mock subject cards with a 2×2 grid of oversized subject tiles (emoji + name, real from `/student/subjects`), each opening its Tasks filtered view. A "My Stars" strip: XP as ⭐ count, streak as 🔥 with days |
| **Badges** | Wire to `GET /student/badges`. Grid of large circular badge medallions: earned = full-color + shine animation, unearned = grayscale with a fat progress ring around the circle and "3 more days!" style captions (progress fraction × criteria, phrased simply). Tap a badge → full-screen modal with big icon, description, confetti if earned |
| **Streak** | Wire to `GET /student/streak-calendar`. NOT a GitHub heatmap (too abstract for age 6) — instead a **horizontal path/trail**: last ~14 lab days as stepping stones, active days lit amber with a 🔥, today pulsing. Big number card "🔥 6 lab days in a row!" + "Best ever: 9". Explicit copy: "Come to lab to keep your fire going!" (grace window means we never show scary broken-streak messaging) |
| **Profile** | Avatar picker (big emoji grid — writes to `student_profiles.avatar`), name, class-section, three stat tiles (⭐ XP, 🔥 streak, 🏅 badges), recent badges row. No settings, no password stuff (PIN kids) |
| **Games / Stories / Progress / Show & Tell** | Keep mock for now (no backend). Add a soft "Coming soon" ribbon so kids aren't confused by dead data |

---

### B3. Batch 2 (Class 5–8, indigo) — "playful but organized"

Ages 10–14. They can read dashboards but still respond to game mechanics. Design rules: **card-dense but scannable, progress bars everywhere, friendly microcopy, light competitive framing.**

**Page specs**

| Page | Design |
|------|--------|
| **Home** (top half done) | Below TodayPanel: left column = real subject grid (from `/student/subjects`, each card shows a slim progress bar once subject_progress has content — until then just the subject + "Explore"); right column = compact **Daily Challenges widget** (top 3 of today, checkbox style with XP chips) + leaderboard mini-podium (top 3 + your rank) |
| **Daily Challenges** | Wire to `GET /student/daily-challenges`. Vertical checklist of today's challenges as cards: title, description, progress bar (`progress/target`), XP chip; completed = indigo fill + ✓ + strike; XP-award moment gets a toast + count-up. Header shows "Today • resets at midnight" and total XP available. Empty state: "All done! 🎉 Come back tomorrow" |
| **Badges** | Same data as Batch 1 but denser: 4-col grid of square cards, earned in color with earned-date, unearned grayscale with a linear progress bar + "12/20 tasks". Filter pills: All / Earned / In progress |
| **Streak** | Real **month calendar grid** (this age gets calendars): active days = filled indigo dot with XP tooltip, today outlined, current-streak and longest-streak stat tiles above, small explainer of the grace window ("your streak survives normal gaps between lab days") |
| **PYQ Hub** | Wire to `GET /student/pyq`. Subject filter tabs (real whitelist) → list of PYQ cards: question text, year + source chip ("CBSE 2023"), marks, difficulty dot, type tag. Card expands inline to show the full question; MCQ shows options with a "Reveal answer" button (flip interaction). This is practice-browsing, not a test — no scoring |
| **Subjects** | Keep illustrative until curriculum content is seeded; wire the subject list itself to `/student/subjects` so names are at least real |
| **Profile** | Avatar picker, real name/class/section, stat tiles (XP, level, streak, badges, tasks completed, exams taken — from `GET /student/profile`), recent badge strip, and a "My credentials" note ("ask your teacher if you forgot your password") |

---

### B4. Batch 3 (Class 9–10, sky) — "serious, data-forward, board-exam energy"

Ages 14–16, board-exam pressure. Design rules: **denser information, real numbers over decorations, muted celebration, keyboard-friendly.** Closer to a productivity app than a game.

**Page specs**

| Page | Design |
|------|--------|
| **Home** | Below TodayPanel: exam-centric layout — "Next exam" countdown card (from real `/student/exams` upcoming), average-score sparkline once ≥2 submissions exist, compact daily challenges row, leaderboard rank chip. Subjects as a slim horizontal list, not big tiles |
| **Daily Challenges** | Same component as Batch 2, sky theme, tighter density (list rows instead of cards) |
| **Badges** | Same component as Batch 2, sky theme; copy shifts from "Keep going! 🎉" to plain progress numbers |
| **Streak** | Same month-calendar component as Batch 2, sky theme; adds a small "days active this month" percentage — attendance framing rather than fire framing |
| **PYQ Hub** | Same as Batch 2 **plus**: year filter (2024/2023/…), marks filter, and a "Board practice" banner when filtered to Class 10 content. Reveal-answer shows rubric points for subjective questions (what an examiner looks for) |
| **Profile** | Batch 2 profile + an academic block: per-exam history table (title, subject, date, score %, reviewed status) from existing `/student/exams` data |
| **Board Prep / Concept Map / Pomodoro** | Keep mock; Pomodoro can actually work purely client-side today — low-effort win: functional timer with localStorage persistence, no backend needed |

---

### B5. Teacher portal — "calm control room"

Teachers get 35–40 min of lab time; every screen must answer "what do I do right now" fast. Design rules: **stat-first dashboards, tables with strong empty states, print-friendly outputs.**

**Remaining page specs**

| Page | Design |
|------|--------|
| **Reports** (new, replaces mock) | Three tabs: **① Class performance** — heatmap table, students × exams, cells colored by score % (red <40, amber 40–70, green >70), per-student average column, per-exam average row, section picker from `/my-sections`. **② English** — per-student accuracy/fluency/WPM table with 🟢🟡🔴 thresholds + class averages + "needs attention" callout list. **③ Tasks** — completion matrix (students × tasks, ✓/…/✗). Every tab: CSV export button top-right, print stylesheet for PTM handouts |
| **Question Bank** (new standalone page) | Two-pane: filter sidebar (class, subject, type, difficulty, **PYQ toggle**) + results list reusing the builder's question-card component. "Add question" opens the same modal as the exam builder, now with a PYQ section (year + source) when tagging. Header stat chips: my contributions / school total / global |
| **Dashboard** (polish) | Add a "needs grading" card (submissions with pending subjective reviews) linking straight into Exam Review — the highest-value single addition for daily use |

---

### B6. School Admin portal (rose) — "front office software"

Used by non-technical office staff. Design rules: **wizard-style flows, human error messages, everything printable.** The import→slips→reset loop already built is the model; remaining pages follow it.

| Page | Design |
|------|--------|
| **Dashboard** (polish) | Add per-class enrollment bar chart (data already returned), "never logged in" drill-down list (who needs a slip re-print), and this-week active count |
| **Feature toggles** (new, needs backend #6) | Simple switch list per feature (AI chat, leaderboard) with per-class scope rows; every switch shows consequence copy ("Students in Class 6 will not see the AI tutor") |
| **Reports for principal** (new, needs backend #6) | One printable page: enrollment, weekly active students, sessions held per teacher, exams conducted — designed to be printed and handed to the principal, A4 print stylesheet first |
| **Promotion wizard** (new, needs backend #5) | April-only guided flow, 3 steps with review screens: ① preview (every class → next class, Class 10 → passed out), ② Class 4→5 credential conversion (generates password slips to print), ③ confirm + section carry-forward. Big red irreversibility warnings; dry-run preview before commit |

---

### B7. Super Admin portal (slate) — "internal tool, dense and fast"

EduAI staff only. No hand-holding needed; favor density and speed.

| Page | Design |
|------|--------|
| **Schools** (built) | Add per-school usage columns (students, teachers, last activity) when backend #6 lands |
| **Content portal** (new, needs backend #7/#9) | ① NCERT upload: class+subject+book form → PDF drop-zone → ingestion job status list (queued/chunking/embedding/done with counts). ② Global question bank: same two-pane browser as the teacher page, scope=global, bulk CSV question import |

---

### B8. Lab In-charge portal (teal) — built ✅

Dashboard (school-wide live sessions), student roster + credential resets, teacher roster + password resets. No changes needed beyond keeping parity with any new print-slip styling.

---

### B9. Build order (frontend, after backend endpoints land)

1. **Shared components first** — `BadgeGrid`, `StreakCalendar` (calendar + trail variants), `ChallengeList`, `ProfileCard`, `PyqBrowser`: each themed by the same `batchColor` prop pattern as ExamCenter/ChatCenter, wired once, mounted three times.
2. **Batch 2 pages** (largest cohort, most pages) → re-theme for Batch 3 → simplify for Batch 1 (trail streak, medallion badges).
3. **Teacher Reports + Question Bank** (teacher-facing value).
4. **Home page lower halves** (all 3 batches) — swap mock subject grids for real data + challenge widgets.
5. **Admin extras** (toggles, principal report, promotion wizard) as their backends land.

---

*Companion docs: `IMPLEMENTATION_STATUS.md` (deep detail on everything in Part A1–A2), `EDUAI_REVISED_MVP_SPEC.md` (product scope).*
