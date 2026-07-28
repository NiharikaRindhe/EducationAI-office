import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Award,
  BookOpen,
  Zap,
  X,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

export default function InfoCard({ component, onClose, topicTitle }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const synthRef = useRef(window.speechSynthesis || null);
  const utteranceRef = useRef(null);

  // Stop speech when component changes or unmounts
  useEffect(() => {
    stopSpeech();
    return () => {
      stopSpeech();
    };
  }, [component?.id]);

  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleToggleSpeech = () => {
    if (!synthRef.current || !component) return;

    if (isPlaying && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      return;
    }

    // Start fresh speech
    synthRef.current.cancel();
    const textToRead = `${component.label}. ${component.ncertDefinition} Key function: ${component.keyFunction}. CBSE Exam tip: ${component.examTip}`;
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  if (!component) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-96 h-full border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden shadow-2xl z-20"
      >
        {/* Card Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              {topicTitle || "Component Details"}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* Component Name */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              {component.label}
            </h2>
          </div>  

          {/* NCERT Definition Box */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
              <BookOpen className="w-4 h-4" />
              Definition
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {component.ncertDefinition}
            </p>
          </div>

          {/* Key Function Box */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Zap className="w-4 h-4" />
              Biological Function
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {component.keyFunction}
            </p>
          </div>

          {/* CBSE Exam High-Yield Tip */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Award className="w-4 h-4" />
              Fun Fact
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed italic">
              "{component.examTip}"
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
