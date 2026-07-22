import { z } from 'zod';

export const AI_TIERS = ['chat', 'grading', 'qgen', 'vision'] as const;
export const aiTierSchema = z.enum(AI_TIERS);

export const updateAiSettingsSchema = z.object({
  // Partial map of tier -> model override. An empty string clears the
  // override (falls back to the env var default).
  models: z.record(aiTierSchema, z.string()).optional(),
  // Partial map of tier -> enabled flag (the Super Admin kill-switch).
  enabled: z.record(aiTierSchema, z.boolean()).optional(),
});
export type UpdateAiSettingsInput = z.infer<typeof updateAiSettingsSchema>;

export const usageQuerySchema = z.object({
  groupBy: z.enum(['day', 'school', 'tier']).default('day'),
  days: z.coerce.number().int().min(1).max(365).default(30),
});
export type UsageQuery = z.infer<typeof usageQuerySchema>;
