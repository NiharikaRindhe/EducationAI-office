# EduAI Current Issues and Remaining Production Work

**Reviewed:** 10 August 2026  
**Scope:** Current repository after the latest exam-security, RLS, Docker and school-branding updates.  
**Product model:** Different schools use EduAI in shared computer labs during teacher-controlled periods, normally once or twice per class each week.

## Current assessment

| Measure | Estimate | Meaning |
|---|---:|---|
| Feature completeness | 68–72% | Most major interfaces and basic workflows exist |
| Production readiness | 40–45% | Several P0 security/integrity items and most operational safeguards remain |

**Release status:** Not ready for real student data or commercial production deployment.

## Priority definitions

- **P0 — Launch blocker:** Must be fixed before any real student data is loaded.
- **P1 — Pilot blocker:** Must be fixed before the first live pilot school.
- **P2 — General-availability requirement:** Must be completed before wider commercial rollout.
- **P3 — Improvement:** Can follow a controlled pilot if risk is accepted.

## Confirmed improvements from the latest update

The following changes are present and compile successfully:

- Docker now supplies the required `SUPABASE_JWT_SECRET` to the API and worker.
- Exam question-bank copying is limited to global questions or the teacher's own school.
- Individual exam assignment validates students against the teacher's Class/section teaching scope.
- Saved answers must now reference a question belonging to the submission's exam.
- Exam duration is checked server-side when saving an answer.
- The primary school-admin-to-super-admin RLS privilege-escalation policy was removed.
- Direct student writes to `live_sessions` were removed.
- School branding is substantially implemented for both Super Admin and School Admin.
- School name/logo are included in the authenticated profile and portal sidebar.
- Frontend TypeScript checking passes.
- API TypeScript build passes.

These improvements close important defects, but they do not complete the P0 security phase.

---

# P0 — Launch blockers

## 1. RLS and direct PostgREST writes are still incomplete

The new migration states that all application writes go through the Node API, but several earlier authenticated write policies remain active.

### Remaining direct student writes

- `task_assignments_student_update_status`
- `exam_submissions_student_start`
- `exam_submissions_student_submit`
- `exam_answers_student_autosave`
- `exam_answers_student_update`
- `proctoring_events_student_insert`

These paths can bypass API validation. The most dangerous example is starting an exam submission: the original policy checks that `student_id = auth.uid()` but does not prove the exam was actually assigned to that student.

### Remaining direct teacher writes

- Announcement insert/update/delete policies.
- Task insert/update/delete and assignment-insert policies.
- Exam insert/update/delete policies.
- Other teacher-owned write policies not removed by the latest migration.

Some original insert policies validate the actor but do not adequately validate the row's `school_id`, section or target students.

### Required fix

Choose one consistent model:

1. **Recommended for this project:** All writes go through the API. Revoke `insert`, `update` and `delete` from `authenticated`, and remove unnecessary end-user write policies.
2. If direct Supabase writes are intentionally supported, rewrite every write policy with explicit role, tenant, ownership and `WITH CHECK` conditions.

Add automated tests proving direct REST writes cannot bypass API business rules.

## 2. Cross-student English-assessment read policy remains open

The original `english_attempts_teacher_read` policy remains active and does not require `jwt_role() = 'teacher'`. Another same-school authenticated role may satisfy the school condition and read assessment attempts.

### Required fix

- Drop the old policy.
- Add a teacher-only policy.
- Restrict teachers to students in their actual teaching assignments, not every student in the school.
- Add Student A versus Student B negative tests.

## 3. Teacher chat visibility remains too broad

The existing chat-session and chat-message teacher policies permit teachers to read chats for students across the whole school.

### Required fix

- Restrict teachers to students in sections/subjects they teach.
- Decide whether teachers should see complete AI conversations at all, or only safety/escalation events.
- Audit every teacher access to student chat history.

## 4. Complete RLS review is still missing

Only a subset of known write policies was changed. Every current and future table needs a role/operation matrix covering:

- Student
- Teacher
- School Admin
- Lab In-charge
- Super Admin
- Anonymous user
- Service role

### Required tests

- School A cannot read or modify School B.
- Student A cannot access Student B.
- Teacher A cannot access an unassigned section.
- School Admin cannot change protected role/tenant fields.
- Lab In-charge cannot access grades or assessment answers.
- Anonymous users cannot enumerate school/student data.

## 5. Exam-level closing time is not enforced during answer saving

The new deadline calculation uses:

- `started_at + duration_min`
- `exam_assignments.ends_at`

It does not use `exams.ends_at` when the assignment has no custom closing time.

### Required calculation

Use the earliest of:

```text
started_at + duration_min
assignment.ends_at ?? exam.ends_at
```

The deadline should be stored as an authoritative `deadline_at` on the submission so it cannot change unexpectedly after the attempt starts.

## 6. Expired exams are not automatically submitted

Expired attempts now reject new answer saves, but an abandoned attempt can remain permanently marked `in progress`.

### Required fix

- Add a background expiry/auto-submit job.
- Make auto-submit idempotent.
- Preserve all saved answers.
- Record the auto-submit reason and timestamp.

## 7. Task assignment still accepts unscoped student IDs

For individual task assignment, client-provided student IDs are returned without verifying school membership or teaching scope.

Class and batch task modes can also target students beyond the teacher's assigned sections.

### Required fix

- Apply the same authorization used by individual exam assignment.
- Validate every target student belongs to the school.
- Validate every target is in a section the teacher teaches.
- Reject the entire request when any target is invalid.
- Add cross-school and unassigned-section tests.

## 8. Exam publication is not transactional

Publishing currently writes proctor settings, assignments and exam status in separate operations. A failure can leave a draft with partial assignments/settings, and retries may create duplicates.

### Required fix

- Move publication to a database transaction/RPC.
- Add idempotency.
- Enforce unique exam/student assignments.
- Return a deterministic result for retries.

## 9. AI grading remains synchronous with submission

The submission is marked submitted and then grading runs in the request. A slow or failing AI provider can make the browser see a failed submission even though the exam was already submitted.

### Required fix

- Commit the submission first.
- Enqueue grading in a durable job queue.
- Return successful submission immediately.
- Track grading states and retry failures.
- Never allow an AI failure to lose a submission.

## 10. Shared-computer authentication remains unsafe

- Access tokens remain in `localStorage`.
- Refresh tokens are returned but not used.
- Closing/reopening the browser can restore the previous session.
- Credential reset does not explicitly revoke existing sessions.
- Student logout is based on inactivity, not the authoritative lab-period end.

### Required fix

- Implement a secure session/refresh architecture.
- Revoke all sessions after reset, deactivation or school suspension.
- Add absolute session expiry.
- End student sessions when the teacher ends the lab period.
- Clear all student-specific browser state during logout/startup.
- Require MFA for Super Admin.

## 11. Production migrations and RLS changes are not behaviorally tested

The migrations were reviewed statically but not demonstrated against a clean production-equivalent database with real role tokens.

### Required fix

- Start a clean database from all migrations.
- Seed two schools and every role.
- Execute positive and negative PostgREST tests.
- Run these tests automatically in CI.

---

# P1 — Required before the first pilot school

## 12. Lab-period lifecycle is incomplete

Live sessions exist, but the system does not yet provide a complete teacher-controlled period.

### Remaining functionality

- Create a lab-period activity plan.
- Attach exams, tasks, games, AI activities and simulations.
- Link the live session to the timetable occurrence and computer lab.
- Generate a short-lived session code/QR code.
- Record attendance.
- Show live progress and connection state.
- Lock students to assigned activities when required.
- Track device/seat identifiers.
- Detect duplicate logins.
- Force logout an individual computer/student.
- End the period and revoke every student session.
- Save a teacher-visible period summary.
- Support cancellation, rescheduling and substitute teachers.

## 13. PIN roster exposure needs stronger protection

The public PIN roster can expose student names/IDs while a session is active.

### Required fix

- Require an active session code, not only school/class/section values.
- Use short-lived, non-enumerable session identifiers.
- Rate-limit roster lookup.
- Return the minimum required student information.

## 14. Rate limiting is process-local

Login, PIN and AI limits use in-memory maps. They reset when the API restarts and are inconsistent across replicas.

### Required fix

- Use Redis or another shared persistent rate-limit store.
- Add escalating lockouts and alerts for repeated PIN failures.
- Keep limits appropriate for a whole school lab behind one NAT address.

## 15. Plans and licensing remain incomplete

Current entitlements cover feature flags but not the complete commercial lifecycle.

### Remaining work

- Rename the middle package consistently from `school` to `standard` if that is the approved commercial term.
- Define the authoritative Starter/Standard/Enterprise matrix.
- Add contract, pilot, renewal and grace-period dates.
- Add student, teacher, admin, storage and AI limits.
- Add plan usage and warning thresholds.
- Add hard API enforcement.
- Add billing/reference/status information.
- Add immutable plan/entitlement history.
- Prevent direct URL use of unlicensed client-only simulations.
- Replace fail-open entitlement behavior with an explicit safe policy.

## 16. School onboarding is not fully transactional

School, entitlements, Auth user and profile creation use separate operations and cleanup logic.

### Required fix

- Make the database portion transactional.
- Add idempotent retry and duplicate-school detection.
- Track onboarding status/checklist.
- Track credential-email delivery and retry.
- Audit the complete onboarding workflow.

## 17. Imports are not idempotent or duplicate-safe

CSV/XLSX import works, but re-uploading the same students or teachers can create duplicates because usernames include random disambiguators.

### Required fix

- Add admission number/external SIS ID and unique employee ID.
- Add upload preview and confirmation.
- Detect duplicate file rows and existing accounts.
- Process imports as durable background jobs.
- Add progress, history and safe retry.
- Provide rollback where safe.
- Add row limits and file-signature validation.

## 18. Account-directory lifecycle is incomplete

### Remaining work

- Edit student profile.
- Edit teacher profile.
- Deactivate/reactivate teachers and lab in-charges.
- Distinguish inactive, withdrawn, graduated and archived.
- Maintain teacher assignment history.
- Automatically issue correct credentials when crossing the Class 4/5 boundary.
- Add data correction/export/deletion workflows.

## 19. Plaintext credential handling needs controls

Credential CSV files contain passwords/PINs and may remain in Downloads on staff or shared machines.

### Required fix

- Prefer one-time printable slips or expiring activation credentials.
- Warn administrators about secure handling.
- Avoid retaining credential files server-side.
- Require first-login password change for staff.
- Audit credential generation/reset without logging secrets.

## 20. Audit coverage remains sparse

The audit viewer exists, but most sensitive actions are not comprehensively logged.

### Add audit events for

- School create/update/suspend/reactivate.
- Plan and entitlement changes.
- Admin/teacher/student/lab-incharge creation and edits.
- Imports, moves, promotions and deactivation.
- Credential resets and session revocation.
- Lab-period start/end and force logout.
- Exam create/publish/submit/grade/override.
- Content upload/delete.
- Data export and cross-school lookup.

Audit records should be append-only, redacted and include request/correlation IDs and relevant before/after values.

## 21. Deployment automation remains incomplete

The Docker JWT variable mismatch is fixed, but production deployment still needs:

- Automated migrations.
- Clean-machine deployment test.
- Required-variable validation.
- TLS certificate provisioning/renewal.
- Staging environment.
- Deployment promotion and rollback.
- Per-school version tracking for separate installations.
- Safe remote updates.

## 22. Backups are local and restoration is unverified

### Required fix

- Encrypt and copy backups off the school server.
- Define retention.
- Run scheduled restoration tests.
- Monitor backup success/failure.
- Document recovery time and recovery point objectives.

## 23. Monitoring and alerting are incomplete

### Required monitoring

- API/database/worker health.
- Request latency and errors.
- Queue depth and failed jobs.
- AI latency, errors and cost/usage.
- Disk and backup health.
- Authentication abuse and repeated PIN failures.
- Per-school server heartbeat and deployed version.
- Centralized structured logs and error tracking.

## 24. Automated testing and CI/CD are largely missing

### Current test status

| Check | Current result |
|---|---|
| Frontend TypeScript | Pass |
| API TypeScript build | Pass |
| API lint | Fail: 10 errors |
| Changed frontend-file lint | Fail: 29 errors |
| RLS integration tests | Missing |
| API integration tests | Missing |
| Browser E2E tests | Missing |
| Load tests | Missing |
| CI/CD pipeline | Missing |

### Required tests

- Unit tests for business rules.
- API integration tests.
- RLS/tenant isolation tests.
- Full exam lifecycle tests.
- Import/reset tests.
- Lab-period tests.
- AI failure/fallback tests.
- Browser E2E tests for every role.
- Full-lab concurrency/load tests.
- Accessibility tests.

Security and isolation failures must block deployment.

## 25. Privacy and compliance framework is missing

Because the platform processes children's information, complete:

- Privacy Policy and Terms of Service.
- School data-processing agreement.
- Student/minor data-processing responsibilities.
- Data retention, correction, export and deletion rules.
- Incident response and breach-notification procedure.
- AI provider/subprocessor disclosure.
- Access review, encryption and key rotation policies.
- Support SLA and security contact.
- Legal review for every deployment region.

---

# P2 — Required before wider commercial rollout

## 26. Reporting accuracy needs formal validation

- Verify every report against controlled datasets.
- Replace sampled/client-derived totals with aggregate endpoints.
- Add academic-year and date-range filters.
- Add lab attendance/completion reports.
- Define metric names, formulas and denominators.
- Add report authorization tests and appropriate exports.

## 27. Accessibility is not verified

- Perform a WCAG 2.2 AA audit.
- Test keyboard-only use, screen readers, zoom and contrast.
- Verify age-appropriate controls for Classes 1–4.
- Add reduced-motion support where needed.
- Make loading, error, empty and success states consistent.

## 28. School-logo file validation should inspect actual content

The new branding service correctly restricts declared MIME types and rejects SVG, but it trusts the upload's `file.mimetype`.

### Remaining hardening

- Validate PNG/JPEG/WEBP magic bytes.
- Decode the image before publishing it.
- Optionally normalize/re-encode uploads.
- Add image dimension limits.
- Clean orphaned objects after failed database updates.

## 29. Public marketing does not match the current product

The site advertises features not evident in the application, including individual subscriptions, offline desktop synchronization and parent reports.

### Required fix

- Remove unsupported claims or implement them.
- Align plan names, features, pricing and limits with the commercial contract.
- Standardize company names, domains and contact addresses.

## 30. Teacher/student workflow polish remains

### Teacher

- Edit/delete draft exams.
- Result release controls.
- Reopen/reschedule workflow.
- Rubric templates and question versioning.
- Bulk feedback and teacher-visible action history.

### Student

- Focused “Today's Lab” screen.
- Period timer and assigned activity order.
- Reliable reconnect/resume.
- Clear completion state.
- Cleaner shared-PC handoff.

---

# Current code-quality issues

## API lint errors

The API lint command currently reports 10 errors, including:

- Unused error-handler parameter.
- Explicit `any` types.
- Useless assignments in English/grading services.
- Namespace-style type declaration.

## Frontend lint issues in changed files

The changed frontend files currently report 29 lint errors, including:

- Many unused Sidebar icon imports.
- Unused `logoIcon` property.
- Synchronous `setState` inside effects.
- Fast-refresh violations in `AuthContext`.
- Existing load effects in Super Admin School Detail.

These do not all represent production failures, but the release gate should be zero lint errors.

---

# Required implementation order

## Step 1 — Finish P0 security

1. Remove/rewrite all remaining authenticated write policies.
2. Correct English and chat read policies.
3. Add comprehensive RLS tests.
4. Fix task assignment authorization.
5. Fix exam-level deadlines and add authoritative `deadline_at`.
6. Make exam publication transactional.
7. Queue AI grading.
8. Correct shared-computer session storage/revocation.

## Step 2 — Reach pilot readiness

1. Complete lab-period lifecycle and end-period logout.
2. Implement licensing dates, limits and quotas.
3. Make imports duplicate-safe and auditable.
4. Complete staff/student account lifecycle.
5. Add monitoring, off-site backups and restore testing.
6. Add CI, integration and E2E testing.
7. Complete privacy/legal documentation.

## Step 3 — Reach general availability

1. Validate reporting accuracy.
2. Complete accessibility work.
3. Add remote deployment/version management.
4. Complete AI evaluation and cost controls.
5. Correct public marketing and commercial documentation.
6. Run a controlled pilot and resolve operational failures before expansion.

---

# Release gates

## Gate A — Before real student data

- No open P0 security findings.
- All RLS and service-role isolation tests pass.
- Exam timing and ownership are enforced server-side.
- Shared-computer sessions are safely cleared and revocable.
- Production deployment starts from a clean environment.

## Gate B — Before first pilot school

- Complete lab-period workflow.
- Duplicate-safe imports and account lifecycle.
- Licensing and quota enforcement.
- Comprehensive audit coverage.
- Automated migration, monitoring, backup and restore.
- Critical browser E2E and load tests.
- Signed privacy and school data agreements.

## Gate C — Before general availability

- No open P0/P1 defects.
- Accessibility target met.
- Reporting validated.
- Central monitoring and safe remote updates operational.
- Security/incident/support processes documented and exercised.
- Pilot reliability targets achieved.

## Final conclusion

The latest changes meaningfully improve the product, especially exam scoping, answer ownership, Docker startup and school branding. The most urgent remaining work is still security: completing the RLS lockdown, closing cross-student reads, validating task targets, finishing exam deadline/publication behavior and securing sessions on shared lab computers. These items must be completed and automatically tested before the platform handles real school data.

