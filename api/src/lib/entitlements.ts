import { supabaseAdmin } from './supabase.js';

/**
 * Per-school feature entitlements — what a school actually bought.
 *
 * Read on effectively every gated request, so it is cached with a short
 * TTL exactly like platformSettings. A Super Admin toggling a school's
 * package does not need to take effect faster than a few seconds, and a
 * DB round-trip per request during a lab period is the one cost this
 * layer must not add.
 *
 * The whole map is loaded in one query rather than per-school: the
 * platform has tens of schools, not thousands, and one small query
 * refreshed every 30s is cheaper than N cache entries each with their
 * own miss. Revisit if school count reaches the thousands.
 */
export const FEATURE_KEYS = [
  'ai_tutor',
  'ai_exam_generator',
  'virtual_labs',
  'games',
  'leaderboard',
  'pyq_hub',
  'reports_analytics',
  'school_content_upload',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

const CACHE_TTL_MS = 30_000;
/** school_id -> set of enabled feature keys */
let cache: Map<string, Set<string>> | null = null;
let cachedAt = 0;

async function loadEntitlements(): Promise<Map<string, Set<string>>> {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_TTL_MS) return cache;

  const { data, error } = await supabaseAdmin
    .from('school_entitlements')
    .select('school_id, feature_key')
    .eq('enabled', true);

  const map = new Map<string, Set<string>>();
  if (error) {
    // Fail OPEN on a transient DB error rather than locking every school
    // out of every paid feature at once. A stale cache is served if we
    // have one; otherwise the caller sees "entitled" and the request
    // proceeds. Losing revenue enforcement for 30s beats a platform-wide
    // outage triggered by one failed query.
    return cache ?? new Map();
  }
  for (const row of data ?? []) {
    const key = row.school_id as string;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(row.feature_key as string);
  }
  cache = map;
  cachedAt = now;
  return map;
}

/** Invalidate immediately after a write so the console reflects its own change. */
export function invalidateEntitlementsCache(): void {
  cache = null;
}

/**
 * Is this feature available to this school?
 *
 * A null schoolId means super_admin (no school) — always true; the Super
 * Admin is never gated by a customer's package.
 *
 * A school with NO rows at all is treated as fully entitled. That is the
 * safe reading: every existing school is grandfathered by the migration,
 * and a school created before entitlement seeding existed must not
 * silently lose features.
 */
export async function isFeatureEnabled(schoolId: string | null, feature: FeatureKey): Promise<boolean> {
  if (!schoolId) return true;
  const all = await loadEntitlements();
  const forSchool = all.get(schoolId);
  if (!forSchool) return true;
  return forSchool.has(feature);
}

/** Every enabled feature for a school — used by the /me payload so the UI can hide nav. */
export async function getSchoolFeatures(schoolId: string | null): Promise<FeatureKey[]> {
  if (!schoolId) return [...FEATURE_KEYS];
  const all = await loadEntitlements();
  const forSchool = all.get(schoolId);
  if (!forSchool) return [...FEATURE_KEYS];
  return FEATURE_KEYS.filter((k) => forSchool.has(k));
}

/**
 * Seed a newly created school's entitlements from its package.
 * `custom` grants nothing by default and is driven by later edits.
 */
export async function seedEntitlementsFromPackage(schoolId: string, packageKey: string): Promise<void> {
  const { data: pkgFeatures, error } = await supabaseAdmin
    .from('package_features')
    .select('feature_key')
    .eq('package_key', packageKey);

  if (error) throw error;

  const granted = new Set((pkgFeatures ?? []).map((r) => r.feature_key as string));
  const rows = FEATURE_KEYS.map((key) => ({
    school_id: schoolId,
    feature_key: key,
    enabled: granted.has(key),
  }));

  const { error: insertError } = await supabaseAdmin.from('school_entitlements').upsert(rows);
  if (insertError) throw insertError;
  invalidateEntitlementsCache();
}
