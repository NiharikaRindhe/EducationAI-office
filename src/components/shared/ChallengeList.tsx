import React, { useEffect, useState } from 'react';
import { Loader2, Zap, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import confetti from 'canvas-confetti';

type Accent = 'amber' | 'indigo' | 'sky';

const ACCENT = {
  amber:  { fill: 'bg-amber-500',   text: 'text-amber-600',  soft: 'bg-amber-50 border-amber-200',   bar: 'bg-amber-400',   btn: 'bg-amber-500 hover:bg-amber-600',   done: 'bg-amber-50 border-amber-200' },
  indigo: { fill: 'bg-indigo-600',  text: 'text-indigo-600', soft: 'bg-indigo-50 border-indigo-200',  bar: 'bg-indigo-500',  btn: 'bg-indigo-600 hover:bg-indigo-700',  done: 'bg-indigo-50 border-indigo-100' },
  sky:    { fill: 'bg-sky-500',     text: 'text-sky-600',    soft: 'bg-sky-50 border-sky-200',        bar: 'bg-sky-500',     btn: 'bg-sky-500 hover:bg-sky-600',        done: 'bg-sky-50 border-sky-100' },
} as const;

interface Challenge {
  id: string;
  title: string;
  description: string;
  metric_type: string;
  target: number;
  progress: number;
  xp_reward: number;
  completed: boolean;
  reward_granted: boolean;
}

export const ChallengeList: React.FC<{ accent: Accent; dense?: boolean }> = ({ accent, dense = false }) => {
  const a = ACCENT[accent];
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const load = () => {
    api.get<Challenge[]>('/student/daily-challenges').then(setChallenges).catch(() => setChallenges([]));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (challenges === null) {
    return <div className="flex justify-center py-12"><Loader2 className={`animate-spin ${a.text}`} /></div>;
  }

  const allDone = challenges.length > 0 && challenges.every(c => c.completed);
  const totalXp = challenges.reduce((s, c) => s + c.xp_reward, 0);
  const earnedXp = challenges.filter(c => c.reward_granted).reduce((s, c) => s + c.xp_reward, 0);

  const handleClick = async (ch: Challenge) => {
    if (ch.completed && !ch.reward_granted) {
      try {
        const updated = await api.get<Challenge[]>('/student/daily-challenges');
        setChallenges(updated);
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        showToast(`+${ch.xp_reward} XP unlocked! 🎉`);
      } catch { /* silent */ }
    }
  };

  return (
    <div className="flex flex-col gap-4 anim-fade-up relative">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-bold ${a.fill} anim-fade-up`}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-800">Today's Challenges</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Resets at midnight · {earnedXp}/{totalXp} XP earned</p>
        </div>
        <div className={`text-xs font-bold px-3 py-1 rounded-full ${a.soft}`}>
          {challenges.filter(c => c.completed).length}/{challenges.length} done
        </div>
      </div>

      {allDone ? (
        <div className={`rounded-3xl border p-8 text-center flex flex-col items-center gap-3 ${a.soft}`}>
          <span className="text-5xl">🎉</span>
          <h3 className="font-display font-bold text-base text-slate-800">All done for today!</h3>
          <p className="text-xs text-slate-400">Come back tomorrow for new challenges.</p>
        </div>
      ) : (
        <div className={`flex flex-col gap-3`}>
          {challenges.map(ch => (
            <div
              key={ch.id}
              onClick={() => void handleClick(ch)}
              className={`rounded-2xl border p-4 flex gap-4 items-start transition-all
                ${ch.completed ? a.done + ' opacity-80' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'}
                ${!ch.completed ? 'cursor-default' : ch.reward_granted ? '' : 'cursor-pointer'}`}
            >
              <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
                ${ch.completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {ch.completed ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`font-display font-bold text-xs ${ch.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {ch.title}
                  </h4>
                  <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${a.soft} ${a.text}`}>
                    <Zap size={9} />{ch.xp_reward} XP
                  </span>
                </div>
                {!dense && <p className="text-[10px] text-slate-400 mt-0.5">{ch.description}</p>}
                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 progress-bar h-1.5">
                    <div
                      className={`progress-fill transition-all ${ch.completed ? 'bg-emerald-500' : a.bar}`}
                      style={{ width: `${Math.min(100, Math.round((ch.progress / ch.target) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 shrink-0">
                    {ch.progress}/{ch.target}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
