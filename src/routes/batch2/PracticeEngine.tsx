import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Lightbulb, Pencil, Sparkles, Star, X } from 'lucide-react';
import type { ChapterActivity, PracticeQuestion } from '../../data/activities';
import { varyRound } from '../../lib/practiceRound';

interface Props {
  activity: ChapterActivity;
  onFinish: (gameId: string, stars: number, score: number) => void;
  onClose: () => void;
}

function starsFor(correct: number, total: number): number {
  if (total === 0) return 0;
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
}

function acceptedMatch(given: string, answer: string, extra?: string[]): boolean {
  const pool = [answer, ...(extra ?? [])].map(norm);
  const g = norm(given);
  if (pool.includes(g)) return true;
  return pool.some((p) => p.length >= 3 && (g.includes(p) || p.includes(g)));
}

function isCorrect(q: PracticeQuestion, response: unknown): boolean {
  if (q.type === 'mcq') return response === q.correctIdx;
  return typeof response === 'string' && acceptedMatch(response, q.answer, q.accepted);
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const PracticeEngine: React.FC<Props> = ({ activity, onFinish, onClose }) => {
  const [questions, setQuestions] = useState(activity.questions);
  const [roundKind, setRoundKind] = useState<'chapter' | 'again'>('chapter');
  const [idx, setIdx] = useState(0);
  const [responses, setResponses] = useState<unknown[]>(() => activity.questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);

  function startRound(next: PracticeQuestion[], kind: 'chapter' | 'again') {
    setQuestions(next);
    setRoundKind(kind);
    setIdx(0);
    setResponses(next.map(() => null));
    setChecked(false);
    setDone(false);
  }

  const q = questions[idx];
  const correctCount = useMemo(
    () => questions.reduce((n, question, i) => n + (isCorrect(question, responses[i]) ? 1 : 0), 0),
    [questions, responses],
  );

  function setResponse(value: unknown) {
    if (checked) return;
    setResponses((prev) => prev.map((r, i) => (i === idx ? value : r)));
  }

  function handleCheck() {
    if (responses[idx] === null || responses[idx] === '' || responses[idx] === undefined) return;
    setChecked(true);
  }

  function handleNext() {
    if (idx + 1 >= questions.length) {
      const stars = starsFor(correctCount, questions.length);
      setDone(true);
      onFinish(activity.gameId, stars, correctCount);
      return;
    }
    setChecked(false);
    setIdx((i) => i + 1);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      if (checked) handleNext();
      else handleCheck();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [checked, idx, responses]);

  function handleTryAgain() {
    startRound(varyRound(activity.questions), 'again');
  }

  if (done) {
    const stars = starsFor(correctCount, questions.length);
    const headline = stars === 3 ? 'Chapter mastered' : stars === 2 ? 'Strong finish' : stars === 1 ? 'Good start — try again' : 'Keep practising';
    return (
      <div className="bento-card border border-indigo-100 bg-white p-8 flex flex-col items-center gap-4 text-center">
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <Star key={s} size={28} className={s <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          ))}
        </div>
        <h3 className="font-display font-extrabold text-xl text-slate-800">{headline}</h3>
        <p className="text-sm text-slate-500 max-w-md">
          You scored <span className="font-bold text-indigo-600">{correctCount}</span> of {questions.length} on{' '}
          <span className="font-semibold text-slate-700">{activity.name}</span>
          {roundKind === 'again' ? ' (new values)' : ''}.
        </p>
        <p className="text-[11px] text-slate-400">3 stars = 90% · 2 stars = 70% · 1 star = 50%</p>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleTryAgain}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold"
          >
            Back to chapters
          </button>
        </div>
      </div>
    );
  }

  const ok = checked && isCorrect(q, responses[idx]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
            Chapter {activity.chapterNum} · {activity.subject}
          </p>
          <h2 className="font-display font-extrabold text-lg text-slate-800">{activity.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {activity.chapterTitle}
            {roundKind === 'again' ? ' · New mix' : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-700">
          Close
        </button>
      </div>

      <div className="flex gap-1">
        {questions.map((item, i) => (
          <span
            key={i}
            title={`${item.type === 'mcq' ? 'MCQ' : 'Short'} ${i + 1}`}
            className={`h-1.5 flex-1 rounded-full ${
              i < idx ? 'bg-indigo-500' : i === idx ? 'bg-violet-400' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
        <span>
          Question {idx + 1} of {questions.length}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
          q.type === 'mcq' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-700'
        }`}>
          {q.type === 'mcq' ? <Sparkles size={11} /> : <Pencil size={11} />}
          {q.type === 'mcq' ? 'Choose one' : 'Write it'}
        </span>
      </div>

      <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
        {q.scene && (
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-amber-50 border border-indigo-100 px-4 py-3 text-[13px] leading-relaxed text-slate-700">
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1">Story clue</p>
            {q.scene}
          </div>
        )}

        <p className="font-display font-bold text-[15px] text-slate-800 leading-relaxed">{q.prompt}</p>
        <QuestionBody question={q} value={responses[idx]} disabled={checked} onChange={setResponse} />

        {checked && (
          <div
            className={`rounded-xl px-3 py-2.5 text-xs font-semibold flex items-start gap-2 ${
              ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {ok ? <Check size={14} className="mt-0.5 shrink-0" /> : <X size={14} className="mt-0.5 shrink-0" />}
            <span>
              <span className="font-black">{ok ? 'Yes!' : 'Not yet.'}</span> {feedback(q)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-400 hidden sm:block">Press Enter to {checked ? 'continue' : 'check'}</p>
          {!checked ? (
            <button
              type="button"
              onClick={handleCheck}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40"
              disabled={responses[idx] === null || responses[idx] === '' || responses[idx] === undefined}
            >
              Check
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold"
            >
              {idx + 1 >= questions.length ? 'Finish' : 'Next'} <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function feedback(q: PracticeQuestion): string {
  if (q.type === 'mcq') return q.explanation ?? `The answer is ${q.options[q.correctIdx]}.`;
  return q.rubric ?? `Expected: ${q.answer}`;
}

function QuestionBody({
  question,
  value,
  disabled,
  onChange,
}: {
  question: PracticeQuestion;
  value: unknown;
  disabled: boolean;
  onChange: (v: unknown) => void;
}) {
  if (question.type === 'mcq') {
    return (
      <div className="flex flex-col gap-2">
        {question.options.map((opt, i) => {
          const selected = value === i;
          const reveal = disabled;
          const right = i === question.correctIdx;
          const wrongPick = reveal && selected && !right;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(i)}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm font-medium flex items-start gap-3 transition-colors ${
                wrongPick
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : reveal && right
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : selected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 text-slate-700 hover:border-indigo-200'
              }`}
            >
              <span
                className={`mt-0.5 w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 ${
                  wrongPick
                    ? 'bg-rose-200 text-rose-800'
                    : reveal && right
                      ? 'bg-emerald-200 text-emerald-800'
                      : selected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                }`}
              >
                {LETTERS[i] ?? i + 1}
              </span>
              <span className="pt-0.5">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
        <Lightbulb size={11} /> Your answer
      </label>
      <input
        type="text"
        disabled={disabled}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a number, word, or short phrase"
        className="w-full rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}
