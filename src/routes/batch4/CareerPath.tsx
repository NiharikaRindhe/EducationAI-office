import React, { useState } from 'react';
import { Sparkles, GraduationCap, ChevronRight, Award, Trophy, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Career {
  icon: string;
  name: string;
  match: number;
  exams: string;
  colleges: string;
  salary: string;
}

export const Batch4CareerPath: React.FC = () => {
  const [physicsScore, setPhysicsScore] = useState(85);
  const [chemScore, setChemScore] = useState(78);
  const [mathsBioScore, setMathsBioScore] = useState(90);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recommendations, setRecommendations] = useState<Career[] | null>(null);

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);
    setRecommendations(null);

    // Simulate 1600ms AI score analysis
    setTimeout(() => {
      setIsEvaluating(false);
      setRecommendations([
        { icon: '💻', name: 'Software Engineering & AI Research', match: 94, exams: 'JEE Advanced, BITSAT', colleges: 'IIT Bombay, IIIT Hyderabad, BITS Pilani', salary: '₹12L – ₹35L / annum' },
        { icon: '🚀', name: 'Aerospace & Robotics Engineering', match: 88, exams: 'JEE Advanced, GATE', colleges: 'IIT Madras, IIST Thiruvananthapuram', salary: '₹9L – ₹22L / annum' },
        { icon: '🧬', name: 'Biotech & Bioinformatics Research', match: 72, exams: 'NEET, JEE Mains', colleges: 'IISc Bangalore, AIIMS Delhi', salary: '₹6L – ₹15L / annum' },
        { icon: '⚖️', name: 'Corporate Patent Law & IP', match: 65, exams: 'CLAT', colleges: 'NLSIU Bangalore, NALSAR Hyderabad', salary: '₹10L – ₹20L / annum' }
      ]);
      confetti({
        particleCount: 50,
        spread: 30
      });
    }, 1600);
  };

  return (
    <div className="grid grid-cols-12 gap-6 font-sans select-none anim-fade-up">
      {/* Left Col: score entries */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
        <div className="bento-card border border-purple-100 bg-white p-6 flex flex-col gap-5 text-left">
          <h3 className="font-display font-bold text-sm text-slate-800">Evaluate Career Pathway</h3>
          
          <form onSubmit={handleEvaluate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline font-label-caps text-[9px] font-bold text-slate-400">
                <span>PHYSICS SCORE</span>
                <span className="text-purple-600 text-xs font-display font-bold">{physicsScore}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={physicsScore}
                onChange={(e) => setPhysicsScore(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline font-label-caps text-[9px] font-bold text-slate-400">
                <span>CHEMISTRY SCORE</span>
                <span className="text-purple-600 text-xs font-display font-bold">{chemScore}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={chemScore}
                onChange={(e) => setChemScore(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline font-label-caps text-[9px] font-bold text-slate-400">
                <span>MATHS / BIOLOGY SCORE</span>
                <span className="text-purple-600 text-xs font-display font-bold">{mathsBioScore}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={mathsBioScore}
                onChange={(e) => setMathsBioScore(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isEvaluating}
              className="w-full py-3.5 mt-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/10 transition-all"
            >
              {isEvaluating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing Score models...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="animate-pulse" />
                  Evaluate Career path
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Col: AI recommendations */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
        {recommendations ? (
          <div className="flex flex-col gap-4 animate-fade-up">
            <span className="font-display font-bold text-xs text-slate-700 text-left block">Top AI Recommendations</span>
            
            <div className="flex flex-col gap-4">
              {recommendations.map((car, idx) => (
                <div 
                  key={idx}
                  className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-3.5 card-interactive text-left"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-slate-50 border border-slate-100 p-2.5 rounded-2xl select-none">
                        {car.icon}
                      </span>
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-800">{car.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Average Salary: {car.salary}</span>
                      </div>
                    </div>
                    <span className="badge pill-purple text-[10px] font-black">
                      {car.match}% Match
                    </span>
                  </div>

                  <div className="w-full h-[1px] bg-slate-100"></div>

                  <div className="flex flex-col gap-1.5 font-sans text-xs text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Exams Needed:</span>
                      <span className="font-bold text-slate-800">{car.exams}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Colleges:</span>
                      <span className="font-bold text-purple-600 truncate max-w-[250px]">{car.colleges}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bento-card border border-dashed border-slate-200 bg-white/50 p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[300px]">
            <span className="text-4xl select-none">🎓</span>
            <span className="font-sans font-bold text-xs text-slate-400">Enter scores and evaluate</span>
            <span className="text-[10px] text-slate-400 max-w-[200px]">Top college pathways and entrance requirements will appear here.</span>
          </div>
        )}
      </div>
    </div>
  );
};
