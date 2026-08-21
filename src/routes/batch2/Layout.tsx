import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth, type FeatureKey } from '../../context/AuthContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const Batch2Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId, currentClass, studentAvatar, studentName } = useApp();
  const { hasFeature } = useAuth();

  useEffect(() => {
    if (currentClass < 5 || currentClass > 8) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  const navItems: NavItem[] = ([
    { href: '/batch2/home', label: 'Home', iconName: 'home' },
    { href: '/batch2/subjects', label: 'Subjects', iconName: 'library_books' },
    { href: '/batch2/activities', label: 'Activities', iconName: 'extension' },
    { href: '/batch2/chat', label: 'AI Doubt Tutor', iconName: 'chat', feature: 'ai_tutor' },
    { href: '/batch2/exams', label: 'Exams & Mocks', iconName: 'edit_document' },
    { href: '/batch2/tasks', label: 'My Tasks', iconName: 'assignment_turned_in' },
    { href: '/batch2/notes', label: 'Study Notes', iconName: 'sticky_note_2' },
    { href: '/batch2/pyq', label: 'PYQ Hub', iconName: 'bookmark', feature: 'pyq_hub' },
    { href: '/batch2/daily-challenges', label: 'Daily Challenges', iconName: 'electric_bolt' },
    { href: '/batch2/streak', label: 'Streak Tracker', iconName: 'local_fire_department' },
    { href: '/batch2/badges', label: 'My Badges', iconName: 'military_tech' },
    { href: '/batch2/profile', label: 'Profile', iconName: 'person' },
    { href: '/batch2/help', label: 'Report an Issue', iconName: 'confirmation_number' }
  ] as (NavItem & { feature?: FeatureKey })[])
    .filter((item) => !item.feature || hasFeature(item.feature));

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/subjects')) return { title: 'Subjects & Chapters', sub: 'Complete your NCERT syllabus and take practice sets.' };
    if (path.includes('/activities')) return { title: 'Activities', sub: 'Practice every subject in textbook chapter order.' };
    if (path.includes('/chat')) return { title: 'AI Doubt Solver', sub: 'Ask questions about mathematics and science formulas!' };
    if (path.includes('/exams')) return { title: 'Mock Exams', sub: 'Complete term exams and test your readiness.' };
    if (path.includes('/tasks')) return { title: 'My Tasks', sub: 'Complete work your teacher has assigned to earn XP.' };
    if (path.includes('/notes')) return { title: 'Study Notes Manager', sub: 'Organize and review your study notes.' };
    if (path.includes('/pyq')) return { title: 'PYQ Hub', sub: 'Attempt past board papers and review solutions.' };
    if (path.includes('/daily-challenges')) return { title: 'Daily Challenges', sub: 'Solve CBSE pattern questions to win double XP!' };
    if (path.includes('/streak')) return { title: 'Streak Tracker', sub: 'View daily activity records and heatmap milestones.' };
    if (path.includes('/badges')) return { title: 'Academic Badges', sub: 'Check unlocked achievements for subject toppers.' };
    if (path.includes('/profile')) return { title: 'Profile Settings', sub: 'Manage nickname and view performance analytics.' };
    return { title: 'Dashboard Home', sub: 'Ready to master your chapters today?' };
  };

  const header = getHeaderDetails();

  if (currentClass < 5 || currentClass > 8) return null;

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Sidebar Navigation */}
      <Sidebar 
        navItems={navItems}
        batchColor="indigo"
        logoText="EduAI"
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        <TopBar 
          greeting="Welcome back,"
          userName={studentName}
          subtitle={header.sub}
          batchColor="indigo"
          userAvatar={studentAvatar}
          profileHref="/batch2/profile"
        />

        {/* Dynamic page container */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
