import React, { useState } from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button, GameFinishScreen, GameProgressDots, T } from '../ui';

/* Ported from EducationAI-Games-master's Grade3 "SentenceBuilder" (tap
   word-tiles by part-of-speech into slots) and restyled to this app's
   Adventure Island look — amber/emerald palette, font-display, rounded-3xl
   cards — instead of the source's own multi-color POS theme + standalone
   header/level-tabs. Tap-to-place only (drag-drop dropped to stay
   touch-first like the rest of Batch1). Class 3 gets simple subject+verb
   slots; Class 4 gets the expanded adjective+noun+verb+adverb set, via
   params.sentences. No curriculum_chapters row exists yet for Class 3/4
   English, so this ships as an ungrouped skill game (chapter_ref = null). */

type Pos = 'noun' | 'pronoun' | 'verb' | 'adjective' | 'adverb';
interface Slot { id: string; accepts: Pos[]; label: string }
interface WordTile { word: string; pos: Pos }
interface GrammarSentence { slots: Slot[]; wordBank: WordTile[]; example: string }
interface SentenceGrammarGame {
  gameId: string;
  name: string;
  icon: string;
  params: { sentences?: GrammarSentence[] };
}
interface SentenceGrammarEngineProps {
  game: SentenceGrammarGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const POS_STYLE: Record<Pos, { bg: string; text: string; light: string; label: string }> = {
  noun: { bg: 'bg-violet-400', text: 'text-violet-700', light: 'bg-violet-50', label: 'Noun' },
  pronoun: { bg: 'bg-amber-400', text: 'text-amber-700', light: 'bg-amber-50', label: 'Pronoun' },
  verb: { bg: 'bg-rose-400', text: 'text-rose-700', light: 'bg-rose-50', label: 'Verb' },
  adjective: { bg: 'bg-emerald-400', text: 'text-emerald-700', light: 'bg-emerald-50', label: 'Adjective' },
  adverb: { bg: 'bg-sky-400', text: 'text-sky-700', light: 'bg-sky-50', label: 'Adverb' },
};

const FALLBACK_SENTENCES: GrammarSentence[] = [
  {
    slots: [{ id: 'subject', accepts: ['noun', 'pronoun'], label: 'SUBJECT' }, { id: 'verb', accepts: ['verb'], label: 'VERB' }],
    wordBank: [{ word: 'Dogs', pos: 'noun' }, { word: 'She', pos: 'pronoun' }, { word: 'bark', pos: 'verb' }, { word: 'sing', pos: 'verb' }],
    example: 'Dogs bark.',
  },
];

function starsForGrammar(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

export const SentenceGrammarEngine: React.FC<SentenceGrammarEngineProps> = ({ game, isPreReader, onFinish }) => {
  const sentences = game.params.sentences && game.params.sentences.length > 0 ? game.params.sentences : FALLBACK_SENTENCES;

  const [idx, setIdx] = useState(0);
  const [filled, setFilled] = useState<Record<string, WordTile | null>>(() =>
    Object.fromEntries(sentences[0].slots.map((s) => [s.id, null])),
  );
  const [error, setError] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<'correct' | null>(null);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const sentence = sentences[idx];
  const usedWords = new Set(Object.values(filled).filter(Boolean).map((t) => t!.word));
  const allFilled = sentence.slots.every((s) => filled[s.id]);

  function tapTile(tile: WordTile) {
    if (result !== null || usedWords.has(tile.word)) return;
    setError(null);
    const nextSlot = sentence.slots.find((s) => !filled[s.id] && s.accepts.includes(tile.pos));
    if (!nextSlot) {
      setError(`No empty slot needs a ${POS_STYLE[tile.pos].label} right now.`);
      setMistakes((m) => m + 1);
      return;
    }
    setFilled((prev) => ({ ...prev, [nextSlot.id]: tile }));
  }

  function removeFromSlot(slotId: string) {
    if (result !== null) return;
    setFilled((prev) => ({ ...prev, [slotId]: null }));
  }

  function checkGrammar() {
    if (!allFilled) return;
    setResult('correct');
    confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
  }

  function nextSentence() {
    if (idx + 1 >= sentences.length) {
      const earned = starsForGrammar(mistakes);
      setFinished(true);
      onFinish(game.gameId, earned, sentences.length);
      if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      return;
    }
    const next = idx + 1;
    setIdx(next);
    setFilled(Object.fromEntries(sentences[next].slots.map((s) => [s.id, null])));
    setResult(null);
    setError(null);
    setShowHint(false);
  }

  function handlePlayAgain() {
    setIdx(0);
    setMistakes(0);
    setFinished(false);
    setFilled(Object.fromEntries(sentences[0].slots.map((s) => [s.id, null])));
    setResult(null);
    setError(null);
  }

  if (finished) {
    const earned = starsForGrammar(mistakes);
    return <GameFinishScreen earned={earned} onPlayAgain={handlePlayAgain} />;
  }

  const grouped = new Map<Pos, WordTile[]>();
  for (const t of sentence.wordBank) {
    if (!grouped.has(t.pos)) grouped.set(t.pos, []);
    grouped.get(t.pos)!.push(t);
  }
  const sentenceStr = sentence.slots.map((s) => filled[s.id]?.word ?? '___').join(' ');

  return (
    <div className="flex flex-col items-center gap-5 max-w-xl mx-auto anim-fade-up">
      <GameProgressDots total={sentences.length} current={idx} />

      <div className="flex gap-3 flex-wrap justify-center">
        {sentence.slots.map((slot) => {
          const tile = filled[slot.id];
          const style = tile ? POS_STYLE[tile.pos] : null;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => tile && removeFromSlot(slot.id)}
              className={`flex flex-col items-center justify-center transition-all px-4 py-3 ${tile ? style!.light : 'bg-white'}`}
              style={{ minWidth: 96, minHeight: 68, borderRadius: T.radius.sm, border: `2px ${tile ? 'solid' : 'dashed'} ${tile ? 'transparent' : T.surface.line}` }}
            >
              <span className={`text-[9px] font-display font-black tracking-widest uppercase mb-1 ${tile ? style!.text : ''}`} style={!tile ? { color: T.ink.faint } : undefined}>{slot.label}</span>
              {tile ? <span className={`font-display font-black text-base ${style!.text}`}>{tile.word}</span> : <span className="text-xl font-black" style={{ color: T.surface.line }}>—</span>}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="px-5 py-2.5 text-sm font-semibold text-center anim-fade-up" style={{ borderRadius: T.radius.sm, border: '1px solid #F5B3AD', background: '#FDEDEC', color: '#B23930' }}>
          ⚠️ {error}
        </div>
      )}
      {showHint && !isPreReader && (
        <div className="px-5 py-2.5 text-sm font-semibold text-center" style={{ borderRadius: T.radius.sm, border: '1px solid #FFD53E', background: '#FFF7E0', color: '#96690A' }}>
          💡 e.g. <em>{sentence.example}</em>
        </div>
      )}

      <div className="w-full bg-white px-5 py-4" style={{ borderRadius: T.radius.md, boxShadow: T.shadow.card }}>
        <p className="text-[10px] font-display font-black tracking-widest text-center uppercase mb-3" style={{ color: T.ink.faint }}>🗂 Word Bank</p>
        <div className="grid grid-cols-2 gap-4">
          {Array.from(grouped.entries()).map(([pos, tiles]) => {
            const style = POS_STYLE[pos];
            return (
              <div key={pos}>
                {!isPreReader && <p className={`text-xs font-display font-bold mb-1.5 ${style.text}`}>{style.label}s</p>}
                <div className="flex gap-2 flex-wrap">
                  {tiles.map((tile) => {
                    const used = usedWords.has(tile.word);
                    return (
                      <button
                        key={tile.word}
                        type="button"
                        onClick={() => tapTile(tile)}
                        disabled={used || result !== null}
                        className={`px-3.5 py-2 text-sm font-display font-bold transition-all active:scale-95 ${used ? '' : `${style.bg} text-white shadow-sm hover:opacity-90`}`}
                        style={{ borderRadius: T.radius.sm, ...(used ? { background: T.surface.sunk, color: T.ink.faint } : {}) }}
                      >
                        {tile.word}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full px-6 py-4 text-center" style={{ borderRadius: T.radius.md, background: T.surface.sunk }}>
        <p className="font-display font-black text-xl" style={{ color: result === 'correct' ? '#1B7F41' : T.ink.strong }}>
          {result === 'correct' ? `🎉 ${sentenceStr}.` : sentenceStr === sentence.slots.map(() => '___').join(' ') ? (isPreReader ? '?' : 'Tap words to build your sentence…') : `${sentenceStr}.`}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        {result === null ? (
          <>
            <Button tone="primary" onClick={checkGrammar} disabled={!allFilled} icon={<CheckCircle2 size={18} />}>
              Check
            </Button>
            {!isPreReader && (
              <Button tone="quiet" onClick={() => setShowHint((h) => !h)} icon={<Lightbulb size={16} style={{ color: '#DB9A00' }} />}>
                Hint
              </Button>
            )}
          </>
        ) : (
          <Button tone="amber" onClick={nextSentence}>
            {idx + 1 >= sentences.length ? 'Finish' : 'Next →'}
          </Button>
        )}
      </div>
    </div>
  );
};
