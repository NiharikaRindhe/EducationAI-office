import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { addXp, logStreakActivity } from './gamification.service.js';
import type { CreateTaskInput } from '../schemas/task.schema.js';

const STATUS_ORDER = ['not_started', 'in_progress', 'in_review', 'completed'] as const;
type Status = (typeof STATUS_ORDER)[number];

async function resolveStudentIds(schoolId: string, assignTo: CreateTaskInput['assignTo']): Promise<string[]> {
  if (assignTo.mode === 'students') return assignTo.studentIds;

  let query = supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(class_num, section, batch_id)')
    .eq('school_id', schoolId)
    .eq('role', 'student');

  if (assignTo.mode === 'class') {
    query = query.eq('student_profiles.class_num', assignTo.classNum).eq('student_profiles.section', assignTo.section);
  } else {
    query = query.eq('student_profiles.batch_id', assignTo.batchId);
  }

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to resolve students for assignment', error.message);
  return (data ?? []).map((r) => r.id);
}

export async function createAndAssignTask(teacherId: string, schoolId: string, input: CreateTaskInput) {
  const studentIds = await resolveStudentIds(schoolId, input.assignTo);
  if (studentIds.length === 0) throw new ApiError('VALIDATION_ERROR', 'No students matched the assignment target');

  const batchId = input.assignTo.mode === 'batch' ? input.assignTo.batchId : null;

  const { data: task, error: taskError } = await supabaseAdmin
    .from('tasks')
    .insert({
      school_id: schoolId,
      created_by: teacherId,
      title: input.title,
      subject: input.subject,
      task_type: input.taskType,
      instructions: input.instructions ?? null,
      xp_reward: input.xpReward,
      due_date: input.dueDate ?? null,
      batch_id: batchId,
    })
    .select()
    .single();

  if (taskError) throw new ApiError('INTERNAL_ERROR', 'Failed to create task', taskError.message);

  const assignments = studentIds.map((studentId) => ({ task_id: task.id, student_id: studentId }));
  const { error: assignError } = await supabaseAdmin.from('task_assignments').insert(assignments);
  if (assignError) throw new ApiError('INTERNAL_ERROR', 'Failed to assign task', assignError.message);

  return { task, assignedCount: studentIds.length };
}

export async function listTasksForTeacher(teacherId: string) {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('id, title, subject, task_type, xp_reward, due_date, batch_id, created_at, task_assignments(status)')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list tasks', error.message);

  return (data ?? []).map((t) => {
    const assignments = t.task_assignments as { status: Status }[];
    return {
      ...t,
      task_assignments: undefined,
      totalAssigned: assignments.length,
      completed: assignments.filter((a) => a.status === 'completed').length,
    };
  });
}

export async function listTasksForStudent(studentId: string, filters: { status?: Status } = {}) {
  let query = supabaseAdmin
    .from('task_assignments')
    .select('id, status, xp_awarded, completed_at, tasks(id, title, subject, task_type, instructions, xp_reward, due_date)')
    .eq('student_id', studentId);

  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list tasks', error.message);
  return data;
}

/** Cycles Not Started -> In Progress -> In Review -> Completed, or jumps straight to an explicit status. XP fires exactly once, on the transition into 'completed'. */
export async function cycleTaskStatus(studentId: string, taskAssignmentId: string, explicitStatus?: Status) {
  const { data: assignment, error } = await supabaseAdmin
    .from('task_assignments')
    .select('id, status, xp_awarded, tasks(xp_reward)')
    .eq('id', taskAssignmentId)
    .eq('student_id', studentId)
    .single();

  if (error || !assignment) throw new ApiError('NOT_FOUND', 'Task assignment not found');

  const currentIndex = STATUS_ORDER.indexOf(assignment.status as Status);
  const nextStatus = explicitStatus ?? STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];

  const becomingComplete = nextStatus === 'completed' && assignment.status !== 'completed';
  const task = Array.isArray(assignment.tasks) ? assignment.tasks[0] : assignment.tasks;
  const xpReward = becomingComplete ? (task?.xp_reward ?? 0) : 0;

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('task_assignments')
    .update({
      status: nextStatus,
      xp_awarded: becomingComplete ? xpReward : assignment.xp_awarded,
      completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', taskAssignmentId)
    .select()
    .single();

  if (updateError) throw new ApiError('INTERNAL_ERROR', 'Failed to update task status', updateError.message);

  let newBadges: { id: string; name: string; icon: string | null }[] = [];
  if (becomingComplete && xpReward > 0) {
    const result = await addXp(studentId, xpReward);
    newBadges = result.newBadges;
    await logStreakActivity(studentId, xpReward);
  }

  return { assignment: updated, newBadges };
}
