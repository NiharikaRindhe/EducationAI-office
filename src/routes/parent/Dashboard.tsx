import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, Award, Clock, ArrowRight, BookOpen, 
  MessageSquare, Calendar, ChevronRight, FileText, Send, Flame, Sparkles
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { studentName, studentAvatar, studentXP, studentStreak, currentClass, studentsList, exams } = useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Find child record in studentsList to get real subject scores if available
  const childRecord = studentsList.find(s => s.name.toLowerCase() === studentName.toLowerCase()) || {
    avgScore: 84,
    subjectScores: { English: 82, Maths: 88, Science: 78, SocialSci: 80, Hindi: 85 }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setShowMsgModal(false);
    setMessageText('');
    showToast(`📩 Message sent to Class Teacher! We'll notify you when they reply.`);
  };

  // Mock activity feed based on current student context
  const activities = [
    {
      subject: 'Maths',
      action: 'Completed Count & Add Objects Game',
      time: '10 mins ago',
      score: '100%',
      type: 'game',
      icon: <Award className="text-emerald-500" size={18} />
    },
    {
      subject: 'English',
      action: 'Read story: The Wise Owl Story',
      time: '2 hours ago',
      xp: '+50 XP',
      type: 'reading',
      icon: <BookOpen className="text-indigo-500" size={18} />
    },
    {
      subject: 'Science',
      action: 'Practiced Phonics Pop Balloon Game',
      time: 'Yesterday',
      score: '90%',
      type: 'quiz',
      icon: <TrendingUp className="text-amber-500" size={18} />
    },
    {
      subject: 'Maths',
      action: 'Completed Chapter 2 Addition Quiz',
      time: '2 days ago',
      score: '85%',
      type: 'quiz',
      icon: <TrendingUp className="text-sky-500" size={18} />
    }
  ];

  // Subject bars formatting
  const subjectBars = [
    { name: 'Mathematics', val: childRecord.subjectScores.Maths, color: 'bg-emerald-500', pillColor: 'pill-green' },
    { name: 'English', val: childRecord.subjectScores.English, color: 'bg-indigo-500', pillColor: 'pill-indigo' },
    { name: 'Science', val: childRecord.subjectScores.Science, color: 'bg-sky-500', pillColor: 'pill-sky' },
    { name: 'Social Science', val: childRecord.subjectScores.SocialSci, color: 'bg-amber-500', pillColor: 'pill-amber' }
  ];

  // Upcoming exams from app state or fallbacks
  const uncompletedExams = exams.filter(e => !e.completed).slice(0, 3);
  const displayExams = uncompletedExams.length > 0 ? uncompletedExams : [
    { id: 'mock-1', title: 'Science Term Mid-Assessment', subject: 'Science', daysLeft: '2 days left', color: 'border-sky-200 bg-sky-50/50 text-sky-800' },
    { id: 'mock-2', title: 'Maths Algebra Test', subject: 'Maths', daysLeft: '5 days left', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800' },
    { id: 'mock-3', title: 'English Grammar Quiz', subject: 'English', daysLeft: '8 days left', color: 'border-indigo-200 bg-indigo-50/50 text-indigo-800' }
  ];

  return (
    <div className="space-y-6 select-none anim-fade-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 anim-fade-up">
          <Sparkles size={16} className="text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Child Summary Banner (emerald gradient) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 p-6 md:p-8 text-white shadow-lg shadow-emerald-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-teal-400/10 rounded-full blur-xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <span className="text-5xl md:text-6xl p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              {studentAvatar}
            </span>
            <div>
              <span className="font-sans text-[10px] font-bold bg-white/20 uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
                Class {currentClass} Student
              </span>
              <h2 className="font-display font-black text-2xl md:text-3xl mt-2">
                {studentName}'s Learning Dashboard
              </h2>
              <p className="text-xs text-emerald-100 mt-1 font-medium">
                Tracking real-time syllabus completion, milestones, and daily study streaks.
              </p>
            </div>
          </div>

          {/* 3 Stats Panel */}
          <div className="flex gap-4 md:gap-6 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm shadow-inner w-full md:w-auto justify-around">
            <div className="text-center px-2">
              <span className="text-emerald-200 text-[9px] font-bold uppercase tracking-wider block">Streak</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-orange-300">
                <Flame size={18} fill="currentColor" />
                <span className="font-display font-black text-lg">{studentStreak} Days</span>
              </div>
            </div>
            <div className="w-px bg-white/20 h-8 self-center"></div>
            <div className="text-center px-2">
              <span className="text-emerald-200 text-[9px] font-bold uppercase tracking-wider block">Total XP</span>
              <span className="font-display font-black text-lg text-amber-300 block mt-1">
                💎 {studentXP.toLocaleString()}
              </span>
            </div>
            <div className="w-px bg-white/20 h-8 self-center"></div>
            <div className="text-center px-2">
              <span className="text-emerald-200 text-[9px] font-bold uppercase tracking-wider block">Avg Score</span>
              <span className="font-display font-black text-lg text-white block mt-1">
                {childRecord.avgScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Today's Feed & This Week's Performance */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Today's Activity Feed */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-800">Today's Learning Activity</h3>
                <p className="text-[10px] text-slate-400">Chronological feed of concepts, quizzes, and games completed today.</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                <Clock size={12} /> Live Sync Active
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {activities.map((act, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform">
                      {act.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{act.action}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {act.subject} • {act.time}
                      </p>
                    </div>
                  </div>
                  {act.score && (
                    <span className="badge pill-green text-[10px] font-bold px-2 py-0.5">
                      {act.score} Score
                    </span>
                  )}
                  {act.xp && (
                    <span className="badge pill-indigo text-[10px] font-bold px-2 py-0.5">
                      {act.xp}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* This Week's Performance */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-5">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-800">Weekly Subject Average</h3>
              <p className="text-[10px] text-slate-400">Average accuracy tracked across homeworks, exams, and daily tasks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {subjectBars.map((bar, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{bar.name}</span>
                    <span className={`badge ${bar.pillColor} text-[10px] font-bold`}>{bar.val}%</span>
                  </div>
                  <div className="progress-bar w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`progress-fill ${bar.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${bar.val}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Coach Insight Card */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex gap-3 mt-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-emerald-800">AI Coach Insight</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  <strong>{studentName}</strong> is demonstrating excellent topic mastery in <strong className="text-emerald-700">Maths</strong>, with quizzes averaging <strong>{childRecord.subjectScores.Maths}%</strong>. 
                  However, weekly active hours on <strong>Science</strong> are slightly down. Encouraging {studentName} to ask the AI Chat 2 questions about their Science chapters today can bridge this minor gap!
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Upcoming Exams & Quick Actions */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Upcoming Exams */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Calendar size={16} className="text-emerald-600" /> Upcoming Assessments
            </h3>
            
            <div className="flex flex-col gap-3">
              {displayExams.map((exam: any) => (
                <div 
                  key={exam.id} 
                  className={`border rounded-xl p-3.5 flex flex-col gap-2 relative overflow-hidden ${
                    exam.color || 'border-slate-100 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-current/10">
                      {exam.subject}
                    </span>
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                      {exam.daysLeft || `${exam.duration} mins`}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                    {exam.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access Sidebar */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-800">Quick Parent Links</h3>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/parent/child-progress')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-emerald-50/20 hover:border-emerald-200 transition-all text-left text-xs font-bold text-slate-700 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <span>Detailed Progress</span>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Syllabus breakdown & grades</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/parent/reports')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-emerald-50/20 hover:border-emerald-200 transition-all text-left text-xs font-bold text-slate-700 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div>
                    <span>Download Report Card</span>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">PDF cards & WhatsApp share</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => setShowMsgModal(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-emerald-50/20 hover:border-emerald-200 transition-all text-left text-xs font-bold text-slate-700 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <span>Message Teacher</span>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Direct link to school portal</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Message Modal */}
      {showMsgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 w-full max-w-md shadow-2xl anim-fade-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-600" />
                Message Class Teacher
              </h3>
              <button 
                onClick={() => setShowMsgModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 hover:bg-slate-50 rounded"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSendMessage} className="space-y-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Recipient
                </label>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center gap-2">
                  <span className="text-lg">👩‍🏫</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Mrs. Ananya Sharma</p>
                    <p className="text-[9px] text-slate-400">Class Teacher • Grade {currentClass}-A</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Hi Mrs. Sharma, I wanted to discuss my child's progress in Science chapters..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-medium text-slate-700 placeholder:text-slate-400"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMsgModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/10"
                >
                  <Send size={14} /> Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
