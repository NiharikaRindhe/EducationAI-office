import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const Batch4Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, currentClass, login, studentAvatar, studentName } = useApp();

  useEffect(() => {
    if (userRole !== 'student' || currentClass < 11 || currentClass > 12) {
      if (userRole === 'teacher') navigate('/teacher/dashboard');
      else if (userRole === 'parent') navigate('/parent/dashboard');
      else if (userRole === 'student') {
        // Auto-switch to Batch 4 demo student profile instead of redirecting!
        login('student', 12, 'Sneha', '🦄');
      } else {
        navigate('/login');
      }
    }
  }, [userRole, currentClass, navigate, login]);

  const navItems: NavItem[] = [
    { href: '/batch4/home', label: 'Home', iconName: 'home' },
    { href: '/batch4/jee-neet-prep', label: 'JEE/NEET Hub', iconName: 'target' },
    { href: '/batch4/schedule-planner', label: 'Study Planner', iconName: 'event_note' },
    { href: '/batch4/subjects', label: 'Subjects', iconName: 'library_books' },
    { href: '/batch4/chat', label: 'AI Doubt Tutor', iconName: 'chat' },
    { href: '/batch4/concept-map', label: 'Concept Map', iconName: 'schema' },
    { href: '/batch4/career', label: 'Career Path AI', iconName: 'school' },
    { href: '/batch4/weightage', label: 'Topic Weightage', iconName: 'bar_chart' },
    { href: '/batch4/exams', label: 'Mock Exams', iconName: 'edit_document' },
    { href: '/batch4/notes', label: 'Study Notes', iconName: 'sticky_note_2' },
    { href: '/batch4/pyq', label: 'JEE/NEET PYQs', iconName: 'bookmark' },
    { href: '/batch4/pomodoro', label: 'Pomodoro', iconName: 'timer' },
    { href: '/batch4/streak', label: 'Streak', iconName: 'local_fire_department' },
    { href: '/batch4/profile', label: 'Profile', iconName: 'person' }
  ];

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/jee-neet-prep')) return { title: 'JEE/NEET Entrance Hub', sub: 'Predict ranks, check subject cutoffs, and view topic weightage models.' };
    if (path.includes('/schedule-planner')) return { title: 'AI Study Planner', sub: 'Generate custom study plans and log focus hours.' };
    if (path.includes('/subjects')) return { title: 'NCERT Core Syllabus', sub: 'Advanced Physics, Chemistry, Mathematics & Biology checklist.' };
    if (path.includes('/chat')) return { title: 'AI Problem Solver', sub: 'Solve complex equations with detailed LaTeX steps.' };
    if (path.includes('/concept-map')) return { title: 'Logical Concept Maps', sub: 'Map connections across high-weightage topics.' };
    if (path.includes('/career')) return { title: 'Career Guidance AI', sub: 'Evaluate scores to suggest engineering and medical college lines.' };
    if (path.includes('/weightage')) return { title: 'CBSE / Entrance Weightage', sub: 'Sorted list of chapters appearing in recent competitive papers.' };
    if (path.includes('/exams')) return { title: 'Entrance Mock Tests', sub: 'JEE/NEET sectional and full-length mock examinations.' };
    if (path.includes('/notes')) return { title: 'Class 11/12 Study Notes', sub: 'Study formulas and highlight crucial chapters.' };
    if (path.includes('/pyq')) return { title: 'Past Year Papers', sub: 'Official JEE/NEET questions archive.' };
    if (path.includes('/pomodoro')) return { title: 'Pomodoro Focus Timer', sub: 'Set study/break intervals matching mock patterns.' };
    if (path.includes('/streak')) return { title: 'Activity Heatmap', sub: 'Streak calendar logs for daily entrance prep.' };
    if (path.includes('/profile')) return { title: 'Student Profile', sub: 'View competitive examination readiness indicators.' };
    return { title: 'Entrance Prep Workspace', sub: 'Ready to study for JEE/NEET Entrance Exams?' };
  };

  const header = getHeaderDetails();

  if (userRole !== 'student') return null;

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Sidebar Navigation */}
      <Sidebar 
        navItems={navItems}
        batchColor="slate"
        logoText="EduAI"
        logoIcon="calculate"
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        <TopBar 
          greeting="Entrance Prep,"
          userName={studentName}
          subtitle={header.sub}
          batchColor="slate"
          userAvatar={studentAvatar}
          profileHref="/batch4/profile"
        />

        {/* Dynamic page container */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
