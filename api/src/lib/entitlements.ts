import { supabaseAdmin } from './supabase.js';
import { logger } from './logger.js';

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

/**
 * How long a cache may keep being served after the database stopped
 * answering. Past this the data is too old to call an entitlement decision,
 * and FAILURE_MODE takes over.
 */
const MAX_STALE_MS = 5 * 60_000;

/**
 * What to do once entitlements are genuinely unknown — the database is
 * unreachable AND the cache is beyond MAX_STALE_MS.
 *
 *   'open'   — treat every feature as entitled. A database outage does not
 *              also become a feature outage for every school mid-lab-period.
 *              The cost is that paid features are briefly free.
 *   'closed' — refuse gated features. Revenue enforcement is never lost;
 *              the cost is that a database blip disables the AI tutor and
 *              labs for every school at once.
 *
 * This is a commercial decision, not a technical one, so it is configuration
 * rather than a value buried in a function. It defaults to 'open' because a
 * lab period with 40 children in it is the wrong place to discover the
 * entitlements table is unreachable — but a deployment that cares more about
 * billing integrity than availability can set ENTITLEMENTS_FAILURE_MODE=closed.
 */
const FAILURE_MODE: 'open' | 'closed' =
  process.env.ENTITLEMENTS_FAILURE_MODE === 'closed' ? 'closed' : 'open';

/** school_id -> set of enabled feature keys */
let cache: Map<string, Set<string>> | null = null;
let cachedAt = 0;
/** Schools already warned about, so a missing-entitlements log is not per-request. */
const warnedMissing = new Set<string>();

interface Entitlements {
  map: Map<string, Set<string>>;
  /** True when the answer is a guess rather than data — see FAILURE_MODE. */
  degraded: boolean;
}

async function loadEntitlements(forceRefresh = false): Promise<Entitlements> {
  const now = Date.now();
  if (!forceRefresh && cache && now - cachedAt < CACHE_TTL_MS) return { map: cache, degraded: false };

  const { data, error } = await supabaseAdmin
    .from('school_entitlements')
    .select('school_id, feature_key')
    .eq('enabled', true);

  if (error) {
    const staleFor = now - cachedAt;
    if (cache && staleFor < MAX_STALE_MS) {
      // Recent enough to still be trustworthy. Serve it, but say so — a
      // silent fallback here is how a broken entitlements query survives
      // unnoticed for a week.
      logger.warn(
        { err: error.message, staleForMs: staleFor },
        'Entitlements query failed; serving cached entitlements',
      );
      return { map: cache, degraded: false };
    }
    logger.error(
      { err: error.message, staleForMs: cache ? staleFor : null, failureMode: FAILURE_MODE },
      'Entitlements unavailable and cache too old — applying failure mode',
    );
    return { map: new Map(), degraded: true };
  }

  const map = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const key = row.school_id as string;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(row.feature_key as string);
  }
  cache = map;
  cachedAt = now;
  return { map, degraded: false };
}

/** Invalidate immediately after a write so the console reflects its own change. */
export function invalidateEntitlementsCache(): void {
  cache = null;
  cachedAt = 0;
  confirmedMissing.clear();
  warnedMissing.clear();
}

/** Schools confirmed to have no rows by a fresh read -> when that was confirmed. */
const confirmedMissing = new Map<string, number>();
const MISSING_RECHECK_MS = 5 * 60_000;

/**
 * The entitlement set for one school, or null if it genuinely has none.
 *
 * The subtlety: a school missing from the cached map means one of two very
 * different things — it truly has no rows (grandfathered), or the cache was
 * built BEFORE the school existed. Treating the second as the first hands a
 * newly onboarded school every paid feature for free until the cache expires.
 * So a miss forces one fresh read before concluding anything.
 *
 * Schools confirmed empty are remembered for a few minutes, otherwise every
 * request from a genuinely grandfathered school would re-query the database.
 */
async function entitlementsFor(schoolId: string): Promise<{ features: Set<string> | null; degraded: boolean }> {
  const first = await loadEntitlements();
  if (first.degraded) return { features: null, degraded: true };

  const hit = first.map.get(schoolId);
  if (hit) return { features: hit, degraded: false };

  const confirmedAt = confirmedMissing.get(schoolId);
  if (confirmedAt !== undefined && Date.now() - confirmedAt < MISSING_RECHECK_MS) {
    return { features: null, degraded: false };
  }

  const fresh = await loadEntitlements(true);
  if (fresh.degraded) return { features: null, degraded: true };

  const afterRefresh = fresh.map.get(schoolId);
  if (afterRefresh) return { features: afterRefresh, degraded: false };

  confirmedMissing.set(schoolId, Date.now());
  return { features: null, degraded: false };
}

/**
 * A school with NO entitlement rows is grandfathered into everything.
 *
 * That is correct for schools that predate the entitlements migration, but it
 * is indistinguishable from a school whose seeding FAILED during onboarding —
 * which would hand out every paid feature for free, permanently and silently.
 * So the answer stays "entitled", and the situation gets logged once per
 * school per process so it is findable instead of invisible.
 */
function grandfathered(schoolId: string): boolean {
  if (!warnedMissing.has(schoolId)) {
    warnedMissing.add(schoolId);
    logger.warn(
      { schoolId },
      'School has no entitlement rows — granting all features. Seed its package from the Super Admin console.',
    );
  }
  return true;
}

/**
 * Is this feature available to this school?
 *
 * A null schoolId means super_admin (no school) — always true; the Super
 * Admin is never gated by a customer's package.
 */
export async function isFeatureEnabled(schoolId: string | null, feature: FeatureKey): Promise<boolean> {
  if (!schoolId) return true;
  const { features, degraded } = await entitlementsFor(schoolId);
  if (degraded) return FAILURE_MODE === 'open';
  if (!features) return grandfathered(schoolId);
  return features.has(feature);
}

/** Every enabled feature for a school — used by the /me payload so the UI can hide nav. */
export async function getSchoolFeatures(schoolId: string | null): Promise<FeatureKey[]> {
  if (!schoolId) return [...FEATURE_KEYS];
  const { features, degraded } = await entitlementsFor(schoolId);
  if (degraded) return FAILURE_MODE === 'open' ? [...FEATURE_KEYS] : [];
  if (!features) return grandfathered(schoolId) ? [...FEATURE_KEYS] : [];
  return FEATURE_KEYS.filter((k) => features.has(k));
}

/**
 * Grant a school every feature.
 *
 * EduAI sells one plan with everything included, so a school gets the full
 * platform the moment it is registered. Rows are still written per feature
 * rather than relying on the grandfathered-empty path, so that a Super Admin
 * can later switch an individual feature off for one school without that
 * looking identical to a failed seed.
 */
export async function grantAllEntitlements(schoolId: string): Promise<void> {
  const rows = FEATURE_KEYS.map((key) => ({
    school_id: schoolId,
    feature_key: key,
    enabled: true,
  }));

  const { error } = await supabaseAdmin.from('school_entitlements').upsert(rows);
  if (error) throw error;
  invalidateEntitlementsCache();
}

/**
 * Seed a school's entitlements from a named package.
 *
 * Retained for the Super Admin console, which can still apply a preset or
 * hand-pick features for an individual school. New schools do NOT go through
 * here — see grantAllEntitlements.
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
