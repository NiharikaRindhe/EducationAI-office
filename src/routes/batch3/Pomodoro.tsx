import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause, RotateCcw, Clock, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SessionLog {
  id: string;
  subject: string;
  duration: number; // mins
  time: string;
}

export const Batch3Pomodoro: React.FC = () => {
  const { incrementXP } = useApp();

  const [preset, setPreset] = useState<'25/5' | '45/10' | '50/10'>('25/5');
  const [subject, setSubject] = useState('Science');
  
  // Timer settings
  const getSecondsFromPreset = (p: string) => {
    const workMins = parseInt(p.split('/')[0]);
    return workMins * 60;
  };

  const [timeLeft, setTimeLeft] = useState(() => getSecondsFromPreset('25/5'));
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Focus time logs
  const [totalFocusTime, setTotalFocusTime] = useState(70); // mins
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([
    { id: 'l1', subject: 'Science', duration: 25, time: '10:15 AM' },
    { id: 'l2', subject: 'Mathematics', duration: 45, time: '11:30 AM' }
  ]);

  const totalSeconds = getSecondsFromPreset(preset);
  const strokeDashoffset = ((totalSeconds - timeLeft) / totalSeconds) * 283;

  useEffect(() => {
    setTimeLeft(getSecondsFromPreset(preset));
    setIsRunning(false);
    setIsBreak(false);
  }, [preset]);

  // Timer interval
  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft <= 0) {
      handleSessionFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleSessionFinish = () => {
    setIsRunning(false);
    const workMins = parseInt(preset.split('/')[0]);
    const breakMins = parseInt(preset.split('/')[1]);

    if (!isBreak) {
      // Finished study focus
      setIsBreak(true);
      setTimeLeft(breakMins * 60);
      setTotalFocusTime(prev => prev + workMins);
      
      const newLog: SessionLog = {
        id: `log_${Date.now()}`,
        subject,
        duration: workMins,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessionLogs(prev => [newLog, ...prev]);
      incrementXP(workMins); // 1 XP per minute studied

      confetti({
        particleCount: 50,
        spread: 30
      });
      alert('Focus session complete! Time for a short break. ☕');
    } else {
      // Finished break
      setIsBreak(false);
      setTimeLeft(workMins * 60);
      alert('Break complete! Let’s focus on the next chapter. 🚀');
    }
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(getSecondsFromPreset(preset));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="grid grid-cols-12 gap-6 font-sans select-none anim-fade-up">
      {/* Left Col: Circular Pomodoro Timer */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <div className="bento-card border border-sky-100 bg-white p-6 md:p-8 flex flex-col items-center justify-center gap-6 shadow-xs min-h-[400px]">
          {/* Preset Buttons */}
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-full select-none">
            {(['25/5', '45/10', '50/10'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`py-1.5 px-4 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  preset === p ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {p.split('/')[0]} min Focus
              </button>
            ))}
          </div>

          {/* Subject logging context */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-display font-semibold text-slate-500">Log topic under:</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-1 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-semibold outline-none"
            >
              {['Science', 'Mathematics', 'Social Science', 'English', 'Hindi'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Large circular timer SVG */}
          <div className="relative w-48 h-48 select-none my-2">
            <svg className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
              <circle 
                cx="96" 
                cy="96" 
                r="45" 
                fill="transparent" 
                stroke="#0ea5e9" 
                strokeWidth="8" 
                strokeDasharray="283"
                strokeDashoffset={283 - strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-black text-3xl text-slate-800 leading-none">
                {formatTime(timeLeft)}
              </span>
              <span className="font-sans text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {isBreak ? '☕ BREAK' : '⚡ FOCUS'}
              </span>
            </div>
          </div>

          {/* Start/pause controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="w-11 h-11 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-xs"
            >
              <RotateCcw size={16} />
            </button>
            
            <button
              onClick={handleStartPause}
              className="py-3 px-8 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-sans font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/10 transition-all"
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
              {isRunning ? 'Pause Timer' : 'Start Focus'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Col: Logs & stats */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        {/* Total focus time today */}
        <div className="bento-card border border-sky-100 bg-white p-5 text-center flex flex-col gap-2">
          <span className="text-3xl select-none">🍅</span>
          <span className="font-display font-extrabold text-3xl text-sky-500">{totalFocusTime} Mins</span>
          <span className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wide">Total Focus Today</span>
          <p className="text-[9px] text-slate-400">Earned +1 XP for every minute focused!</p>
        </div>

        {/* Sessions log list */}
        <div className="bento-card border border-sky-100 bg-white p-5">
          <span className="font-display font-bold text-xs text-slate-700 block mb-3">Today's Focus Log</span>
          
          <div className="flex flex-col gap-2.5 font-sans text-xs">
            {sessionLogs.map((log) => (
              <div 
                key={log.id}
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={12} className="text-sky-500" />
                  <span className="font-semibold text-slate-700">{log.subject}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold">
                  <span>{log.duration} mins</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
