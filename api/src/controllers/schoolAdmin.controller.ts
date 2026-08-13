import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors.js';
import * as schoolAdminService from '../services/schoolAdmin.service.js';
import {
  addSingleStudentSchema,
  addSingleTeacherSchema,
  addSingleLabInchargeSchema,
  importScopeSchema,
  updateStudentProfileSchema,
  updateTeacherProfileSchema,
  setStaffActiveSchema,
} from '../schemas/schoolAdmin.schema.js';
import { requireSchoolId } from '../lib/httpParams.js';

export async function importStudentsController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new ApiError('VALIDATION_ERROR', 'A .csv or .xlsx file is required (field name: file)');
    const schoolId = requireSchoolId(req);

    // Optional multipart fields classNum+section pin the whole file to one
    // section (the "import into Class 3-B" flow) — both or neither.
    const scopeInput = importScopeSchema.parse(req.body ?? {});
    if ((scopeInput.classNum === undefined) !== (scopeInput.section === undefined)) {
      throw new ApiError('VALIDATION_ERROR', 'Scoped import needs both classNum and section');
    }
    const scope =
      scopeInput.classNum !== undefined && scopeInput.section !== undefined
        ? { classNum: scopeInput.classNum, section: scopeInput.section }
        : undefined;

    const { rows, errors: parseErrors } = await schoolAdminService.parseStudentSheet(
      req.file.buffer,
      req.file.originalname ?? 'upload.csv',
      scope,
    );
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
    if (!req.file) throw new ApiError('VALIDATION_ERROR', 'A .csv or .xlsx file is required (field name: file)');
    const schoolId = requireSchoolId(req);

    const { rows, errors: parseErrors } = await schoolAdminService.parseTeacherSheet(
      req.file.buffer,
      req.file.originalname ?? 'upload.csv',
    );
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

export async function updateStudentProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = updateStudentProfileSchema.parse(req.body);
    res.json(await schoolAdminService.updateStudentProfile(schoolId, req.params.id!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function updateTeacherProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = updateTeacherProfileSchema.parse(req.body);
    res.json(await schoolAdminService.updateTeacherProfile(schoolId, req.params.id!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function setStaffActiveController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const { isActive } = setStaffActiveSchema.parse(req.body);
    res.json(await schoolAdminService.setStaffActive(schoolId, req.params.id!, isActive, req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function resetStudentCredentialController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const credential = await schoolAdminService.resetStudentCredential(schoolId, req.params.id!, req.user!.id);
    res.json(credential);
  } catch (err) {
    next(err);
  }
}

export async function resetTeacherPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const credential = await schoolAdminService.resetTeacherPassword(schoolId, req.params.id!, req.user!.id);
    res.json(credential);
  } catch (err) {
    next(err);
  }
}

export async function listLabInchargesController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await schoolAdminService.listLabIncharges(requireSchoolId(req)));
  } catch (err) {
    next(err);
  }
}

export async function addSingleLabInchargeController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const input = addSingleLabInchargeSchema.parse(req.body);
    const credential = await schoolAdminService.addSingleLabIncharge(schoolId, input.fullName);
    res.status(201).json(credential);
  } catch (err) {
    next(err);
  }
}

export async function resetLabInchargePasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = requireSchoolId(req);
    const credential = await schoolAdminService.resetLabInchargePassword(schoolId, req.params.id!, req.user!.id);
    res.json(credential);
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
