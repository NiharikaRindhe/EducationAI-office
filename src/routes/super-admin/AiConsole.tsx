import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Save, Power } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

type Tier = 'chat' | 'grading' | 'qgen' | 'vision';

interface TierSetting {
  tier: Tier;
  envDefault: string;
  modelOverride: string | null;
  effectiveModel: string;
  enabled: boolean;
}

interface AiSettings {
  cloudConfigured: boolean;
  tiers: TierSetting[];
}

interface UsageSeriesPoint {
  key: string;
  label: string;
  calls: number;
  promptTokens: number;
  completionTokens: number;
}

interface AiUsage {
  totals: { calls: number; promptTokens: number; completionTokens: number };
  series: UsageSeriesPoint[];
}

const TIER_LABELS: Record<Tier, string> = {
  chat: 'Tutor Chat',
  grading: 'Exam Grading',
  qgen: 'Question Generation',
  vision: 'Vision (photo doubts)',
};

export const SuperAdminAiConsole: React.FC = () => {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [groupBy, setGroupBy] = useState<'day' | 'school' | 'tier'>('day');
  const [modelDrafts, setModelDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [savingTier, setSavingTier] = useState<Tier | null>(null);

  const loadSettings = () =>
    api
      .get<AiSettings>('/super-admin/ai/settings')
      .then((s) => {
        setSettings(s);
        setModelDrafts(Object.fromEntries(s.tiers.map((t) => [t.tier, t.modelOverride ?? ''])));
      })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Failed to load AI settings'));

  const loadUsage = (gb: typeof groupBy) =>
    api
      .get<AiUsage>('/super-admin/ai/usage', { groupBy: gb, days: 30 })
      .then(setUsage)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Failed to load AI usage'));

  useEffect(() => { void loadSettings(); }, []);
  useEffect(() => { void loadUsage(groupBy); }, [groupBy]);

  const handleSaveModel = async (tier: Tier) => {
    setSavingTier(tier);
    setError('');
    try {
      const updated = await api.patch<AiSettings>('/super-admin/ai/settings', { models: { [tier]: modelDrafts[tier] ?? '' } });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update model');
    } finally {
      setSavingTier(null);
    }
  };

  const handleToggleTier = async (tier: Tier, enabled: boolean) => {
    setSavingTier(tier);
    setError('');
    try {
      const updated = await api.patch<AiSettings>('/super-admin/ai/settings', { enabled: { [tier]: enabled } });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to toggle feature');
    } finally {
      setSavingTier(null);
    }
  };

  if (error && !settings) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
        <AlertCircle size={14} /> {error}
      </div>
    );
  }

  if (!settings) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  const maxCalls = Math.max(1, ...(usage?.series.map((s) => s.calls) ?? [1]));

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-lg text-slate-800">AI Models &amp; Feature Switches</h2>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${settings.cloudConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {settings.cloudConfigured ? 'Cloud provider configured' : 'Cloud provider not set — using local Ollama'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">Leave the model field blank to use the environment default. Changes apply within ~30 seconds.</p>

        <div className="flex flex-col gap-3">
          {settings.tiers.map((t) => (
            <div key={t.tier} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100">
              <button
                onClick={() => void handleToggleTier(t.tier, !t.enabled)}
                disabled={savingTier === t.tier}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-xl cursor-pointer transition-all disabled:opacity-50 ${
                  t.enabled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Power size={12} /> {t.enabled ? 'Enabled' : 'Disabled'}
              </button>

              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-slate-800 block">{TIER_LABELS[t.tier]}</span>
                <span className="text-[10px] text-slate-400">Env default: <span className="font-mono">{t.envDefault}</span></span>
              </div>

              <input
                value={modelDrafts[t.tier] ?? ''}
                onChange={(e) => setModelDrafts((prev) => ({ ...prev, [t.tier]: e.target.value }))}
                placeholder={t.envDefault}
                className="w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-slate-400"
              />
              <button
                onClick={() => void handleSaveModel(t.tier)}
                disabled={savingTier === t.tier}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {savingTier === t.tier ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-slate-800">Usage (last 30 days)</h2>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
            className="text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="day">By day</option>
            <option value="school">By school</option>
            <option value="tier">By feature</option>
          </select>
        </div>

        {usage && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-2xl p-4">
              <span className="font-display font-black text-xl text-slate-800 block">{usage.totals.calls.toLocaleString()}</span>
              <span className="text-[10px] font-label-caps text-slate-400">AI Calls</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <span className="font-display font-black text-xl text-slate-800 block">{usage.totals.promptTokens.toLocaleString()}</span>
              <span className="text-[10px] font-label-caps text-slate-400">Prompt Tokens</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <span className="font-display font-black text-xl text-slate-800 block">{usage.totals.completionTokens.toLocaleString()}</span>
              <span className="text-[10px] font-label-caps text-slate-400">Completion Tokens</span>
            </div>
          </div>
        )}

        {!usage || usage.series.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No AI usage logged yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {usage.series.map((s) => (
              <div key={s.key} className="flex items-center gap-3 text-xs">
                <span className="text-[10px] font-bold text-slate-400 w-28 shrink-0 truncate">{s.label}</span>
                <div className="flex-1 h-5 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700 rounded-full transition-all duration-700" style={{ width: `${(s.calls / maxCalls) * 100}%` }} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 w-16 text-right shrink-0">{s.calls} calls</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
