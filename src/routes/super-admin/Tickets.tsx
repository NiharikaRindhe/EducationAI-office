import React from 'react';
import { TicketsInbox } from '../../components/shared/TicketsInbox';

export const SuperAdminTickets: React.FC = () => (
  <TicketsInbox accentColor="slate" canTriage canEscalate={false} showSchoolFilter fixedSchool={false} />
);
