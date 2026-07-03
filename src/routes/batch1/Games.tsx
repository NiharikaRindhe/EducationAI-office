import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, RefreshCw, Star, Play, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Game {
  id: string;
  name: string;
  icon: string;
  subject: string;
  stars: number;
  locked?: boolean;
}

export const Batch1Games: React.FC = () => {
  const { incrementXP } = useApp();

  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const gamesData: Game[] = [
    { id: 'alphabet-tracing', name: 'Alphabet Tracing', icon: '✍️', subject: 'English', stars: 3 },
    { id: 'phonics-pop', name: 'Phonics Pop', icon: '🎈', subject: 'English', stars: 2 },
    { id: 'count-and-add', name: 'Count & Add Stars', icon: '🔢', subject: 'Maths', stars: 0 },
    { id: 'g4', name: 'Shape sorter', icon: '🔷', subject: 'Maths', stars: 3, locked: true },
    { id: 'g5', name: 'Word builder', icon: '✏️', subject: 'English', stars: 1, locked: true },
    { id: 'g6', name: 'Animal sounds matching', icon: '🦁', subject: 'Science', stars: 0, locked: true },
    { id: 'g7', name: 'Color picker fun', icon: '🎨', subject: 'EVS', stars: 2, locked: true },
    { id: 'g8', name: 'Fruit count race', icon: '🍎', subject: 'Maths', stars: 0, locked: true },
    { id: 'g9', name: 'Plant grower clicker', icon: '🌻', subject: 'Science', stars: 0, locked: true },
    { id: 'g10', name: 'Map puzzle helper', icon: '🗺️', subject: 'EVS', stars: 0, locked: true },
    { id: 'g11', name: 'Spelling bee train', icon: '🚂', subject: 'English', stars: 0, locked: true },
    { id: 'g12', name: 'Pattern blocks matcher', icon: '⏹️', subject: 'Maths', stars: 0, locked: true },
    { id: 'g13', name: 'Space adventure count', icon: '🚀', subject: 'Science', stars: 0, locked: true },
    { id: 'g14', name: 'Body parts labeling', icon: '🧍', subject: 'EVS', stars: 0, locked: true },
    { id: 'g15', name: 'Sentence composer', icon: '📝', subject: 'English', stars: 0, locked: true },
    { id: 'g16', name: 'Clock time explorer', icon: '⏰', subject: 'Maths', stars: 0, locked: true }
  ];

  /* ----------------------------------------------------
     GAME 1: ALPHABET TRACING
  ---------------------------------------------------- */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tracingFinished, setTracingFinished] = useState(false);

  // Initialize canvas with dotted guideline
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTracingFinished(false);

    // Draw dotted 'A' guideline
    ctx.font = 'bold 240px Outfit, sans-serif';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('A', canvas.width / 2, canvas.height / 2);

    // Reset settings for drawing
    ctx.setLineDash([]);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
  };

  useEffect(() => {
    if (activeGameId === 'alphabet-tracing') {
      setTimeout(initCanvas, 50); // Wait for canvas element render
    }
  }, [activeGameId]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const finishTracing = () => {
    setTracingFinished(true);
    incrementXP(40);
    confetti({
      particleCount: 50,
      spread: 40
    });
  };

  /* ----------------------------------------------------
     GAME 2: PHONICS POP
  ---------------------------------------------------- */
  const [phonicsScore, setPhonicsScore] = useState(0);
  const [phonicsBalloons, setPhonicsBalloons] = useState<{ id: number; char: string; x: number; y: number; color: string }[]>([]);
  const [phonicsPrompt, setPhonicsPrompt] = useState('A'); // Sound: 'Ah'
  const [phonicsFinished, setPhonicsFinished] = useState(false);

  const initPhonics = () => {
    setPhonicsScore(0);
    setPhonicsFinished(false);
    generateBalloons('A');
  };

  const generateBalloons = (correctChar: string) => {
    setPhonicsPrompt(correctChar);
    const pool = ['A', 'B', 'C', 'D', 'E', 'F'];
    const colors = ['bg-rose-400', 'bg-sky-400', 'bg-amber-400', 'bg-emerald-400', 'bg-purple-400', 'bg-indigo-400'];

    const newBalloons = [];
    for (let i = 0; i < 6; i++) {
      const char = i === 0 ? correctChar : pool.filter(c => c !== correctChar)[Math.floor(Math.random() * 5)];
      newBalloons.push({
        id: Math.random() + i,
        char,
        x: 10 + Math.random() * 80, // percentage left
        y: 20 + Math.random() * 60, // percentage top
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Shuffle balloons
    setPhonicsBalloons(newBalloons.sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    if (activeGameId === 'phonics-pop') {
      initPhonics();
    }
  }, [activeGameId]);

  const handlePopBalloon = (char: string, id: number) => {
    if (char === phonicsPrompt) {
      setPhonicsScore(prev => prev + 1);
      setPhonicsBalloons(prev => prev.filter(b => b.id !== id));
      
      confetti({
        particleCount: 20,
        spread: 30,
        colors: ['#3b82f6', '#f59e0b', '#ef4444']
      });

      if (phonicsScore + 1 >= 5) {
        setPhonicsFinished(true);
        incrementXP(50);
      } else {
        // Generate next prompt
        const prompts = ['B', 'C', 'D', 'E', 'F'];
        const nextPrompt = prompts[phonicsScore % prompts.length];
        setTimeout(() => generateBalloons(nextPrompt), 400);
      }
    }
  };

  /* ----------------------------------------------------
     GAME 3: COUNT & ADD STARS
  ---------------------------------------------------- */
  const [countScore, setCountScore] = useState(0);
  const [countLeftStars, setCountLeftStars] = useState(3);
  const [countRightStars, setCountRightStars] = useState(2);
  const [countOptions, setCountOptions] = useState<number[]>([]);
  const [countSelected, setCountSelected] = useState<number | null>(null);
  const [countFeedback, setCountFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [countFinished, setCountFinished] = useState(false);

  const initCountGame = () => {
    setCountScore(0);
    setCountFinished(false);
    generateAddSum();
  };

  const generateAddSum = () => {
    setCountSelected(null);
    setCountFeedback(null);

    const left = Math.floor(Math.random() * 4) + 1; // 1 to 4
    const right = Math.floor(Math.random() * 4) + 1; // 1 to 4
    setCountLeftStars(left);
    setCountRightStars(right);

    const total = left + right;
    const optionsPool = [total, total + 1, total - 1, total + 2].filter(n => n > 0 && n <= 10);
    // Unique options
    const uniqueOpts = Array.from(new Set(optionsPool)).slice(0, 3);
    if (!uniqueOpts.includes(total)) uniqueOpts[0] = total;

    setCountOptions(uniqueOpts.sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    if (activeGameId === 'count-and-add') {
      initCountGame();
    }
  }, [activeGameId]);

  const handleSelectCount = (val: number) => {
    const total = countLeftStars + countRightStars;
    setCountSelected(val);

    if (val === total) {
      setCountFeedback('correct');
      setCountScore(prev => prev + 1);
      confetti({
        particleCount: 15,
        spread: 20
      });

      if (countScore + 1 >= 5) {
        setTimeout(() => {
          setCountFinished(true);
          incrementXP(50);
        }, 1200);
      } else {
        setTimeout(generateAddSum, 1500);
      }
    } else {
      setCountFeedback('wrong');
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {activeGameId ? (
        /* ACTIVE GAME WRAPPER */
        <div className="bg-white border border-amber-100 rounded-3xl p-6 md:p-8 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <button
              onClick={() => setActiveGameId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Quit Game
            </button>
            <span className="badge pill-amber text-[10px] font-black">ACTIVE PLAY</span>
          </div>

          {/* 1. ALPHABET TRACING GAME PANEL */}
          {activeGameId === 'alphabet-tracing' && (
            <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
              <div>
                <h3 className="font-display font-black text-lg text-slate-800 text-center">Trace the Letter 'A'</h3>
                <p className="font-sans text-xs text-slate-400 text-center mt-1">Draw inside the dotted guidelines on the board.</p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-[#fafaf9] shadow-inner relative">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={340}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="cursor-crosshair block"
                />
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={initCanvas}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw size={14} />
                  Reset Board
                </button>
                <button
                  onClick={finishTracing}
                  disabled={tracingFinished}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10 transition-all disabled:opacity-50"
                >
                  {tracingFinished ? 'Well Done! +40 XP' : 'Verify Trace'}
                </button>
              </div>

              {tracingFinished && (
                <div className="text-center font-sans text-xs text-emerald-600 font-bold mt-2 animate-bounce">
                  ✨ Perfect trace! You earned +40 XP bonus! ✨
                </div>
              )}
            </div>
          )}

          {/* 2. PHONICS POP LETTER GAME PANEL */}
          {activeGameId === 'phonics-pop' && (
            <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
              <div className="text-center">
                <h3 className="font-display font-black text-lg text-slate-800">Phonics Balloon Pop!</h3>
                <p className="font-sans text-xs text-slate-400 mt-1">Pop the balloons matching the sound target.</p>
              </div>

              {/* Phonics prompt sound block */}
              <div className="bg-amber-50 border border-amber-100 p-4 px-8 rounded-2xl flex flex-col items-center gap-1.5 select-none animate-pulse">
                <span className="font-sans text-[10px] font-bold text-amber-700">TAP THE BALLOON CONTAINING</span>
                <span className="font-display font-extrabold text-4xl text-amber-500">{phonicsPrompt}</span>
              </div>

              {!phonicsFinished ? (
                /* BALLOONS CONTAINER BOARD */
                <div className="w-full h-80 bg-sky-50/50 border border-sky-100/30 rounded-3xl relative overflow-hidden my-2">
                  {phonicsBalloons.map((bal) => (
                    <button
                      key={bal.id}
                      onClick={() => handlePopBalloon(bal.char, bal.id)}
                      className={`absolute w-12 h-16 rounded-full flex items-center justify-center text-white font-display font-black text-lg cursor-pointer hover:scale-110 shadow-md ${bal.color} animate-float`}
                      style={{ 
                        left: `${bal.x}%`, 
                        top: `${bal.y}%`, 
                        borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' 
                      }}
                    >
                      {bal.char}
                    </button>
                  ))}
                </div>
              ) : (
                /* PHONICS FINISHED SCREEN */
                <div className="text-center flex flex-col items-center gap-4 py-8 anim-fade-up">
                  <span className="text-4xl select-none">🎈🎉</span>
                  <h4 className="font-display font-black text-xl text-slate-800">You Popped All Balloons!</h4>
                  <p className="font-sans text-xs text-slate-400">Awesome, your spelling/phonics ear is perfect.</p>
                  <div className="bg-amber-50 border border-amber-100 p-3 px-6 rounded-xl text-xs font-bold text-amber-800 select-none">
                    +50 XP Bonus Earned
                  </div>
                  <button
                    onClick={initPhonics}
                    className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Play Again
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center w-full px-4 text-xs font-bold text-slate-500 select-none">
                <span>Score: {phonicsScore} / 5</span>
                <span>Goal: 5 pops</span>
              </div>
            </div>
          )}

          {/* 3. COUNT & ADD GAME PANEL */}
          {activeGameId === 'count-and-add' && (
            <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
              <div className="text-center">
                <h3 className="font-display font-black text-lg text-slate-800">Count & Add Stars</h3>
                <p className="font-sans text-xs text-slate-400 mt-1">Count the stars on the left and right, then add them up!</p>
              </div>

              {!countFinished ? (
                <div className="w-full flex flex-col gap-6 items-center">
                  {/* Visual Equation display */}
                  <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 p-6 rounded-3xl shadow-inner select-none animate-fade-up">
                    {/* Left stars */}
                    <div className="grid grid-cols-2 gap-1.5 min-h-[60px] items-center">
                      {Array.from({ length: countLeftStars }).map((_, i) => (
                        <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
                      ))}
                    </div>
                    
                    <span className="font-display font-black text-3xl text-slate-400 font-sans">+</span>

                    {/* Right stars */}
                    <div className="grid grid-cols-2 gap-1.5 min-h-[60px] items-center">
                      {Array.from({ length: countRightStars }).map((_, i) => (
                        <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
                      ))}
                    </div>
                  </div>

                  {/* Math Formula prompt */}
                  <div className="font-display font-bold text-xl text-slate-800">
                    {countLeftStars} + {countRightStars} = ?
                  </div>

                  {/* Selector options */}
                  <div className="flex gap-4">
                    {countOptions.map((opt) => {
                      const correct = countLeftStars + countRightStars;
                      const isSelected = countSelected === opt;
                      const isCorrect = opt === correct;

                      let btnStyle = 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700';
                      if (countSelected !== null) {
                        if (isCorrect) btnStyle = 'bg-emerald-500 text-white border-transparent shadow-md shadow-emerald-500/10 scale-105';
                        else if (isSelected) btnStyle = 'bg-red-500 text-white border-transparent shadow-md shadow-red-500/10';
                        else btnStyle = 'opacity-30 border-slate-100 text-slate-400';
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectCount(opt)}
                          disabled={countSelected !== null}
                          className={`w-16 h-16 rounded-2xl border font-display font-extrabold text-2xl flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback toast */}
                  {countFeedback !== null && (
                    <div className={`text-xs font-bold font-sans ${
                      countFeedback === 'correct' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {countFeedback === 'correct' ? '🎉 Great job! Correct answer!' : '❌ Oops! Try counting again!'}
                    </div>
                  )}
                </div>
              ) : (
                /* COUNT FINISHED */
                <div className="text-center flex flex-col items-center gap-4 py-8 anim-fade-up">
                  <span className="text-4xl select-none">🔢🏆</span>
                  <h4 className="font-display font-black text-xl text-slate-800">Math Star Completed!</h4>
                  <p className="font-sans text-xs text-slate-400">You solved all addition counts perfectly.</p>
                  <div className="bg-amber-50 border border-amber-100 p-3 px-6 rounded-xl text-xs font-bold text-amber-800 select-none">
                    +50 XP Bonus Earned
                  </div>
                  <button
                    onClick={initCountGame}
                    className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Play Again
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center w-full px-4 text-xs font-bold text-slate-500 select-none border-t border-slate-100 pt-4 mt-2">
                <span>Score: {countScore} / 5</span>
                <span>Goal: 5 stars</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GAMES LIST GALLERY VIEW */
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {gamesData.map((game) => (
              <div 
                key={game.id}
                className={`bento-card border border-amber-100/50 bg-white flex flex-col justify-between p-5 select-none ${
                  game.locked ? 'opacity-50' : 'card-interactive'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-3xl bg-slate-50 border border-slate-100 p-2.5 rounded-2xl block">
                    {game.icon}
                  </span>
                  {/* Star scores */}
                  {!game.locked && (
                    <div className="flex gap-0.5 text-amber-500">
                      {[1, 2, 3].map((num) => (
                        <Star 
                          key={num}
                          size={12}
                          className={num <= game.stars ? 'fill-amber-500' : 'text-slate-200'}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <span className="badge pill-amber text-[8px] font-black">{game.subject}</span>
                  <h4 className="font-display font-bold text-xs text-slate-800 mt-1">{game.name}</h4>
                </div>

                {game.locked ? (
                  <button
                    disabled
                    className="w-full py-2 bg-slate-100 text-slate-400 font-sans font-bold text-[10px] rounded-lg mt-3"
                  >
                    🔒 Locked
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveGameId(game.id)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-[10px] rounded-lg mt-3 shadow-xs cursor-pointer flex items-center justify-center gap-1 transition-all"
                  >
                    <Play size={10} className="fill-white" />
                    Play Game
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
