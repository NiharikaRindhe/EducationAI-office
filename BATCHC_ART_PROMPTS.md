# Batch C — In-Game Object Prompts (deduplicated)

Every prompt below is complete and self-contained, same format as the last
two batches. This is what's actually left — cross-checked against every
slug AND every emoji already delivered in `art.ts`, not just names.

**18 items from the original Batch C list are already covered — do not
regenerate these:**

| Already have art | Source |
|---|---|
| hen, kitten, elephant | Batch B |
| train, ruler, clock, brick | Batch B |
| house (🏡), river (🏞️) | Batch B — same emoji as "Changing Times" / "River Tale" |
| wheat, apple, family | Batch B |
| kite (🪁), drum (🥁) | Batch B — same emoji as "A Kite" / "The Music Man" |
| star as a counted object (⭐) | Batch A — same emoji as the Stars stat (`encourage-star`) |
| school as a place (🏫) | Batch B — same emoji as "First Day At School" |
| rainbow as a place (🌈) | Interface batch — same emoji as the no-quiz empty state |
| teacher as a person (🧑‍🏫) | Interface batch — same emoji as no-class-right-now |

That leaves **87 below — 84 clear gaps + 3 marked OPTIONAL** (`book`, `jug`,
`sun`: a judgment call on whether existing similar art is close enough —
read the note on each before generating; skip them if you'd rather reuse
what exists).

**Format:** PNG, transparent background, 1024×1024. Save as
`art-source/batch1/<slug>.png`. Wiring: same one-line `art.ts` addition
as every batch before — but see the code note at the very end first.

---

## C1 — Animals (17)

### `cow`

```
3D claymorphism render of a round chibi cow standing, black-and-white patches, small nubby horns, a pink nose, a short tail with a tuft. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `dog`

```
3D claymorphism render of a round chibi dog sitting, one floppy ear up and one down, a small wagging tail, a pink tongue peeking out. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `cat`

```
3D claymorphism render of a round chibi cat sitting, pointed ears, a long tail curled around its feet, whiskers, half-closed content eyes. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `monkey`

```
3D claymorphism render of a round chibi monkey sitting, a long curled tail, big round ears, a lighter belly patch. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bear`

```
3D claymorphism render of a round chibi bear cub standing, small round ears, a light tan belly patch, stubby arms. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `snake`

```
3D claymorphism render of a coiled round chibi snake, glossy green clay body with darker rounded spots, a small forked tongue, big friendly eyes. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `giraffe`

```
3D claymorphism render of a round chibi giraffe standing, a long curved neck, small rounded ossicones on top of the head, patchy orange-brown spots. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `goat`

```
3D claymorphism render of a round chibi goat standing, small curved horns, a short chin tuft, floppy ears. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `pig`

```
3D claymorphism render of a round chibi pig standing, a flat round snout with two nostril dots, a small curly tail, glossy pink body. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `ant`

```
3D claymorphism render of a round chibi ant standing on its back four legs, three rounded body segments, two small antennae, big friendly eyes. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `turtle`

```
3D claymorphism render of a round chibi turtle, a domed patterned shell in green and tan, a small head and four stubby legs peeking out. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `ox`

```
3D claymorphism render of a round chibi ox standing, short thick curved horns, a nose ring, a sturdy body. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `whale`

```
3D claymorphism render of a round chibi whale, a smooth blue-grey body, a small water-spout puff above its blowhole, a wide friendly smile. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `shark`

```
3D claymorphism render of a round chibi shark, a smooth grey body, a rounded dorsal fin on top, a friendly closed (non-toothy) smile. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bird`

```
3D claymorphism render of a small round chibi bluebird perched, a puffed round chest, a small pointed beak, wings tucked. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `deer`

```
3D claymorphism render of a round chibi deer standing, small rounded antlers, white spots on its back, big round eyes. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `caterpillar`

```
3D claymorphism render of a round chibi caterpillar, several stacked round segments in alternating pastel colors, two small antennae, tiny feet. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

## C2 — Everyday objects (25)

### `bus`

```
3D claymorphism render of a small rounded school bus, bright yellow body, black rounded wheels, a row of small square windows, a friendly rounded front grille. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `cycle`

```
3D claymorphism render of a small rounded bicycle, two round wheels, a curved seat and handlebar, a small basket on the front. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `pencil`

```
3D claymorphism render of a single fat rounded pencil lying at an angle, yellow painted body, a sharpened graphite tip, a pink eraser cap. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `school-bag`

```
3D claymorphism render of a small rounded school satchel, two shoulder straps, one front pocket with a chunky zipper pull — a different color set than the nav-tasks backpack. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bucket`

```
3D claymorphism render of a small rounded bucket with a curved wire handle, slightly tapered sides, empty. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `glass`

```
3D claymorphism render of a single clear rounded drinking glass, empty, a subtle highlight down one side. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `spoon`

```
3D claymorphism render of a single rounded metal spoon lying flat, a shallow oval bowl and a short rounded handle. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `cup`

```
3D claymorphism render of a single rounded teacup with a curved side handle, sitting on a small matching saucer. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bottle`

```
3D claymorphism render of a single rounded glass bottle with a narrow neck and a round cap, empty and clear. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bowl`

```
3D claymorphism render of a single rounded shallow bowl, empty, sitting flat. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `pot`

```
3D claymorphism render of a single rounded cooking pot with two small side handles and a domed lid with a round knob. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bathtub`

```
3D claymorphism render of a small rounded clawfoot bathtub, empty, standing on four small rounded feet. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `string`

```
3D claymorphism render of a short coil of rounded clay string/rope, looped loosely. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `umbrella`

```
3D claymorphism render of a single open rounded umbrella, a scalloped canopy edge, a curved handle, bright pastel panels. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bell`

```
3D claymorphism render of a single round brass school handbell with a small rounded handle on top and a clapper visible inside. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `piano`

```
3D claymorphism render of a small rounded upright piano, a row of black-and-white rounded keys, two small candlestick shapes on the front. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `flute`

```
3D claymorphism render of a single rounded silver flute lying at an angle, small round finger-hole dimples along its length. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `ball`

```
3D claymorphism render of a single round rubber play-ball with two simple curved stripe bands, a bright pastel color distinct from the football already made. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `nest`

```
3D claymorphism render of a small rounded twig nest, woven-look rounded strands, two small speckled eggs resting inside. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `box`

```
3D claymorphism render of a single rounded cardboard box, flaps closed, a simple bow on top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `feather`

```
3D claymorphism render of a single rounded feather lying flat, a soft curved spine, fluffy rounded barbs along each side. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `ladder`

```
3D claymorphism render of a small rounded step-ladder, two angled side rails and several rounded rungs. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `thread`

```
3D claymorphism render of a small rounded spool of thread, wound thread visible around the sides, one loose end draped down. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `book`

```
3D claymorphism render of (OPTIONAL — see note) a single closed rounded book, a solid pastel cover, rounded page edges visible on the side. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `jug`

```
3D claymorphism render of (OPTIONAL — see note) a single rounded clay jug with a curved handle and a pouring spout, taller and narrower than a mason jar. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

## C3 — Places & nature (22)

### `hut`

```
3D claymorphism render of a small round thatched-roof hut, a domed straw-textured roof, a small round doorway. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `building`

```
3D claymorphism render of a small rounded multi-story building, several small square windows in a grid, a flat rounded roofline — distinct from the peaked-roof house and school already made. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bridge`

```
3D claymorphism render of a small rounded stone bridge with a single arch, a low rounded railing along the top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `road`

```
3D claymorphism render of a short stretch of rounded grey road with simple rounded white dashes down the middle. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `farm`

```
3D claymorphism render of a small rounded red barn with a peaked roof and a round hay-loft door, a small fenced patch beside it. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `market`

```
3D claymorphism render of a small rounded market stall with a striped awning and a simple counter, a few round fruit shapes on top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `hospital`

```
3D claymorphism render of a small rounded building with a red cross symbol on the front and a peaked roof. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bank`

```
3D claymorphism render of a small rounded building with simple rounded columns at the front and a coin symbol above the door. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `factory`

```
3D claymorphism render of a small rounded building with two short smokestacks, a puff of soft white cloud-smoke above one. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `zoo`

```
3D claymorphism render of a small rounded fence-gate archway with a simple animal-paw emblem on top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `pool`

```
3D claymorphism render of a small rounded swimming pool shape, blue water with soft wave-line ripples, a tiled rounded edge. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `sea`

```
3D claymorphism render of a small patch of rounded blue-green water with soft wave ripples and one small whitecap. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `lake`

```
3D claymorphism render of a small rounded still blue-green water shape nestled between two small green hill mounds. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `mountain`

```
3D claymorphism render of a single rounded snow-capped mountain peak, a soft white cap over a grey-brown rounded body. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `rain`

```
3D claymorphism render of a single rounded rain cloud with several fat teardrop raindrops falling beneath it — a bit larger and heavier-looking than icon-rain-cloud already made. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `sun`

```
3D claymorphism render of (OPTIONAL — see note) a single plain rounded glossy sun disc with short chunky triangular rays, no face — a plain sun rather than the smiling icon-sun-face already made. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `moon`

```
3D claymorphism render of a single rounded crescent moon, soft pale yellow, a couple of small star sparkles beside it. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `tree`

```
3D claymorphism render of a single rounded leafy tree, a round puffy green canopy on a short brown trunk — a simple standalone tree, distinct from the trees baked into the scene backdrop. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `plant`

```
3D claymorphism render of a single small rounded potted plant, a terracotta pot with two or three rounded green leaves. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `leaf`

```
3D claymorphism render of a single rounded green leaf shape with a simple curved center vein. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `grass`

```
3D claymorphism render of a small rounded tuft of grass, several soft blade shapes bunched together at the base. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `wind`

```
3D claymorphism render of a few soft rounded curved swirl shapes suggesting a breeze, pale blue-white, no solid object. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

## C4 — Food (9)

### `carrot`

```
3D claymorphism render of a single rounded orange carrot with a green leafy top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `rice`

```
3D claymorphism render of a small rounded bowl mounded with white rice grains, a couple of chopsticks resting across the rim. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `bread`

```
3D claymorphism render of a single rounded loaf of bread with a few soft curved slash marks on top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `salad`

```
3D claymorphism render of a small rounded bowl filled with mixed rounded lettuce, tomato and cucumber pieces. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `egg`

```
3D claymorphism render of a single rounded white egg standing upright in a small egg cup. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `milk`

```
3D claymorphism render of a single rounded glass of milk, filled to the top, a subtle white sheen. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `chocolate`

```
3D claymorphism render of a single rounded chocolate bar square with a few break-lines pressed into its top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `candy`

```
3D claymorphism render of a single round wrapped candy, twisted rounded ends on each side, a bright pastel wrapper. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `chips`

```
3D claymorphism render of a small rounded paper cone of chips/fries, a few rounded chip shapes peeking out the top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

## C5 — Counting objects (5)

### `banana`

```
3D claymorphism render of a single curved yellow banana with a small brown stem. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `fish`

```
3D claymorphism render of a single round chibi fish, big round eyes, a curved tail fin, simple scale-texture dots. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `cupcake`

```
3D claymorphism render of a single rounded cupcake with a swirl of pastel frosting on top and one small sprinkle dot. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `football`

```
3D claymorphism render of a single round classic football (soccer ball), a rounded pentagon-and-hexagon panel pattern. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `flower`

```
3D claymorphism render of a single rounded five-petal flower on a short green stem with two small leaves — a standalone countable item, distinct from the flowers painted into the scene backdrop. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a UI tile/answer button that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a game-answer icon a child taps, not a detailed scene. Isolated with nothing else in the frame. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

## C6 — People & family (9)

### `grandmother`

```
3D claymorphism render of an elderly woman with soft rounded grey hair in a small bun, wearing simple rounded clothing, smiling. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle, a warm closed-mouth smile. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

### `grandfather`

```
3D claymorphism render of an elderly man with rounded grey hair and a small rounded moustache, wearing simple rounded clothing, smiling. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle, a warm closed-mouth smile. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

### `mother`

```
3D claymorphism render of a woman with shoulder-length rounded hair, wearing simple rounded clothing, smiling. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle, a warm closed-mouth smile. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

### `father`

```
3D claymorphism render of a man with short rounded hair, wearing simple rounded clothing, smiling. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle, a warm closed-mouth smile. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

### `sister`

```
3D claymorphism render of a young girl with two small rounded pigtails, wearing a simple rounded dress, smiling. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle, a warm closed-mouth smile. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

### `brother`

```
3D claymorphism render of a young boy with short rounded hair, wearing simple rounded clothing, smiling. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle, a warm closed-mouth smile. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

### `baby`

```
3D claymorphism render of a round, soft baby character sitting up, wearing a simple onesie, big round eyes, smiling. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle, a warm closed-mouth smile. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

### `child`

```
3D claymorphism render of a young child with short rounded hair, wearing simple rounded clothing, smiling, arms slightly out. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle, a warm closed-mouth smile. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

### `farmer`

```
3D claymorphism render of an adult wearing a simple rounded straw hat and rounded overalls, holding a small clay rake, smiling. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle, a warm closed-mouth smile. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

---

## Before generating: these don't have a home in the code yet

Unlike Batch A/B, **none of these 87 subjects are wired to any game
today** — the SLOTS catalog in `art.ts` is a shopping list of what NCERT
content is likely to need, not a list of emoji already sitting in a real
game's `params`. When you're ready to actually use one, it needs to first
appear in a real game's content (a word-match pair, a quiz option, a
crossword clue...) with a matching emoji key, the same way 🐦/☔ already do
in ContextFillEngine. I can add real content using this art once it
exists — say which subjects you want used first and I'll wire them into
actual games rather than leaving them generated-but-unused.
