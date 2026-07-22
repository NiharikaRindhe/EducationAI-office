import React, { useEffect, useState } from 'react';
import { Loader2, ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface ClassFeature {
  class_num: number;
  ai_chat_enabled: boolean;
  leaderboard_enabled: boolean;
}

export const SchoolAdminFeatureToggles: React.FC = () => {
  const [features, setFeatures] = useState<ClassFeature[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    api.get<ClassFeature[]>('/school-admin/features')
      .then(setFeatures)
      .catch(() => setFeatures([]));
  }, []);

  const handleToggle = async (classNum: number, field: 'ai_chat_enabled' | 'leaderboard_enabled', currentVal: boolean) => {
    if (!features) return;
    
    // Optimistic update
    setFeatures(prev => prev ? prev.map(f => f.class_num === classNum ? { ...f, [field]: !currentVal } : f) : prev);

    try {
      await api.patch('/school-admin/features', {
        classNum,
        feature: field === 'ai_chat_enabled' ? 'ai_chat' : 'leaderboard',
        enabled: !currentVal
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch {
      // Revert on error
      setFeatures(prev => prev ? prev.map(f => f.class_num === classNum ? { ...f, [field]: currentVal } : f) : prev);
    }
  };

  if (features === null) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-rose-400" size={32} /></div>;
  }

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up text-left">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-extrabold text-xl text-slate-800">Class Feature Toggles</h2>
          {savedMsg && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle size={14} /> Changes saved successfully!
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Enable or disable specific features per class level across your school.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: AI Chat Tutor */}
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-800">AI Chat Tutor</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Students can consult the RAG chatbot grounded in whitelisted class subjects.</p>
          </div>

          <div className="flex flex-col gap-2">
            {features.map(f => (
              <div key={f.class_num} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Class {f.class_num}</span>
                <button
                  onClick={() => handleToggle(f.class_num, 'ai_chat_enabled', f.ai_chat_enabled)}
                  className={`cursor-pointer transition-all ${f.ai_chat_enabled ? 'text-rose-500' : 'text-slate-300'}`}
                >
                  {f.ai_chat_enabled ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Leaderboards */}
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-800">Leaderboard Center</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Displays weekly/monthly XP lists to encourage friendly competition.</p>
          </div>

          <div className="flex flex-col gap-2">
            {features.map(f => (
              <div key={f.class_num} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Class {f.class_num}</span>
                <button
                  onClick={() => handleToggle(f.class_num, 'leaderboard_enabled', f.leaderboard_enabled)}
                  className={`cursor-pointer transition-all ${f.leaderboard_enabled ? 'text-rose-500' : 'text-slate-300'}`}
                >
                  {f.leaderboard_enabled ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
