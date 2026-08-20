/**
 * Adventure Island — per-class identity for Batch 1 (Classes 1–4).
 * Every class gets its own mascot + accent so a Class 2 login is visibly
 * a different world from Class 3. Colors are used as inline styles (not
 * Tailwind classes) so they can't be purged and stay exactly on-palette.
 */
export interface ClassTheme {
  mascot: string;
  teamName: string;
  accent: string;      // main fill
  accentDark: string;  // hard bottom-shadow shade
}

const THEMES: Record<number, ClassTheme> = {
  1: { mascot: '🐣', teamName: 'Chick Team', accent: '#58CC02', accentDark: '#439E01' },
  2: { mascot: '🐰', teamName: 'Rabbit Team', accent: '#1CB0F6', accentDark: '#0E86CC' },
  3: { mascot: '🦊', teamName: 'Fox Team', accent: '#9A4DF6', accentDark: '#7C31D6' },
  4: { mascot: '🦉', teamName: 'Owl Team', accent: '#00BCAA', accentDark: '#00988A' },
};

export function getClassTheme(classNum: number): ClassTheme {
  return THEMES[classNum] ?? THEMES[4];
}

/** Card gradient per subject for game/quiz cards. */
export function getSubjectCardColors(subject: string): { from: string; to: string; shadow: string; text: string } {
  const s = subject.toLowerCase();
  if (s.includes('math')) return { from: '#F8B45E', to: '#E7833D', shadow: '#C9682B', text: '#B95B25' };
  if (s.includes('english')) return { from: '#A995F5', to: '#7863D7', shadow: '#5F4DB8', text: '#6754C4' };
  return { from: '#F29CBC', to: '#DA6F9B', shadow: '#B9537C', text: '#B84F78' };
}
