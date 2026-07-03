import type { Request, Response, NextFunction } from 'express';
import { createAnnouncementSchema } from '../schemas/announcement.schema.js';
import * as announcementService from '../services/announcement.service.js';
import { ApiError } from '../lib/errors.js';
import { supabaseAdmin } from '../lib/supabase.js';

export async function createAnnouncementController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const input = createAnnouncementSchema.parse(req.body);
    const announcement = await announcementService.createAnnouncement(req.user.id, req.user.schoolId, input);
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncementController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing announcement id');
    await announcementService.deleteAnnouncement(req.user!.id, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listAnnouncementsForStudentController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const { data: sp, error } = await supabaseAdmin
      .from('student_profiles')
      .select('class_num, section')
      .eq('user_id', req.user.id)
      .single();
    if (error || !sp) throw new ApiError('NOT_FOUND', 'Student profile not found');

    res.json(await announcementService.listForStudent(req.user.schoolId, sp.class_num, sp.section));
  } catch (err) {
    next(err);
  }
}
