import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { addXp, logStreakActivity } from './gamification.service.js';
import type { SubmitGameAttemptInput } from '../schemas/games.schema.js';

// Flat XP-per-star: a 3-star clear of a level is worth 30 XP, in line with
// the 10-50 XP range everything else on the platform awards (tasks, English
// assessment). Only the *improvement* in stars over a student's prior best
// is paid out, so replaying an already-3-starred game earns nothing further.
const XP_PER_STAR = 10;

interface CatalogRow {
  game_id: string;
  engine: string;
  subject: string;
  skill_tag: string;
  class_num: number;
  level: number;
  chapter_ref: string | null;
  name: string;
  icon: string | null;
  params: Record<string, unknown>;
  is_active: boolean;
}

async function getStudentClass(studentId: string): Promise<number> {
  const { data: sp, error } = await supabaseAdmin
    .from('student_profiles')
    .select('class_num')
    .eq('user_id', studentId)
    .single();
  if (error || !sp) throw new ApiError('NOT_FOUND', 'Student profile not found');
  return sp.class_num;
}

/** Level 1 of a skill is always open; level N needs 2+ stars on level N-1.
 *  Every seeded row today is level 1, so this is a no-op until phase 3 adds
 *  multi-level skills, but the unlock rule lives here rather than per-engine. */
function computeLocked(gamesInSkill: CatalogRow[], starsByGameId: Map<string, number>): Map<string, boolean> {
  const sorted = [...gamesInSkill].sort((a, b) => a.level - b.level);
  const locked = new Map<string, boolean>();
  let priorStars = Infinity; // level 1 is never locked
  for (const g of sorted) {
    locked.set(g.game_id, priorStars < 2);
    priorStars = starsByGameId.get(g.game_id) ?? 0;
  }
  return locked;
}

export async function listGamesForStudent(studentId: string, filters: { subject?: string } = {}) {
  const classNum = await getStudentClass(studentId);

  let query = supabaseAdmin.from('games_catalog').select('*').eq('class_num', classNum).eq('is_active', true);
  if (filters.subject) query = query.eq('subject', filters.subject);
  const { data: games, error } = await query.order('subject').order('skill_tag').order('level');
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load games catalog', error.message);

  const gameIds = (games ?? []).map((g) => g.game_id);
  const { data: attempts, error: attemptsError } = await supabaseAdmin
    .from('game_attempts')
    .select('game_id, stars, best_score')
    .eq('student_id', studentId)
    .in('game_id', gameIds.length > 0 ? gameIds : ['__none__']);
  if (attemptsError) throw new ApiError('INTERNAL_ERROR', 'Failed to load game attempts', attemptsError.message);

  const starsByGameId = new Map((attempts ?? []).map((a) => [a.game_id, a.stars]));
  const bestScoreByGameId = new Map((attempts ?? []).map((a) => [a.game_id, a.best_score]));

  const bySkill = new Map<string, CatalogRow[]>();
  for (const g of (games ?? []) as CatalogRow[]) {
    const key = `${g.skill_tag}:${g.class_num}`;
    if (!bySkill.has(key)) bySkill.set(key, []);
    bySkill.get(key)!.push(g);
  }
  const lockedByGameId = new Map<string, boolean>();
  for (const group of bySkill.values()) {
    for (const [gameId, isLocked] of computeLocked(group, starsByGameId)) lockedByGameId.set(gameId, isLocked);
  }

  const results = (games ?? []).map((g) => ({
    gameId: g.game_id,
    engine: g.engine,
    subject: g.subject,
    skillTag: g.skill_tag,
    classNum: g.class_num,
    level: g.level,
    chapterRef: g.chapter_ref,
    name: g.name,
    icon: g.icon,
    params: g.params,
    stars: starsByGameId.get(g.game_id) ?? 0,
    bestScore: bestScoreByGameId.get(g.game_id) ?? null,
    locked: lockedByGameId.get(g.game_id) ?? false,
  }));

  // Stretch section: same-skill games one class up, offered only for skills
  // the student has already 3-starred at their own class level.
  const masteredSkillTags = results.filter((r) => r.stars >= 3).map((r) => r.skillTag);
  let challengeGames: typeof results = [];
  if (masteredSkillTags.length > 0 && classNum < 4) {
    const { data: nextClassGames } = await supabaseAdmin
      .from('games_catalog')
      .select('*')
      .eq('class_num', classNum + 1)
      .eq('is_active', true)
      .in('skill_tag', masteredSkillTags);
    challengeGames = (nextClassGames ?? []).map((g) => ({
      gameId: g.game_id,
      engine: g.engine,
      subject: g.subject,
      skillTag: g.skill_tag,
      classNum: g.class_num,
      level: g.level,
      chapterRef: g.chapter_ref,
      name: g.name,
      icon: g.icon,
      params: g.params,
      stars: 0,
      bestScore: null,
      locked: false,
    }));
  }

  return { games: results, challengeGames };
}

async function recomputeSubjectProgress(studentId: string, subject: string, classNum: number) {
  const { count: totalChapters } = await supabaseAdmin
    .from('curriculum_chapters')
    .select('id', { count: 'exact', head: true })
    .eq('subject', subject)
    .eq('class_num', classNum);

  const { data: completed, error } = await supabaseAdmin
    .from('game_attempts')
    .select('last_played_at, games_catalog!inner(chapter_ref, subject, class_num)')
    .eq('student_id', studentId)
    .gte('stars', 1)
    .eq('games_catalog.subject', subject)
    .eq('games_catalog.class_num', classNum);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to recompute subject progress', error.message);

  const chapterRefs = new Set<string>();
  let lastChapterRef: string | null = null;
  let lastPlayedAt = '';
  for (const row of completed ?? []) {
    const gc = Array.isArray(row.games_catalog) ? row.games_catalog[0] : row.games_catalog;
    const chapterRef = gc?.chapter_ref;
    if (!chapterRef) continue;
    chapterRefs.add(chapterRef);
    if ((row.last_played_at ?? '') > lastPlayedAt) {
      lastPlayedAt = row.last_played_at ?? '';
      lastChapterRef = chapterRef;
    }
  }

  let lastChapterTitle: string | null = null;
  if (lastChapterRef) {
    const { data: chapter } = await supabaseAdmin
      .from('curriculum_chapters')
      .select('title')
      .eq('chapter_ref', lastChapterRef)
      .maybeSingle();
    lastChapterTitle = chapter?.title ?? null;
  }

  await supabaseAdmin.from('subject_progress').upsert(
    {
      student_id: studentId,
      subject,
      class_num: classNum,
      chapters_done: chapterRefs.size,
      total_chapters: totalChapters ?? 0,
      last_chapter: lastChapterTitle,
      last_updated: new Date().toISOString(),
    },
    { onConflict: 'student_id,subject,class_num' },
  );
}

export async function submitGameAttempt(studentId: string, gameId: string, input: SubmitGameAttemptInput) {
  const classNum = await getStudentClass(studentId);

  const { data: game, error: gameError } = await supabaseAdmin
    .from('games_catalog')
    .select('*')
    .eq('game_id', gameId)
    .single();
  if (gameError || !game) throw new ApiError('NOT_FOUND', 'Game not found');
  if (!game.is_active) throw new ApiError('NOT_FOUND', 'Game not found');
  // Never trust the client to only ask for its own class's games.
  if (game.class_num !== classNum) throw new ApiError('FORBIDDEN', 'This game is not available for your class');

  const { data: existing } = await supabaseAdmin
    .from('game_attempts')
    .select('*')
    .eq('student_id', studentId)
    .eq('game_id', gameId)
    .maybeSingle();

  const priorStars = existing?.stars ?? 0;
  const newStars = Math.max(priorStars, input.stars);
  const starsDelta = newStars - priorStars;
  const priorBestScore = existing?.best_score ?? null;
  const newBestScore =
    input.score !== undefined ? Math.max(priorBestScore ?? 0, input.score) : priorBestScore;

  const { data: attempt, error: upsertError } = await supabaseAdmin
    .from('game_attempts')
    .upsert(
      {
        student_id: studentId,
        game_id: gameId,
        stars: newStars,
        best_score: newBestScore,
        attempts_count: (existing?.attempts_count ?? 0) + 1,
        last_played_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,game_id' },
    )
    .select()
    .single();
  if (upsertError) throw new ApiError('INTERNAL_ERROR', 'Failed to save game attempt', upsertError.message);

  let xpGained = 0;
  let newBadges: { id: string; name: string; icon: string | null }[] = [];
  if (starsDelta > 0) {
    xpGained = starsDelta * XP_PER_STAR;
    const result = await addXp(studentId, xpGained);
    newBadges = result.newBadges;
    await logStreakActivity(studentId, xpGained);
  }

  if (newStars >= 1 && game.chapter_ref) {
    await recomputeSubjectProgress(studentId, game.subject, game.class_num);
  }

  return { attempt, xpGained, newBadges };
}

export async function getStudentCurriculum(studentId: string) {
  const classNum = await getStudentClass(studentId);

  // 1. Fetch all curriculum chapters for this class
  const { data: chapters, error: chError } = await supabaseAdmin
    .from('curriculum_chapters')
    .select('chapter_ref, subject, chapter_num, title')
    .eq('class_num', classNum)
    .order('subject')
    .order('chapter_num');

  if (chError) throw new ApiError('INTERNAL_ERROR', 'Failed to load curriculum chapters', chError.message);

  // 2. Fetch all games for this class (active)
  const { data: games, error: gError } = await supabaseAdmin
    .from('games_catalog')
    .select('game_id, chapter_ref, name')
    .eq('class_num', classNum)
    .eq('is_active', true);

  if (gError) throw new ApiError('INTERNAL_ERROR', 'Failed to load games catalog', gError.message);

  // 3. Fetch all attempts for this student
  const { data: attempts, error: aError } = await supabaseAdmin
    .from('game_attempts')
    .select('game_id, stars, best_score')
    .eq('student_id', studentId);

  if (aError) throw new ApiError('INTERNAL_ERROR', 'Failed to load game attempts', aError.message);

  // 4. Map them together
  const gameToStars = new Map<string, number>();
  const gameToBestScore = new Map<string, number | null>();
  for (const a of (attempts ?? [])) {
    gameToStars.set(a.game_id, a.stars);
    if (a.best_score !== null) gameToBestScore.set(a.game_id, a.best_score);
  }

  const chapterToGames = new Map<string, { gameId: string; name: string; stars: number; bestScore: number | null }[]>();
  for (const g of (games ?? [])) {
    if (!g.chapter_ref) continue;
    const stars = gameToStars.get(g.game_id) ?? 0;
    const bestScore = gameToBestScore.get(g.game_id) ?? null;
    const list = chapterToGames.get(g.chapter_ref) ?? [];
    list.push({ gameId: g.game_id, name: g.name, stars, bestScore });
    chapterToGames.set(g.chapter_ref, list);
  }

  return (chapters ?? []).map((ch) => {
    const chGames = chapterToGames.get(ch.chapter_ref) ?? [];
    const maxStars = chGames.length > 0 ? Math.max(...chGames.map(g => g.stars)) : 0;
    return {
      chapterRef: ch.chapter_ref,
      subject: ch.subject,
      chapterNum: ch.chapter_num,
      title: ch.title,
      games: chGames,
      stars: maxStars,
      completed: chGames.length > 0 && chGames.every(g => g.stars >= 2)
    };
  });
}
