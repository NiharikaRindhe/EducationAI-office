import React from 'react';
import { TicketsInbox } from '../../components/shared/TicketsInbox';

/**
 * Student support channel (Classes 5-8).
 *
 * Teachers, school admins and lab in-charges all had a way to report a
 * problem; students — the people actually sitting at the broken lab PC, or
 * locked out of an exam — had none. Tickets are already cross-role on the
 * server (`/api/tickets`, visibility scoped per role in ticket.service.ts), so
 * a student raises a ticket that only they and their school admin can see.
 */
export const Batch2Help: React.FC = () => (
  <TicketsInbox accentColor="indigo" canTriage={false} canEscalate={false} showSchoolFilter={false} fixedSchool />
);
