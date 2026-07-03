import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Batch4Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { currentStream } = useApp();
  
  const [step, setStep] = useState(1);
  const [stream, setStream] = useState<'JEE' | 'NEET'>('JEE');
  const [targetYear, setTargetYear] = useState('2027');
  const [prepLevel, setPrepLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');

  const handleNext = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      // Save onboarding config
      localStorage.setItem('batch4_stream', stream);
      localStorage.setItem('batch4_target_year', targetYear);
      localStorage.setItem('batch4_prep_level', prepLevel);
      localStorage.setItem('batch4_onboarded', 'true');

      confetti({
        particleCount: 50,
        spread: 30
      });
      navigate('/batch4/home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#fcf8ff] font-sans select-none">
      <div className="w-full max-w-[460px] bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-md flex flex-col gap-6 anim-fade-up">
        
        {/* Step dots */}
        <div className="flex justify-center items-center gap-1.5 border-b border-slate-50 pb-4">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`w-2.5 h-2.5 rounded-full ${
                step === s ? 'bg-purple-600 scale-110' : 'bg-slate-200'
              }`}
            ></div>
          ))}
        </div>

        {/* STEP 1: Stream Selection */}
        {step === 1 && (
          <div className="flex flex-col gap-5 text-center">
            <div>
              <span className="badge pill-purple font-bold">STEP 1</span>
              <h2 className="font-display font-extrabold text-xl text-slate-800 mt-2">Choose your entrance path</h2>
              <p className="font-sans text-xs text-slate-400 mt-1">This will configure your subject layout and syllabus models</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStream('JEE')}
                className={`p-6 border rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  stream === 'JEE'
                    ? 'border-purple-600 bg-purple-50/30 text-purple-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-500'
                }`}
              >
                <span className="text-3xl">📐</span>
                <span className="text-xs font-semibold">JEE (Engineering)</span>
                <span className="text-[9px] text-slate-400 font-medium">Physics, Chemistry, Maths</span>
              </button>

              <button
                type="button"
                onClick={() => setStream('NEET')}
                className={`p-6 border rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  stream === 'NEET'
                    ? 'border-purple-600 bg-purple-50/30 text-purple-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-500'
                }`}
              >
                <span className="text-3xl">🧬</span>
                <span className="text-xs font-semibold">NEET (Medical)</span>
                <span className="text-[9px] text-slate-400 font-medium">Physics, Chemistry, Biology</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Target Year */}
        {step === 2 && (
          <div className="flex flex-col gap-5 text-center">
            <div>
              <span className="badge pill-purple font-bold">STEP 2</span>
              <h2 className="font-display font-extrabold text-xl text-slate-800 mt-2">Select your target year</h2>
              <p className="font-sans text-xs text-slate-400 mt-1">Configure your board and entrance exam calendars</p>
            </div>

            <select
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl font-sans text-xs font-bold outline-none"
            >
              <option value="2027">2027 Entrance (Class 11)</option>
              <option value="2028">2028 Entrance (Class 12)</option>
            </select>
          </div>
        )}

        {/* STEP 3: Prep level */}
        {step === 3 && (
          <div className="flex flex-col gap-5 text-center">
            <div>
              <span className="badge pill-purple font-bold">STEP 3</span>
              <h2 className="font-display font-extrabold text-xl text-slate-800 mt-2">Evaluate preparation level</h2>
              <p className="font-sans text-xs text-slate-400 mt-1">Configure your study plan difficulty indicators</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {([
                { key: 'Beginner', title: 'Beginner (Syllabus focus)', desc: 'Starting with core NCERT textbooks' },
                { key: 'Intermediate', title: 'Intermediate (Concepts & Practice)', desc: 'Familiar with concepts, need mock sheets' },
                { key: 'Advanced', title: 'Advanced (Rank Maximizer)', desc: 'Strong foundations, focusing on PYQs & hard questions' }
              ] as const).map((level) => (
                <button
                  key={level.key}
                  onClick={() => setPrepLevel(level.key)}
                  className={`w-full text-left p-4 border rounded-xl flex flex-col gap-0.5 cursor-pointer transition-all ${
                    prepLevel === level.key 
                      ? 'border-purple-600 bg-purple-50/20 font-bold' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-700">{level.title}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{level.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          {step === 3 ? 'Launch Prep Dashboard' : 'Next Step'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
