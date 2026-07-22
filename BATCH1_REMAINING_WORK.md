# Batch 1 — Development Plan v2 (Chapter-First, Per-Class Content)

> **Updated:** July 10, 2026 (supersedes the v1 "remaining work" doc — phases 2/3/6 of `BATCH1_UI_CONTENT_PLAN.md` have since been implemented; this doc reflects a code audit of what actually exists and what's wrong with it.)
> **Product goal driving this plan:** a Class 2 student must see Class 2 games and Class 2 quizzes organized by *their* NCERT chapters; Class 3 sees Class 3's; Class 4 sees Class 4's — visibly different experiences.

---

## 1. Audit — What Exists and Works

Verified against code (not docs) on July 10:

| Area | State |
|---|---|
| Class scoping (backend) | ✅ Correct. `GET /student/games` and `GET /student/curriculum` filter by the student's own `class_num` from `student_profiles`, server-side. `POST /games/:id/attempts` rejects cross-class submissions. **There is deliberately no class picker** — class is bound to the account (locked decision from the sections rollout: kids never choose their class; shared-PC pickers are account-finding only). |
| Island-map shell | ✅ `Home.tsx` = 6 giant tiles, no sidebar; `Layout.tsx` = 🏠 home button + logout on inner pages; `MyStuff.tsx` merges Progress/Badges/Streak/Profile. |
| Game engines | ✅ 3 engines parameterized from catalog `params` (count-add reads `max`/`ops`, letter-trace reads `letters`/`case`, phonics-pop reads `pairs`). Touch events, silent-lab feedback (shake/dim on wrong, glow/confetti on right, pulsing hint), pre-reader (≤2) vs early-reader (3–4) variants all implemented. |
| Syllabus page | ✅ `Syllabus.tsx` + `GET /student/curriculum` — chapter list per subject with per-chapter stars and completed state. This is the right skeleton for chapter-first navigation. |
| XP pipeline | ✅ Attempts pay XP server-side via `addXp`/`logStreakActivity`, only for star improvement; `subject_progress` recomputed from `chapter_ref`s. |

## 2. Audit — Defects Found (Phase 0 fixes)

| # | Defect | Where | Fix |
|---|---|---|---|
| 0.1 | **Phonics params key mismatch**: migration seeds `pairs: [{"picture": "🍎", ...}]`, frontend reads `pair.emoji` → blank prompt with real API data | `20250101000021_games_catalog.sql` seed vs `Games.tsx` `GameParams` | New migration to `UPDATE games_catalog SET params = ...` renaming `picture`→`emoji` (or accept both keys client-side; pick one, fix the seed regardless) |
| 0.2 | **Mock fallback masks class scoping**: API error *or empty list* → hardcoded Class 1 `MOCK_GAMES` shown to any class. This is why the UI looks "the same for everyone" when not logged in / API down / class has no seeds | `Games.tsx` fetch `.then`/`.catch` | Remove `MOCK_GAMES`; render a friendly empty state ("🦉 New games coming soon!") and surface API errors during dev instead of hiding them |
| 0.3 | **Tracing/phonics invisible in Syllabus**: their `chapter_ref` is `null`, so they hang off no chapter | catalog seed | Link them to the seeded English chapters (alphabet/phonics work belongs to Class 1–2 Marigold units) or add explicit "Foundational skills" chapters; either way every active game must have a `chapter_ref` |
| 0.4 | **Header XP chip doesn't move after a game**: `incrementXP` writes mock local state, but a logged-in student's displayed XP comes from `authUser.student_profiles.xp` | `AppContext.tsx` / `Games.tsx` | After a successful attempt, refresh the auth profile (or add an `applyXpDelta` that updates the authUser copy) |
| 0.5 | **`challengeGames` fetched and discarded** — the "stretch, not wall" section never renders | `Games.tsx` | Render a "🚀 Challenge" strip when non-empty |
| 0.6 | **Syllabus "Play" is a dead end**: navigates to the flat games grid, not the chapter's game | `Syllabus.tsx` | Deep-link: `navigate('/batch1/games', { state: { gameId } })` (or `?game=` param) and have Games auto-open that engine |

## 3. Root Cause of "I don't like it" — Content Depth, Not Plumbing

Per class today: Class 1 → 3 active games, Class 2 → 3, Class 3 → **1**, Class 4 → **1**. Against 9–16 seeded chapters per class, the Syllabus page is a wall of "Read Only" rows and the Games page is near-empty. The class-differentiation machinery works; there's just almost nothing flowing through it. And **quizzes are teacher-assigned exams only** — a student cannot self-serve a quiz on the chapter they're studying, which is half the ask.

The plan below is therefore ordered: fix defects → make chapter the navigation unit → add per-chapter quizzes → fill the game matrix so every chapter of every class has something to play.

---

## 4. Phase 1 — Chapter-First Navigation (frontend, ~1 day)

Make the chapter the unit the child navigates by, everywhere:

1. **Games page grouped by subject → chapter**, not a flat grid. Section headers use the chapter title from the catalog (`chapterRef` is already in the response; join titles via `/student/curriculum` or add `chapterTitle` to the games response server-side — prefer the latter, one query).
2. **Syllabus (rename tile to "Learn" 📚) becomes the primary hub**: tap a chapter → expand its games + its quiz (Phase 2) inline, playable right there. Games tile can stay as the "all games" arcade view.
3. **Per-class visual identity** (cheap, high-impact for the "different per class" feel): class-driven accent theme + mascot line — Class 1 🐣, Class 2 🐰, Class 3 🦊, Class 4 🦉 — so a Class 2 login *looks* different from Class 3 at a glance.
4. Phase 0 defects fixed as part of this pass (same files).

**Acceptance:** log in as Class 2 vs Class 3 test students → different chapter lists, different games, different look; no mock data anywhere; finishing a game updates header XP and the chapter's stars immediately.

## 5. Phase 2 — Per-Chapter Quizzes (backend + frontend, ~2 days)

The missing half of "different quizzes according to the chapter they have":

1. **Model quizzes as a catalog engine, not a new subsystem**: `engine = 'chapter-quiz'` rows in `games_catalog`, one per chapter, `params = { questionCount: 5 }`. They inherit everything for free: class filtering, stars, XP, locking, `subject_progress` ticks, Syllabus placement.
2. **Questions come from `question_bank`** — it already has `class_num`, `subject`, `chapter_num`, `difficulty`, `options` (unused so far for this). New service path: `GET /student/quizzes/:chapterRef` draws N random MCQs for that chapter (reuse `seededShuffle.ts` for per-student ordering, same anti-copy pattern exams use); `POST /student/games/:gameId/attempts` unchanged for scoring (client computes stars 3/2/1 from correct count; server already caps and validates class).
   - Grading stays server-side: submit answers, server checks against `question_bank` correct options and returns stars — do **not** trust client-computed stars for quizzes (unlike games, answers are verifiable). Small addition to the attempts endpoint: optional `answers[]` payload; when the game is a `chapter-quiz`, server grades and *derives* stars itself.
3. **Frontend quiz engine component**: picture-friendly MCQ card (one question at a time, 3 choices pre-reader / 4 early-reader, same shake/glow feedback as count-add — mostly reuses that engine's option-button code).
4. **Content seed**: MCQs per chapter into `question_bank` (global scope). Maths questions are safe to author (skill-based: "7 + 5 = ?" with picture hints). **World Around Us / English comprehension content must be sourced, not invented** — start with Maths for all 4 classes (≈30 chapters × 5 questions) and the generic Class 1–2 "World Around Me" pool (animals/body/food/seasons — non-NCERT, safe to author); leave NCERT-text-dependent quizzes for the ingestion pipeline.
5. **Teacher alignment bonus** (already in the plan doc §6.2): the same tagged bank rows become available in the teacher's Question Bank UI filtered by chapter — teacher Mini Quizzes and student self-serve quizzes draw from one pool.

**Acceptance:** a Class 2 student opens chapter "Add our Points" → plays its game AND takes its 5-question quiz; stars from both tick the chapter; a Class 3 student sees entirely different chapters/quizzes.

## 6. Phase 3 — Fill the Engine × Class Matrix (~1 week, incremental)

Build engines one at a time (each is a self-contained component in `Games.tsx`'s pattern + catalog seed rows in a new migration), targeting **every Maths chapter of every class having ≥1 game**:

| Engine | Unlocks chapters | Classes | Notes |
|---|---|---|---|
| `times-table` race | c3-math-muldiv, c4-math-muldiv | 3–4 | Seeds `tbl-3` already exist inactive — flip on when built |
| `equal-share` (division) | c3/c4-math-muldiv | 3–4 | Seed `div-4` exists inactive |
| `counting` (place value) | c1–c4-math-counting | 1–4 | Count objects → tens/ones for 2, up to 999/9999 for 3–4 |
| `clock-explorer` | c1/c2/c3/c4-math-time | 1–4 | before/after → days → hours → minutes, per `params` |
| `money-shop` | c1/c3/c4-math-money | 1,3,4 | coin tap → make amounts → change |
| `pattern-blocks` | c1–c4-math-shapes | 1–4 | odd-one-out / continue-the-pattern |
| `measure-compare` (jugs & mugs) | c1–c4-math-measure | 1–4 | longer/shorter → non-standard units → litres/perimeter |
| `fraction-pizza` | c3/c4-math-fractions | 3–4 | halves/quarters by sharing |
| `chart-builder` (data) | c1–c4-math-data | 1–4 | sort & count → tally → pictograph → bar chart |

Multi-level locking activates automatically once a `skill_tag` gets `level: 2` rows (server logic already shipped — `computeLocked` in `games.service.ts`).

**Acceptance:** Class 2 login shows ~7 chapters each with a playable game; Classes 1/3/4 show *their* versions at their difficulty (same engines, different `params`) — the "Jugs & Mugs escalates across classes" insight from the content plan, realized.

## 7. Phase 4 — English/EVS Depth + Stories (content-gated)

Unchanged from v1: Stories page with karaoke read-along needs real Marigold text (source via `ncert_ingestion_jobs`/manual authoring — **do not fabricate NCERT content**); Looking Around picture quizzes for Classes 3–4 need sourced facts. The generic Class 1–2 picture pool from Phase 2 covers the youngest kids meanwhile.

## 8. Order & Effort

```
Phase 0+1 (fix + chapter-first UI)   ~1 day    ← do first, addresses "the UI feels wrong"
Phase 2   (chapter quizzes)          ~2 days   ← addresses "different quizzes per chapter"
Phase 3   (engine matrix)            ~1 week   ← addresses "different games per class", incremental, ship engine-by-engine
Phase 4   (stories/EVS content)      gated on content sourcing decision
```
