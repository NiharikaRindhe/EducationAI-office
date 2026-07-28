import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, ArrowLeft, Layers } from "lucide-react";
import { CLR, SURFACE_PRESETS } from "./constants/frictionConstants";
import { useFrictionSimulation } from "./hooks/useFrictionSimulation";
import FrictionCanvas  from "./components/FrictionCanvas";
import TelemetryPanel  from "./components/TelemetryPanel";
import ControlPanel    from "./components/ControlPanel";

import FormulaOverlay from "../FormulaOverlay";

// ─── Left nav panel ───────────────────────────────────────────────────────────
function LeftPanel({
  simState, STATES,
  onRun, onPause, onReset,
  onBack, embedded,
  showVectors, setShowVectors,
  showGrid, setShowGrid,
  showFormulas, setShowFormulas,
  setMuS, setMuK,
}) {
  const isRunning = simState === STATES.KINETIC || simState === STATES.STATIC;
  const isDone    = simState === STATES.DONE;

  const statusLabel =
    simState === STATES.KINETIC ? "Sliding" :
    simState === STATES.STATIC  ? "At Rest" :
    simState === STATES.DONE    ? "Finished" : "Ready";

  const statusColor =
    simState === STATES.KINETIC ? CLR.gravity :
    simState === STATES.STATIC  ? CLR.friction :
    simState === STATES.DONE    ? CLR.normal : CLR.border;

  return (
    <div
      className="w-48 shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
      {/* Identity */}
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: CLR.border }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(86,211,100,0.1)" }}>
            <Layers size={14} style={{ color: CLR.normal }} />
          </div>
          <div>
            <p className="text-xs font-bold leading-none" style={{ color: CLR.text }}>Friction</p>
            <p className="text-[9px] mt-0.5" style={{ color: CLR.muted }}>Incline Lab</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span
            animate={{ scale: simState === STATES.KINETIC ? [1, 1.4, 1] : 1 }}
            transition={{ repeat: simState === STATES.KINETIC ? Infinity : 0, duration: 0.8 }}
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: statusColor }}
          />
          <span className="text-[10px]" style={{ color: CLR.muted }}>{statusLabel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 flex-1">
        {/* ── Actions ── */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Actions</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onRun} disabled={isRunning}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{
              background: isRunning ? "rgba(86,211,100,0.12)" : CLR.normal,
              color: isRunning ? CLR.normal : "#0d1117",
              border: isRunning ? `1px solid ${CLR.normal}` : "none",
              opacity: isRunning ? 0.65 : 1,
            }}>
            <Play size={12} fill="currentColor" /> {isDone ? "Replay" : "Run"}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onPause} disabled={!isRunning}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border"
            style={{
              borderColor: CLR.border, color: CLR.text, background: "transparent",
              opacity: !isRunning ? 0.38 : 1,
            }}>
            <Pause size={12} /> Pause
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onReset}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border"
            style={{ borderColor: CLR.border, color: CLR.muted, background: "transparent" }}>
            <RotateCcw size={12} /> Reset
          </motion.button>
        </div>

        {/* ── Surface presets ── */}
        {/* <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Surface</p>
          {Object.entries(SURFACE_PRESETS).map(([key, p]) => (
            <button key={key}
              onClick={() => { setMuS(p.us); setMuK(p.uk); }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs border transition-all"
              style={{ borderColor: CLR.border, color: CLR.muted, background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = CLR.friction; e.currentTarget.style.color = CLR.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = CLR.border; e.currentTarget.style.color = CLR.muted; }}
            >
              <span>{p.icon} {p.label}</span>
            </button>
          ))}
        </div> */}

        {/* ── Visualization ── */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>View</p>
          {[
            { label: "Formulas (∑)", val: showFormulas, set: setShowFormulas },
            { label: "Vectors",       val: showVectors,  set: setShowVectors  },
            { label: "Grid",          val: showGrid,     set: setShowGrid     },
          ].map(({ label, val, set }) => (
            <button key={label} onClick={() => set(!val)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs border"
              style={{
                borderColor: val ? CLR.neon + "55" : CLR.border,
                background: val ? "rgba(57,211,83,0.07)" : "transparent",
                color: val ? CLR.neon : CLR.muted,
              }}>
              {label}
              <span className="text-[9px] font-mono">{val ? "ON" : "OFF"}</span>
            </button>
          ))}
        </div>

        {/* ── Vector legend ── */}
        <div className="flex flex-col gap-1">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Legend</p>
          {[
            { color: CLR.gravity,  label: "Weight (mg)"   },
            { color: CLR.normal,   label: "Normal (N)"    },
            { color: CLR.friction, label: "Friction (f)"  },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-[10px]" style={{ color: CLR.muted }}>
              <span className="w-3 h-0.5 rounded-full shrink-0" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {!embedded && (
        <div className="px-3 py-3 border-t" style={{ borderColor: CLR.border }}>
          <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ color: CLR.muted, background: "rgba(139,148,158,0.06)" }}>
            <ArrowLeft size={13} /> Back
          </motion.button>
        </div>
      )}
    </div>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────
export default function FrictionSimulator({ embedded = false, workspaceFocus = false }) {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);

  const [canvasSize,  setCanvasSize]  = useState({ w: 800, h: 480 });
  const [angle,       setAngleState]  = useState(30);
  const [mass,        setMassState]   = useState(5);
  const [muS,         setMuSState]    = useState(0.50);
  const [muK,         setMuKState]    = useState(0.30);
  const [rampLength,  setRampLenState]= useState(0.75);
  const [showVectors, setShowVectors] = useState(true);
  const [showGrid,    setShowGrid]    = useState(true);
  const [showFormulas, setShowFormulas] = useState(true);

  const {
    telemetry, STATES, handleRun, handlePause, handleReset,
    syncAngle, syncMuS, syncMuK, syncMass, syncRampLen, syncShowVec, syncShowGrid,
  } = useFrictionSimulation({ canvasRef, canvasSize });

  const slipAngle = (Math.atan(muS) * 180) / Math.PI;
  const simState  = telemetry.state;

  const setAngle   = useCallback((v) => { setAngleState(v);   syncAngle(v);   }, [syncAngle]);
  const setMass    = useCallback((v) => { setMassState(v);    syncMass(v);    }, [syncMass]);
  const setMuS     = useCallback((v) => { setMuSState(v);     syncMuS(v);     }, [syncMuS]);
  const setMuK     = useCallback((v) => { setMuKState(v);     syncMuK(v);     }, [syncMuK]);
  const setRampLen = useCallback((v) => { setRampLenState(v); syncRampLen(v); }, [syncRampLen]);
  const handleShowVectors = useCallback((v) => { setShowVectors(v); syncShowVec(v);  }, [syncShowVec]);
  const handleShowGrid    = useCallback((v) => { setShowGrid(v);    syncShowGrid(v); }, [syncShowGrid]);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0d1117", fontFamily: "Inter, sans-serif" }}>

      {/* LEFT */}
      {!workspaceFocus && <LeftPanel
        simState={simState} STATES={STATES}
        onRun={handleRun} onPause={handlePause} onReset={handleReset}
        onBack={() => navigate(-1)} embedded={embedded}
        showVectors={showVectors} setShowVectors={handleShowVectors}
        showGrid={showGrid} setShowGrid={handleShowGrid}
        showFormulas={showFormulas} setShowFormulas={setShowFormulas}
        setMuS={setMuS} setMuK={setMuK}
      />}

      {/* CENTER */}
      <div className="flex flex-col flex-1 min-w-0 p-3 gap-2 relative">
        <FormulaOverlay
          type="friction"
          position="dock"
          isOpen={showFormulas}
          onClose={() => setShowFormulas(false)}
          data={{ angle, mass, muS, muK, gravity: 9.81, telemetry }}
        />
        <FrictionCanvas canvasRef={canvasRef} canvasSize={canvasSize} onResize={setCanvasSize} />
        <TelemetryPanel telemetry={telemetry} slipAngle={slipAngle} STATES={STATES} />
      </div>

      {/* RIGHT */}
      {!workspaceFocus && <ControlPanel
        angle={angle}         setAngle={setAngle}
        mass={mass}           setMass={setMass}
        muS={muS}             setMuS={setMuS}
        muK={muK}             setMuK={setMuK}
        rampLength={rampLength} setRampLen={setRampLen}
        showVectors={showVectors} setShowVectors={handleShowVectors}
        showGrid={showGrid}       setShowGrid={handleShowGrid}
        onRun={handleRun} onPause={handlePause} onReset={handleReset}
        simState={simState} STATES={STATES}
      />}
    </div>
  );
}
