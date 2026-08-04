import type { Request, Response, NextFunction } from 'express';
import * as syllabusService from '../services/syllabus.service.js';

export async function getStudentSyllabusController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await syllabusService.getStudentSyllabus(req.user!.id));
  } catch (err) {
    next(err);
  }
}
