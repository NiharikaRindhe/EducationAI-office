# Batch 1 (Class 1–4) Claymorphism Redesign

## Context

The user supplied a reference mockup (soft "claymorphism" style — rounded 3D
clay-like icons, pastel gradients, soft ambient shadows) and wants the entire
Class 1–4 student portal rebuilt to match it pixel-for-pixel where the mockup
is explicit, and extended consistently everywhere else (all pages, all
buttons, all animations). This supersedes the earlier decision in this same
session to go with flat-vector art — the user has now explicitly said no
vector/SVG, this must be claymorphism, production quality.

Because claymorphism can't be drawn cheaply in CSS the way flat icons can, the
plan is image-driven: the user will generate PNGs from prompts I provide and
hand them back as files; I turn those into the actual UI. The existing
`src/routes/batch1/art.ts` seam (built earlier this session, currently empty)
is exactly the mechanism for this — every picture in the portal already routes
through a `<Pic>` component that resolves `emoji → artwork` and falls back to
the emoji glyph when no artwork exists yet. Populating that map is most of
this job; almost no component logic needs to change.

Two research passes (Explore agents) mapped every page, every game engine,
every emoji, every shared component, and the full CSS/asset/build
infrastructure. That surfaced four real bugs already in the code (unrelated to
this redesign, left over from the previous session's work) and one serious
process bug in my own verification — **all four must be fixed as part of this
work**, and the verification process is corrected below.

## Decisions locked in this session

- **Style**: Claymorphism — soft, rounded, volumetric 3D shapes with gentle
  ambient-occlusion shadows and a soft top-left highlight, pastel/saturated
  flat-adjacent colors, no hard black outlines, no flat vector/SVG icon style.
- **Home tiles**: 5 tiles matching the mockup — Games, Stories, Quiz Time, My
  Work, My Trophies. **My Journey is not deleted** — it stays fully intact as
  a page, reached via a link/button from inside Games ("See my map"), not as a
  seventh Home door. Per the user's explicit caution, the chapter/game
  arrangement logic and data (the careful per-class game assignment built
  earlier this session — migrations `20250101000174` through `…000176`) are
  **not touched in any way**; this is a navigation-entry-point change only.
- **Avatars**: replace the current emoji avatar picker (12 emoji animals in
  `ProfileCard.tsx`) with 12 claymorphism animal-character images — same 12
  animals, new art.
- **Delivery format**: PNG, 1024×1024, transparent background. One flat folder
  of files, named to match exactly — no manual renaming on the user's side.
- **Phasing**: three batches.
  - **Batch A (~74 images, delivered first)** — app shell, scene decoration,
    header, live-class banner, the 5 nav tiles, 4 class mascots, 12 avatar
    animals, subject icons, 8 badges, encouragement-strip character. This
    alone makes every screen match the mockup's *style* even before a single
    game icon exists.
  - **Batch B (61 images)** — one clay icon per distinct game (61 distinct
    icons across 67 active games).
  - **Batch C (~150 images)** — the small objects used *inside* game
    questions (hen, bus, jug, coins, clock face, etc. — full list already
    catalogued in `art.ts`'s `SLOTS`).
  - Until B and C land, those slots keep rendering their current emoji
    automatically — `Pic` already falls back gracefully, so nothing breaks
    mid-rollout.

## Assumptions I'm making (flagging, not asking again)

1. **Tile subtitles show for every class, 1 through 4.** The mockup always
   shows a subtitle line under each tile. This extends the principle already
   established earlier this session ("a picture with its word is how a child
   learns the word — hiding text teaches nothing") to subtitles too. This also
   happens to fix bug #3 below rather than reintroduce the old hide-for-
   pre-readers behavior.
2. **The bell icon in the mockup's header becomes the existing account menu**
   (avatar/My Trophies/Log out), restyled to match — there is no notification
   system anywhere in this app, and building one is out of scope here. I'll
   flag this plainly when I hand back the work; say the word if you actually
   want notifications built.
3. **The mascot in the live-class banner stays the per-class mascot**
   (chick/rabbit/fox/owl — Class 3's Aisha would see the fox, not a generic
   robot), rendered in the new clay style, so it stays consistent with the
   rest of the app's existing class-identity system rather than introducing
   an unrelated robot character. Easy to swap for a single robot mascot later
   if you'd rather match the mockup literally.

## Bugs found during exploration — fixed as part of this work

1. **`Games.tsx` crashes on finishing Count & Add or Phonics Pop.** It renders
   `<Star>` at two finish-screens (lines ~883, ~1121) but only imports
   `{ ArrowLeft, Lock }` from `lucide-react` — `Star` is undefined. Fix: add
   `Star` to the import.
2. **`LiveClassCard` never receives its `mascot` prop.** The component
   requires `mascot: string`; `Home.tsx` renders `<LiveClassCard />` with no
   props, so the mascot image in the live banner is `undefined`. Fix: `Home`
   passes `mascot={theme.mascot}`.
3. **Tile subtitles are dead code.** `ActionTile` declares a `subtitle` prop;
   `Home.tsx` passes `hint`. Nothing has ever rendered. Fixed as part of the
   Home rebuild (assumption #1 above).
4. **A literal escaped string instead of an emoji.** `Games.tsx` line ~526 has
   `emoji="\U0001F680"` — this renders the literal text `\U0001F680`, not a
   rocket. Fix: use the actual glyph.
5. **My own verification has been a no-op all session.** `tsconfig.json` has
   `"files": []` with only `references` to `tsconfig.app.json` /
   `tsconfig.node.json`. Running `tsc --noEmit -p tsconfig.json` — which I did
   repeatedly and reported as "clean" — type-checks **zero files** and always
   exits 0. Every prior "typecheck clean" claim this session was false
   confidence. Going forward, real verification uses
   `tsc --noEmit -p tsconfig.app.json`, and I'll say so explicitly when I
   report results.

## Implementation

### 1. Art pipeline (do this first — everything else depends on it)

- **`BATCH1_ART_MANIFEST.md`** (new, repo root) — the single file the user
  generates against. For all ~74 Batch A images: exact filename slug (matches
  the key I'll add to `art.ts`'s `ART` map), the exact prompt (a shared
  claymorphism style-lock prefix — consistent lighting angle, palette,
  material, transparent background — plus the per-subject description), and
  which UI slot it fills. Batch B/C manifests follow the same format once
  Batch A is wired and verified end-to-end.
- **`scripts/build-batch1-art.mjs`** (new) — Node script using `sharp` (check
  if already a devDependency; add if not) that reads the user's delivered
  1024×1024 transparent PNGs from `art-source/batch1/` and emits
  `public/art/batch1/<slug>.webp` (256 + 512) plus a PNG fallback — the shape
  `art.ts`/`Pic` already expects. New `"build:art"` npm script.
- **`src/routes/batch1/art.ts`** — populate `ART` with the Batch A keys;
  update the header comment from "flat vector illustration" to the
  claymorphism direction; keep `SLOTS` as the living manifest source for
  Batch B/C.

### 2. Shell, scene, header (`Layout.tsx`, `Scene.tsx`, `ui.tsx`, `theme.ts`)

- `ui.tsx` primitives (`Card`, `Button`, `IconButton`, `ActionTile`,
  `StatChip`, `StarRow`, `ProgressBar`, `EmptyState`, `PageHeader`) get the
  claymorphism visual language: soft multi-layer shadows, gentle highlight
  gradients on buttons, and art-driven icons via `Pic` instead of CSS shapes
  wherever the mockup shows a real image.
- `Layout.tsx` header rebuilt to match the mockup: avatar circle top-left with
  greeting + wave, class pill, Stars/Streak (+ Level, if we add one — check
  whether "level" already exists in the profile data before inventing a new
  stat), account-menu button restyled as the rounded icon button in the
  mockup's position. Fixes bug #2 while rewiring the live card.
- `Scene.tsx` restyled to the mockup's softer backdrop (gentler gradient,
  fewer/softer decorative elements) while staying inline SVG/CSS — the
  existing file's own rationale (identical cross-platform rendering) still
  holds; the scene isn't part of the clay image set, just softened to match.

### 3. Home (`Home.tsx`, `LiveClassCard.tsx`)

- 5 tiles (Games, Stories, Quiz Time, My Work, My Trophies), each: clay icon,
  title, subtitle (all classes — assumption #1), and a real progress bar
  driven by actual data already available from each page's own endpoint
  (games stars, tasks completed, quiz count, badge count) rather than the
  current badge-only counts.
- Bottom encouragement strip + weekly-goal widget, new element from the
  mockup — backed by real streak/task data already on hand, not invented
  numbers.
- `LiveClassCard.tsx` restyled to the mockup's banner (gradient panel,
  sparkles, mascot character, pill "Join now" button) — fixes bug #2 in the
  same pass.

### 4. Every other page — visual pass onto the same kit

- `Games.tsx` — new tile art (emoji fallback until Batch B lands), a "See my
  map" entry point into `/batch1/syllabus`, fixes bugs #1 and #4.
- `Syllabus.tsx` (My Journey) — visual re-skin only. **No changes to chapter
  data, unlock logic, or which games appear under which chapter/class.**
- `Quizzes.tsx`, `Tasks.tsx`, `MyStuff.tsx` — already on `ui.tsx`; restyle
  onto the updated primitives.
- `Stories.tsx` — needs the most work; it still predates `ui.tsx` entirely
  (old `bento-card`/`pill-*` classes, a non-keyboard-accessible `<div
  onClick>` card). Migrated onto the shared kit as part of this pass.
- Game engines (`games/*.tsx`, inline engines in `Games.tsx`, `QuestEngine.tsx`)
  — shared chrome (option buttons, Play Again, finish screens) adopts the new
  clay button language via existing primitives; individual game art waits for
  Batch B/C but nothing here needs new component logic.

### 5. Housekeeping while touching these files

- Consolidate the runtime-injected keyframes in `Games.tsx`'s `injectStyles()`
  into `src/index.css` proper — fixes the cold-load bug where `Skeleton`
  (used by Quizzes/Tasks/Games) has no shimmer animation until `Games.tsx` has
  mounted at least once.
- Optionally add a "squish" tap-feedback keyframe matching claymorphism motion
  language, applied via the shared `PRESS` constant in `ui.tsx`.

## Verification

- **Real typecheck**: `npx tsc --noEmit -p tsconfig.app.json` (not
  `tsconfig.json` — see bug #5). Must be clean.
- `npm run build` (vite build) must succeed.
- Playwright E2E: reuse/extend the existing Batch 1 harness
  (`b1-e2e.cjs`-equivalent from this session) for PIN login + every batch1
  route render, updated for the 5-tile Home and Journey's new entry point.
- Screenshot pass at a realistic lab-monitor resolution for Home, Games (incl.
  the new Journey link), Journey, Quizzes, Tasks, My Trophies, Stories — both
  immediately after the structural pass (art still emoji-fallback, confirming
  nothing breaks) and again once Batch A art is wired in.
- Confirm `games_catalog` and `curriculum_chapters` data/migrations from
  earlier this session are byte-for-byte untouched — this PR touches UI files
  only, no SQL.
