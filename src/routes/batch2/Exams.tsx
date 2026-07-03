import React, { useState, useEffect } from 'react';
import { useApp, Exam } from '../../context/AppContext';
import { Clock, Star, Play, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Batch2Exams: React.FC = () => {
  const { exams, submitExamScore } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | 'Maths' | 'Science' | 'English'>('All');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Test taking states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const filteredExams = exams.filter(e => {
    if (activeTab === 'All') return true;
    return e.subject.toLowerCase() === activeTab.toLowerCase();
  });

  const startExam = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setTimeLeft(exam.duration * 60);
    setIsExamFinished(false);
    setFinalScore(0);
  };

  // Timer countdown
  useEffect(() => {
    if (!selectedExam || isExamFinished) return;
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedExam, timeLeft, isExamFinished]);

  const handleSelectAnswer = (qId: string, option: string) => {
    if (isExamFinished) return;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmitExam = () => {
    if (!selectedExam) return;
    setIsExamFinished(true);

    // Calculate score
    let correctCount = 0;
    selectedExam.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / selectedExam.questions.length) * 100);
    setFinalScore(calculatedScore);

    // Submit to AppContext
    submitExamScore(selectedExam.id, calculatedScore);

    confetti({
      particleCount: 60,
      spread: 40,
      origin: { y: 0.7 }
    });
  };

  // Format time (seconds to mm:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {selectedExam ? (
        /* ACTIVE TEST TAKING WORKSPACE */
        <div className="bg-white border border-indigo-100 rounded-3xl p-6 md:p-8 shadow-md">
          {/* Active test header */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="badge pill-indigo font-bold">{selectedExam.subject}</span>
              <h3 className="font-display font-extrabold text-sm text-slate-800">{selectedExam.title}</h3>
            </div>
            
            {!isExamFinished && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 font-display font-black text-sm p-2 px-4 rounded-xl">
                <Clock size={16} className="animate-pulse" />
                <span>Timer: {formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {!isExamFinished ? (
            /* QUESTIONS FLOW */
            <div className="grid grid-cols-12 gap-8">
              {/* Left col: Question details */}
              <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
                <div>
                  <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    QUESTION {currentQuestionIdx + 1} OF {selectedExam.questions.length} · ({selectedExam.questions[currentQuestionIdx].marks} Marks)
                  </span>
                  <h4 className="font-display font-extrabold text-lg text-slate-800 leading-snug mt-2">
                    {selectedExam.questions[currentQuestionIdx].text}
                  </h4>
                </div>

                {/* Question Type Options */}
                {selectedExam.questions[currentQuestionIdx].type === 'MCQ' && (
                  <div className="flex flex-col gap-3">
                    {selectedExam.questions[currentQuestionIdx].options?.map((opt) => {
                      const isSelected = answers[selectedExam.questions[currentQuestionIdx].id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectAnswer(selectedExam.questions[currentQuestionIdx].id, opt)}
                          className={`w-full text-left py-4 px-5 rounded-2xl border font-sans text-xs font-semibold transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 font-bold shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedExam.questions[currentQuestionIdx].type === 'True/False' && (
                  <div className="flex gap-4">
                    {['True', 'False'].map((opt) => {
                      const isSelected = answers[selectedExam.questions[currentQuestionIdx].id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectAnswer(selectedExam.questions[currentQuestionIdx].id, opt)}
                          className={`flex-1 text-center py-4 rounded-2xl border font-sans text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Form Nav footer */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="py-2.5 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-sans font-bold text-xs cursor-pointer transition-all disabled:opacity-30"
                  >
                    Previous
                  </button>

                  {currentQuestionIdx < selectedExam.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                      className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitExam}
                      className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs shadow-md shadow-emerald-600/10 cursor-pointer transition-all animate-pulse"
                    >
                      Submit Mock Exam
                    </button>
                  )}
                </div>
              </div>

              {/* Right col: Navigation dots */}
              <div className="col-span-12 lg:col-span-3 border-l border-slate-100 pl-6 flex flex-col gap-4">
                <span className="font-display font-bold text-xs text-slate-700">Question Board</span>
                <div className="flex flex-wrap gap-2.5">
                  {selectedExam.questions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isCurrent = currentQuestionIdx === idx;
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIdx(idx)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs cursor-pointer transition-all ${
                          isCurrent 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105' 
                            : isAnswered 
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' 
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* SCORE RESULTS SCREEN */
            <div className="text-center flex flex-col items-center gap-6 py-6 max-w-md mx-auto anim-fade-up">
              <div className="w-18 h-18 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-4xl shadow-xs select-none">
                🏆
              </div>

              <div>
                <h3 className="font-display font-black text-2xl text-slate-800">Exam Finished!</h3>
                <p className="font-sans text-xs text-slate-400 mt-1">Your term report card is generated.</p>
              </div>

              {/* Score ring */}
              <div className="flex flex-col items-center gap-1 select-none my-2">
                <span className="font-display font-black text-4xl text-indigo-600">{finalScore}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Overall Accuracy</span>
              </div>

              <div className="bg-indigo-50 border border-indigo-100/50 p-4 rounded-xl w-full flex justify-between items-center px-6 text-xs font-bold text-indigo-800 select-none">
                <span>REWARDS RECEIVED</span>
                <span>+100 XP Level Up</span>
              </div>

              <button
                onClick={() => setSelectedExam(null)}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs shadow-md shadow-indigo-600/15 cursor-pointer transition-all animate-bounce"
              >
                Back to Exam Room
              </button>
            </div>
          )}
        </div>
      ) : (
        /* EXAMS HUB LIST VIEW */
        <div className="flex flex-col gap-6">
          {/* Header tabs */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 select-none">
              {(['All', 'Maths', 'Science', 'English'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredExams.map((ex) => (
              <div 
                key={ex.id}
                className="bento-card border border-indigo-100 bg-white flex flex-col justify-between gap-5 p-6 card-interactive"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="badge pill-indigo text-[9px] font-black">{ex.subject}</span>
                    <h4 className="font-display font-bold text-sm text-slate-800 mt-2">{ex.title}</h4>
                  </div>
                  
                  {ex.completed ? (
                    <span className="badge pill-green text-[9px] font-bold select-none">
                      Score: {ex.score}%
                    </span>
                  ) : (
                    <span className="badge pill-rose text-[9px] font-bold select-none">
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-50 mt-1 select-none text-[11px] font-bold">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    {ex.duration} Mins · Ch {ex.classNum}
                  </span>
                  
                  <button
                    onClick={() => startExam(ex)}
                    className="py-1.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    {ex.completed ? 'Retake Exam' : 'Start Exam'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
