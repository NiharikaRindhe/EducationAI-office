import { supabaseAdmin } from './supabase.js';

/**
 * Runtime-editable platform config (model per AI tier, AI feature
 * kill-switches), backed by the `platform_settings` key/value table.
 * A fresh install has no rows, so every read falls back to the env-var
 * defaults already in `env.ts` / `ai.ts` — this is additive, not a
 * replacement wiring path.
 *
 * Cached with a short TTL: this is read on every AI call, and a school
 * lab doesn't need model switches to apply faster than a few seconds.
 */
const CACHE_TTL_MS = 30_000;
let cache: Map<string, unknown> | null = null;
let cachedAt = 0;

async function loadSettings(): Promise<Map<string, unknown>> {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_TTL_MS) return cache;

  const { data, error } = await supabaseAdmin.from('platform_settings').select('key, value');
  const map = new Map<string, unknown>();
  if (!error && data) {
    for (const row of data) map.set(row.key, row.value);
  }
  cache = map;
  cachedAt = now;
  return map;
}

/** Invalidate the cache immediately after a write, so the console reflects its own change. */
export function invalidatePlatformSettingsCache() {
  cache = null;
}

export async function getPlatformSetting<T>(key: string): Promise<T | undefined> {
  const settings = await loadSettings();
  return settings.get(key) as T | undefined;
}

export async function getAllPlatformSettings(): Promise<Record<string, unknown>> {
  const settings = await loadSettings();
  return Object.fromEntries(settings);
}

export async function setPlatformSetting(key: string, value: unknown, updatedBy: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('platform_settings')
    .upsert({ key, value, updated_by: updatedBy, updated_at: new Date().toISOString() });
  if (error) throw error;
  invalidatePlatformSettingsCache();
}

/** Model-tier override keys, e.g. "ai_model:chat" -> "google/gemini-2.5-flash". */
export function modelSettingKey(tier: string): string {
  return `ai_model:${tier}`;
}

/** Feature kill-switch keys, e.g. "ai_enabled:qgen" -> false. Defaults to enabled when unset. */
export function featureSettingKey(tier: string): string {
  return `ai_enabled:${tier}`;
}
