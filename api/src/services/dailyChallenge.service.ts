import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { addXp } from './gamification.service.js';

async function getMetricValueToday(studentId: string, metric: string, today: string): Promise<number> {
  const startDate = new Date(today + 'T00:00:00.000Z');
  const endDate = new Date(startDate.getTime() + 86400000);

  switch (metric) {
    case 'xp_earned': {
      const { data: log } = await supabaseAdmin
        .from('streak_logs')
        .select('xp_earned')
        .eq('student_id', studentId)
        .eq('logged_date', today)
        .maybeSingle();
      return log?.xp_earned ?? 0;
    }
    case 'tasks_completed': {
      const { count } = await supabaseAdmin
        .from('task_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lt('completed_at', endDate.toISOString());
      return count ?? 0;
    }
    case 'exam_attempted': {
      const { count } = await supabaseAdmin
        .from('exam_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .not('submitted_at', 'is', null)
        .gte('submitted_at', startDate.toISOString())
        .lt('submitted_at', endDate.toISOString());
      return count ?? 0;
    }
    case 'notes_created': {
      const { count } = await supabaseAdmin
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      return count ?? 0;
    }
    case 'chat_messages': {
      const { data: sessions } = await supabaseAdmin
        .from('chat_sessions')
        .select('id')
        .eq('student_id', studentId);
      if (!sessions || sessions.length === 0) return 0;
      const sessionIds = sessions.map((s) => s.id);

      const { count } = await supabaseAdmin
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds)
        .eq('role', 'user')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      return count ?? 0;
    }
    default:
      return 0;
  }
}

export async function getOrCreateDailyChallenges(studentId: string) {
  const { data: sp, error: spError } = await supabaseAdmin
    .from('student_profiles')
    .select('batch_id')
    .eq('user_id', studentId)
    .single();
  if (spError || !sp) throw new ApiError('NOT_FOUND', 'Student profile not found');
  const batchId = sp.batch_id;

  const { data: templates, error: tError } = await supabaseAdmin
    .from('challenge_templates')
    .select('*')
    .eq('is_active', true)
    .or(`batch_id.is.null,batch_id.eq.${batchId}`);
  if (tError) throw new ApiError('INTERNAL_ERROR', 'Failed to load challenge templates', tError.message);

  const today = new Date().toISOString().slice(0, 10);

  const { data: existingChallenges, error: ecError } = await supabaseAdmin
    .from('student_daily_challenges')
    .select('*')
    .eq('student_id', studentId)
    .eq('challenge_date', today);
  if (ecError) throw new ApiError('INTERNAL_ERROR', 'Failed to load existing daily challenges', ecError.message);

  const existingMap = new Map(existingChallenges?.map((c) => [c.template_id, c]));
  const results = [];

  for (const template of templates ?? []) {
    const progressVal = await getMetricValueToday(studentId, template.metric, today);
    const existing = existingMap.get(template.id);
    const isCompleted = progressVal >= template.target_value;

    let completedAt = existing?.completed_at ?? null;
    let xpAwarded = existing?.xp_awarded ?? false;

    if (isCompleted && !completedAt) {
      completedAt = new Date().toISOString();
    }

    let newBadges: any[] = [];
    if (isCompleted && !xpAwarded) {
      const awardResult = await addXp(studentId, template.xp_reward);
      xpAwarded = true;
      newBadges = awardResult.newBadges;
    }

    if (existing) {
      if (existing.progress !== progressVal || existing.xp_awarded !== xpAwarded || existing.completed_at !== completedAt) {
        await supabaseAdmin
          .from('student_daily_challenges')
          .update({
            progress: progressVal,
            completed_at: completedAt,
            xp_awarded: xpAwarded,
          })
          .eq('id', existing.id);
      }
      results.push({
        id: existing.id,
        templateId: template.id,
        title: template.title,
        description: template.description,
        metric: template.metric,
        targetValue: template.target_value,
        xpReward: template.xp_reward,
        progress: progressVal,
        completedAt,
        xpAwarded,
        newBadges,
      });
    } else {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('student_daily_challenges')
        .insert({
          student_id: studentId,
          template_id: template.id,
          challenge_date: today,
          progress: progressVal,
          completed_at: completedAt,
          xp_awarded: xpAwarded,
        })
        .select()
        .single();

      if (insertError) {
        // Fallback in case of concurrent execution
        const { data: fallback } = await supabaseAdmin
          .from('student_daily_challenges')
          .select('*')
          .eq('student_id', studentId)
          .eq('template_id', template.id)
          .eq('challenge_date', today)
          .single();
        if (fallback) {
          results.push({
            id: fallback.id,
            templateId: template.id,
            title: template.title,
            description: template.description,
            metric: template.metric,
            targetValue: template.target_value,
            xpReward: template.xp_reward,
            progress: progressVal,
            completedAt: fallback.completed_at,
            xpAwarded: fallback.xp_awarded,
            newBadges: [],
          });
        }
      } else if (inserted) {
        results.push({
          id: inserted.id,
          templateId: template.id,
          title: template.title,
          description: template.description,
          metric: template.metric,
          targetValue: template.target_value,
          xpReward: template.xp_reward,
          progress: progressVal,
          completedAt,
          xpAwarded,
          newBadges,
        });
      }
    }
  }

  return results;
}
