import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BarChart2, Activity, Zap, Flame, Info } from "lucide-react";
import { CLR } from "../constants/frictionConstants";

// ─── Single metric card component ─────────────────────────────────────────────
function MetricItem({ label, value, unit, accent, highlight, subtitle }) {
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-lg p-2.5 border transition-all ${
        highlight ? "ring-1 ring-cyan-500/40 bg-cyan-950/20" : ""
      }`}
      style={{ background: CLR.bg, borderColor: highlight ? "rgba(56,189,248,0.4)" : CLR.border }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[9px] uppercase tracking-widest font-bold leading-none"
          style={{ color: CLR.muted }}
        >
          {label}
        </span>
        {subtitle && (
          <span className="text-[8px] font-mono text-cyan-400 font-semibold">{subtitle}</span>
        )}
      </div>
      <span
        className="text-base font-mono font-bold tabular-nums leading-tight mt-1"
        style={{ color: accent || CLR.text }}
      >
        {value}
        {unit && (
          <span className="text-xs font-normal ml-1" style={{ color: CLR.muted }}>
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

// ─── Compact metric item for collapsed view ──────────────────────────────────
function CompactMetric({ label, value, unit, accent }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px]"
      style={{ background: CLR.bg, borderColor: CLR.border }}
    >
      <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: CLR.muted }}>
        {label}:
      </span>
      <span className="font-mono font-bold tabular-nums" style={{ color: accent || CLR.text }}>
        {value}
      </span>
      {unit && (
        <span className="text-[9px] ml-0.5" style={{ color: CLR.muted }}>
          {unit}
        </span>
      )}
    </div>
  );
}

/**
 * TelemetryPanel
 *
 * 3 Primary Scannable Cards:
 *   1. Motion & Kinematics (Acceleration, Final/Max Speed, Elapsed Time, Distance)
 *   2. Force Dynamics (Net Force, Active Friction, optional Static Weight/Normal)
 *   3. Energy & Analysis (Kinetic Energy, Friction Heat Loss, Ideal Speed, Efficiency)
 */
export default function TelemetryPanel({ telemetry, slipAngle, STATES }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStaticForces, setShowStaticForces] = useState(false);

  const {
    state, speed, maxSpeed, acceleration, elapsed, distance,
    fGravity, fNormal, fFriction, fNet,
    kineticEnergy, workByGravity, workByFriction,
    efficiency: telEfficiency, vTheory, vActual,
  } = telemetry;

  const isDone = state === STATES.DONE || state === "Finished";
  const isSliding = state === STATES.KINETIC;
  const isStatic = state === STATES.STATIC;

  // ── State label + color ───────────────────────────────────────────────────
  const stateLabel =
    isSliding ? "Kinetic — Sliding"
    : isStatic ? "Static — At Rest"
    : isDone   ? "Reached Bottom ✓"
    : "Idle";

  const stateColor =
    isSliding ? CLR.accent
    : isStatic ? CLR.friction
    : isDone   ? CLR.neon
    : CLR.muted;

  // ── Energy & Efficiency Calculations ─────────────────────────────────────
  const efficiency = telEfficiency !== undefined
    ? telEfficiency
    : (workByGravity > 0 ? Math.min(100, Math.max(0, (kineticEnergy / workByGravity) * 100)) : 0);

  const actualMaxSpeed = vActual !== undefined ? Math.max(maxSpeed, vActual) : maxSpeed;
  const vIdeal = vTheory !== undefined ? vTheory : null;

  return (
    <div
      className="rounded-xl border p-3 transition-all flex flex-col gap-2.5 shadow-lg"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
      {/* ── Header / Compact Bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 overflow-hidden flex-1 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <Activity size={15} style={{ color: CLR.accent }} />
            <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: CLR.text }}>
              Telemetry &amp; Dynamics
            </span>
          </div>

          {/* Collapsed state metrics */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-wrap items-center gap-1.5"
              >
                <CompactMetric
                  label="Status"
                  value={stateLabel}
                  accent={stateColor}
                />
                <CompactMetric
                  label={isDone ? "Final Speed" : "Speed"}
                  value={(isDone ? actualMaxSpeed : speed).toFixed(2)}
                  unit="m/s"
                  accent={CLR.accent}
                />
                <CompactMetric label="Accel" value={acceleration.toFixed(2)} unit="m/s²" accent={CLR.accent} />
                <CompactMetric label="Net Force" value={fNet.toFixed(1)} unit="N" accent={fNet > 0.1 ? "#f47067" : CLR.muted} />
                <CompactMetric label="Efficiency" value={`${efficiency.toFixed(0)}%`} accent={CLR.neon} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all shrink-0"
          style={{
            borderColor: CLR.border,
            color: CLR.text,
            background: CLR.bg,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = CLR.accent;
            e.currentTarget.style.color = CLR.accent;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = CLR.border;
            e.currentTarget.style.color = CLR.text;
          }}
        >
          <span>{isExpanded ? "Hide Details" : "Show Details"}</span>
          {isExpanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {/* ── 3 Primary Scannable Cards (Expanded) ────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-3 mt-1" style={{ borderColor: CLR.border }}>
              
              {/* ── CARD 1: Motion & Kinematics ── */}
              <div className="flex flex-col gap-2 rounded-xl p-3 border" style={{ background: "rgba(13,17,23,0.5)", borderColor: CLR.border }}>
                <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: CLR.border }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Activity size={13} /> Motion &amp; Kinematics
                  </span>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border" style={{ color: stateColor, borderColor: stateColor + "44", background: stateColor + "14" }}>
                    {stateLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <MetricItem
                    label="Acceleration (a)"
                    value={acceleration.toFixed(3)}
                    unit="m/s²"
                    accent={CLR.accent}
                  />

                  {/* Dynamic Speed Field: Highlights Final Speed when finished */}
                  {isDone ? (
                    <MetricItem
                      label="FINAL SPEED (v_max)"
                      value={actualMaxSpeed.toFixed(2)}
                      unit="m/s"
                      accent={CLR.neon}
                      highlight
                      subtitle="Terminal"
                    />
                  ) : (
                    <MetricItem
                      label="Current Speed (v)"
                      value={speed.toFixed(2)}
                      unit="m/s"
                      accent={CLR.accent}
                      subtitle={`Max: ${actualMaxSpeed.toFixed(2)}`}
                    />
                  )}

                  <MetricItem
                    label="Elapsed Time (t)"
                    value={elapsed.toFixed(2)}
                    unit="s"
                    accent={CLR.muted}
                  />

                  <MetricItem
                    label="Displacement (d)"
                    value={distance.toFixed(2)}
                    unit="m"
                    accent={CLR.muted}
                  />
                </div>
              </div>

              {/* ── CARD 2: Force Dynamics ── */}
              <div className="flex flex-col gap-2 rounded-xl p-3 border" style={{ background: "rgba(13,17,23,0.5)", borderColor: CLR.border }}>
                <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: CLR.border }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Zap size={13} /> Force Dynamics
                  </span>
                  <button
                    onClick={() => setShowStaticForces(!showStaticForces)}
                    className="text-[9px] font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Info size={10} /> {showStaticForces ? "Hide mg & N" : "Show mg & N"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <MetricItem
                    label="NET FORCE (F_net)"
                    value={fNet.toFixed(1)}
                    unit="N"
                    accent={fNet > 0.1 ? "#f47067" : CLR.muted}
                    highlight={fNet > 0.1}
                    subtitle="Driver"
                  />

                  <MetricItem
                    label="FRICTION (f_k)"
                    value={fFriction.toFixed(1)}
                    unit="N"
                    accent="#e3b341"
                    subtitle={isSliding ? "Kinetic" : "Static Bal."}
                  />

                  {/* Optional static intermediate forces (mg & N) */}
                  {showStaticForces && (
                    <>
                      <MetricItem
                        label="Weight (mg)"
                        value={fGravity.toFixed(1)}
                        unit="N"
                        accent={CLR.muted}
                      />
                      <MetricItem
                        label="Normal (N)"
                        value={fNormal.toFixed(1)}
                        unit="N"
                        accent={CLR.muted}
                      />
                    </>
                  )}
                </div>
                {!showStaticForces && (
                  <p className="text-[9px] text-slate-400 mt-1 italic">
                    💡 Gravity (mg) and Normal (N) vectors live-rendered on canvas.
                  </p>
                )}
              </div>

              {/* ── CARD 3: Energy & Analysis ── */}
              <div className="flex flex-col gap-2 rounded-xl p-3 border" style={{ background: "rgba(13,17,23,0.5)", borderColor: CLR.border }}>
                <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: CLR.border }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Flame size={13} /> Energy &amp; Efficiency
                  </span>
                  <span className="text-[9px] font-mono font-bold text-emerald-400">
                    {efficiency.toFixed(1)}% Eff
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <MetricItem
                    label="Kinetic Energy (E_k)"
                    value={kineticEnergy.toFixed(2)}
                    unit="J"
                    accent={CLR.accent}
                  />

                  <MetricItem
                    label="Friction Heat (Q_f)"
                    value={workByFriction.toFixed(2)}
                    unit="J"
                    accent="#e3b341"
                  />

                  <MetricItem
                    label="Ideal Speed (Frictionless)"
                    value={vIdeal !== null && vIdeal !== undefined ? vIdeal.toFixed(2) : "—"}
                    unit="m/s"
                    accent={CLR.muted}
                    subtitle="Theory"
                  />

                  <MetricItem
                    label="EFFICIENCY (%)"
                    value={`${efficiency.toFixed(1)}%`}
                    accent={efficiency > 75 ? CLR.neon : efficiency > 40 ? "#e3b341" : "#f47067"}
                    highlight
                  />
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

