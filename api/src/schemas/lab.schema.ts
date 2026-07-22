import { z } from 'zod';

export const createLabSchema = z.object({
  name: z.string().trim().min(1).max(60),
  seatCapacity: z.number().int().min(1).max(200).default(30),
  location: z.string().trim().max(120).optional(),
});
export type CreateLabInput = z.infer<typeof createLabSchema>;

export const updateLabSchema = createLabSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateLabInput = z.infer<typeof updateLabSchema>;
