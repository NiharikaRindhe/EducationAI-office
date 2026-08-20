import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getClassTheme, getSubjectCardColors } from './theme';
import { Button, EmptyState, GameFinishScreen, GameOption, GameOptionState, GameProgressDots, PageHeader, Pic, ProgressBar, Skeleton, StarRow, T } from './ui';
import { QuestEngine, type QuestParams } from './QuestEngine';
import { LetterTracingEngine } from './games/LetterTracingEngine';
import { NumberHopEngine } from './games/NumberHopEngine';
import { NumberSlideEngine } from './games/NumberSlideEngine';
import { WordBuildEngine } from './games/WordBuildEngine';
import { FractionPieEngine } from './games/FractionPieEngine';
import { NumberLineDistanceEngine } from './games/NumberLineDistanceEngine';
import { AreaBuilderEngine } from './games/AreaBuilderEngine';
import { GridSplitterEngine } from './games/GridSplitterEngine';
import { DivisionGridEngine } from './games/DivisionGridEngine';
import { FractionCompareEngine } from './games/FractionCompareEngine';
import { ContextFillEngine } from './games/ContextFillEngine';
import { SentenceGrammarEngine } from './games/SentenceGrammarEngine';
import { StoryOrderEngine } from './games/StoryOrderEngine';
import { PictureClueEngine } from './games/PictureClueEngine';
import { CrosswordEngine } from './games/CrosswordEngine';

/* ───────────────────────── Types ───────────────────────── */

interface GameParams {
  max?: number;
  ops?: string[];
  letters?: string[];
  case?: 'upper' | 'lower';
  pairs?: { emoji: string; letter: string }[];
  startLevel?: number;
  startSize?: number;
  words?: { sentence: string; answer: string; emoji: string; distractors: string[] }[];
  challenges?: { num: number; den: number }[];
  min?: number;
  rowMin?: number;
  rowMax?: number;
  colMin?: number;
  colMax?: number;
  decompose?: boolean;
  minA?: number;
  maxA?: number;
  minB?: number;
  maxB?: number;
  divisorMin?: number;
  divisorMax?: number;
  quotientMin?: number;
  quotientMax?: number;
  hasRemainder?: boolean;
  problems?: { a: { num: number; den: number }; b: { num: number; den: number } }[];
  contextPuzzles?: { passage: string; emoji: string; options: string[]; correct: string; wrong?: Record<string, string> }[];
  crosswordPuzzles?: { words: [{ id: string; answer: string; clue: string; emoji: string }, { id: string; answer: string; clue: string; emoji: string }] }[];
  sentences?: {
    slots: { id: string; accepts: ('noun' | 'pronoun' | 'verb' | 'adjective' | 'adverb')[]; label: string }[];
    wordBank: { word: string; pos: 'noun' | 'pronoun' | 'verb' | 'adjective' | 'adverb' }[];
    example: string;
  }[];
  stories?: { title: string; tiles: { id: string; text: string }[]; correctOrder: string[] }[];
  questions?: { text: string; correctIdx: number; options: { emoji: string; label: string; distractor?: string }[] }[];
}

interface GameItem {
  gameId: string;
  engine: string;
  subject: string;
  skillTag: string;
  classNum: number;
  level: number;
  chapterRef: string;
  name: string;
  icon: string;
  params: GameParams;
  stars: number;
  bestScore: number | null;
  locked: boolean;
}

interface ChapterGroup {
  chapterRef: string;
  subject: string;
  chapterNum: number;
  chapterTitle: string;
  games: GameItem[];
}

interface CurriculumChapterLite {
  chapterRef: string;
  subject: string;
  chapterNum: number;
  title: string;
}

interface AttemptResponse {
  attempt: {
    student_id: string;
    game_id: string;
    stars: number;
    best_score: number;
    attempts_count: number;
    last_played_at: string;
  };
  xpGained: number;
  newBadges: string[];
}

/* ───────────────────────── Helpers ───────────────────────── */

function starsForCountAdd(correct: number): number {
  if (correct >= 5) return 3;
  if (correct >= 4) return 2;
  if (correct >= 3) return 1;
  return 0;
}

function starsForPhonicsPop(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes === 1) return 2;
  return 1;
}

/* ───────────────────────── Main Component ───────────────────────── */

export const Batch1Games: React.FC = () => {
  const { currentClass, incrementXP } = useApp();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();

  /* ── Loading state ── */
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<GameItem[]>([]);
  const [challengeGames, setChallengeGames] = useState<GameItem[]>([]);
  const [chapterInfo, setChapterInfo] = useState<Map<string, CurriculumChapterLite>>(new Map());
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);
  /* Empty string = every subject. */
  const [activeSubject, setActiveSubject] = useState<string>('');

  const theme = getClassTheme(currentClass);

  /* ── XP float animation ── */
  const [xpFloat, setXpFloat] = useState<{ amount: number; key: number } | null>(null);

  /* Chrome variant */
  const isPreReader = currentClass <= 2;
  const numChoices = isPreReader ? 3 : 4;

  /* ── Auto-open game from chapter param ── */
  useEffect(() => {
    const chapterRef = searchParams.get('chapter');
    if (chapterRef && games.length > 0) {
      const gameForChapter = games.find((g) => g.chapterRef === chapterRef);
      if (gameForChapter) {
        setActiveGame(gameForChapter);
      }
    }
  }, [games, searchParams]);

  /* ── Fetch games from API ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get<{ games: GameItem[]; challengeGames: GameItem[] }>('/student/games'),
      api.get<CurriculumChapterLite[]>('/student/curriculum').catch(() => [] as CurriculumChapterLite[]),
    ])
      .then(([res, curriculum]) => {
        if (!cancelled) {
          setGames(res.games);
          setChallengeGames(res.challengeGames ?? []);
          setChapterInfo(new Map(curriculum.map((c) => [c.chapterRef, c])));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load games:', err);
          setGames([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Submit attempt helper ── */
  const submitAttempt = useCallback(
    async (gameId: string, stars: number, score: number) => {
      try {
        const res = await api.post<AttemptResponse>(
          '/student/games/' + gameId + '/attempts',
          { stars, score },
        );

        /* Show XP float; the award is server-side, so pull the fresh
           profile rather than double-counting with a local bump. */
        if (res.xpGained > 0) {
          void refreshUser();
          setXpFloat({ amount: res.xpGained, key: Date.now() });
          setTimeout(() => setXpFloat(null), 1600);
        }

        /* Confetti on new badges */
        if (res.newBadges && res.newBadges.length > 0) {
          confetti({ particleCount: 120, spread: 80, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
        }

        /* Update local star count */
        setGames((prev) =>
          prev.map((g) =>
            g.gameId === gameId ? { ...g, stars: Math.max(g.stars, stars), bestScore: res.attempt.best_score } : g,
          ),
        );
      } catch {
        /* Silently fall back – still update local XP */
        incrementXP(stars * 5);
        setXpFloat({ amount: stars * 5, key: Date.now() });
        setTimeout(() => setXpFloat(null), 1600);
        setGames((prev) =>
          prev.map((g) => (g.gameId === gameId ? { ...g, stars: Math.max(g.stars, stars) } : g)),
        );
      }
    },
    [incrementXP, refreshUser],
  );

  /* ───────────── Gallery View ───────────── */

  /* Group games by chapter, enriched with real chapter titles/numbers */
  const groupGamesByChapter = (): ChapterGroup[] => {
    const grouped = new Map<string, GameItem[]>();
    for (const game of games) {
      const key = game.chapterRef || 'no-chapter';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(game);
    }
    return Array.from(grouped.entries())
      .map(([ref, gameList]) => {
        const info = chapterInfo.get(ref);
        const first = gameList[0];
        return {
          chapterRef: ref,
          subject: info?.subject || first?.subject || 'Games',
          chapterNum: info?.chapterNum ?? 0,
          chapterTitle: info?.title || first?.subject || 'Fun Games',
          games: gameList,
        };
      })
      .sort((a, b) => a.subject.localeCompare(b.subject) || a.chapterNum - b.chapterNum);
  };

  /* One card per game.

     Rebuilt from the old "juicy island card" for three reasons a child hit
     immediately: the game's NAME was hidden for Class 1-2, so a chapter holding
     two games showed two identical unlabelled tiles (the frog pair that used to
     sit in Class 2 Maths); the "PLAY" strip was as big as the picture and
     competed with it; and the locked state read "Get 2 stars first!" — a
     sentence, to a child who cannot yet read one. Now: one big picture, the
     name always under it, stars, and the whole card is the button. */
  const renderGameCard = (game: GameItem, isChallenge = false) => {
    const c = getSubjectCardColors(game.subject);

    if (game.locked) {
      return (
        <div
          key={game.gameId}
          className="relative flex flex-col items-center justify-center gap-2 px-3 py-5 text-center select-none"
          style={{
            minHeight: 170,
            borderRadius: T.radius.md,
            background: 'linear-gradient(180deg,#E7F0F7,#D2E0EB)',
            boxShadow: '0 5px 0 #B7C9D6',
          }}
          aria-label={`${game.name} — locked. Win 2 stars on the game before it.`}
        >
          <span
            className="flex items-center justify-center"
            style={{ width: 62, height: 62, borderRadius: 999, background: 'rgba(255,255,255,.75)' }}
          >
            <Lock size={28} style={{ color: '#7E97A9' }} />
          </span>
          <span className="font-display font-black text-base leading-tight" style={{ color: '#5E7A8C' }}>
            {game.name}
          </span>
          {/* The rule is "win 2 stars on the one before". Drawn, not written. */}
          <StarRow earned={2} size={16} />
        </div>
      );
    }

    return (
      <button
        key={game.gameId}
        onClick={() => setActiveGame(game)}
        className="relative flex flex-col items-center justify-center gap-2.5 px-3 py-5 overflow-hidden text-center
                   select-none transition-transform duration-100 ease-out active:translate-y-[3px] cursor-pointer"
        style={{
          minHeight: 170,
          borderRadius: T.radius.md,
          background: `linear-gradient(180deg, ${c.from}, ${c.to})`,
          boxShadow: `0 5px 0 ${c.shadow}, 0 14px 24px ${c.to}45`,
        }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ height: '42%', background: 'linear-gradient(180deg, rgba(255,255,255,.32), rgba(255,255,255,0))' }}
        />

        {/* Marked only when it IS special. Every card used to carry a "GAME"
            badge, which told a child nothing they could not already see. */}
        {isChallenge && (
          <span
            className="absolute top-2.5 left-2.5 bg-white/95 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider"
            style={{ color: c.text }}
          >
            CLASS {game.classNum}
          </span>
        )}

        <Pic emoji={game.icon} size={52} className="drop-shadow-[0_3px_4px_rgba(0,0,0,.20)]" />

        <span
          className="font-display font-black text-sm sm:text-base text-white leading-tight px-1"
          style={{ textShadow: '0 2px 3px rgba(0,0,0,.22)' }}
        >
          {game.name}
        </span>

        <StarRow earned={game.stars} size={17} />
      </button>
    );
  };

  const renderGallery = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-5">
          <Skeleton height={56} />
          <div className="columns-1 md:columns-2 2xl:columns-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} height={i % 3 === 1 ? 300 : 230} className="break-inside-avoid mb-4" />
            ))}
          </div>
        </div>
      );
    }

    if (games.length === 0) {
      return (
        <EmptyState
          emoji={theme.mascot}
          title="No games yet!"
          body="Your teacher will open games for your class soon."
          action={{ label: 'Back home', to: '/batch1/home' }}
        />
      );
    }

    const chapters = groupGamesByChapter();

    /* Subject tabs. Without them this page is every chapter of every subject
       stacked in one column — roughly 4,000px for Class 2, which put the last
       games a dozen scrolls below the fold and effectively out of reach. */
    const subjects = Array.from(new Set(chapters.map((ch) => ch.subject)));
    const shown = activeSubject && subjects.includes(activeSubject)
      ? chapters.filter((ch) => ch.subject === activeSubject)
      : chapters;

    return (
      <div className="flex flex-col gap-5">
        {subjects.length > 1 && (
          <div className="flex gap-2.5 flex-wrap" role="tablist" aria-label="Choose a subject">
            {[{ key: '', label: 'All' }, ...subjects.map((sub) => ({ key: sub, label: sub }))].map((tab) => {
              const on = activeSubject === tab.key;
              return (
                <button
                  key={tab.key || 'all'}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActiveSubject(tab.key)}
                  className="font-display font-black text-sm sm:text-base px-5 transition-transform duration-100
                             active:translate-y-[2px] cursor-pointer"
                  style={{
                    minHeight: 52,
                    borderRadius: T.radius.sm,
                    background: on ? theme.accent : '#FFFFFF',
                    color: on ? '#FFFFFF' : T.ink.strong,
                    border: `2px solid ${on ? theme.accent : T.surface.line}`,
                    boxShadow: `0 3px 0 ${on ? theme.accentDark : '#CBDDE9'}`,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Chapters are PANELS that tile, not full-width rows.

           Most chapters in this curriculum hold exactly one game. Giving each
           its own row across a 1680px screen left a single card at the far left
           with six empty columns beside it, repeated a dozen times down the
           page. CSS columns let each panel take only the height it needs and
           pack side by side, so the grouping survives and the whitespace goes. */}
        <div className="columns-1 md:columns-2 2xl:columns-3 gap-4">
          {shown.map((chapter) => {
            const chapterStars = chapter.games.reduce((sum, g) => sum + g.stars, 0);
            const maxStars = chapter.games.length * 3;
            return (
              <section
                key={chapter.chapterRef}
                className="break-inside-avoid mb-4 bg-white/70 p-3.5 flex flex-col gap-3"
                style={{ borderRadius: T.radius.md, boxShadow: T.shadow.card }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex items-center justify-center font-display font-black text-base text-white shrink-0"
                    style={{
                      width: 38, height: 38, borderRadius: T.radius.sm,
                      background: theme.accent, boxShadow: `0 3px 0 ${theme.accentDark}`,
                    }}
                  >
                    {chapter.chapterNum > 0 ? chapter.chapterNum : '★'}
                  </span>
                  <h2
                    className="flex-1 min-w-0 font-display font-black text-sm sm:text-base leading-tight"
                    style={{ color: T.ink.strong }}
                  >
                    {chapter.chapterTitle}
                  </h2>
                  <span className="flex items-center gap-2 shrink-0">
                    <ProgressBar value={chapterStars} max={maxStars} className="w-16 hidden sm:block" />
                    <b className="font-display text-xs whitespace-nowrap" style={{ color: T.ink.muted }}>
                      {chapterStars}/{maxStars}
                    </b>
                  </span>
                </div>

                {/* Two per row inside a panel: most chapters hold one or two
                    games, and a half-panel card is a far bigger tap target for a
                    six-year-old than a third-panel one. */}
                <div className="grid grid-cols-2 gap-3">
                  {chapter.games.map((game) => renderGameCard(game))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Same skill, one class up — offered once a child has mastered theirs. */}
        {challengeGames.length > 0 && !activeSubject && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-1">
              <Pic emoji="🚀" size={40} />
              <h2 className="font-display font-black text-base sm:text-lg" style={{ color: T.ink.strong }}>
                Try something harder
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-7 gap-3">
              {challengeGames.map((game) => renderGameCard(game, true))}
            </div>
          </section>
        )}
      </div>
    );
  };

  /* ───────────── Render engine view ───────────── */

  const renderActiveGame = () => {
    if (!activeGame) return null;

    switch (activeGame.engine) {
      case 'count-add':
        return <CountAddEngine game={activeGame} numChoices={numChoices} isPreReader={isPreReader} onFinish={submitAttempt} />;
      case 'letter-trace':
        // The real EducationAI tracing engine (stroke order, direction and
        // accuracy scoring) replaces the earlier proximity-only lookalike.
        return (
          <LetterTracingEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { letters: activeGame.params.letters } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'phonics-pop':
        return <PhonicsPopEngine game={activeGame} numChoices={numChoices} isPreReader={isPreReader} onFinish={submitAttempt} />;
      case 'number-hop':
        return (
          <NumberHopEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { startLevel: activeGame.params.startLevel } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'number-slide':
        return (
          <NumberSlideEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { startSize: activeGame.params.startSize } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'word-build':
        return (
          <WordBuildEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { words: activeGame.params.words } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'fraction-pie':
        return (
          <FractionPieEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { challenges: activeGame.params.challenges } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'number-distance':
        return (
          <NumberLineDistanceEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { min: activeGame.params.min, max: activeGame.params.max } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'area-builder':
        return (
          <AreaBuilderEngine
            game={{
              gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon,
              params: {
                rowMin: activeGame.params.rowMin, rowMax: activeGame.params.rowMax,
                colMin: activeGame.params.colMin, colMax: activeGame.params.colMax,
                decompose: activeGame.params.decompose,
              },
            }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'grid-splitter':
        return (
          <GridSplitterEngine
            game={{
              gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon,
              params: { minA: activeGame.params.minA, maxA: activeGame.params.maxA, minB: activeGame.params.minB, maxB: activeGame.params.maxB },
            }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'division-grid':
        return (
          <DivisionGridEngine
            game={{
              gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon,
              params: {
                divisorMin: activeGame.params.divisorMin, divisorMax: activeGame.params.divisorMax,
                quotientMin: activeGame.params.quotientMin, quotientMax: activeGame.params.quotientMax,
                hasRemainder: activeGame.params.hasRemainder,
              },
            }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'fraction-compare':
        return (
          <FractionCompareEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { problems: activeGame.params.problems } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'context-fill':
        return (
          <ContextFillEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { puzzles: activeGame.params.contextPuzzles } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'sentence-grammar':
        return (
          <SentenceGrammarEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { sentences: activeGame.params.sentences } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'story-order':
        return (
          <StoryOrderEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { stories: activeGame.params.stories } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'picture-clue-read':
        return (
          <PictureClueEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { questions: activeGame.params.questions } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'crossword':
        return (
          <CrosswordEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: { puzzles: activeGame.params.crosswordPuzzles } }}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      case 'quest':
        return (
          <QuestEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: activeGame.params as QuestParams }}
            numChoices={numChoices}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center gap-3 py-12 anim-fade-up">
            <Pic emoji={activeGame.icon} size={56} />
            <p className="font-display font-bold" style={{ color: T.ink.muted }}>Coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-5 select-none anim-fade-up relative">
      {/* Star reward, floating up from where the child just earned it. */}
      {xpFloat && (
        <div
          key={xpFloat.key}
          className="animate-xp-float fixed top-24 left-1/2 -translate-x-1/2 z-50 font-display font-black text-lg px-5 py-2.5 rounded-full"
          style={{ background: '#FFC400', color: '#7A5200', boxShadow: '0 4px 0 #D79E00' }}
        >
          +{xpFloat.amount} ⭐
        </div>
      )}

      {activeGame ? (
        /* ── Playing ── */
        <div className="flex flex-col gap-4">
          {/* The way out of a game. It used to be an arrow with no word next to
              it for Class 1–2, which is the one control a stuck child needs to
              find; it now always says what it does. */}
          <div className="flex items-center gap-3">
            <Button tone="quiet" onClick={() => setActiveGame(null)}>
              Back
            </Button>
            <div className="flex items-center gap-2.5 min-w-0">
              <Pic emoji={activeGame.icon} size={34} />
              <span className="font-display font-black text-lg truncate" style={{ color: T.ink.strong }}>
                {activeGame.name}
              </span>
            </div>
          </div>

          {/* No outer Card here on purpose — each engine sits directly on the
              page's own frame instead of inside a second nested white panel.
              A little horizontal padding on narrow screens takes the place of
              the Card's old edge margin, so controls don't sit flush against
              the frame edge on a phone. */}
          <div className="anim-fade-up px-1 sm:px-0">{renderActiveGame()}</div>
        </div>
      ) : (
        /* ── Choosing ── */
        <>
          <PageHeader
            emoji="🎮"
            artKey="nav-games"
            title="Games"
            hint="Play, and collect stars for every chapter"
            right={
              <Button to="/batch1/syllabus" tone="quiet" icon={<Pic emoji="🗺️" name="nav-journey" size={22} />}>
                See my map
              </Button>
            }
          />
          {renderGallery()}
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ENGINE: COUNT & ADD
   ═══════════════════════════════════════════════════════════ */

interface EngineProps {
  game: GameItem;
  numChoices: number;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

/** Stable fallback so `ops` doesn't become a fresh array on every render —
 *  `game.params.ops ?? ['+']` used to inline that literal, which gave
 *  `generateProblem`'s useCallback a new dependency identity every render
 *  and fed straight into `useEffect(() => generateProblem(), [generateProblem])`:
 *  an infinite render loop. Never hit by a real seeded game (every count-add
 *  row's params sets `ops` explicitly), but any game that ever doesn't would
 *  have crashed the whole page. */
const DEFAULT_COUNT_ADD_OPS = ['+'];

const CountAddEngine: React.FC<EngineProps> = ({ game, numChoices, isPreReader, onFinish }) => {
  const maxVal = game.params.max ?? 9;
  const ops = game.params.ops ?? DEFAULT_COUNT_ADD_OPS;

  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [op, setOp] = useState('+');
  const [answer, setAnswer] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const TOTAL_ROUNDS = 5;

  const generateProblem = useCallback(() => {
    const chosenOp = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, ans: number;

    if (chosenOp === '-') {
      a = Math.floor(Math.random() * maxVal) + 1;
      b = Math.floor(Math.random() * a) + 1; // ensure b <= a so answer >= 0
      ans = a - b;
    } else {
      a = Math.floor(Math.random() * maxVal) + 1;
      b = Math.floor(Math.random() * maxVal) + 1;
      ans = a + b;
    }

    setLeft(a);
    setRight(b);
    setOp(chosenOp);
    setAnswer(ans);
    setSelected(null);
    setFeedback(null);

    /* Generate unique options */
    const optSet = new Set<number>([ans]);
    let tries = 0;
    while (optSet.size < numChoices && tries < 50) {
      const offset = Math.floor(Math.random() * 5) - 2;
      const candidate = ans + offset;
      if (candidate >= 0 && candidate !== ans) optSet.add(candidate);
      tries++;
    }
    /* Fill if not enough */
    while (optSet.size < numChoices) {
      optSet.add(ans + optSet.size);
    }
    setOptions(Array.from(optSet).sort(() => Math.random() - 0.5));
  }, [maxVal, ops, numChoices]);

  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  const handleSelect = (val: number) => {
    if (selected !== null) return;
    setSelected(val);

    if (val === answer) {
      setFeedback('correct');
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);
      confetti({ particleCount: 25, spread: 30, origin: { y: 0.7 } });

      if (round + 1 >= TOTAL_ROUNDS) {
        setTimeout(() => {
          const earned = starsForCountAdd(newCorrect);
          setFinished(true);
          onFinish(game.gameId, earned, newCorrect);
          if (earned >= 2) {
            confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
          }
        }, 1200);
      } else {
        setTimeout(() => {
          setRound((r) => r + 1);
          generateProblem();
        }, 1400);
      }
    } else {
      setFeedback('wrong');
      if (round + 1 >= TOTAL_ROUNDS) {
        setTimeout(() => {
          const newCorrect2 = correctCount; // wrong answer, no increment
          const earned = starsForCountAdd(newCorrect2);
          setFinished(true);
          onFinish(game.gameId, earned, newCorrect2);
        }, 1500);
      } else {
        setTimeout(() => {
          setRound((r) => r + 1);
          generateProblem();
        }, 2000);
      }
    }
  };

  const handlePlayAgain = () => {
    setRound(0);
    setCorrectCount(0);
    setFinished(false);
    generateProblem();
  };

  if (finished) {
    const earned = starsForCountAdd(correctCount);
    return (
      <GameFinishScreen
        earned={earned}
        scoreLabel={isPreReader ? undefined : `${correctCount} of ${TOTAL_ROUNDS} correct`}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  const opEmoji = op === '-' ? '➖' : '➕';
  const emojiItem = op === '-' ? '🌟' : '⭐';

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto anim-fade-up">
      <GameProgressDots total={TOTAL_ROUNDS} current={round} />

      {/* Visual equation – emoji items */}
      <div className="flex items-center gap-5 p-6 select-none" style={{ borderRadius: T.radius.md, background: T.surface.sunk }}>
        <div className="grid grid-cols-3 gap-1 min-h-[64px] items-center justify-items-center">
          {Array.from({ length: left }).map((_, i) => (
            <span key={'l' + i} style={{ animationDelay: `${i * 80}ms` }}>
              <Pic emoji={emojiItem} size={30} />
            </span>
          ))}
        </div>
        <span className="text-3xl">{opEmoji}</span>
        <div className="grid grid-cols-3 gap-1 min-h-[64px] items-center justify-items-center">
          {Array.from({ length: right }).map((_, i) => (
            <span key={'r' + i} style={{ animationDelay: `${i * 80}ms` }}>
              <Pic emoji={emojiItem} size={30} />
            </span>
          ))}
        </div>
        <span className="font-display font-black text-3xl" style={{ color: T.ink.faint }}>=</span>
        <span className="font-display font-black text-4xl" style={{ color: '#DB9A00' }}>?</span>
      </div>

      {/* Answer buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        {options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrectOpt = opt === answer;
          let state: GameOptionState = 'idle';
          let extra = '';
          if (selected !== null) {
            if (isCorrectOpt) { state = 'correct'; extra = 'scale-[1.15]'; }
            else if (isSelected) state = 'wrong';
            else state = 'dimmed';
          }
          if (selected !== null && feedback === 'wrong' && isCorrectOpt) extra += ' animate-pulse-hint';

          return (
            <GameOption key={opt} state={state} disabled={selected !== null} onClick={() => handleSelect(opt)} className={`text-2xl ${extra}`} style={{ width: 64, height: 64 }}>
              {opt}
            </GameOption>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ENGINE: LETTER TRACE
   Lives in ./games/LetterTracingEngine.tsx, which runs the real
   EducationAI tracing engine (src/lib/tracing). The 222-line
   proximity-only lookalike that used to sit here was removed when
   that port landed — it scored nothing about stroke order or
   direction, so a scribble passed.
   ═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   ENGINE: PHONICS POP (silent-lab — emoji + letter match)
   ═══════════════════════════════════════════════════════════ */

/** Same stable-fallback fix as DEFAULT_COUNT_ADD_OPS above — this literal
 *  used to be inlined at `game.params.pairs ?? [...]`, which fed a fresh
 *  array into generateBalloons' useCallback every render and infinite-looped
 *  the moment a game's params didn't set `pairs` explicitly. */
const DEFAULT_PHONICS_PAIRS = [
  { emoji: '🍎', letter: 'A' },
  { emoji: '🐻', letter: 'B' },
  { emoji: '🐱', letter: 'C' },
  { emoji: '🐶', letter: 'D' },
  { emoji: '🐘', letter: 'E' },
];

const PhonicsPopEngine: React.FC<EngineProps> = ({ game, numChoices, isPreReader, onFinish }) => {
  const pairs = game.params.pairs ?? DEFAULT_PHONICS_PAIRS;

  const TOTAL_ROUNDS = Math.min(pairs.length, 5);

  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const [balloons, setBalloons] = useState<{ id: number; letter: string; x: number; y: number; color: string; popped: boolean; shake: boolean }[]>([]);
  const [promptPair, setPromptPair] = useState(pairs[0]);

  const BALLOON_COLORS = [
    'bg-rose-400', 'bg-sky-400', 'bg-amber-400',
    'bg-emerald-400', 'bg-purple-400', 'bg-indigo-400',
    'bg-pink-400', 'bg-teal-400',
  ];

  const generateBalloons = useCallback(
    (pairIdx: number) => {
      const target = pairs[pairIdx];
      setPromptPair(target);

      const allLetters = pairs.map((p) => p.letter);
      const pool = allLetters.filter((l) => l !== target.letter);

      const items: typeof balloons = [];

      /* Add correct balloon */
      items.push({
        id: Date.now(),
        letter: target.letter,
        x: 10 + Math.random() * 70,
        y: 10 + Math.random() * 65,
        color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
        popped: false,
        shake: false,
      });

      /* Add distractors */
      const count = numChoices - 1;
      for (let i = 0; i < count; i++) {
        const letter = pool.length > 0 ? pool[i % pool.length] : String.fromCharCode(65 + ((i + 3) % 26));
        items.push({
          id: Date.now() + i + 1,
          letter,
          x: 10 + Math.random() * 70,
          y: 10 + Math.random() * 65,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
          popped: false,
          shake: false,
        });
      }

      setBalloons(items.sort(() => Math.random() - 0.5));
    },
    [pairs, numChoices],
  );

  useEffect(() => {
    generateBalloons(0);
  }, [generateBalloons]);

  const handlePop = (balloon: typeof balloons[0]) => {
    if (balloon.popped) return;

    if (balloon.letter === promptPair.letter) {
      /* Correct */
      setBalloons((prev) =>
        prev.map((b) => (b.id === balloon.id ? { ...b, popped: true } : b)),
      );
      confetti({ particleCount: 20, spread: 30, origin: { y: 0.6 } });

      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS) {
        setTimeout(() => {
          const earned = starsForPhonicsPop(mistakes);
          setFinished(true);
          onFinish(game.gameId, earned, TOTAL_ROUNDS - mistakes);
          if (earned >= 2) {
            confetti({ particleCount: 80, spread: 60 });
          }
        }, 800);
      } else {
        setTimeout(() => {
          setRound(nextRound);
          generateBalloons(nextRound);
        }, 900);
      }
    } else {
      /* Wrong – shake + dim */
      setMistakes((m) => m + 1);
      setBalloons((prev) =>
        prev.map((b) =>
          b.id === balloon.id ? { ...b, shake: true } : b,
        ),
      );
      /* Reset shake after animation */
      setTimeout(() => {
        setBalloons((prev) =>
          prev.map((b) => (b.id === balloon.id ? { ...b, shake: false } : b)),
        );
      }, 600);
    }
  };

  const handlePlayAgain = () => {
    setRound(0);
    setMistakes(0);
    setFinished(false);
    generateBalloons(0);
  };

  if (finished) {
    const earned = starsForPhonicsPop(mistakes);
    return (
      <GameFinishScreen
        earned={earned}
        scoreLabel={isPreReader ? undefined : `${TOTAL_ROUNDS - mistakes} of ${TOTAL_ROUNDS} correct`}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto anim-fade-up">
      <GameProgressDots total={TOTAL_ROUNDS} current={round} />

      {/* Emoji prompt – "What letter does this start with?" */}
      <div className="p-5 flex flex-col items-center gap-2 select-none" style={{ borderRadius: T.radius.md, background: '#FFF7E0', border: '2px solid #FFE9A8' }}>
        <Pic emoji={promptPair.emoji} size={60} />
        <span className="text-2xl" style={{ color: '#DB9A00' }}>❓</span>
      </div>

      {/* Balloon field */}
      <div
        className="w-full relative overflow-hidden"
        style={{ height: 280, borderRadius: T.radius.md, background: '#EAF6FE', border: `1px solid ${T.surface.line}` }}
      >
        {balloons.map((bal) => {
          if (bal.popped) return null;

          return (
            <button
              key={bal.id}
              onClick={() => handlePop(bal)}
              className={`absolute flex items-center justify-center text-white font-display font-black text-xl cursor-pointer transition-all shadow-lg
                ${bal.color}
                ${bal.shake ? 'animate-game-shake opacity-50' : 'hover:scale-110'}`}
              style={{
                left: `${bal.x}%`,
                top: `${bal.y}%`,
                width: 64,
                height: 80,
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                minWidth: 64,
                minHeight: 64,
              }}
            >
              {bal.letter}
            </button>
          );
        })}
      </div>
    </div>
  );
};
