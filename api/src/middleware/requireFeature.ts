import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/errors.js';
import { isFeatureEnabled, type FeatureKey } from '../lib/entitlements.js';

/**
 * Gates a route on the caller's school having bought the feature.
 *
 * Must run AFTER requireAuth (it reads req.user.schoolId).
 *
 * This is the real enforcement point. Hiding a nav item in the frontend
 * is a courtesy to the user; it is not security — a student can call the
 * API directly, so every entitled capability is gated here too.
 */
export function requireFeature(feature: FeatureKey) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
      const allowed = await isFeatureEnabled(req.user.schoolId, feature);
      if (!allowed) {
        throw new ApiError('FORBIDDEN', 'This feature is not included in your school\'s plan.');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
