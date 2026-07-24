import React from 'react';
import { useLocation } from 'react-router-dom';
import { TicketsInbox } from '../../components/shared/TicketsInbox';

interface TicketDraft {
  category: 'account' | 'content' | 'technical' | 'ai' | 'other';
  subject: string;
  body: string;
}

export const SchoolAdminTickets: React.FC = () => {
  const location = useLocation();
  const initialDraft = (location.state as { prefillTicket?: TicketDraft } | null)?.prefillTicket;

  return (
    <TicketsInbox accentColor="rose" canTriage canEscalate showSchoolFilter={false} fixedSchool initialDraft={initialDraft} />
  );
};
