/**
 * Emits supabase/migrations/20250101000177_class5_8_chapter_activities.sql
 * from the TypeScript activity catalog. Run: node --experimental-strip-types
 * is not portable; we parse the exported gameId/chapter fields via a small
 * duplicate walk after dynamic import through tsx.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const { CLASS_5_TO_8_ACTIVITIES } = await import(
  pathToFileURL(join(root, 'src/data/activities/index.ts')).href
);

function sqlStr(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const chapters = new Map();
for (const a of CLASS_5_TO_8_ACTIVITIES) {
  if (!chapters.has(a.chapterRef)) {
    chapters.set(a.chapterRef, a);
  }
}

const chapterRows = [...chapters.values()]
  .sort((a, b) => a.classNum - b.classNum || a.subject.localeCompare(b.subject) || a.chapterNum - b.chapterNum)
  .map(
    (a) =>
      `  (${a.classNum}, ${sqlStr(a.subject)}, ${a.chapterNum}, ${sqlStr(a.chapterRef)}, ${sqlStr(a.chapterTitle)})`,
  )
  .join(',\n');

const gameRows = CLASS_5_TO_8_ACTIVITIES.map(
  (a) =>
    `  (${sqlStr(a.gameId)}, 'practice', ${sqlStr(a.subject)}, ${sqlStr(a.gameId)}, ${a.classNum}, 1, ${sqlStr(a.chapterRef)}, ${sqlStr(a.name)}, ${sqlStr(a.icon)}, '{"generator":"practice"}'::jsonb, true)`,
).join(',\n');

const sql = `-- Class 5–8 NCERT chapter list + one practice activity per chapter.
-- Question banks live in src/data/activities (PracticeEngine). This seed
-- only registers chapters and games_catalog rows so stars/XP work the
-- same way as Batch 1 games. Activities are ordered by chapter_num.

insert into public.curriculum_chapters (class_num, subject, chapter_num, chapter_ref, title) values
${chapterRows}
on conflict (chapter_ref) do update set
  class_num = excluded.class_num,
  subject = excluded.subject,
  chapter_num = excluded.chapter_num,
  title = excluded.title;

insert into public.games_catalog (game_id, engine, subject, skill_tag, class_num, level, chapter_ref, name, icon, params, is_active) values
${gameRows}
on conflict (game_id) do update set
  engine = excluded.engine,
  subject = excluded.subject,
  skill_tag = excluded.skill_tag,
  class_num = excluded.class_num,
  level = excluded.level,
  chapter_ref = excluded.chapter_ref,
  name = excluded.name,
  icon = excluded.icon,
  params = excluded.params,
  is_active = excluded.is_active;
`;

const out = join(root, 'supabase/migrations/20250101000177_class5_8_chapter_activities.sql');
writeFileSync(out, sql);
console.log(`Wrote ${chapters.size} chapters and ${CLASS_5_TO_8_ACTIVITIES.length} activities → ${out}`);
