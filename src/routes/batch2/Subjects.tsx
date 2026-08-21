import React from 'react';
import { SyllabusView } from '../../components/shared/SyllabusView';

// Class 5-8 syllabus. Previously a hardcoded chapter list with invented
// per-chapter scores; now reads the school's real indexed books via
// GET /student/syllabus. See components/shared/SyllabusView.tsx.
export const Batch2Subjects: React.FC = () => (
  <SyllabusView accent="indigo" chatHref="/batch2/chat" practiceHref="/batch2/activities" />
);
