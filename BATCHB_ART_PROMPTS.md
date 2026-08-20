# Batch B — Game Icon Prompts (real data, not a guess)

Pulled from `games_catalog` — every `insert`/`update` statement across all
17 migration files that touch it, parsed for real (not eyeballed), filtered
to active Class 1-4 rows, deduplicated by icon (that's the key the UI
actually renders on — `<Pic emoji={game.icon}>` in Games.tsx). **61 distinct
icons across 82 active rows / 66 distinct game names** — close to but not
identical to the "~61 across 67" estimate in the original plan; the
difference is this batch is counted from the actual data.

**6 of the 61 are already covered — no prompt needed, nothing to generate:**
Batch A's art happens to be reused by the exact same emoji:

| Icon | Game(s) | Already exists as |
|---|---|---|
| 🐸 | Distance Finder, The Number Hopper | `frog` avatar (both are frog-hops-the-number-line games) |
| 🦁 | Zoo Manners | `lion` avatar |
| 🔢 | Count & Add Stars | `subject-math` |
| 📐 | m, km & ml | `subject-math` (same file as 🔢, different emoji key) |
| 📖 | Story Sequencer | `nav-stories` / `subject-english` |
| 🌱 | Plant Quiz | `subject-science` |

That leaves **55 genuinely new prompts** below. A handful of these also
double as Batch C objects (marked *(= Batch C "x")*) — generating this batch
first quietly knocks a few items off Batch C too.

**Format:** PNG, transparent background, 1024×1024. Save as
`art-source/batch1/<slug>.png`.

**Wiring:** once delivered, add each as an emoji key in `art.ts`'s `ART`
map — e.g. `'🪁': 'icon-kite',` — same mechanism as everything already
wired, no other code change.

---

### `icon-happy-face`
*Icon: 😊 — used by: A Happy Child*

```
3D claymorphism render of a simple round smiling face — big rosy cheeks, closed happy eyes, no body. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-kite`
*Icon: 🪁 — used by: A Kite*

```
3D claymorphism render of a diamond-shaped kite with a long knotted tail ribbon, two crossed wooden struts visible. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-writing-hand`
*Icon: ✍️ — used by: Alphabet Tracing*

```
3D claymorphism render of a hand holding a fat rounded pencil, mid-stroke, as if writing on an unseen surface. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-rain-cloud`
*Icon: 🌧️ — used by: Clouds*

```
3D claymorphism render of a single rounded rain cloud with three fat teardrop raindrops falling beneath it. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-magnifier-tilt`
*Icon: 🔎 — used by: Context Clues*

```
3D claymorphism render of a magnifying glass, round lens with a short angled handle, tilted as if searching. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-school-building`
*Icon: 🏫 — used by: First Day At School*

```
3D claymorphism render of a small school building with a triangular roof, a flagpole on top, and one round clock in the gable. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `baby-chick`
*Icon: 🐥 — used by: How Many?*

```
3D claymorphism render of a small round fluffy baby chick standing front-on, big round eyes, small orange feet, wings tucked (distinct pose from the chick mascot, which waves). Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `hen` *(= Batch C "hen")*
*Icon: 🐔 — used by: Lalu and Peelu*

```
3D claymorphism render of a plump round hen standing, a small red comb on top of its head, short orange beak, small wings tucked. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `kitten`
*Icon: 🐱 — used by: One Little Kitten*

```
3D claymorphism render of a small sitting kitten, big round eyes, small triangular ears, a curled tail. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-balloon`
*Icon: 🎈 — used by: Phonics Pop, also reused for the "no tasks" empty state in the interface list*

```
3D claymorphism render of a single round balloon on a short curly string, a small triangular knot at the base. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-picture-frame`
*Icon: 🖼️ — used by: Reading Explorer*

```
3D claymorphism render of a simple rounded picture frame with a small mountain-and-sun landscape painted inside it. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-puzzle-piece`
*Icon: 🧩 — used by: Sentence Builder, Number Slide*

```
3D claymorphism render of a single classic jigsaw puzzle piece with two rounded tabs and one rounded notch. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### 📖 — *skipped*
Story Sequencer — SKIP, already generated as nav-stories/subject-english, reuse that file

---

### `icon-drum`
*Icon: 🥁 — used by: The Music Man*

```
3D claymorphism render of a small round drum standing on end, two crossed drumsticks resting on top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-abc-blocks`
*Icon: 🔤 — used by: Word Builder*

```
3D claymorphism render of three small rounded alphabet blocks in a row, one letter face visible on each (A, B, C), each block a different pastel color. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-notepad-pencil`
*Icon: 📝 — used by: Word Crossword*

```
3D claymorphism render of a small spiral-bound notepad with a fat rounded pencil resting diagonally across it. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-blue-square`
*Icon: 🟦 — used by: Area Builder*

```
3D claymorphism render of a single thick rounded-corner square block, flat matte blue, shown at a slight tilt to show its depth. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-bar-chart`
*Icon: 📊 — used by: Bar Charts, Smart Charts*

```
3D claymorphism render of three rounded vertical bars of different heights standing side by side, each a different pastel color. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `train` *(= Batch C "train")*
*Icon: 🚂 — used by: Big Numbers*

```
3D claymorphism render of a small rounded toy steam-engine train: a boxy body, one round smokestack, two round wheels visible. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `brick` *(= Batch C "brick")*
*Icon: 🧱 — used by: Bricks & Wheels*

```
3D claymorphism render of a single rounded rectangular clay brick, warm terracotta-red, with the classic brick seam lines pressed into its face. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-cookie`
*Icon: 🍪 — used by: Can We Share?*

```
3D claymorphism render of a single round cookie with small rounded chocolate-chip dots pressed into its surface. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `clock` *(= Batch C "clock")*
*Icon: ⏰ — used by: Clock Explorer*

```
3D claymorphism render of a small round alarm clock face on a stand, two round bell-shaped bumps on top, clock hands pointing to a friendly time. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-balance-scale`
*Icon: ⚖️ — used by: cm, m & kg, Fraction Compare*

```
3D claymorphism render of a simple balance scale: a central stand with a horizontal bar, one small rounded pan hanging from each end. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-coin`
*Icon: 🪙 — used by: Coin Count*

```
3D claymorphism render of a single round gold coin standing on its edge, a simple embossed star in the center of its face. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-sun-face`
*Icon: 🌞 — used by: Day & Night*

```
3D claymorphism render of a round smiling sun with short chunky triangular rays all around it and a happy closed-eye face. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-magnifier-round`
*Icon: 🔍 — used by: Division Detective*

```
3D claymorphism render of a magnifying glass held upright, round lens facing forward, short straight handle below. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-division-sign`
*Icon: ➗ — used by: Equal Share*

```
3D claymorphism render of a thick rounded division symbol — a horizontal bar with one round dot above and one round dot below. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-pie-slice`
*Icon: 🥧 — used by: Fraction Pie Builder*

```
3D claymorphism render of a single triangular slice of pie on its side, golden-brown crust top, a light cream filling visible at the cut edges. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-scissors`
*Icon: ✂️ — used by: Grid Splitter*

```
3D claymorphism render of a pair of rounded clay scissors, blades slightly open, small round finger-loop handles. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-pizza-slice`
*Icon: 🍕 — used by: Half & Quarter*

```
3D claymorphism render of a single triangular pizza slice, golden crust edge, three round pepperoni dots on top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-cake-slice`
*Icon: 🍰 — used by: Halves & Quarters*

```
3D claymorphism render of a single triangular slice of layered cake on its side, pink frosting top, one round cherry on top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-jar`
*Icon: 🫙 — used by: Jugs & Mugs*

```
3D claymorphism render of a round-bodied glass jar with a wide screw-top lid, empty and clear. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-diamond-orange`
*Icon: 🔶 — used by: Lines & Patterns*

```
3D claymorphism render of a single thick rounded orange diamond/rhombus shape, shown flat-on. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `ruler` *(= Batch C "ruler")*
*Icon: 📏 — used by: Long or Short?*

```
3D claymorphism render of a short wooden-look ruler lying flat, rounded ends, simple evenly-spaced tick marks along one edge. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### 📐 — *skipped*
m, km & ml — SKIP, already generated as subject-math (same file as 🔢), no prompt needed

---

### `icon-shopping-cart`
*Icon: 🛒 — used by: Market Day*

```
3D claymorphism render of a small rounded shopping cart/trolley, two round wheels, one item peeking over the basket rim. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-calendar`
*Icon: 📅 — used by: My Funday*

```
3D claymorphism render of a small desk calendar block: a rounded rectangle with a top binding ring and one large friendly number on the visible page. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-hundred`
*Icon: 💯 — used by: Numbers to 999*

```
3D claymorphism render of a rounded clay badge shape with a bold "100" embossed on its face. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-diamond-blue`
*Icon: 🔷 — used by: Pattern Play*

```
3D claymorphism render of a single thick rounded blue diamond/rhombus shape, shown flat-on. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-money-bag`
*Icon: 💰 — used by: Rupee Shop*

```
3D claymorphism render of a round drawstring money bag, tied at the top with a bow, a rupee symbol embossed on the front. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-triangle-red`
*Icon: 🔺 — used by: Shapes & Designs*

```
3D claymorphism render of a single thick rounded red triangle, shown flat-on, point upward. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-kangaroo`
*Icon: 🦘 — used by: Skip Counting*

```
3D claymorphism render of a round chibi kangaroo character: big rounded feet, a thick tail for balance, a small pouch visible on its belly, standing upright, big round eyes. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-basket`
*Icon: 🧺 — used by: Sort & Count*

```
3D claymorphism render of a round wicker-look basket with two small side handles, empty, warm tan color. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-x-multiply`
*Icon: ✖️ — used by: Table Race, Times Table Race*

```
3D claymorphism render of a thick rounded clay "X" shape (a multiplication sign), two crossed rounded bars. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-hand-five`
*Icon: ✋ — used by: Tally Marks*

```
3D claymorphism render of a single rounded open clay hand, palm facing forward, five fingers spread, as if showing "five". Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-ten-blocks`
*Icon: 🔟 — used by: Tens & Ones*

```
3D claymorphism render of two rows of five small rounded number-blocks stacked together, forming a simple ten-frame, each block a different pastel color. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-stopwatch`
*Icon: ⏱️ — used by: Tick Tick Tick*

```
3D claymorphism render of a small round stopwatch with one button on top and a short side dial button, clock hands visible on its face. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `elephant` *(= Batch C "elephant")*
*Icon: 🐘 — used by: Animal Explorer*

```
3D claymorphism render of a round chibi elephant character: big floppy rounded ears, a short curled trunk, big round eyes, standing on four stubby legs. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-paw-print`
*Icon: 🐾 — used by: Animal Quiz*

```
3D claymorphism render of a single rounded animal paw print — one large center pad and four small rounded toe pads above it. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `house` *(= Batch C "house")*
*Icon: 🏡 — used by: Changing Times*

```
3D claymorphism render of a small rounded cottage house with a peaked roof, one round window, a small door, and a short chimney. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `family` *(= Batch C "family")*
*Icon: 👨‍👩‍👧 — used by: Family Quiz*

```
3D claymorphism render of three simple round chibi figures of different heights standing together holding hands — a family group. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `wheat` *(= Batch C "wheat")*
*Icon: 🌾 — used by: Farm to Home*

```
3D claymorphism render of a single stalk of wheat, several small rounded grain pods along the top, a thin curved stem. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `apple` *(= Batch C "apple")*
*Icon: 🍎 — used by: Food Quiz*

```
3D claymorphism render of a single round glossy red apple with a short brown stem and one small green leaf. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-cricket-bat-ball`
*Icon: 🏏 — used by: Games Quiz*

```
3D claymorphism render of a wooden cricket bat leaning against a round red cricket ball. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `river` *(= Batch C "river")*
*Icon: 🏞️ — used by: River Tale*

```
3D claymorphism render of a small rounded landscape tile: a winding blue river cutting between two soft green rounded hills. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-water-drop`
*Icon: 💧 — used by: Water Quiz*

```
3D claymorphism render of a single glossy rounded teardrop-shaped water droplet, a small highlight catching the light near the top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-compass`
*Icon: 🧭 — used by: Which Way?*

```
3D claymorphism render of a small round compass, a red-and-white rounded needle pointing outward, simple direction marks around the rim. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-option icon a child taps, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

