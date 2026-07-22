# Portal Upgrade Plan — Super Admin · School Admin · Teacher (+ Student touchpoints)

Requested July 16, 2026. This plan maps every requested feature against what already exists,
then sequences the work into buildable phases. Legend: ✅ exists · 🟡 partial · 🆕 new.

---

## 0. Shared foundations (new infrastructure several features need)

These are built once and consumed by all three portals. Everything in later sections
assumes these exist.

### 0.1 Ticketing / issue system 🆕
One system serves "any issues" (super admin), "reported issues solving" (school admin),
and gives teachers/students a "Report a problem" button.

- **DB**: `support_tickets` (id, school_id, raised_by, raised_role, category
  [account|content|technical|ai|other], subject, body, status [open|in_progress|resolved|closed],
  priority, escalated_to_super boolean, created_at, resolved_at) +
  `ticket_messages` (ticket_id, sender_id, body, created_at) for the reply thread.
- **Routing rule**: student/teacher tickets → their School Admin. School Admin can resolve
  or **escalate** to Super Admin. Super Admin sees escalated + school-admin-raised tickets,
  filterable per school.
- **API**: CRUD under `/tickets` for each role scope; status transitions; message thread.
- **UI**: "Report an issue" button (teacher + student portals), Tickets inbox page
  (school admin + super admin) with filters, status chips, thread view.

### 0.2 AI usage metering 🆕
- **DB**: `ai_usage_log` (school_id, user_id, tier [chat|grading|qgen|vision], model,
  prompt_tokens, completion_tokens, created_at).
- **API lib**: wrap the single completion path in `api/src/lib/ai.ts` to log token counts
  (the OpenAI-compatible response already returns `usage`).
- **Aggregates**: `/super-admin/ai/usage?groupBy=school|day|tier`.

### 0.3 Platform settings (runtime AI config) 🆕
Models are currently env-only (`AI_CHAT_MODEL` etc. in `lib/env.ts`).
- **DB**: `platform_settings` key-value table (single row per key, super-admin writable).
- **Behavior**: `lib/ai.ts` reads model per tier from settings first, env as fallback —
  so the Super Admin can switch models without redeploying.
- **AI feature flags**: global kill-switches per tier (chat/grading/qgen/vision) +
  per-school overrides (school-level `features` table already exists ✅ — extend keys).

### 0.4 Timetable 🆕
School Admin builds it; teachers and students read it.
- **DB**: `timetable_slots` (school_id, section_id, day_of_week 1–6, period_no,
  starts_at, ends_at, subject, teacher_id).
- **Validation**: reject teacher double-booking (same teacher, same day+period) and
  section double-booking at insert time.
- **API**: school-admin CRUD; `GET /teacher/timetable` (own slots); `GET /student/timetable`
  (own section).

### 0.5 Login & activity tracking 🆕
- **DB**: `login_events` (user_id, school_id, role, at, method [password|pin]) — insert on
  every successful login. Add `last_seen_at` on `user_profiles`, updated by API middleware
  (throttled to once per 5 min).
- **Definition of "active now"**: `last_seen_at` within 15 minutes, plus live class
  sessions (already tracked ✅).

---

## 1. Super Admin portal

Current pages: Schools (create school + admin, activate/deactivate ✅), ContentPortal
(NCERT PDF upload + ingestion jobs ✅), question-bank endpoints ✅ .

| # | Request | Status | What to build |
|---|---|---|---|
| 1.1 | Active schools | 🟡 | New **Overview dashboard**: active/inactive school count, per-school health cards. `GET /super-admin/overview`. |
| 1.2 | Users per school | 🆕 | Per-school user counts by role (students/teachers/admins) on Schools page + overview. One aggregate query endpoint. |
| 1.3 | Any issues | 🆕 | Tickets inbox (foundation 0.1) — escalated + per-school view, open-count badge in sidebar. |
| 1.4 | Ticket raising | 🆕 | Super admin can also open tickets against a school (e.g. "your data import is malformed"). Same system. |
| 1.5 | Deactivate / delete schools | 🟡 | Deactivate ✅. Add **soft delete** (school hidden, logins blocked, data retained 90 days, then purge job) with a type-the-school-code confirmation modal. Reactivation ("renew") button for deactivated schools. |
| 1.6 | Books per class — add/delete, good UI | 🟡 | Rebuild ContentPortal as a **Library**: Class 1–10 × subject grid → book cards (cover, title, chapter count, ingestion status). Upload PDF (✅ exists), **delete book** (🆕 endpoint — also removes its RAG chunks), re-ingest/retry (✅), support non-NCERT books via a `source` tag (🆕 metadata field). |
| 1.7 | AI token usage + model switching | 🆕 | **AI Console page**: usage charts (tokens by day / school / tier, top consumers), current model per tier with dropdown to change (writes platform_settings, foundation 0.3), provider status ping. |
| 1.8 | AI features on/off | 🆕 | Same AI Console: global kill-switch per AI feature + per-school override matrix (extends existing school features ✅). |
| 1.9 | Questions and tests | ✅🟡 | Endpoints exist; give the question bank a proper page (filter by class/subject/chapter, bulk import, edit) and let super-admin-authored questions be visible to all schools' teachers ("central bank"). |

## 2. School Admin portal

Current pages: Dashboard 🟡, Classes & Sections ✅, Students (bulk import, credential slips,
resets ✅), Teachers (bulk import ✅), Lab In-charges ✅, Feature Toggles ✅,
Principal Report ✅, Promotion ✅.

| # | Request | Status | What to build |
|---|---|---|---|
| 2.1 | Totals: students, teachers | 🟡 | Dashboard rebuild: stat tiles (students, teachers, sections, active now) from one `GET /school-admin/overview` endpoint (replace current placeholder stats). |
| 2.2 | Per-section students + assigned teachers | 🟡 | Section table on dashboard: section → student count, class teacher, subject-teacher chips (data all exists ✅, needs the aggregate view). |
| 2.3 | Downloadable Excel (students + teachers) | 🆕 | `GET /school-admin/students/export.xlsx` + `/teachers/export.xlsx` (exceljs is already a dependency). One sheet per section; includes roll no, name, class-section, login email, status — **never passwords**. Download buttons on Students/Teachers pages. |
| 2.4 | Active logins & sessions | 🆕 | "Activity" panel: who's logged in now (foundation 0.5), running live class sessions with teacher + section, today's login count. `GET /school-admin/activity`. |
| 2.5 | Reported issues solving | 🆕 | Tickets inbox (foundation 0.1): resolve or escalate to Super Admin. |
| 2.6 | Activate / delete / renew students | 🟡 | Credential reset ✅. Add per-student (and per-teacher) **deactivate** (login blocked, row greyed), **reactivate**, **soft delete** with confirmation. `PATCH /students/:id/status`. |
| 2.7 | Proper bulk import (students + teachers) | 🟡 | Both exist ✅. Polish: downloadable .xlsx template, **dry-run preview** (show parsed rows + per-row errors before committing), duplicate detection report, import history log. |
| 2.8 | Timetable builder (needed for teacher 3.2/3.3) | 🆕 | Grid editor per section (periods × days): pick subject + teacher per cell, conflict warnings inline (foundation 0.4). Copy-week / copy-section helpers. |

## 3. Teacher portal

Current pages: Dashboard ✅ (`/teacher/dashboard` endpoint exists), Live Session ✅,
Students ✅, Assign Tasks ✅, Create Exam ✅ (manual, windows per section ✅),
Exam Review ✅, Reports ✅, Question Bank ✅.

| # | Request | Status | What to build |
|---|---|---|---|
| 3.1 | Assigned classes/sections on dashboard | ✅🟡 | `/my-sections` exists; surface as cards with student count + next period (once timetable lands). |
| 3.2 | Timings / timetable visibility | 🆕 | **My Timetable** page: weekly grid of own slots (read-only, from foundation 0.4). "Today's periods" strip on dashboard. |
| 3.3 | Timetable arranged by school | 🆕 | Covered by 2.8 (School Admin builds) + 3.2 (teacher views). |
| 3.4 | Exam scheduling — AI / manual, timed, MCQ/subjective | 🟡 | Manual builder + timed windows + MCQ/short/long ✅. Add **AI generation** (see 3.6). Add calendar-picker scheduling UI and show scheduled exams on the calendar (3.5). |
| 3.5 | Calendar view + tasks on calendar | 🆕 | **Calendar page** (month + week): merges timetable periods, exam windows, task due dates, and personal events (`teacher_calendar_events` table 🆕). Click a day → add task (existing task flow) or note. |
| 3.6 | Quizzes by AI / manual | 🆕 | **"Generate with AI"** in Create Exam and Question Bank: pick class/subject/chapter (curriculum_chapters ✅) + type (MCQ/short/long) + difficulty + count → `qgen` tier of `lib/ai.ts` (tier already defined, unused), **grounded in the school's ingested NCERT chunks (RAG)** so questions match the actual textbook. Teacher reviews/edits drafts before saving — nothing auto-publishes unreviewed. Plus a **Quick Quiz** mode: 5–10 MCQs auto-assembled for a section with one click. |

## 4. Student & Lab In-charge touchpoints (small, ride along)

- Student Home: "Today's periods" strip (reads `GET /student/timetable`); exams already shown ✅.
- Student + Teacher: "Report a problem" button → ticket (0.1).
- Lab In-charge dashboard: live sessions + active logins view (same data as 2.4).

---

## Build order

Each phase is shippable on its own; later phases consume earlier ones.

| Phase | Scope | Why this order |
|---|---|---|
| **A. Foundations** | Tickets, AI metering, platform settings, timetable schema, login tracking (0.1–0.5) | Everything else depends on these tables/endpoints. Backend-heavy, little UI. |
| **B. School Admin** | Dashboard rebuild, Excel exports, activity panel, student/teacher lifecycle, import polish, timetable builder, tickets inbox (2.x) | The school admin is operationally central — teachers can't see a timetable nobody can build. |
| **C. Teacher** | Dashboard upgrade, My Timetable, Calendar, AI exam/quiz generation, tickets (3.x) | Consumes B's timetable; AI qgen is independent and high-value. |
| **D. Super Admin** | Overview dashboard, per-school user counts, school delete/renew, Library rebuild, AI Console, tickets (1.x) | Consumes A's metering/settings; least day-to-day urgency. |

### Suggested database migrations (one per foundation)
1. `support_tickets` + `ticket_messages`
2. `ai_usage_log`
3. `platform_settings`
4. `timetable_slots` (+ conflict unique indexes)
5. `login_events` + `user_profiles.last_seen_at`
6. `teacher_calendar_events`
7. `user_profiles.status` (active|inactive|deleted) + `schools.deleted_at`

### Explicitly out of scope (unchanged from earlier decisions)
- Class 11–12 / Batch 4, parent portal (not in the product).
- The Phase-2 design-system work from the production-readiness plan runs orthogonally;
  new pages built here should use the shared components as they land.
