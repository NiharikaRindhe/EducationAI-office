import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { CLR } from "../constants/physicsConstants";

/**
 * Launch / Pause-Resume / Reset action buttons.
 *
 * Props:
 *   isRunning        – bool
 *   isPaused         – bool
 *   onLaunch         – () => void
 *   onPauseResume    – () => void
 *   onReset          – () => void
 */
export default function ActionBar({ isRunning, isPaused, onLaunch, onPauseResume, onReset }) {
  const canPause = isRunning || isPaused;

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Launch */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onLaunch}
        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
        style={{ background: CLR.accent, color: "#0d1117" }}
      >
        <Play size={15} fill="currentColor" />
        Launch
      </motion.button>

      {/* Pause / Resume */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onPauseResume}
        disabled={!canPause}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
        style={{
          borderColor: CLR.border,
          color:       CLR.text,
          background:  canPause ? "rgba(88,166,255,0.08)" : "transparent",
          opacity:     canPause ? 1 : 0.4,
          cursor:      canPause ? "pointer" : "not-allowed",
        }}
      >
        {isPaused
          ? <><Play  size={14} /> Resume</>
          : <><Pause size={14} /> Pause</>
        }
      </motion.button>

      {/* Reset */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
        style={{ borderColor: CLR.border, color: CLR.muted, background: "transparent" }}
      >
        <RotateCcw size={14} />
        Reset
      </motion.button>
    </div>
  );
}
