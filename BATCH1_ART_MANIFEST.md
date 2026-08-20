# Batch 1 Art Manifest — Claymorphism

Every image the Class 1–4 portal needs, as a real generation prompt. No SVG,
no vector, no hand-drawn CSS shapes anywhere in this batch — every one of
these is a raster image (PNG) you generate and hand back, the same way the
reference mockup looks. This replaces the SVG scene/robot I built earlier;
that was wrong given the "no vector" instruction from the start of this
project, and everything below is scoped to fix it properly instead of again.

**Where files go:** drop every finished PNG flat into `art-source/batch1/`,
named exactly as the `Slug` column says (e.g. `nav-games.png`). Nothing else
about naming — I wire each one into `src/routes/batch1/art.ts` once it
exists; partial batches are fine, anything not yet delivered just keeps
showing its current emoji/placeholder.

**Format for every item below (unless a row says otherwise):** PNG,
1024×1024, transparent background.

---

## 0. Style lock — prepend this to every prompt in Batches A and C

> 3D claymorphism render, soft matte clay / soft plastic material with a
> faint subsurface grain, chunky rounded volumetric shapes, fully rounded
> corners, no sharp edges, no hard black outlines, NOT flat, NOT a vector
> icon, NOT a line drawing — a physically-lit 3D object as if photographed on
> a turntable. One soft key light from the upper-left casting a gentle,
> soft-edged contact shadow directly beneath the subject; a faint rim-light
> on the lower-right edge. Saturated candy-bright pastel colors, not neon.
> Subject fills about 80% of the frame, centered, friendly front-three-quarter
> angle. Background: fully transparent. Square canvas, 1024×1024, PNG.
> Reference style: Duolingo / Headspace-style 3D clay mascots and icons —
> soft, toy-like, huggable, production quality, not a sketch.

The **subject** column below is what to append after that paragraph — e.g.
for `nav-games`: *"A single object: a chunky handheld video-game controller,
matte forest-green body, four round candy-colored face buttons (red, blue,
yellow, green), a small round joystick nub, thick rounded grips."*

---

## Batch A — Shell, navigation & characters (do this batch first)

This is the batch that actually fixes the site — the nav tiles, the header,
the live-class banner, every character. Once these ~40 land, nothing in the
app renders SVG or emoji for its main identity elements anymore.

### A1 — Home door icons (the 5 tiles + the map link)

| Slug | UI slot | Subject |
|---|---|---|
| `nav-games` | Games tile | A chunky handheld video-game controller: matte forest-green body, four round candy-colored face buttons (red/blue/yellow/green), a round joystick nub, thick rounded grips. |
| `nav-stories` | Stories tile | An open storybook lying flat, cream clay pages with a soft visible fold down the middle, sky-blue cover, a red ribbon bookmark draped over the edge. |
| `nav-quizzes` | Quiz Time tile | A clipboard with a single sheet of paper clipped to it, a fat rounded amber-orange "?" question mark sitting on the page, a chunky orange clip at the top. |
| `nav-tasks` | My Work tile | A rounded school backpack, bubblegum-pink body, one yellow front pocket with a chunky buckle, two thin straps curled behind it. |
| `nav-trophies` | My Trophies tile | A classic trophy cup: glossy gold cup and handles, a deep purple base/pedestal, one small star embossed on the front. |
| `nav-journey` | "See my map" (Games header) + My Journey page header | A folded paper treasure map tied with a thin brown string, a dotted path visible on the visible face, one small red "X" mark. |

### A2 — Class mascots (avatar-ring fallback, live-banner-adjacent identity)

Keyed by the emoji already in `theme.ts` — no code change needed once these
land, `art.ts`'s emoji-keyed lookup picks them up automatically.

| Slug (= emoji key) | Class | Subject |
|---|---|---|
| `chick` (🐣) | 1 | A round, fluffy baby chick character: big head, tiny body, oversized round eyes, small orange beak, one small wing raised as if waving, standing. |
| `rabbit` (🐰) | 2 | A round chibi rabbit character: tall soft ears (one slightly flopped), big round eyes, small pink nose, one paw raised waving, standing. |
| `fox` (🦊) | 3 | A round chibi fox character: pointed ears, white chest patch, big round eyes, bushy tail visible behind, one paw raised waving, standing. *(Reused for the fox avatar in A3 — one image, two uses.)* |
| `owl` (🦉) | 4 | A round chibi owl character: big round spectacled-looking eyes, small tufted "ear" feathers, small wings tucked, standing on two small feet, one wing raised waving. |

### A3 — Avatar picker characters (student profile picker)

Same chibi-character system as A2, one consistent style across the set —
these are what a child picks as "me" in the profile screen.

| Slug (= emoji key) | Subject |
|---|---|
| `fox` (🦊) | *(already made in A2 — reuse, do not regenerate.)* |
| `lion` (🦁) | Round chibi lion cub: big golden mane rendered as chunky rounded tufts, big round eyes, small round nose, standing, one paw raised. |
| `tiger` (🐯) | Round chibi tiger cub: orange body with soft rounded black stripe shapes, big round eyes, standing, one paw raised. |
| `butterfly` (🦋) | Round chibi butterfly character: big soft rounded wings in two-tone pastel (magenta/violet) with simple dot patterns, small round body, small antennae, front-facing, wings spread. |
| `panda` (🐼) | Round chibi panda cub: white body, black rounded eye-patches and ears, standing, one paw raised waving. |
| `dinosaur` (🦖) | Round chibi dinosaur (T-rex style): stubby little arms, big round friendly eyes, small rounded back plates, standing on two legs, mouth in a closed smile. |
| `unicorn` (🦄) | Round chibi unicorn: white/pastel-lilac body, a short spiral horn, a flowing pastel-rainbow mane rendered as smooth clay ribbons, standing, one hoof raised. |
| `frog` (🐸) | Round chibi frog: bright green body, big round bulging eyes on top of head, small rounded feet, sitting, one small wave gesture. |
| `penguin` (🐧) | Round chibi penguin: black-and-white rounded body, small orange beak and feet, small flippers, one flipper raised waving. |
| `eagle` (🦅) | Round chibi eagle: brown body, white rounded head, small hooked beak, big round eyes, small wings, standing, one wing raised. |
| `wolf` (🐺) | Round chibi wolf pup: grey-blue body, pointed ears, big round eyes, small fluffy tail visible, standing, one paw raised. |
| `raccoon` (🦝) | Round chibi raccoon: grey body, dark rounded eye-mask marking, striped tail visible behind, standing, one paw raised waving. |

### A4 — Achievement badges (My Trophies page)

A consistent "medal" family — chunky rounded medallion disc with a short
ribbon loop at the top, a themed icon embossed/raised on the medallion face,
each medal a different accent color. Real badges, from `supabase/seed.sql` —
not invented.

| Slug | Badge | Subject (medal accent + face icon) |
|---|---|---|
| `badge-streak-7` | 7-Day Warrior | Orange-red medal, a small clay flame embossed on the face. |
| `badge-streak-30` | 30-Day Legend | Deep amber-gold medal, a small clay laurel-wreath-and-star embossed on the face. |
| `badge-xp-rookie` | XP Rookie | Bright yellow-gold medal, a small clay star embossed on the face. |
| `badge-xp-champion` | XP Champion | Royal-blue medal, a small clay faceted gemstone embossed on the face. |
| `badge-word-master` | Word Master | Coral-pink medal, a small clay microphone embossed on the face. |
| `badge-fluent-reader` | Fluent Reader | Sky-blue medal, a small clay open-book embossed on the face. |
| `badge-task-hero` | Task Hero | Violet medal, a small clay rounded checkmark-shield embossed on the face. |
| `badge-exam-ace` | Exam Ace | Emerald-green medal, a small clay target/dartboard embossed on the face. |

### A5 — Subject icons (Quiz Time / My Work / My Journey chips)

| Slug | Subject shown in-app | Icon subject |
|---|---|---|
| `subject-math` | Mathematics | A small clay geometry set: an orange set-square triangle leaning against a blue ruler. |
| `subject-english` | English | A small clay open book with a rounded quill pen resting across it. |
| `subject-hindi` | Hindi | A small clay book with a distinct emerald-green cover and a thin orange ribbon bookmark (no text/glyphs — keep it wordless). |
| `subject-science` | Science / EVS | A small clay terracotta plant pot with a single sprouting green leaf-pair. |
| `subject-art` | Art | A small clay painter's palette with three rounded paint-blob dots (red, yellow, blue) and a short paintbrush laid across it. |
| `subject-default` | Any other subject | A small stack of three clay books, each a different pastel color, slightly fanned. |

### A6 — Live-class banner character

| Slug | Subject |
|---|---|
| `live-banner-robot` | A friendly 3D clay robot character: chunky rounded white-and-lavender plastic body, big round head with one small antenna ball on top, a dark-navy rounded faceplate with two big glowing cyan circle eyes, short rounded arms, one arm raised in a wave, standing, front-facing, full body visible. One consistent robot — the banner *background* is already tinted per class in code, the robot itself stays one character. |

### A7 — Encouragement strip character

| Slug | Subject |
|---|---|
| `encourage-star` | A friendly 3D clay 5-pointed star character: glossy golden-yellow clay material, a big cute closed-eye smiling face, rosy cheek dots, two short stubby clay arms (no legs), floating pose. |

### A8 — Scene backdrop (replaces the SVG hills/school/trees/path/flowers)

This is the one departure from the square-icon format above — it's the wide
background image the whole app sits on.

| Slug | Format | Subject |
|---|---|---|
| `scene-backdrop` | PNG, **2400×1000**, **opaque** (no transparency) | A wide storybook-diorama landscape in the same claymorphism material as everything above: a soft pale-blue gradient sky at top, a warm sun-glow in the upper right, three layered rolling green clay hills (far/mid/near, each a slightly different green), a small clay school building with a peaked orange roof sitting on the left hill, two rounded clay trees on the right hill, a sandy winding clay path cresting the near hill, a scatter of small pink and yellow clay flowers along the bottom edge. Same soft-clay material, same upper-left key light, as the icon set above — this is the set the icons stand on. |
| `scene-cloud` | PNG, 512×160, transparent | A single fluffy 3D clay cloud: rounded lobed white clay shape, soft under-shadow, simple and clean enough to tile/repeat sideways across the backdrop for the two drifting clouds already in the layout. |

**Batch A total: 6 + 4 + 11 new avatars (fox reused) + 8 + 6 + 1 + 1 + 2 = 39 images.**

---

## Batch B — Per-game icons

One clay icon per distinct game (there are 61 distinct games across 67
active rows in `games_catalog`). **Not listing them individually yet** — I'm
not going to guess 61 game names out of the migration files and risk handing
you a wrong list; the moment you want this batch, I'll pull the real
`name`/`icon` pairs straight from `games_catalog` (needs the local Supabase
DB up, or I extract them carefully from the `20250101000021` /
`…000131`–`…000148` migrations) and generate the same kind of table as
Batch A, using this same style-lock prefix. Say the word.

---

## Batch C — In-game content objects

The small objects that appear *inside* game questions and answer options —
catalogued already in `art.ts`'s `SLOTS`, deduplicated here by subject (a
few things like "apple" or "flower" are cataloged in more than one `SLOTS`
category because they're reused in different question types — one image
each, listed once).

Each subject below gets the **Batch A/C style lock** (Section 0) plus:
*"A single [subject], simple and instantly recognizable at small size,
isolated, no scene or background elements around it."*

### Animals (26)

hen, cow, dog, cat, kitten, elephant, monkey, bear, snake, giraffe, goat, pig,
ant, turtle, ox, whale, shark, bird, deer, caterpillar

*(chick, rabbit, fox, owl, lion, tiger, eagle already exist from Batch A2/A3
— reused here, not regenerated.)*

### Everyday objects (33)

bus, train, cycle, pencil, book, school-bag, ruler, clock, bucket, glass,
spoon, jug, cup, bottle, bowl, pot, bathtub, kite, string, umbrella, drum,
bell, piano, flute, ball, nest, box, brick, feather, ladder, thread

*(egg and milk are listed under Food below, not repeated here.)*

### Places & nature (25)

school, house, hut, building, bridge, road, farm, market, hospital, bank,
factory, zoo, pool, river, sea, lake, mountain, rain, rainbow, sun, moon,
tree, plant, leaf, grass, wind

*(cloud and flower already exist from Batch A8/A1-counters — reused.)*

### Food (10)

carrot, rice, wheat, bread, salad, egg, milk, chocolate, candy, chips

*(apple and banana already exist from the counters list below — reused.)*

### Counting objects (8)

apple, banana, star, fish, cupcake, football

*(chick and flower already exist from A2 and Places & Nature — reused.)*

### People & family (11)

family (group), grandmother, grandfather, mother, father, sister, brother,
baby, child, teacher, farmer

— each as a simple clay chibi character consistent with the A2/A3 style
(big head, small body, standing, friendly expression), not a realistic
figure.

**Batch C total: 26 + 33 + 25 + 10 + 6 + 11 = 111 images**, all reusing the
same style lock — the subject line is genuinely just the object name for
almost every one of these (a "cow" prompt needs no more than "a single clay
cow" once the style lock is doing the work above it).

---

## What still needs a small code change once art lands

Not art work — noting it so nothing gets lost:

- **Badges bypass `<Pic>` entirely today.** `BadgeGrid.tsx` renders
  `badge.icon` as a raw emoji span, not through the art seam. Needs a small
  patch to map badge name → the `badge-*` slugs above and render through
  `<Pic name=…>`.
- **`Scene.tsx` and `LiveClassCard.tsx`'s robot are still hand-drawn SVG**
  right now (that's exactly what needs to go) — once `scene-backdrop`,
  `scene-cloud` and `live-banner-robot` exist, I'll swap both files' contents
  for plain `<img>`/`<Pic>` elements and delete the SVG.
- **Subject icon maps** (`Quizzes.tsx`, `Tasks.tsx`, `Syllabus.tsx`) each
  return a bare emoji today (`SUBJECT_PIC`) — small patch to return the
  `subject-*` slug instead so they route through `<Pic name=…>`.
