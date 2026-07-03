import type { Request, Response, NextFunction } from 'express';
import { createTaskSchema, cycleStatusSchema } from '../schemas/task.schema.js';
import * as taskService from '../services/task.service.js';
import { ApiError } from '../lib/errors.js';

export async function createTaskController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const input = createTaskSchema.parse(req.body);
    const result = await taskService.createAndAssignTask(req.user.id, req.user.schoolId, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listTasksForTeacherController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await taskService.listTasksForTeacher(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function listTasksForStudentController(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as 'not_started' | 'in_progress' | 'in_review' | 'completed' | undefined;
    res.json(await taskService.listTasksForStudent(req.user!.id, { status }));
  } catch (err) {
    next(err);
  }
}

export async function cycleTaskStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing task assignment id');
    const { status } = cycleStatusSchema.parse(req.body);
    res.json(await taskService.cycleTaskStatus(req.user!.id, id, status));
  } catch (err) {
    next(err);
  }
}
