import React, { lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { EnvironmentBanner } from './components/shared/EnvironmentBanner';

// Import Auth/Public Pages
import { Landing } from './routes/public/Landing';
import { Features } from './routes/public/Features';
import { Pricing } from './routes/public/Pricing';
import { Login } from './routes/auth/Login';
import { Register } from './routes/auth/Register';
import { NotFound } from './routes/public/NotFound';

// Import Batch 1 Pages
import { Batch1Layout } from './routes/batch1/Layout';
import { Batch1Home } from './routes/batch1/Home';
import { Batch1Stories } from './routes/batch1/Stories';
import { Batch1Quizzes } from './routes/batch1/Quizzes';
import { Batch1Tasks } from './routes/batch1/Tasks';
import { Batch1Games } from './routes/batch1/Games';
import { Batch1MyStuff } from './routes/batch1/MyStuff';
import { Batch1Syllabus } from './routes/batch1/Syllabus';

// Import Batch 2 Pages
import { Batch2Layout } from './routes/batch2/Layout';
import { Batch2Home } from './routes/batch2/Home';
import { Batch2Subjects } from './routes/batch2/Subjects';
import { Batch2Chat } from './routes/batch2/Chat';
import { Batch2Exams } from './routes/batch2/Exams';
import { Batch2Tasks } from './routes/batch2/Tasks';
import { Batch2Help } from './routes/batch2/Help';
import {
  Batch2Notes,
  Batch2Pyq,
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
import { Batch3ScienceLabs } from './routes/batch3/ScienceLabs';
/* Class 9-10 science labs — ported from EducationAI-Games-master. They render
   inside Batch3Layout so the dashboard sidebar/topbar stay in place; the
   .lab-embed rules in index.css size their viewport-based roots to the content
   area. Lazy-loaded so the simulation/diagram code stays out of the main
   bundle for students who never open a lab. */
const BioHub = lazy(() => import('./routes/batch3/labs/Biology/BioHub'));
const BiologyModule = lazy(() => import('./routes/batch3/labs/Biology/BiologyModule'));
const ChemistryLab = lazy(() => import('./routes/batch3/labs/Chemistry/Lab/Lab'));
const PeriodicTable = lazy(() => import('./routes/batch3/labs/Chemistry/PeriodicTable'));
const TeacherQuestionBuilder = lazy(() => import('./routes/batch3/labs/Chemistry/Lab/TeacherQuestionBuilder'));
const PhysicsHub = lazy(() => import('./routes/batch3/labs/Physics/PhysicsHub/PhysicsHub'));
const PhysicsLab = lazy(() => import('./routes/batch3/labs/Physics/PhysicsLab'));
const FrictionSimulator = lazy(() => import('./routes/batch3/labs/Physics/FrictionSimulator/FrictionSimulator'));
const SoundWaveTank = lazy(() => import('./routes/batch3/labs/Physics/SoundWave/SoundWaveTank'));
import { Batch3Pomodoro } from './routes/batch3/Pomodoro';
import { Batch3Tasks } from './routes/batch3/Tasks';
import { Batch3Help } from './routes/batch3/Help';
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

// Import Super Admin Pages
import { SuperAdminLayout } from './routes/super-admin/Layout';
import { SuperAdminSchools } from './routes/super-admin/Schools';
import { SuperAdminContentPortal } from './routes/super-admin/ContentPortal';
import { SuperAdminOverview } from './routes/super-admin/Overview';
import { SuperAdminAiConsole } from './routes/super-admin/AiConsole';
import { SuperAdminTickets } from './routes/super-admin/Tickets';
import { SuperAdminSchoolDetail } from './routes/super-admin/SchoolDetail';
import { SuperAdminSchoolOnboarding } from './routes/super-admin/SchoolOnboarding';
import { SuperAdminAuditLog } from './routes/super-admin/AuditLog';
import { SuperAdminStudents } from './routes/super-admin/Students';

// Import Teacher Pages
import { TeacherLayout } from './routes/teacher/Layout';
import { TeacherDashboard } from './routes/teacher/Dashboard';
import { TeacherLiveSession } from './routes/teacher/LiveSession';
import { TeacherTimetable } from './routes/teacher/Timetable';
import { TeacherStudents } from './routes/teacher/Students';
import { TeacherAssignTasks } from './routes/teacher/AssignTasks';
import { TeacherCreateExam } from './routes/teacher/CreateExam';
import { TeacherExamReview } from './routes/teacher/ExamReview';
import { TeacherReports } from './routes/teacher/Reports';
import { TeacherQuestionBank } from './routes/teacher/QuestionBank';
import { TeacherTickets } from './routes/teacher/Tickets';

// Import School Admin Pages
import { SchoolAdminLayout } from './routes/school-admin/Layout';
import { SchoolAdminDashboard } from './routes/school-admin/Dashboard';
import { SchoolAdminClassesSections } from './routes/school-admin/ClassesSections';
import { SchoolAdminStudents } from './routes/school-admin/Students';
import { SchoolAdminTeachers } from './routes/school-admin/Teachers';
import { SchoolAdminLabIncharges } from './routes/school-admin/LabIncharges';
import { SchoolAdminLabs } from './routes/school-admin/Labs';
import { SchoolAdminTimetable } from './routes/school-admin/Timetable';
import { SchoolAdminFeatureToggles } from './routes/school-admin/FeatureToggles';
import { SchoolAdminPrincipalReport } from './routes/school-admin/PrincipalReport';
import { SchoolAdminPromotion } from './routes/school-admin/Promotion';
import { SchoolAdminTickets } from './routes/school-admin/Tickets';
import { SchoolAdminContentLibrary } from './routes/school-admin/ContentLibrary';
import { SchoolAdminBranding } from './routes/school-admin/Branding';

// Import Lab In-charge Pages
import { LabInchargeLayout } from './routes/lab-incharge/Layout';
import { LabInchargeDashboard } from './routes/lab-incharge/Dashboard';
import { LabInchargeStudents } from './routes/lab-incharge/Students';
import { LabInchargeTeachers } from './routes/lab-incharge/Teachers';

function App() {
  return (
    <ErrorBoundary>
      {/* Outside the Router so it renders on every route, including login and
          the public marketing pages. Renders nothing when VITE_ENV_LABEL is
          unset, which is what production does. */}
      <EnvironmentBanner />
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
              <Route path="exams" element={<Batch1Quizzes />} />
              <Route path="tasks" element={<Batch1Tasks />} />
              <Route path="games" element={<Batch1Games />} />
              <Route path="my-stuff" element={<Batch1MyStuff />} />
              <Route path="syllabus" element={<Batch1Syllabus />} />
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
              <Route path="tasks" element={<Batch2Tasks />} />
              <Route path="notes" element={<Batch2Notes />} />
              <Route path="pyq" element={<Batch2Pyq />} />
              <Route path="daily-challenges" element={<Batch2DailyChallenges />} />
              <Route path="streak" element={<Batch2Streak />} />
              <Route path="badges" element={<Batch2Badges />} />
              <Route path="profile" element={<Batch2Profile />} />
              <Route path="help" element={<Batch2Help />} />
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
              <Route path="tasks" element={<Batch3Tasks />} />
              <Route path="notes" element={<Batch3Notes />} />
              <Route path="pyq" element={<Batch3Pyq />} />
              <Route path="streak" element={<Batch3Streak />} />
              <Route path="profile" element={<Batch3Profile />} />
              <Route path="help" element={<Batch3Help />} />

              {/* Class 9-10 science labs. Rendered inside this layout so the
                  dashboard sidebar/topbar stay put; Batch3Layout gives lab
                  routes a full-bleed, fixed-height content area. */}
              <Route path="labs" element={<Batch3ScienceLabs />} />
              {/* Biology */}
              <Route path="labs/biology" element={<BioHub />} />
              <Route path="labs/biology/diagram-hub" element={<BiologyModule />} />
              {/* Chemistry */}
              <Route path="labs/chemistry" element={<ChemistryLab />} />
              <Route path="labs/chemistry/periodic-table" element={<PeriodicTable />} />
              <Route path="labs/chemistry/teacher" element={<TeacherQuestionBuilder />} />
              {/* Physics */}
              <Route path="labs/physics" element={<PhysicsHub />} />
              <Route path="labs/physics/motion" element={<PhysicsLab />} />
              <Route path="labs/physics/friction" element={<FrictionSimulator />} />
              <Route path="labs/physics/sound" element={<SoundWaveTank />} />
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
              <Route path="live-session" element={<TeacherLiveSession />} />
              <Route path="timetable" element={<TeacherTimetable />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="assign-tasks" element={<TeacherAssignTasks />} />
              <Route path="create-exam" element={<TeacherCreateExam />} />
              <Route path="exams/:examId/review" element={<TeacherExamReview />} />
              <Route path="reports" element={<TeacherReports />} />
              <Route path="question-bank" element={<TeacherQuestionBank />} />
              <Route path="tickets" element={<TeacherTickets />} />
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
              <Route path="classes" element={<SchoolAdminClassesSections />} />
              <Route path="students" element={<SchoolAdminStudents />} />
              <Route path="teachers" element={<SchoolAdminTeachers />} />
              <Route path="lab-incharges" element={<SchoolAdminLabIncharges />} />
              <Route path="labs" element={<SchoolAdminLabs />} />
              <Route path="timetable" element={<SchoolAdminTimetable />} />
              <Route path="content" element={<SchoolAdminContentLibrary />} />
              <Route path="feature-toggles" element={<SchoolAdminFeatureToggles />} />
              <Route path="branding" element={<SchoolAdminBranding />} />
              <Route path="principal-report" element={<SchoolAdminPrincipalReport />} />
              <Route path="promotion" element={<SchoolAdminPromotion />} />
              <Route path="tickets" element={<SchoolAdminTickets />} />
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
              <Route index element={<Navigate to="/super-admin/overview" replace />} />
              <Route path="dashboard" element={<Navigate to="/super-admin/overview" replace />} />
              <Route path="overview" element={<SuperAdminOverview />} />
              <Route path="schools" element={<SuperAdminSchools />} />
              {/* Declared before :schoolId so "new" isn't captured as an id. */}
              <Route path="schools/new" element={<SuperAdminSchoolOnboarding />} />
              <Route path="schools/:schoolId" element={<SuperAdminSchoolDetail />} />
              <Route path="students" element={<SuperAdminStudents />} />
              <Route path="content" element={<SuperAdminContentPortal />} />
              <Route path="ai-console" element={<SuperAdminAiConsole />} />
              <Route path="tickets" element={<SuperAdminTickets />} />
              <Route path="audit-log" element={<SuperAdminAuditLog />} />
            </Route>

            {/* Lab In-charge Portal Routes */}
            <Route
              path="/lab-incharge"
              element={
                <ProtectedRoute allow={['lab_incharge']}>
                  <LabInchargeLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/lab-incharge/dashboard" replace />} />
              <Route path="dashboard" element={<LabInchargeDashboard />} />
              <Route path="students" element={<LabInchargeStudents />} />
              <Route path="teachers" element={<LabInchargeTeachers />} />
            </Route>

            {/* Unknown URL. Shows a real 404 rather than bouncing a signed-in
                user to the marketing page as if they'd been logged out. */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
