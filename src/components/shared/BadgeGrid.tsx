import React, { useEffect, useState } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { api } from '../../lib/api';

type Accent = 'amber' | 'indigo' | 'sky';
type Variant = 'grid' | 'medallion'; // medallion = Batch 1 large circles

const ACCENT = {
  amber:  { pill: 'bg-amber-100 text-amber-700',  ring: 'ring-amber-400',   fill: 'bg-amber-400',   text: 'text-amber-600',  btn: 'bg-amber-500 hover:bg-amber-600' },
  indigo: { pill: 'bg-indigo-100 text-indigo-700', ring: 'ring-indigo-500',  fill: 'bg-indigo-500',  text: 'text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  sky:    { pill: 'bg-sky-100 text-sky-700',       ring: 'ring-sky-500',     fill: 'bg-sky-500',     text: 'text-sky-600',    btn: 'bg-sky-500 hover:bg-sky-600' },
} as const;

interface BadgeEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earned_at?: string;
  progress?: number;    // 0–1 fraction
  progress_label?: string;
}

interface BadgeDetailModal {
  badge: BadgeEntry;
}

const BadgeDetail: React.FC<BadgeDetailModal & { onClose: () => void; accent: Accent }> = ({ badge, onClose, accent }) => {
  const a = ACCENT[accent];
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 anim-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`text-5xl w-20 h-20 flex items-center justify-center rounded-3xl ${badge.earned ? 'bg-gradient-to-br from-amber-100 to-yellow-50 shadow-inner' : 'bg-slate-100'}`}>
          {badge.icon}
        </div>
        <div className="text-center">
          <h3 className="font-display font-bold text-lg text-slate-800">{badge.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
          {badge.earned && badge.earned_at && (
            <p className={`text-[11px] font-bold mt-2 ${a.text}`}>
              🏅 Earned {new Date(badge.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          {!badge.earned && badge.progress !== undefined && (
            <div className="mt-3 w-full">
              <div className="progress-bar h-2">
                <div className={`progress-fill ${a.fill}`} style={{ width: `${badge.progress * 100}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1">{badge.progress_label}</p>
            </div>
          )}
        </div>
        <button onClick={onClose} className={`w-full py-3 rounded-xl text-white text-xs font-bold transition-all cursor-pointer ${a.btn}`}>
          Close
        </button>
      </div>
    </div>
  );
};

export const BadgeGrid: React.FC<{ accent: Accent; variant?: Variant }> = ({ accent, variant = 'grid' }) => {
  const a = ACCENT[accent];
  const [badges, setBadges] = useState<BadgeEntry[] | null>(null);
  const [selected, setSelected] = useState<BadgeEntry | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'earned' | 'progress'>('all');
  const isMedallion = variant === 'medallion';

  useEffect(() => {
    api.get<BadgeEntry[]>('/student/badges')
      .then(setBadges)
      .catch(() => setBadges([]));
  }, []);

  const filtered = (badges ?? []).filter(b => {
    if (activeFilter === 'earned') return b.earned;
    if (activeFilter === 'progress') return !b.earned;
    return true;
  });

  if (badges === null) {
    return <div className="flex justify-center py-12"><Loader2 className={`animate-spin ${a.text}`} /></div>;
  }

  return (
    <div className="flex flex-col gap-5 anim-fade-up">
      {/* Filter pills (grid variant only) */}
      {!isMedallion && (
        <div className="flex gap-2">
          {(['all', 'earned', 'progress'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer capitalize ${activeFilter === f ? a.btn + ' text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {f === 'progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">No badges here yet — keep going! 🚀</div>
      )}

      <div className={`grid gap-4 ${isMedallion ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
        {filtered.map(badge => (
          <button
            key={badge.id}
            onClick={() => setSelected(badge)}
            className={`flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all cursor-pointer text-center group
              ${badge.earned
                ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-80'
              } ${isMedallion ? 'p-6' : ''}`}
          >
            {/* Badge icon with progress ring */}
            <div className="relative">
              {/* SVG ring for progress */}
              {!badge.earned && badge.progress !== undefined && (
                <svg className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)]" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="23" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="26" cy="26" r="23" fill="none"
                    stroke={accent === 'amber' ? '#f59e0b' : accent === 'indigo' ? '#6366f1' : '#0ea5e9'}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${(badge.progress ?? 0) * 144.5} 144.5`}
                    transform="rotate(-90 26 26)"
                  />
                </svg>
              )}
              <div className={`${isMedallion ? 'w-16 h-16 text-4xl' : 'w-12 h-12 text-2xl'} rounded-2xl flex items-center justify-center 
                ${badge.earned ? 'bg-gradient-to-br from-amber-50 to-yellow-50 shadow-inner ring-2 ' + a.ring : 'bg-slate-100'}`}
              >
                <span className={badge.earned ? '' : 'grayscale'}>{badge.icon}</span>
              </div>
              {badge.earned && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px]">✓</span>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              <span className={`font-display font-bold ${isMedallion ? 'text-sm' : 'text-xs'} text-slate-800 leading-tight`}>{badge.name}</span>
              {!isMedallion && badge.earned && badge.earned_at && (
                <span className="text-[9px] text-slate-400 font-medium">
                  {new Date(badge.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
              {!isMedallion && !badge.earned && badge.progress_label && (
                <span className={`text-[9px] font-bold ${a.text}`}>{badge.progress_label}</span>
              )}
              {isMedallion && !badge.earned && badge.progress_label && (
                <span className={`text-[10px] font-bold ${a.text}`}>{badge.progress_label}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Earned count chip */}
      {badges.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Trophy size={13} className={a.text} />
          <span>{badges.filter(b => b.earned).length} of {badges.length} badges earned</span>
        </div>
      )}

      {selected && <BadgeDetail badge={selected} accent={accent} onClose={() => setSelected(null)} />}
    </div>
  );
};
