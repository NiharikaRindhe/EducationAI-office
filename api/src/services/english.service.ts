import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { chatCompletion, aiConfigured } from '../lib/ai.js';
import { addXp, logStreakActivity } from './gamification.service.js';
import type { EnglishItemsQuery, SubmitEnglishAttemptInput } from '../schemas/english.schema.js';

export async function getItems(query: EnglishItemsQuery) {
  let dbQuery = supabaseAdmin.from('english_assessment_items').select('*').eq('class_num', query.classNum);
  if (query.type) dbQuery = dbQuery.eq('type', query.type);

  const { data, error } = await dbQuery.limit(query.limit);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load English items', error.message);
  return data;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^\w\s]/g, '');
}

const WORD_TYPES = new Set(['word_repeat', 'word_see_say']);

async function scoreWord(target: string, transcript: string): Promise<{ result: 'correct' | 'close' | 'incorrect'; feedback: string }> {
  if (!(await aiConfigured())) {
    const isMatch = normalize(target) === normalize(transcript);
    return { result: isMatch ? 'correct' : 'incorrect', feedback: isMatch ? 'Well done!' : "Let's try that word again!" };
  }

  try {
    const raw = await chatCompletion(
      [
        {
          role: 'user',
          content: `A young child was asked to say the word "${target}". Speech recognition heard: "${transcript}". Score the pronunciation as "correct" (clearly the right word), "close" (minor mispronunciation), or "incorrect" (different word or nothing usable). Return ONLY JSON: {"result": "correct"|"close"|"incorrect", "feedback": "<one short encouraging sentence for a young child>"}`,
        },
      ],
      { jsonMode: true },
    );
    return JSON.parse(raw) as { result: 'correct' | 'close' | 'incorrect'; feedback: string };
  } catch {
    const isMatch = normalize(target) === normalize(transcript);
    return { result: isMatch ? 'correct' : 'incorrect', feedback: isMatch ? 'Well done!' : "Let's try that word again!" };
  }
}

interface SentenceScore {
  accuracyScore: number; // 0-10
  fluencyScore: number; // 0-10
  feedback: string;
}

function heuristicSentenceScore(target: string, transcript: string): SentenceScore {
  const targetWords = normalize(target).split(/\s+/).filter(Boolean);
  const transcriptWords = new Set(normalize(transcript).split(/\s+/).filter(Boolean));
  const overlap = targetWords.filter((w) => transcriptWords.has(w)).length;
  const accuracyScore = targetWords.length > 0 ? Math.round((overlap / targetWords.length) * 10) : 0;
  return { accuracyScore, fluencyScore: accuracyScore, feedback: 'Keep practicing your reading!' };
}

async function scoreSentence(target: string, transcript: string, classNum: number, wpm: number | null): Promise<SentenceScore> {
  if (!(await aiConfigured())) return heuristicSentenceScore(target, transcript);

  try {
    const raw = await chatCompletion(
      [
        {
          role: 'user',
          content: `A Class ${classNum} student read this sentence aloud:\nTarget: "${target}"\nWhat was heard: "${transcript}"\n${wpm ? `Reading speed: ${Math.round(wpm)} words per minute\n` : ''}Evaluate accuracy (0-10, did they say the right words) and fluency (0-10, was the pace appropriate for their class). Return ONLY JSON: {"accuracy_score": 0-10, "fluency_score": 0-10, "feedback": "<one short encouraging sentence>"}`,
        },
      ],
      { jsonMode: true },
    );
    const parsed = JSON.parse(raw) as { accuracy_score: number; fluency_score: number; feedback: string };
    return { accuracyScore: parsed.accuracy_score, fluencyScore: parsed.fluency_score, feedback: parsed.feedback };
  } catch {
    return heuristicSentenceScore(target, transcript);
  }
}

export async function submitAttempt(studentId: string, input: SubmitEnglishAttemptInput) {
  const { data: item, error } = await supabaseAdmin
    .from('english_assessment_items')
    .select('*')
    .eq('id', input.itemId)
    .single();
  if (error || !item) throw new ApiError('NOT_FOUND', 'English assessment item not found');

  let xpEarned = 0;
  let accuracyScore: number | null = null;
  let fluencyScore: number | null = null;
  let wpm: number | null = null;
  let result: 'correct' | 'close' | 'incorrect' | null = null;
  let feedback = '';

  if (WORD_TYPES.has(item.type)) {
    const scored = await scoreWord(item.content, input.transcript);
    result = scored.result;
    feedback = scored.feedback;
    xpEarned = result === 'correct' ? 20 : result === 'close' ? 10 : 2;
  } else {
    if (input.durationSec) {
      const wordCount = item.content.trim().split(/\s+/).length;
      wpm = (wordCount / input.durationSec) * 60;
    }
    const scored = await scoreSentence(item.content, input.transcript, item.class_num, wpm);
    accuracyScore = scored.accuracyScore;
    fluencyScore = scored.fluencyScore;
    feedback = scored.feedback;
    xpEarned = Math.round(((accuracyScore + fluencyScore) / 20) * 30);
  }

  const { data: attempt, error: insertError } = await supabaseAdmin
    .from('english_assessment_attempts')
    .insert({
      student_id: studentId,
      item_id: input.itemId,
      class_num: item.class_num,
      transcript: input.transcript,
      accuracy_score: accuracyScore,
      fluency_score: fluencyScore,
      wpm: wpm ? Math.round(wpm) : null,
      ai_feedback: feedback,
      result,
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (insertError) throw new ApiError('INTERNAL_ERROR', 'Failed to save attempt', insertError.message);

  let newBadges: { id: string; name: string; icon: string | null }[] = [];
  if (xpEarned > 0) {
    const xpResult = await addXp(studentId, xpEarned);
    newBadges = xpResult.newBadges;
    await logStreakActivity(studentId, xpEarned);
  }

  return { attempt, newBadges };
}

export async function getProgress(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from('english_assessment_attempts')
    .select('accuracy_score, fluency_score, wpm, result, attempted_at')
    .eq('student_id', studentId)
    .order('attempted_at', { ascending: false })
    .limit(50);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load progress', error.message);

  const withScores = (data ?? []).filter((a) => a.accuracy_score !== null);
  const avgAccuracy =
    withScores.length > 0 ? withScores.reduce((sum, a) => sum + (a.accuracy_score ?? 0), 0) / withScores.length : null;
  const avgFluency =
    withScores.length > 0 ? withScores.reduce((sum, a) => sum + (a.fluency_score ?? 0), 0) / withScores.length : null;
  const wordAttempts = (data ?? []).filter((a) => a.result !== null);
  const correctWords = wordAttempts.filter((a) => a.result === 'correct').length;

  return {
    totalAttempts: data?.length ?? 0,
    avgAccuracy,
    avgFluency,
    wordAccuracyPct: wordAttempts.length > 0 ? Math.round((correctWords / wordAttempts.length) * 100) : null,
    recentAttempts: data,
  };
}
