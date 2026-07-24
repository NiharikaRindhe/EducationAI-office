import { supabaseAdmin } from './supabase.js';
import { ApiError } from './errors.js';

/** Every task/exam/chat session/content upload validates its subject against
 *  this whitelist before writing — the single source of truth for which
 *  subjects exist for a class (see api/src/schemas/superAdmin.schema.ts for
 *  the master list super_admin can assign classes from). */
export async function requireWhitelistedSubject(classNum: number, subject: string) {
  const { data } = await supabaseAdmin
    .from('class_subjects')
    .select('subject')
    .eq('class_num', classNum)
    .eq('subject', subject)
    .maybeSingle();
  if (!data) throw new ApiError('SUBJECT_NOT_WHITELISTED', `${subject} is not offered for Class ${classNum}`);
}
