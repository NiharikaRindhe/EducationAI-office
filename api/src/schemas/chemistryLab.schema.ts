import { z } from 'zod';

/* Request shapes mirror the original EducationAI-Games-master FastAPI
   models (Backend/main.py CraftRequest / FreeReactRequest) exactly —
   snake_case included — so the ported Lab.jsx calls them unchanged. */

export const craftCompoundSchema = z.object({
  elements: z.array(z.string().trim().min(1).max(20)).min(1).max(8),
  attempted_formula: z.string().trim().max(80).optional().default(''),
});
export type CraftCompoundInput = z.infer<typeof craftCompoundSchema>;

export const freeReactSchema = z.object({
  reactants: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
});
export type FreeReactInput = z.infer<typeof freeReactSchema>;
