/**
 * One-off upload of the STEM lab diagram/simulation images (ported from
 * EducationAI-Games-master) into the public 'lab-assets' Supabase Storage
 * bucket. Never commit these binaries to git — this script is the only
 * copy path from the source repo into the running app.
 *
 * Usage (from api/): npm run assets:upload-lab -- --source "../EducationAI-Games-master/EducationAI-Games-master/src/assets"
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (CONTENT_TYPES[extname(entry).toLowerCase()]) out.push(full);
  }
  return out;
}

async function main() {
  const sourceRoot = arg('source');
  if (!sourceRoot) throw new Error('--source <path to EducationAI-Games-master/src/assets> is required');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY not set');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const files = walk(sourceRoot);
  console.log(`Found ${files.length} image files under ${sourceRoot}`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filePath of files) {
    const relPath = relative(sourceRoot, filePath).split('\\').join('/');
    const contentType = CONTENT_TYPES[extname(filePath).toLowerCase()];

    const { error } = await supabase.storage.from('lab-assets').upload(relPath, readFileSync(filePath), {
      contentType,
      upsert: false,
    });

    if (error) {
      if (error.message?.toLowerCase().includes('already exists')) {
        skipped++;
      } else {
        failed++;
        console.error(`FAILED ${relPath}: ${error.message}`);
      }
    } else {
      uploaded++;
    }
  }

  console.log(`Done. Uploaded ${uploaded}, skipped ${skipped} (already present), failed ${failed}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
