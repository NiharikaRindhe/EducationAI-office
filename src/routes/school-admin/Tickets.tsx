import React from 'react';
import { TicketsInbox } from '../../components/shared/TicketsInbox';

export const SchoolAdminTickets: React.FC = () => (
  <TicketsInbox accentColor="rose" canTriage canEscalate showSchoolFilter={false} fixedSchool />
);
