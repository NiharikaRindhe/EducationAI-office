import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Star, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizCard {
  id: string;
  subject: string;
  chapter: string;
  stars: number; // 0 to 3
  questions: {
    q: string;
    options: string[];
    correct: string;
    feedback: string;
  }[];
}

export const Batch1Exams: React.FC = () => {
  const { incrementXP } = useApp();

  const [activeQuiz, setActiveQuiz] = useState<QuizCard | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // Local list of quizzes with stars completed state
  const [quizzesList, setQuizzesList] = useState<QuizCard[]>([
    {
      id: 'q1',
      subject: 'Maths',
      chapter: 'Counting Stars (1–10)',
      stars: 3,
      questions: [
        { q: 'How many fingers are there on one hand?', options: ['3', '5', '7', '10'], correct: '5', feedback: 'Correct! You have 5 fingers on one hand.' },
        { q: 'Count the stars: ⭐⭐⭐⭐⭐⭐', options: ['4 stars', '5 stars', '6 stars', '7 stars'], correct: '6 stars', feedback: 'Great! There are 6 stars.' },
        { q: 'Which number comes right after 8?', options: ['7', '9', '10', '6'], correct: '9', feedback: 'Super! 9 comes right after 8.' }
      ]
    },
    {
      id: 'q2',
      subject: 'Science',
      chapter: 'Living vs Non-Living Things',
      stars: 0,
      questions: [
        { q: 'Which of these can breathe and grow?', options: ['A rock', 'A toy car', 'A puppy', 'A book'], correct: 'A puppy', feedback: 'Awesome! A puppy is a living thing.' },
        { q: 'A pencil can walk and grow. Is this true?', options: ['True', 'False'], correct: 'False', feedback: 'Correct! A pencil is non-living and cannot walk.' },
        { q: 'Living things need water. Which is living?', options: ['A table', 'A rose plant', 'A water bottle', 'A coin'], correct: 'A rose plant', feedback: 'Super! A rose plant needs water to grow.' }
      ]
    },
    {
      id: 'q3',
      subject: 'English',
      chapter: 'Phonics Rhyme Time',
      stars: 2,
      questions: [
        { q: 'Which word rhymes with CAT?', options: ['DOG', 'PEN', 'HAT', 'PIG'], correct: 'HAT', feedback: 'Correct! CAT and HAT rhyme!' },
        { q: 'Identify the rhyming pair:', options: ['SUN and RUN', 'BOY and MAN', 'TOY and BOX', 'CAR and MAP'], correct: 'SUN and RUN', feedback: 'Super! SUN and RUN rhyme!' },
        { q: 'Which word rhymes with LAKE?', options: ['CAKE', 'BAG', 'DOG', 'SUN'], correct: 'CAKE', feedback: 'Great! LAKE and CAKE rhyme!' }
      ]
    },
    {
      id: 'q4',
      subject: 'EVS',
      chapter: 'Our Helpers in the Neighborhood',
      stars: 0,
      questions: [
        { q: 'Who delivers letters and packages to your home?', options: ['A barber', 'A doctor', 'A postman', 'A driver'], correct: 'A postman', feedback: 'Correct! The postman delivers mail.' },
        { q: 'Who helps you stay healthy when you are sick?', options: ['A carpenter', 'A doctor', 'A helper', 'A painter'], correct: 'A doctor', feedback: 'Super! The doctor helps us heal.' },
        { q: 'Who teaches you at school?', options: ['A driver', 'A teacher', 'A tailor', 'A farmer'], correct: 'A teacher', feedback: 'Awesome! A teacher teaches us lessons.' }
      ]
    }
  ]);

  const totalStarsEarned = quizzesList.reduce((acc, q) => acc + q.stars, 0);
  const maxPossibleStars = quizzesList.length * 3;

  const startQuiz = (quiz: QuizCard) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedOpt(null);
    setCorrectAnswersCount(0);
    setIsFinished(false);
  };

  const handleOptionClick = (opt: string) => {
    if (selectedOpt !== null || !activeQuiz) return;
    setSelectedOpt(opt);

    const correct = activeQuiz.questions[currentQuestionIdx].correct;
    if (opt === correct) {
      setCorrectAnswersCount(prev => prev + 1);
    }

    // Auto advance after 1500ms (to let user see feedback)
    setTimeout(() => {
      if (currentQuestionIdx < activeQuiz.questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedOpt(null);
      } else {
        // Calculate stars earned
        const scorePct = (correctAnswersCount + (opt === correct ? 1 : 0)) / activeQuiz.questions.length;
        let earnedStars = 1;
        if (scorePct === 1) earnedStars = 3;
        else if (scorePct >= 0.6) earnedStars = 2;

        // Update list
        setQuizzesList(prev => prev.map(q => {
          if (q.id === activeQuiz.id) {
            return { ...q, stars: Math.max(q.stars, earnedStars) };
          }
          return q;
        }));

        // Award XP
        incrementXP(earnedStars * 20);
        setIsFinished(true);

        confetti({
          particleCount: 70,
          spread: 50,
          origin: { y: 0.7 }
        });
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {activeQuiz ? (
        /* ACTIVE QUIZ FLOW */
        <div className="bg-white border border-amber-100 rounded-3xl p-6 md:p-8 shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <button
              onClick={() => setActiveQuiz(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Quit Quiz
            </button>
            <span className="badge pill-amber text-[10px] font-black">{activeQuiz.subject}</span>
          </div>

          {!isFinished ? (
            /* ACTIVE QUESTIONS */
            <div className="flex flex-col gap-6 max-w-xl mx-auto">
              {/* Question progress */}
              <div>
                <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  QUESTION {currentQuestionIdx + 1} OF {activeQuiz.questions.length}
                </span>
                <div className="progress-bar mt-1.5 bg-slate-100">
                  <div 
                    className="progress-fill bg-amber-500" 
                    style={{ width: `${((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question text */}
              <h3 className="font-display font-extrabold text-xl text-slate-800 leading-snug mt-2">
                {activeQuiz.questions[currentQuestionIdx].q}
              </h3>

              {/* Option buttons */}
              <div className="flex flex-col gap-2.5 mt-2">
                {activeQuiz.questions[currentQuestionIdx].options.map((opt) => {
                  const correct = activeQuiz.questions[currentQuestionIdx].correct;
                  const isSelected = selectedOpt === opt;
                  const isCorrect = opt === correct;

                  let btnStyle = 'border-slate-200 hover:bg-slate-50 text-slate-700';
                  if (selectedOpt !== null) {
                    if (isCorrect) btnStyle = 'bg-emerald-500 text-white border-transparent shadow-md shadow-emerald-500/10';
                    else if (isSelected) btnStyle = 'bg-red-500 text-white border-transparent shadow-md shadow-red-500/10';
                    else btnStyle = 'opacity-40 border-slate-100 text-slate-400';
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleOptionClick(opt)}
                      disabled={selectedOpt !== null}
                      className={`w-full text-left py-4 px-5 rounded-2xl border font-sans text-xs font-semibold cursor-pointer transition-all ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Feedback text */}
              {selectedOpt !== null && (
                <div className={`p-4 rounded-2xl flex items-start gap-2.5 text-xs font-medium border anim-fade-up ${
                  selectedOpt === activeQuiz.questions[currentQuestionIdx].correct
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                  {selectedOpt === activeQuiz.questions[currentQuestionIdx].correct ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{activeQuiz.questions[currentQuestionIdx].feedback}</span>
                </div>
              )}
            </div>
          ) : (
            /* FINISHED SCORE SCREEN */
            <div className="text-center flex flex-col items-center gap-6 py-6 max-w-xl mx-auto anim-fade-up">
              <div className="w-18 h-18 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center text-4xl shadow-xs select-none">
                ⭐
              </div>

              <div>
                <h3 className="font-display font-black text-2xl text-slate-800">
                  {correctAnswersCount === activeQuiz.questions.length ? 'Awesome, Perfect!' : 'Good job!'}
                </h3>
                <p className="font-sans text-xs text-slate-400 mt-1">
                  You answered {correctAnswersCount} out of {activeQuiz.questions.length} questions correctly.
                </p>
              </div>

              {/* Stars display */}
              <div className="flex gap-2">
                {[1, 2, 3].map((starNum) => {
                  const pct = correctAnswersCount / activeQuiz.questions.length;
                  let isStarred = false;
                  if (starNum === 1 && pct > 0) isStarred = true;
                  if (starNum === 2 && pct >= 0.6) isStarred = true;
                  if (starNum === 3 && pct === 1) isStarred = true;

                  return (
                    <Star 
                      key={starNum}
                      size={36}
                      className={isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}
                    />
                  );
                })}
              </div>

              <div className="bg-amber-50 border border-amber-100/50 p-4 rounded-xl w-full flex justify-between items-center px-6 text-xs font-bold text-amber-800 select-none">
                <span>XP EARNED</span>
                <span>+{correctAnswersCount === 3 ? 60 : correctAnswersCount >= 2 ? 40 : 20} XP</span>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => startQuiz(activeQuiz)}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <RefreshCw size={14} />
                  Retake Quiz
                </button>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs shadow-md shadow-indigo-600/15 cursor-pointer transition-all"
                >
                  Back to Quizzes
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* QUIZZES LIST VIEW */
        <div className="flex flex-col gap-6">
          {/* Top Star Status Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white flex justify-between items-center shadow-md shadow-amber-500/15 select-none">
            <div>
              <h3 className="font-display font-extrabold text-lg md:text-xl">Star Collection</h3>
              <p className="font-sans text-[11px] text-amber-100 font-medium mt-0.5">Collect stars to level up your profile!</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 p-2.5 px-4 rounded-2xl border border-white/10 font-display font-black text-sm">
              <span>⭐</span>
              <span>{totalStarsEarned} / {maxPossibleStars}</span>
            </div>
          </div>

          {/* Quizzes list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzesList.map((quiz) => (
              <div 
                key={quiz.id}
                className="bento-card border border-amber-100/50 bg-white flex flex-col justify-between gap-5 p-6 card-interactive"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="badge pill-amber text-[9px] font-black">{quiz.subject}</span>
                    <h4 className="font-display font-bold text-sm text-slate-800 mt-2">{quiz.chapter}</h4>
                  </div>
                  
                  {/* Stars earned display */}
                  <div className="flex gap-0.5 text-amber-500">
                    {[1, 2, 3].map((num) => (
                      <Star 
                        key={num}
                        size={14}
                        className={num <= quiz.stars ? 'fill-amber-500' : 'text-slate-200'}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-50 mt-1 select-none text-[11px] font-bold">
                  <span className="text-slate-400">Questions: {quiz.questions.length}</span>
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="py-1.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    {quiz.stars > 0 ? 'Retake Quiz' : 'Start Quiz'}
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
