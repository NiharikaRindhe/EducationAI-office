import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Import Auth/Public Pages
import { Landing } from './routes/public/Landing';
import { Features } from './routes/public/Features';
import { Pricing } from './routes/public/Pricing';
import { Login } from './routes/auth/Login';
import { Register } from './routes/auth/Register';

// Import Batch 1 Pages
import { Batch1Layout } from './routes/batch1/Layout';
import { Batch1Home } from './routes/batch1/Home';
import { Batch1Stories } from './routes/batch1/Stories';
import { Batch1Exams } from './routes/batch1/Exams';
import { Batch1Progress } from './routes/batch1/Progress';
import { Batch1Tasks } from './routes/batch1/Tasks';
import { Batch1Games } from './routes/batch1/Games';
import {
  Batch1Badges,
  Batch1ShowAndTell,
  Batch1Streak,
  Batch1Profile
} from './routes/batch1/MinorPages';

// Import Batch 2 Pages
import { Batch2Layout } from './routes/batch2/Layout';
import { Batch2Home } from './routes/batch2/Home';
import { Batch2Subjects } from './routes/batch2/Subjects';
import { Batch2Chat } from './routes/batch2/Chat';
import { Batch2Exams } from './routes/batch2/Exams';
import {
  Batch2Notes,
  Batch2Pyq,
  Batch2Leaderboard,
  Batch2DailyChallenges,
  Batch2Streak,
  Batch2Badges,
  Batch2Profile
} from './routes/batch2/MinorPages';

// Import Batch 3 Pages
import { Batch3Layout } from './routes/batch3/Layout';
import { Batch3Home } from './routes/batch3/Home';
import { Batch3BoardPrep } from './routes/batch3/BoardPrep';
import { Batch3ConceptMap } from './routes/batch3/ConceptMap';
import { Batch3Pomodoro } from './routes/batch3/Pomodoro';
import {
  Batch3Subjects,
  Batch3Chat,
  Batch3DailyChallenges,
  Batch3Exams,
  Batch3Notes,
  Batch3Pyq,
  Batch3Streak,
  Batch3Profile
} from './routes/batch3/MinorPages';

// Import Teacher Pages
import { TeacherLayout } from './routes/teacher/Layout';
import { TeacherDashboard } from './routes/teacher/Dashboard';
import { TeacherStudents } from './routes/teacher/Students';
import { TeacherAssignTasks } from './routes/teacher/AssignTasks';
import { TeacherCreateExam } from './routes/teacher/CreateExam';
import { TeacherReports } from './routes/teacher/Reports';

// Import School Admin Pages
import { SchoolAdminLayout } from './routes/school-admin/Layout';
import { SchoolAdminDashboard } from './routes/school-admin/Dashboard';
import { SchoolAdminStudents } from './routes/school-admin/Students';
import { SchoolAdminTeachers } from './routes/school-admin/Teachers';

// Import Super Admin Pages
import { SuperAdminLayout } from './routes/super-admin/Layout';
import { SuperAdminSchools } from './routes/super-admin/Schools';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Public Marketing Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Batch 1 (Class 1-4) Dashboard Routes */}
            <Route
              path="/batch1"
              element={
                <ProtectedRoute allow={['student']}>
                  <Batch1Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/batch1/home" replace />} />
              <Route path="home" element={<Batch1Home />} />
              <Route path="stories" element={<Batch1Stories />} />
              <Route path="exams" element={<Batch1Exams />} />
              <Route path="progress" element={<Batch1Progress />} />
              <Route path="tasks" element={<Batch1Tasks />} />
              <Route path="games" element={<Batch1Games />} />
              <Route path="badges" element={<Batch1Badges />} />
              <Route path="show-and-tell" element={<Batch1ShowAndTell />} />
              <Route path="streak" element={<Batch1Streak />} />
              <Route path="profile" element={<Batch1Profile />} />
            </Route>

            {/* Student Batch 2 (Class 5-8) Dashboard Routes */}
            <Route
              path="/batch2"
              element={
                <ProtectedRoute allow={['student']}>
                  <Batch2Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/batch2/home" replace />} />
              <Route path="home" element={<Batch2Home />} />
              <Route path="subjects" element={<Batch2Subjects />} />
              <Route path="chat" element={<Batch2Chat />} />
              <Route path="exams" element={<Batch2Exams />} />
              <Route path="notes" element={<Batch2Notes />} />
              <Route path="pyq" element={<Batch2Pyq />} />
              <Route path="leaderboard" element={<Batch2Leaderboard />} />
              <Route path="daily-challenges" element={<Batch2DailyChallenges />} />
              <Route path="streak" element={<Batch2Streak />} />
              <Route path="badges" element={<Batch2Badges />} />
              <Route path="profile" element={<Batch2Profile />} />
            </Route>

            {/* Student Batch 3 (Class 9-10) Dashboard Routes */}
            <Route
              path="/batch3"
              element={
                <ProtectedRoute allow={['student']}>
                  <Batch3Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/batch3/home" replace />} />
              <Route path="home" element={<Batch3Home />} />
              <Route path="board-prep" element={<Batch3BoardPrep />} />
              <Route path="concept-map" element={<Batch3ConceptMap />} />
              <Route path="pomodoro" element={<Batch3Pomodoro />} />
              <Route path="subjects" element={<Batch3Subjects />} />
              <Route path="chat" element={<Batch3Chat />} />
              <Route path="daily-challenges" element={<Batch3DailyChallenges />} />
              <Route path="exams" element={<Batch3Exams />} />
              <Route path="notes" element={<Batch3Notes />} />
              <Route path="pyq" element={<Batch3Pyq />} />
              <Route path="streak" element={<Batch3Streak />} />
              <Route path="profile" element={<Batch3Profile />} />
            </Route>

            {/* Teacher Portal Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allow={['teacher']}>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="assign-tasks" element={<TeacherAssignTasks />} />
              <Route path="create-exam" element={<TeacherCreateExam />} />
              <Route path="reports" element={<TeacherReports />} />
            </Route>

            {/* School Admin Portal Routes */}
            <Route
              path="/school-admin"
              element={
                <ProtectedRoute allow={['school_admin']}>
                  <SchoolAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/school-admin/dashboard" replace />} />
              <Route path="dashboard" element={<SchoolAdminDashboard />} />
              <Route path="students" element={<SchoolAdminStudents />} />
              <Route path="teachers" element={<SchoolAdminTeachers />} />
            </Route>

            {/* Super Admin Portal Routes */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allow={['super_admin']}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/super-admin/schools" replace />} />
              <Route path="dashboard" element={<Navigate to="/super-admin/schools" replace />} />
              <Route path="schools" element={<SuperAdminSchools />} />
            </Route>

            {/* Catch-all fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
