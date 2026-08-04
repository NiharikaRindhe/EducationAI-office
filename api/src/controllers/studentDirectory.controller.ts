import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors.js';
import { requireSchoolId } from '../lib/httpParams.js';
import * as directory from '../services/studentDirectory.service.js';
import * as bulk from '../services/studentBulk.service.js';
import { writeAuditLog } from '../services/auditLog.service.js';
import {
  directoryQuerySchema,
  bulkIdsSchema,
  bulkMoveSchema,
  bulkActiveSchema,
} from '../schemas/studentDirectory.schema.js';

/**
 * Student directory — the paged/filtered/sorted roster table shared by the
 * School Admin, Teacher and Super Admin portals, plus the bulk actions
 * behind its selection bar.
 *
 * Scope differs per role and is decided here, never taken from the client:
 *   school_admin — every student in their own school
 *   teacher      — only the (class, section) pairs they are assigned
 *   super_admin  — all schools, optionally narrowed by ?schoolId
 */

/** Turns a validated query into the service's filter shape. */
function toFilters(input: ReturnType<typeof directoryQuerySchema.parse>): directory.DirectoryFilters {
  return {
    search: input.search,
    classNum: input.classNum,
    section: input.section,
    status: input.status,
    enabled: input.enabled,
    batchId: input.batchId,
  };
}

function csvResponse(res: Response, csv: string, filename: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // Excel only honours UTF-8 in a CSV when it starts with a BOM; without it
  // student names with Indic characters render as mojibake.
  res.send('﻿' + csv);
}

// ─────────────────────────────────────────────────────────────
//  SCHOOL ADMIN — own school
// ─────────────────────────────────────────────────────────────
export async function schoolAdminListController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = directoryQuerySchema.parse(req.query);
    res.json(await directory.listStudentDirectory({ ...input, schoolId }));
  } catch (err) {
    next(err);
  }
}

export async function schoolAdminIdsController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = directoryQuerySchema.parse(req.query);
    res.json(await directory.listStudentDirectoryIds({ ...toFilters(input), schoolId }));
  } catch (err) {
    next(err);
  }
}

export async function schoolAdminExportController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = directoryQuerySchema.parse(req.query);
    const csv = await directory.exportStudentDirectoryCsv({ ...toFilters(input), schoolId });
    csvResponse(res, csv, 'students.csv');
  } catch (err) {
    next(err);
  }
}

export async function bulkResetCredentialsController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { studentIds } = bulkIdsSchema.parse(req.body);
    res.json(await bulk.bulkResetStudentCredentials(schoolId, studentIds));
  } catch (err) {
    next(err);
  }
}

export async function bulkMoveController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { studentIds, classNum, section } = bulkMoveSchema.parse(req.body);
    res.json(await bulk.bulkMoveStudents(schoolId, studentIds, { classNum, section }));
  } catch (err) {
    next(err);
  }
}

export async function bulkSetActiveController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { studentIds, isActive } = bulkActiveSchema.parse(req.body);
    res.json(await bulk.bulkSetStudentActive(schoolId, studentIds, isActive));
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  TEACHER — read-only, limited to assigned sections
// ─────────────────────────────────────────────────────────────
export async function teacherListController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const teacherId = req.user!.id;
    const input = directoryQuerySchema.parse(req.query);
    const scope = await directory.teacherScopeFor(teacherId, schoolId);
    res.json(await directory.listStudentDirectory({ ...input, schoolId }, scope));
  } catch (err) {
    next(err);
  }
}

export async function teacherIdsController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = directoryQuerySchema.parse(req.query);
    const scope = await directory.teacherScopeFor(req.user!.id, schoolId);
    res.json(await directory.listStudentDirectoryIds({ ...toFilters(input), schoolId }, scope));
  } catch (err) {
    next(err);
  }
}

export async function teacherExportController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = directoryQuerySchema.parse(req.query);
    const scope = await directory.teacherScopeFor(req.user!.id, schoolId);
    const csv = await directory.exportStudentDirectoryCsv({ ...toFilters(input), schoolId }, scope);
    csvResponse(res, csv, 'my-students.csv');
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  SUPER ADMIN — across every school
// ─────────────────────────────────────────────────────────────
/**
 * Cross-school reads are search-first and audited.
 *
 * Two changes from the original behaviour, both about the same thing: a
 * platform operator looking at other people's children should be answering a
 * specific question, and the school should be able to find out that it
 * happened. `requireNarrowing` withholds an unfiltered dump; the audit row
 * makes "who accessed our students?" answerable — previously `writeAuditLog`
 * was called from exactly one place in the whole API, so it wasn't.
 */
export async function superAdminListController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = directoryQuerySchema.parse(req.query);
    const result = await directory.listStudentDirectory(input, undefined, { requireNarrowing: true });

    // Only a request that actually returned children is worth a row; a gated
    // (empty) response exposed nothing.
    if (!result.gated && result.rows.length > 0) {
      void writeAuditLog({
        schoolId: input.schoolId ?? null,
        actorId: req.user!.id,
        action: 'student_directory.search',
        entity: 'student_directory',
        metadata: {
          search: input.search ?? null,
          schoolId: input.schoolId ?? null,
          classNum: input.classNum ?? null,
          section: input.section ?? null,
          resultCount: result.rows.length,
          totalMatching: result.total,
        },
      }).catch(() => { /* auditing must never break the lookup itself */ });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function superAdminExportController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = directoryQuerySchema.parse(req.query);
    const filters = toFilters(input);

    // An export is a bulk extraction of children's records — the strongest
    // reason of all to require a named scope and to log it.
    if (!filters.schoolId && !filters.search?.trim()) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Select a school or enter a search term before exporting. Platform-wide student exports are not available.',
      );
    }

    const csv = await directory.exportStudentDirectoryCsv(filters, undefined, { includeSchool: true });

    void writeAuditLog({
      schoolId: filters.schoolId ?? null,
      actorId: req.user!.id,
      action: 'student_directory.export',
      entity: 'student_directory',
      metadata: { search: filters.search ?? null, schoolId: filters.schoolId ?? null },
    }).catch(() => { /* never fail the export on an audit write */ });

    csvResponse(res, csv, 'students-export.csv');
  } catch (err) {
    next(err);
  }
}

/** Super Admin bulk actions are school-scoped on purpose: a cross-school
 *  write is never a legitimate roster operation, so ?schoolId is required
 *  and every id is checked against it. */
export async function superAdminBulkSetActiveController(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentIds, isActive } = bulkActiveSchema.parse(req.body);
    const schoolId = typeof req.query.schoolId === 'string' ? req.query.schoolId : undefined;
    if (!schoolId) throw new ApiError('VALIDATION_ERROR', 'schoolId is required for a bulk action');

    const result = await bulk.bulkSetStudentActive(schoolId, studentIds, isActive);

    // Disabling accounts locks children out of the platform; the school must
    // be able to see that a platform operator did it, and to whom.
    void writeAuditLog({
      schoolId,
      actorId: req.user!.id,
      action: isActive ? 'student.bulk_activate' : 'student.bulk_deactivate',
      entity: 'student',
      metadata: { studentIds, requested: studentIds.length, succeeded: result.succeeded },
    }).catch(() => { /* the write already happened; never fail it on the log */ });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
