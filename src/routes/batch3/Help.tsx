import React from 'react';
import { TicketsInbox } from '../../components/shared/TicketsInbox';

/** Student support channel (Classes 9-10). See batch2/Help.tsx. */
export const Batch3Help: React.FC = () => (
  <TicketsInbox accentColor="sky" canTriage={false} canEscalate={false} showSchoolFilter={false} fixedSchool />
);
