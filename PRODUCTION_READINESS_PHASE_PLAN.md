# EduAI Production-Readiness Phase Plan

**Created:** 10 August 2026
**Companion to:** `PRODUCTION_READINESS_MODULE_AUDIT.md`

The audit says *what* is incomplete. This document says *in what order to fix it, and why that order*.

## How this plan differs from the audit's execution order

The audit lists "automated P0 regression tests" as step 5, after the RLS rewrite. This plan moves the **test harness before the security rewrite**, for one reason: you cannot safely rewrite row-level security without a way to prove the rewrite worked. Rewriting 20+ tables' policies by hand and verifying by clicking is how isolation bugs survive to production. The harness is a few days; it de-risks every phase after it.

Everything else follows the audit's priorities.

## Findings verified against the code (10 Aug 2026)

These were spot-checked directly, not taken on trust:

| Finding | Status | Evidence |
|---|---|---|
| RLS privilege escalation on `user_profiles` | **Confirmed** | Policy `user_profiles_school_admin_school` is `FOR ALL` scoped only by `school_id`; nothing restricts the `role` column. A school admin can set their own `role='super_admin'` via direct PostgREST and receive a super-admin JWT on next login. |
| Production JWT secret mismatch | **Confirmed** | `docker-compose.yml` passes `JWT_SECRET` to the API; `api/src/lib/env.ts` requires `SUPABASE_JWT_SECRET`. The production API exits on boot. |
| Exam assignment ownership defect | **Confirmed** | `exam.service.ts` `resolveAssignments()` — `mode: 'students'` maps client-supplied `studentIds` straight to rows with no scope check, while `class` and `sections` modes scope correctly. |
| Lint failures | **Confirmed** | 115 problems (110 errors, 5 warnings). |
| No test frameworks | **Confirmed** | Zero test dependencies in either `package.json`. |

---

## Phase 0 — Unblock the work (3–5 days)

Small, high-leverage items that everything else depends on. Nothing here is a feature.

| # | Task | Why first |
|---|---|---|
| 0.1 | Fix `SUPABASE_JWT_SECRET` / `JWT_SECRET` mismatch | The production stack cannot start at all until this is fixed. Every deployment task is blocked behind it. |
| 0.2 | Prove a clean `docker compose up` on a blank machine | Until this passes, no deployment finding is trustworthy. |
| 0.3 | Add test infrastructure — Vitest (unit/integration), Playwright (E2E), and a seeded test database | Phase 1 is unverifiable without it. |
| 0.4 | Write the **tenant-isolation test harness**: fixtures for School A / School B with users in every role | This is the tool Phase 1 is measured with. |
| 0.5 | Fix the 115 lint errors, add lint to the build | Cheap now; a permanent noise floor that hides real problems if left. |

**Exit criteria:** Clean production stack boots on a fresh machine. `npm test` runs. Lint is zero. A test can assert "School A user cannot read School B data" — and currently **fails**.

---

## Phase 1 — Security and data integrity (P0) — 3–4 weeks

The launch blockers. No real student data touches the system until this phase is signed off.

### 1a. Rewrite row-level security

- Rewrite `user_profiles` policies so a school admin **cannot modify `role`, `school_id`, or `id`** on any row. Split the blanket `FOR ALL` into explicit SELECT / INSERT / UPDATE / DELETE policies with proper `WITH CHECK` clauses.
- Audit every table's policies the same way: does `WITH CHECK` exist, and does it constrain the columns that matter?
- Narrow the over-broad `live_sessions` write policy.
- Fix the missing teacher-role restriction on the English-assessment read policy.

### 1b. Close service-role trust gaps

The API uses the service-role key, which **bypasses RLS entirely**. Every service query that accepts a client-supplied ID must validate ownership explicitly. Sweep all 36 services; the known one is exam assignment.

### 1c. Exam integrity

- Validate `studentIds` against the teacher's authorized sections before assignment (`exam.service.ts`).
- Validate question-bank IDs are global or own-school before copying.
- Validate saved answers belong to the submission's exam.
- Enforce start/end/duration **server-side** on every operation; persist an authoritative per-submission deadline; auto-submit expired attempts.
- Ensure an AI grading failure can never lose or invalidate a submitted exam.

### 1d. Lock it in with tests

Every fix above gets a regression test. The suite must prove:
- School A cannot read or write School B's data, on every table.
- A school admin cannot escalate their own role.
- A teacher cannot reach students, questions, or exams outside their scope.
- Exam timing cannot be bypassed by a crafted request.

**Exit criteria:** All isolation and integrity tests pass. A deliberate attempt to escalate privilege via direct PostgREST fails.

---

## Phase 2 — Shared-computer session security (P0) — 1.5–2 weeks

School lab computers are shared by 40 students a day. This is a distinct threat model from normal web auth.

- Revoke sessions on password/PIN reset, deactivation, and school suspension.
- Add absolute session expiry, not just idle timeout.
- End every student session automatically when the teacher ends the lab period.
- Move access tokens out of `localStorage`, or scope them so nothing survives a period handoff.
- Replace in-memory rate limiting with a shared/persistent store (it currently resets on deploy and doesn't work across API replicas).
- Add Super Admin MFA.
- Require first-login password change for staff.

**Exit criteria:** After a period ends, no previous student's data is reachable on that machine. Resetting a credential kills existing sessions immediately.

---

## Phase 3 — Deployment you can trust (P0/P1) — 1.5–2 weeks

- Automate migrations (no manual Studio steps).
- Startup checks for required env vars and dependency readiness.
- Automate TLS provisioning and renewal (certbot).
- Encrypted **off-site** backups — the nightly dump currently stays on the same box, which is not a backup.
- **Perform and document a real restore.** An untested backup is not a backup.
- Centralized logs, error tracking, and alerting.
- Staging environment plus deployment promotion and rollback.
- CI pipeline running the Phase 1 test suite as a merge gate.

**Exit criteria:** A deploy is one command, a restore has been executed successfully at least once, and a failure raises an alert someone actually receives.

---

## Phase 4 — Pilot blockers (P1) — 5–7 weeks

Everything needed before a real school uses this in a real lab period.

### 4a. Lab-period lifecycle (the biggest product gap — 45% complete)
Full `start period → activities → monitoring → end period` flow: activity plan, session code, timetable-to-session link, attendance, live progress, duplicate-login detection, period timer, session summary, and clean handoff on end.

### 4b. Licensing made real
Contract/pilot dates, seat and AI limits, usage tracking with thresholds, hard-limit behaviour, and entitlement change history.

**Also revisit the deliberate fail-open in `entitlements.ts`.** That was chosen to favour availability — a DB blip shouldn't lock every school out of every paid feature. But for a licensing system that decision belongs to the business, not to a code comment. Options: fail-open with alerting (current), fail-closed, or serve the last-known-good cache. Pick one explicitly.

### 4c. Imports and account lifecycle
Idempotent, duplicate-safe imports; preview before write; import history and rollback; background processing for large files; profile editing and deactivation without engineering help; handle the Class 4→5 login-method boundary.

### 4d. Audit logging (30% → complete)
Every high-risk action reconstructable: school/plan/entitlement changes, account changes, credential resets, promotions, session start/end, exam publication and grade changes, exports. Append-only, with before/after values and correlation IDs.

### 4e. Content — the non-engineering blocker
**Only 10 of 33 class/subject slots have indexed content. Classes 3, 4, 5, 8 and 10 have none.** Class 10 is the highest-value year and its AI tutor, exam generator and PYQ features have nothing to ground on.

This needs no code — the ingestion pipeline works. It needs someone sourcing and uploading real NCERT PDFs. **Start this in parallel on day one of Phase 0**; it has the longest lead time of anything in this plan and blocks the pilot regardless of engineering progress.

### 4f. Privacy and compliance (5% complete)
Privacy Policy, Terms, school data-processing agreement, retention/deletion procedures, AI subprocessor disclosure, incident response. Needs legal review, so **start early** — it runs on someone else's clock.

**Exit criteria:** One school can run a full week of real lab periods without engineering intervention.

---

## Phase 5 — General availability (P2) — 4–6 weeks

- Accessibility: WCAG 2.2 AA audit, keyboard and screen-reader verification.
- Report verification against known datasets; replace sampled totals with real aggregates.
- AI evaluation datasets, per-school budgets, cost alerts, prompt-injection testing.
- Full data lifecycle: export, offboarding, retention, deletion.
- Batch 2 (Classes 5–8) virtual labs — currently absent entirely.
- Fix the 10 games missing `chapter_ref`.
- Paginate `/super-admin/schools` and `/overview`.
- Load testing at realistic multi-school concurrency.

---

## Timeline

| Phase | Duration | Cumulative |
|---|---|---|
| 0 — Unblock | 3–5 days | ~1 week |
| 1 — Security & integrity | 3–4 weeks | ~5 weeks |
| 2 — Session security | 1.5–2 weeks | ~7 weeks |
| 3 — Deployment | 1.5–2 weeks | ~9 weeks |
| 4 — Pilot blockers | 5–7 weeks | ~15 weeks |
| 5 — GA | 4–6 weeks | ~21 weeks |

**Roughly 4 months to a defensible pilot, 5–6 months to general availability**, for one full-time developer. Two developers could parallelise Phases 2 and 3 against Phase 1, and most of Phase 4's sub-tracks are independent of each other.

These are estimates from module scope, not measured velocity. Treat Phase 0 as the calibration run: if it takes twice as long as planned, scale the rest accordingly.

## Two things to start immediately, outside the phases

Both have long lead times owned by people other than the developer, and both block the pilot no matter how fast engineering moves:

1. **Content sourcing** — real NCERT PDFs for Classes 3, 4, 5, 8, 10. No code required.
2. **Legal/privacy review** — you are processing children's data.

## The one-line summary

The software is the most finished part of this product. **Security, content, and operations are what stand between a good demo and a school that can actually use it** — and only one of those three is fixed by writing more features.
