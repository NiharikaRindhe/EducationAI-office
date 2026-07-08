import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Trophy } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type Accent = 'indigo' | 'sky';

const ACCENT = {
  indigo: { active: 'bg-indigo-600 text-white', soft: 'border-indigo-500 bg-indigo-50/40', banner: 'from-indigo-500 to-violet-500', spinner: 'text-indigo-400' },
  sky: { active: 'bg-sky-500 text-white', soft: 'border-sky-400 bg-sky-50/40', banner: 'from-sky-500 to-cyan-500', spinner: 'text-sky-400' },
} as const;

type Period = 'weekly' | 'monthly' | 'all_time';
type Basis = 'xp' | 'exam_avg';

interface Row {
  rank: number;
  rank_change: number;
  xp_score: number;
  exam_avg: number | null;
  student_id: string;
  student_profiles: { avatar: string; user_profiles: { full_name: string } | { full_name: string }[] } | null;
}

const nameOf = (r: Row): string => {
  const up = r.student_profiles?.user_profiles;
  if (!up) return 'Student';
  return Array.isArray(up) ? (up[0]?.full_name ?? 'Student') : up.full_name;
};

export const LeaderboardView: React.FC<{ accent: Accent }> = ({ accent }) => {
  const a = ACCENT[accent];
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('weekly');
  const [basis, setBasis] = useState<Basis>('xp');
  const [scopeClass, setScopeClass] = useState(true);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setRows(
        await api.get<Row[]>('/student/leaderboard', {
          period,
          basis,
          scope: scopeClass ? 'class' : undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load leaderboard');
    }
  }, [period, basis, scopeClass]);

  useEffect(() => { void load(); }, [load]);

  const myRow = rows?.find((r) => r.student_id === user?.id);
  const top3 = rows?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['weekly', 'monthly', 'all_time'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${period === p ? a.active : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {p === 'weekly' ? 'This Week' : p === 'monthly' ? 'This Month' : 'All Time'}
          </button>
        ))}
        <div className="w-[1px] h-5 bg-slate-200 mx-1" />
        {(['xp', 'exam_avg'] as const).map((b) => (
          <button key={b} onClick={() => setBasis(b)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${basis === b ? a.active : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {b === 'xp' ? 'By XP' : 'By Exam Average'}
          </button>
        ))}
        <div className="w-[1px] h-5 bg-slate-200 mx-1" />
        <button onClick={() => setScopeClass((v) => !v)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${scopeClass ? a.active : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
          {scopeClass ? 'My Class' : 'Whole Batch'}
        </button>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-16"><Loader2 className={`animate-spin ${a.spinner}`} /></div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center">
          <p className="text-sm text-slate-400">No rankings yet for this period — check back after some activity.</p>
        </div>
      ) : (
        <>
          {myRow && (
            <div className={`bg-gradient-to-r ${a.banner} rounded-3xl p-5 text-white flex justify-between items-center shadow-md`}>
              <div>
                <h3 className="font-display font-extrabold text-lg">Your Rank: #{myRow.rank}</h3>
                <p className="text-[11px] text-white/80 font-medium mt-0.5">
                  {basis === 'xp' ? `${myRow.xp_score} XP` : `${myRow.exam_avg?.toFixed(1) ?? 0}% exam average`}
                  {myRow.rank_change !== 0 && (
                    <span className="ml-2">{myRow.rank_change > 0 ? `▲ up ${myRow.rank_change}` : `▼ down ${Math.abs(myRow.rank_change)}`}</span>
                  )}
                </p>
              </div>
              <Trophy size={28} className="text-white/70" />
            </div>
          )}

          {top3.length >= 3 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 flex justify-around items-end h-56 shadow-xs">
              {[top3[1], top3[0], top3[2]].map((r, i) => {
                const height = i === 1 ? 'h-32' : i === 0 ? 'h-20' : 'h-14';
                const place = i === 1 ? '1st' : i === 0 ? '2nd' : '3rd';
                return (
                  <div key={r.student_id} className="flex flex-col items-center gap-2">
                    {i === 1 && <span className="text-lg">👑</span>}
                    <span className="text-2xl">{r.student_profiles?.avatar ?? '🙂'}</span>
                    <span className="text-xs font-bold text-slate-600 max-w-20 truncate">{nameOf(r)}</span>
                    <div className={`w-20 ${height} rounded-t-xl flex items-center justify-center font-display font-black text-lg ${i === 1 ? 'bg-amber-500/10 border-t-2 border-amber-500 text-amber-600' : 'bg-slate-100 text-slate-400 border-t border-slate-200'}`}>
                      {place}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-3xl p-5">
            <div className="flex flex-col gap-2">
              {rows.map((r) => (
                <div key={r.student_id}
                  className={`p-3.5 px-4 rounded-2xl flex items-center justify-between border ${r.student_id === user?.id ? `${a.soft} font-bold shadow-xs` : 'border-slate-50 bg-slate-50/30'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-black text-slate-400 w-6 text-center">#{r.rank}</span>
                    <span className="text-xl">{r.student_profiles?.avatar ?? '🙂'}</span>
                    <span className="text-slate-800 font-semibold text-xs">{nameOf(r)}{r.student_id === user?.id ? ' (You)' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px]">
                    <span>{basis === 'xp' ? `${r.xp_score} XP` : `${r.exam_avg?.toFixed(1) ?? 0}%`}</span>
                    {r.rank_change !== 0 && (
                      <span className={r.rank_change > 0 ? 'text-emerald-500' : 'text-red-500'}>
                        {r.rank_change > 0 ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
