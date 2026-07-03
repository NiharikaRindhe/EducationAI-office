import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';

type Period = 'weekly' | 'monthly' | 'all_time';

/** Recomputes XP + exam-average ranks for one school+batch. Called by the hourly cron job and can be triggered on demand. */
export async function computeLeaderboardForBatch(schoolId: string, batchId: number, period: Period = 'weekly') {
  const { data: students, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(xp, class_num, section, batch_id)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('student_profiles.batch_id', batchId);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load students for leaderboard', error.message);
  if (!students || students.length === 0) return;

  // exam_avg per student: average of (total_score/max_score) across all reviewed submissions.
  const examAvgByStudent = new Map<string, number>();
  for (const s of students) {
    const { data: submissions } = await supabaseAdmin
      .from('exam_submissions')
      .select('total_score, max_score')
      .eq('student_id', s.id)
      .eq('is_reviewed', true)
      .not('submitted_at', 'is', null);

    const pcts = (submissions ?? [])
      .filter((sub) => sub.max_score && sub.max_score > 0)
      .map((sub) => (Number(sub.total_score) / Number(sub.max_score)) * 100);
    if (pcts.length > 0) examAvgByStudent.set(s.id, pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }

  // Previous ranks, to compute rank_change.
  const { data: previous } = await supabaseAdmin
    .from('leaderboard_snapshots')
    .select('student_id, rank, score_basis')
    .eq('school_id', schoolId)
    .eq('batch_id', batchId)
    .eq('period', period);
  const previousRankByStudentBasis = new Map<string, number>();
  for (const p of previous ?? []) previousRankByStudentBasis.set(`${p.student_id}:${p.score_basis}`, p.rank ?? 0);

  const rows: Record<string, unknown>[] = [];

  for (const basis of ['xp', 'exam_avg'] as const) {
    const ranked = students
      .map((s) => {
        const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
        return {
          studentId: s.id,
          classNum: sp?.class_num,
          section: sp?.section,
          xp: sp?.xp ?? 0,
          examAvg: examAvgByStudent.get(s.id) ?? null,
        };
      })
      .filter((s) => (basis === 'exam_avg' ? s.examAvg !== null : true))
      .sort((a, b) => (basis === 'xp' ? b.xp - a.xp : (b.examAvg ?? 0) - (a.examAvg ?? 0)));

    ranked.forEach((s, i) => {
      const rank = i + 1;
      const prevRank = previousRankByStudentBasis.get(`${s.studentId}:${basis}`) ?? rank;
      rows.push({
        school_id: schoolId,
        batch_id: batchId,
        class_num: s.classNum,
        section: s.section,
        student_id: s.studentId,
        xp_score: s.xp,
        exam_avg: s.examAvg,
        score_basis: basis,
        rank,
        rank_change: prevRank - rank,
        period,
        computed_at: new Date().toISOString(),
      });
    });
  }

  // Snapshot table has no natural unique key to upsert against cleanly (rank
  // changes every recompute) — simplest correct approach is replace-in-full
  // for this school+batch+period rather than trying to diff row by row.
  await supabaseAdmin
    .from('leaderboard_snapshots')
    .delete()
    .eq('school_id', schoolId)
    .eq('batch_id', batchId)
    .eq('period', period);

  if (rows.length > 0) {
    const { error: insertError } = await supabaseAdmin.from('leaderboard_snapshots').insert(rows);
    if (insertError) throw new ApiError('INTERNAL_ERROR', 'Failed to save leaderboard', insertError.message);
  }
}

export async function getLeaderboard(
  schoolId: string,
  batchId: number,
  scope: { classNum?: number; section?: string },
  period: Period,
  basis: 'xp' | 'exam_avg',
) {
  let query = supabaseAdmin
    .from('leaderboard_snapshots')
    .select('rank, rank_change, xp_score, exam_avg, student_id, student_profiles(avatar, user_profiles(full_name))')
    .eq('school_id', schoolId)
    .eq('batch_id', batchId)
    .eq('period', period)
    .eq('score_basis', basis);

  if (scope.classNum !== undefined) query = query.eq('class_num', scope.classNum);
  if (scope.section) query = query.eq('section', scope.section);

  const { data, error } = await query.order('rank', { ascending: true });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load leaderboard', error.message);
  return data;
}
