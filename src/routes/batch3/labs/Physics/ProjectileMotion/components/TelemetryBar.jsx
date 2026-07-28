import { motion } from "framer-motion";
import { CLR } from "../constants/physicsConstants";

/**
 * A single telemetry metric card.
 */
function TelCard({ label, value, unit, accent }) {
  return (
    <motion.div
      layout
      className="relative overflow-hidden flex flex-col gap-0.5 rounded-xl px-3.5 py-3 border"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
      <span className="absolute inset-y-3 left-0 w-0.5 rounded-full" style={{ background: accent || CLR.accent }} />
      <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>
        {label}
      </span>
      <span className="text-lg font-mono font-bold tabular-nums" style={{ color: accent || CLR.text }}>
        {value}
        <span className="text-xs font-normal ml-1" style={{ color: CLR.muted }}>{unit}</span>
      </span>
    </motion.div>
  );
}

/**
 * Six-card telemetry grid displayed below the canvas.
 *
 * Props: telemetry { x, y, speed, maxHeight, range }, gravity
 */
export default function TelemetryBar({ telemetry, gravity }) {
  const tel = telemetry;

  return (
    <motion.div layout className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <TelCard
        label="Range (X)"
        value={tel.x.toFixed(1)}
        unit="m"
        accent={CLR.velX} />
      <TelCard
        label="Max Height"
        value={tel.maxHeight.toFixed(1)}
        unit="m"
        accent={CLR.apex} />
      <TelCard
        label="Final Range"
        value={tel.range !== null ? tel.range.toFixed(1) : "—"}
        unit={tel.range !== null ? "m" : ""}
        accent={CLR.neon}
      />
      <TelCard
        label="Time to Bottom"
        value={tel.time !== undefined && tel.time !== null ? tel.time.toFixed(2) : "0.00"}
        unit="s"
        accent={CLR.accent}
      />
      <TelCard
        label="Gravity"
        value={gravity.toFixed(2)}
        unit="m/s²" />
    </motion.div>
  );
}
