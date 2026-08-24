import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createTicketController,
  listTicketsController,
  getTicketController,
  addTicketMessageController,
  updateTicketStatusController,
  bulkUpdateTicketStatusController,
  escalateTicketController,
} from '../controllers/ticket.controller.js';

// Cross-role: every authenticated role can raise and view its own tickets;
// school_admin/super_admin get broader visibility (enforced in the service).
export const ticketRouter = Router();

ticketRouter.use(requireAuth);

ticketRouter.post('/', createTicketController);
ticketRouter.get('/', listTicketsController);
// Literal path first — /:id below would otherwise swallow /bulk/status
// with id='bulk'.
ticketRouter.patch('/bulk/status', bulkUpdateTicketStatusController);
ticketRouter.get('/:id', getTicketController);
ticketRouter.post('/:id/messages', addTicketMessageController);
ticketRouter.patch('/:id/status', updateTicketStatusController);
ticketRouter.patch('/:id/escalate', escalateTicketController);
