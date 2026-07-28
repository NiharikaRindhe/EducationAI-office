import { motion } from "framer-motion";
import { CLR } from "../constants/soundConstants";
import InfoTooltip from "./InfoTooltip";

export default function SoundToggle({ label, value, onChange, hint, info }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col">
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: CLR.muted }}>
          {label}
          {info && <InfoTooltip text={info} />}
        </span>
        {hint && <span className="text-[10px]" style={{ color: "rgba(139,148,158,0.55)" }}>{hint}</span>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full shrink-0 transition-colors duration-200 focus:outline-none"
        style={{ background: value ? CLR.accent : CLR.border }}
        role="switch" aria-checked={value} aria-label={label}
      >
        <motion.span
          animate={{ left: value ? "calc(100% - 18px)" : "2px" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute top-0.5 w-4 h-4 rounded-full"
          style={{ background: CLR.text }}
        />
      </button>
    </div>
  );
}
