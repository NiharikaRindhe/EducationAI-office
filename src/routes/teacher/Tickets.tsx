import React from 'react';
import { TicketsInbox } from '../../components/shared/TicketsInbox';

export const TeacherTickets: React.FC = () => (
  <TicketsInbox accentColor="indigo" canTriage={false} canEscalate={false} showSchoolFilter={false} fixedSchool />
);
