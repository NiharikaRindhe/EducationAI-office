/**
 * Batch 1 art pipeline — source PNGs in, web-ready WebP out.
 *
 * The delivered claymorphism renders are 1024x1024 PNGs (~800KB each, 31MB
 * for the set). The portal never draws one larger than ~104 CSS px, and these
 * run on shared school lab machines, so shipping the masters would mean a
 * ~10MB Home screen for artwork that renders at a tenth of that size.
 *
 * This emits one WebP per source at the size the UI actually needs (2x the
 * largest on-screen use, for retina), and trims the transparent margin first
 * so every icon reads at the same optical size in its tile — the renders
 * frame their subjects a little differently from each other.
 *
 * Run: npm run build:art
 */
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'art-source/batch1';
const OUT = 'public/art/batch1';

/** Anything not listed here is a square icon/character at ICON_PX. */
const SPECIAL = {
  // Full-bleed background: covers the entire viewport (sky, clouds, sun and
  // the grass band are all painted into it), so it needs real width. Opaque —
  // it is the ground everything else sits on.
  'scene-backdrop': { width: 1920, alpha: false, trim: false, quality: 78 },
  // Drifts across the sky behind the app frame; rendered ~220px wide.
  'scene-cloud': { width: 440, alpha: true, trim: true, quality: 82 },
};

const ICON_PX = 256;
const ICON_QUALITY = 86;

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith('.png'));
if (files.length === 0) {
  console.error(`No PNGs in ${SRC}/ — drop the delivered art there first.`);
  process.exit(1);
}

let totalIn = 0;
let totalOut = 0;

for (const file of files.sort()) {
  const slug = path.basename(file, path.extname(file));
  const spec = SPECIAL[slug];
  let img = sharp(path.join(SRC, file));
  const meta = await img.metadata();
  totalIn += meta.size ?? 0;

  // Trim the transparent frame so a subject that was rendered small doesn't
  // display smaller than its neighbours in the same row of tiles.
  if (spec?.trim !== false) {
    img = img.trim({ threshold: 8 });
  }

  if (spec) {
    img = img.resize({ width: spec.width, withoutEnlargement: true });
    if (!spec.alpha) img = img.flatten({ background: '#BFE9FF' });
  } else {
    // Square canvas, subject centred, transparent padding — keeps every icon
    // on the same grid regardless of how the render was framed.
    img = img.resize(ICON_PX, ICON_PX, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: true,
    });
  }

  const info = await img
    .webp({ quality: spec?.quality ?? ICON_QUALITY, effort: 5 })
    .toFile(path.join(OUT, `${slug}.webp`));

  totalOut += info.size;
  console.log(
    `${slug.padEnd(22)} ${String(meta.width) + 'x' + meta.height} -> ${info.width}x${info.height}  ` +
    `${(info.size / 1024).toFixed(0)}KB`,
  );
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`\n${files.length} images: ${mb(totalIn)}MB -> ${mb(totalOut)}MB`);
