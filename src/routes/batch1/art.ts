/**
 * Batch 1 artwork registry — the single seam between emoji and real pictures.
 *
 * Every picture a Class 1–4 child sees goes through `<Pic>` (see ui.tsx), which
 * looks the subject up here first and only falls back to the emoji glyph when
 * this map has nothing. That means swapping the whole portal from emoji to
 * commissioned/generated art is a change to THIS FILE and nothing else — no
 * component, page or database row has to be touched again.
 *
 * ── How to fill it in ───────────────────────────────────────────────────────
 * 1. Drop the artwork in `public/art/batch1/` as `<slug>.svg` (or .png).
 * 2. Add a line below: `'🐔': 'hen',` — key is the emoji as it appears in the
 *    UI or in games_catalog.params, value is the file's slug.
 * 3. That's it. Nothing re-renders differently until the file exists.
 *
 * Art direction (agreed): flat vector illustration — bold shapes, thick dark
 * outline, bright flat fills, plain transparent/white background, the subject
 * filling the frame. It has to stay legible at 64px, because that is how big
 * an option button renders on a lab monitor.
 *
 * SLOTS lists every picture the portal needs, grouped by where it appears, so
 * a batch can be generated in one pass without hunting through the code. It is
 * documentation, not runtime data — nothing reads it.
 */

/** Where the files live, relative to the site root. */
export const ART_BASE = '/art/batch1';

/** Extension used for the generated set. Change once if the batch is PNG. */
export const ART_EXT = 'svg';

/**
 * emoji (or semantic name) → file slug.
 *
 * Deliberately empty: with no entries every `<Pic>` renders its emoji exactly
 * as the portal does today, so this file is inert until artwork actually
 * exists. Populate it as art lands — partial coverage is fine and expected,
 * a keyed subject shows art while the rest stay emoji.
 */
export const ART: Record<string, string> = {
  // '🐔': 'hen',
  // '🚌': 'bus',
  // 'nav-play': 'nav-play',
};

/** Resolve a picture to a URL, or null when it should stay an emoji. */
export function artUrl(key: string | undefined): string | null {
  if (!key) return null;
  const slug = ART[key];
  return slug ? `${ART_BASE}/${slug}.${ART_EXT}` : null;
}

/**
 * The full shopping list, for whoever generates the batch.
 * Counts are the distinct subjects actually referenced by the Batch 1 UI and
 * by games_catalog.params as of this file's last update.
 */
export const SLOTS = {
  /** Home tiles + page headers. Six navigation subjects. */
  navigation: ['stories', 'games', 'quizzes', 'tasks', 'journey', 'trophies'],

  /** Class mascots, one per class — these carry the most personality. */
  mascots: ['chick', 'rabbit', 'fox', 'owl'],

  /** Countable objects for counting/tally rounds. Must read at 40px. */
  counters: ['apple', 'banana', 'star', 'fish', 'chick', 'flower', 'cupcake', 'football'],

  /** Animals used across EVS quizzes and word-match vocabulary. */
  animals: [
    'hen', 'chick', 'cow', 'dog', 'cat', 'kitten', 'lion', 'tiger', 'elephant',
    'monkey', 'bear', 'snake', 'rabbit', 'giraffe', 'eagle', 'owl', 'goat',
    'pig', 'ant', 'turtle', 'ox', 'whale', 'shark', 'bird', 'deer', 'caterpillar',
  ],

  /** Everyday objects: comparison, capacity and vocabulary rounds. */
  objects: [
    'bus', 'train', 'cycle', 'pencil', 'book', 'school-bag', 'ruler', 'clock',
    'bucket', 'glass', 'spoon', 'jug', 'cup', 'bottle', 'bowl', 'pot', 'bathtub',
    'kite', 'string', 'umbrella', 'drum', 'bell', 'piano', 'flute', 'ball',
    'nest', 'egg', 'milk', 'box', 'brick', 'feather', 'ladder', 'thread',
  ],

  /** Places and nature, mostly EVS. */
  scenes: [
    'school', 'house', 'hut', 'building', 'bridge', 'road', 'farm', 'market',
    'hospital', 'bank', 'factory', 'zoo', 'pool', 'river', 'sea', 'lake',
    'mountain', 'cloud', 'rain', 'rainbow', 'sun', 'moon', 'tree', 'plant',
    'leaf', 'flower', 'grass', 'wind',
  ],

  /** Food, for the food-and-health chapters. */
  food: ['apple', 'banana', 'carrot', 'rice', 'wheat', 'bread', 'salad', 'egg', 'milk', 'chocolate', 'candy', 'chips'],

  /** People and family, for the family chapters. */
  people: ['family', 'grandmother', 'grandfather', 'mother', 'father', 'sister', 'brother', 'baby', 'child', 'teacher', 'farmer'],

  /**
   * Interface marks. These should NOT be generated as illustrations — they are
   * drawn as vector icons in ui.tsx (lucide) so they stay crisp and consistent:
   * play, lock, star, tick, cross, back, home, exit, refresh.
   */
  interfaceIcons: 'drawn as vector icons, not artwork',
} as const;
