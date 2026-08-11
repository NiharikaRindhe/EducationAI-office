import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window limiter backed by a SHARED counter in Postgres.
 *
 * It used to be an in-process Map, which meant every restart reset every
 * counter — an attacker being throttled only had to wait for a deploy — and
 * running two API replicas behind nginx silently doubled every limit.
 *
 * The database counter is authoritative. The in-memory map survives as a
 * FALLBACK for when the counter itself is unreachable: a limiter that cannot
 * reach its store must not lock a whole school out of logging in, but it also
 * must not simply wave everyone through. Degrading to per-process limiting
 * keeps real protection (an attacker still hits a ceiling) while a database
 * blip stays a database blip.
 */

/** Per-process fallback state, used only while the shared store is unreachable. */
const fallbackBuckets = new Map<string, Bucket>();

function consumeInMemory(key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const existing = fallbackBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    fallbackBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= max) return false;
  existing.count += 1;
  return true;
}

/**
 * Keeps the fallback map from growing without bound if the shared store stays
 * down for a long time. Only ever holds keys seen during an outage.
 */
function pruneFallback(): void {
  if (fallbackBuckets.size < 10_000) return;
  const now = Date.now();
  for (const [key, bucket] of fallbackBuckets) {
    if (bucket.resetAt <= now) fallbackBuckets.delete(key);
  }
}

export function rateLimit(opts: { windowMs: number; max: number; keyFn: (req: Request) => string }) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const key = opts.keyFn(req);

    try {
      const { data, error } = await supabaseAdmin.rpc('consume_rate_limit', {
        p_key: key,
        p_window_ms: opts.windowMs,
        p_max: opts.max,
      });
      if (error) throw new Error(error.message);

      // The function returns a single row: (allowed, current_count, reset_at).
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error('consume_rate_limit returned no row');

      if (!row.allowed) {
        return next(new ApiError('RATE_LIMITED', 'Too many attempts — try again in a minute'));
      }
      return next();
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err), key },
        'Shared rate-limit store unavailable — falling back to per-process limiting',
      );
      pruneFallback();
      if (!consumeInMemory(key, opts.windowMs, opts.max)) {
        return next(new ApiError('RATE_LIMITED', 'Too many attempts — try again in a minute'));
      }
      return next();
    }
  };
}
