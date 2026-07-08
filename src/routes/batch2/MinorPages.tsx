import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Award, Flame, Search, ChevronRight, Check, Trophy, BookOpen, Clock, FileText, Plus, HelpCircle, Sparkles, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeaderboardView } from '../../components/shared/LeaderboardView';
import { NotesView } from '../../components/shared/NotesView';

/* ----------------------------------------------------
   1. BATCH 2 STUDY NOTES — real notes, backed by /student/notes
---------------------------------------------------- */
export const Batch2Notes: React.FC = () => <NotesView accent="indigo" />;

/* ----------------------------------------------------
   2. BATCH 2 PAST YEAR QUESTIONS (PYQ) HUB
---------------------------------------------------- */
interface PyqPaper {
  id: string;
  year: number;
  subject: string;
  attempted: boolean;
  score?: number;
}

export const Batch2Pyq: React.FC = () => {
  const [papers, setPapers] = useState<PyqPaper[]>([
    { id: 'p1', year: 2024, subject: 'Mathematics', attempted: true, score: 90 },
    { id: 'p2', year: 2023, subject: 'Science', attempted: false },
    { id: 'p3', year: 2023, subject: 'Mathematics', attempted: true, score: 75 },
    { id: 'p4', year: 2022, subject: 'Social Science', attempted: false }
  ]);

  const [activeTab, setActiveTab] = useState<'All' | 'Mathematics' | 'Science'>('All');
  const [solutionsPaper, setSolutionsPaper] = useState<PyqPaper | null>(null);

  const filteredPapers = papers.filter(p => activeTab === 'All' || p.subject === activeTab);

  const handleSolutionsToggle = (paper: PyqPaper) => {
    setSolutionsPaper(paper);
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Subject selector */}
      <div className="flex gap-2 border-b border-slate-100 pb-3">
        {(['All', 'Mathematics', 'Science'] as const).map((tab) => (
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

      {/* Grid of papers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPapers.map((paper) => (
          <div key={paper.id} className="bento-card border border-slate-100 bg-white p-6 flex flex-col justify-between gap-5 card-interactive text-left">
            <div>
              <div className="flex justify-between items-start">
                <span className="badge pill-indigo text-[9px] font-black">{paper.subject}</span>
                <span className="text-[10px] text-slate-400 font-bold font-display">{paper.year} Paper</span>
              </div>
              <h4 className="font-display font-bold text-sm text-slate-800 mt-2.5">
                CBSE Class 7 {paper.subject} Board Paper
              </h4>
              <p className="font-sans text-[11px] text-slate-400 mt-1">Official term-end paper mock compilation</p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2 text-[11px] font-bold">
              {paper.attempted ? (
                <span className="badge pill-green text-[9px] font-bold">
                  Score: {paper.score}%
                </span>
              ) : (
                <span className="text-slate-400">Not Attempted</span>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleSolutionsToggle(paper)}
                  className="py-1 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  View Solutions
                </button>
                <button
                  className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  Attempt Paper
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Solutions Modal */}
      {solutionsPaper && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-left flex flex-col gap-4 anim-fade-up">
            <h3 className="font-display font-bold text-sm text-slate-800">
              Solutions Ch {solutionsPaper.year} ({solutionsPaper.subject})
            </h3>
            
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-3 font-sans text-xs text-slate-600 leading-relaxed max-h-60 overflow-y-auto">
              <div>
                <span className="font-bold text-indigo-600">Q1. Solve 3x + 4 = 19</span>
                <p className="mt-1">Answer: Subtract 4 to get 3x = 15. Divide by 3 to get x = 5.</p>
              </div>
              <div className="w-full h-[1px] bg-slate-200/50"></div>
              <div>
                <span className="font-bold text-indigo-600">Q2. What is the value of 5 squared?</span>
                <p className="mt-1">Answer: 5 * 5 = 25.</p>
              </div>
            </div>

            <button
              onClick={() => setSolutionsPaper(null)}
              className="w-full py-3 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-xs cursor-pointer transition-all text-center"
            >
              Close Solutions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ----------------------------------------------------
   3. BATCH 2 LEADERBOARD — real school+batch rankings
---------------------------------------------------- */
export const Batch2Leaderboard: React.FC = () => <LeaderboardView accent="indigo" />;

/* ----------------------------------------------------
   4. BATCH 2 DAILY CHALLENGES (3-STATE)
---------------------------------------------------- */
interface Challenge {
  id: string;
  title: string;
  subject: string;
  diff: 'Easy' | 'Medium' | 'Hard';
  xp: number;
  time: string;
}

export const Batch2DailyChallenges: React.FC = () => {
  const { incrementXP } = useApp();

  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [gameState, setGameState] = useState<'list' | 'quiz' | 'done'>('list');
  const [selectedAns, setSelectedAns] = useState<string | null>(null);

  const challengesList: Challenge[] = [
    { id: 'c1', title: 'Solve 2x + 7 = 15', subject: 'Maths', diff: 'Easy', xp: 40, time: '3 mins' },
    { id: 'c2', title: 'Identify acidic indicators', subject: 'Science', diff: 'Medium', xp: 60, time: '5 mins' }
  ];

  const handleStartChallenge = (c: Challenge) => {
    setActiveChallenge(c);
    setSelectedAns(null);
    setGameState('quiz');
  };

  const handleAnswerSubmit = (ans: string) => {
    setSelectedAns(ans);
    // Award calculated XP (simulated 100% score)
    incrementXP(activeChallenge?.xp || 40);
    setTimeout(() => {
      setGameState('done');
      confetti({
        particleCount: 50,
        spread: 30
      });
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {gameState === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challengesList.map((ch) => (
            <div key={ch.id} className="bento-card border border-indigo-100 bg-white p-6 flex flex-col justify-between gap-5 card-interactive text-left">
              <div>
                <div className="flex justify-between items-start">
                  <span className="badge pill-indigo text-[9px] font-black">{ch.subject}</span>
                  <span className="badge pill-amber text-[9px] font-bold">{ch.diff}</span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-800 mt-2.5">{ch.title}</h4>
                <p className="font-sans text-[11px] text-slate-400 mt-1">Reward: +{ch.xp} XP · Time: {ch.time}</p>
              </div>

              <button
                onClick={() => handleStartChallenge(ch)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
              >
                Start Challenge
              </button>
            </div>
          ))}
        </div>
      )}

      {gameState === 'quiz' && activeChallenge && (
        <div className="bento-card border border-indigo-100 bg-white p-6 md:p-8 max-w-xl mx-auto flex flex-col gap-6 text-left">
          <div>
            <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              DAILY CHALLENGE · {activeChallenge.subject}
            </span>
            <h3 className="font-display font-extrabold text-lg text-slate-800 leading-snug mt-2">
              {activeChallenge.id === 'c1' ? 'Solve for x: 2x + 7 = 15' : 'Which of the following turns blue litmus red?'}
            </h3>
          </div>

          <div className="flex flex-col gap-2.5 select-none">
            {(activeChallenge.id === 'c1' 
              ? ['x = 4', 'x = 6', 'x = 3', 'x = 5']
              : ['Acidic indicators', 'Basic indicators', 'Neutral solutions', 'Distilled water']
            ).map((opt) => {
              const correct = activeChallenge.id === 'c1' ? 'x = 4' : 'Acidic indicators';
              const isSelected = selectedAns === opt;
              const isCorrect = opt === correct;

              let btnStyle = 'border-slate-200 hover:bg-slate-50 text-slate-700';
              if (selectedAns !== null) {
                if (isCorrect) btnStyle = 'bg-emerald-500 text-white border-transparent';
                else if (isSelected) btnStyle = 'bg-red-500 text-white border-transparent';
                else btnStyle = 'opacity-30 border-slate-100 text-slate-400';
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleAnswerSubmit(opt)}
                  disabled={selectedAns !== null}
                  className={`w-full text-left py-4 px-5 rounded-2xl border font-sans text-xs font-semibold cursor-pointer transition-all ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'done' && activeChallenge && (
        <div className="bento-card border border-indigo-100 bg-white p-6 md:p-8 max-w-md mx-auto text-center flex flex-col items-center gap-5 anim-fade-up">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center text-4xl shadow-xs select-none">
            ✓
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-slate-800">Challenge Done!</h3>
            <p className="font-sans text-xs text-slate-400 mt-1">Excellent speed. Your reward is issued.</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-3.5 px-6 rounded-xl text-xs font-bold text-amber-800 select-none w-full flex justify-between items-center">
            <span>XP MULTIPLIER</span>
            <span>+{activeChallenge.xp} XP Earned</span>
          </div>
          <button
            onClick={() => setGameState('list')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Back to Challenges
          </button>
        </div>
      )}
    </div>
  );
};

/* ----------------------------------------------------
   5. BATCH 2 STREAK TRACKER
---------------------------------------------------- */
export const Batch2Streak: React.FC = () => {
  const { studentStreak } = useApp();
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Top Banner */}
      <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white flex items-center justify-between shadow-md select-none">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-4xl shadow-xs">
            🔥
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl">{studentStreak} Days Learning</h2>
            <p className="font-sans text-xs text-indigo-100 mt-0.5">Syllabus milestones unlocked: 3/5</p>
          </div>
        </div>
        <div className="bg-white/20 p-3 px-5 rounded-2xl border border-white/10 font-display font-black text-sm">
          Active Mode
        </div>
      </div>

      {/* Heatmap */}
      <div className="bento-card border border-indigo-100 bg-white p-5">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
          <span className="font-display font-bold text-sm text-slate-800">Checkin Heatmap</span>
        </div>
        <div className="grid grid-cols-7 gap-2.5 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
            <span key={d} className="text-[10px] font-black text-slate-400">{d}</span>
          ))}
          {days.map(d => {
            const active = d <= 12;
            return (
              <div 
                key={d}
                className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                  active ? 'bg-indigo-600 text-white' : 'bg-slate-50 border border-slate-100 text-slate-400'
                }`}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   6. BATCH 2 ACADEMIC BADGES
---------------------------------------------------- */
export const Batch2Badges: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: '📐', title: 'Maths Topper', desc: 'A+ average in algebra tests' },
          { icon: '🔬', title: 'Science Master', desc: 'Completed living things unit' },
          { icon: '💬', title: 'AI Scholar', desc: 'Asked AI tutor 15 questions' },
          { icon: '🏆', title: 'Podium Ranker', desc: 'Placed in top 3 on leaderboard' }
        ].map((badge, idx) => (
          <div key={idx} className="bento-card border border-indigo-100 bg-indigo-50/10 text-center p-5 flex flex-col items-center gap-2 card-interactive shadow-xs">
            <span className="text-4xl bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs">
              {badge.icon}
            </span>
            <h4 className="font-display font-bold text-sm text-slate-800 mt-1">{badge.title}</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-normal">{badge.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   7. BATCH 2 PROFILE SETTINGS
---------------------------------------------------- */
export const Batch2Profile: React.FC = () => {
  const { studentName, updateStudentProfile } = useApp();
  const [nameInput, setNameInput] = useState(studentName);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    updateStudentProfile(nameInput, '🦋');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto font-sans select-none anim-fade-up">
      <div className="bento-card border border-indigo-100 bg-white p-6 md:p-8 flex flex-col gap-5">
        <h3 className="font-display font-bold text-sm text-slate-800">Edit Student Profile</h3>
        
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[9px] font-bold text-slate-400">STUDENT NAME</label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            {isSaved ? '✓ Profile Details Saved!' : 'Save Details'}
          </button>
        </form>
      </div>
    </div>
  );
};
