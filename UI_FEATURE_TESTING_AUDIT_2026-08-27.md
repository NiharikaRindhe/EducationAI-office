# UI Feature Testing Workbook Audit

**Source:** `UI_Feature_Testing_Notes_With_Modules_Updated.xlsx`  
**Reviewed:** 27 August 2026  
**Scope:** current frontend routes/components, relevant API services, migrations, production builds, and automated API tests

## Final result

The workbook contains **157 issue rows**. Its numbering runs from 1 to 158 but skips 112.

| Status | Count | Meaning |
|---|---:|---|
| Complete / accepted implementation decision | 154 | Implemented, removed/redirected, or resolved through a necessary integrated product decision |
| Implemented, external verification pending | 3 | Code is complete; final acceptance needs a connected browser or configured SMTP receiver |
| Open implementation work | 0 | No workbook change remains unimplemented |
| **Left to verify** | **3** | Runtime verification only |

## Sidebar decision

Workbook rows 138 and 145 are superseded by the clarified requirement:

- Keep the left sidebar.
- Allow its navigation to scroll when the viewport is short.
- Hide only the visible scrollbar track.
- Keep footer/logout controls inside the viewport.

The shared sidebar uses `min-h-0`, `overflow-y-auto`, and the cross-browser `no-scrollbar` utility. The Class 5–8 PDF workspace and Class 9–10 labs retain collapsible navigation.

## Changes completed in the remaining pass

- Class 5–8 navigation now contains Home, Activities, AI Tutor, PDF Simulator, Exams, and Profile & Streak.
- Class 5–8 Subjects, Tasks, Notes, PYQ, Daily Challenge, Badges, and Report an Issue were removed. Old direct URLs redirect safely.
- Class 9–10 navigation now contains Home, Science Labs, PDF Simulator, AI Tutor, Exams, Board PYQ, and Profile & Streak.
- Class 9–10 Subjects, Concept Map, Board Prep, Daily Challenge, Tasks, Notes, Pomodoro, and Report an Issue were removed. Old direct URLs redirect safely.
- Streak history is integrated into each retained student Profile page; old streak URLs redirect to Profile.
- “SI” is treated as not applicable because no feature named SI exists. The separately named and integrated PDF Simulator remains.
- Class 9–10 PYQ is retained because the workbook row gives no removal instruction and PYQ is a core board-preparation workflow.
- The textbook uploader's informational guidance no longer appears as a yellow error line.
- School onboarding no longer falsely claims email delivery. It reports whether mail was queued or unavailable and points to the audit log for the final outcome.
- Teacher professional screens use consistent icons instead of decorative warning, streak, and badge emojis. Age-appropriate Class 1–4 visuals remain.
- Lab typography is normalized to the application font system, lab content is contained without page scrolling, and the portal shell keeps the site palette and sidebar.
- Teacher-started live periods remain available only where Class 1–4 PIN login and lab-session operation require them; they are not ordinary navigation destinations.
- The existing three-upload quota per class and subject is retained as the safe interpretation of the ambiguous generation-limit wording.

## External verification pending (3)

| Workbook row | Verification still required |
|---:|---|
| 8 | Send onboarding mail through the configured production SMTP provider and confirm receipt plus the `mail.school_admin_welcome.sent` audit event. |
| 125 | Run the authenticated Class 5–8 Activities interaction matrix in a connected browser. |
| 148 | Run the authenticated Physics, Chemistry, and Biology lab interaction matrix in a connected browser. |

## Important accepted exceptions

- **69 — Academic Year Rollover:** retained because it is the only workflow for new Class 1 intake, annual promotion, and Class 10 pass-outs.
- **99 / 117 — Live Sessions:** hidden from ordinary navigation but retained where required for teacher-controlled lab periods and Class 1–4 PIN login.
- **138 / 145 — Sidebar:** sidebar retained; only its visual scrollbar is removed.
- **141 — Emojis:** removed from professional UI where decorative; preserved when age-appropriate in Class 1–4 learning experiences.

## Verification completed

- Frontend TypeScript and Vite production build: passed.
- API TypeScript production build: passed.
- API automated tests: **236 passed across 17 test files**.
- `git diff --check`: passed.
- Removed destinations checked at navigation and direct-route levels.
- Browser discovery was retried, but no browser session was connected.
