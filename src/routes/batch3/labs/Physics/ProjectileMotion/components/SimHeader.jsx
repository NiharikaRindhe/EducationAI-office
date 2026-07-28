import { motion } from "framer-motion";
import { ArrowLeft, Target } from "lucide-react";
import { CLR } from "../constants/physicsConstants";

/**
 * Top header bar for the Projectile Motion Sandbox.
 *
 * Props:
 *   onBack       – () => void   (navigate(-1))
 *   isRunning    – bool
 *   isPaused     – bool
 *   status       – "idle" | "flying" | "paused" | "landed"
 */
export default function SimHeader({ onBack, isRunning, isPaused, status }) {
  const statusLabel =
    isRunning && !isPaused ? "Simulating"
    : isPaused             ? "Paused"
    : status === "landed"  ? "Landed"
    : "Ready";

  const dotColor = isRunning && !isPaused ? CLR.neon : CLR.border;

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="shrink-0 flex items-center justify-between px-5 py-3 border-b"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
      {/* Left: back + branding */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.92 }}
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: CLR.muted }}
        >
          <ArrowLeft size={15} /> Back
        </motion.button>

        <div className="w-px h-5" style={{ background: CLR.border }} />

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(88,166,255,0.1)" }}
          >
            <Target size={16} style={{ color: CLR.accent }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: CLR.text }}>
              Projectile Motion Sandbox
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: CLR.muted }}>
              Interactive Physics Simulator
            </p>
          </div>
        </div>
      </div>

      {/* Right: live status indicator */}
      <div className="flex items-center gap-2 text-xs" style={{ color: CLR.muted }}>
        <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
        {statusLabel}
      </div>
    </motion.header>
  );
}
