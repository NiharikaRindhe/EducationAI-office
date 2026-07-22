# Batch 1 (Classes 1–4) — Kid-Friendly UI & NCERT Content Plan

> **Created:** July 10, 2026
> **Scope:** Redesign of the Batch 1 student experience (ages 6–9) and per-grade curriculum/game segregation based on NCERT books.
> **Key constraints:** (1) Users are early/pre-readers — the current adult dashboard chrome doesn't work for them. (2) **School computer labs have no sound** (no speakers, usually no mics) — the UI must never depend on audio.
> **Related docs:** `IMPLEMENTATION_STATUS.md` (what's built), `EDUAI_REVISED_MVP_SPEC.md` (product scope).

---

## Table of Contents

1. [Current State & Problems](#1-current-state--problems)
2. [UI Redesign for Ages 6–9](#2-ui-redesign-for-ages-69)
3. [Silent-Lab Design Rules (No Audio)](#3-silent-lab-design-rules-no-audio)
4. [NCERT Curriculum Analysis (Classes 1–4)](#4-ncert-curriculum-analysis-classes-14)
5. [Per-Grade Game & Content Plan](#5-per-grade-game--content-plan)
6. [Data Model & Platform Integration](#6-data-model--platform-integration)
7. [Build Order](#7-build-order)

---

## 1. Current State & Problems

Batch 1 currently reuses the **same adult dashboard chrome** as Batch 2/3, just recolored amber (`src/routes/batch1/Layout.tsx`). Specific problems for 6–9 year olds:

| # | Problem | Where |
|---|---------|-------|
| 1 | **10-item text sidebar** — pre-readers can't read "Show & Tell", "My Progress", "Profile"; 10 choices is far too many (kids handle 4–5 large choices max) | `Layout.tsx` navItems |
| 2 | **Reading-heavy, adult-toned copy** — "Do not break your daily study streak calendar!", `text-xs` and 8–10px fonts throughout | `Layout.tsx` headers, `Games.tsx` cards |
| 3 | **Small click targets, hover/mouse-only interactions** — the tracing game has mouse events only, no touch support | `Games.tsx` canvas handlers |
| 4 | **No demonstration of how to play** — instructions are written text a Class 1 child can't read | all games |
| 5 | **One identical UI for four very different ages** — a 6-year-old (Class 1) and a 9-year-old (Class 4) are developmentally worlds apart | whole batch |
| 6 | **Games are hardcoded & identical for all classes** — one static array of 16 games, 13 permanently "locked" as decoration, fake stars, XP goes to the mock `AppContext` not the real API | `Games.tsx` gamesData |

What already works for this age group and should be **kept**: PIN name-tap login gated on a live teacher session, always-visible Log Out button, idle logout, `SessionEndWatcher` force-logout when class ends.

---

## 2. UI Redesign for Ages 6–9

### 2.1 Replace the sidebar with a full-screen "island map" home

No persistent navigation. The home screen **is** the navigation: **5 huge picture tiles** (200px+, illustration/emoji-dominant, one word of text underneath).

```
┌─────────────────────────────────────────────┐
│   🦉 "Hi Aarav!"        ⭐ 320   🔥 4       │   ← mascot + XP/streak as pictures
│                                             │
│   ┌────────┐  ┌────────┐  ┌────────┐        │
│   │  📖    │  │  🎮    │  │  ⭐    │        │
│   │Stories │  │ Games  │  │Quizzes │        │
│   └────────┘  └────────┘  └────────┘        │
│   ┌────────┐  ┌────────┐                    │
│   │  ✅    │  │  🏆    │      [Today panel  │
│   │ Tasks  │  │My Stuff│       when class   │
│   └────────┘  └────────┘       is live]     │
└─────────────────────────────────────────────┘
```

- **Merge** Progress + Streak + Badges + Profile into one **"My Stuff"** room (trophy-shelf visual). 10 destinations → 5.
- Inside any page: **one giant "🏠 back home" button**, always the same corner. Kids navigate by returning home, not by switching tabs.
- **A mascot** (owl/robot) delivers everything in first person, short phrases, pictogram speech bubbles. It also softens failure ("Oops, let's count again!" as a shake animation, never a red ❌ wall).
- **Big touch targets** (64px+ minimum), touch events on every interactive element, no hover-only affordances.

### 2.2 Two chrome variants inside Batch 1

Driven by `currentClass` (already available in the layout):

| | Classes 1–2 (pre-readers) | Classes 3–4 (early readers) |
|---|---|---|
| Body text | none — pictograms only | short labels appear |
| Answer choices | 3 max | 4 |
| Instructions | ghost-hand demo only | demo + one short sentence |
| Home tiles | picture only | picture + word |

Same components, a `variant` prop — not two codebases.

---

## 3. Silent-Lab Design Rules (No Audio)

Computer labs generally have **no speakers and no microphones**. The replacement for audio is not more text (pre-readers can't read either) — it's **demonstration**:

1. **Ghost-hand demo**: every game opens with a 3–5 s looping animated hand playing one round (traces the letter, pops the right balloon, drags stars), then a big "▶ Your turn!". One reusable `GhostDemo` component replaying a scripted pointer sequence per game engine.
2. **Pictogram prompts**: mascot speech bubbles contain pictures — 🖐️→🎈 ("tap the balloon"), ⭐+⭐=❓ ("add the stars"). Text is optional reinforcement for Classes 3–4 only.
3. **Motion + color feedback, never text**: correct → element grows, glows green, confetti. Wrong → element shakes and dims (universal "no"), correct answer pulses gently as a hint.
4. **State always visible**: progress = filling star bar, not "Score: 3/5". The biggest, most animated thing on screen is always the one thing to do next — one pulsing call-to-action per screen.
5. **The teacher is the audio channel**: Batch 1 login only works during a live session, so a teacher is in the room by design. Teacher demos once on the projector; the ghost demo handles per-child reminders.
6. **Audio is a per-school toggle** (`lab_audio` in the new School Admin Feature Toggles), **off by default**. When on (headphone labs), TTS via `speechSynthesis` layers on top as pure enhancement. Rule: *audio may reinforce, but must never be the only carrier of information.*

### Sound-dependent features — required changes

| Feature | Problem | Silent redesign |
|---|---|---|
| **Phonics Pop** | "pop the balloon matching the *sound*" needs sound | Show a **picture** (🍎) → pop its starting letter **A**. Same engine, prompt becomes picture→letter |
| **Stories narration** | "listen to narration" planned | **Karaoke-style silent read-along** — words highlight one at a time at reading pace; narration optional behind the toggle |
| **English speaking assessment** (built, Web Speech API mic transcription) | no mics in lab | Gate behind the toggle; offer silent typing/word-arranging variants; or "teacher's desk station" (one headset, students rotate) |
| **Show & Tell** (planned vision AI) | the "tell" implies speaking | Keep photo/vision part; replace spoken description with tap-to-pick facts |

---

## 4. NCERT Curriculum Analysis (Classes 1–4)

Source: ncertsolutionss.com book listings (chapter lists verified per class, July 2026).

**Books per class (English medium):**

| Class | Maths | English | EVS | Hindi |
|---|---|---|---|---|
| 1 | Math Magic (14 ch.) | Marigold + Raindrops | — *(no NCERT EVS book)* | Rimjhim *(out of scope)* |
| 2 | Math Magic (15 ch.) | Marigold + Raindrops | — *(no NCERT EVS book)* | Rimjhim *(out of scope)* |
| 3 | Math Magic (14 ch.) | Marigold | Looking Around (24 ch.) | Rimjhim *(out of scope)* |
| 4 | Math Magic (14 ch.) | Marigold | Looking Around (27 ch.) | Rimjhim *(out of scope)* |

**Scoping consequences:**
- **Hindi excluded** (English-medium spec; `class_subjects` whitelist already supports this).
- **EVS for Classes 1–2** is not a curriculum subject — replace the current mock "EVS" games with a light **"The World Around Me"** picture category (animals, body parts, food, seasons, family), untracked in `subject_progress`.
- **Edition caveat**: the site lists classic editions (Math Magic/Marigold). NCERT's newer NCF books (Joyful Mathematics, Mridang, etc.) are replacing Classes 1–3, but **the skills per grade are identical** — keep chapter references as *data* so an edition swap is a data update, not a rebuild.

---

## 5. Per-Grade Game & Content Plan

### 5.1 Key insight: ~9 game *engines*, parameterized per class

You don't need 40+ different games. One engine + per-class `params` serves all four grades at the right difficulty. Proof from NCERT itself: **"Jugs & Mugs" is literally a chapter in Classes 2, 3 AND 4** — same activity, escalating from "which holds more?" → litres → millilitres.

### 5.2 Maths — engine × class matrix (chapter-mapped)

| Engine | Class 1 | Class 2 | Class 3 | Class 4 |
|---|---|---|---|---|
| **Counting & numbers** | Numbers 1–9 / 10–20 / 21–50 | Counting in Groups / in Tens, Tens & Ones (place value) | Fun with Numbers (to 999) | Large numbers & estimation (*A Trip to Bhopal*) |
| **Add / Subtract** | Addition, Subtraction — within 20, picture-based | *Add our Points*, *Give & Take*, *Birds Come Birds Go* — 2-digit, carrying | *Give & Take* + *Fun with Give & Take* — 3-digit | Word-problem sums (*Trip to Bhopal*, *Junk Seller*) |
| **Multiply / Divide** | — | skip-counting only (*Counting in Groups*) | **× intro** (*How Many Times*), **÷ intro** (*Can We Share*) | **Tables mastery + division** (*Tables & Shares*) |
| **Shapes & patterns** | Shapes and Space, Patterns | Long/Round, Footprints, Lines and Lines, Patterns | Shapes and Designs (edges/corners, tangrams) | Building with Bricks, Carts and Wheels (circles) |
| **Measurement** | longer/shorter compare | Longest Step, How Much Can You Carry, Jugs & Mugs (non-standard units) | cm/m, g/kg, litres | m/km, ml, **perimeter** (*Fields & Fences*) |
| **Time** | before/after, day parts | days & calendar (*My Funday*) | calendar + clock hours (*Time Goes On*) | minutes, duration, timetable (*Tick Tick Tick*) |
| **Money** | coin recognition | — | Rupees & Paise (making amounts, change) | buy/sell problems (*The Junk Seller*) |
| **Fractions** | — | — | half/quarter via sharing | **Halves & Quarters** |
| **Data** | sort & count (*How Many*, *Data Handling*) | tally (*How Many Ponytails*) | pictographs (*Smart Charts*) | bar charts (*Smart Charts*) |

**Existing engines to parameterize first** (already coded in `Games.tsx`): letter tracing, phonics-pop (→ picture-based), count-&-add (`{max, ops}` config per class instead of the hardcoded 1–4 range).

### 5.3 English — Stories page + word games

Marigold chapters are direct content for the currently-mock **Stories** page:

- **Class 1** (10 units: *A Happy Child, One Little Kitten, A Kite, Clouds, Lalu and Peelu…*): 1–2 line pages, picture-dominant, karaoke word highlighting. Word games at phonics / 3-letter-word level.
- **Class 2** (10 units: *First Day At School, Zoo Manners, I Am the Music Man…*): short paragraphs; word-builder + sentence-order games drawn from each story's vocabulary.
- **Classes 3–4**: longer Marigold stories → reading passages with 3–5 comprehension questions (feeds the existing quiz/exam machinery) + grammar games (naming words, action words) for Class 4.

**Link Stories ↔ Games**: each story ships a word list; spelling/word games pull content from the story the child just read.

### 5.4 EVS — picture quizzes

- **Classes 1–2** (non-curricular "World Around Me"): animal sounds/homes matching, body-parts labeling, food & seasons picture quizzes — maps to games already stubbed in the mock list.
- **Class 3 — Looking Around (24 ch.)**: one picture-based mini-quiz (5–8 questions) per chapter — *The Plant Fairy* (plants), *Water O' Water / Drop by Drop* (water), *Foods We Eat*, *Our Friends — Animals*, *Left–Right* (directions — natural mini-game), *Families can be Different*, *Games We Play*…
- **Class 4 — Looking Around (27 ch.)**: same format, slightly longer — *Ear to Ear / A Day with Nandu* (animals), *A River's Tale / Too Much Water…* (water & conservation), *Basva's Farm / From Market to Home* (farming & food), *Changing Families/Times*; plus map/direction games (pairs with Maths *The Way the World Looks*).

### 5.5 Content volume (launch target)

- ~26 Maths game configs across ~9 engines (≈14 chapters × 4 classes, many chapters share an engine)
- ~20 stories with word lists (Classes 1–2), comprehension passages for 3–4
- ~50 EVS picture quizzes (Classes 3–4) + a small 1–2 picture-category pool

---

## 6. Data Model & Platform Integration

### 6.1 `games_catalog` (table or typed config to start)

```
game_id | engine        | subject | skill_tag        | class_num | level | chapter_ref          | params (jsonb)
--------|---------------|---------|------------------|-----------|-------|----------------------|------------------------
cnt-1   | count-add     | Maths   | addition-to-20   | 1         | 1     | c1-math-addition     | {max: 9,  ops:["+"]}
cnt-2   | count-add     | Maths   | addition-2digit  | 2         | 1     | c2-math-add-points   | {max: 99, ops:["+","-"]}
tbl-3   | times-table   | Maths   | multiplication   | 3         | 1     | c3-math-how-many-times | {tables:[2,3,4,5]}
div-4   | equal-share   | Maths   | division         | 4         | 1     | c4-math-tables-shares  | {divisorMax: 9}
```

### 6.2 Rules

- **Filter server-side**: `GET /api/student/games` returns only `class_num = my class` (reuse the `class_subjects` whitelist pattern — never trust the client).
- **Meaningful locking**: within a skill, level 2 unlocks at 2+ stars on level 1 (replaces today's permanently-locked decorative cards).
- **Persist progress**: `game_attempts` (student, game_id, stars, best_score); XP routed through the real `addXp()` gamification service → games finally feed real XP/badges/leaderboard and show up in teacher reports.
- **Stretch, not wall**: an optional "challenge" section shows same-skill games from `class_num + 1` for students who've mastered their level.
- **`chapter_ref` ties games to `subject_progress`**: completing a game ticks the corresponding chapter — the Progress page becomes real automatically.
- **Seed `subject_progress` curriculum** from §4/§5 chapter lists (the table exists in the schema with zero content — this is the data it's been waiting for).
- **Tag the global question bank** with class + subject + chapter from the same list, so teacher Mini Quizzes align with what the games teach.

---

## 7. Build Order

1. **Foundation (backend)**: curriculum seed migration (chapters for all 4 classes) + `games_catalog` + `game_attempts` + `GET /api/student/games` + real XP wiring. All patterns already exist.
2. **Batch 1 shell redesign**: island-map home, merge minor pages into "My Stuff", `GhostDemo` component, pictogram prompt/feedback components, touch events on all games, `lab_audio` feature toggle (optional TTS layer).
3. **Parameterize the 3 existing engines** (tracing, picture-phonics, count-&-add) across Classes 1–4; then add engines one at a time: times-table race, equal-share (division), clock explorer, jugs & mugs, money shop, pattern blocks.
4. **Stories page**: Marigold content + silent karaoke read-along + per-story word lists feeding word games.
5. **EVS picture quizzes** (Classes 3–4) + "World Around Me" pool (Classes 1–2).
6. **Chrome variant split** (Classes 1–2 pre-reader vs 3–4 early-reader).
