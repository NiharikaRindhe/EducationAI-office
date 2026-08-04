import { z } from 'zod';
import { SORT_KEYS, MAX_PAGE_SIZE, MAX_BULK_IDS } from '../services/studentDirectory.service.js';

/** Query string arrives as strings; coerce and clamp before it reaches a query. */
export const directoryQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  classNum: z.coerce.number().int().min(1).max(10).optional(),
  section: z.string().trim().max(4).optional(),
  status: z.enum(['all', 'active', 'never']).optional(),
  enabled: z.enum(['all', 'enabled', 'disabled']).optional(),
  batchId: z.coerce.number().int().min(1).max(3).optional(),
  schoolId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
  sortKey: z.enum(SORT_KEYS).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export type DirectoryQueryInput = z.infer<typeof directoryQuerySchema>;

const studentIds = z
  .array(z.string().uuid())
  .min(1, 'Select at least one student')
  .max(MAX_BULK_IDS, `Cannot act on more than ${MAX_BULK_IDS} students at once`);

export const bulkIdsSchema = z.object({ studentIds });

export const bulkMoveSchema = z.object({
  studentIds,
  classNum: z.number().int().min(1).max(10),
  section: z.string().trim().min(1).max(4),
});

export const bulkActiveSchema = z.object({
  studentIds,
  isActive: z.boolean(),
});
