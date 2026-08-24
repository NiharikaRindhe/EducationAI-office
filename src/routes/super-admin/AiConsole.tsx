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

interface CapacityRow {
  inFlight: number;
  globalLimit: number;
  perSchoolLimit: number;
  perStudentLimit: number;
  leaseTtlSec: number;
  source: 'redis' | 'local';
}

type AiCapacity = Record<'chat' | 'vision', CapacityRow>;

/** First column's header depends on what the rows are grouped by. */
const GROUP_BY_HEADER: Record<'day' | 'month' | 'school' | 'tier', string> = {
  day: 'Date',
  month: 'Month',
  school: 'School',
  tier: 'Feature',
};

const TIER_LABELS: Record<Tier, string> = {
  chat: 'Tutor Chat',
  grading: 'Exam Grading',
  qgen: 'Question Generation',
  vision: 'Vision (photo doubts)',
};

export const SuperAdminAiConsole: React.FC = () => {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [capacity, setCapacity] = useState<AiCapacity | null>(null);
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'school' | 'tier'>('day');
  const [rangeDays, setRangeDays] = useState(30);
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

  const loadUsage = (gb: typeof groupBy, days: number) =>
    api
      .get<AiUsage>('/super-admin/ai/usage', { groupBy: gb, days })
      .then(setUsage)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Failed to load AI usage'));

  const loadCapacity = () =>
    api.get<AiCapacity>('/super-admin/ai/capacity').then(setCapacity).catch(() => { /* the panel just hides itself */ });

  useEffect(() => { void loadSettings(); }, []);
  useEffect(() => {
    void loadUsage(groupBy, rangeDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy, rangeDays]);

  // Concurrency changes second-to-second — historical usage doesn't, so it
  // gets its own light poll instead of sharing loadUsage's cadence.
  useEffect(() => {
    void loadCapacity();
    const id = window.setInterval(() => void loadCapacity(), 10000);
    return () => window.clearInterval(id);
  }, []);

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


  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* How hard the platform is hitting its own shared concurrency limits
          toward the upstream AI provider, right now (item #23, UI testing
          pass Aug 24 2026 — "API hitting"). Distinct from usage below, which
          is historical call counts. */}
      {capacity && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-800">Live AI capacity</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Requests in flight toward the AI provider right now, and the concurrency ceilings each one is checked against.
                These are request limits, not content-upload quotas.
              </p>
            </div>
            <span
              className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                capacity.chat.source === 'redis' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
              }`}
              title={
                capacity.chat.source === 'redis'
                  ? 'Counted in Redis — accurate across every API replica.'
                  : 'Redis unavailable — counted per API process, so this may undercount if several replicas are running.'
              }
            >
              {capacity.chat.source === 'redis' ? 'Fleet-wide (Redis)' : 'This process only'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['Feature', 'In flight now', 'Platform limit', 'Per school', 'Per student', 'Lease TTL', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['chat', 'vision'] as const).map((kind) => {
                  const c = capacity[kind];
                  const atLimit = c.inFlight >= c.globalLimit;
                  const busy = !atLimit && c.inFlight > 0;
                  return (
                    <tr key={kind} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-[13px] font-semibold text-slate-800 whitespace-nowrap">
                        {kind === 'chat' ? 'Tutor Chat' : 'Vision (photo doubts)'}
                      </td>
                      <td className={`px-4 py-3 text-[13px] font-semibold tabular-nums ${atLimit ? 'text-rose-600' : 'text-slate-800'}`}>
                        {c.inFlight}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 tabular-nums">{c.globalLimit}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 tabular-nums">{c.perSchoolLimit}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 tabular-nums">{c.perStudentLimit}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-500 tabular-nums whitespace-nowrap">{c.leaseTtlSec}s</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {atLimit ? (
                          <span className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-md bg-rose-50 text-rose-700">At capacity</span>
                        ) : busy ? (
                          <span className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-700">
                            {c.globalLimit - c.inFlight} free
                          </span>
                        ) : (
                          <span className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">Idle</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-800">AI usage</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Completed calls and token spend over the selected period.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500"
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 12 months</option>
            </select>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
              className="px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500"
            >
              <option value="day">By day</option>
              <option value="month">By month</option>
              <option value="school">By school</option>
              <option value="tier">By feature</option>
            </select>
          </div>
        </div>

        {usage && (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100">
            {([
              ['AI calls', usage.totals.calls],
              ['Prompt tokens', usage.totals.promptTokens],
              ['Completion tokens', usage.totals.completionTokens],
            ] as const).map(([label, value]) => (
              <div key={label} className="px-5 py-3.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
                <span className="block text-lg font-semibold text-slate-900 tabular-nums mt-0.5">{value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        {!usage || usage.series.length === 0 ? (
          <p className="text-[13px] text-slate-400 text-center py-12">No AI usage logged in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {[GROUP_BY_HEADER[groupBy], 'Calls', 'Prompt tokens', 'Completion tokens', 'Share of calls'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usage.series.map((s) => (
                  <tr key={s.key} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-medium text-slate-800 whitespace-nowrap">{s.label}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-800 tabular-nums">{s.calls.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 tabular-nums">{s.promptTokens.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 tabular-nums">{s.completionTokens.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-500 tabular-nums whitespace-nowrap">
                      {usage.totals.calls > 0 ? `${Math.round((s.calls / usage.totals.calls) * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
