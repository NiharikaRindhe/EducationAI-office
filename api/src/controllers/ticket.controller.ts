import type { Request, Response, NextFunction } from 'express';
import * as ticketService from '../services/ticket.service.js';
import { ApiError } from '../lib/errors.js';
import { createTicketSchema, listTicketsQuerySchema, updateTicketStatusSchema, addTicketMessageSchema } from '../schemas/ticket.schema.js';

function requireUser(req: Request) {
  if (!req.user) throw new ApiError('UNAUTHORIZED', 'Not authenticated');
  return req.user;
}

export async function createTicketController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const input = createTicketSchema.parse(req.body);
    const ticket = await ticketService.createTicket(user, input);
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
}

export async function listTicketsController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const filters = listTicketsQuerySchema.parse(req.query);
    const tickets = await ticketService.listTickets(user, filters);
    res.json(tickets);
  } catch (err) {
    next(err);
  }
}

export async function getTicketController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing ticket id');
    const ticket = await ticketService.getTicket(user, id);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}

export async function addTicketMessageController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing ticket id');
    const { body } = addTicketMessageSchema.parse(req.body);
    const message = await ticketService.addTicketMessage(user, id, body);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

export async function updateTicketStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing ticket id');
    const { status } = updateTicketStatusSchema.parse(req.body);
    const ticket = await ticketService.updateTicketStatus(user, id, status);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}

export async function escalateTicketController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Missing ticket id');
    const ticket = await ticketService.escalateTicket(user, id);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}
