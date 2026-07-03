import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

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

// Import Batch 4 Pages
import { Batch4Layout } from './routes/batch4/Layout';
import { Batch4Onboarding } from './routes/batch4/Onboarding';
import { Batch4Home } from './routes/batch4/Home';
import { Batch4JeeNeetPrep } from './routes/batch4/JeeNeetPrep';
import { Batch4SchedulePlanner } from './routes/batch4/SchedulePlanner';
import { Batch4CareerPath } from './routes/batch4/CareerPath';
import { 
  Batch4Subjects, 
  Batch4Chat, 
  Batch4ConceptMap, 
  Batch4Exams, 
  Batch4Notes, 
  Batch4Pyq, 
  Batch4Pomodoro, 
  Batch4Streak, 
  Batch4Weightage, 
  Batch4Profile 
} from './routes/batch4/MinorPages';

// Import Teacher Pages
import { TeacherLayout } from './routes/teacher/Layout';
import { TeacherDashboard } from './routes/teacher/Dashboard';
import { TeacherStudents } from './routes/teacher/Students';
import { TeacherAssignTasks } from './routes/teacher/AssignTasks';
import { TeacherCreateExam } from './routes/teacher/CreateExam';
import { TeacherReports } from './routes/teacher/Reports';

// Import Parent Pages
import { ParentLayout } from './routes/parent/Layout';
import { ParentDashboard } from './routes/parent/Dashboard';
import { ChildProgress } from './routes/parent/ChildProgress';
import { ParentReports } from './routes/parent/Reports';

function App() {
  return (
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
          <Route path="/batch1" element={<Batch1Layout />}>
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
          <Route path="/batch2" element={<Batch2Layout />}>
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
          <Route path="/batch3" element={<Batch3Layout />}>
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

          {/* Student Batch 4 (Class 11-12) Dashboard Routes */}
          <Route path="/batch4" element={<Batch4Layout />}>
            <Route index element={<Navigate to="/batch4/home" replace />} />
            <Route path="home" element={<Batch4Home />} />
            <Route path="onboarding" element={<Batch4Onboarding />} />
            <Route path="jee-neet-prep" element={<Batch4JeeNeetPrep />} />
            <Route path="schedule-planner" element={<Batch4SchedulePlanner />} />
            <Route path="career" element={<Batch4CareerPath />} />
            <Route path="subjects" element={<Batch4Subjects />} />
            <Route path="chat" element={<Batch4Chat />} />
            <Route path="concept-map" element={<Batch4ConceptMap />} />
            <Route path="exams" element={<Batch4Exams />} />
            <Route path="notes" element={<Batch4Notes />} />
            <Route path="pyq" element={<Batch4Pyq />} />
            <Route path="pomodoro" element={<Batch4Pomodoro />} />
            <Route path="streak" element={<Batch4Streak />} />
            <Route path="weightage" element={<Batch4Weightage />} />
            <Route path="profile" element={<Batch4Profile />} />
          </Route>

          {/* Teacher Portal Routes */}
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="assign-tasks" element={<TeacherAssignTasks />} />
            <Route path="create-exam" element={<TeacherCreateExam />} />
            <Route path="reports" element={<TeacherReports />} />
          </Route>

          {/* Parent Portal Routes */}
          <Route path="/parent" element={<ParentLayout />}>
            <Route index element={<Navigate to="/parent/dashboard" replace />} />
            <Route path="dashboard" element={<ParentDashboard />} />
            <Route path="child-progress" element={<ChildProgress />} />
            <Route path="reports" element={<ParentReports />} />
          </Route>

          {/* Catch-all fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
