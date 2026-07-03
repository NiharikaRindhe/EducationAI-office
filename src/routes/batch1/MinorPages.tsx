import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Award, Camera, Flame, Check, Sparkles, Trophy, Mic, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

/* ----------------------------------------------------
   1. BATCH 1 BADGES COLLECTION
---------------------------------------------------- */
export const Batch1Badges: React.FC = () => {
  const earnedBadges = [
    { icon: '🦁', title: 'Math Hero', desc: 'Completed 10 math star quizzes', date: 'Earned 3 days ago' },
    { icon: '🔥', title: 'Streak Master 7d', desc: 'Logged in for 7 days in a row', date: 'Earned 5 days ago' },
    { icon: '🚀', title: 'Space Voyager', desc: 'Solved 100% on Science Space Quiz', date: 'Earned 1 week ago' },
    { icon: '🦉', title: 'Reading Star', desc: 'Read 5 stories in the reader', date: 'Earned 2 weeks ago' }
  ];

  const lockedBadges = [
    { icon: '🐯', title: 'Streak Master 30d', desc: 'Log in for 30 days in a row to unlock' },
    { icon: '🧠', title: 'Perfect 100', desc: 'Score 100% on 15 quizzes to unlock' },
    { icon: '📸', title: 'Explorer Guide', desc: 'Upload 10 items in Show & Tell to unlock' },
    { icon: '🏆', title: 'EduAI Champion', desc: 'Reach Level 10 XP to unlock' }
  ];

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Earned Badges */}
      <div className="flex flex-col gap-4">
        <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
          <Award size={16} className="text-amber-500" />
          Earned Badges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {earnedBadges.map((badge, idx) => (
            <div key={idx} className="bento-card border border-amber-100 bg-amber-50/20 text-center p-5 flex flex-col items-center gap-2 card-interactive shadow-md shadow-amber-500/5">
              <span className="text-4xl bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs select-none">
                {badge.icon}
              </span>
              <h4 className="font-display font-bold text-sm text-slate-800 mt-1">{badge.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-normal">{badge.desc}</p>
              <span className="text-[9px] font-bold text-emerald-600 font-label-caps mt-2 select-none">
                ✓ {badge.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Locked Badges */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 mt-2">
        <h3 className="font-display font-bold text-sm text-slate-400 flex items-center gap-2">
          🔒 Locked Badges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {lockedBadges.map((badge, idx) => (
            <div key={idx} className="bento-card border border-slate-100 bg-white text-center p-5 flex flex-col items-center gap-2 opacity-50">
              <span className="text-4xl grayscale w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100 select-none">
                {badge.icon}
              </span>
              <h4 className="font-display font-bold text-sm text-slate-700 mt-1">{badge.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-normal">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   2. BATCH 1 VISION AI SHOW & TELL
---------------------------------------------------- */
export const Batch1ShowAndTell: React.FC = () => {
  const { incrementXP } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ label: string; facts: string[] } | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleMockUpload = () => {
    setIsUploading(true);
    setAnalysisResult(null);

    // Simulate 1800ms AI image analysis
    setTimeout(() => {
      setIsUploading(false);
      setAnalysisResult({
        label: '🔬 Green Oak Leaf',
        facts: [
          'Oak leaves make food for the tree using sunlight! ☀️',
          'Oak trees can live for more than 500 years in the forest! 🌳',
          'Squirrels love to nest inside the branches of oak trees! 🐿️'
        ]
      });
      incrementXP(60);
      confetti({
        particleCount: 40,
        spread: 30
      });
    }, 1800);
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
      }, 3000);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 font-sans select-none anim-fade-up">
      {/* Upload area */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
        <div className="bento-card border border-amber-100/50 bg-white p-6 md:p-8 flex flex-col items-center justify-center text-center gap-6 min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-100 flex items-center justify-center text-3xl select-none">
            📸
          </div>
          
          <div className="max-w-xs">
            <h3 className="font-display font-bold text-sm text-slate-800">Upload something to show!</h3>
            <p className="font-sans text-[11px] text-slate-400 leading-normal mt-1">
              Take a photo of a leaf, a toy, or a book. Our AI will tell you fun scientific facts!
            </p>
          </div>

          <div className="flex gap-3 select-none">
            <button
              onClick={handleMockUpload}
              disabled={isUploading}
              className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold text-xs shadow-md shadow-amber-500/15 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isUploading ? 'Analyzing photo...' : 'Take Photo (Mock)'}
            </button>
            
            <button
              onClick={handleVoiceToggle}
              className={`py-3 px-5 rounded-xl border font-sans font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isRecording 
                  ? 'bg-red-500 border-transparent text-white animate-pulse' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-500'
              }`}
            >
              <Mic size={14} />
              {isRecording ? 'Listening...' : 'Voice Explain'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Analysis Result */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
        {analysisResult ? (
          <div className="bento-card border border-emerald-100 bg-white p-6 flex flex-col gap-4 animate-fade-up">
            <div className="flex justify-between items-center select-none">
              <span className="font-label-caps text-[9px] font-black text-emerald-800">AI VISION RESULT</span>
              <span className="badge pill-green text-[9px] font-black">+60 XP Earned</span>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-800">{analysisResult.label}</h3>
              <p className="font-sans text-[10px] text-slate-400">Classified correctly via camera analysis</p>
            </div>
            <div className="w-full h-[1px] bg-slate-100"></div>
            <ul className="flex flex-col gap-3 font-sans text-xs text-slate-600 font-medium">
              {analysisResult.facts.map((fact, idx) => (
                <li key={idx} className="flex gap-2.5 items-start">
                  <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bento-card border border-dashed border-slate-200 bg-white/50 p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[300px]">
            <span className="text-3xl select-none">🔬</span>
            <span className="font-sans font-bold text-xs text-slate-400">Waiting for upload...</span>
            <span className="text-[10px] text-slate-400 max-w-[200px]">Results containing fun scientific facts will appear here.</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   3. BATCH 1 STREAK CALENDAR
---------------------------------------------------- */
export const Batch1Streak: React.FC = () => {
  const { studentStreak, incrementStreak, incrementXP } = useApp();
  const [checkedInToday, setCheckedInToday] = useState(false);

  const handleCheckin = () => {
    if (checkedInToday) return;
    setCheckedInToday(true);
    incrementStreak();
    incrementXP(30);
    confetti({
      particleCount: 50,
      spread: 40,
      colors: ['#f59e0b', '#fb923c']
    });
  };

  // 31 days calendar array helper
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Top Streak summary */}
      <div className="bg-gradient-to-tr from-amber-500 to-orange-500 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-amber-500/10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl shadow-sm">
            🔥
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl">
              {studentStreak} Days Learning!
            </h2>
            <p className="font-sans text-xs text-amber-100 font-medium mt-0.5">
              Keep checking in every day to collect bonus XP rewards.
            </p>
          </div>
        </div>

        <button
          onClick={handleCheckin}
          disabled={checkedInToday}
          className={`py-3.5 px-7 rounded-2xl font-sans font-bold text-xs cursor-pointer shadow-lg transition-all ${
            checkedInToday
              ? 'bg-white/20 border border-white/25 text-white/80 cursor-default shadow-none'
              : 'bg-white hover:bg-slate-50 text-orange-600 hover:-translate-y-0.5 shadow-orange-500/10'
          }`}
        >
          {checkedInToday ? '✓ Checked In Today' : 'Daily Check-In!'}
        </button>
      </div>

      {/* Streaks Heatmap Grid */}
      <div className="bento-card border border-amber-100/50 bg-white p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <span className="font-display font-bold text-sm text-slate-800">June 2026 Checkins</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Record: 12 days</span>
        </div>

        <div className="grid grid-cols-7 gap-2.5 text-center mt-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <span key={d} className="text-[10px] font-black text-slate-400 py-1">{d}</span>
          ))}

          {/* June offset start days (Mon is 1st) */}
          {days.map((day) => {
            // Mock active study checkins (first 12 days and today if checked in)
            const isActive = day <= 12 || (day === 13 && checkedInToday);
            return (
              <div 
                key={day}
                className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-amber-500 text-white shadow-xs font-black' 
                    : 'bg-slate-50 border border-slate-100 text-slate-400'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   4. BATCH 1 PROFILE CUSTOMIZER
---------------------------------------------------- */
const EMOJI_OPTIONS = ['🦊', '🐯', '🦋', '🚀', '🦁', '🐼', '🦄', '🦖', '🐨', '🐸', '🐙', '🐝'];

export const Batch1Profile: React.FC = () => {
  const { studentName, studentAvatar, updateStudentProfile, studentXP } = useApp();

  const [nameInput, setNameInput] = useState(studentName);
  const [selectedEmoji, setSelectedEmoji] = useState(studentAvatar);
  const [isSaved, setIsSaved] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput) return;

    updateStudentProfile(nameInput, selectedEmoji);
    setIsSaved(true);
    
    confetti({
      particleCount: 30,
      spread: 20
    });

    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto font-sans select-none anim-fade-up">
      <div className="bento-card border border-amber-100/50 bg-white p-6 md:p-8 flex flex-col gap-6">
        
        {/* Header avatar display */}
        <div className="flex flex-col items-center gap-3 py-4 border-b border-slate-50 text-center">
          <span className="text-6xl bg-slate-50 border border-slate-100 w-20 h-20 rounded-3xl flex items-center justify-center shadow-xs select-none">
            {selectedEmoji}
          </span>
          <div>
            <h3 className="font-display font-extrabold text-lg text-slate-800">{studentName}</h3>
            <span className="text-[10px] text-slate-400 font-bold tracking-wide uppercase font-label-caps block mt-0.5">
              XP Count: {studentXP}
            </span>
          </div>
        </div>

        {/* Profile customization form */}
        <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">NICKNAME</label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl font-sans text-xs font-semibold outline-none transition-all"
              placeholder="e.g. Dev"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">SELECT AVATAR EMOJI</label>
            <div className="grid grid-cols-6 gap-2 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-11 h-11 text-2xl flex items-center justify-center rounded-xl cursor-pointer hover:scale-110 transition-transform ${
                    selectedEmoji === emoji 
                      ? 'bg-white ring-2 ring-amber-500 shadow-sm' 
                      : 'bg-white/50 border border-slate-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold text-xs shadow-md shadow-amber-500/15 cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            {isSaved ? '✓ Profile Details Saved!' : 'Save Custom Profile'}
          </button>
        </form>

      </div>
    </div>
  );
};
