import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import * as gamificationService from '../services/gamification.service.js';
import * as dailyChallengeService from '../services/dailyChallenge.service.js';
import * as questionBankService from '../services/questionBank.service.js';
import * as gamesService from '../services/games.service.js';

export async function getStudentBadgesController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    // Get batch_id from student_profiles
    const { data: sp } = await supabaseAdmin
      .from('student_profiles')
      .select('batch_id')
      .eq('user_id', studentId)
      .single();
    if (!sp) throw new ApiError('NOT_FOUND', 'Student profile not found');

    const result = await gamificationService.getBadgesForStudent(studentId, sp.batch_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStudentStreakCalendarController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const days = req.query.days ? Number(req.query.days) : 60;
    const result = await gamificationService.getStreakCalendar(studentId, days);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStudentProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;

    const { data: user } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name')
      .eq('id', studentId)
      .single();

    const { data: sp } = await supabaseAdmin
      .from('student_profiles')
      .select('class_num, section, avatar, xp, streak, longest_streak, batch_id')
      .eq('user_id', studentId)
      .single();

    if (!sp) throw new ApiError('NOT_FOUND', 'Student profile not found');

    const stats = await gamificationService.getStudentStats(studentId);

    // Get exams count
    const { count: examsTakenCount } = await supabaseAdmin
      .from('exam_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .not('submitted_at', 'is', null);

    res.json({
      userId: studentId,
      fullName: user?.full_name ?? '',
      classNum: sp.class_num,
      section: sp.section,
      batchId: sp.batch_id,
      avatar: sp.avatar,
      xp: sp.xp,
      streak: sp.streak,
      longestStreak: sp.longest_streak,
      completedTasksCount: stats.completedTasks,
      examsTakenCount: examsTakenCount ?? 0,
      highestExamScorePct: stats.highestExamScorePct,
      avgEnglishAccuracy: stats.avgEnglishAccuracy,
      avgEnglishFluency: stats.avgEnglishFluency,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStudentAvatarController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== 'string') {
      throw new ApiError('VALIDATION_ERROR', 'Avatar string is required');
    }

    const { error } = await supabaseAdmin
      .from('student_profiles')
      .update({ avatar })
      .eq('user_id', studentId);

    if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update avatar', error.message);

    res.json({ success: true, avatar });
  } catch (err) {
    next(err);
  }
}

export async function getDailyChallengesController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const result = await dailyChallengeService.getOrCreateDailyChallenges(studentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listPyqsController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const marks = req.query.marks ? Number(req.query.marks) : undefined;

    const result = await questionBankService.listPyqsForStudent(studentId, { subject, year, marks });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStudentCurriculumController(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.user!.id;
    const result = await gamesService.getStudentCurriculum(studentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
