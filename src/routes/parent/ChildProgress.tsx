import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, MessageSquare, Award, BookOpen, Calendar, 
  ChevronRight, Send, CheckCircle, Sparkles, AlertCircle 
} from 'lucide-react';

export const ChildProgress: React.FC = () => {
  const { studentName, currentClass, studentsList } = useApp();
  const [activeTab, setActiveTab] = useState<'subjects' | 'tests' | 'comments'>('subjects');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState({ name: '', subject: '' });
  const [messageText, setMessageText] = useState('');

  // Find child record in studentsList to get real subject scores if available
  const childRecord = studentsList.find(s => s.name.toLowerCase() === studentName.toLowerCase()) || {
    avgScore: 84,
    subjectScores: { English: 82, Maths: 88, Science: 78, SocialSci: 80, Hindi: 85 }
  };

  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    return 'C';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenMsg = (tName: string, tSubj: string) => {
    setSelectedTeacher({ name: tName, subject: tSubj });
    setShowMsgModal(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setShowMsgModal(false);
    setMessageText('');
    showToast(`📩 Message sent to ${selectedTeacher.name}! We'll notify you when they reply.`);
  };

  // Mock chapters done & syllabus completion
  const subjectsData = [
    { 
      name: 'Mathematics', 
      score: childRecord.subjectScores.Maths, 
      trend: '+4%', 
      isUp: true, 
      done: '8/10', 
      syllabus: 80, 
      color: 'bg-emerald-500', 
      pillColor: 'pill-green' 
    },
    { 
      name: 'Science', 
      score: childRecord.subjectScores.Science, 
      trend: '-2%', 
      isUp: false, 
      done: '6/9', 
      syllabus: 66, 
      color: 'bg-sky-500', 
      pillColor: 'pill-sky' 
    },
    { 
      name: 'English', 
      score: childRecord.subjectScores.English, 
      trend: '+5%', 
      isUp: true, 
      done: '9/10', 
      syllabus: 90, 
      color: 'bg-indigo-500', 
      pillColor: 'pill-indigo' 
    },
    { 
      name: 'Social Science', 
      score: childRecord.subjectScores.SocialSci, 
      trend: '+1%', 
      isUp: true, 
      done: '7/10', 
      syllabus: 70, 
      color: 'bg-amber-500', 
      pillColor: 'pill-amber' 
    },
    { 
      name: 'Hindi', 
      score: childRecord.subjectScores.Hindi || 85, 
      trend: '0%', 
      isUp: true, 
      done: '8/8', 
      syllabus: 100, 
      color: 'bg-rose-500', 
      pillColor: 'pill-rose' 
    }
  ];

  // Test history table
  const testHistory = [
    { name: 'Chapter 2 Quiz (Arithmetic)', date: '2026-06-12', maths: 92, science: 85, english: 88, ssc: 90, overall: 89 },
    { name: 'Weekly Assessment 4', date: '2026-06-05', maths: 88, science: 76, english: 82, ssc: 80, overall: 815 },
    { name: 'Unit Test 1 (Class Test)', date: '2026-05-24', maths: 84, science: 74, english: 80, ssc: 78, overall: 79 },
    { name: 'Chapter 1 Assessment (Numbers)', date: '2026-05-10', maths: 80, science: 82, english: 78, ssc: 75, overall: 788 }
  ];

  // Teacher Comments
  const teacherComments = [
    {
      name: 'Mrs. Ananya Sharma',
      subject: 'Mathematics',
      avatar: '👩‍🏫',
      date: 'June 12, 2026',
      text: `${studentName} is highly cooperative and has shown excellent analytical skills in numbers and worksheets. They complete equations quickly and help peer learners. Keep up the arithmetic speed!`
    },
    {
      name: 'Mr. Rajesh Verma',
      subject: 'Science',
      avatar: '👨‍🔬',
      date: 'June 10, 2026',
      text: `${studentName} demonstrates great curiosity and asks active doubts about animal habitats and magnets. Scoring slightly lower in written terms, but conceptual understanding is high. Focus on spelling science terms.`
    },
    {
      name: 'Ms. Shalini Iyer',
      subject: 'English',
      avatar: '👩‍💼',
      date: 'June 08, 2026',
      text: `${studentName} speaks fluently and reads short stories with correct pronunciation. Vocab builders and game milestones have helped them a lot. Excellent story-telling engagement.`
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-6 select-none anim-fade-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 anim-fade-up">
          <CheckCircle size={16} className="text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            Performance Overview
          </span>
          <h2 className="font-display font-black text-2xl text-slate-800 mt-2">
            Detailed Progress & Grades
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing class records, tests trends, and specific remarks for {studentName} in Class {currentClass}.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl w-full md:w-auto justify-between md:justify-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Avg</p>
            <h3 className="font-display font-black text-3xl text-slate-800 mt-0.5">{childRecord.avgScore}%</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100">
        {[
          { id: 'subjects', label: 'Subject Overview', icon: <BookOpen size={14} /> },
          { id: 'tests', label: 'Test History', icon: <Calendar size={14} /> },
          { id: 'comments', label: 'Teacher Remarks', icon: <MessageSquare size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display text-xs font-bold transition-all -mb-px ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/20'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="anim-fade-up">
        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {subjectsData.map((sub, idx) => (
              <div key={idx} className="bento-card border border-slate-100 bg-white p-5 flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{sub.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`badge ${sub.pillColor} text-[9px] font-bold`}>
                        Grade {getGrade(sub.score)}
                      </span>
                      <span className={`text-[9px] font-bold flex items-center gap-0.5 ${sub.isUp ? 'text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100' : 'text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-100'}`}>
                        {sub.isUp ? '↑' : '↓'} {sub.trend}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-black text-2xl text-slate-800">{sub.score}%</span>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Average Accuracy</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Progress 1: Current Score accuracy */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>Concept Performance</span>
                      <span>{sub.score}%</span>
                    </div>
                    <div className="progress-bar w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`progress-fill ${sub.color} h-full rounded-full`} style={{ width: `${sub.score}%` }}></div>
                    </div>
                  </div>

                  {/* Progress 2: Syllabus completion progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>Syllabus Covered ({sub.done} Ch.)</span>
                      <span>{sub.syllabus}%</span>
                    </div>
                    <div className="progress-bar w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="progress-fill bg-slate-600 h-full rounded-full" style={{ width: `${sub.syllabus}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center select-none">
              <h3 className="font-display font-bold text-sm text-slate-800">Historical Test Performance</h3>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Filtered: Last 4 Examinations</span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="py-2 pb-3">Test / Assessment Name</th>
                    <th className="py-2 pb-3">Date</th>
                    <th className="py-2 pb-3 text-center">Maths</th>
                    <th className="py-2 pb-3 text-center">Science</th>
                    <th className="py-2 pb-3 text-center">English</th>
                    <th className="py-2 pb-3 text-center">Social Sci</th>
                    <th className="py-2 pb-3 text-center">Overall</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-600">
                  {testHistory.map((test, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-800">{test.name}</td>
                      <td className="py-3 text-[10px] text-slate-400 font-medium">{test.date}</td>
                      <td className="py-3 text-center">
                        <span className={`badge ${getScoreColor(test.maths)} text-[10px] font-bold px-2.5 py-0.5`}>
                          {test.maths}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`badge ${getScoreColor(test.science)} text-[10px] font-bold px-2.5 py-0.5`}>
                          {test.science}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`badge ${getScoreColor(test.english)} text-[10px] font-bold px-2.5 py-0.5`}>
                          {test.english}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`badge ${getScoreColor(test.ssc)} text-[10px] font-bold px-2.5 py-0.5`}>
                          {test.ssc}%
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">
                        {test.overall > 100 ? `${(test.overall/10).toFixed(1)}%` : `${test.overall}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center gap-2 mt-2">
              <Sparkles className="text-emerald-500" size={16} />
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                <strong>Test Summary Trend:</strong> Average accuracies are overall improving from <strong>79%</strong> to <strong>83%</strong>. Science grades have stabilized, while Maths scores have reached their highest average term-to-date.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Comments list */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {teacherComments.map((comment, idx) => (
                <div key={idx} className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
                        {comment.avatar}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{comment.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Class Teacher • {comment.date}</p>
                      </div>
                    </div>
                    <span className="badge pill-indigo text-[10px] font-bold px-2 py-0.5">
                      {comment.subject}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium italic bg-slate-50/50 p-3 rounded-xl border border-slate-50 leading-relaxed">
                    "{comment.text}"
                  </p>

                  <div className="flex justify-end pt-1">
                    <button 
                      onClick={() => handleOpenMsg(comment.name, comment.subject)}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare size={12} /> Reply to comment
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Teacher CTA Panel */}
            <div className="lg:col-span-4">
              <div className="bento-card border border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 p-5 flex flex-col gap-4 text-xs font-medium text-slate-600">
                <span className="text-xl">💬</span>
                <h4 className="font-display font-bold text-sm text-emerald-800">Direct Teacher Messaging</h4>
                <p className="leading-relaxed">
                  Have doubts about the remarks? You can easily message any subject teacher or schedule a parent-teacher consultation.
                </p>
                <div className="border-t border-emerald-100/50 pt-3 flex flex-col gap-2">
                  <button 
                    onClick={() => handleOpenMsg('Mrs. Ananya Sharma', 'Mathematics')}
                    className="w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-colors"
                  >
                    Message Class Teacher
                  </button>
                  <button 
                    onClick={() => showToast('📅 Consultation scheduler opened!')}
                    className="w-full text-center py-2 border border-emerald-200 hover:bg-white text-emerald-700 font-bold rounded-xl transition-all"
                  >
                    Schedule Consultation
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Message Modal */}
      {showMsgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 w-full max-w-md shadow-2xl anim-fade-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-600" />
                Message {selectedTeacher.subject} Teacher
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
                    <p className="text-xs font-bold text-slate-700">{selectedTeacher.name}</p>
                    <p className="text-[9px] text-slate-400">Teacher • {selectedTeacher.subject}</p>
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
                  placeholder={`Hi ${selectedTeacher.name}, about the remarks in ${selectedTeacher.subject}...`}
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
