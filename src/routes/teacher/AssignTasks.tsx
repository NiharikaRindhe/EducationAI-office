import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClipboardList, Users, Check, AlertCircle, Calendar } from 'lucide-react';

export const TeacherAssignTasks: React.FC = () => {
  const { studentsList, addTask } = useApp();

  const [taskType, setTaskType] = useState<'Quiz' | 'Reading' | 'Practice' | 'PYQ' | 'Custom'>('Quiz');
  const [subject, setSubject] = useState('Mathematics');
  const [dueDate, setDueDate] = useState('Today');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  
  // Assign targeting states
  const [targetMode, setTargetMode] = useState<'student' | 'class' | 'batch'>('student');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('7-A');
  const [selectedBatch, setSelectedBatch] = useState(2);

  // Success toast state
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStudentToggle = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    // Simulate 800ms API dispatch
    setTimeout(() => {
      // Add mock task to AppContext
      addTask({
        title,
        subject,
        xp: taskType === 'Quiz' ? 50 : taskType === 'Reading' ? 40 : 60,
        dueDate,
        batchId: targetMode === 'batch' ? selectedBatch : 2 // default to Batch 2 or selected
      });

      setIsSubmitting(false);
      setShowToast(true);
      setTitle('');
      setInstructions('');
      setSelectedStudents([]);
      
      // Auto hide toast after 3000ms
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto font-sans select-none anim-fade-up">
      {/* Toast Alert Success */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-sans font-bold text-xs py-3 px-5 rounded-2xl shadow-lg flex items-center gap-2 anim-fade-up z-50">
          <Check size={16} />
          <span>✓ Task assigned successfully! Students will see it immediately.</span>
        </div>
      )}

      <div className="bento-card border border-slate-100 bg-white p-6 md:p-8 flex flex-col gap-6 text-left">
        <h3 className="font-display font-bold text-sm text-slate-800">Configure Assignment</h3>
        
        <form onSubmit={handleAssign} className="flex flex-col gap-5">
          {/* Task Type selector buttons */}
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-[9px] font-bold text-slate-400">ASSIGNMENT TYPE</label>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'Quiz', label: 'Quiz' },
                { key: 'Reading', label: 'Reading' },
                { key: 'Practice', label: 'Practice Problems' },
                { key: 'PYQ', label: 'PYQ Paper' },
                { key: 'Custom', label: 'Custom' }
              ] as const).map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTaskType(item.key)}
                  className={`py-2 px-4 rounded-xl font-sans text-xs font-semibold border transition-all cursor-pointer ${
                    taskType === item.key 
                      ? 'bg-indigo-600 border-transparent text-white shadow-md shadow-indigo-600/10' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Subject dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[9px] font-bold text-slate-400">SUBJECT</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none"
              >
                {['Mathematics', 'Science', 'English', 'Social Science', 'Hindi'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Due date picker */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[9px] font-bold text-slate-400">DUE DATE</label>
              <select
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="Today">Due Today</option>
                <option value="Tomorrow">Due Tomorrow</option>
                <option value="This Week">Due This Week</option>
              </select>
            </div>
          </div>

          {/* Task Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[9px] font-bold text-slate-400">TASK TITLE</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
              placeholder="e.g. Solve Ch 3 Linear equations practice"
            />
          </div>

          {/* Instructions */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[9px] font-bold text-slate-400">SPECIAL INSTRUCTIONS (OPTIONAL)</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none resize-none"
              placeholder="e.g. Focus on exercise 3.2 variables..."
            />
          </div>

          {/* Targeting controls */}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 mt-2">
            <div className="flex justify-between items-center select-none">
              <label className="font-label-caps text-[9px] font-bold text-slate-400">ASSIGN TARGET RANGE</label>
              <div className="flex bg-slate-100 p-1 rounded-lg text-[9px] font-black">
                {([
                  { key: 'student', label: 'Pupils' },
                  { key: 'class', label: 'Class' },
                  { key: 'batch', label: 'Batch' }
                ] as const).map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTargetMode(item.key)}
                    className={`py-1 px-3 rounded-md cursor-pointer transition-all ${
                      targetMode === item.key ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target mode rendering */}
            {targetMode === 'student' && (
              <div className="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl select-none">
                {studentsList.map((stud) => {
                  const isSelected = selectedStudents.includes(stud.id);
                  return (
                    <button
                      key={stud.id}
                      type="button"
                      onClick={() => handleStudentToggle(stud.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-white shadow-xs font-bold text-indigo-600 scale-102' 
                          : 'border-slate-200 bg-white/50 text-slate-500'
                      }`}
                    >
                      <span className="text-xl">{stud.avatar}</span>
                      <span className="text-[9px] truncate max-w-[70px]">{stud.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {targetMode === 'class' && (
              <div className="grid grid-cols-4 gap-2">
                {['3-A', '7-A', '9-C', '12-A'].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`py-3.5 border rounded-xl font-bold font-sans text-xs cursor-pointer transition-all ${
                      selectedClass === cls
                        ? 'border-indigo-500 bg-indigo-50/20 text-indigo-700'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            )}

            {targetMode === 'batch' && (
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedBatch(num)}
                    className={`py-3.5 border rounded-xl font-bold font-sans text-xs cursor-pointer transition-all ${
                      selectedBatch === num
                        ? 'border-indigo-500 bg-indigo-50/20 text-indigo-700'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    Batch {num}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Assigning Task...' : 'Assign Task'}
          </button>
        </form>
      </div>
    </div>
  );
};
