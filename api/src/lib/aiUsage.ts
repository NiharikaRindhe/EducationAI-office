import { supabaseAdmin } from './supabase.js';
import { logger } from './logger.js';
import type { ModelTier } from './ai.js';

export interface AiUsageContext {
  schoolId?: string | null;
  userId?: string | null;
}

/**
 * Fire-and-forget usage insert — never awaited by the caller, and never
 * allowed to fail a chat/grading/qgen request just because the log write
 * hiccuped. Powers the Super Admin AI Console (spend by school/tier/model).
 */
export function logAiUsage(
  ctx: AiUsageContext,
  tier: ModelTier,
  provider: 'cloud' | 'ollama',
  model: string,
  promptTokens: number,
  completionTokens: number,
): void {
  void supabaseAdmin
    .from('ai_usage_log')
    .insert({
      school_id: ctx.schoolId ?? null,
      user_id: ctx.userId ?? null,
      tier,
      provider,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
    })
    .then(({ error }) => {
      if (error) logger.warn({ error }, 'Failed to log AI usage');
    });
}
