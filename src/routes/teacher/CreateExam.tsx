import React, { useState } from 'react';
import { useApp, Exam, Question } from '../../context/AppContext';
import { Plus, Trash2, Check, HelpCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const TeacherCreateExam: React.FC = () => {
  const { addExam } = useApp();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [classNum, setClassNum] = useState(7);
  const [duration, setDuration] = useState(30);

  // Question editing state
  const [qType, setQType] = useState<'MCQ' | 'True/False'>('MCQ');
  const [qText, setQText] = useState('');
  const [mcqOpts, setMcqOpts] = useState<string[]>(['', '', '', '']);
  const [correctMCQ, setCorrectMCQ] = useState(0);
  const [correctTF, setCorrectTF] = useState('True');
  const [marks, setMarks] = useState(5);

  // Preview List
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  const handleAddQuestion = () => {
    if (!qText.trim()) return;

    const newQ: Question = {
      id: `q_${Date.now()}`,
      type: qType,
      text: qText,
      marks,
      options: qType === 'MCQ' ? mcqOpts.filter(o => o.trim().length > 0) : undefined,
      correctAnswer: qType === 'MCQ' ? mcqOpts[correctMCQ] : correctTF
    };

    setQuestions(prev => [...prev, newQ]);
    
    // Clear question entries
    setQText('');
    setMcqOpts(['', '', '', '']);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handlePublish = () => {
    if (!title.trim() || questions.length === 0) return;

    // Dispatch to AppContext
    addExam({
      title,
      subject,
      classNum,
      duration,
      questions
    });

    setIsPublished(true);
    confetti({
      particleCount: 50,
      spread: 30
    });
  };

  const resetExamBuilder = () => {
    setTitle('');
    setQuestions([]);
    setIsPublished(false);
  };

  const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);

  // Mock Question Bank questions
  const questionBank = [
    { type: 'MCQ', text: 'Which organelle is called the powerhouse of cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Plastids'], correct: 'Mitochondria' },
    { type: 'True/False', text: 'Velocity is a scalar quantity.', correct: 'False' },
    { type: 'MCQ', text: 'SI unit of force is:', options: ['Joule', 'Pascal', 'Newton', 'Watt'], correct: 'Newton' }
  ];

  const handleAddFromBank = (bankItem: typeof questionBank[0]) => {
    const newQ: Question = {
      id: `q_bank_${Date.now()}`,
      type: bankItem.type as any,
      text: bankItem.text,
      marks: 5,
      options: bankItem.options,
      correctAnswer: bankItem.correct
    };
    setQuestions(prev => [...prev, newQ]);
  };

  return (
    <div className="font-sans select-none anim-fade-up">
      {isPublished ? (
        /* PUBLISH SUCCESS STATE SCREEN */
        <div className="bento-card border border-emerald-100 bg-white p-8 max-w-md mx-auto text-center flex flex-col items-center gap-6 animate-fade-up">
          <div className="w-18 h-18 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-xs select-none">
            🎉
          </div>
          <div>
            <h3 className="font-display font-black text-2xl text-slate-800">Exam Created!</h3>
            <p className="font-sans text-xs text-slate-400 mt-1">
              "{title}" is now published and assigned to Class {classNum} students.
            </p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={resetExamBuilder}
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans font-bold text-xs rounded-xl cursor-pointer"
            >
              Create Another
            </button>
            <button
              onClick={resetExamBuilder}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Assign Now
            </button>
          </div>
        </div>
      ) : (
        /* EXAM BUILDER ACTIVE GRID WORKSPACE */
        <div className="grid grid-cols-12 gap-6 text-left">
          
          {/* Left: configuration & question editors */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            
            {/* Details panel */}
            <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
              <span className="font-display font-bold text-xs text-slate-700">Exam Metadata</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="font-label-caps text-[9px] font-bold text-slate-400">EXAM TITLE</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                    placeholder="e.g. Science Term Mock Quiz"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] font-bold text-slate-400">SUBJECT</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none"
                  >
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] font-bold text-slate-400">TARGET CLASS</label>
                  <select
                    value={classNum}
                    onChange={(e) => setClassNum(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none"
                  >
                    {[3, 7, 9, 10, 12].map(n => (
                      <option key={n} value={n}>Class {n}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2 mt-2">
                  <div className="flex justify-between items-baseline font-label-caps text-[9px] font-bold text-slate-400">
                    <span>EXAM DURATION</span>
                    <span className="text-indigo-600 text-xs font-display font-black">{duration} mins</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Add question editor panel */}
            <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
              <span className="font-display font-bold text-xs text-slate-700">Add New Question</span>
              
              <div className="flex flex-col gap-4">
                {/* QType buttons */}
                <div className="flex bg-slate-100 p-1 rounded-lg text-[9px] font-black w-fit">
                  <button
                    type="button"
                    onClick={() => { setQType('MCQ'); setMarks(5); }}
                    className={`py-1.5 px-4 rounded-md transition-all cursor-pointer ${
                      qType === 'MCQ' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    MCQ Option
                  </button>
                  <button
                    type="button"
                    onClick={() => { setQType('True/False'); setMarks(5); }}
                    className={`py-1.5 px-4 rounded-md transition-all cursor-pointer ${
                      qType === 'True/False' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    True / False
                  </button>
                </div>

                {/* Question text */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] font-bold text-slate-400">QUESTION STATEMENT</label>
                  <textarea
                    rows={2}
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none resize-none"
                    placeholder="Enter question text here..."
                  />
                </div>

                {/* Options configs */}
                {qType === 'MCQ' && (
                  <div className="flex flex-col gap-3">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400">MCQ OPTIONS & CORRECT SELECTOR</label>
                    {mcqOpts.map((opt, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <input
                          type="radio"
                          name="correct-mcq"
                          checked={correctMCQ === idx}
                          onChange={() => setCorrectMCQ(idx)}
                          className="accent-indigo-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...mcqOpts];
                            next[idx] = e.target.value;
                            setMcqOpts(next);
                          }}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {qType === 'True/False' && (
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400">CORRECT TRUE/FALSE ANSWER</label>
                    <div className="flex gap-4">
                      {['True', 'False'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setCorrectTF(opt)}
                          className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            correctTF === opt 
                              ? 'border-indigo-500 bg-indigo-50/20 text-indigo-700' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-display font-semibold text-slate-500">Marks allocation:</span>
                    <input
                      type="number"
                      value={marks}
                      onChange={(e) => setMarks(Number(e.target.value))}
                      className="w-16 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg text-xs font-bold text-center outline-none"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Plus size={14} />
                    Add to Exam
                  </button>
                </div>
              </div>
            </div>

            {/* Question Bank recommendations */}
            <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
              <span className="font-display font-bold text-xs text-slate-700">NCERT Question Bank Recommend</span>
              
              <div className="flex flex-col gap-2.5 font-sans text-xs">
                {questionBank.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center gap-4">
                    <div>
                      <span className="badge pill-indigo text-[8px] font-black uppercase mb-1">{item.type}</span>
                      <span className="font-semibold text-slate-700 block">{item.text}</span>
                    </div>
                    <button
                      onClick={() => handleAddFromBank(item)}
                      className="py-1 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus size={10} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: sticky Exam Preview sidebar */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
            <div className="bento-card border border-indigo-100 bg-white p-5 flex flex-col justify-between gap-5 min-h-[350px]">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="font-display font-bold text-xs text-slate-700">Exam Preview</span>
                  <span className="badge pill-indigo text-[9px] font-black">{questions.length} Qs · {totalMarks} Marks</span>
                </div>

                {/* Question lists */}
                <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
                  {questions.length > 0 ? (
                    questions.map((q, idx) => (
                      <div key={q.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex justify-between items-center gap-3 font-sans text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 truncate block">Q{idx + 1}. {q.text}</span>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                            {q.type} · {q.marks} Marks
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 italic text-[11px] leading-relaxed">
                      No questions added yet. Add questions from the builder or question bank.
                    </div>
                  )}
                </div>
              </div>

              {/* Publish button */}
              <button
                onClick={handlePublish}
                disabled={!title.trim() || questions.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-50"
              >
                <Check size={16} />
                Publish Exam
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
