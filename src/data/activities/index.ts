import { CLASS_5_ACTIVITIES } from './class5';
import { CLASS_6_ACTIVITIES } from './class6';
import { CLASS_7_ACTIVITIES } from './class7';
import { CLASS_8_ACTIVITIES } from './class8';
import type { ChapterActivity } from './types';

export type { ChapterActivity, PracticeQuestion } from './types';
export { Q, activity } from './types';

export const CLASS_5_TO_8_ACTIVITIES: ChapterActivity[] = [
  ...CLASS_5_ACTIVITIES,
  ...CLASS_6_ACTIVITIES,
  ...CLASS_7_ACTIVITIES,
  ...CLASS_8_ACTIVITIES,
];

export function activitiesForClass(classNum: number): ChapterActivity[] {
  return CLASS_5_TO_8_ACTIVITIES.filter((a) => a.classNum === classNum);
}

export function activityByGameId(gameId: string): ChapterActivity | undefined {
  return CLASS_5_TO_8_ACTIVITIES.find((a) => a.gameId === gameId);
}

/** Subject order on the Class 5–8 practice screen. */
export const SUBJECT_ORDER = ['Mathematics', 'World Around Us', 'Science', 'Social Science', 'English'] as const;

/** Map syllabus / book labels onto the practice catalog subjects. */
export function normalizePracticeSubject(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s.includes('math')) return 'Mathematics';
  if (s.includes('english')) return 'English';
  if (s.includes('science') && !s.includes('social') && !s.includes('environ')) return 'Science';
  if (s.includes('social') || s.includes('history') || s.includes('civics') || s.includes('geography')) {
    return 'Social Science';
  }
  if (s.includes('world around') || s.includes('environ') || s === 'evs' || s.includes('looking around')) {
    return 'World Around Us';
  }
  return raw;
}

export function practicePath(baseHref: string, subject: string, chapterNum?: number): string {
  const params = new URLSearchParams({ subject: normalizePracticeSubject(subject) });
  if (chapterNum != null) params.set('chapter', String(chapterNum));
  return `${baseHref}?${params.toString()}`;
}
