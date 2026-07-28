import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Trophy, RotateCcw } from "lucide-react";
import REACTION_TYPES from "../constants/REACTION_TYPES";
import REACTIONS from "../Reactions";

// ── Stagger containers ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -16, scale: 0.97 },
  show:   { opacity: 1, x: 0,   scale: 1, transition: { type: "spring", stiffness: 340, damping: 26 } },
};

// ── Animated count-up number ──────────────────────────────────────────────────
function CountUp({ target, duration = 900 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);

  return <>{display}</>;
}

export default function ResultsScreen({ score, total, onRestart, navigate }) {
  const pct = Math.round((score / total) * 100);
  const grade =
    pct === 100 ? "Perfect!"         :
    pct >= 80   ? "Excellent!"       :
    pct >= 60   ? "Good Job!"        : "Keep Practising!";
  const gradeColor =
    pct === 100 ? "#059669" :
    pct >= 80   ? "#0891b2" :
    pct >= 60   ? "#d97706" : "#dc2626";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Rainbow top bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{ originX: 0, background: "linear-gradient(90deg, #7c3aed, #0891b2, #059669, #d97706, #dc2626)" }}
          className="h-2"
        />

        <div className="p-8 flex flex-col items-center gap-5 text-center">

          {/* ── Trophy with bounce ──────────────────────────────────────── */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 14 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: gradeColor + "15", border: `2px solid ${gradeColor}30` }}
          >
            <motion.div
              animate={{ y: [0, -6, 0, -3, 0] }}
              transition={{ delay: 0.55, duration: 0.7, ease: "easeInOut" }}
            >
              <Trophy size={36} style={{ color: gradeColor }} />
            </motion.div>
          </motion.div>

          {/* ── Grade label ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.28, duration: 0.3 }}
          >
            <p className="text-3xl font-extrabold" style={{ color: gradeColor }}>{grade}</p>
            <p className="text-gray-500 text-sm mt-1">You completed all {total} reaction questions.</p>
          </motion.div>

          {/* ── Score bar ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.38, duration: 0.3 }}
            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200"
          >
            <p className="text-5xl font-extrabold text-gray-800">
              <CountUp target={score} duration={800} />
              <span className="text-2xl text-gray-400 font-semibold">/{total}</span>
            </p>
            <p className="text-gray-500 text-sm mt-1">reactions built correctly</p>
            <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: pct + "%" }}
                transition={{ delay: 0.5, duration: 0.85, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: gradeColor }}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-xs font-bold mt-1"
              style={{ color: gradeColor }}
            >
              {pct}%
            </motion.p>
          </motion.div>

          {/* ── Reaction type breakdown — staggered rows ────────────────── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full flex flex-col gap-2 text-xs text-gray-500"
          >
            {Object.keys(REACTION_TYPES).map(type => {
              const meta  = REACTION_TYPES[type];
              const Icon  = meta.icon;
              const count = REACTIONS.filter(r => r.type === type).length;
              return (
                <motion.div
                  key={type}
                  variants={rowVariants}
                  whileHover={{ x: 3, boxShadow: `0 2px 10px ${meta.color}18` }}
                  className="flex items-center gap-2 p-2 rounded-lg transition-shadow"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
                >
                  <motion.div
                    initial={{ rotate: -20, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  >
                    <Icon size={12} style={{ color: meta.color }} />
                  </motion.div>
                  <span className="font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-gray-400 ml-auto">{count} question{count !== 1 ? "s" : ""}</span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ── Action buttons ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.65, duration: 0.28 }}
            className="flex gap-3 w-full"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(-1)}
              className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Exit Lab
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 6px 20px #7c3aed35" }}
              whileTap={{ scale: 0.96 }}
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
            >
              <motion.span
                whileHover={{ rotate: -180 }}
                transition={{ duration: 0.35 }}
                className="inline-flex"
              >
                <RotateCcw size={14} />
              </motion.span>
              Try Again
            </motion.button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
