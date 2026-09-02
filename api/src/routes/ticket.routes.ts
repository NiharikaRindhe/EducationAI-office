import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createTicketController,
  listTicketsController,
  getTicketController,
  addTicketMessageController,
  updateTicketStatusController,
  bulkUpdateTicketStatusController,
  escalateTicketController,
} from '../controllers/ticket.controller.js';

// Teachers and school admins can raise issues. Super admins retain access to
// triage escalated tickets, but students and lab in-charges cannot create one.
export const ticketRouter = Router();

ticketRouter.use(requireAuth);

ticketRouter.post('/', requireRole('teacher', 'school_admin'), createTicketController);
ticketRouter.get('/', listTicketsController);
// Literal path first — /:id below would otherwise swallow /bulk/status
// with id='bulk'.
ticketRouter.patch('/bulk/status', bulkUpdateTicketStatusController);
ticketRouter.get('/:id', getTicketController);
ticketRouter.post('/:id/messages', addTicketMessageController);
ticketRouter.patch('/:id/status', updateTicketStatusController);
ticketRouter.patch('/:id/escalate', escalateTicketController);
