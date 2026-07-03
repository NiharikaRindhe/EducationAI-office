import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors.js';
import * as schoolAdminService from '../services/schoolAdmin.service.js';
import { addSingleStudentSchema, addSingleTeacherSchema } from '../schemas/schoolAdmin.schema.js';

function requireSchoolId(req: Request): string {
  const schoolId = req.user?.schoolId;
  if (!schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
  return schoolId;
}

export async function importStudentsController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new ApiError('VALIDATION_ERROR', 'CSV file is required (field name: file)');
    const schoolId = requireSchoolId(req);

    const { rows, errors: parseErrors } = schoolAdminService.parseStudentCsv(req.file.buffer);
    const result = await schoolAdminService.importStudents(schoolId, rows);

    res.json({
      created: result.created,
      errors: [...parseErrors, ...result.errors],
      credentials: result.credentials,
    });
  } catch (err) {
    next(err);
  }
}

export async function importTeachersController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new ApiError('VALIDATION_ERROR', 'CSV file is required (field name: file)');
    const schoolId = requireSchoolId(req);

    const { rows, errors: parseErrors } = schoolAdminService.parseTeacherCsv(req.file.buffer);
    const result = await schoolAdminService.importTeachers(schoolId, rows);

    res.json({
      created: result.created,
      errors: [...parseErrors, ...result.errors],
      credentials: result.credentials,
    });
  } catch (err) {
    next(err);
  }
}

export async function addSingleStudentController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = addSingleStudentSchema.parse(req.body);
    const credential = await schoolAdminService.addSingleStudent(schoolId, {
      full_name: input.fullName,
      class_num: input.classNum,
      section: input.section,
      roll_number: input.rollNumber,
    });
    res.status(201).json(credential);
  } catch (err) {
    next(err);
  }
}

export async function addSingleTeacherController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = addSingleTeacherSchema.parse(req.body);
    const credential = await schoolAdminService.addSingleTeacher(schoolId, {
      full_name: input.fullName,
      employee_id: input.employeeId,
      specialization: input.specialization,
      classes_taught: input.classesTaught,
    });
    res.status(201).json(credential);
  } catch (err) {
    next(err);
  }
}

export async function listStudentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const classNum = req.query.classNum ? Number(req.query.classNum) : undefined;
    const section = typeof req.query.section === 'string' ? req.query.section : undefined;
    const students = await schoolAdminService.listStudents(schoolId, { classNum, section });
    res.json(students);
  } catch (err) {
    next(err);
  }
}

export async function listTeachersController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const teachers = await schoolAdminService.listTeachers(schoolId);
    res.json(teachers);
  } catch (err) {
    next(err);
  }
}
