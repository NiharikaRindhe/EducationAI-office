import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { useSearchParams } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getClassTheme, getSubjectCardColors } from './theme';
import { QuestEngine } from './QuestEngine';

/* ───────────────────────── Types ───────────────────────── */

interface GameParams {
  max?: number;
  ops?: string[];
  letters?: string[];
  case?: 'upper' | 'lower';
  pairs?: { emoji: string; letter: string }[];
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

/* ───────────────────────── CSS keyframe injection ───────────────────────── */

const INJECTED_STYLES_ID = 'games-dynamic-styles';

function injectStyles() {
  if (document.getElementById(INJECTED_STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = INJECTED_STYLES_ID;
  style.textContent = `
    @keyframes game-shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
      20%, 40%, 60%, 80% { transform: translateX(6px); }
    }
    .animate-game-shake {
      animation: game-shake 0.5s ease-in-out;
    }
    @keyframes game-glow-green {
      0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
      50% { box-shadow: 0 0 24px 8px rgba(34,197,94,0.35); }
      100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }
    .animate-glow-green {
      animation: game-glow-green 0.6s ease-out;
    }
    @keyframes game-pulse-hint {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.85; }
    }
    .animate-pulse-hint {
      animation: game-pulse-hint 0.6s ease-in-out 3;
    }
    @keyframes xp-float {
      0% { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(-60px) scale(1.3); }
    }
    .animate-xp-float {
      animation: xp-float 1.4s ease-out forwards;
    }
    @keyframes card-bounce-tap {
      0% { transform: scale(1); }
      50% { transform: scale(0.93); }
      100% { transform: scale(1); }
    }
    .card-bounce-tap:active {
      animation: card-bounce-tap 0.25s ease-out;
    }
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }
    .skeleton-pulse {
      animation: skeleton-pulse 1.5s ease-in-out infinite;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
    }
  `;
  document.head.appendChild(style);
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
  const [searchParams] = useSearchParams();

  /* ── Loading state ── */
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<GameItem[]>([]);
  const [challengeGames, setChallengeGames] = useState<GameItem[]>([]);
  const [chapterInfo, setChapterInfo] = useState<Map<string, CurriculumChapterLite>>(new Map());
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);

  const theme = getClassTheme(currentClass);

  /* ── XP float animation ── */
  const [xpFloat, setXpFloat] = useState<{ amount: number; key: number } | null>(null);

  /* Chrome variant */
  const isPreReader = currentClass <= 2;
  const numChoices = isPreReader ? 3 : 4;

  useEffect(() => {
    injectStyles();
  }, []);

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

        /* Show XP float */
        if (res.xpGained > 0) {
          incrementXP(res.xpGained);
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
    [incrementXP],
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

  /* One juicy island card per game (or challenge) */
  const renderGameCard = (game: GameItem, isChallenge = false) => {
    const c = getSubjectCardColors(game.subject);
    if (game.locked) {
      return (
        <div
          key={game.gameId}
          className="relative rounded-[28px] p-5 flex flex-col items-center gap-2.5 select-none opacity-80"
          style={{ background: 'linear-gradient(160deg,#DDE9F2,#C3D5E2)', boxShadow: '0 8px 0 #A8BDCC' }}
        >
          <span className="text-6xl leading-none">🔒</span>
          <span className="font-display font-black text-sm" style={{ color: '#5E7A8C' }}>
            {isPreReader ? '⭐⭐' : 'Get 2 stars first!'}
          </span>
        </div>
      );
    }
    return (
      <button
        key={game.gameId}
        onClick={() => setActiveGame(game)}
        className="relative rounded-[28px] p-5 pt-6 flex flex-col items-center gap-2.5 overflow-hidden cursor-pointer
                   select-none transition-transform duration-150 hover:-translate-y-1.5 hover:rotate-[-0.5deg] active:translate-y-0.5"
        style={{
          background: `linear-gradient(160deg, ${c.from}, ${c.to})`,
          boxShadow: `0 8px 0 ${c.shadow}, 0 14px 24px ${c.to}55`,
        }}
      >
        <span
          className="absolute top-0 left-0 right-0 h-[44%] pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0))' }}
          aria-hidden="true"
        />
        <span
          className="absolute top-3 left-4 bg-white/90 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider"
          style={{ color: c.text }}
        >
          {isChallenge ? '🚀 CLASS ' + game.classNum : 'GAME'}
        </span>
        <span className="text-6xl leading-none anim-bob" style={{ filter: 'drop-shadow(0 4px 5px rgba(0,0,0,.2))' }}>
          {game.icon}
        </span>
        {!isPreReader && (
          <span className="font-display font-black text-base text-white text-center leading-tight"
                style={{ textShadow: '0 2px 3px rgba(0,0,0,.2)' }}>
            {game.name}
          </span>
        )}
        <span className="text-lg tracking-[3px]" style={{ textShadow: '0 2px 2px rgba(0,0,0,.15)' }}>
          {'⭐'.repeat(game.stars)}{'☆'.repeat(Math.max(0, 3 - game.stars))}
        </span>
        <span
          className="w-full bg-white rounded-2xl py-3 font-display font-black text-sm tracking-widest text-center
                     transition-transform active:translate-y-0.5"
          style={{ color: c.text, boxShadow: '0 4px 0 rgba(0,0,0,.15)' }}
        >
          PLAY ▶
        </span>
      </button>
    );
  };

  const renderGallery = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/60 rounded-[28px] flex flex-col items-center gap-4 p-6" style={{ minHeight: 190 }}>
              <div className="skeleton-pulse w-16 h-16 rounded-2xl" />
              <div className="skeleton-pulse w-24 h-3 rounded-full" />
              <div className="skeleton-pulse w-full h-9 rounded-2xl" />
            </div>
          ))}
        </div>
      );
    }

    if (games.length === 0) {
      return (
        <div className="bg-white/85 rounded-3xl p-12 text-center flex flex-col items-center gap-4"
             style={{ boxShadow: '0 6px 0 rgba(20,90,140,.12)' }}>
          <span className="text-6xl anim-bob">{theme.mascot}</span>
          <h3 className="font-display font-black text-lg" style={{ color: '#17425F' }}>New games coming soon!</h3>
          <p className="text-xs font-bold" style={{ color: '#7BA2BC' }}>Check back later to play and collect stars.</p>
        </div>
      );
    }

    const chapters = groupGamesByChapter();

    return (
      <div className="flex flex-col gap-7">
        {chapters.map((chapter) => {
          const chapterStars = chapter.games.reduce((s, g) => s + g.stars, 0);
          const maxStars = chapter.games.length * 3;
          return (
            <div key={chapter.chapterRef} className="flex flex-col gap-4">
              {/* Chapter header card */}
              <div className="bg-white rounded-3xl px-5 py-4 flex items-center gap-4"
                   style={{ boxShadow: '0 5px 0 rgba(20,90,140,.14)' }}>
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-xl text-white shrink-0"
                  style={{ background: theme.accent, boxShadow: `0 3px 0 ${theme.accentDark}` }}
                >
                  {chapter.chapterNum > 0 ? chapter.chapterNum : '★'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-base leading-tight truncate" style={{ color: '#17425F' }}>
                    {chapter.chapterTitle}
                  </div>
                  {!isPreReader && (
                    <div className="text-[10px] font-black tracking-widest" style={{ color: '#7BA2BC' }}>
                      {chapter.subject.toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Star meter */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-24 h-3.5 rounded-full overflow-hidden hidden sm:block" style={{ background: '#E4EEF8' }}>
                    <div className="h-full rounded-full"
                         style={{ width: `${maxStars > 0 ? (chapterStars / maxStars) * 100 : 0}%`,
                                  background: 'linear-gradient(90deg,#FFC800,#FFB100)' }} />
                  </div>
                  <b className="font-display text-sm" style={{ color: '#17425F' }}>{chapterStars}/{maxStars} ⭐</b>
                </div>
              </div>

              {/* This chapter's games */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                {chapter.games.map((game) => renderGameCard(game))}
              </div>
            </div>
          );
        })}

        {/* Challenge section — same-skill games one class up */}
        {challengeGames.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-3xl px-5 py-4 flex items-center gap-3"
                 style={{ boxShadow: '0 5px 0 rgba(20,90,140,.14)' }}>
              <span className="text-3xl anim-wiggle">🚀</span>
              <div>
                <div className="font-display font-black text-base" style={{ color: '#17425F' }}>
                  {isPreReader ? '🚀⭐' : 'Challenge Zone'}
                </div>
                {!isPreReader && (
                  <div className="text-[10px] font-black tracking-widest" style={{ color: '#7BA2BC' }}>
                    YOU MASTERED THIS — TRY THE NEXT CLASS!
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {challengeGames.map((game) => renderGameCard(game, true))}
            </div>
          </div>
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
        return <LetterTraceEngine game={activeGame} isPreReader={isPreReader} onFinish={submitAttempt} />;
      case 'phonics-pop':
        return <PhonicsPopEngine game={activeGame} numChoices={numChoices} isPreReader={isPreReader} onFinish={submitAttempt} />;
      case 'quest':
        return (
          <QuestEngine
            game={{ gameId: activeGame.gameId, name: activeGame.name, icon: activeGame.icon, params: activeGame.params as Record<string, any> }}
            numChoices={numChoices}
            isPreReader={isPreReader}
            onFinish={submitAttempt}
          />
        );
      default:
        return (
          <div className="text-center py-12 anim-fade-up">
            <span className="text-5xl">{activeGame.icon}</span>
            <p className="font-display font-bold text-slate-500 mt-4">Coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up relative">
      {/* XP float animation */}
      {xpFloat && (
        <div
          key={xpFloat.key}
          className="animate-xp-float fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-white font-display font-black text-lg px-5 py-2 rounded-full shadow-lg"
        >
          +{xpFloat.amount} XP
        </div>
      )}

      {activeGame ? (
        /* ── Active game wrapper ── */
        <div className="bg-white rounded-[28px] p-6 md:p-8 anim-fade-up" style={{ boxShadow: '0 8px 0 rgba(20,90,140,.14)' }}>
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <button
              onClick={() => setActiveGame(null)}
              className="flex items-center justify-center gap-2 text-white font-display font-black text-sm rounded-2xl px-5 py-2.5
                         transition-transform cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5"
              style={{ minHeight: 44, minWidth: 64, background: theme.accent, boxShadow: `0 4px 0 ${theme.accentDark}` }}
            >
              <ArrowLeft size={18} strokeWidth={3} />
              {!isPreReader && <span>Back</span>}
            </button>
            <span className="text-2xl anim-bob">{theme.mascot}</span>
          </div>

          {renderActiveGame()}
        </div>
      ) : (
        /* ── Gallery ── */
        renderGallery()
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

const CountAddEngine: React.FC<EngineProps> = ({ game, numChoices, isPreReader, onFinish }) => {
  const maxVal = game.params.max ?? 9;
  const ops = game.params.ops ?? ['+'];

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
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🏆</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          ))}
        </div>
        {!isPreReader && (
          <p className="font-display font-bold text-slate-600 text-sm">
            {correctCount} / {TOTAL_ROUNDS} correct
          </p>
        )}
        <button
          onClick={handlePlayAgain}
          className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer"
          style={{ minHeight: 48, minWidth: 120 }}
        >
          🔄 {isPreReader ? '' : 'Play Again'}
        </button>
      </div>
    );
  }

  const opEmoji = op === '-' ? '➖' : '➕';
  const emojiItem = op === '-' ? '🌟' : '⭐';

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto anim-fade-up">
      {/* Progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all ${
              i < round ? 'bg-emerald-400' : i === round ? 'bg-amber-400 scale-125' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Visual equation – emoji items */}
      <div className="flex items-center gap-5 bg-amber-50/60 border border-amber-100 p-6 rounded-3xl select-none">
        <div className="grid grid-cols-3 gap-1 min-h-[64px] items-center justify-items-center">
          {Array.from({ length: left }).map((_, i) => (
            <span key={'l' + i} className="text-3xl" style={{ animationDelay: `${i * 80}ms` }}>
              {emojiItem}
            </span>
          ))}
        </div>
        <span className="text-3xl">{opEmoji}</span>
        <div className="grid grid-cols-3 gap-1 min-h-[64px] items-center justify-items-center">
          {Array.from({ length: right }).map((_, i) => (
            <span key={'r' + i} className="text-3xl" style={{ animationDelay: `${i * 80}ms` }}>
              {emojiItem}
            </span>
          ))}
        </div>
        <span className="font-display font-black text-3xl text-slate-400">=</span>
        <span className="font-display font-black text-4xl text-amber-500">?</span>
      </div>

      {/* Answer buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        {options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrectOpt = opt === answer;
          let cls =
            'bg-white border-2 border-slate-200 hover:border-amber-300 text-slate-700';
          let extraStyle: React.CSSProperties = {};

          if (selected !== null) {
            if (isCorrectOpt) {
              cls = 'bg-emerald-500 border-2 border-emerald-500 text-white animate-glow-green';
              extraStyle = { transform: 'scale(1.15)' };
            } else if (isSelected && !isCorrectOpt) {
              cls = 'bg-red-400 border-2 border-red-400 text-white animate-game-shake opacity-50';
            } else {
              cls = 'bg-slate-100 border-2 border-slate-100 text-slate-300';
            }
          }

          // Pulse correct answer after wrong selection
          if (selected !== null && feedback === 'wrong' && isCorrectOpt) {
            cls += ' animate-pulse-hint';
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
              className={`w-16 h-16 rounded-2xl font-display font-extrabold text-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm ${cls}`}
              style={{ minWidth: 64, minHeight: 64, ...extraStyle }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ENGINE: LETTER TRACE
   ═══════════════════════════════════════════════════════════ */

interface TraceProps {
  game: GameItem;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const LetterTraceEngine: React.FC<TraceProps> = ({ game, isPreReader, onFinish }) => {
  const lettersRaw = game.params.letters ?? ['A'];
  const letterCase = game.params.case ?? 'upper';
  const letters = lettersRaw.map((l) => (letterCase === 'lower' ? l.toLowerCase() : l.toUpperCase()));

  const [letterIndex, setLetterIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [traceDone, setTraceDone] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentLetter = letters[letterIndex] ?? letters[0];

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTraceDone(false);

    /* Dotted guide letter */
    ctx.font = 'bold 200px Outfit, sans-serif';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(currentLetter, canvas.width / 2, canvas.height / 2);

    ctx.setLineDash([]);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
  }, [currentLetter]);

  useEffect(() => {
    const timer = setTimeout(initCanvas, 60);
    return () => clearTimeout(timer);
  }, [initCanvas, letterIndex]);

  /* ── Drawing helpers (shared by mouse + touch) ── */
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const beginStroke = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const continueStroke = (x: number, y: number) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endStroke = () => setIsDrawing(false);

  /* ── Mouse events ── */
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (coords) beginStroke(coords.x, coords.y);
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (coords) continueStroke(coords.x, coords.y);
  };

  /* ── Touch events ── */
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    if (coords) beginStroke(coords.x, coords.y);
  };
  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    if (coords) continueStroke(coords.x, coords.y);
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    endStroke();
  };

  /* ── Verify / Next ── */
  const handleVerify = () => {
    setTraceDone(true);
    confetti({ particleCount: 40, spread: 40 });

    if (letterIndex + 1 >= letters.length) {
      /* All letters traced – 3 stars always */
      setAllDone(true);
      onFinish(game.gameId, 3, letters.length);
      confetti({ particleCount: 100, spread: 70, colors: ['#f59e0b', '#22c55e', '#3b82f6'] });
    }
  };

  const handleNext = () => {
    setLetterIndex((i) => i + 1);
  };

  const handlePlayAgain = () => {
    setLetterIndex(0);
    setAllDone(false);
    setTraceDone(false);
  };

  if (allDone) {
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">✨</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <Star key={n} size={32} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
        {!isPreReader && (
          <p className="font-display font-bold text-slate-600 text-sm">
            All {letters.length} letters traced!
          </p>
        )}
        <button
          onClick={handlePlayAgain}
          className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer"
          style={{ minHeight: 48 }}
        >
          🔄 {isPreReader ? '' : 'Play Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-md mx-auto anim-fade-up">
      {/* Letter progress */}
      <div className="flex gap-2">
        {letters.map((l, i) => (
          <div
            key={i}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm transition-all ${
              i < letterIndex
                ? 'bg-emerald-400 text-white'
                : i === letterIndex
                ? 'bg-amber-400 text-white scale-110'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div
        className="border-2 border-amber-200 rounded-3xl overflow-hidden bg-amber-50/30 shadow-inner relative"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endStroke}
          onMouseLeave={endStroke}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="cursor-crosshair block w-full h-auto"
          style={{ maxWidth: 340 }}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={initCanvas}
          className="flex-1 py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-500 font-display font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          style={{ minHeight: 48 }}
        >
          🔄
        </button>

        {traceDone && letterIndex + 1 < letters.length ? (
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all animate-glow-green"
            style={{ minHeight: 48 }}
          >
            ✅ {isPreReader ? '→' : 'Next'}
          </button>
        ) : (
          <button
            onClick={handleVerify}
            disabled={traceDone}
            className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-40"
            style={{ minHeight: 48 }}
          >
            {traceDone ? '✅' : '✓'}
            {!isPreReader && (traceDone ? ' Done!' : ' Check')}
          </button>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ENGINE: PHONICS POP (silent-lab — emoji + letter match)
   ═══════════════════════════════════════════════════════════ */

const PhonicsPopEngine: React.FC<EngineProps> = ({ game, numChoices, isPreReader, onFinish }) => {
  const pairs = game.params.pairs ?? [
    { emoji: '🍎', letter: 'A' },
    { emoji: '🐻', letter: 'B' },
    { emoji: '🐱', letter: 'C' },
    { emoji: '🐶', letter: 'D' },
    { emoji: '🐘', letter: 'E' },
  ];

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
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🎈</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          ))}
        </div>
        {!isPreReader && (
          <p className="font-display font-bold text-slate-600 text-sm">
            {TOTAL_ROUNDS - mistakes} / {TOTAL_ROUNDS} correct
          </p>
        )}
        <button
          onClick={handlePlayAgain}
          className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer"
          style={{ minHeight: 48 }}
        >
          🔄 {isPreReader ? '' : 'Play Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto anim-fade-up">
      {/* Progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all ${
              i < round ? 'bg-emerald-400' : i === round ? 'bg-amber-400 scale-125' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Emoji prompt – "What letter does this start with?" */}
      <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-3xl flex flex-col items-center gap-2 select-none">
        <span className="text-6xl">{promptPair.emoji}</span>
        <span className="text-2xl text-amber-500">❓</span>
      </div>

      {/* Balloon field */}
      <div
        className="w-full bg-sky-50/50 border border-sky-100/30 rounded-3xl relative overflow-hidden"
        style={{ height: 280 }}
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
