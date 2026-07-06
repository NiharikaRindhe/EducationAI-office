import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const Batch1Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // ProtectedRoute already guarantees an authenticated student got here;
  // this layout's own job is just making sure they're in the RIGHT batch
  // (a Class 7 student navigating to /batch1/* shouldn't see Class 1-4 UI).
  const { batchId, currentClass, studentAvatar, studentName } = useApp();

  useEffect(() => {
    if (currentClass < 1 || currentClass > 4) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  const navItems: NavItem[] = [
    { href: '/batch1/home', label: 'Home', iconName: 'home' },
    { href: '/batch1/stories', label: 'Stories', iconName: 'menu_book' },
    { href: '/batch1/exams', label: 'Mini Quizzes', iconName: 'star' },
    { href: '/batch1/progress', label: 'My Progress', iconName: 'trending_up' },
    { href: '/batch1/tasks', label: 'My Tasks', iconName: 'assignment_turned_in' },
    { href: '/batch1/games', label: 'Games', iconName: 'sports_esports' },
    { href: '/batch1/badges', label: 'Badges', iconName: 'military_tech' },
    { href: '/batch1/show-and-tell', label: 'Show & Tell', iconName: 'mic' },
    { href: '/batch1/streak', label: 'My Streak', iconName: 'local_fire_department' },
    { href: '/batch1/profile', label: 'Profile', iconName: 'person' }
  ];

  // Map route path to page header titles
  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/stories')) return { title: 'Story Reader', sub: 'Read stories, listen to narration, and take star quizzes!' };
    if (path.includes('/exams')) return { title: 'Mini Quizzes & Tests', sub: 'Collect 3 stars in every quiz to show your skills!' };
    if (path.includes('/progress')) return { title: 'My Progress Tracker', sub: 'Check your scores and activity levels this week.' };
    if (path.includes('/tasks')) return { title: 'Task Manager', sub: 'Complete assigned tasks to earn bonus XP!' };
    if (path.includes('/games')) return { title: 'Game Gallery', sub: 'Play interactive games to practice spelling & counting.' };
    if (path.includes('/badges')) return { title: 'Badge Collection', sub: 'Unlock beautiful badges by completing lessons.' };
    if (path.includes('/show-and-tell')) return { title: 'Vision AI Show & Tell', sub: 'Upload any object and get fun scientific facts!' };
    if (path.includes('/streak')) return { title: 'Streak Heatmap', sub: 'Do not break your daily study streak calendar!' };
    if (path.includes('/profile')) return { title: 'Student Profile', sub: 'Change your nickname or customize your emoji avatar.' };
    return { title: 'Dashboard Home', sub: 'Welcome back! Ready to learn something new today?' };
  };

  const header = getHeaderDetails();

  if (currentClass < 1 || currentClass > 4) return null;

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Sidebar Navigation */}
      <Sidebar 
        navItems={navItems}
        batchColor="amber"
        logoText="EduAI"
        logoIcon="sports_esports"
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        <TopBar 
          greeting="Good morning,"
          userName={studentName}
          subtitle={header.sub}
          batchColor="amber"
          userAvatar={studentAvatar}
          profileHref="/batch1/profile"
        />

        {/* Dynamic page container */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
