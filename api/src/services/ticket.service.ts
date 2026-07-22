import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { AuthUser } from '../types/index.js';
import type { CreateTicketInput, ListTicketsQuery } from '../schemas/ticket.schema.js';

const TICKET_SELECT =
  'id, school_id, raised_by, raised_role, category, subject, body, status, priority, escalated_to_super, created_at, resolved_at, schools(name, code), raiser:user_profiles!support_tickets_raised_by_fkey(full_name)';

export async function createTicket(user: AuthUser, input: CreateTicketInput) {
  const schoolId = user.role === 'super_admin' ? (input.schoolId ?? null) : user.schoolId;
  if (user.role !== 'super_admin' && !schoolId) {
    throw new ApiError('FORBIDDEN', 'No school associated with this account');
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .insert({
      school_id: schoolId,
      raised_by: user.id,
      raised_role: user.role,
      category: input.category,
      subject: input.subject,
      body: input.body,
      priority: input.priority,
    })
    .select(TICKET_SELECT)
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to create ticket', error.message);
  return data;
}

export async function listTickets(user: AuthUser, filters: ListTicketsQuery) {
  let query = supabaseAdmin.from('support_tickets').select(TICKET_SELECT).order('created_at', { ascending: false });

  if (user.role === 'super_admin') {
    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    } else {
      // Default super-admin inbox: what's been escalated, plus anything
      // it raised itself — not every school's routine ticket traffic.
      query = query.or(`escalated_to_super.eq.true,raised_by.eq.${user.id}`);
    }
  } else if (user.role === 'school_admin') {
    if (!user.schoolId) throw new ApiError('FORBIDDEN', 'No school associated with this account');
    query = query.eq('school_id', user.schoolId);
  } else {
    // student / teacher / lab_incharge: only what they raised themselves.
    query = query.eq('raised_by', user.id);
  }

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.category) query = query.eq('category', filters.category);

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list tickets', error.message);
  return data;
}

async function assertTicketVisible(user: AuthUser, ticketId: string) {
  const { data: ticket, error } = await supabaseAdmin
    .from('support_tickets')
    .select('id, school_id, raised_by, escalated_to_super')
    .eq('id', ticketId)
    .single();

  if (error || !ticket) throw new ApiError('NOT_FOUND', 'Ticket not found');

  const visible =
    ticket.raised_by === user.id ||
    (user.role === 'school_admin' && ticket.school_id === user.schoolId) ||
    (user.role === 'super_admin' && (ticket.escalated_to_super || ticket.school_id === null));

  if (!visible) throw new ApiError('FORBIDDEN', 'You do not have access to this ticket');
  return ticket;
}

export async function getTicket(user: AuthUser, ticketId: string) {
  await assertTicketVisible(user, ticketId);

  const [{ data: ticket, error: ticketError }, { data: messages, error: messagesError }] = await Promise.all([
    supabaseAdmin.from('support_tickets').select(TICKET_SELECT).eq('id', ticketId).single(),
    supabaseAdmin
      .from('ticket_messages')
      .select('id, sender_id, body, created_at, sender:user_profiles(full_name, role)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true }),
  ]);

  if (ticketError || !ticket) throw new ApiError('NOT_FOUND', 'Ticket not found');
  if (messagesError) throw new ApiError('INTERNAL_ERROR', 'Failed to load ticket messages', messagesError.message);

  return { ...ticket, messages: messages ?? [] };
}

export async function addTicketMessage(user: AuthUser, ticketId: string, body: string) {
  await assertTicketVisible(user, ticketId);

  const { data, error } = await supabaseAdmin
    .from('ticket_messages')
    .insert({ ticket_id: ticketId, sender_id: user.id, body })
    .select('id, sender_id, body, created_at, sender:user_profiles(full_name, role)')
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to send message', error.message);
  return data;
}

function assertCanTriage(user: AuthUser, ticket: { school_id: string | null }) {
  const canTriage =
    user.role === 'super_admin' || (user.role === 'school_admin' && ticket.school_id === user.schoolId);
  if (!canTriage) throw new ApiError('FORBIDDEN', 'Only the owning school admin or a super admin can do this');
}

export async function updateTicketStatus(user: AuthUser, ticketId: string, status: string) {
  const ticket = await assertTicketVisible(user, ticketId);
  assertCanTriage(user, ticket);

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .update({ status, resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null })
    .eq('id', ticketId)
    .select(TICKET_SELECT)
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update ticket status', error.message);
  return data;
}

export async function escalateTicket(user: AuthUser, ticketId: string) {
  const ticket = await assertTicketVisible(user, ticketId);
  if (user.role !== 'school_admin' || ticket.school_id !== user.schoolId) {
    throw new ApiError('FORBIDDEN', 'Only the owning school admin can escalate a ticket');
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .update({ escalated_to_super: true })
    .eq('id', ticketId)
    .select(TICKET_SELECT)
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to escalate ticket', error.message);
  return data;
}
