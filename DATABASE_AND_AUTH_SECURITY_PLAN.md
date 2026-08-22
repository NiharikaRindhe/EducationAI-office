# Database & Authentication Security Plan

**Scope:** multi-tenant data isolation (Postgres/Supabase RLS + Node service layer) and authentication/session security, across Super Admin, School Admin, Teacher, Lab In-charge, and Student roles.

**Method:** every one of the 55 database tables was checked individually — RLS enabled, every policy read, cross-checked against what the Node API and frontend actually query. Authentication was reviewed end to end: login, PIN login, session lifetime, rate limiting, credential generation.

**Bottom line:** this codebase has had real, careful security work put into it already (the service-role-only-writes migration, the `students_taught_by()` narrowing, the session absolute-expiry guard, rate-limited login). The issues below are the gaps that work missed or didn't yet cover — not a rebuild.

---

## Part 1 — Database: Multi-Tenant Isolation

### 1.1 Fixed (migrations 179–183, not yet applied to a live database)

| # | Issue | Fix | Severity |
|---|---|---|---|
| 179 | `text_chunks`/`book_images` RLS predated school-scoped uploads — checked only `auth.role()`, not `school_id`. A direct query could read another school's uploaded content. | Scoped to `school_id is null (global) or school_id = jwt_school_id()`. | Critical |
| 180 → 181 | `student_badges`/`subject_progress`/`game_attempts` "teacher_read" policies had no role check at all — any same-school user, including another student, could read them. First fix (180) added the missing `jwt_role() = 'teacher'` check but left it scoped to "any teacher in the school"; 181 narrowed it further to "only the teacher's own assigned students," via the existing `students_taught_by()` helper — matching the tighter standard already set for AI-tutor chats and English assessments. | High |
| 182 | **`questions_via_exam_school_scope` let any authenticated user in a school — any role, any class, no assignment check — read the full `questions` table directly, including the `correct_answer` column, for every exam regardless of status (including drafts).** Same gap on `exams`, `proctoring_settings`, and `question_bank` (global + school). Verified the real app never needed this (the API already serves a sanitized, answer-stripped paper via service-role) and that the frontend has zero direct database access anywhere, so this was pure unused exposure. | **Critical** |
| 183 | School-uploaded source PDFs (`pdfs/school-{id}/...`) sat in a fully public storage bucket alongside content that legitimately needs public access (figures for `<img>` tags). Verified the raw PDF is only ever read server-side during ingestion — excluded that path prefix from public read with zero effect on the features that do need it. | Medium |

**Earlier in this engagement, also fixed (already pushed to `main`):**
- Cross-school student drill-down leak (`teacher.service.ts` — compared class/section by label instead of school, so a teacher's own "Class 7 Section A" matched a different school's "Class 7 Section A").
- Missing/inconsistent Super Admin audit logging (`createSchool`, `updateSchool`, `addSchoolAdmin`, question-bank/ingestion-job deletes, AI settings changes).
- One `supabaseAdmin` query pulling every school's data into Node before filtering in JS instead of filtering server-side (`schoolAdminExtras.service.ts`).

### 1.2 Confirmed solid, no action needed
- **All 55 tables have RLS enabled** — no gaps found in coverage.
- **Every school-scoped table's core policies correctly filter by `school_id`**, verified individually, not sampled.
- **Ownership-based policies** (`created_by = auth.uid()`, `teacher_id = auth.uid()`, `student_id = auth.uid()`) — used throughout for exams, tasks, submissions, chat — are safe by construction and were not flagged as false positives during the systematic sweep.
- **The Node API is the real write boundary**, by design: `20250101000159`/`160` already revoked all `authenticated`-role INSERT/UPDATE/DELETE at the database level, so every write goes through `supabaseAdmin` (service-role) in the Node service layer. This was spot-checked across 10+ services with no gaps found (the one exception, the drill-down leak above, has been fixed).
- **The frontend has zero direct database access** — confirmed no Supabase client, `createClient`, or `.from(...)` calls anywhere in `src/`. Every request goes through the Node API. This is what makes the RLS-tightening fixes above safe: nothing in the real app could have been relying on the broader access that was removed.
- **Broadly-visible-within-school tables that are correctly broad, not bugs**: `announcements`, `leaderboard_snapshots`, `class_sections`, `tasks` (metadata), `live_sessions` (metadata) — none carry answer keys or private per-student data, and broad within-school visibility is the intended behavior (a leaderboard, by definition, is meant to be seen).
- **Globally-shared reference tables** (`curriculum_chapters`, `games_catalog`, `feature_catalog`, `badges`, `packages`) are intentionally not school-scoped — same content for every school by design.

### 1.3 Still open — needs data review before a fix, not a blind schema change

| Issue | Why it's not fixed yet | Recommended path |
|---|---|---|
| No unique constraint on `student_profiles.roll_number` or `teacher_profiles.employee_id`, even scoped per school | These need a **trigger**, not a simple `unique()` — the columns live on `student_profiles`/`teacher_profiles`, but the school scoping (`school_id`) lives on the parent `user_profiles` row, so a plain column-level unique index can't express "unique within a school" on its own. Applying one blind also risks the migration itself failing if any duplicate already exists in production data — a loud, non-destructive failure, but still something a human needs to resolve first, not something to guess at. | 1) Query production for existing duplicate `(school_id, class_num, section, roll_number)` or `(school_id, employee_id)` combinations. 2) Resolve any found. 3) Add a `BEFORE INSERT OR UPDATE` trigger function that raises on a duplicate within the correct scope (a trigger, not a constraint, since it needs to join to `user_profiles` for `school_id`). |

### 1.4 Lower-priority, deferred by scope (not security-critical)
- `roll_number`/`employee_id` bulk-import validation could pre-empt the above at the application layer (reject duplicates on CSV import) even before the DB-level trigger exists — cheaper first step if a quick win is wanted before the trigger work.
- Auth email is globally unique across the whole platform (a Supabase Auth architectural constraint, not a bug) — two different schools can never onboard the same email address. Worth documenting for support/onboarding staff, not a code fix.

---

## Part 2 — Authentication & Session Security

### 2.1 Confirmed solid
- **JWT claims are set correctly and safely.** `custom_access_token_hook` stamps `app_role`/`school_id` onto every token via a `security definer` function, with execute revoked from everyone except `supabase_auth_admin` — the claims can't be forged from the client side. (Also found a subtle, already-fixed bug in this function: it used to test `profile IS NOT NULL`, which silently fails on a row with any NULL column under Postgres's row-comparison semantics — exactly true for `super_admin`, whose `school_id` is legitimately NULL. Fixed to use `FOUND` instead.)
- **Absolute session lifetime is enforced** (12h default, configurable), on top of Supabase's normally-infinite refresh — closes the "shared lab PC stays logged in forever" risk. Checked on every request, with a sane fail-open policy if the lookup itself fails (an infra hiccup doesn't mass-log-out a class mid-lesson).
- **Account deactivation and school suspension are both checked on every request**, not just at login — a suspended school's users are locked out immediately, not just prevented from a future sign-in.
- **Login failure messaging correctly distinguishes a wrong password from an outage** — avoids the failure mode where a real outage gets misread as "everyone's password broke" and floods support with reset requests.
- **Rate limiting is present and reasonably tuned**: login capped at 10/min per IP; PIN login capped at 8/min per IP+student combination.
- **PIN login (Batch 1, ages 6–10) has real defense in depth**, not just a short PIN: bcrypt-hashed, only usable while a live class session is active for that section (no PIN login outside class hours), rate-limited per-student, and the underlying session is established via a freshly rotated real password rather than a hand-minted token (GoTrue uses ES256, so a forged JWT wouldn't verify anyway).
- **Auto-generated passwords use a CSPRNG** (`crypto.randomBytes`), 12 characters over a 55-character alphabet that excludes visually-ambiguous characters for printed credential cards — reasonable entropy, sensible UX tradeoff.
- **CORS is locked to a single configured origin** with credentials, not wildcarded.

### 2.2 Gaps found

| Issue | Detail | Severity | Suggested fix |
|---|---|---|---|
| No server-side logout / session revocation on normal sign-out | `auth.routes.ts` has `/login`, `/pin-login`, `/pin-roster`, `/me` — no `/logout`. Session revocation (`revokeUserSessions`) exists but is only ever called from admin-triggered paths (suspension, password reset), not from a user clicking "log out." A token that's merely discarded client-side (e.g. `localStorage.clear()`) remains valid server-side until it naturally expires. | Medium | Add a `POST /auth/logout` route calling `supabaseAdmin.auth.admin.signOut(token, 'local')` (already used elsewhere in the codebase for the same purpose), and call it from the frontend's logout action. |
| No MFA on any role, including Super Admin and School Admin | Already tracked in this repo's own `PRODUCTION_READINESS_MODULE_AUDIT.md` as a known P0/P1 gap for the Super Admin tier specifically — confirmed still true. | High (for Super Admin/School Admin specifically — these accounts can suspend schools, reset any credential, and change platform-wide AI settings) | At minimum, TOTP-based MFA for `super_admin` and `school_admin` roles; teacher/student MFA is a much lower priority given the PIN/kiosk login model already in place for the youngest students. |
| No visible failed-login anomaly detection | Rate limiting stops rapid brute force, but there's no alerting/dashboard surfacing "this account had 40 failed login attempts across the last hour spread over many IPs" (slow/distributed brute force, or credential stuffing). | Low–Medium | Could be built cheaply on top of the existing `login_events` table (already records every login attempt outcome) — a scheduled query or a Super Admin dashboard panel, not a new data model. |

### 2.3 Explicitly not a bug, documented for awareness
- Batch 1 students never see a real password — only a 4-digit PIN, with the actual account password rotated to a random 20-character string on every login. This is intentional and correctly implemented, not a shortcut.
- `super_admin` has no `school_id` and is exempt from the suspension check by design — this is correct, since Super Admin manages schools rather than belonging to one.

---

## Part 3 — Priority Order for What's Left

1. **Apply migrations 179–183** to the live database (not yet done — see verification section below).
2. **MFA for Super Admin / School Admin** — highest-impact remaining gap; these are the accounts with platform-wide blast radius.
3. **`roll_number`/`employee_id` uniqueness** — needs a data check first, then a trigger (Section 1.3).
4. **Server-side logout endpoint** — small, low-risk, closes a real (if narrow) exposure window.
5. **Failed-login anomaly visibility** — nice-to-have, cheap to build on existing data, lowest urgency.

---

## Verification Plan

**Database (migrations 179–183):**
1. Apply via the normal migration pipeline (`supabase db push` or equivalent) against a staging environment first.
2. Re-run the same probes described when each was found:
   - Cross-school `text_chunks`/`book_images` query as an authenticated user of a different school → expect empty result.
   - Same-school student querying `student_badges`/`subject_progress`/`game_attempts` for a classmate → expect empty result (own rows still readable).
   - Student JWT querying `questions`/`question_bank` for any exam directly via PostgREST → expect empty result; confirm the real exam-taking flow (`/student/exams/:id/paper`) still returns a full, correctly sanitized paper.
   - Draft exam should be invisible to students entirely, published+assigned exams should still appear normally.
   - Fetch a `figures/` image URL and a `chat-uploads` URL → confirm both still load unauthenticated (unchanged behavior); confirm a `pdfs/` path returns access-denied.
3. Re-run the app's normal teacher/school-admin flows (dashboard, reports, student drill-down) to confirm nothing that depended on the old broader policies broke — expected to pass cleanly since all of it goes through the service-role API path, not direct RLS-gated queries.

**Authentication:**
1. Confirm a suspended school's already-logged-in user is rejected on their very next request, not just on their next login attempt.
2. Confirm PIN login still fails outside of an active live session, and succeeds within one.
3. Once implemented: confirm logout actually invalidates the token server-side (a re-used discarded token should fail `/auth/me`).
