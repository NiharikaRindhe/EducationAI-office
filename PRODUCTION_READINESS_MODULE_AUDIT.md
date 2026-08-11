# EduAI Module Completion and Production-Readiness Audit

**Last reviewed:** 10 August 2026  
**Product model:** School computer-lab platform used during teacher-controlled periods, normally once or twice per class each week.

## How to read this document

Two different completion measures are used:

- **Feature completeness** measures how much of the intended user-facing workflow exists.
- **Production readiness** measures whether the module is secure, reliable, tested, supportable and safe for real school/student data.

The percentages are engineering estimates from the current repository. A screen being present does not mean the workflow is production-ready.

## Overall status

| Measure | Estimate | Assessment |
|---|---:|---|
| Feature completeness | 65–70% | Most principal portals and workflows exist |
| Production readiness | 35–40% | Security, testing, licensing, auditing and operations remain incomplete |

**Current release decision:** Do not load real student data or launch commercially until all P0 requirements in this document are completed and tested.

## Priority definitions

- **P0 — Launch blocker:** Must be completed before real student data is used.
- **P1 — Pilot blocker:** Must be completed before the first live pilot school.
- **P2 — General-availability requirement:** Must be completed before wider rollout.
- **P3 — Improvement:** Valuable enhancement that can follow a controlled launch.

## Module summary

| Module | Feature completeness | Production readiness | Main priority |
|---|---:|---:|---|
| Public website and marketing | 80% | 45% | P1 |
| Authentication and account security | 70% | 40% | P0 |
| School onboarding | 75% | 55% | P1 |
| Plans and licensing | 45% | 30% | P1 |
| Super Admin | 70% | 45% | P0/P1 |
| School Admin | 75% | 55% | P1 |
| Teacher portal | 75% | 50% | P0/P1 |
| Student portal | 75% | 50% | P1 |
| Lab-period management | 45% | 30% | P1 |
| Exams and quizzes | 75% | 40% | P0 |
| AI functionality | 65% | 40% | P1 |
| Reports and analytics | 60% | 40% | P1 |
| Timetable and laboratory management | 70% | 55% | P1 |
| Imports and credentials | 75% | 45% | P1 |
| Security and tenant isolation | 45% | 25% | P0 |
| Audit logging | 30% | 20% | P1 |
| Deployment, backup and monitoring | 55% | 35% | P0/P1 |
| Automated testing and CI/CD | 10% | 5% | P0/P1 |
| Privacy and compliance | 5% | 5% | P1 |
| Accessibility and professional polish | 50% | 35% | P2 |

---

## 1. Public website and marketing

**Feature completeness:** 80%  
**Production readiness:** 45%

### Completed

- Landing, features and pricing pages.
- Login and school-access explanation.
- Responsive visual structure.
- Contact entry points.

### Remaining

- Standardize plan names as Starter, Standard and Enterprise. The application currently uses `school` for the middle plan.
- Connect public plan descriptions to the actual entitlement configuration.
- Remove unsupported promises such as individual subscriptions, offline desktop synchronization, parent WhatsApp/email reports and trials unless those features are implemented.
- Make company name, domain and contact email consistent.
- Add Privacy Policy, Terms of Service, security information and school sales information.

### Strict requirements

- **P1:** Every marketing promise must correspond to a working, tested capability.
- **P1:** Publish privacy and contractual documents before onboarding a school.

---

## 2. Authentication and account security

**Feature completeness:** 70%  
**Production readiness:** 40%

### Completed

- Email/password login.
- Student name-and-PIN login.
- Role-based portals and redirects.
- Disabled-account enforcement.
- Suspended-school enforcement on login and authenticated requests.
- Hashed PIN storage.
- Login event and last-activity recording.
- Ten-minute student idle logout.
- Basic login and PIN-attempt throttling.

### Remaining

- Replace persistent access-token storage in `localStorage` with a safer session architecture.
- Implement refresh-token rotation; refresh tokens are returned but currently unused by the frontend.
- Revoke existing sessions after password/PIN reset, deactivation or school suspension.
- Add absolute student session expiry, not only inactivity expiry.
- End all student sessions automatically when the teacher ends the lab period.
- Require first-login password change for staff.
- Add password-change and account-recovery workflows.
- Require MFA for Super Admin and preferably school administrators.
- Replace in-memory rate limiting with a shared persistent implementation.
- Protect PIN rosters behind an active, short-lived lab-session code.
- Add session/device management and suspicious-login alerts.

### Strict requirements

- **P0:** Prevent previous student sessions from surviving on shared lab computers.
- **P0:** Revoke sessions after credential resets and account deactivation.
- **P0:** Add Super Admin MFA.
- **P1:** Add automatic logout when the lab period ends.

---

## 3. School onboarding

**Feature completeness:** 75%  
**Production readiness:** 55%

### Completed

- Super Admin school-creation workflow.
- School details, code, contact and plan capture.
- Initial school-administrator provisioning.
- Initial feature entitlement provisioning.
- Credential presentation and optional email support.
- School activation/suspension.

### Remaining

- Make onboarding transactional rather than relying only on compensating deletes.
- Add contract dates, pilot dates, seat limits, AI quotas and renewal data.
- Add domain/server/deployment metadata.
- Add onboarding checklist and readiness state.
- Add email-delivery status and retry.
- Add school-admin first-login password change.
- Audit every onboarding action.
- Add safe onboarding retry and duplicate-school handling.

### Strict requirements

- **P1:** A partially failed onboarding must not leave orphaned users or entitlements.
- **P1:** Plan, limits and contract dates must be provisioned together.

---

## 4. Plans and licensing

**Feature completeness:** 45%  
**Production readiness:** 30%

### Completed

- School plan field.
- Starter, School and Enterprise package records.
- Feature catalogue and package-feature mapping.
- Per-school entitlement rows.
- Super Admin entitlement controls.
- API gates for several paid capabilities.
- Navigation hiding for several unavailable features.

### Remaining

- Rename `school` consistently to `standard` if Standard is the commercial name.
- Add contract start/end, pilot expiry, renewal and grace-period fields.
- Add active student, teacher, administrator, storage and AI limits.
- Add usage tracking, warning thresholds and hard-limit behavior.
- Add billing/reference/status information.
- Add immutable plan and entitlement change history.
- Prevent direct URL access to unlicensed client-only simulations.
- Replace fail-open entitlement behavior with a safe, explicit policy.
- Add Enterprise organization/multi-branch support if it is part of the product contract.

### Strict requirements

- **P1:** One approved commercial plan matrix must drive database records, Super Admin controls and public marketing.
- **P1:** Limits and expiry must be enforced by the API, not only hidden in the interface.

---

## 5. Super Admin

**Feature completeness:** 70%  
**Production readiness:** 45%

### Completed

- Platform overview.
- School list, onboarding and detail views.
- School activation/suspension.
- School administrator creation and reset.
- Feature entitlement management.
- Global student lookup and export.
- Global content and question-bank management.
- NCERT ingestion job management.
- AI settings and usage views.
- Support-ticket inbox.
- Audit-log viewer.
- School branding management.

### Remaining

- MFA and stronger privileged-session controls.
- Contract, renewal, trial and seat-usage dashboard.
- Per-school AI budgets and hard limits.
- Deployment version and school-server heartbeat.
- Worker, email and backup health.
- School session revocation.
- Formal school data export, offboarding, retention and deletion workflow.
- Security alerts and suspicious-login reporting.
- Approval/reason capture for suspension, deletion and high-risk bulk actions.
- Complete immutable audit coverage.
- Enterprise school-chain management where required.

### Strict requirements

- **P0:** Close database privilege-escalation paths and require MFA.
- **P1:** Add licensing, session revocation, operational health and complete audit controls.

---

## 6. School Admin

**Feature completeness:** 75%  
**Production readiness:** 55%

### Completed

- Dashboard and activity views.
- Student directory, filters and export.
- Individual and bulk student creation/import.
- Individual and bulk credential reset.
- Student activation/deactivation and class movement.
- Teacher directory, creation/import and password reset.
- Lab-incharge management.
- Classes, sections and teaching assignments.
- Lab and seat-capacity management.
- Timetable and timetable exceptions.
- School content library.
- Local feature preferences.
- Principal reports and promotion workflow.
- Branding and support tickets.

### Remaining

- Student and teacher profile editing.
- Teacher/lab-incharge deactivate/reactivate workflows.
- Withdrawn, graduated and archived account states.
- Admission number/external SIS identifier and employee-ID uniqueness.
- Duplicate detection and safe re-import.
- Import preview, confirmation, history, background processing and rollback.
- Automatically handle credentials when students cross the Class 4/5 login boundary.
- Staff assignment history.
- Safer handling of downloadable plaintext credential files.
- Full audit trail for imports, moves, resets and account changes.

### Strict requirements

- **P1:** Imports must be idempotent and duplicate-safe.
- **P1:** School staff must be able to correct and deactivate accounts without engineering support.

---

## 7. Teacher portal

**Feature completeness:** 75%  
**Production readiness:** 50%

### Completed

- Dashboard, assigned sections and student directory.
- Student drill-down and at-risk views.
- Teacher timetable and exceptions.
- Live-session start/end and participant monitoring.
- Announcements and tasks.
- Manual exam creation.
- Question bank and AI question generation.
- Exam publication, duplication and closure.
- Submission review, merit list and score review.
- Performance, English, task and PTM reports.
- Admit cards and support tickets.

### Remaining

- Complete lab-period activity-plan builder.
- Edit/delete draft exams and edit metadata/schedules.
- Transactional, idempotent exam publication.
- Result release controls and exam reopen/reschedule workflow.
- Rubric templates, question versioning and bulk feedback.
- Teacher-visible action history.
- Stronger reconnect/resume behavior during lab periods.

### Strict requirements

- **P0:** A teacher must never assign an exam to arbitrary students outside their authorized scope.
- **P0:** A teacher must never copy a private question from another school.
- **P1:** Teacher access must remain limited to assigned classes and sections.

---

## 8. Lab-period and live-session management

**Feature completeness:** 45%  
**Production readiness:** 30%

### Completed

- Teacher start/end live session.
- Student active-session discovery and join.
- Participant monitoring.
- Student raise-hand action.
- Class/section association.
- PIN roster during active sessions.
- Database support intended to limit active sessions per class.

### Remaining

- Lab-period activity plan containing exams, tasks, games, AI and simulations.
- Session code or QR code.
- Timetable occurrence linked to live session.
- Student attendance and device/seat tracking.
- Teacher lock-to-assigned-activity mode.
- Live student progress and connection state.
- Duplicate-login detection and force logout.
- Automatic session expiry and student-token revocation.
- Period timer and session summary.
- Cancelled, rescheduled and substitute-teacher workflows.
- Recovery after browser, network or server interruption.

### Strict requirements

- **P1:** Implement the full start-period → activities → monitoring → end-period lifecycle.
- **P1:** Ending a period must return every lab computer to a clean login state.

---

## 9. Student portal

**Feature completeness:** 75%  
**Production readiness:** 50%

### Completed

- Age-banded interfaces for Classes 1–4, 5–8 and 9–10.
- Home, tasks, exams, notes and syllabus.
- AI chat, games, daily challenges and PYQs.
- Leaderboard, badges, streak and profile.
- Science labs and simulations.
- Timetable and help surfaces.

### Remaining

- A focused “Today’s Lab” mode.
- Teacher-controlled activity availability and sequencing.
- Lab-period timer and attendance state.
- Device/seat identifier and duplicate-session warnings.
- Reliable reconnect/resume behavior.
- Automatic end-of-period logout and local data cleanup.
- Prevent direct-route access to unentitled features.
- Systematic accessibility work for younger learners.

### Strict requirements

- **P1:** Students should see only the current period’s relevant activities when session-lock mode is enabled.
- **P1:** No previous student information may remain on a shared computer.

---

## 10. Exams and quizzes

**Feature completeness:** 75%  
**Production readiness:** 40%

### Completed

- Manual and AI-assisted question creation.
- Question bank and multiple question types.
- Marks, rubrics and exam assignment.
- Section time windows.
- Question/option randomization.
- Answer autosave and resume.
- Objective grading and subjective AI-assisted grading.
- Teacher review and override.
- Merit lists, admit cards and basic proctoring signals.

### Remaining

- Validate individual student IDs against school and teaching scope.
- Validate question-bank IDs against global/own-school scope.
- Validate that saved answers belong to the submission’s exam.
- Enforce start, end and duration on every server operation.
- Persist an authoritative per-submission deadline.
- Auto-submit expired attempts.
- Make publication transactional and retry-safe.
- Move AI grading to a durable background queue.
- Add grading status, retry and failure recovery.
- Add result-release controls and complete score-change history.
- Store model, prompt and rubric versions for AI grades.

### Strict requirements

- **P0:** Fix assignment, question and answer ownership defects.
- **P0:** Enforce timing on the server.
- **P0:** AI failure must never lose or invalidate a submitted exam.

---

## 11. AI functionality

**Feature completeness:** 65%  
**Production readiness:** 40%

### Completed

- Local and cloud-compatible model support.
- Provider fallback and key rotation.
- Separate model tiers for chat, grading, generation and vision.
- AI tutor and image input.
- RAG/content retrieval.
- Question generation and subjective grading.
- Global/school content ingestion.
- AI usage logging.

### Remaining

- Per-school request/token/cost budgets.
- Durable queueing and provider-outage behavior.
- AI evaluation datasets and syllabus accuracy benchmarks.
- Prompt-injection and unsafe-output testing.
- Moderation and human escalation.
- Model/prompt version provenance.
- Student-data minimization.
- Provider and subprocessor disclosure.
- Operational dashboards and cost alerts.

### Strict requirements

- **P1:** Enforce quotas and document external AI data flows.
- **P1:** Teacher review must remain mandatory for assessment content and subjective scores.

---

## 12. Reports and analytics

**Feature completeness:** 60%  
**Production readiness:** 40%

### Completed

- Teacher performance, English and task reports.
- PTM-style summary.
- At-risk view.
- Principal report.
- Login/activity information.
- Merit list and Super Admin overview.
- AI usage view.

### Remaining

- Validate calculations against controlled known datasets.
- Replace sampled/client-calculated totals with proper aggregate endpoints.
- Date-range and academic-year filtering.
- Lab-period attendance and completion reporting.
- PDF/Excel exports where operationally needed.
- Define every metric and its denominator.
- Report authorization regression tests.
- Privacy-appropriate report access and retention.

### Strict requirements

- **P1:** Reports must be verified before schools use them for academic decisions.
- **P1:** Sampled metrics must never be presented as complete school totals.

---

## 13. Timetable and laboratory management

**Feature completeness:** 70%  
**Production readiness:** 55%

### Completed

- Computer-lab records and seat capacity.
- Recurring timetable slots.
- Teacher, section and lab association.
- Timetable exceptions and rescheduling.
- School, teacher and student timetable views.
- Capacity warnings.

### Remaining

- Prevent lab, teacher and section schedule collisions.
- Link timetable occurrences to live lab sessions.
- Start a live session directly from today’s period.
- Add holiday/cancellation and substitute-teacher states.
- Add computer inventory and maintenance status.
- Add lab utilization and attendance reports.
- Add notifications for upcoming/missed periods.

### Strict requirements

- **P1:** Prevent double-booking and connect scheduled periods to the live-session lifecycle.

---

## 14. Imports and credentials

**Feature completeness:** 75%  
**Production readiness:** 45%

### Completed

- CSV and XLSX parsing.
- Header normalization.
- Student and teacher row validation.
- Per-row error reporting.
- Sequential auth-account creation.
- Credential generation, printing and CSV download.
- Single and bulk credential reset.
- School scoping for core reset operations.

### Remaining

- File content/type verification and import row limits.
- Preview and confirmation before writes.
- Duplicate detection and unique external identifiers.
- Idempotent import jobs and safe retries.
- Import history, progress and rollback.
- Background processing for large imports.
- Credential-delivery and expiry policy.
- Formula-safe credential export and stronger plaintext warnings.
- Complete import/reset auditing.

### Strict requirements

- **P1:** Re-uploading the same source must not create duplicate accounts.
- **P1:** Partial failures must be visible, retryable and reconcilable.

---

## 15. Security and tenant isolation

**Feature completeness:** 45%  
**Production readiness:** 25%

### Completed

- API authentication and role middleware.
- School suspension checks.
- RLS enabled on many tables.
- School filters in many service queries.
- Password/PIN hashing.
- Helmet, CORS and Nginx TLS configuration.
- General/AI rate limits.
- Non-root API container.
- Secret files excluded from Git.

### Remaining and known blockers

- A school-admin RLS policy can permit updates to protected `user_profiles` fields and creates a privilege-escalation risk.
- Live-session RLS is too broad for writes.
- English-assessment read policy is missing a correct teacher-role restriction.
- Some service-role queries trust client-provided IDs without complete tenant validation.
- The service-role database client bypasses RLS, so every service query must enforce scope explicitly.
- Entitlement loading fails open.
- Browser token persistence increases shared-device and XSS risk.
- Security regression tests are missing.

### Strict requirements

- **P0:** Rewrite and test RLS for every table and operation.
- **P0:** Prove School A cannot access School B.
- **P0:** Prove students and teachers cannot exceed their role/class/section scope.
- **P0:** Review every service-role query accepting a client-controlled identifier.

---

## 16. Audit logging

**Feature completeness:** 30%  
**Production readiness:** 20%

### Completed

- Audit table and write helper.
- Super Admin audit viewer.
- Some cross-school student-directory audit events.
- Some exam score-review events.

### Remaining

- Audit school creation, update and suspension.
- Audit plan and entitlement changes.
- Audit account import, edit, activation and deactivation.
- Audit password/PIN resets without logging secrets.
- Audit student movement, promotion and withdrawal.
- Audit lab-session start/end and force logout.
- Audit exam creation, publication, submission and grading changes.
- Audit content upload/delete and data exports.
- Add request/correlation ID, source information and before/after values.
- Make records append-only and define retention/export rules.

### Strict requirements

- **P1:** Every high-risk administrative and academic action must be reconstructable from immutable, redacted audit records.

---

## 17. Deployment, backup and monitoring

**Feature completeness:** 55%  
**Production readiness:** 35%

### Completed

- Docker Compose stack.
- Multi-stage, non-root API container.
- Separate API and background worker.
- Nginx HTTPS and reverse-proxy configuration.
- Process/container health checks.
- Resource limits and graceful shutdown.
- Persistent volumes.
- Local nightly database dump.

### Remaining

- Fix `SUPABASE_JWT_SECRET` versus `JWT_SECRET` production configuration mismatch.
- Automate migrations instead of depending on manual Studio operations.
- Add required-variable and dependency readiness checks.
- Automate TLS certificate provisioning and renewal.
- Add encrypted off-site backups and retention controls.
- Regularly test restoration.
- Add centralized logs, metrics, error tracking and alerting.
- Add staging, deployment promotion and rollback.
- Track every school server’s version and heartbeat for separate installations.
- Automate safe remote updates.

### Strict requirements

- **P0:** A clean production deployment must start successfully and reproducibly.
- **P1:** Complete a successful backup restoration and demonstrate failure alerts and rollback.

---

## 18. Automated testing and CI/CD

**Feature completeness:** 10%  
**Production readiness:** 5%

### Completed

- TypeScript/build commands.
- ESLint configuration.
- Some manual PowerShell test runners.
- Production dependency audit currently reports no known production vulnerabilities.

### Remaining

- Unit tests.
- API integration tests.
- RLS and tenant-isolation tests.
- Role-permission matrix tests.
- Import and credential-reset tests.
- Complete exam lifecycle tests.
- Lab-period lifecycle tests.
- AI failure/fallback tests.
- Browser E2E tests for every role.
- Accessibility tests.
- Full-lab load and concurrency tests.
- CI/CD pipeline and release gates.
- Resolve current lint failures; the repository lint run reported 115 problems.

### Strict requirements

- **P0:** Automated security, RLS and exam-integrity tests.
- **P1:** Critical browser journeys, imports, lab periods and deployments must run in CI.
- **P1:** Zero lint errors and a reproducible production build.

---

## 19. Privacy and compliance

**Feature completeness:** 5%  
**Production readiness:** 5%

### Completed

- No meaningful formal compliance module is currently evident in the repository.

### Remaining

- Privacy Policy and Terms of Service.
- School data-processing agreement.
- Minor/student data processing basis and responsibilities.
- Data retention, correction, export and deletion procedures.
- Incident response and breach notification process.
- AI provider/subprocessor disclosure.
- Encryption, key rotation and access-review policies.
- Backup and disaster-recovery policy.
- Support SLA and security contact.
- Legal review appropriate to deployment locations.

### Strict requirements

- **P1:** Complete legal/privacy review and school agreements before processing real student information.

---

## 20. Accessibility and professional polish

**Feature completeness:** 50%  
**Production readiness:** 35%

### Completed

- Responsive components and several reusable UI primitives.
- Some ARIA labels and keyboard-compatible native controls.
- Loading, empty and error states in several modules.
- Age-specific student layouts.

### Remaining

- Full WCAG 2.2 AA audit.
- Keyboard-only and screen-reader verification.
- Contrast, focus, zoom and reduced-motion testing.
- Consistent error/loading/empty/success patterns.
- Remove placeholders and “coming soon” content from paid workflows.
- Correct inconsistent terminology and visible text quality.
- Browser/device compatibility testing.
- Staff usability testing and younger-student observation sessions.

### Strict requirements

- **P2:** Meet the agreed accessibility standard before general availability.

---

## Release gates

### Gate 1 — Before any real student data (P0)

- Rewrite and test RLS policies.
- Fix tenant, role, student, question and exam ownership validation.
- Enforce exam timing on the server.
- Correct shared-computer session security and session revocation.
- Add Super Admin MFA.
- Fix production Docker configuration and prove clean startup.
- Add automated security and exam-integrity regression tests.

### Gate 2 — Before the first pilot school (P1)

- Complete the teacher-controlled lab-period lifecycle.
- Add period-end logout and clean workstation handoff.
- Implement duplicate-safe imports and account editing/deactivation.
- Implement plan dates, limits, quotas and safe entitlement enforcement.
- Add comprehensive audit logging.
- Automate migrations, deployment, monitoring, backups and restoration.
- Add critical E2E and load tests.
- Complete privacy documents and school agreements.

### Gate 3 — Before wider commercial availability (P2)

- Central monitoring and safe remote upgrades for all school deployments.
- Full Super Admin operational controls.
- AI evaluation, budgets and cost controls.
- Complete data lifecycle and offboarding.
- Accessibility compliance.
- Incident response, security process and support SLA.
- Demonstrated reliability and load targets from the pilot.

## Recommended execution order

1. Security and tenant isolation.
2. Exam integrity and server-side timing.
3. Production deployment correction.
4. Authentication and shared-lab session lifecycle.
5. Automated P0 regression tests.
6. Plans, licensing and Super Admin controls.
7. Lab-period activity planning and live monitoring.
8. Imports, account lifecycle and audit coverage.
9. Monitoring, backup restoration and remote updates.
10. Privacy, accessibility and controlled pilot rollout.

## Current strengths

- Broad, role-specific portals already exist.
- School Admin has a strong operational foundation.
- Teacher exam, assignment, reporting and live-session workflows are substantially implemented.
- Student learning features cover multiple age groups.
- Timetable, lab-capacity and background-worker foundations are present.
- The application already recognizes school suspension and paid feature concepts.

## Current highest risks

1. RLS and privilege escalation.
2. Cross-tenant and cross-student access through service-role queries.
3. Exam timing, assignment and answer integrity.
4. Persistent sessions on shared computers.
5. Missing automated security tests.
6. Incomplete licensing and quota enforcement.
7. Sparse audit coverage.
8. Unverified production deployment and backup restoration.
9. Missing privacy/compliance framework for children’s data.

