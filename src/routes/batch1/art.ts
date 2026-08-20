/**
 * Batch 1 artwork registry — the single seam between emoji and real pictures.
 *
 * Every picture a Class 1–4 child sees goes through `<Pic>` (see ui.tsx), which
 * looks the subject up here first and only falls back to the emoji glyph when
 * this map has nothing. That means swapping the whole portal from emoji to
 * commissioned art is a change to THIS FILE and nothing else — no component,
 * page or database row has to be touched again.
 *
 * ── How to fill it in ───────────────────────────────────────────────────────
 * 1. Drop the delivered 1024x1024 PNG in `art-source/batch1/<slug>.png`.
 * 2. Run `npm run build:art` — that emits the sized `.webp` this file points at.
 * 3. Add a line below. Two kinds of key, both valid:
 *      'nav-games': 'nav-games'   <- a slug, referenced by name/artKey in code
 *      '🐣': 'chick'              <- an emoji, so every existing `<Pic emoji>`
 *                                    call and every games_catalog.params emoji
 *                                    picks the art up with no code change.
 *
 * Art direction (delivered): claymorphism — soft matte clay material, chunky
 * rounded volumes, no outlines, one soft key light from the upper left,
 * transparent background. It has to stay legible at 64px, because that is how
 * big an option button renders on a lab monitor.
 *
 * SLOTS at the bottom lists every picture the portal still needs, so the next
 * batch can be generated in one pass. It is documentation, not runtime data.
 */

/** Where the built files live, relative to the site root. */
export const ART_BASE = '/art/batch1';

/**
 * Extension of the BUILT set, not the source set. `build-batch1-art.mjs` takes
 * the delivered PNG masters and emits WebP — the whole 39-image batch is
 * ~0.5MB that way, against ~31MB of masters, which matters on the shared lab
 * machines this runs on.
 */
export const ART_EXT = 'webp';

/**
 * key -> file slug. Keys are either a slug (referenced explicitly in code via
 * `name=` / `artKey=`) or an emoji (matched by `<Pic>`'s fallback lookup, so
 * art reaches call sites that only ever knew about a glyph).
 */
export const ART: Record<string, string> = {
  /* ── Navigation: the five Home doors + the journey map ─────────────── */
  'nav-games': 'nav-games',
  'nav-stories': 'nav-stories',
  'nav-quizzes': 'nav-quizzes',
  'nav-tasks': 'nav-tasks',
  'nav-trophies': 'nav-trophies',
  'nav-journey': 'nav-journey',
  '🎮': 'nav-games',
  '🗺️': 'nav-journey',
  '🏆': 'nav-trophies',

  /* ── Characters: class mascots and the avatar picker ───────────────── */
  chick: 'chick',
  rabbit: 'rabbit',
  fox: 'fox',
  owl: 'owl',
  lion: 'lion',
  tiger: 'tiger',
  butterfly: 'butterfly',
  panda: 'panda',
  dinosaur: 'dinosaur',
  unicorn: 'unicorn',
  frog: 'frog',
  penguin: 'penguin',
  eagle: 'eagle',
  wolf: 'wolf',
  raccoon: 'raccoon',
  '🐣': 'chick',
  '🐰': 'rabbit',
  '🦊': 'fox',
  '🦉': 'owl',
  '🦁': 'lion',
  '🐯': 'tiger',
  '🦋': 'butterfly',
  '🐼': 'panda',
  '🦖': 'dinosaur',
  '🦄': 'unicorn',
  '🐸': 'frog',
  '🐧': 'penguin',
  '🦅': 'eagle',
  '🐺': 'wolf',
  '🦝': 'raccoon',

  /* ── Subjects. Three pages keep their own emoji map and they disagree
        (Syllabus says 📐/🌍 where the others say 🔢/📚), so both spellings
        are aliased to the same picture rather than editing three files. ── */
  'subject-math': 'subject-math',
  'subject-english': 'subject-english',
  'subject-hindi': 'subject-hindi',
  'subject-science': 'subject-science',
  'subject-art': 'subject-art',
  'subject-default': 'subject-default',
  '🔢': 'subject-math',
  '📐': 'subject-math',
  '📖': 'subject-english',
  '📗': 'subject-hindi',
  '🌱': 'subject-science',
  '🎨': 'subject-art',
  '📚': 'subject-default',
  '🌍': 'subject-default',

  /* ── Rewards. The star doubles as the header "Stars" stat, which is what
        the design shows there too — a smiling clay star, not a glyph. ──── */
  'encourage-star': 'encourage-star',
  '⭐': 'encourage-star',
  '🌟': 'encourage-star',
  'badge-streak-7': 'badge-streak-7',
  'badge-streak-30': 'badge-streak-30',
  'badge-xp-rookie': 'badge-xp-rookie',
  'badge-xp-champion': 'badge-xp-champion',
  'badge-word-master': 'badge-word-master',
  'badge-fluent-reader': 'badge-fluent-reader',
  'badge-task-hero': 'badge-task-hero',
  'badge-exam-ace': 'badge-exam-ace',

  /* ── Interface icons — the last of SLOTS.interface (see BATCH_INTERFACE_
        PROMPTS.md). 🔥 is the highest-value one: it rides the header Streak
        stat on every single screen. ── */
  '🔥': 'flame',
  '🏅': 'medal',
  '🪪': 'id-card',
  '🚀': 'rocket',
  '🧑‍🏫': 'icon-teacher',
  '📋': 'clipboard',
  '😕': 'icon-confused-face',
  '🌈': 'icon-rainbow',
  '🔒': 'icon-lock',
  '🎁': 'icon-treasure-chest',

  /* ── Scene + live class ────────────────────────────────────────────── */
  'live-banner-robot': 'live-banner-robot',
  'scene-backdrop': 'scene-backdrop',

  /* ── Batch B — game icons, keyed by games_catalog.icon (see BATCHB_ART_
        PROMPTS.md). 53 of 55 delivered; 🧭 (Which Way?) and 💧 (Water Quiz)
        still emoji until icon-compass/icon-water-drop are generated. Several
        of these slugs (hen, train, brick, clock, ruler, elephant, house,
        family, wheat, apple, river) also fill their Batch C SLOTS entry —
        one file, two jobs. ── */
  '😊': 'icon-happy-face',
  '🪁': 'icon-kite',
  '✍️': 'icon-writing-hand',
  '🌧️': 'icon-rain-cloud',
  '🔎': 'icon-magnifier-tilt',
  '🏫': 'icon-school-building',
  '🐥': 'baby-chick',
  '🐔': 'hen',
  '🐱': 'kitten',
  '🎈': 'icon-balloon',
  '🖼️': 'icon-picture-frame',
  '🧩': 'icon-puzzle-piece',
  '🥁': 'icon-drum',
  '🔤': 'icon-abc-blocks',
  '📝': 'icon-notepad-pencil',
  '🟦': 'icon-blue-square',
  '📊': 'icon-bar-chart',
  '🚂': 'train',
  '🧱': 'brick',
  '🍪': 'icon-cookie',
  '⏰': 'clock',
  '⚖️': 'icon-balance-scale',
  '🪙': 'icon-coin',
  '🌞': 'icon-sun-face',
  '🔍': 'icon-magnifier-round',
  '➗': 'icon-division-sign',
  '🥧': 'icon-pie-slice',
  '✂️': 'icon-scissors',
  '🍕': 'icon-pizza-slice',
  '🍰': 'icon-cake-slice',
  '🫙': 'icon-jar',
  '🔶': 'icon-diamond-orange',
  '📏': 'ruler',
  '🛒': 'icon-shopping-cart',
  '📅': 'icon-calendar',
  '💯': 'icon-hundred',
  '🔷': 'icon-diamond-blue',
  '💰': 'icon-money-bag',
  '🔺': 'icon-triangle-red',
  '🦘': 'icon-kangaroo',
  '🧺': 'icon-basket',
  '✖️': 'icon-x-multiply',
  '✋': 'icon-hand-five',
  '🔟': 'icon-ten-blocks',
  '⏱️': 'icon-stopwatch',
  '🐘': 'elephant',
  '🐾': 'icon-paw-print',
  '🏡': 'house',
  '👨‍👩‍👧': 'family',
  '🌾': 'wheat',
  '🍎': 'apple',
  '🏏': 'icon-cricket-bat-ball',
  '🏞️': 'river',
  '🧭': 'icon-compass',
  '💧': 'icon-water-drop',

  /* ── Batch C — in-game objects (see BATCHC_ART_PROMPTS.md). Every slug
        below is always usable via name="<slug>"; the emoji aliases that
        follow are added only where the glyph is unambiguous and safe (no
        collision with anything above). ☀️→sun and 🥛→milk are the two worth
        knowing about: they're the exact emoji WordBuildEngine's real SUN/
        MILK word-build puzzles already use, so those two activate in
        genuine existing content immediately, not just hypothetically. ── */
  'cow': 'cow',
  'dog': 'dog',
  'cat': 'cat',
  'monkey': 'monkey',
  'bear': 'bear',
  'snake': 'snake',
  'giraffe': 'giraffe',
  'goat': 'goat',
  'pig': 'pig',
  'ant': 'ant',
  'turtle': 'turtle',
  'ox': 'ox',
  'whale': 'whale',
  'shark': 'shark',
  'bird': 'bird',
  'deer': 'deer',
  'caterpillar': 'caterpillar',
  'bus': 'bus',
  'cycle': 'cycle',
  'pencil': 'pencil',
  'school-bag': 'school-bag',
  'bucket': 'bucket',
  'glass': 'glass',
  'spoon': 'spoon',
  'cup': 'cup',
  'bottle': 'bottle',
  'bowl': 'bowl',
  'pot': 'pot',
  'bathtub': 'bathtub',
  'string': 'string',
  'umbrella': 'umbrella',
  'bell': 'bell',
  'piano': 'piano',
  'flute': 'flute',
  'ball': 'ball',
  'nest': 'nest',
  'box': 'box',
  'feather': 'feather',
  'ladder': 'ladder',
  'thread': 'thread',
  'book': 'book',
  'jug': 'jug',
  'hut': 'hut',
  'building': 'building',
  'bridge': 'bridge',
  'road': 'road',
  'farm': 'farm',
  'market': 'market',
  'hospital': 'hospital',
  'bank': 'bank',
  'factory': 'factory',
  'zoo': 'zoo',
  'pool': 'pool',
  'sea': 'sea',
  'lake': 'lake',
  'mountain': 'mountain',
  'rain': 'rain',
  'sun': 'sun',
  'moon': 'moon',
  'tree': 'tree',
  'plant': 'plant',
  'leaf': 'leaf',
  'grass': 'grass',
  'wind': 'wind',
  'carrot': 'carrot',
  'rice': 'rice',
  'bread': 'bread',
  'salad': 'salad',
  'egg': 'egg',
  'milk': 'milk',
  'chocolate': 'chocolate',
  'candy': 'candy',
  'chips': 'chips',
  'banana': 'banana',
  'fish': 'fish',
  'cupcake': 'cupcake',
  'football': 'football',
  'flower': 'flower',
  'grandmother': 'grandmother',
  'grandfather': 'grandfather',
  'mother': 'mother',
  'father': 'father',
  'sister': 'sister',
  'brother': 'brother',
  'baby': 'baby',
  'child': 'child',
  'farmer': 'farmer',

  '🐶': 'dog',
  '🐄': 'cow',
  '🐈': 'cat',
  '🐵': 'monkey',
  '🐻': 'bear',
  '🐍': 'snake',
  '🦒': 'giraffe',
  '🐐': 'goat',
  '🐷': 'pig',
  '🐜': 'ant',
  '🐢': 'turtle',
  '🐂': 'ox',
  '🐋': 'whale',
  '🦈': 'shark',
  '🐦': 'bird',
  '🦌': 'deer',
  '🐛': 'caterpillar',
  '🚌': 'bus',
  '🚲': 'cycle',
  '✏️': 'pencil',
  '🎒': 'school-bag',
  '🪣': 'bucket',
  '🥄': 'spoon',
  '☕': 'cup',
  '🥣': 'bowl',
  '🍲': 'pot',
  '🛁': 'bathtub',
  '☂️': 'umbrella',
  '🔔': 'bell',
  '🎹': 'piano',
  '🪈': 'flute',
  '🪺': 'nest',
  '📦': 'box',
  '🪶': 'feather',
  '🪜': 'ladder',
  '🧵': 'thread',
  '🛖': 'hut',
  '🏢': 'building',
  '🌉': 'bridge',
  '🛣️': 'road',
  '🚜': 'farm',
  '🏪': 'market',
  '🏥': 'hospital',
  '🏦': 'bank',
  '🏭': 'factory',
  '🏊': 'pool',
  '🌊': 'sea',
  '⛰️': 'mountain',
  '☀️': 'sun',
  '🌙': 'moon',
  '🌳': 'tree',
  '🪴': 'plant',
  '🍃': 'leaf',
  '🌿': 'grass',
  '💨': 'wind',
  '🥕': 'carrot',
  '🍚': 'rice',
  '🍞': 'bread',
  '🥗': 'salad',
  '🥚': 'egg',
  '🥛': 'milk',
  '🍫': 'chocolate',
  '🍬': 'candy',
  '🍟': 'chips',
  '🍌': 'banana',
  '🐟': 'fish',
  '🧁': 'cupcake',
  '⚽': 'football',
  '🌸': 'flower',
  '👵': 'grandmother',
  '👴': 'grandfather',
  '👩': 'mother',
  '👨': 'father',
  '👧': 'sister',
  '👦': 'brother',
  '👶': 'baby',
  '🧒': 'child',
  '🧑‍🌾': 'farmer',
};

/** Resolve a picture to a URL, or null when it should stay an emoji. */
export function artUrl(key: string | undefined): string | null {
  if (!key) return null;
  const slug = ART[key];
  return slug ? `${ART_BASE}/${slug}.${ART_EXT}` : null;
}

/**
 * Badge name -> art slug. `badges.icon` in the database is an emoji, and
 * several badges would collide on one glyph (🏆 is both "30-Day Legend" and a
 * dozen game win-screens), so the medals key off the badge's unique NAME.
 * Names come from supabase/seed.sql.
 */
export const BADGE_ART: Record<string, string> = {
  '7-Day Warrior': 'badge-streak-7',
  '30-Day Legend': 'badge-streak-30',
  'XP Rookie': 'badge-xp-rookie',
  'XP Champion': 'badge-xp-champion',
  'Word Master': 'badge-word-master',
  'Fluent Reader': 'badge-fluent-reader',
  'Task Hero': 'badge-task-hero',
  'Exam Ace': 'badge-exam-ace',
};

/**
 * Still emoji — no artwork delivered yet, or noting what's already done.
 * Listed so the next batch is a generation job rather than a hunt through
 * the code.
 */
export const SLOTS = {
  /** DONE — all 10 delivered and wired (see BATCH_INTERFACE_PROMPTS.md).
   *  🔒/🎁 needed a small code patch first (Syllabus.tsx rendered them as
   *  raw `{'🔒'}` strings, not through `<Pic>`) — that's done too.
   *  (🎈 balloon isn't in this list — it's covered by gameIcons below,
   *  same emoji key, one file, two jobs.) */
  interface: 'DONE — flame, medal, id-card, rocket, teacher, clipboard, confused-face, rainbow, lock, treasure-chest',

  /**
   * Batch B — one icon per game, keyed by the same emoji `<Pic emoji={game.icon}>`
   * already renders in Games.tsx, so no code change reaches it beyond adding
   * the ART entry. Pulled for real from every insert/update touching
   * games_catalog across all 17 migrations that reference it, not guessed:
   * 61 distinct icons across 82 active Class 1-4 rows / 66 distinct game
   * names. 6 of the 61 are free — they already exist as Batch A art under the
   * same emoji (🐸 frog, 🦁 lion, 🔢/📐 subject-math, 📖 nav-stories, 🌱
   * subject-science). All 55 delivered and wired — Batch B is DONE.
   */
  gameIcons: 'DONE — all 61 distinct game icons have art (6 free reuse + 55 generated)',

  /**
   * Batch C — objects inside game questions. DONE — all 87 delivered and
   * wired (BATCHC_ART_PROMPTS.md), plus 18 more free from Batch A/B reuse
   * (hen, kitten, elephant, train, ruler, clock, brick, house, river, wheat,
   * apple, family, kite, drum, star-as-counter, school-as-place,
   * rainbow-as-place, teacher-as-person) — 105 in-game subjects total now
   * have art.
   *
   * IMPORTANT: none of this shows up for a real student yet. Every active
   * game's question content lives in `games_catalog.params`, set by
   * migration — the art seam is open (engines render through `<Pic>`) but
   * no migration has been written adding these subjects into real question
   * content. That's a curriculum-authoring decision (new migration, real
   * game questions), not an art or wiring task — ask before doing it, this
   * touches the same table the earlier session was deliberately careful
   * with. Two exceptions already live for real: WordBuildEngine's existing
   * SUN/MILK puzzles use ☀️/🥛, which this batch happens to also cover.
   */
  gameContent: 'DONE — 87 delivered + 18 free reuse = 105 subjects with art; not yet used in any real game content',
} as const;
