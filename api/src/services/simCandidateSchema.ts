// api/src/services/simCandidateSchema.ts
//
// Ported from pdf-simulation-master/server/src/services/sim/candidateSchema.ts.

import { z } from 'zod';
import { SimSpecSchema, type SimSpec } from '../lib/simShared/index.js';

/** An LLM candidate — the shared SimSpec plus an importance score (1-10)
 *  the curator uses to triage which pages are worth storing. */
export const CandidateSchema = SimSpecSchema.and(
  z.object({
    importance: z.number().min(1).max(10),
  }),
);

export type Candidate = SimSpec & {
  importance: number;
};

/** Max 3 candidates per page, per the curator pipeline. */
export const CandidateListSchema = z.array(CandidateSchema).max(3);

export type CandidateList = z.infer<typeof CandidateListSchema>;
