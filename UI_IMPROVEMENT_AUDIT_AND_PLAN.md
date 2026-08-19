# EduAI UI Improvement Audit and Implementation Plan

**Prepared:** 11 August 2026  
**Product stage:** Development and testing  
**Data rule:** Use fictional data only. Do not enter real student, teacher, parent, or school data until the production-data release gates in this document are completed.

## 1. Executive Summary

EduAI already has a visually attractive public website, age-specific student experiences, separate portals for each role, shared navigation, reusable tables, and several useful loading and empty states. The UI is nevertheless not ready for a real-school pilot.

The most serious UI risks are operational rather than cosmetic:

1. Exam answers can appear saved even when the server did not receive them.
2. Public plan names, features, prices, and promises do not match the internal entitlement model or the intended Starter, Standard, and Enterprise packages.
3. Teacher, School Admin, Super Admin, and Lab In-charge portals do not have a proper responsive navigation system.
4. Some virtual labs hide or compress important controls on smaller lab monitors.
5. Remote Google fonts and Material Symbols can break on restricted school networks.
6. API failures are frequently presented as legitimate empty or zero-data states.
7. Accessibility is incomplete across forms, dialogs, tables, typography, status feedback, and keyboard navigation.
8. The testing environment has no persistent warning preventing real-data entry.
9. The frontend development/build environment is not currently reproducible, and the available static build is stale.

The immediate goal should be **testing-ready UI**, followed by **controlled-pilot UI**, and only then **production UI**.

---

## 2. Severity Definitions

| Priority | Meaning | Release impact |
|---|---|---|
| P0 | Data-loss, unusable workflow, contractual/trust problem, or major lab failure | Must be fixed before a school pilot |
| P1 | Serious usability, accessibility, recovery, or responsive defect | Must be fixed before production and preferably before pilot |
| P2 | Consistency, refinement, convenience, or long-term maintainability | Can follow the first controlled pilot if documented |

---

## 3. Supported Environments to Define

The product currently has no explicit UI support matrix. Establish and test the following baseline:

| User/context | Required viewport | Input method | Network condition |
|---|---:|---|---|
| Student computer lab | 1024×768 minimum | Keyboard and mouse | Normal, slow, intermittent |
| Student computer lab | 1366×768 common target | Keyboard and mouse | Normal and shared cold start |
| Teacher laptop | 1024×768 minimum | Keyboard, mouse, touchpad | Normal and intermittent |
| School Admin laptop/tablet | 768×1024 minimum | Touch and keyboard | Normal |
| Super Admin | 1280×720 minimum | Keyboard and mouse | Normal |
| Public website | 320px–1920px width | Touch, keyboard, mouse | Mobile and desktop connections |

Every release should test Chrome and Edge versions supported by the schools. At least one test must simulate 25–40 computers loading the application simultaneously.

---

## 4. P0 — Strictly Required Before a School Pilot

### UI-001: Reliable exam answer saving and submission

**Affected module:** Student Exams  
**Current status:** Critical and incomplete  
**Risk:** A student can be told that answers save automatically even though the save request failed.

Current weaknesses:

- Autosave failures are silently ignored.
- There is no `Saving`, `Saved`, `Offline`, or `Save failed` state.
- Written answers save only when the input loses focus.
- Final submission can race against a pending answer save.
- Timer-based completion can show a completed state without obtaining server confirmation.
- There is no retry queue for intermittent computer-lab connectivity.

Required improvements:

- Maintain an explicit per-answer state: `dirty`, `saving`, `saved`, or `failed`.
- Debounce written-answer saving while the student types.
- Retry failed saves with capped backoff.
- Show a persistent offline/connection-loss banner.
- Prevent final submission while answer requests remain unresolved.
- On submit, send or reconcile the complete latest answer set.
- Mark the exam submitted only after the server confirms submission.
- If auto-submit fails, retain the attempt locally and show a blocking recovery state.
- Restore the latest confirmed and pending answers after refresh.
- Warn the student before leaving an active exam.

Acceptance criteria:

- Disconnecting the network while answering never produces a false `Saved` state.
- Reconnecting automatically saves pending answers.
- Clicking Submit immediately after typing cannot lose the final answer.
- Timer expiry creates a server-confirmed submitted attempt.
- Refreshing the browser restores all confirmed answers and clearly identifies unsynced answers.

### UI-002: Align the plan catalogue everywhere

**Affected modules:** Public Pricing, Super Admin School Onboarding, School Detail, entitlement messages  
**Current status:** Critical mismatch

The intended commercial packages are:

1. Starter
2. Standard
3. Enterprise

The application currently mixes `Starter`, `School`, `Enterprise`, `Custom`, individual-student subscriptions, and school licenses.

Required improvements:

- Decide the canonical database keys and public labels.
- Use Starter, Standard, and Enterprise consistently in public and authenticated UI.
- Generate public feature comparisons from the same package catalogue that provisions entitlements.
- Clearly show seat limits, billing unit, AI usage limits, support level, onboarding, and included modules.
- Remove all features and service promises that are not currently delivered.
- Add a version/effective date to the package catalogue.
- Ensure changing a plan shows exactly which features will be added or removed before confirmation.

Acceptance criteria:

- A package has the same name and feature set on Pricing, Onboarding, School Detail, invoices/contracts, and entitlement errors.
- No page promises unsupported offline access, parent reports, trials, desktop applications, SLAs, or unlimited AI usage.

### UI-003: Remove unverified marketing claims

**Affected module:** Public Features  
**Current status:** Critical trust issue

Currently displayed claims include:

- 50,000+ active students
- 500+ schools partnered
- 98% CBSE coverage
- 4.8 Play Store rating

Required improvements:

- Remove every statistic that cannot be substantiated.
- During testing, replace the statistics bar with product capabilities or verified testing facts.
- Add evidence ownership and last-verified date for any future public statistic.

Acceptance criteria:

- Legal/product leadership can provide supporting evidence for every public numerical claim.

### UI-004: Responsive authenticated portal shell

**Affected modules:** Teacher, School Admin, Super Admin, Lab In-charge, Batch 2, Batch 3  
**Current status:** Incomplete

Current weaknesses:

- The shared sidebar permanently consumes approximately 240px.
- Most layouts use fixed `p-8` content spacing.
- Top-bar subtitles and right-side actions can compete for limited space.
- There is no consistent tablet/mobile drawer.
- Collapse support is limited mainly to Batch 3 lab routes.

Required improvements:

- Desktop ≥1280px: full sidebar.
- Laptop 1024–1279px: compact/collapsed sidebar.
- Tablet <1024px: hidden sidebar with accessible menu drawer.
- Use responsive page padding such as `p-4 sm:p-6 xl:p-8`.
- Permit top-bar title/subtitle wrapping without overlapping actions.
- Keep logout visible on shared student computers.
- Preserve the active navigation item and focus when opening/closing the drawer.

Acceptance criteria:

- All portal pages remain usable at 768px width.
- No primary action, page title, table action, or navigation entry is clipped.
- The portal is fully keyboard-operable with the drawer open or closed.

### UI-005: Make every virtual lab responsive and reachable

**Affected modules:** Chemistry, Biology, Physics labs  
**Current status:** Inconsistent

Known risks:

- Chemistry changes to one column below the `lg` breakpoint but remains inside a fixed-height `overflow-hidden` container, making lower panels unreachable.
- Biology uses a fixed 320px internal sidebar.
- Physics simulations open left and right panels by default, leaving very little canvas space on smaller screens.
- Lab headers and controls have different responsive behaviours.

Required improvements:

- Create a common responsive lab shell.
- At narrow widths, use drawers/tabs for inventory, controls, explanations, and navigation.
- Never stack content inside an `overflow-hidden` viewport without a reachable scroll container.
- Auto-collapse optional side panels based on available width.
- Preserve simulation state while panels open or close.
- Define minimum usable canvas dimensions.
- Provide a consistent `Focus mode` and `Exit focus mode` action.

Acceptance criteria:

- Every control is reachable at 1024×768.
- No panel overlaps the simulation canvas.
- No lab requires horizontal page scrolling.
- Keyboard focus remains visible in every panel and modal.

### UI-006: Remove runtime dependence on Google-hosted fonts and icons

**Affected modules:** Entire frontend  
**Current status:** High-risk for restricted school networks

Required improvements:

- Self-host Outfit, Inter, and required monospace font files, subject to licensing.
- Replace Material Symbols text ligatures with bundled SVG icons or the existing Lucide library.
- Test the application with all external font domains blocked.
- Define safe system-font fallbacks.

Acceptance criteria:

- Blocking `fonts.googleapis.com` and `fonts.gstatic.com` does not change navigation meaning or display icon names as text.
- Core portal UI needs no third-party asset request after the application bundle loads.

### UI-007: Add a persistent non-production environment banner

**Affected modules:** All portals, exports, print views, email previews  
**Current status:** Missing

Required banner:

> TEST ENVIRONMENT — USE FICTIONAL DATA ONLY — DO NOT ENTER REAL STUDENT OR STAFF INFORMATION

Required improvements:

- Configure the environment label through deployment configuration.
- Show it persistently on every authenticated page in testing/staging.
- Add the label to CSV exports, reports, printed login slips, and screenshots where practical.
- Use a different favicon or color accent for testing.
- Do not permit dismissing the warning permanently.

Acceptance criteria:

- A tester cannot reasonably mistake staging for production.

### UI-008: Restore a reproducible frontend build and QA environment

**Affected module:** Frontend delivery pipeline  
**Current status:** Blocked

Observed problems:

- Vite cannot currently load the installed Tailwind native binary.
- The development server also encounters a Windows process permission error.
- The existing `dist` directory does not reflect the current application routes.

Required improvements:

- Repair and lock platform-specific frontend dependencies.
- Verify clean installation, development startup, production build, and preview startup.
- Generate build metadata containing commit, build time, and environment.
- Never deploy a manually retained stale `dist` directory.
- Make CI build the exact artifact used for staging and production.

Acceptance criteria:

- A clean checkout can install, build, and run using documented commands.
- The deployed build exposes a visible version/build identifier to administrators.

---

## 5. P1 — Required for a Professional Production UI

### UI-009: Build one accessible modal/dialog system

**Current finding:** At least 23 fixed modal overlays exist, with no consistent dialog semantics.

Required improvements:

- Create one reusable Dialog, Drawer, ConfirmDialog, and AlertDialog primitive.
- Use `role="dialog"`, `aria-modal="true"`, labelled title and description.
- Move focus into the dialog when opened.
- Trap focus inside the dialog.
- Restore focus to the trigger when closed.
- Support Escape where safe.
- Prevent background scrolling.
- Require explicit confirmation for destructive actions.
- Ensure the dialog body scrolls on short screens.

### UI-010: Associate every label and field

**Current finding:** Approximately 106 label elements do not use `htmlFor`.

Required improvements:

- Give every input, select, textarea, and upload control a stable ID.
- Connect labels with `htmlFor`.
- Use `aria-describedby` for hints and validation messages.
- Add `aria-invalid` when validation fails.
- Do not use placeholders as the only label.
- Focus the first invalid field after failed submission.

### UI-011: Replace extremely small and low-contrast text

**Current finding:** Approximately 193 instances of 9px text and 300 instances of 10px text exist.

Required improvements:

- Normal instructional and status text: minimum 12–14px.
- Form labels: minimum 12px.
- Critical exam information: minimum 14px.
- Reserve 10–11px only for nonessential metadata.
- Review `text-slate-400` against WCAG contrast requirements.
- Never encode state by colour alone.

### UI-012: Fix touch and pointer target sizes

Known examples:

- Mobile menu button approximately 24×24.
- Login mode tabs approximately 31px high.
- Password visibility action approximately 16×16.
- Numerous icon-only close buttons use small padding.

Required improvements:

- Target size should normally be at least 44×44px.
- Add accessible names to icon-only buttons.
- Keep sufficient spacing between destructive and safe actions.

### UI-013: Distinguish errors from genuine empty data

Affected areas include:

- Teacher dashboard periods and pending reviews
- Teacher reports
- Student streaks
- PYQ lists
- Badges and daily challenges
- Student profile loading and saving
- Principal reports

Required improvements:

- Loading: skeleton/spinner with meaningful label.
- Empty: explain why there is no data and provide the next action.
- Error: state that loading failed and provide Retry.
- Permission/plan restriction: explain access clearly to staff.
- Never replace an API failure with `0`, `[]`, or an empty report without explanation.

### UI-014: Add accessible status announcements

Required improvements:

- Use `role="alert"` for blocking errors.
- Use `aria-live="polite"` for saves, uploads, imports, and background completion.
- Use `aria-busy` during loading.
- Do not rely solely on temporary visual toasts.
- Keep critical failures visible until resolved or acknowledged.

### UI-015: Improve tables for keyboard, tablet, and narrow screens

Required improvements:

- Add table captions or accessible names.
- Add `aria-sort` to sortable headers.
- If an entire row is clickable, make it keyboard-focusable and support Enter/Space.
- Keep the most important columns visible and offer a row-detail card/drawer.
- Make pagination controls large enough for touch.
- Announce page and result-count changes.
- Keep bulk-action meaning explicit: current page versus all filtered results.

### UI-016: Correct the mobile Features statistics strip

**Confirmed breakout:** The fourth metric is clipped at approximately 390px width.

Required improvements:

- Use a responsive 2×2 grid on mobile rather than a one-line flex strip.
- Remove unverified figures as required by UI-003.
- Confirm no horizontal page scrolling at 320, 360, 390, and 430px.

### UI-017: Improve Class 1–4 roster and PIN login

Required improvements:

- Provide search and teacher-controlled filtering for large rosters.
- Show roll number or another child-friendly disambiguator.
- Handle duplicate names.
- Use large student cards appropriate for early learners.
- Provide an explicit selected-student confirmation before PIN entry.
- Make incorrect-PIN and lockout messages child-friendly and private.
- Avoid exposing more student identity information than required.
- Test a roster of at least 60 fictional students with long and duplicate names.

### UI-018: Add school-lab connection and session states

Required improvements:

- Persistent online/offline indicator during exams and assigned activities.
- Clear `Period has not started`, `Period active`, `Ending soon`, and `Period ended` screens.
- A full-screen `Signed out — ready for the next student` confirmation.
- Teacher view showing joined, disconnected, idle, raised-hand, and completed students.
- Recovery guidance after computer restart or browser crash.

### UI-019: Standardise notifications and confirmations

Required improvements:

- Replace native `alert()` and `window.confirm()` usage.
- Create consistent success, warning, error, and destructive-confirmation patterns.
- Include action context: item name, affected students, and reversibility.
- Prevent duplicate submission while an action is running.

### UI-020: Add route-level performance optimisation

**Current finding:** The existing main JavaScript asset is approximately 1.5 MB uncompressed; mostly only the science labs are lazy-loaded.

Required improvements:

- Lazy-load public, student-batch, teacher, school-admin, super-admin, and lab-incharge route groups.
- Preload only the likely next screen.
- Configure Brotli/Gzip compression and immutable hashed-asset caching.
- Measure first load on typical school PCs.
- Run a 25–40 simultaneous-client cold-load test.
- Avoid loading Super Admin code on student computers.

---

## 6. P2 — Professional Refinements

### UI-021: Consistent public navigation

- Reuse one public header and footer across Landing, Features, Pricing, Login, Register, and Not Found.
- Keep logo, spacing, mobile menu, CTA wording, and contact destination consistent.
- Ensure `Book a school demo` leads to an actual demo-request workflow rather than an explanatory dead end.

### UI-022: Professional lead-capture workflow

- Add a school demo request form with school name, city, contact role, email, phone, approximate student count, preferred date, and consent text.
- Confirm successful receipt with a reference number or clear acknowledgement.
- Use one verified company email/domain across the website.
- Add privacy-policy and terms links before collecting contact information.

### UI-023: Shared design primitives

Create and enforce reusable components for:

- Page headers
- Primary and secondary buttons
- Icon buttons
- Form fields
- Empty/error/loading states
- Tabs
- Data tables
- Drawers and dialogs
- Toasts and persistent banners
- Confirmation screens
- Metric cards

### UI-024: Consistent copy and terminology

- Choose one term for exam, quiz, mock, and assessment where their meanings overlap.
- Choose one package vocabulary.
- Standardise `School Admin`, `Lab In-charge`, `Super Admin`, class/grade terminology, and section naming.
- Remove informal or unsupported claims from professional admin pages.
- Proofread punctuation, encoding, capitalisation, and Indian-English usage.

### UI-025: Reduced motion and low-performance mode

- Apply `prefers-reduced-motion` to every portal and virtual lab.
- Add a low-animation mode for older school computers.
- Pause simulation loops when the tab is hidden.
- Avoid constant pulsing animations for noncritical information.

### UI-026: Print and export quality

- Provide print-specific layouts for login slips, rosters, reports, admit cards, and audit exports.
- Prevent navigation and actions from appearing in print.
- Add school name/logo, generation time, environment, page numbers, and confidentiality notice.
- Verify A4 printing in Chrome and Edge.

### UI-027: Browser and session recovery guidance

- Provide clear messages for expired sessions, ended lab periods, disabled accounts, suspended schools, plan restrictions, and maintenance.
- Preserve the intended return destination after appropriate reauthentication.
- Never return a user to a blank or misleading dashboard after an error.

---

## 7. Module-by-Module UI Status

| Module | Current UI level | Main remaining work | Priority |
|---|---|---|---|
| Public Landing | Good visual foundation | Verify claims, shared navigation, touch sizes, performance | P1 |
| Features | Incomplete | Remove unsupported metrics; fix mobile stats breakout | P0/P1 |
| Pricing | Not reliable | Align packages, pricing, entitlements, and delivered promises | P0 |
| Registration/demo request | Partial | Real lead capture, consistent company contact, privacy text | P1/P2 |
| Login | Functional but incomplete | Accessible labels, larger targets, roster search/identity handling | P1 |
| Shared portal shell | Partial | Responsive sidebar/drawer and top bar | P0 |
| Batch 1 student portal | Fair | Large-roster login, recovery, child-friendly accessibility | P1 |
| Batch 2 student portal | Partial | Responsive shell, truthful errors, connection states | P0/P1 |
| Batch 3 student portal | Partial | Responsive shell and lab integration | P0 |
| Student exams | Critical gap | Reliable saves, submission reconciliation, offline recovery | P0 |
| Student AI chat | Partial | Responsive height, network/retry state, accessible image flow | P1 |
| Virtual labs | Inconsistent | Responsive panels, accessible modals, low-performance mode | P0/P1 |
| Teacher dashboard | Partial | Error states, narrow screens, actionable period status | P1 |
| Teacher live session | Useful foundation | Disconnection/idle states, stronger period lifecycle UI | P1 |
| Teacher exam builder | Feature-rich but dense | Responsive form, validation summary, shared components | P1 |
| Teacher reports | Partial | Error-versus-empty distinction, accessible visualisation | P1 |
| School Admin students | Good functional coverage | Responsive modals, accessibility, bulk-action confirmation | P1 |
| School Admin teachers | Good functional coverage | Responsive forms, accessible dialogs, recovery states | P1 |
| School Admin timetable/labs | Partial | Tablet usability, conflict explanations, consistent dialogs | P1 |
| School branding | Reasonable foundation | Preview across portals, invalid-image feedback, crop guidance | P2 |
| Super Admin onboarding | Strong workflow concept | Responsive grids, canonical packages, validation summary | P0/P1 |
| Super Admin school detail | Partial | Plan-change impact preview, accessible dialogs, audit feedback | P1 |
| Super Admin content/AI | Partial | Long-task progress, retry/cancel states, error visibility | P1 |
| Lab In-charge portal | Basic | Responsive shell, rapid lookup, safe credential-reset confirmation | P1 |
| Shared tables | Good foundation | Keyboard interaction, captions, responsive details, touch paging | P1 |
| Shared dialogs | Not standardised | One accessible modal/drawer system | P1 |
| Testing environment UI | Missing | Persistent warnings and marked exports | P0 |

---

## 8. Recommended Implementation Order

### Phase 1 — Testing safety and exam integrity

1. Add the testing-environment banner.
2. Repair the frontend development and build workflow.
3. Fix exam save, retry, submission, auto-submit, and refresh recovery.
4. Add online/offline and server-save indicators.
5. Add automated exam network-failure tests.

### Phase 2 — Commercial and product consistency

1. Finalise Starter, Standard, and Enterprise definitions.
2. Align database keys, public labels, entitlements, and onboarding.
3. Remove unsupported marketing claims and functionality promises.
4. Standardise the company contact identity.

### Phase 3 — School-computer usability

1. Implement the responsive portal shell.
2. Repair Chemistry, Biology, and Physics lab responsiveness.
3. Improve PIN roster login for large sections and duplicate names.
4. Add session lifecycle and next-student-ready screens.
5. Self-host fonts/icons and test with external domains blocked.

### Phase 4 — Accessibility and resilience

1. Build shared dialog/drawer primitives.
2. Associate all labels and validation messages.
3. Increase text and control sizes.
4. Replace silent failures with retryable error states.
5. Add keyboard and screen-reader support to tables and interactive cards.

### Phase 5 — Performance and professional polish

1. Route-level lazy loading and caching.
2. Simultaneous computer-lab load testing.
3. Shared public navigation and lead-capture workflow.
4. Print/export layouts.
5. Copy, terminology, reduced-motion, and visual consistency review.

---

## 9. Required UI Test Matrix

### Responsive tests

- 320×568
- 360×800
- 390×844
- 768×1024
- 1024×768
- 1280×720
- 1366×768
- 1440×900
- 1920×1080

### Data tests

- Zero students, teachers, classes, labs, exams, and tickets
- One record
- 60 students in one section
- Hundreds of teachers/students with pagination
- Duplicate student names
- Very long school, student, teacher, exam, and subject names
- Long section labels and translated text
- Missing school logo and failed logo load
- Expired, suspended, disabled, and unauthorised accounts

### Network tests

- API unavailable before page load
- API failure after partial data loads
- Slow 3G-style response
- Connection loss during an exam
- Connection loss during CSV/PDF upload
- Connection loss during AI generation
- Reconnect after 30–120 seconds
- Thirty PCs loading simultaneously

### Interaction tests

- Keyboard-only navigation
- 200% browser zoom
- Windows display scaling at 125% and 150%
- Screen-reader smoke test
- Reduced-motion preference
- Blocked Google Fonts domains
- Refresh during exam/task/import/onboarding
- Back button during multi-step workflow
- Double-click/double-submit protection
- Very short 768px and 600px screen heights

---

## 10. Release Gates

### Testing-ready UI

- Persistent fictional-data warning is visible.
- Frontend can be built and run reproducibly.
- Core role routes load using fictional data.
- Known test limitations are documented.
- No real email/SMS/WhatsApp recipient is used.

### Controlled-pilot-ready UI

- All P0 items are fixed and verified.
- Exam saving and auto-submit pass network-loss tests.
- Plans and public promises match the signed pilot agreement.
- All student and teacher workflows work at 1024×768 and 1366×768.
- Restricted-network font/icon test passes.
- Labs have no unreachable controls.
- Teachers can identify joined, disconnected, and completed students.
- Accessibility blockers in login, exam, modal, and navigation flows are fixed.

### Production-ready UI

- P0 and P1 items are complete.
- Browser/device matrix passes.
- Simultaneous school-lab load test passes.
- Error, empty, offline, timeout, and recovery states are verified.
- Legal/product teams approve pricing, claims, consent, privacy, and contact copy.
- Print/export artifacts are professional and correctly branded.
- Automated visual regression and end-to-end tests run in CI.

---

## 11. Completion Tracking Template

Use the following format for each issue during implementation:

| ID | Owner | Status | PR/commit | Test evidence | Approved by |
|---|---|---|---|---|---|
| UI-001 | Unassigned | Open | — | — | — |
| UI-002 | Unassigned | Open | — | — | — |
| UI-003 | Unassigned | Open | — | — | — |
| UI-004 | Unassigned | Open | — | — | — |
| UI-005 | Unassigned | Open | — | — | — |
| UI-006 | Unassigned | Open | — | — | — |
| UI-007 | Unassigned | Open | — | — | — |
| UI-008 | Unassigned | Open | — | — | — |

---

## 12. Positive Foundations to Preserve

The improvement work should preserve the following strengths:

- Strong visual identity on the landing page.
- Clear age-specific student experiences.
- Separate role-based portal structures.
- Visible student logout for shared-computer hygiene.
- Shared server-paginated DataTable foundation.
- Horizontal table containment in several admin screens.
- Existing loading and empty-state components in parts of the product.
- Batch 3 lab focus-mode concept.
- Shared school branding support.
- Teacher live-session participant visibility.

The goal is not a visual redesign from zero. It is to make the existing design trustworthy, responsive, recoverable, accessible, and safe for real school operations.
