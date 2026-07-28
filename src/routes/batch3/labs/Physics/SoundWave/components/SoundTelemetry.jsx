import { motion } from "framer-motion";
import { CLR, MISSION, BOUNDARY } from "../constants/soundConstants";

export default function SoundTelemetry({ telemetry, sonarGuess, setSonarGuess, onSonarSubmit }) {
  const {
    wavelength = 0,
    v = 343,
    freq = 3.0,
    period = 0.333,
    omega = 18.85,
    k = 0.05,
    nodes = 3,
    totalSpatialSpanMeters = 171.5,
    tempC = 20,
    mediumKey = "gas",
    density = 1.2,
    boundary = BOUNDARY.ABSORB,
    tEcho = null,
    mission = MISSION.FREE,
    matchPct = 0,
    matchWon = false,
    cancelRms = 1,
    cancelWon = false,
    sonarTof = 0,
  } = telemetry;

  const isRigid = boundary === BOUNDARY.RIGID;
  const mediumLabel = mediumKey === "gas" ? "Gas (Air)" : mediumKey === "liquid" ? "Liquid (H₂O)" : "Solid (Iron)";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
          Telemetry &amp; Spatial Dynamics
        </p>
        {mission !== MISSION.FREE && (
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            matchWon || cancelWon 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
          }`}>
            Mission: {mission.toUpperCase()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        {/* CARD 1: WAVE PROPAGATION */}
        <div className="flex flex-col gap-1.5 rounded-xl p-3 border shadow-sm"
          style={{ background: CLR.panel, borderColor: CLR.border }}>
          <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border + "88" }}>
            <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
            WAVE PROPAGATION
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Kinematics
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <p className="text-[10px] text-slate-400">Wavelength (λ)</p>
              <p className="text-xs font-mono font-bold text-cyan-400">{wavelength.toFixed(2)} m</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Wave Speed (v)</p>
              <p className="text-xs font-mono font-bold text-emerald-400">{v.toFixed(0)} m/s</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Frequency (f)</p>
              <p className="text-xs font-mono font-bold text-amber-300">{freq.toFixed(1)} Hz</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Time Period (T)</p>
              <p className="text-xs font-mono font-bold text-sky-400">
                {period >= 1 ? `${period.toFixed(2)} s` : `${(period * 1000).toFixed(1)} ms`}
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2: SPATIAL & WAVE EQUATION CONSTANTS */}
        <div className="flex flex-col gap-1.5 rounded-xl p-3 border shadow-sm"
          style={{ background: CLR.panel, borderColor: CLR.border }}>
          <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border + "88" }}>
            <span className="text-[10px] uppercase tracking-wider font-bold text-sky-400 flex items-center gap-1.5">
            SPATIAL CONSTANTS
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
              Equation
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <p className="text-[10px] text-slate-400">Wave Number (k)</p>
              <p className="text-xs font-mono font-bold text-purple-400">{k.toFixed(3)} rad/m</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Angular Freq (ω)</p>
              <p className="text-xs font-mono font-bold text-indigo-300">{omega.toFixed(1)} rad/s</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Canvas Width (D)</p>
              <p className="text-xs font-mono font-bold text-sky-300">{totalSpatialSpanMeters.toFixed(1)} m</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Standing Nodes (N)</p>
              <p className="text-xs font-mono font-bold text-amber-400">{nodes} Nodes</p>
            </div>
          </div>
        </div>

        {/* CARD 3: ENVIRONMENT & BOUNDARY */}
        <div className="flex flex-col gap-1.5 rounded-xl p-3 border shadow-sm"
          style={{ background: CLR.panel, borderColor: CLR.border }}>
          <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border + "88" }}>
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
            ENVIRONMENT &amp; ECHO
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Boundary
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="col-span-2">
              <p className="text-[10px] text-slate-400">Medium &amp; Density</p>
              <p className="text-xs font-bold text-slate-200 truncate">
                {mediumLabel} @ {tempC}°C ({density} kg/m³)
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Boundary Type</p>
              <p className={`text-xs font-bold ${isRigid ? "text-cyan-300" : "text-slate-400"}`}>
                {isRigid ? "Rigid Wall (Echo)" : "Foam Absorb"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Echo Time (t_echo)</p>
              <p className={`text-xs font-mono font-bold ${isRigid && tEcho !== null ? "text-emerald-400" : "text-slate-500"}`}>
                {isRigid && tEcho !== null ? `${tEcho.toFixed(3)} s` : "N/A (Absorbed)"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SONAR guess field */}
      {mission === MISSION.SONAR && sonarTof > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border p-3 mt-1"
          style={{ borderColor: CLR.sonar + "55", background: "rgba(105,255,71,0.04)" }}
        >
          <span className="text-xs font-medium shrink-0 text-slate-300">
            Your estimate:
          </span>
          <input
            type="text" inputMode="decimal" value={sonarGuess}
            onChange={e => setSonarGuess(e.target.value)}
            placeholder="distance (m)"
            className="flex-1 text-xs text-center rounded-md px-2 py-1 outline-none border"
            style={{ background: CLR.bg, borderColor: CLR.border, color: CLR.text }}
          />
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onSonarSubmit}
            className="shrink-0 px-3 py-1 rounded-md text-xs font-semibold"
            style={{ background: CLR.sonar, color: "#0d1117" }}
          >
            Check
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
