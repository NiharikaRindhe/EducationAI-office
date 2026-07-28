import { motion } from "framer-motion";
import { ArrowLeft, Waves } from "lucide-react";
import { CLR } from "../constants/soundConstants";

export default function SoundHeader({ onBack, running }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="shrink-0 flex items-center justify-between px-5 py-3 border-b"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
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
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,229,255,0.1)" }}
          >
            <Waves size={16} style={{ color: CLR.wave }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: CLR.text }}>
              Sound Wave Tank
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: CLR.muted }}>
              Interactive Wave Mechanics
            </p>
          </div>
        </div>
      </div>

      {/* Running indicator */}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: CLR.muted }}>
        <motion.span
          animate={{ scale: running ? [1, 1.4, 1] : 1, opacity: running ? [1, 0.5, 1] : 0.4 }}
          transition={{ repeat: running ? Infinity : 0, duration: 0.9 }}
          className="w-2 h-2 rounded-full inline-block"
          style={{ background: running ? CLR.wave : CLR.border }}
        />
        {running ? "Transmitting" : "Stopped"}
      </div>
    </motion.header>
  );
}
