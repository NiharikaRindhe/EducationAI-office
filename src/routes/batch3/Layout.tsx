import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const Batch3Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, currentClass, login, studentAvatar, studentName } = useApp();

  useEffect(() => {
    if (userRole !== 'student' || currentClass < 9 || currentClass > 10) {
      if (userRole === 'teacher') navigate('/teacher/dashboard');
      else if (userRole === 'parent') navigate('/parent/dashboard');
      else if (userRole === 'student') {
        // Auto-switch to Batch 3 demo student profile instead of redirecting!
        login('student', 9, 'Arjun', '🦁');
      } else {
        navigate('/login');
      }
    }
  }, [userRole, currentClass, navigate, login]);

  const navItems: NavItem[] = [
    { href: '/batch3/home', label: 'Home', iconName: 'home' },
    { href: '/batch3/subjects', label: 'Subjects', iconName: 'library_books' },
    { href: '/batch3/concept-map', label: 'Concept Map', iconName: 'schema' },
    { href: '/batch3/board-prep', label: 'Board Prep', iconName: 'event_upcoming' },
    { href: '/batch3/chat', label: 'AI Doubt Tutor', iconName: 'chat' },
    { href: '/batch3/daily-challenges', label: 'Daily Challenges', iconName: 'electric_bolt' },
    { href: '/batch3/exams', label: 'Exams & Mocks', iconName: 'edit_document' },
    { href: '/batch3/notes', label: 'Study Notes', iconName: 'sticky_note_2' },
    { href: '/batch3/pyq', label: 'Board PYQ Hub', iconName: 'bookmark' },
    { href: '/batch3/pomodoro', label: 'Pomodoro Timer', iconName: 'timer' },
    { href: '/batch3/streak', label: 'Streak', iconName: 'local_fire_department' },
    { href: '/batch3/profile', label: 'Profile', iconName: 'person' }
  ];

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/subjects')) return { title: 'Subjects & Units', sub: 'NCERT CBSE syllabus checklist with Board tags.' };
    if (path.includes('/concept-map')) return { title: 'Interactive Concept Maps', sub: 'Visualize logical connections between chapter topics.' };
    if (path.includes('/board-prep')) return { title: 'CBSE Board Prep Zone', sub: 'Syllabus weightage trends, past papers, and answer tips.' };
    if (path.includes('/chat')) return { title: 'AI Doubt Solver', sub: 'Step-by-step problem solver with LaTeX support.' };
    if (path.includes('/daily-challenges')) return { title: 'CBSE Daily Challenges', sub: 'Practice HOTS, Case Study, and Assertion & Reason questions.' };
    if (path.includes('/exams')) return { title: 'Practice Exams', sub: 'CBSE Board exam pattern mock tests.' };
    if (path.includes('/notes')) return { title: 'Board Study Notes', sub: 'Create notes, tag board topics, and generate summaries.' };
    if (path.includes('/pyq')) return { title: 'Board PYQ Papers', sub: 'CBSE past year papers with examiner schemes.' };
    if (path.includes('/pomodoro')) return { title: 'Pomodoro Focus Timer', sub: 'Utilize 25/5 or 50/10 focus intervals to track study times.' };
    if (path.includes('/streak')) return { title: 'Streak tracker', sub: 'Streak calendar tied to board prep milestones.' };
    if (path.includes('/profile')) return { title: 'Syllabus Profile', sub: 'View board readiness progress levels.' };
    return { title: 'Board prep dashboard', sub: 'Ready to prepare for Class 10 Board Exams?' };
  };

  const header = getHeaderDetails();

  if (userRole !== 'student') return null;

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Sidebar Navigation */}
      <Sidebar 
        navItems={navItems}
        batchColor="sky"
        logoText="EduAI"
        logoIcon="auto_stories"
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        <TopBar 
          greeting="Study Workspace,"
          userName={studentName}
          subtitle={header.sub}
          batchColor="sky"
          userAvatar={studentAvatar}
          profileHref="/batch3/profile"
        />

        {/* Dynamic page container */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
