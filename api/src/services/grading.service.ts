import { supabaseAdmin } from '../lib/supabase.js';
import { chatCompletion, ollamaConfigured } from '../lib/ollama.js';
import { logger } from '../lib/logger.js';
import { addXp, logStreakActivity } from './gamification.service.js';

interface QuestionRow {
  id: string;
  type: string;
  text: string;
  options: { id: string; isCorrect?: boolean; is_correct?: boolean }[] | null;
  correct_answer: string | null;
  marks: number;
  rubric: string | null;
  ai_scoring: boolean;
}

const OBJECTIVE_TYPES = new Set(['mcq', 'true_false', 'fill_blank']);

function normalize(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

/** MCQ/True-False/Fill-blank: instant, deterministic — no AI needed or wanted here. */
function gradeObjective(question: QuestionRow, selectedOptionId: string | null, studentAnswer: string | null) {
  let isCorrect = false;
  if (question.type === 'mcq') {
    // The correct choice lives as a flag on the option itself. Builder-written
    // questions use `isCorrect`, bank-seeded ones `is_correct` — accept both,
    // with `correct_answer` (an option id) as a last-resort fallback.
    const correctOption = (question.options ?? []).find((o) => o.isCorrect === true || o.is_correct === true);
    isCorrect = correctOption
      ? normalize(selectedOptionId) === normalize(correctOption.id)
      : normalize(selectedOptionId) === normalize(question.correct_answer);
  } else {
    isCorrect = normalize(studentAnswer) === normalize(question.correct_answer);
  }
  return { isCorrect, autoScore: isCorrect ? question.marks : 0 };
}

interface AiScoreResult {
  score: number;
  coveredPoints: string[];
  missingPoints: string[];
  feedback: string;
}

async function scoreSubjectiveWithAI(question: QuestionRow, studentAnswer: string, classNum: number, subject: string): Promise<AiScoreResult | null> {
  if (!(await ollamaConfigured())) return null; // pending manual grading — not an error

  try {
    const raw = await chatCompletion(
      [
        {
          role: 'system',
          content: `You are a CBSE examiner for Class ${classNum} ${subject}. Score the student's answer strictly against the marking scheme. Be fair but strict — only award marks for explicitly stated correct content. Return ONLY valid JSON: {"score": <0-${question.marks}>, "covered_points": ["..."], "missing_points": ["..."], "feedback": "<one encouraging sentence>"}`,
        },
        {
          role: 'user',
          content: `QUESTION: ${question.text}\n\nMARKING SCHEME (${question.marks} marks total):\n${question.rubric ?? 'Use general subject knowledge to assess correctness and completeness.'}\n\nSTUDENT'S ANSWER:\n${studentAnswer}`,
        },
      ],
      { jsonMode: true },
    );

    const parsed = JSON.parse(raw) as { score: number; covered_points: string[]; missing_points: string[]; feedback: string };
    return {
      score: Math.max(0, Math.min(question.marks, parsed.score)),
      coveredPoints: parsed.covered_points ?? [],
      missingPoints: parsed.missing_points ?? [],
      feedback: parsed.feedback ?? '',
    };
  } catch (err) {
    logger.error({ err, questionId: question.id }, 'AI subjective scoring failed — leaving for manual review');
    return null;
  }
}

/** Runs once at submit time: grades every answered question, objective instantly and subjective via AI if configured. */
export async function gradeSubmission(examSubmissionId: string) {
  const { data: submission } = await supabaseAdmin
    .from('exam_submissions')
    .select('id, exam_id, exams(class_num, subject)')
    .eq('id', examSubmissionId)
    .single();
  if (!submission) return;

  const exam = Array.isArray(submission.exams) ? submission.exams[0] : submission.exams;

  const { data: answers } = await supabaseAdmin
    .from('exam_answers')
    .select('id, question_id, student_answer, selected_option_id, questions(*)')
    .eq('exam_submission_id', examSubmissionId);

  for (const answer of answers ?? []) {
    const question = (Array.isArray(answer.questions) ? answer.questions[0] : answer.questions) as QuestionRow | undefined;
    if (!question) continue;

    if (OBJECTIVE_TYPES.has(question.type)) {
      const { isCorrect, autoScore } = gradeObjective(question, answer.selected_option_id, answer.student_answer);
      await supabaseAdmin
        .from('exam_answers')
        .update({ is_correct: isCorrect, auto_score: autoScore, final_score: autoScore }) // objective needs no teacher review
        .eq('id', answer.id);
      continue;
    }

    // Subjective (short/long answer)
    if (!answer.student_answer?.trim()) {
      await supabaseAdmin.from('exam_answers').update({ ai_score: 0, final_score: null }).eq('id', answer.id);
      continue;
    }

    if (question.ai_scoring && exam) {
      const result = await scoreSubjectiveWithAI(question, answer.student_answer, exam.class_num, exam.subject);
      if (result) {
        await supabaseAdmin
          .from('exam_answers')
          .update({
            ai_score: result.score,
            ai_covered_points: result.coveredPoints,
            ai_missing_points: result.missingPoints,
            ai_feedback: result.feedback,
            ai_scored_at: new Date().toISOString(),
          })
          .eq('id', answer.id);
      }
    }
    // final_score stays null until a teacher reviews — subjective answers always need a human sign-off.
  }

  await recomputeSubmissionTotals(examSubmissionId);
}

/** Re-run after every grading change (initial auto-grade, or a teacher override) to keep totals and XP in sync. */
export async function recomputeSubmissionTotals(examSubmissionId: string) {
  const { data: answers } = await supabaseAdmin
    .from('exam_answers')
    .select('final_score')
    .eq('exam_submission_id', examSubmissionId);

  const { data: submission } = await supabaseAdmin
    .from('exam_submissions')
    .select('student_id, xp_awarded, is_reviewed, exams(total_marks)')
    .eq('id', examSubmissionId)
    .single();

  // Max is the whole paper, not just what was answered — otherwise skipping
  // a hard question would RAISE a student's percentage on the merit list.
  const exam = submission && (Array.isArray(submission.exams) ? submission.exams[0] : submission.exams);
  const maxScore = exam?.total_marks ?? 0;

  const allReviewed = (answers ?? []).every((a) => a.final_score !== null);
  const totalScore = (answers ?? []).reduce((sum, a) => sum + Number(a.final_score ?? 0), 0);

  await supabaseAdmin
    .from('exam_submissions')
    .update({ total_score: totalScore, max_score: maxScore, is_reviewed: allReviewed })
    .eq('id', examSubmissionId);

  // XP fires exactly once, the moment every answer has a final human-or-auto score.
  if (allReviewed && submission && submission.xp_awarded === 0 && !submission.is_reviewed) {
    const xp = Math.round(totalScore);
    if (xp > 0) {
      await addXp(submission.student_id, xp);
      await logStreakActivity(submission.student_id, xp);
      await supabaseAdmin.from('exam_submissions').update({ xp_awarded: xp }).eq('id', examSubmissionId);
    }
  }
}
