# EduAI — Complete UI Feature List

> Last updated: June 15, 2026  
> Stack: Next.js 16.2.9 · React 19 · TypeScript · Tailwind CSS v4  
> Total pages: 63 across 8 sections

---

## Table of Contents

1. [Design System & Global Tokens](#1-design-system--global-tokens)
2. [Public Landing Page](#2-public-landing-page)
3. [Auth Pages](#3-auth-pages)
4. [Batch 1 — Class 1–4 (Amber)](#4-batch-1--class-14-amber)
5. [Batch 2 — Class 5–8 (Indigo)](#5-batch-2--class-58-indigo)
6. [Batch 3 — Class 9–10 (Sky Blue)](#6-batch-3--class-910-sky-blue)
7. [Batch 4 — Class 11–12 (Slate/Purple)](#7-batch-4--class-1112-slatepurple)
8. [Teacher Portal](#8-teacher-portal)
9. [Parent Portal](#9-parent-portal)
10. [Public Marketing Pages](#10-public-marketing-pages)
11. [Shared Components](#11-shared-components)
12. [Page Route Map](#12-page-route-map)

---

## 1. Design System & Global Tokens

### Color Palette

| Batch | Color Name | Primary Use |
|-------|-----------|-------------|
| Batch 1 | Amber / Orange | Class 1–4 theme, gradients, nav |
| Batch 2 | Indigo / Violet | Class 5–8 theme, gradients, nav |
| Batch 3 | Sky / Cyan | Class 9–10 theme, gradients, nav |
| Batch 4 | Slate / Purple | Class 11–12 theme, gradients, nav |
| Teacher | Indigo (white sidebar) | Professional clean tone |
| Parent | Emerald / Teal | Calm, trustworthy parent portal |

### Typography

- **`font-display`** — Outfit font. Used for all headings, card titles, dashboard section headers.
- **`font-sans`** — Inter font. Used for all body text, labels, descriptions.

### Custom CSS Classes (from `globals.css`)

| Class | Description |
|-------|-------------|
| `badge` | Tiny rounded label chip — used for subject tags, difficulty, status |
| `pill-amber` | Amber background badge |
| `pill-indigo` | Indigo background badge |
| `pill-sky` | Sky blue background badge |
| `pill-green` | Green background badge |
| `pill-rose` | Rose/red background badge |
| `pill-slate` | Slate background badge |
| `pill-purple` | Purple background badge |
| `status-completed` | Green dot + "Completed" text style |
| `status-progress` | Amber dot + "In Progress" text style |
| `status-review` | Violet dot + "In Review" text style |
| `status-notstarted` | Gray dot + "Not Started" text style |
| `anim-float` | Gentle vertical floating animation (CSS keyframes) |
| `anim-fade-up` | Fade in + slide up entry animation |
| `anim-spin-slow` | Slow continuous rotation |
| `bento-card` | Rounded white card with shadow used in hero bento grid |
| `card-interactive` | Hover lift + shadow card |
| `progress-bar` | Gray track container |
| `progress-fill` | Colored fill div inside progress-bar |
| `glass` | Glassmorphism — backdrop blur + semi-transparent bg |
| `gradient-hero` | Hero section gradient background |
| `hero-orb` | Absolute-positioned blurred circle for background |

### Layout Pattern

All batch/portal pages follow:
- **Desktop:** Fixed left sidebar (`w-60`) + scrollable main area (`ml-60`)
- **Mobile:** Bottom navigation bar (4–5 icons) + full-width main
- **Content grid:** `lg:col-span-8` (main) + `lg:col-span-4` (sidebar) where applicable
- **Max width:** `max-w-7xl` for dashboards, `max-w-4xl` for focused pages

### Status Cycle

Task/chapter statuses cycle on click:
`Not Started` → `In Progress` → `In Review` → `Completed`

### Animations

- Hero orbs: `anim-spin-slow` + `anim-float`
- Cards on hover: `-translate-y-0.5` or `-translate-y-1` + `shadow-lg`
- Stat counters: `useCountUp()` hook triggers on IntersectionObserver
- Batch card icons: `group-hover:scale-110` on hover
- Fade-up entry: `anim-fade-up` with staggered `delay-100/200/300` classes

---

## 2. Public Landing Page

**Route:** `/`

### Navbar (Fixed, Glassmorphism)

- **Logo:** 36px rounded-xl gradient square (indigo→violet) with "E" + "EduAI" wordmark
- **Badge:** "For Schools" pill (indigo, hidden on mobile)
- **Nav links:** Features · Batches · Pricing · About (anchor links, hidden on mobile)
- **CTA:** "Explore" text link + "Get Started →" gradient button (indigo→violet)
- **Sticky:** `fixed top-0 z-50` with `glass` backdrop blur
- **Height:** 68px

### Hero Section

- **Background:** `gradient-hero` with 3 floating blurred orbs (indigo, violet, amber) — all animated with `anim-float` and `anim-spin-slow`
- **Announcement pill:** Green pulse dot + "Now live for CBSE Schools across India" + arrow — `anim-fade-up`
- **Headline:** 5xl–7xl bold, "The AI Platform for **Every Student, Every Grade.**" — gradient underline on "Every Student,"
- **Subtext:** "A B2B education platform for Indian schools..." mentioning Class 1–12 + NCERT
- **CTA Row:** 2 buttons — "Explore the Platform →" (gradient primary) + "View All Batches" (white bordered)
- **Bento Preview Grid** (5 floating cards, 12-col layout):
  - **Streak Card** (col-span-4): 🔥 "12 Days!" + 7-day calendar dots (M–F filled amber, S–S empty)
  - **AI Chat Card** (col-span-5): Simulated chat — student asks Newton's Second Law, AI responds with F=ma + analogy
  - **Badge Card** (col-span-3): 2×2 grid — ⭐ First Game, 🔥 7-Day Streak, 🧠 Quiz Master, 📸 Explorer
  - **Subject Progress Card** (col-span-6): 3 progress bars — Maths 78%, Science 64%, English 91%
  - **Board Countdown Card** (col-span-6): "87 days to board exam" + syllabus 65% progress bar

### Stats Bar

- **Background:** Gradient indigo→violet
- **4 animated counters** (trigger on scroll via IntersectionObserver):
  - 12+ Grade Levels
  - 4 Learning Batches
  - 16 Interactive Games
  - 100% NCERT Aligned

### Batch Showcase (4 Cards Grid)

- **Section header:** "One Platform. Four Worlds."
- **Layout:** 2-col grid on desktop, 1-col on mobile
- **Each batch card** contains:
  - Batch label pill (e.g. "Batch 1") in batch color
  - Grades heading (e.g. "Class 1–4")
  - Tagline (e.g. "Playful Learning")
  - Description sentence
  - 4 feature pills (e.g. "16 Mini Games", "Vision AI Show & Tell")
  - Stats label (e.g. "16 games")
  - "Enter Dashboard →" gradient link
  - Decorative gradient blob behind (10% → 20% opacity on hover)
  - Hover: `-translate-y-1` + `shadow-2xl`

| Batch | Gradient | Icon |
|-------|---------|------|
| Batch 1 | amber→orange | 🎮 |
| Batch 2 | indigo→violet | 💬 |
| Batch 3 | sky→cyan | 🗺️ |
| Batch 4 | slate→purple | 🎯 |

### Features Section

- **Background:** `from-gray-50 to-white`
- **Section header:** "Built for Every Learning Moment"
- **6 feature cards** in 3-col grid:
  - 🤖 AI-Powered Tutoring
  - 🎮 Gamified Learning
  - 📊 Smart Analytics
  - 🗺️ Concept Maps
  - 🎯 Career Pathway
  - 📋 Board Exam Prep
- Each card: gradient icon box + title + 2-line description
- Hover: `-translate-y-1` + `shadow-lg` + icon `scale-110`

### CTA / Trust Section

- **Dark gradient card** (indigo→violet, rounded-3xl) with 20 scattered white dots background
- 🏫 icon, headline, sub-text
- 2 CTA buttons: "Try the Platform →" (white) + "Schedule a Demo" (glass)

### Footer

- **Background:** `bg-gray-950`
- **Logo row:** EduAI logo + nav links (Features, Batches, Privacy, Terms, Contact)
- **Bottom row:** Copyright + 4 batch links

---

## 3. Auth Pages

### 3.1 Login Page

**Route:** `/login`

#### Left Panel (hidden on mobile)

- Full-height gradient panel (indigo→violet→purple)
- Floating white card with EduAI logo
- 3 feature pills: "AI-Powered" / "NCERT Aligned" / "For Schools"
- 3 stats: 50K+ Students, 500+ Schools, 98% Satisfaction
- Animated orb in background (anim-spin-slow)
- Quote: "Learning reimagined for India's future."

#### Right Panel (Form)

- **Heading:** "Welcome back" + "Sign in to your EduAI account"
- **Role Selector** (3 gradient buttons):
  - 👨‍🎓 Student (indigo→violet)
  - 👨‍🏫 Teacher (sky→cyan)
  - 👨‍👩‍👧 Parent (emerald→teal)
  - Active state: full gradient fill + shadow; inactive: white with colored border
- **School Code** input (text, placeholder "e.g. DPS-NOIDA-2024")
- **Email** input
- **Password** input (show/hide toggle 👁)
- **Submit button:** "Sign In →" gradient, 1200ms simulated loading with "Signing in..." spinner
- **Redirect on submit:**
  - Student → `/batch1/home` (or appropriate batch)
  - Teacher → `/teacher/dashboard`
  - Parent → `/parent/dashboard`
- **Quick Demo Links grid** (bottom): 6 cards — Batch 1–4 Student, Teacher, Parent — each clicks directly in
- **Register link:** "New here? Create account →"

#### Interactions

- Role selector changes form gradient accent color
- Password toggle shows/hides characters
- Loading state: button disabled + spinner + "Signing in..."

---

### 3.2 Register Page

**Route:** `/register`

#### Progress Indicator

- 3 step pills at top: "Role & School" / "Your Details" / "Confirm"
- Active step: gradient fill; completed: green ✓; pending: gray

#### Step 1 — Role & School

- Role selector (3 cards): Student / Teacher / Parent
- **School Code** input + "Verify" button
- Verify simulates 1500ms check → shows "✓ School verified" green toast
- "Next →" disabled until school verified

#### Step 2 — Your Details (Role-specific)

**Student:**
- Full name input
- Class selector (1–12 dropdown)
- Section selector (A/B/C/D)
- **Avatar picker:** 12 emoji options in a grid — 🦁🐯🦊🐼🐸🦋🦄🐉🚀⭐🎯🏆
- Selected avatar: ring + scale animation

**Teacher:**
- Full name + Employee ID
- Subject specialization
- Classes taught (multi-select checkboxes)

**Parent:**
- Parent name + phone number
- Child's name + class

#### Step 3 — Confirm

- Summary card showing all entered data
- Avatar + name displayed
- Batch assigned based on class (getBatchFromClass() mapping)
- "Create Account" button → 1500ms loading → sets localStorage:
  - `batch{n}_nickname` = entered name
  - `batch{n}_avatar` = selected emoji
  - `batch{n}_stream` = JEE/NEET (batch 4 only)
- Redirects to appropriate dashboard

---

## 4. Batch 1 — Class 1–4 (Amber)

**Theme:** Amber/Orange · Playful, large fonts, emoji-heavy, gamified

### 4.1 Layout (`/batch1/layout.tsx`)

**Sidebar (desktop):**
- Logo: amber gradient + 🎮 icon
- Nav items with icons: 🏠 Home · 📖 Stories · ⭐ Mini Quizzes · 📊 My Progress · ✅ My Tasks · 🎮 Games · 🏅 Badges · 🎤 Show & Tell · 🔥 Streak
- Active item: amber background + border
- Bottom: student avatar + name + XP count + sign out

**Bottom Nav (mobile):**
- 5 icons: 🏠 · 📖 · ⭐ · 🎮 · 👤
- Active icon: amber color

**Top Bar:**
- Greeting ("Good morning, [Name]!")
- Subtitle ("Ready to learn today?")
- Notification bell with count
- Avatar circle (emoji)

---

### 4.2 Home (`/batch1/home`)

- **Welcome banner:** Animated amber gradient, child's avatar + name + streak count
- **XP Progress bar:** Current XP toward next level
- **Today's Tasks** quick-view: 3 task cards with subject, due time, colored dot
- **Subject cards** (4 cards): English, Maths, Science, EVS — each with completion % bar
- **Recommended story** card linking to `/batch1/stories`
- **Daily challenge** CTA card
- **Badges recently earned** row (horizontal scroll)
- **Streak calendar** widget (7-day view)

---

### 4.3 Stories (`/batch1/stories`)

#### List View

- **Subject filter tabs:** All · English · Maths · Science
- **6 story cards** each showing:
  - Cover emoji + colored background
  - Title + subject badge
  - Read time estimate
  - "Read ✓" indicator if completed
  - Click → Reading mode

#### Reading Mode

- Full-width story panel with large friendly text
- **Page progress dots** at top (e.g. ● ● ○ ○)
- Prev / Next page buttons
- **🔊 Read Aloud** button (badge shows "Playing..." when active)
- Page number indicator ("Page 2 of 4")
- Illustrated section with emoji decorations
- After last page → "Take the Quiz!" CTA

#### Quiz Mode (post-reading)

- 3 multiple choice questions
- A / B / C / D buttons
- On select: green flash = correct, red flash = wrong
- After all questions: score screen with star rating
- "Back to Stories" link

---

### 4.4 Mini Quizzes / Exams (`/batch1/exams`)

- **Header:** Total star collection — ⭐ X / Y stars earned
- **6 quiz cards** each showing:
  - Subject badge + chapter name
  - Stars earned display (⭐⭐⭐ or ☆☆☆)
  - "Start Quiz" button
  - "Retake" if already completed

#### Quiz Flow

- Progress bar across top (Question 1 of 3)
- Large question text
- 4 option buttons (A/B/C/D)
- On select: green (correct) or red (wrong) with feedback text
- Auto-advance after 800ms
- **Score screen:**
  - ⭐⭐⭐ for 100%, ⭐⭐ for ≥60%, ⭐ for >0%
  - "Great job!" / "Good effort!" / "Keep practicing!" messages
  - "Back to Quizzes" + "Try Again" buttons

---

### 4.5 Progress (`/batch1/progress`)

#### Main Panel

- **4 Subject rows** (collapsible):
  - Click header → expands chapter list
  - Chapter rows show: name + score bar + % score
  - Color-coded: green ≥80%, amber 60–79%, rose <60%
- **Weekly Activity Bar Chart:**
  - 7 bars (Mon–Sun) using CSS heights
  - Labels below bars
  - Highlight: today's bar in amber

#### Sidebar

- **AI Coach card:** 3 personalized suggestions with action icons
- **Parent View toggle:**
  - OFF: full chapter detail
  - ON: simplified 3-stat summary (Avg Score, Streak, Chapters Done)

---

### 4.6 Tasks (`/batch1/tasks`)

- **Stats row** (4 cards): ✅ Completed · ⏳ In Progress · 📋 Pending · ⚡ XP Earned
- **XP progress bar:** Earned / Total XP for the week
- **Filter tabs:** All · Today · Tomorrow · This Week
- **Task cards** (click-to-cycle status):
  - Subject badge + task name
  - XP value badge
  - Status pill (cycles: Not Started → In Progress → In Review → Completed)
  - Due date label
  - Color-coded left border by status

---

### 4.7 Games (`/batch1/games`)

- **Grid of game cards** (16 total):
  - Game icon + name + subject tag
  - Stars rating (1–3)
  - "Play" button

#### Alphabet Tracing (`/batch1/games/alphabet-tracing`)
- Canvas-based letter tracing
- Large dotted letter guide
- Stroke detection feedback

#### Phonics Pop (`/batch1/games/phonics-pop`)
- Balloon-popping style
- Pop balloons matching the spoken phoneme
- Score counter + timer

#### Count and Add (`/batch1/games/count-and-add`)
- Visual counting with objects
- Addition problems shown as grouped objects
- Drag-drop or tap interface

---

### 4.8 Badges (`/batch1/badges`)

- **Earned badges** section (larger cards, gold glow)
- **Locked badges** section (grayed out, shows unlock condition)
- Badge types: Streak badges (7/14/30 day) · Subject badges · Quiz badges · Games badges
- Each badge: icon + name + date earned / "Complete X to unlock" text

---

### 4.9 Show & Tell (`/batch1/show-and-tell`)

- Upload area (camera icon + "Take a photo or upload")
- AI analyzes image → returns subject label + fun facts
- History of past show-and-tells with AI responses
- 🎙️ Voice recording option for description

---

### 4.10 Streak (`/batch1/streak`)

- Full monthly calendar heatmap (colored squares by activity level)
- Current streak counter (large, animated 🔥)
- Longest streak record
- "Don't break your streak!" motivational banner
- Daily checkin button if not checked in today

---

### 4.11 Profile (`/batch1/profile`)

- Avatar (large emoji display) with "Change" button → 12 emoji picker
- Name, class, section display
- Nickname edit field (saves to localStorage)
- XP bar + level badge
- All badges earned (compact grid)
- Stats summary: Streak / Stories Read / Quizzes Done / Stars Earned

---

## 5. Batch 2 — Class 5–8 (Indigo)

**Theme:** Indigo/Violet · Academic, structured, NCERT-focused

### 5.1 Layout (`/batch2/layout.tsx`)

**Sidebar (desktop):**
- Logo: indigo gradient
- Nav: 🏠 Home · 📚 Subjects · 💬 AI Chat · 📝 Exams · 📄 Notes · 🔖 PYQ Hub · 🏆 Leaderboard · ⚡ Daily Challenges · 🔥 Streak · 🏅 Badges · 👤 Profile
- Active: indigo background

**Bottom Nav (mobile):** 🏠 · 📚 · 💬 · 🏆 · 👤

---

### 5.2 Home (`/batch2/home`)

- Gradient banner (indigo→violet) with name, class, XP, streak
- **4 subject progress cards** (Maths, Science, English, Social Science)
  - Chapter completion bar + % label
  - "Continue Chapter X" CTA
- **Upcoming exam card** with countdown timer
- **Daily challenge CTA** (indigo card)
- **Leaderboard preview** (top 3 with rank arrows)
- **Recent AI chat** history snippet

---

### 5.3 Subjects (`/batch2/subjects`)

#### Subject List View

- 4 subject cards with chapter count + overall progress
- Each card: subject icon + name + X/Y chapters + progress bar
- Click → Chapter list

#### Chapter List View

- **Search bar** across all chapters
- Organized by **Units** (collapsible unit headers)
- Each chapter row:
  - Chapter name
  - "Done ✓" badge if completed (with score)
  - Status dot (green/amber/gray)
  - "Practice" button
- **AI Chat CTA banner** at bottom: "Have a doubt? Ask AI →"

---

### 5.4 AI Chat (`/batch2/chat`)

- Full-height chat interface
- **Subject selector** dropdown at top
- **Chat history** with scrollable bubble view:
  - Student message: right-aligned, indigo bg
  - AI response: left-aligned, white card with shadow
  - AI responses support LaTeX math rendering (displayed as formatted text)
  - Source citation badges: "NCERT Ch. 3"
- **Input bar** (bottom):
  - Text input with placeholder "Ask anything about [Subject]..."
  - 📎 attach image button
  - Send button
- **Suggested questions** chips (shows 4 quick starters)
- **Clear chat** button

---

### 5.5 Exams (`/batch2/exams`)

- Exam cards with subject, chapter, duration, total marks
- **Filter:** By subject / Upcoming / Completed
- Each completed exam: score + date + "Review" button
- Start exam flow:
  - MCQ questions with A/B/C/D options
  - Timer countdown (top right)
  - Question navigation dots (jump to any question)
  - Submit button → score breakdown by topic

---

### 5.6 Notes (`/batch2/notes`)

- **Subject tabs** (filter by subject)
- Note cards with title + subject badge + preview text + date
- **New Note** button → modal with:
  - Title input
  - Rich text area
  - Subject selector
  - Save / Cancel
- Notes support: Bold, Italic, Bullet lists (basic formatting)
- **AI Summarize** button on each note → generates 3-point summary

---

### 5.7 PYQ Hub (`/batch2/pyq`)

- **Filter:** Year (2020–2024) + Subject + Chapter
- PYQ paper cards with:
  - Year + Board + Subject
  - Attempted / Not Attempted status
  - Score if attempted
  - "Attempt" / "View Solutions" buttons
- Attempted paper flow: same MCQ flow as Exams
- Solutions view: answer key with explanations

---

### 5.8 Leaderboard (`/batch2/leaderboard`)

- **"Your Rank" banner** (gradient): Rank #X · XP · Gap to next rank ("X XP to beat [Name]")
- **Tabs:** My Class / School
- **Period toggle:** This Week / This Month / All Time
- **Podium (Top 3):**
  - 1st place: center, tallest pedestal (h-32), gold crown 👑
  - 2nd place: left, medium pedestal (h-24), silver
  - 3rd place: right, shortest pedestal (h-20), bronze
- **Full rank table:**
  - Rank # · Avatar · Name · XP · Change (↑3 green / ↓2 red)
  - Your row: highlighted with left indigo border + "You" badge
- **Sidebar:**
  - Subject Toppers (top student per subject)
  - Weekly Risers (biggest rank jumps this week)

---

### 5.9 Daily Challenges (`/batch2/daily-challenges`)

- **4 challenge cards** daily:
  - Title + Subject badge + Difficulty badge (Easy/Medium/Hard)
  - XP reward display
  - Estimated time
  - "Start" button

#### Challenge Flow (3-state)

- **List state:** Cards grid
- **Active state:** Quiz interface identical to exams
- **Done state:**
  - Score + XP earned calculation (`xp × (score/100)`)
  - Confetti animation
  - "Back to Challenges" link

---

### 5.10 Streak (`/batch2/streak`)

- Monthly heatmap calendar
- Streak counter + milestone markers (7 / 14 / 30 / 60 / 100 days)
- XP earned per day bar chart (last 7 days)

---

### 5.11 Badges (`/batch2/badges`)

- Same structure as Batch 1 badges
- Different badge set: Academic badges, PYQ badges, AI chat badges, Leaderboard badges

---

### 5.12 Profile (`/batch2/profile`)

- Avatar + Name + Class
- XP + Level display
- Subject performance summary (5 mini bars)
- Achievements count grid
- Edit name + class fields

---

## 6. Batch 3 — Class 9–10 (Sky Blue)

**Theme:** Sky/Cyan · Board exam prep, analytical, structured

### 6.1 Layout (`/batch3/layout.tsx`)

**Sidebar:**
- Logo: sky gradient
- Nav: 🏠 Home · 📚 Subjects · 🗺️ Concept Map · 📋 Board Prep · 💬 AI Chat · ⚡ Daily Challenges · 📝 Exams · 📄 Notes · 🔖 PYQ · 🍅 Pomodoro · 🔥 Streak · 👤 Profile

---

### 6.2 Home (`/batch3/home`)

- **Board exam countdown banner** (large days counter + subject readiness bars)
- 5 subject cards with chapter progress
- **Important topics today** (AI-curated: 3 topics with frequency bars)
- **Upcoming exam / test** card
- **Weak areas alert** (rose banner if any subject < 60%)
- **Pomodoro quick-start** button

---

### 6.3 Subjects (`/batch3/subjects`)

#### Multi-level Subject → Unit → Chapter View

- Subject selector (5 tabs across top)
- **Unit accordion** (expand/collapse):
  - Unit name + X/Y chapters complete
  - Chapter list inside each unit:
    - Chapter name
    - `important: true` → shows "⭐ Board" badge (sky colored)
    - Score badge if done
    - Status: completed ✓ / in-progress / not started
- **Search bar:** Filters across all chapters (collapses units, shows flat filtered list)
- **Weak area banner** if subject score < 65%: rose warning card with AI suggestions

---

### 6.4 Board Prep (`/batch3/board-prep`)

- **Countdown widget:** "X days to CBSE Board Exam 2026" (target: March 15, 2026)
- **3 Tabs:**

**Past Papers Tab:**
- Subject filter + Year filter (2019–2024)
- Paper cards: Subject + Year + Status + Score
- Attempted: shows score + "Review Answers" button
- Not attempted: "Attempt Now" button → opens exam flow

**Answer Writing Tab:**
- 5 answer-writing tips (toggle show/hide each tip)
- Practice questions with word-count guidance
- "Model answers" expandable sections

**Important Topics Tab:**
- Chapter-wise topic list with **frequency bars** (5-box visual indicator)
- Colors: 5/5 = red (very freq) → 1/5 = gray
- Tags: "Almost certain" / "Likely" / "Possible"
- Toggle: show "Last 3 years only" filter

---

### 6.5 Daily Challenges (`/batch3/daily-challenges`)

- **4 CBSE-style question types** with colored type badges:
  - `HOTS` (Higher Order Thinking) — rose badge
  - `Case Study` — amber badge
  - `A&R` (Assertion & Reason) — violet badge
  - `Source-Based` — sky badge
- Sky-themed cards
- Same 3-state flow: list → active → done
- After completion: CBSE pattern explanation shown

---

### 6.6 AI Chat (`/batch3/chat`)

- Same interface as Batch 2 chat
- **LaTeX Math rendering** (inline formula display)
- Subject context: "NCERT Class 9/10"
- Concept map suggestion: "Want to see a concept map for this topic? →"

---

### 6.7 Concept Map (`/batch3/concept-map`)

- Subject + Chapter selectors
- Visual node-link diagram (SVG/canvas)
- Nodes: concept bubbles connected by labeled arrows
- Click node → shows definition + related chapters
- Zoom in/out controls
- "Export as image" button

---

### 6.8 Exams (`/batch3/exams`)

- Same as Batch 2 but with:
  - CBSE marking scheme display
  - Section A / B / C / D breakdown
  - "How to write 3-mark answers" tip card

---

### 6.9 Notes (`/batch3/notes`)

- Same as Batch 2 notes
- Additional: "Add to Board Prep" tag option
- Notes tagged as board-important get ⭐ icon

---

### 6.10 PYQ Hub (`/batch3/pyq`)

- Same as Batch 2 PYQ but includes:
  - Board exam marking scheme alongside answers
  - "Examiner tips" expandable per question

---

### 6.11 Pomodoro Timer (`/batch3/pomodoro`)

- Large circular timer (SVG ring, sky color)
- **Session presets:** 25/5 · 45/10 · 50/10 minutes (work/break)
- Subject selector for logging
- Start / Pause / Reset controls
- **Session log:** Today's sessions listed with subject + duration
- **Total focus time** counter for today

---

### 6.12 Streak (`/batch3/streak`)

- Same structure as other batches
- Streak tied to board prep milestones

---

### 6.13 Profile (`/batch3/profile`)

- Class 9 or 10 selector
- Board exam target date display
- Subject score table (5 subjects + grades)
- Board readiness % gauge

---

## 7. Batch 4 — Class 11–12 (Slate/Purple)

**Theme:** Slate/Purple · Career-focused, JEE/NEET prep, analytical

### 7.1 Layout (`/batch4/layout.tsx`)

**Sidebar:**
- Logo: slate-to-purple gradient
- Nav: 🏠 Home · 🎯 JEE/NEET Prep · 📅 Schedule Planner · 📚 Subjects · 💬 AI Chat · 🗺️ Concept Map · 📝 Exams · 📄 Notes · 🔖 PYQ · 🍅 Pomodoro · 🎓 Career Path · 📊 Weightage · 🔥 Streak · 👤 Profile

---

### 7.2 Home (`/batch4/home`)

- **Stream badge** (JEE/NEET) persisted from localStorage (`batch4_stream`)
- **Exam countdown** with JEE/NEET target date
- **Readiness gauge** (circular SVG, slate color)
- Today's study plan preview (from schedule planner)
- **Subject performance** cards (Physics, Maths, Chemistry or Biology)
- **Rank predictor** snippet
- **Career path AI suggestion** card

---

### 7.3 JEE/NEET Prep (`/batch4/jee-neet-prep`)

- **Stream toggle** (JEE ↔ NEET) — changes ALL content dynamically
  - JEE: Physics, Maths, Chemistry
  - NEET: Physics, Chemistry, Biology

- **4 Tabs:**

**Overview Tab:**
- **Circular readiness gauge** (SVG `strokeDasharray` animation):
  - Outer ring = overall readiness %
  - Center: % number + label
- **Subject readiness bars** (3 subjects each with %)
- **Strengths vs Weak areas** (2-col split)
- **Recent mock score** card

**Topic Weightage Tab:**
- Table: Topic → Chapters → Avg questions in exam → Weightage %
- Color-coded rows (high/medium/low weightage)
- Filter by subject

**Mock Pattern Tab:**
- Official exam pattern table (sections, marks, questions)
- Section timer distribution
- Marking scheme (+4 / -1 or +4 / 0)
- "Take a Full Mock" CTA

**Rank Predictor Tab:**
- Input fields: Expected Score + Percentile (slider 0–100)
- **Predicted rank range** display (e.g. "AIR 1,200 – 1,800")
- Percentile gauge
- **Previous cutoffs table** (year-wise, subject-wise)
- "What college can I get?" section with rank-based suggestions

---

### 7.4 Schedule Planner (`/batch4/schedule-planner`)

- **Settings Panel:**
  - Goal selector (JEE Advanced / JEE Mains / NEET / Class 12 Boards)
  - Target date picker
  - Hours per day range slider (2–12 hours)
  - **Weak subjects multi-toggle** (Physics / Maths / Chemistry / Biology — tap to mark weak)
  - "Generate AI Plan" button → 1800ms loading animation

- **Generated Plan Display (5-day plan):**
  - Day tabs (Mon–Fri)
  - Each day: list of study tasks with:
    - Subject + Topic name
    - Duration (e.g. 90 min)
    - Task type badge: Study / Practice / Mock / Revision
    - Type colors: Study=indigo, Practice=sky, Mock=rose, Revision=amber
  - **Today's tasks** are interactive (click to mark complete with ✓)

---

### 7.5 Subjects (`/batch4/subjects`)

- Stream-aware: shows JEE or NEET subjects
- Unit → Chapter → Subtopic 3-level hierarchy
- Weightage badges on chapters ("15% weightage" chips)
- Chapter-level notes access
- Practice set CTA per chapter

---

### 7.6 AI Chat (`/batch4/chat`)

- Same base interface
- Stream context in header: "JEE Chemistry" or "NEET Biology"
- LaTeX support for equations
- Numerical problem solving with step-by-step breakdown
- Diagram descriptions for physics/biology

---

### 7.7 Concept Map (`/batch4/concept-map`)

- Same as Batch 3 concept map
- More complex node graphs (multi-level) for JEE/NEET topics

---

### 7.8 Career Path (`/batch4/career`)

- Input: Current scores per subject
- AI output:
  - Top 5 recommended career paths with % match
  - Entrance exams needed
  - Colleges that match
  - Timeline visualization
- Career cards: Engineering / Medical / Research / Civil Services / CA / Law
- Each card: icon + career name + required subjects + avg salary range

---

### 7.9 Weightage (`/batch4/weightage`)

- **Stream-aware table** (JEE or NEET)
- Chapters sorted by weightage (highest first)
- 3-year trend: 2022 / 2023 / 2024 question counts
- "Must do" flag on chapters appearing in all 3 years
- Filter by subject

---

### 7.10 Onboarding (`/batch4/onboarding`)

- First-time flow (triggered if no localStorage stream set)
- Step 1: Stream selection (JEE / NEET)
- Step 2: Target year
- Step 3: Current preparation level (Beginner / Intermediate / Advanced)
- Saves to localStorage → redirects to home

---

### 7.11 Exams / Notes / PYQ / Pomodoro / Streak / Profile

- Same structure as Batch 3 equivalents
- JEE/NEET exam patterns applied
- PYQ: JEE Mains + Advanced or NEET papers by year
- Pomodoro: recommended 50/10 sessions for entrance prep

---

## 8. Teacher Portal

**Theme:** White sidebar, indigo accents — clean, professional

### 8.1 Layout (`/teacher/layout.tsx`)

**Sidebar (white, fixed):**
- Logo: EduAI + "Teacher Portal" sub-label
- Nav: 🏠 Dashboard · 👥 Students · 📋 Assign Tasks · ✏️ Create Exam · 📈 Reports
- Active item: indigo background + indigo text
- Bottom: Sign Out link

**Top Bar:**
- "Welcome, Teacher" + "Tracking your class's progress"
- No batch color theming — neutral gray/white

---

### 8.2 Dashboard (`/teacher/dashboard`)

#### Stat Cards (4 cards)

| Icon | Value | Label | Color |
|------|-------|-------|-------|
| 👥 | 101 | Total Students | indigo |
| ✅ | 82 | Active Today | green |
| 📊 | 71% | Avg Score | sky |
| 📋 | 18 | Tasks Assigned | amber |

#### Class Overview Table

- Columns: Class · Students · Active Today (progress bar) · Avg Score · Avg Streak
- Mini inline progress bar for "Active Today"
- Score color: green ≥70%, amber <70%
- "View →" link per row
- "See All →" header link

#### Students Falling Behind (At-Risk Panel)

- Red badge count on header
- Per-student row: avatar + name + class + last active + avg score + issue badge ("Low score" / "Streak broken")
- "Assign Task" button per student → `/teacher/assign-tasks`

#### Recent Activity Feed

- Per-activity row: 🎓 icon + "[Student] — [Action]" + subject badge + time ago + score (if applicable)

#### Quick Actions Sidebar

- 4 colored buttons: Assign New Task (indigo) · Create Exam (sky) · View Reports (green) · View All Students (violet)

#### Avg by Subject Sidebar

- 4 horizontal progress bars: English / Maths / Science / Social Science

---

### 8.3 Students (`/teacher/students`)

#### List View

- **Search bar** (by name)
- **Class filter** buttons: All / 7-A / 7-B / 7-C
- **At-Risk toggle** filter (rose button)
- **Student cards grid** (3-col on desktop):
  - Avatar emoji + name + class + last active
  - 3-stat mini grid: 🔥 Streak · Avg% · XP
  - "View Profile →" button
  - At-risk cards: rose border + ⚠️ badge

#### Student Drill-Down View

- Back button "← Back to Students"
- **Header gradient card** (indigo): avatar + name + class + XP + avg score
- **3-stat row:** Streak / Last Active / Total XP
- **Subject Performance bars** (4 subjects, derived from avgScore ± offset)
- Score color: rose if < 60%

---

### 8.4 Assign Tasks (`/teacher/assign-tasks`)

#### Form Layout

- **Task Type selector** (5 buttons): Quiz / Reading / Practice Problems / PYQ Paper / Custom
- **Subject dropdown:** Mathematics / Science / English / Social Science / Hindi
- **Due Date** date picker
- **Task Title** text input
- **Instructions** textarea (optional)

#### Assign To Toggle (3 modes)

**Student mode:**
- Checkbox grid of all 8 students
- Selected student: indigo border + bg

**Class mode:**
- Class button grid (Class 7-A / 7-B / 7-C / 8-A)
- Selected: indigo highlight

**Batch mode:**
- 4 batch buttons (Batch 1–4)
- Selected: indigo highlight

#### Submit

- "Assign Task" gradient button
- Success toast (3000ms): green banner "Task assigned successfully! Students will see it on their dashboard immediately."

---

### 8.5 Create Exam (`/teacher/create-exam`)

#### Exam Details Panel

- **Exam Title** text input
- **Subject** dropdown (5 options)
- **For Class** dropdown (Class 6–12)
- **Duration slider** (10–180 min, step 5) — shows live value

#### Add Question Panel

- **Question type selector** (4 toggle buttons): MCQ · True/False · Short Answer · Long Answer
- **Question textarea** (2 rows)
- **MCQ options:** 4 text inputs + radio button for correct answer
- **True/False:** Radio buttons for True/False correct answer
- **Marks input** (number, 1–20) — auto-sets default based on type
- "**+ Add**" button (disabled if no question text)

#### Question Bank Panel

- **Subject filter** dropdown
- 2–3 questions per subject from NCERT bank
- Each question: text + type badge + marks label + "+ Add" button
- Click "+ Add" → appends to question list

#### Exam Preview Sidebar (sticky)

- Header: question count + total marks badge
- Exam title + subject + class + duration
- **Question list** (scrollable, max-h-80):
  - Numbered circles + question text + type badge + marks
  - ✕ remove button per question
- "**✅ Publish Exam**" gradient button (only shows when questions added)
- Click publish → success screen:
  - 🎉 "Exam Created!"
  - "Create Another" + "Assign to Students →" buttons

---

### 8.6 Reports (`/teacher/reports`)

#### Period Toggle

- "This Week" / "This Month" / "This Term" (in header banner)

#### Summary Stats (4 cards)

- 📊 Class Avg: 68% · 🏆 Top Score: 92% · ✅ Tasks Completed: 142 · ⚠️ At Risk: 3

#### Performance Heatmap

- **Rows:** 8 students (Aisha, Dev, Meera, Riya, Arjun, Kabir, Sneha, Rohan)
- **Columns:** English · Maths · Science · Social Sci · Average
- **Color coding:**
  - ≥80%: `bg-green-500` white text
  - 65–79%: `bg-amber-400` white text
  - 50–64%: `bg-orange-400` white text
  - <50%: `bg-rose-500` white text
- **Legend** shown top-right of table

#### Subject Trends Panel

- 4 horizontal bars: English / Maths / Science / Social Sci
- Color: green ≥70%, amber 60–69%, rose <60%

#### Export Reports Panel

- 4 download buttons:
  - 📄 Full Class Report (PDF)
  - ⚠️ At-Risk Students (CSV)
  - 📊 Subject Analysis (PDF)
  - 👨‍👩‍👧 Parent Report Cards (PDF)
- Hover: "Download →" label appears

---

## 9. Parent Portal

**Theme:** Emerald/Teal — calm, trustworthy, informative

### 9.1 Layout (`/parent/layout.tsx`)

**Sidebar (white, fixed):**
- Logo: EduAI + "Parent Portal" label + 🌱 icon (emerald gradient)
- Nav: 🏠 Dashboard · 📈 Child's Progress · 📋 Reports
- Active: emerald background + border
- Bottom: Sign Out link

**Top Bar:**
- "Welcome, Parent" + "Tracking your child's learning journey"
- 👨‍👩‍👧 avatar icon

**Bottom Nav (mobile):** 3 icons — 🏠 · 📈 · 📋

---

### 9.2 Parent Dashboard (`/parent/dashboard`)

#### Child Summary Banner (emerald gradient)

- Child avatar emoji + name + class
- 3 stats: 🔥 18 Day Streak · 4,820 XP Earned · 88% This Week

#### Today's Activity Feed

- 4 rows: subject icon + action + time + score (if applicable)
- e.g. "📐 Completed Chapter 5 Quiz · Mathematics · 9:30 AM · 92%"
- Hover: gray bg highlight

#### This Week's Performance

- **4 subject progress bars** with color-coded scores
- **AI Coach Insight card:** (emerald, bottom) — personalized parent tip

#### Upcoming Exams Sidebar

- 3 exam cards with subject, title, date, "X days left" badge
- Color-coded by subject

#### Quick Access Sidebar

- 3 action cards: Detailed Progress → / Download Report Card → / Message Teacher →

---

### 9.3 Child Progress (`/parent/child-progress`)

#### Header Banner

- Child name + class + overall average % (large right side)

#### Tabs (3 tabs)

**Subject Overview Tab:**
- 5 subject cards (Mathematics, Science, English, Social Science, Hindi)
- Each card:
  - Subject name + Grade badge (A+/A/B+/B)
  - Score trend: ↑ +X% green or ↓ -X% rose
  - Large score display (right)
  - Chapters done: X/Y
  - Progress bar (full width)
  - Secondary bar: syllabus completion %

**Test History Tab:**
- Table: Test Name · Date · Math · Science · English · S.Sc · Overall
- Color-coded scores (green ≥85%, amber ≥70%, rose <70%)
- Footer note: trend description ("Scores improving from 79% → 83%")

**Teacher Comments Tab:**
- 3 comment cards (one per subject teacher):
  - Teacher avatar + name + subject badge + date
  - Quoted comment in italic
- CTA card: "Want to reply? Send Message" button

---

### 9.4 Reports (`/parent/reports`)

#### Week Selector

- 2 toggle buttons: "This Week" / "Last Week"
- Each shows week date range
- Selected: emerald border + bg

#### Report Details (split layout)

**Left (main):**

- **Weekly Summary** card: paragraph AI summary + 3 mini stats (Streak / XP / Tasks Done)
- **Subject Scores** — 5 bars color-coded by performance
- **Highlights vs Focus Areas** (2-col split):
  - ✅ Highlights: green bg + bullet list
  - ⚠️ Focus Areas: amber bg + bullet list

**Right sidebar:**

- **AI Insights** (4 cards):
  - 🎯 Strength Area
  - ⚡ Needs Attention
  - 🔥 Streak Milestone
  - 📈 Trend
  - Each: icon + title + 2-line description

- **Share Report panel:**
  - 📄 Download PDF Report (indigo button)
  - 📱 Share on WhatsApp (green button) → shows "✅ Shared via WhatsApp!" toast for 2500ms
  - 📧 Send to Email (gray button)

---

## 10. Public Marketing Pages

### 10.1 Features Page (`/features`)

#### Navbar (white, sticky)

- EduAI logo + nav links (Features active) + Login + "Get Started" button

#### Hero

- Badge chip + "Features built for Indian classrooms" heading
- Gradient headline with indigo accent on "Indian classrooms"
- Sub-text

#### Stats Bar (indigo gradient)

- 4 stats: 50,000+ Students · 98% CBSE Coverage · 500+ Schools · 4.8★ Rating

#### Features Grid (3 columns, 6 cards)

| Feature | Gradient | Pills |
|---------|---------|-------|
| 🤖 AI-Powered Learning | indigo→violet | Smart Recommendations, Gap Analysis, Adaptive Quizzes |
| 📚 NCERT-Aligned Content | sky→cyan | Chapter-wise Coverage, Board Exam Focus, PYQ Bank |
| 🏆 Gamified Motivation | amber→orange | Daily Streaks, Leaderboards, Achievement Badges |
| 📊 Real-time Analytics | emerald→teal | Live Dashboards, Heatmaps, Export Reports |
| 🎯 JEE & NEET Prep | rose→pink | Mock Tests, Rank Predictor, Topic Weightage |
| 👨‍👩‍👧 Parent Connect | violet→purple | Weekly Reports, WhatsApp Share, Teacher Messaging |

- Each card: gradient icon box + hover: `-translate-y-1` + `shadow-lg`

#### CTA Section (indigo gradient)

- "Ready to transform your school?" heading
- "Start Free Trial" (white) + "Talk to Us" (glass border)

---

### 10.2 Pricing Page (`/pricing`)

#### Annual/Monthly Toggle

- Pill toggle switch (indigo)
- Annual: shows discount ("Save 17%")
- Toggling recalculates all prices live

#### 3 Pricing Plans

| Plan | Monthly | Annual | Target |
|------|---------|--------|--------|
| Starter | ₹299/mo | ₹249/mo | Individual student |
| School | ₹149/student | ₹119/student | Schools (min 30 students) |
| Enterprise | Custom | Custom | Large school chains |

- **School plan:** "Most Popular" pill badge at top (gradient)
- Feature list per plan:
  - ✓ included (gray-700)
  - ✕ not included (gray-300)
- CTA: Starter/School → `/register`, Enterprise → `/contact`

#### FAQ Section (Accordion)

- 4 FAQs with expand/collapse toggle (▼ rotates on open)
- Questions: Free trial? · Switch plans? · Offline access? · Per-student pricing?

---

## 11. Shared Components

### Sidebar (`/components/shared/Sidebar.tsx`)

- **Props:** `navItems`, `batchColor`, `logo`, `bottomSlot`
- `batchColor` values: `"amber" | "indigo" | "sky" | "slate"`
- Each NavItem: `href`, `label`, `icon`, `children?` (nested sub-nav)
- Collapsible nested items with chevron toggle
- Desktop only (mobile uses bottom nav in layout)

### TopBar (`/components/shared/TopBar.tsx`)

- **Props:** `greeting`, `userName`, `subtitle`, `batchColor`, `notifCount`, `userAvatar`, `profileHref`, `rightSlot`
- Notification bell: shows red badge count if > 0
- `rightSlot`: optional extra element (e.g. streak display)

---

## 12. Page Route Map

```
/                           — Public Landing
/login                      — Auth: Login
/register                   — Auth: Register (3-step)

/batch1/home                — B1: Dashboard
/batch1/stories             — B1: Story Reader + Quiz
/batch1/exams               — B1: Star Quizzes
/batch1/progress            — B1: Progress + Parent View
/batch1/tasks               — B1: Task Manager
/batch1/games               — B1: Game Gallery
/batch1/games/alphabet-tracing
/batch1/games/phonics-pop
/batch1/games/count-and-add
/batch1/badges              — B1: Badge Collection
/batch1/show-and-tell       — B1: Vision AI
/batch1/streak              — B1: Streak Calendar
/batch1/profile             — B1: Student Profile

/batch2/home                — B2: Dashboard
/batch2/subjects            — B2: Subjects + Chapters
/batch2/chat                — B2: AI Tutor Chat
/batch2/exams               — B2: Mock Exams
/batch2/notes               — B2: Study Notes
/batch2/pyq                 — B2: Past Year Questions
/batch2/leaderboard         — B2: Class/School Ranks
/batch2/daily-challenges    — B2: Daily Challenges
/batch2/streak              — B2: Streak Tracker
/batch2/badges              — B2: Badges
/batch2/profile             — B2: Profile

/batch3/home                — B3: Dashboard
/batch3/subjects            — B3: Subjects + Board Tags
/batch3/concept-map         — B3: Visual Concept Maps
/batch3/board-prep          — B3: Board Exam Zone
/batch3/chat                — B3: AI Chat (LaTeX)
/batch3/daily-challenges    — B3: CBSE-Style Challenges
/batch3/exams               — B3: Practice Exams
/batch3/notes               — B3: Notes
/batch3/pyq                 — B3: Board PYQ Papers
/batch3/pomodoro            — B3: Focus Timer
/batch3/streak              — B3: Streak
/batch3/profile             — B3: Profile

/batch4/home                — B4: Dashboard
/batch4/onboarding          — B4: Stream Setup
/batch4/jee-neet-prep       — B4: JEE/NEET Hub
/batch4/schedule-planner    — B4: AI Study Planner
/batch4/chat                — B4: AI Chat
/batch4/concept-map         — B4: Concept Maps
/batch4/exams               — B4: Entrance Mocks
/batch4/notes               — B4: Notes
/batch4/pyq                 — B4: JEE/NEET PYQs
/batch4/pomodoro            — B4: Pomodoro
/batch4/career              — B4: Career Path AI
/batch4/weightage           — B4: Topic Weightage
/batch4/streak              — B4: Streak
/batch4/profile             — B4: Profile

/teacher/dashboard          — Teacher: Home
/teacher/students           — Teacher: Student Grid + Drill-down
/teacher/assign-tasks       — Teacher: Task Assignment
/teacher/create-exam        — Teacher: Exam Builder
/teacher/reports            — Teacher: Heatmap Analytics

/parent/dashboard           — Parent: Home
/parent/child-progress      — Parent: Subject + Test + Comments
/parent/reports             — Parent: AI Report Card + Share

/features                   — Public: Feature List
/pricing                    — Public: Plans + FAQ
```

> **Pending pages** (planned but not yet built):
> - `/about` — Company / Mission page
> - `/contact` — Contact form + school inquiry
> - `/batch2/tasks` — Batch 2 task manager (uses same pattern as B1)
> - `/batch3/tasks` / `/batch4/tasks` — Task managers for older batches

---

*All pages use `"use client"` directive. No external API calls — all data is static mock with localStorage for user preferences (`batch{n}_nickname`, `batch{n}_avatar`, `batch4_stream`).*
