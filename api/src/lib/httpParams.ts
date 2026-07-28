import type { Request } from 'express';
import { ApiError } from './errors.js';

/** A required :param — throws a clean 422 instead of letting `undefined` reach a query. */
export function requireId(req: Request, name = 'id'): string {
  const value = req.params[name];
  if (!value) throw new ApiError('VALIDATION_ERROR', `Missing ${name} in path`);
  return value;
}

/** Every school-scoped route needs this: an account with no school attached
 *  must never be able to read/write another school's data by omission. */
export function requireSchoolId(req: Request): string {
  const schoolId = req.user?.schoolId;
  if (!schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  return schoolId;
}
