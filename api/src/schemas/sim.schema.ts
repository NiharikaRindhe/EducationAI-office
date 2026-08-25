import { z } from 'zod';

const uuid = z.string().uuid();
const jobId = uuid;
const pageNumber = z.number().int().min(1);
/** A pasted/snipped image data URL — validated further (mime/size) by
 *  lib/simPageImage.ts's parsePageImage(); this only bounds the request size. */
const imageDataUrl = z.string().max(1_200_000).optional();

export const chatTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

export const simChatSchema = z.object({
  jobId,
  page: pageNumber,
  messages: z.array(chatTurnSchema).min(1).max(40),
  parentTopic: z.string().max(200).optional(),
  domain: z.string().max(40).optional(),
  image: imageDataUrl,
});

export const simExplainSchema = z.object({
  jobId,
  annotationId: uuid,
  mode: z.enum(['beginner', 'standard', 'advanced']).default('standard'),
  customQuestion: z.string().max(500).optional(),
});

export const simExplainSelectionSchema = z.object({
  jobId,
  page: pageNumber,
  selectedText: z.string().min(1).max(2000),
  parentTopic: z.string().max(200).optional(),
  domain: z.string().max(40).optional(),
  mode: z.enum(['beginner', 'standard', 'advanced']).default('standard'),
  image: imageDataUrl,
});

export const simGenerateSchema = z.object({
  jobId,
  page: pageNumber,
  prompt: z.string().min(1).max(500),
  annotationId: uuid.optional(),
});

export const simBriefSchema = z.object({
  spec: z.record(z.string(), z.unknown()),
  quote: z.string().max(2000).optional(),
});

export const createSimNoteSchema = z.object({
  jobId,
  pageNumber,
  highlight: z.string().max(2000).optional(),
  note: z.string().max(4000).optional(),
  color: z.string().max(20).optional(),
});

export const updateSimNoteSchema = z.object({
  note: z.string().max(4000).optional(),
  color: z.string().max(20).optional(),
  starred: z.boolean().optional(),
});

export type SimChatInput = z.infer<typeof simChatSchema>;
export type SimExplainInput = z.infer<typeof simExplainSchema>;
export type SimExplainSelectionInput = z.infer<typeof simExplainSelectionSchema>;
export type SimGenerateInput = z.infer<typeof simGenerateSchema>;
export type SimBriefInput = z.infer<typeof simBriefSchema>;
export type CreateSimNoteInput = z.infer<typeof createSimNoteSchema>;
export type UpdateSimNoteInput = z.infer<typeof updateSimNoteSchema>;
