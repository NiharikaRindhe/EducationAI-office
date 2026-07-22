import React from 'react';

/**
 * Batch 1 Minor Pages — only ShowAndTell remains here.
 * Badges, Streak, Profile are now merged into MyStuff.tsx.
 */

/* VISION AI SHOW & TELL (Deferred — Coming Soon) */
export const Batch1ShowAndTell: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up relative overflow-hidden min-h-[300px]">
      <div>
        <h2 className="font-display font-extrabold text-2xl text-slate-800">📸 Show &amp; Tell AI</h2>
        <p className="text-sm text-slate-400 font-medium mt-0.5">Take photos of leaves, books, or toys to learn facts!</p>
      </div>
      <div className="bento-card border border-dashed border-slate-200 bg-white/50 p-12 text-center flex flex-col items-center gap-3">
        <span className="text-4xl">🔬</span>
        <span className="font-sans font-bold text-xs text-slate-400">Vision model offline</span>
        <span className="text-[10px] text-slate-400">Classroom camera vision is deferred for the initial school server rollout.</span>
      </div>
      {/* Coming soon ribbon */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
        <div className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-display font-bold text-sm rotate-[-3deg] shadow-lg">
          🚧 Coming Soon!
        </div>
      </div>
    </div>
  );
};
