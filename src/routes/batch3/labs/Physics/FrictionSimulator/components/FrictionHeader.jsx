import { motion } from "framer-motion";
import { ArrowLeft, Layers } from "lucide-react";
import { CLR } from "../constants/frictionConstants";

export default function FrictionHeader({ onBack, simState, STATES }) {
  const statusLabel =
    simState === STATES.KINETIC ? "Sliding"
    : simState === STATES.STATIC ? "Static — At Rest"
    : simState === STATES.DONE   ? "Reached Bottom"
    : "Ready";

  const dotColor =
    simState === STATES.KINETIC ? CLR.gravity
    : simState === STATES.STATIC ? CLR.friction
    : simState === STATES.DONE   ? CLR.normal
    : CLR.border;

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="shrink-0 flex items-center justify-between px-5 py-3 border-b"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
      {/* Left: back + branding */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ x: -2 }} whileTap={{ scale: 0.92 }}
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: CLR.muted }}
        >
          <ArrowLeft size={15} /> Back
        </motion.button>

        <div className="w-px h-5" style={{ background: CLR.border }} />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(86,211,100,0.1)" }}>
            <Layers size={16} style={{ color: CLR.normal }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: CLR.text }}>
              Friction &amp; Incline Simulator
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: CLR.muted }}>
              Block on Ramp — Force Analysis
            </p>
          </div>
        </div>
      </div>

      {/* Right: live status */}
      <div className="flex items-center gap-2 text-xs" style={{ color: CLR.muted }}>
        <motion.span
          animate={{ scale: simState === STATES.KINETIC ? [1, 1.4, 1] : 1 }}
          transition={{ repeat: simState === STATES.KINETIC ? Infinity : 0, duration: 0.8 }}
          className="w-2 h-2 rounded-full inline-block"
          style={{ background: dotColor }}
        />
        {statusLabel}
      </div>
    </motion.header>
  );
}
