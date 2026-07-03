import type { Request, Response, NextFunction } from 'express';
import * as leaderboardService from '../services/leaderboard.service.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';

type Period = 'weekly' | 'monthly' | 'all_time';

export async function getLeaderboardForStudentController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');

    const { data: sp } = await supabaseAdmin
      .from('student_profiles')
      .select('batch_id, class_num, section')
      .eq('user_id', req.user.id)
      .single();
    if (!sp) throw new ApiError('NOT_FOUND', 'Student profile not found');

    const period = (req.query.period as Period) ?? 'weekly';
    const basis = (req.query.basis as 'xp' | 'exam_avg') ?? 'xp';
    const scopeToClass = req.query.scope === 'class';

    const rows = await leaderboardService.getLeaderboard(
      req.user.schoolId,
      sp.batch_id,
      scopeToClass ? { classNum: sp.class_num, section: sp.section } : {},
      period,
      basis,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function recomputeLeaderboardController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    const batchId = Number(req.body.batchId);
    for (const period of ['weekly', 'monthly', 'all_time'] as const) {
      await leaderboardService.computeLeaderboardForBatch(req.user.schoolId, batchId, period);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
