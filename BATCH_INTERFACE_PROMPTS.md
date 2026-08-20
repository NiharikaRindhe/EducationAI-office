# Interface Icon Prompts — the last 10 emoji in the chrome

Everything left in `art.ts`'s `SLOTS.interface` list, written out full — same
format as the last two batches, one self-contained prompt per image, nothing
to combine.

**🔥 first if you're prioritizing** — it's the Streak stat in the header,
which renders on every single screen right next to the ⭐ star that already
has art, so it's the most visible remaining gap in the whole portal.

Two of these (🔒, 🎁) don't reach `<Pic>` in the code yet — I'm patching that
now, in parallel with you generating. They'll work the moment both are done;
no need to wait on me before generating.

**Format:** PNG, transparent background, 1024×1024. Save as
`art-source/batch1/<slug>.png`. Wiring is the same one-line `art.ts` addition
as every batch before this.

---

### `flame`
*Icon: 🔥 — Layout.tsx header, "Streak" stat, every screen*

```
3D claymorphism render of a single glossy flame — a rounded teardrop shape with a warm orange-red outer body and a smaller lighter-yellow inner flame shape near its base. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits inside a small stat chip that already casts its own. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px — this is a small header icon, not a detailed scene. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `medal`
*Icon: 🏅 — MyStuff.tsx, "My Badges" section title*

```
3D claymorphism render of a single round sporting medal on a short ribbon loop — a glossy gold disc with a simple embossed star in the center, a red-and-white striped ribbon folded above it. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `id-card`
*Icon: 🪪 — MyStuff.tsx, "My Card" section title*

```
3D claymorphism render of a single rounded-rectangle ID card standing on its short edge — a small round portrait circle on the left side, two short rounded text-line bars on the right side (no actual letters), a thin coloured stripe along the top edge. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `rocket`
*Icon: 🚀 — Games.tsx, "Try something harder" section (the bug-fix from earlier — this was the literal `\U0001F680` text)*

```
3D claymorphism render of a single toy rocket standing upright — a rounded conical white body with a red nose cone, one round window near the top, three small rounded fins at the base, a puff of soft rounded orange-yellow flame beneath it. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-teacher`
*Icon: 🧑‍🏫 — LiveClassCard.tsx, "No class right now" state*

```
3D claymorphism render of a round chibi teacher character standing beside a small rounded chalkboard on a stand, one hand gesturing toward the board, wearing simple rounded clothing, a warm closed-mouth smile, big round eyes. Soft matte clay / soft plastic character material with a faint subsurface grain, chunky rounded volumetric proportions (oversized head, small body), fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — a physically-lit 3D character as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Full body visible, centered, standing, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay mascots — soft, toy-like, huggable, production quality.
```

### `clipboard`
*Icon: 📋 — Tasks.tsx, task-progress panel (the "not all done yet" state; 🏆 already exists for "all done")*

```
3D claymorphism render of a single clipboard with a blank sheet of paper clipped to it and a few short rounded pencil-line marks on the page (no actual text), a chunky clip at the top. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px. The subject fills about 80% of the frame, centered, friendly front-three-quarter angle. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-confused-face`
*Icon: 😕 — Quizzes.tsx, error state ("Could not load your quizzes")*

```
3D claymorphism render of a simple round face with a gentle confused expression — one eyebrow raised, a small wavy uncertain mouth, big round eyes, no body. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Soft warm pastel colors, gentle and not alarming — this is a "something went wrong, try again" state for a young child, not a scary error. Bold, simple silhouette that stays instantly recognizable at 64px. The subject fills about 80% of the frame, centered. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-rainbow`
*Icon: 🌈 — Quizzes.tsx, "No quiz today!" empty state*

```
3D claymorphism render of a single rounded rainbow arc, four thick clay bands in red, orange, yellow and blue stacked in an arch, with one small fluffy white cloud tucked under each end of the arc. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors, not neon. Bold, simple silhouette that stays instantly recognizable at 64px. The subject fills about 80% of the frame, centered. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-lock`
*Icon: 🔒 — Syllabus.tsx, a locked chapter node on the journey trail. Currently a raw `{'🔒'}` string, not routed through `<Pic>` — being patched now.*

```
3D claymorphism render of a single small padlock, a rounded rectangular body with a thick curved shackle on top, a small round keyhole on the face. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image, since this sits on a trail node that already has its own shadow. Muted grey-blue clay, matching the "not yet unlocked" tone rather than the bright palette elsewhere — this icon reads as "later," not "play me". Bold, simple silhouette that stays instantly recognizable at the ~40px it renders at on a trail node. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```

### `icon-treasure-chest`
*Icon: 🎁 — Syllabus.tsx, the reward at the end of the journey trail. Currently a raw `{'🎁'}` string, not routed through `<Pic>` — being patched now.*

```
3D claymorphism render of a single closed wooden treasure chest, a rounded domed lid, a gold clasp and lock on the front, warm brown wood with rounded gold corner trim. Soft matte clay / soft plastic material with a faint subsurface grain, chunky rounded volumetric shapes, fully rounded corners, no sharp edges, no hard black outlines. NOT flat, NOT a vector icon, NOT a line drawing — render it as a physically-lit 3D object, as if photographed on a turntable. One soft key light from the upper-left, a faint rim-light on the lower-right edge — no cast shadow baked into the image. Saturated candy-bright pastel colors for the trim, warm wood tone for the body — this is the exciting "finish the whole book" reward, so it should feel celebratory. Bold, simple silhouette that stays recognizable at the size it renders on the trail. Background: fully transparent (alpha channel, PNG). Square canvas, 1024×1024px. Style reference: Duolingo / Headspace-style 3D clay icons — soft, toy-like, production quality.
```
