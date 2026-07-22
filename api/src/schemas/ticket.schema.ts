import { z } from 'zod';

export const ticketCategorySchema = z.enum(['account', 'content', 'technical', 'ai', 'other']);
export const ticketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);
export const ticketPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

export const createTicketSchema = z.object({
  category: ticketCategorySchema,
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  priority: ticketPrioritySchema.default('normal'),
  // Only honoured for a super_admin raising a ticket against a specific
  // school; every other role's ticket is pinned to their own school_id.
  schoolId: z.string().uuid().optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const listTicketsQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  category: ticketCategorySchema.optional(),
  schoolId: z.string().uuid().optional(),
});
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;

export const updateTicketStatusSchema = z.object({
  status: ticketStatusSchema,
});

export const addTicketMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});
