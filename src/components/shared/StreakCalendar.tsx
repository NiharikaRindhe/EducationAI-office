import React, { useEffect, useState } from 'react';
import { Loader2, Flame, Calendar } from 'lucide-react';
import { api } from '../../lib/api';

type Accent = 'amber' | 'indigo' | 'sky';
type Variant = 'calendar' | 'trail'; // trail = Batch 1 stepping-stone path

const ACCENT = {
  amber:  { fill: 'bg-amber-400',   soft: 'bg-amber-50 border-amber-200',  text: 'text-amber-600',  dot: 'bg-amber-400',   today: 'ring-amber-500' },
  indigo: { fill: 'bg-indigo-500',  soft: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-600', dot: 'bg-indigo-500',  today: 'ring-indigo-500' },
  sky:    { fill: 'bg-sky-500',     soft: 'bg-sky-50 border-sky-200',       text: 'text-sky-600',    dot: 'bg-sky-500',     today: 'ring-sky-500' },
} as const;

interface StreakDay {
  date: string;     // ISO date e.g. "2026-07-01"
  active: boolean;
  xp?: number;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  days: StreakDay[];
}

/* ── Calendar variant (Batch 2 & 3) ─────────────────────────── */
const CalendarView: React.FC<{ data: StreakData; accent: Accent; showPercent?: boolean }> = ({ data, accent, showPercent }) => {
  const a = ACCENT[accent];

  // Group days into weeks for a calendar grid
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon-start
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayMap = new Map(data.days.map(d => [d.date, d]));

  const activeDaysThisMonth = data.days.filter(d => {
    const date = new Date(d.date);
    return d.active && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${a.soft}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Current Streak</span>
          <span className={`font-display font-black text-2xl ${a.text}`}>🔥 {data.current_streak}</span>
          <span className="text-[10px] text-slate-400">lab days in a row</span>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Best Ever</span>
          <span className="font-display font-black text-2xl text-slate-800">⚡ {data.longest_streak}</span>
          <span className="text-[10px] text-slate-400">longest streak</span>
        </div>
        {showPercent && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">This Month</span>
            <span className="font-display font-black text-2xl text-slate-800">
              {daysInMonth > 0 ? Math.round((activeDaysThisMonth / daysInMonth) * 100) : 0}%
            </span>
            <span className="text-[10px] text-slate-400">days active</span>
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
            <Calendar size={15} className={a.text} />
            {today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.soft}`}>{activeDaysThisMonth} active days</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[9px] font-black text-slate-300">{d}</span>
          ))}
          {/* Leading empty cells */}
          {Array.from({ length: startOffset }, (_, i) => <div key={`e${i}`} />)}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayData = dayMap.get(iso);
            const isToday = d === today.getDate();
            const isActive = dayData?.active ?? false;

            return (
              <div
                key={d}
                title={dayData?.xp ? `+${dayData.xp} XP` : undefined}
                className={`h-9 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all
                  ${isActive ? `${a.fill} text-white shadow-sm` : 'bg-slate-50 text-slate-300'}
                  ${isToday ? `ring-2 ${a.today} ring-offset-1` : ''}`}
              >
                {d}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-400 font-medium">
          💡 Your streak survives normal gaps between lab days — we know you don't come every single day.
        </p>
      </div>
    </div>
  );
};

/* ── Trail variant (Batch 1) ─────────────────────────────────── */
const TrailView: React.FC<{ data: StreakData; accent: Accent }> = ({ data, accent }) => {
  const a = ACCENT[accent];
  const recentDays = data.days.slice(-14); // last 14 lab days as stepping stones

  return (
    <div className="flex flex-col gap-5 anim-fade-up">
      {/* Big streak card */}
      <div className={`rounded-3xl border p-7 text-center flex flex-col items-center gap-2 ${a.soft}`}>
        <span className="text-6xl">🔥</span>
        <h2 className={`font-display font-black text-3xl ${a.text}`}>{data.current_streak} lab days in a row!</h2>
        <p className="text-sm text-slate-500 font-medium">Best ever: ⚡ {data.longest_streak} days</p>
        <p className="text-xs text-slate-400 mt-1">Come to the lab to keep your fire going!</p>
      </div>

      {/* Stepping stone trail */}
      <div className="bento-card border border-slate-100 bg-white p-5">
        <span className="font-display font-bold text-sm text-slate-700 block mb-4">Your Journey 🏃</span>
        <div className="flex flex-wrap gap-3 items-end justify-start">
          {recentDays.map((day, i) => {
            const isToday = i === recentDays.length - 1;
            const date = new Date(day.date);
            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm transition-all
                    ${day.active ? `${a.fill} text-white shadow-md ${isToday ? 'animate-pulse scale-110' : ''}` : 'bg-slate-100 text-slate-300'}
                  `}
                >
                  {day.active ? '🔥' : date.getDate()}
                </div>
                <span className="text-[9px] font-bold text-slate-400">
                  {date.toLocaleDateString('en-IN', { weekday: 'short' }).charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const StreakCalendar: React.FC<{ accent: Accent; variant?: Variant; showPercent?: boolean }> = ({
  accent,
  variant = 'calendar',
  showPercent = false,
}) => {
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    api.get<StreakData>('/student/streak-calendar')
      .then(setData)
      .catch(() => setData({ current_streak: 0, longest_streak: 0, days: [] }));
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className={`animate-spin ${ACCENT[accent].text}`} />
      </div>
    );
  }

  if (variant === 'trail') return <TrailView data={data} accent={accent} />;
  return <CalendarView data={data} accent={accent} showPercent={showPercent} />;
};
