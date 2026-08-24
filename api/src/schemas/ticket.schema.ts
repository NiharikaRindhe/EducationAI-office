import { z } from 'zod';

export const ticketCategorySchema = z.enum(['account', 'content', 'technical', 'ai', 'other']);
export const ticketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);
export const ticketPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export const ticketRaisedRoleSchema = z.enum(['student', 'teacher', 'school_admin', 'lab_incharge', 'super_admin']);

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
  // Who raised it — School Admin vs Teacher vs Student, etc. (item #25, UI
  // testing pass Aug 24 2026: "View Raised Tickets By").
  raisedRole: ticketRaisedRoleSchema.optional(),
});
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;

export const updateTicketStatusSchema = z.object({
  status: ticketStatusSchema,
});

// Same-issue-across-many-tickets bulk close/resolve (item #29). Capped well
// below any real-world "select all" size, both as a sanity limit and so one
// bad request can't turn into hundreds of sequential single-ticket updates.
export const bulkUpdateTicketStatusSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1).max(100),
  status: ticketStatusSchema,
});
export type BulkUpdateTicketStatusInput = z.infer<typeof bulkUpdateTicketStatusSchema>;

export const addTicketMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});
