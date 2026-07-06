import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Task Types
export interface Task {
  id: string;
  title: string;
  subject: string;
  xp: number;
  status: 'Not Started' | 'In Progress' | 'In Review' | 'Completed';
  dueDate: string;
  batchId: number;
}

// Study Plan Task (Batch 4)
export interface StudyTask {
  id: string;
  topic: string;
  subject: string;
  duration: number; // minutes
  type: 'Study' | 'Practice' | 'Mock' | 'Revision';
  completed: boolean;
}

// Exam Question
export interface Question {
  id: string;
  type: 'MCQ' | 'True/False' | 'Short Answer' | 'Long Answer';
  text: string;
  options?: string[]; // for MCQ
  correctAnswer?: string;
  marks: number;
}

// Exam Details
export interface Exam {
  id: string;
  title: string;
  subject: string;
  classNum: number;
  duration: number; // minutes
  questions: Question[];
  completed?: boolean;
  score?: number;
  date?: string;
}

// Student Type for Teacher Portal
export interface StudentRecord {
  id: string;
  name: string;
  classNum: number;
  section: string;
  avatar: string;
  streak: number;
  xp: number;
  avgScore: number;
  lastActive: string;
  isAtRisk: boolean;
  riskReason?: string;
  subjectScores: {
    English: number;
    Maths: number;
    Science: number;
    SocialSci: number;
    Hindi: number;
  };
}

// App State Interface
interface AppState {
  userRole: 'student' | 'teacher' | 'parent' | null;
  studentName: string;
  studentAvatar: string;
  studentXP: number;
  studentStreak: number;
  currentClass: number;
  batchId: number;
  currentStream: 'JEE' | 'NEET';
  assignedTasks: Task[];
  studyPlan: StudyTask[];
  exams: Exam[];
  studentsList: StudentRecord[];
  
  // Actions
  login: (role: 'student' | 'teacher' | 'parent', classNum?: number, name?: string, avatar?: string) => void;
  logout: () => void;
  updateStudentProfile: (name: string, avatar: string) => void;
  cycleTaskStatus: (taskId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  addExam: (exam: Omit<Exam, 'id'>) => void;
  toggleStudyTask: (taskId: string) => void;
  generateStudyPlan: (goal: string, hours: number, weakSubjects: string[]) => void;
  submitExamScore: (examId: string, score: number) => void;
  incrementXP: (amount: number) => void;
  incrementStreak: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'parent' | null>(() => {
    return (localStorage.getItem('eduai_role') as any) || null;
  });

  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('eduai_student_name') || 'Dev';
  });

  const [studentAvatar, setStudentAvatar] = useState<string>(() => {
    return localStorage.getItem('eduai_student_avatar') || '🦊';
  });

  const [studentXP, setStudentXP] = useState<number>(() => {
    return Number(localStorage.getItem('eduai_student_xp')) || 2450;
  });

  const [studentStreak, setStudentStreak] = useState<number>(() => {
    return Number(localStorage.getItem('eduai_student_streak')) || 12;
  });

  const [currentClass, setCurrentClass] = useState<number>(() => {
    return Number(localStorage.getItem('eduai_student_class')) || 3; // Default Class 3 (Batch 1)
  });

  const [currentStream, setCurrentStream] = useState<'JEE' | 'NEET'>(() => {
    return (localStorage.getItem('batch4_stream') as 'JEE' | 'NEET') || 'JEE';
  });

  // Calculate Batch ID based on Class
  const getBatchFromClass = (c: number): number => {
    if (c >= 1 && c <= 4) return 1;
    if (c >= 5 && c <= 8) return 2;
    if (c >= 9 && c <= 10) return 3;
    if (c >= 11 && c <= 12) return 4;
    return 1;
  };

  const batchId = getBatchFromClass(currentClass);

  // Bridge: Sidebar/TopBar and every not-yet-rewired Batch1-3 page still read
  // student name/avatar/xp/streak/class from this (legacy mock) context, but
  // login now happens for real via AuthContext. Rather than rewrite every
  // page's data source in one pass, mirror the real profile in here whenever
  // it changes -- existing pages keep working, and they show real data.
  const { user: authUser } = useAuth();
  useEffect(() => {
    if (authUser?.role === 'student' && authUser.student_profiles) {
      const sp = authUser.student_profiles;
      setUserRole('student');
      setStudentName(authUser.full_name);
      setStudentAvatar(sp.avatar);
      setStudentXP(sp.xp);
      setStudentStreak(sp.streak);
      setCurrentClass(sp.class_num);
    } else if (!authUser) {
      setUserRole(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // Sync to localStorage
  useEffect(() => {
    if (userRole) localStorage.setItem('eduai_role', userRole);
    else localStorage.removeItem('eduai_role');
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('eduai_student_name', studentName);
  }, [studentName]);

  useEffect(() => {
    localStorage.setItem('eduai_student_avatar', studentAvatar);
  }, [studentAvatar]);

  useEffect(() => {
    localStorage.setItem('eduai_student_xp', studentXP.toString());
  }, [studentXP]);

  useEffect(() => {
    localStorage.setItem('eduai_student_streak', studentStreak.toString());
  }, [studentStreak]);

  useEffect(() => {
    localStorage.setItem('eduai_student_class', currentClass.toString());
  }, [currentClass]);

  useEffect(() => {
    localStorage.setItem('batch4_stream', currentStream);
  }, [currentStream]);

  // Tasks State
  const [assignedTasks, setAssignedTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('eduai_tasks');
    if (saved) return JSON.parse(saved);

    // Default mock tasks
    return [
      // Batch 1 (Class 1-4)
      { id: 't1-1', title: 'Read: The Wise Owl Story', subject: 'English', xp: 50, status: 'Not Started', dueDate: 'Today', batchId: 1 },
      { id: 't1-2', title: 'Mini Quiz: 1-10 counting stars', subject: 'Maths', xp: 40, status: 'In Progress', dueDate: 'Today', batchId: 1 },
      { id: 't1-3', title: 'Count and Add objects game', subject: 'Maths', xp: 60, status: 'Completed', dueDate: 'Tomorrow', batchId: 1 },
      { id: 't1-4', title: 'Show & Tell: Fun Facts about tigers', subject: 'Science', xp: 80, status: 'Not Started', dueDate: 'This Week', batchId: 1 },
      
      // Batch 2 (Class 5-8)
      { id: 't2-1', title: 'Solve Ch 3 Algebra practice', subject: 'Maths', xp: 75, status: 'In Progress', dueDate: 'Today', batchId: 2 },
      { id: 't2-2', title: 'Ask AI Chat about Newton’s Laws', subject: 'Science', xp: 50, status: 'Not Started', dueDate: 'Today', batchId: 2 },
      { id: 't2-3', title: 'Study Notes: Historical Battles', subject: 'Social Science', xp: 60, status: 'Completed', dueDate: 'This Week', batchId: 2 },
      
      // Batch 3 (Class 9-10)
      { id: 't3-1', title: 'Attempt board pattern practice mock', subject: 'Science', xp: 120, status: 'Not Started', dueDate: 'Today', batchId: 3 },
      { id: 't3-2', title: 'Interact with Ch 2 Concept Map', subject: 'Maths', xp: 50, status: 'In Progress', dueDate: 'Tomorrow', batchId: 3 },
      { id: 't3-3', title: 'Pomodoro study: Periodic Table notes', subject: 'Science', xp: 80, status: 'Completed', dueDate: 'This Week', batchId: 3 },

      // Batch 4 (Class 11-12)
      { id: 't4-1', title: 'Solve HC Verma Electromagnetics Ch 2', subject: 'Physics', xp: 150, status: 'In Progress', dueDate: 'Today', batchId: 4 },
      { id: 't4-2', title: 'JEE Chemistry Organic revision', subject: 'Chemistry', xp: 100, status: 'Not Started', dueDate: 'Today', batchId: 4 },
      { id: 't4-3', title: 'Attempt 2023 Physics Sectional test', subject: 'Physics', xp: 180, status: 'Completed', dueDate: 'Tomorrow', batchId: 4 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('eduai_tasks', JSON.stringify(assignedTasks));
  }, [assignedTasks]);

  // Batch 4 study plan
  const [studyPlan, setStudyPlan] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem('eduai_study_plan');
    if (saved) return JSON.parse(saved);
    return [
      { id: 's1', topic: 'Electrostatics Formulas', subject: 'Physics', duration: 90, type: 'Study', completed: true },
      { id: 's2', topic: 'Organic Mechanisms', subject: 'Chemistry', duration: 60, type: 'Revision', completed: false },
      { id: 's3', topic: 'Calculus Mock Practice', subject: 'Maths', duration: 120, type: 'Practice', completed: false },
      { id: 's4', topic: 'Optics Quiz Problems', subject: 'Physics', duration: 45, type: 'Mock', completed: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem('eduai_study_plan', JSON.stringify(studyPlan));
  }, [studyPlan]);

  // Exams / Mock test state
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('eduai_exams');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'e1',
        title: 'Ch 3 Algebra Assessment',
        subject: 'Maths',
        classNum: 7,
        duration: 30,
        completed: true,
        score: 85,
        date: '2026-06-12',
        questions: [
          { id: 'q1', type: 'MCQ', text: 'Solve for x: 3x - 7 = 11', options: ['x = 4', 'x = 6', 'x = 3', 'x = 8'], correctAnswer: 'x = 6', marks: 5 },
          { id: 'q2', type: 'MCQ', text: 'Simplify: 2(a + 3) - 4a', options: ['2a + 6', '6 - 2a', '4a', '6'], correctAnswer: '6 - 2a', marks: 5 },
          { id: 'q3', type: 'True/False', text: 'A linear equation in one variable always has exactly one solution.', correctAnswer: 'True', marks: 5 }
        ]
      },
      {
        id: 'e2',
        title: 'Light and Reflection Mock Quiz',
        subject: 'Science',
        classNum: 10,
        duration: 20,
        completed: false,
        questions: [
          { id: 'q2-1', type: 'MCQ', text: 'Which mirror is used as a rear view mirror in vehicles?', options: ['Concave Mirror', 'Convex Mirror', 'Plane Mirror', 'Double Concave'], correctAnswer: 'Convex Mirror', marks: 5 },
          { id: 'q2-2', type: 'MCQ', text: 'The focal length of a plane mirror is:', options: ['Zero', 'Positive', 'Negative', 'Infinite'], correctAnswer: 'Infinite', marks: 5 },
          { id: 'q2-3', type: 'True/False', text: 'The angle of incidence is always equal to the angle of reflection.', correctAnswer: 'True', marks: 5 }
        ]
      },
      {
        id: 'e3',
        title: 'JEE Electrodynamics Sectional',
        subject: 'Physics',
        classNum: 12,
        duration: 45,
        completed: false,
        questions: [
          { id: 'q3-1', type: 'MCQ', text: 'Force between two static charges Q1 and Q2 separated by distance r is given by Coulomb’s law. If distance is doubled, force is:', options: ['Doubled', 'Halved', 'Quartered', 'Quadrupled'], correctAnswer: 'Quartered', marks: 4 },
          { id: 'q3-2', type: 'MCQ', text: 'The electric potential inside a hollow charged spherical shell is:', options: ['Zero', 'Constant and equal to surface potential', 'Varies inversely with r', 'None'], correctAnswer: 'Constant and equal to surface potential', marks: 4 },
          { id: 'q3-3', type: 'MCQ', text: 'SI unit of electric capacitance is:', options: ['Farad', 'Henry', 'Coulomb', 'Ohm'], correctAnswer: 'Farad', marks: 4 }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('eduai_exams', JSON.stringify(exams));
  }, [exams]);

  // Students list (for Teacher Portal)
  const [studentsList, setStudentsList] = useState<StudentRecord[]>(() => {
    return [
      {
        id: 's-1',
        name: 'Dev',
        classNum: 3,
        section: 'A',
        avatar: '🦊',
        streak: 12,
        xp: 2450,
        avgScore: 78,
        lastActive: '10 mins ago',
        isAtRisk: false,
        subjectScores: { English: 82, Maths: 78, Science: 74, SocialSci: 80, Hindi: 76 }
      },
      {
        id: 's-2',
        name: 'Meera',
        classNum: 3,
        section: 'B',
        avatar: '🐯',
        streak: 3,
        xp: 1540,
        avgScore: 58,
        lastActive: '2 hours ago',
        isAtRisk: true,
        riskReason: 'Low score',
        subjectScores: { English: 64, Maths: 52, Science: 58, SocialSci: 62, Hindi: 54 }
      },
      {
        id: 's-3',
        name: 'Aisha',
        classNum: 7,
        section: 'A',
        avatar: '🦋',
        streak: 22,
        xp: 4890,
        avgScore: 92,
        lastActive: 'Just now',
        isAtRisk: false,
        subjectScores: { English: 95, Maths: 94, Science: 90, SocialSci: 92, Hindi: 89 }
      },
      {
        id: 's-4',
        name: 'Riya',
        classNum: 7,
        section: 'A',
        avatar: '🚀',
        streak: 0,
        xp: 980,
        avgScore: 62,
        lastActive: '3 days ago',
        isAtRisk: true,
        riskReason: 'Streak broken',
        subjectScores: { English: 68, Maths: 59, Science: 61, SocialSci: 65, Hindi: 58 }
      },
      {
        id: 's-5',
        name: 'Arjun',
        classNum: 9,
        section: 'C',
        avatar: '🦁',
        streak: 18,
        xp: 3820,
        avgScore: 84,
        lastActive: '5 mins ago',
        isAtRisk: false,
        subjectScores: { English: 85, Maths: 88, Science: 82, SocialSci: 86, Hindi: 79 }
      },
      {
        id: 's-6',
        name: 'Kabir',
        classNum: 10,
        section: 'B',
        avatar: '🐼',
        streak: 1,
        xp: 1200,
        avgScore: 54,
        lastActive: '1 day ago',
        isAtRisk: true,
        riskReason: 'Low score',
        subjectScores: { English: 58, Maths: 48, Science: 52, SocialSci: 56, Hindi: 54 }
      },
      {
        id: 's-7',
        name: 'Sneha',
        classNum: 12,
        section: 'A',
        avatar: '🦄',
        streak: 34,
        xp: 6710,
        avgScore: 89,
        lastActive: '12 mins ago',
        isAtRisk: false,
        subjectScores: { English: 92, Maths: 85, Science: 91, SocialSci: 88, Hindi: 90 }
      },
      {
        id: 's-8',
        name: 'Rohan',
        classNum: 12,
        section: 'A',
        avatar: '🦖',
        streak: 8,
        xp: 2190,
        avgScore: 71,
        lastActive: '1 hour ago',
        isAtRisk: false,
        subjectScores: { English: 73, Maths: 68, Science: 72, SocialSci: 70, Hindi: 73 }
      }
    ];
  });

  // Action methods
  const login = (role: 'student' | 'teacher' | 'parent', classNum: number = 3, name: string = 'Dev', avatar: string = '🦊') => {
    setUserRole(role);
    if (role === 'student') {
      setCurrentClass(classNum);
      setStudentName(name);
      setStudentAvatar(avatar);
      
      // Mock loading other student metrics based on name
      const record = studentsList.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (record) {
        setStudentXP(record.xp);
        setStudentStreak(record.streak);
      } else {
        setStudentXP(2450);
        setStudentStreak(12);
      }
    }
  };

  const logout = () => {
    setUserRole(null);
    localStorage.removeItem('eduai_role');
  };

  const updateStudentProfile = (name: string, avatar: string) => {
    setStudentName(name);
    setStudentAvatar(avatar);
    
    // Also update in student list for sync
    setStudentsList(prev => prev.map(s => {
      if (s.name.toLowerCase() === studentName.toLowerCase() || s.name === 'Dev') {
        return { ...s, name, avatar };
      }
      return s;
    }));
  };

  const cycleTaskStatus = (taskId: string) => {
    setAssignedTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let nextStatus: Task['status'] = 'Not Started';
        if (t.status === 'Not Started') nextStatus = 'In Progress';
        else if (t.status === 'In Progress') nextStatus = 'In Review';
        else if (t.status === 'In Review') nextStatus = 'Completed';
        
        // Award XP if completed
        if (nextStatus === 'Completed') {
          incrementXP(t.xp);
        }
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const addTask = (task: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...task,
      id: 'task_' + Date.now(),
      status: 'Not Started'
    };
    setAssignedTasks(prev => [newTask, ...prev]);
  };

  const addExam = (exam: Omit<Exam, 'id'>) => {
    const newExam: Exam = {
      ...exam,
      id: 'exam_' + Date.now()
    };
    setExams(prev => [newExam, ...prev]);
  };

  const toggleStudyTask = (taskId: string) => {
    setStudyPlan(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        if (nextState) incrementXP(30);
        return { ...t, completed: nextState };
      }
      return t;
    }));
  };

  const generateStudyPlan = (goal: string, hours: number, weakSubjects: string[]) => {
    // Generates a mock study plan of 4 items based on slider preferences
    const mockTopics = {
      Physics: ['Electrostatics', 'Kinematics', 'Optics', 'Thermodynamics'],
      Chemistry: ['Organic Mechanisms', 'Atomic Structure', 'Equilibrium', 'Kinetics'],
      Maths: ['Calculus Integration', 'Probability', 'Matrices', 'Vectors'],
      Biology: ['Genetics', 'Cell Division', 'Photosynthesis', 'Ecology']
    };

    const newTasks: StudyTask[] = [];
    const subjects = weakSubjects.length > 0 ? weakSubjects : ['Physics', 'Chemistry', 'Maths'];
    
    // Create 4 study entries
    for (let i = 0; i < 4; i++) {
      const subj = subjects[i % subjects.length];
      const topicsList = mockTopics[subj as keyof typeof mockTopics] || ['Revision Topic'];
      const topic = topicsList[Math.floor(Math.random() * topicsList.length)];
      
      const taskTypes: StudyTask['type'][] = ['Study', 'Practice', 'Mock', 'Revision'];
      const type = taskTypes[i % taskTypes.length];
      
      newTasks.push({
        id: `plan_${Date.now()}_${i}`,
        topic: `${topic} (${goal})`,
        subject: subj,
        duration: Math.round((hours * 60) / 4),
        type,
        completed: false
      });
    }

    setStudyPlan(newTasks);
  };

  const submitExamScore = (examId: string, score: number) => {
    setExams(prev => prev.map(e => {
      if (e.id === examId) {
        return {
          ...e,
          completed: true,
          score,
          date: new Date().toISOString().split('T')[0]
        };
      }
      return e;
    }));
    incrementXP(100);
  };

  const incrementXP = (amount: number) => {
    setStudentXP(prev => prev + amount);
  };

  const incrementStreak = () => {
    setStudentStreak(prev => prev + 1);
  };

  return (
    <AppContext.Provider value={{
      userRole,
      studentName,
      studentAvatar,
      studentXP,
      studentStreak,
      currentClass,
      batchId,
      currentStream,
      assignedTasks,
      studyPlan,
      exams,
      studentsList,
      
      login,
      logout,
      updateStudentProfile,
      cycleTaskStatus,
      addTask,
      addExam,
      toggleStudyTask,
      generateStudyPlan,
      submitExamScore,
      incrementXP,
      incrementStreak
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
