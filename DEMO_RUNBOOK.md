# EduAI — Demo Run-Book

**Purpose:** a scripted walkthrough that only visits screens with real data.
The product is ~60% production-ready; this document is how you show the 60%
without wandering into the 40%.

Everything below was verified end-to-end on 13 August 2026.

---

## 1. Start the stack (in this order)

```bash
# 1. Docker Desktop must be RUNNING first — check the whale icon in the tray.
#    The local Supabase stack lives inside it.
cd EDU_UI
npx supabase start            # ~20s. Postgres, GoTrue, PostgREST, Storage.

# 2. API
cd api && npm run dev         # http://localhost:4000  — wait for "listening"

# 3. Frontend (new terminal)
cd .. && npm run dev          # http://localhost:5173
```

**Pre-flight check — run this before the room fills up:**

```bash
curl -s -o /dev/null -w "supabase %{http_code}\n" http://127.0.0.1:54321/rest/v1/ -H "apikey: x"
curl -s -o /dev/null -w "api      %{http_code}\n" http://localhost:4000/health
curl -s -o /dev/null -w "frontend %{http_code}\n" http://localhost:5173/
```

All three must be `200`. If Supabase is `000`, Docker Desktop has stopped —
this happened repeatedly during development. Restart Docker, wait 30s, re-check.

---

## 2. Logins

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@eduai.local` | `SmokeTest123!` |
| School Admin | `e2e-admin@eduai.local` | `Test-Admin-1` |
| Teacher (Mr. Rao) | `mr.rao.5d2a15@sps.delhi.01.eduai.local` | `SmokeTest123!` |

**Demo school:** Springfield Public School (`SPS-DELHI-01`) — 35 students,
12 teachers, 16 sections. All names are realistic; no test-account debris.

> **Do not log in more than ~10 times in a minute.** Rate limiting is now
> shared and persistent (it survives restarts by design), so a burst of logins
> during setup will lock you out for the rest of the minute.

---

## 3. The safe demo path

### Super Admin — platform view
1. **Overview** — 4 schools, live student/teacher counts.
2. **Schools** → open Springfield → school detail, entitlements, admins.
3. **Schools → New** — the 4-step onboarding wizard. Walk the steps; you can
   stop before submitting.
4. **Audit Log** — shows real recorded actions (credential resets, session
   revocations, entitlement changes).

### School Admin — running a school
1. **Students** — 35 students, search, filters, bulk selection.
2. **Teachers** — 12 teachers.
3. **Class Sections / Teaching Assignments** — 16 sections, 15 assignments.
4. **Principal Report** — enrollment, weekly active, sessions per teacher.
5. **Branding** — upload a school logo; it appears in the sidebar immediately.

### Teacher (Mr. Rao) — the classroom
1. **Dashboard** — classes taught, section count, students, tasks, exams.
2. **Exams** — 9 exams. Open one to show the builder and question bank.
3. **Reports** — ⚠️ **the dropdown opens on Class 2-A, which is empty.
   Switch to Class 7-B.** That is the only section with exam data:
   - *Performance Heatmap* — 3 students × 3 exams, real scores
   - *Task Matrix* — 3 students × 3 tasks
   - *English Assessments* — renders, but shows dashes (see §4)
4. **Question Bank** — 9 questions.
5. **Timetable** — 3 slots.

### Student — pick the class deliberately
Content only exists for **Classes 1–4**. Use a Class 1–4 student for anything
student-facing:
- **Games** — 85 games across Classes 1–4. This is the strongest visual demo.
- **Syllabus / Subjects** — chapters exist for Classes 1–4.
- **Badges, Streak, Leaderboard, Daily Challenges** — all populated.

---

## 4. What to avoid, and what to say if asked

Be straight about these. They are all known and tracked.

| Area | Reality | If asked |
|---|---|---|
| **Classes 5–10 content** | No chapters, no games. Class 10 has nothing at all. | "Content sourcing is a parallel workstream — the platform is built, the NCERT material for the upper classes is being licensed and ingested." |
| **AI tutor for Classes 3,4,5,8,10** | No indexed content, so answers won't be grounded. | Demo the tutor on **Class 6 Maths, Class 7 Science, or Class 9** — those have 356 / 240 / ~690 indexed chunks. |
| **English Assessments tab** | Backend exists, no student-facing UI, zero recorded attempts. Shows dashes. | "The reporting is wired; the student-facing practice screen is the next build." |
| **Pomodoro (Class 9–10)** | Timer works; nothing is persisted between visits. | Don't present it as tracked study history. |
| **Show & Tell (Class 1–4)** | "Coming Soon" ribbon. | Skip it. |
| **Concept Map (Class 9–10)** | Only 2 maps exist (Light Reflection, Triangles). | Show one, don't browse. |
| **Lab-period / live session** | Roughly half-built — no attendance, no session codes, no period timer. | "Scheduled work; the timetable and live-session foundations are in." |

---

## 5. Fixed for this demo (13 Aug)

- **Teacher Reports** — was completely dead (5 defects: wrong endpoint, wrong
  response shape, wrong field names everywhere, a dead CSV button, and every
  error swallowed into an empty state). All three tabs now render real data.
- **Login errors** — an outage used to be reported as *"Invalid email or
  password"*. If the stack hiccups mid-demo you now get an honest
  "temporarily unavailable" instead of looking like you forgot the password.
- **Pomodoro** — no longer opens claiming 70 minutes of study that never
  happened.
- **Demo roster** — 13 accounts named `ZZ ExamTest…` / `ZZ Teacher…` renamed to
  realistic names; a duplicate "Dev Kumar" on the same roll number split into
  two students; fixture roll numbers (`e7`, `g1`) replaced with class numbering.

---

## 6. If something breaks live

| Symptom | Cause | Fix |
|---|---|---|
| Every page empty, login fails | Docker/Supabase stopped | Restart Docker Desktop, wait 30s |
| "Sign-in is temporarily unavailable" | Backend down (**not** a wrong password**)** | As above |
| `429` / "Too many attempts" | Login rate limit | Wait 60 seconds |
| A report shows a warning triangle | Genuine API error, now surfaced | Switch section; note it and move on |
| Blank white screen | Frontend crash | Check the browser console; reload |

**Have a backup.** If Docker has been unstable, record a screen capture of the
walkthrough beforehand and keep it open in a second tab.
