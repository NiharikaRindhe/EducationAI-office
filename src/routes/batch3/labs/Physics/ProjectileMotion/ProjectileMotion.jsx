import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play, Pause, RotateCcw, ArrowLeft, Target,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Maximize2, Minimize2,
} from "lucide-react";
import { GRAVITY_PRESETS, CLR } from "./constants/physicsConstants";
import { useSimulation }   from "./hooks/useSimulation";
import CanvasViewport from "./components/CanvasViewport";
import TelemetryBar   from "./components/TelemetryBar";
import ControlsSidebar from "./components/ControlsSidebar";

import FormulaOverlay from "../FormulaOverlay";

// ─── Left nav panel ───────────────────────────────────────────────────────────
function LeftPanel({
  isRunning, isPaused, status,
  onLaunch, onPauseResume, onReset,
  onBack, embedded,
  showVectors, setShowVectors,
  showGrid, setShowGrid,
  retainTrails, setRetainTrails,
  showFormulas, setShowFormulas,
  trailCount,
  gravityKey, setGravityKey,
}) {
  const canLaunch = !isRunning;
  return (
    <div
      className="w-56 shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
      {/* Identity */}
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: CLR.border }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(88,166,255,0.12)" }}>
            <Target size={14} style={{ color: CLR.accent }} />
          </div>
          <div>
            <p className="text-xs font-bold leading-none" style={{ color: CLR.text }}>Projectile</p>
            <p className="text-[9px] mt-0.5" style={{ color: CLR.muted }}>Motion Lab</p>
          </div>
        </div>
        {/* Status pill */}
        <div className="flex items-center gap-1.5">
          <motion.span
            animate={{ scale: isRunning && !isPaused ? [1, 1.4, 1] : 1 }}
            transition={{ repeat: isRunning && !isPaused ? Infinity : 0, duration: 0.9 }}
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: isRunning && !isPaused ? CLR.neon : isPaused ? CLR.velX : CLR.border }}
          />
          <span className="text-[10px]" style={{ color: CLR.muted }}>
            {isRunning && !isPaused ? "Flying" : isPaused ? "Paused" : status === "landed" ? "Landed" : "Ready"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 flex-1">
        {/* ── Actions ── */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Actions</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onLaunch}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: CLR.accent, color: "#0d1117" }}>
            <Play size={12} fill="currentColor" /> Launch
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onPauseResume}
            disabled={!isRunning && !isPaused}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border"
            style={{
              borderColor: CLR.border, color: CLR.text,
              background: isRunning || isPaused ? "rgba(88,166,255,0.08)" : "transparent",
              opacity: !isRunning && !isPaused ? 0.38 : 1,
            }}>
            {isPaused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onReset}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border"
            style={{ borderColor: CLR.border, color: CLR.muted, background: "transparent" }}>
            <RotateCcw size={12} /> Reset
          </motion.button>
        </div>

         <div
          className="rounded-lg border p-3 flex flex-col gap-2"
          style={{ borderColor: CLR.border }}
        >
          <p
            className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: CLR.muted }}
          >
            Vector Legend
          </p>
          {[
            { color: CLR.velTotal, label: "Net Velocity (v)" },
            { color: CLR.velX, label: "Horizontal (vx)" },
            { color: CLR.velY, label: "Vertical (vy)" },
            { color: CLR.neon, label: "Flight Path" },
            { color: CLR.apex, label: "Apex Marker" },
          ].map(item => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs"
              style={{ color: CLR.muted }}
            >
              <span
                className="w-4 h-0.5 rounded-full shrink-0"
                style={{ background: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>

        {/* ── Visualization ── */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>View</p>
          {[
            { label: "Formulas (∑)", val: showFormulas,  set: setShowFormulas },
            { label: "Vectors",       val: showVectors,   set: setShowVectors  },
            { label: "Grid",          val: showGrid,      set: setShowGrid     },
            { label: "Trails",        val: retainTrails,  set: setRetainTrails },
          ].map(({ label, val, set }) => (
            <button key={label}
              onClick={() => set(!val)}
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
          {retainTrails && trailCount > 0 && (
            <p className="text-[9px] px-1" style={{ color: CLR.muted }}>{trailCount} trail{trailCount > 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      {/* Back */}
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

export default function ProjectileMotion({ embedded = false, theme = true, workspaceFocus = false }) {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 480 });
  const [angle,         setAngle]         = useState(45);
  const [velocity,      setVelocity]      = useState(20);
  const [height,        setHeight]        = useState(0);
  const [mass,          setMass]          = useState(1);
  const [gravityKey,    setGravityKey]    = useState("earth");
  const [customGrav,    setCustomGrav]    = useState(5.0);
  const [airResist,     setAirResist]     = useState(false);
  const [dragCoeff,     setDragCoeff]     = useState(0.05);
  const [windSpeed,     setWindSpeed]     = useState(0);
  const [showVectors,   setShowVectors]   = useState(true);
  const [showGrid,      setShowGrid]      = useState(true);
  const [retainTrails,  setRetainTrails]  = useState(true);
  const [showFormulas,  setShowFormulas]  = useState(true);
  const [leftPanelOpen,  setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [canvasFocus,    setCanvasFocus] = useState(false);

  const hideSidePanels = workspaceFocus || canvasFocus;

  const gravity = gravityKey === "custom" ? customGrav : GRAVITY_PRESETS[gravityKey].value;

  const { isRunning, isPaused, telemetry, trailCount, handleLaunch, handlePauseResume, handleReset } =
    useSimulation({ canvasRef, canvasSize, angle, velocity, height, mass, gravity, airResist, dragCoeff, windSpeed, retainTrails, showGrid, showVectors });

  return (
    <div className="flex h-full overflow-hidden" style={{ background: CLR.bg, fontFamily: "Inter, sans-serif" }}>

      {/* LEFT — nav + actions */}
      {!hideSidePanels && leftPanelOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 224, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="shrink-0 overflow-hidden"
        >
          <LeftPanel
            isRunning={isRunning} isPaused={isPaused} status={telemetry.status}
            onLaunch={handleLaunch} onPauseResume={handlePauseResume} onReset={handleReset}
            onBack={() => navigate(-1)} embedded={embedded}
            showVectors={showVectors} setShowVectors={setShowVectors}
            showGrid={showGrid} setShowGrid={setShowGrid}
            retainTrails={retainTrails} setRetainTrails={setRetainTrails}
            showFormulas={showFormulas} setShowFormulas={setShowFormulas}
            trailCount={trailCount ?? 0}
            gravityKey={gravityKey} setGravityKey={setGravityKey}
          />
        </motion.div>
      )}

      {/* CENTER — canvas + telemetry */}
      <div className="flex flex-col flex-1 min-w-0 p-3 gap-3 relative">
        {!workspaceFocus && (
          <div
            className="flex h-11 shrink-0 items-center justify-between rounded-xl border px-2 shadow-sm"
            style={{ borderColor: CLR.border, background: CLR.panel }}
          >
            <span className="hidden pl-2 text-[10px] font-bold uppercase tracking-[0.12em] sm:block" style={{ color: CLR.muted }}>
              Workspace layout
            </span>
            <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLeftPanelOpen((value) => !value)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: leftPanelOpen ? CLR.accent : CLR.muted }}
              title={leftPanelOpen ? "Hide actions panel" : "Show actions panel"}
            >
              {leftPanelOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            </button>
            <button
              type="button"
              onClick={() => setCanvasFocus((value) => !value)}
              className="flex h-8 items-center gap-2 rounded-lg px-3 text-[10px] font-bold transition-colors"
              style={{ color: canvasFocus ? CLR.neon : CLR.text, background: canvasFocus ? `${CLR.neon}12` : "transparent" }}
              title="Use the full lab width"
            >
              {canvasFocus ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {canvasFocus ? "Restore panels" : "Canvas focus"}
            </button>
            <button
              type="button"
              onClick={() => setRightPanelOpen((value) => !value)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: rightPanelOpen ? CLR.accent : CLR.muted }}
              title={rightPanelOpen ? "Hide controls panel" : "Show controls panel"}
            >
              {rightPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            </button>
            </div>
          </div>
        )}
        <FormulaOverlay
          type="motion"
          position="dock"
          isOpen={showFormulas}
          onClose={() => setShowFormulas(false)}
          data={{ velocity, angle, height, gravity, telemetry }}
        />
        <CanvasViewport
          canvasRef={canvasRef} canvasSize={canvasSize}
          onResize={setCanvasSize} idleHint={telemetry.status === "idle"}
        />
        <TelemetryBar telemetry={telemetry} gravity={gravity} />
      </div>

      {/* RIGHT — parameter controls */}
      {!hideSidePanels && rightPanelOpen && <ControlsSidebar
        angle={angle}           setAngle={setAngle}
        velocity={velocity}     setVelocity={setVelocity}
        height={height}         setHeight={setHeight}
        mass={mass}             setMass={setMass}
        gravityKey={gravityKey} setGravityKey={setGravityKey}
        customGrav={customGrav} setCustomGrav={setCustomGrav}
        airResist={airResist}   setAirResist={setAirResist}
        dragCoeff={dragCoeff}   setDragCoeff={setDragCoeff}
        windSpeed={windSpeed}   setWindSpeed={setWindSpeed}
        showVectors={showVectors}   setShowVectors={setShowVectors}
        showGrid={showGrid}         setShowGrid={setShowGrid}
        retainTrails={retainTrails} setRetainTrails={setRetainTrails}
        trailCount={trailCount ?? 0}
      />}
    </div>
  );
}
