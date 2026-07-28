import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle2, BookOpen, ChevronLeft, ChevronRight,
  Info, Flame, Zap, Trophy,
} from "lucide-react";
import REACTION_TYPES from "../constants/REACTION_TYPES";

export default function ExplanationModal({ reaction, onNext, onClose, isLastQuestion }) {
  const typeMeta = REACTION_TYPES[reaction.type];
  const TypeIcon = typeMeta.icon;
  const [step, setStep] = useState(0);
  const steps = reaction.explanation.mechanism;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden"
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: typeMeta.bg, borderBottom: `2px solid ${typeMeta.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: typeMeta.color + "20", border: `2px solid ${typeMeta.color}30` }}
            >
              <TypeIcon size={20} style={{ color: typeMeta.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: typeMeta.color }}>
                {typeMeta.label} Reaction
              </p>
              <p className="text-sm font-bold text-gray-800">{reaction.explanation.summary}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Success banner */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 bg-emerald-50 border-b border-emerald-200">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <span className="text-sm font-bold text-emerald-700">Correct! You built the reaction.</span>
        </div>

        {/* Balanced equation */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Balanced Equation</p>
          <p className="text-sm font-mono font-bold text-gray-800">{reaction.equation.balanced}</p>
        </div>

        {/* Mechanism steps */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen size={11} /> Reaction Mechanism
            </p>
            <span className="text-[10px] font-semibold text-gray-400">
              Step {step + 1} / {steps.length}
            </span>
          </div>

          <div className="relative overflow-hidden" style={{ height: 110 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-4 rounded-xl border-2 text-sm text-gray-700 leading-relaxed h-full overflow-y-auto"
                style={{ borderColor: typeMeta.border, background: typeMeta.bg }}
              >
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold mr-2 flex-shrink-0"
                  style={{ background: typeMeta.color, color: "#fff" }}
                >
                  {step + 1}
                </span>
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step navigation */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex-1 flex gap-1 justify-center">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="w-2 h-2 rounded-full transition-all duration-200"
                  style={{ background: i === step ? typeMeta.color : "#e5e7eb" }}
                />
              ))}
            </div>
            <button
              onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
              disabled={step === steps.length - 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Real-world context */}
        <div className="px-6 pb-2" style={{ height: 75 }}>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 h-full overflow-y-auto">
            <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <span className="font-bold">Real World: </span>
              {reaction.explanation.realWorld}
            </p>
          </div>
        </div>


        {/* Energy tag */}
        <div className="px-6 pb-4">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${
              reaction.explanation.energyType.startsWith("Exo")
                ? "bg-orange-50 border-orange-200 text-orange-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            {reaction.explanation.energyType.startsWith("Exo") ? <Flame size={11} /> : <Zap size={11} />}
            {reaction.explanation.energyType}
          </span>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5 flex gap-3">
          {/* <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Review Question
          </button> */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
          >
            {isLastQuestion ? <><Trophy size={14} /> See Results</> : <><ChevronRight size={14} /> Next Question</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
