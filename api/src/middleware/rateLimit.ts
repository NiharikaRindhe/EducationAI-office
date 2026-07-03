import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/errors.js';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-memory fixed-window limiter, keyed by a caller-supplied function
 * (e.g. IP, or IP+studentId for PIN attempts). Good enough for a single-
 * process deployment (one school server, per the MVP's self-hosted model);
 * swap for Redis if the API ever runs as more than one instance.
 */
export function rateLimit(opts: { windowMs: number; max: number; keyFn: (req: Request) => string }) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = opts.keyFn(req);
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    if (existing.count >= opts.max) {
      return next(new ApiError('RATE_LIMITED', 'Too many attempts — try again in a minute'));
    }

    existing.count += 1;
    next();
  };
}
