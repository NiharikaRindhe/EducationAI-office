import React, { useEffect, useState } from 'react';
import { Loader2, Zap, Flame, Award, BookOpen, FileText, Star } from 'lucide-react';
import { api } from '../../lib/api';

type Accent = 'amber' | 'indigo' | 'sky';

const ACCENT = {
  amber:  { fill: 'bg-amber-500',   text: 'text-amber-600',  soft: 'bg-amber-50 border-amber-200',  btn: 'bg-amber-500 hover:bg-amber-600',  ring: 'ring-amber-400' },
  indigo: { fill: 'bg-indigo-600',  text: 'text-indigo-600', soft: 'bg-indigo-50 border-indigo-200', btn: 'bg-indigo-600 hover:bg-indigo-700', ring: 'ring-indigo-400' },
  sky:    { fill: 'bg-sky-500',     text: 'text-sky-600',    soft: 'bg-sky-50 border-sky-200',       btn: 'bg-sky-500 hover:bg-sky-600',       ring: 'ring-sky-400' },
} as const;

const AVATARS = ['🦊', '🦁', '🐯', '🦋', '🐼', '🦖', '🦄', '🐸', '🐧', '🦅', '🐺', '🦝'];

interface ProfileData {
  id: string;
  full_name: string;
  class_num: number;
  section: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  longest_streak: number;
  badges_earned: number;
  tasks_completed: number;
  exams_taken: number;
  exam_history?: ExamHistoryEntry[];
}

interface ExamHistoryEntry {
  id: string;
  title: string;
  subject: string;
  score_pct: number;
  submitted_at: string;
  is_reviewed: boolean;
}

export const ProfileCard: React.FC<{
  accent: Accent;
  pinMode?: boolean;       // Batch 1 — no password mention, PIN kids
  showExamHistory?: boolean; // Batch 3
}> = ({ accent, pinMode = false, showExamHistory = false }) => {
  const a = ACCENT[accent];
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarPicker, setAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    api.get<ProfileData>('/student/profile').then(setProfile).catch(() => null);
  }, []);

  const handleAvatarSelect = async (emoji: string) => {
    if (!profile) return;
    setSaving(true);
    try {
      await api.patch('/student/profile/avatar', { avatar: emoji });
      setProfile(p => p ? { ...p, avatar: emoji } : p);
      setAvatarPicker(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch { /* silent */ } finally { setSaving(false); }
  };

  if (!profile) {
    return <div className="flex justify-center py-16"><Loader2 className={`animate-spin ${a.text}`} /></div>;
  }

  const statCards = [
    { icon: <Zap size={15} />, label: 'XP', value: profile.xp.toLocaleString() },
    { icon: <Flame size={15} />, label: 'Streak', value: `${profile.streak}d` },
    { icon: <Award size={15} />, label: 'Badges', value: profile.badges_earned },
    { icon: <BookOpen size={15} />, label: 'Tasks Done', value: profile.tasks_completed },
    { icon: <FileText size={15} />, label: 'Exams', value: profile.exams_taken },
    { icon: <Star size={15} />, label: 'Level', value: profile.level },
  ];

  return (
    <div className={`flex flex-col gap-5 anim-fade-up ${pinMode ? 'max-w-md mx-auto' : 'max-w-2xl mx-auto'}`}>
      {/* Profile hero */}
      <div className={`bento-card border p-6 flex flex-col items-center gap-4 ${a.soft}`}>
        {/* Avatar */}
        <button
          onClick={() => setAvatarPicker(true)}
          className={`relative w-20 h-20 rounded-3xl flex items-center justify-center text-5xl bg-white shadow-md ring-4 ${a.ring} ring-offset-2 cursor-pointer hover:scale-105 transition-transform`}
        >
          {profile.avatar || '🦊'}
          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full text-xs flex items-center justify-center shadow border border-slate-200">✏️</span>
        </button>

        <div className="text-center">
          <h2 className="font-display font-bold text-xl text-slate-800">{profile.full_name}</h2>
          <p className={`text-xs font-bold mt-0.5 ${a.text}`}>
            Class {profile.class_num}{profile.section && ` – ${profile.section}`} · Level {profile.level}
          </p>
          {savedMsg && <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Avatar updated!</p>}
        </div>

        {/* XP bar */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
            <span>Level {profile.level}</span>
            <span>{profile.xp % 1000} / 1000 XP</span>
          </div>
          <div className="progress-bar h-2">
            <div className={`progress-fill ${a.fill}`} style={{ width: `${(profile.xp % 1000) / 10}%` }} />
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className={`grid grid-cols-3 gap-3 ${pinMode ? 'grid-cols-3' : 'md:grid-cols-6'}`}>
        {(pinMode ? statCards.slice(0, 3) : statCards).map((s, i) => (
          <div key={i} className="bento-card border border-slate-100 bg-white p-3 flex flex-col items-center gap-1.5 text-center">
            <div className={a.text}>{s.icon}</div>
            <span className="font-display font-black text-lg text-slate-800">{s.value}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Credential note (non-PIN) */}
      {!pinMode && (
        <p className="text-[11px] text-slate-400 text-center font-medium">
          🔒 Forgot your password? Ask your teacher or lab in-charge to reset it.
        </p>
      )}

      {/* Exam history (Batch 3) */}
      {showExamHistory && profile.exam_history && profile.exam_history.length > 0 && (
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-3">
          <span className="font-display font-bold text-sm text-slate-800">My Exam History</span>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Subject</th>
                  <th className="pb-2 text-center">Score</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {profile.exam_history.map(e => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-700 max-w-[140px] truncate">{e.title}</td>
                    <td className="py-2.5 text-slate-400">{e.subject}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                        e.score_pct >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        e.score_pct >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>{Math.round(e.score_pct)}%</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${e.is_reviewed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {e.is_reviewed ? 'Reviewed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Avatar picker modal */}
      {avatarPicker && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAvatarPicker(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl anim-fade-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-sm text-slate-800 mb-4 text-center">Choose Your Avatar</h3>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => void handleAvatarSelect(emoji)}
                  disabled={saving}
                  className={`w-full aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all cursor-pointer
                    ${profile.avatar === emoji ? 'ring-2 ' + a.ring + ' bg-slate-50 scale-110' : 'hover:bg-slate-50 hover:scale-105'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {saving && <p className={`text-center text-xs font-bold mt-3 ${a.text}`}>Saving…</p>}
          </div>
        </div>
      )}
    </div>
  );
};
