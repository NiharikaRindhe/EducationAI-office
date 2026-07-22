import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { AI_TIERS, type UpdateAiSettingsInput, type UsageQuery } from '../schemas/aiConsole.schema.js';
import {
  getAllPlatformSettings,
  setPlatformSetting,
  modelSettingKey,
  featureSettingKey,
} from '../lib/platformSettings.js';
import { env } from '../lib/env.js';

function envDefaultForTier(tier: (typeof AI_TIERS)[number]): string {
  switch (tier) {
    case 'grading':
      return env.aiGradingModel;
    case 'qgen':
      return env.aiQgenModel;
    case 'vision':
      return env.aiVisionModel;
    default:
      return env.aiChatModel;
  }
}

export async function getAiSettings() {
  const settings = await getAllPlatformSettings();
  return {
    cloudConfigured: Boolean(env.cloudAiApiKey && env.cloudAiBaseUrl),
    tiers: AI_TIERS.map((tier) => ({
      tier,
      envDefault: envDefaultForTier(tier),
      modelOverride: (settings[modelSettingKey(tier)] as string | undefined) ?? null,
      effectiveModel: (settings[modelSettingKey(tier)] as string | undefined) || envDefaultForTier(tier),
      enabled: settings[featureSettingKey(tier)] !== false,
    })),
  };
}

export async function updateAiSettings(input: UpdateAiSettingsInput, updatedBy: string) {
  const writes: Promise<void>[] = [];

  if (input.models) {
    for (const [tier, model] of Object.entries(input.models)) {
      writes.push(setPlatformSetting(modelSettingKey(tier), model, updatedBy));
    }
  }
  if (input.enabled) {
    for (const [tier, enabled] of Object.entries(input.enabled)) {
      writes.push(setPlatformSetting(featureSettingKey(tier), enabled, updatedBy));
    }
  }

  if (writes.length === 0) throw new ApiError('VALIDATION_ERROR', 'No settings provided to update');
  await Promise.all(writes);
  return getAiSettings();
}

interface UsageRow {
  school_id: string | null;
  tier: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  created_at: string;
}

export async function getAiUsage(query: UsageQuery) {
  const since = new Date(Date.now() - query.days * 24 * 60 * 60_000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('ai_usage_log')
    .select('school_id, tier, model, prompt_tokens, completion_tokens, created_at, schools(name, code)')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load AI usage', error.message);
  const rows = (data ?? []) as unknown as (UsageRow & { schools: { name: string; code: string } | null })[];

  const totals = rows.reduce(
    (acc, r) => {
      acc.calls += 1;
      acc.promptTokens += r.prompt_tokens;
      acc.completionTokens += r.completion_tokens;
      return acc;
    },
    { calls: 0, promptTokens: 0, completionTokens: 0 },
  );

  const groups = new Map<string, { key: string; label: string; calls: number; promptTokens: number; completionTokens: number }>();
  for (const r of rows) {
    let key: string;
    let label: string;
    if (query.groupBy === 'day') {
      key = r.created_at.slice(0, 10);
      label = key;
    } else if (query.groupBy === 'school') {
      key = r.school_id ?? 'none';
      label = r.schools?.name ?? 'Unattributed';
    } else {
      key = r.tier;
      label = r.tier;
    }

    const entry = groups.get(key) ?? { key, label, calls: 0, promptTokens: 0, completionTokens: 0 };
    entry.calls += 1;
    entry.promptTokens += r.prompt_tokens;
    entry.completionTokens += r.completion_tokens;
    groups.set(key, entry);
  }

  return {
    totals,
    series: Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key)),
  };
}
