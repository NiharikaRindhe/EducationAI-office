import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, ArrowLeft, Waves } from "lucide-react";
import {
  DEFAULT_FREQ, DEFAULT_AMP, DEFAULT_PHASE_DEG, DEFAULT_TEMP_C,
  MEDIUM_PRESETS, BOUNDARY, CLR,
} from "./constants/soundConstants";
import { useSoundSimulation } from "./hooks/useSoundSimulation";
import SoundCanvas       from "./components/SoundCanvas";
import SoundTelemetry    from "./components/SoundTelemetry";
import SoundControlPanel from "./components/SoundControlPanel";

import FormulaOverlay from "../FormulaOverlay";

// ─── Left nav panel ───────────────────────────────────────────────────────────
function LeftPanel({
  running, onPlay, onPause, onReset,
  onBack, embedded,
  medium, setMedium,
  boundary, setBoundary,
  showFormulas, setShowFormulas,
}) {
  const isRigid = boundary === BOUNDARY.RIGID;
  return (
    <div
      className="w-48 shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
      {/* Identity */}
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: CLR.border }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,229,255,0.1)" }}>
            <Waves size={14} style={{ color: CLR.wave }} />
          </div>
          <div>
            <p className="text-xs font-bold leading-none" style={{ color: CLR.text }}>Sound</p>
            <p className="text-[9px] mt-0.5" style={{ color: CLR.muted }}>Wave Tank</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span
            animate={{ scale: running ? [1, 1.4, 1] : 1, opacity: running ? [1, 0.5, 1] : 0.4 }}
            transition={{ repeat: running ? Infinity : 0, duration: 0.9 }}
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: running ? CLR.wave : CLR.border }}
          />
          <span className="text-[10px]" style={{ color: CLR.muted }}>
            {running ? "Transmitting" : "Stopped"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 flex-1">
        {/* ── Actions ── */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Actions</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onPlay} disabled={running}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{
              background: running ? "rgba(0,229,255,0.1)" : CLR.wave,
              color: running ? CLR.wave : "#0d1117",
              border: running ? `1px solid ${CLR.wave}` : "none",
              opacity: running ? 0.65 : 1,
            }}>
            <Play size={12} fill="currentColor" /> {running ? "On" : "Transmit"}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onPause} disabled={!running}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border"
            style={{ borderColor: CLR.border, color: CLR.text, background: "transparent", opacity: !running ? 0.38 : 1 }}>
            <Pause size={12} /> Pause
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onReset}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border"
            style={{ borderColor: CLR.border, color: CLR.muted, background: "transparent" }}>
            <RotateCcw size={12} /> Reset
          </motion.button>
        </div>

        {/* ── View ── */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>View</p>
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs border transition-all"
            style={{
              borderColor: showFormulas ? CLR.wave + "55" : CLR.border,
              background: showFormulas ? "rgba(0,229,255,0.07)" : "transparent",
              color: showFormulas ? CLR.wave : CLR.muted,
            }}>
            <span>Formulas (∑)</span>
            <span className="text-[9px] font-mono">{showFormulas ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* ── Medium selector ── */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Medium</p>
          {Object.entries(MEDIUM_PRESETS).map(([key, p]) => (
            <button key={key}
              onClick={() => setMedium(key)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs border transition-all"
              style={{
                borderColor: medium === key ? p.color : CLR.border,
                background:  medium === key ? `${p.color}15` : "transparent",
                color:       medium === key ? p.color : CLR.muted,
              }}>
              <span>{p.icon} {p.label}</span>
            </button>
          ))}
        </div>

        {/* ── Boundary ── */}
        {/* <div className="flex flex-col gap-1.5">
          <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>Boundary</p>
          <button
            onClick={() => setBoundary(isRigid ? BOUNDARY.ABSORB : BOUNDARY.RIGID)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs border transition-all"
            style={{
              borderColor: isRigid ? CLR.wave + "55" : CLR.border,
              background: isRigid ? "rgba(0,229,255,0.07)" : "transparent",
              color: isRigid ? CLR.wave : CLR.muted,
            }}>
            <span>{isRigid ? "Rigid Wall" : "Foam Absorb"}</span>
            <span className="text-[9px] font-mono">{isRigid ? "ECHO" : "NO"}</span>
          </button>
        </div> */}


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
export default function SoundWaveTank({ embedded = false, workspaceFocus = false }) {
  const navigate  = useNavigate();
  const tankRef   = useRef(null);
  const graphRef  = useRef(null);

  const [canvasSize,  setCanvasSize]  = useState({ w: 800, h: 480 });
  const [freq,        setFreqState]   = useState(DEFAULT_FREQ);
  const [amp,         setAmpState]    = useState(DEFAULT_AMP);
  const [phase,       setPhaseState]  = useState(DEFAULT_PHASE_DEG);
  const [temp,        setTempState]   = useState(DEFAULT_TEMP_C);
  const [medium,      setMediumState] = useState("gas");
  const [boundary,    setBoundaryState] = useState(BOUNDARY.ABSORB);
  const [showFormulas, setShowFormulas] = useState(true);

  const {
    telemetry, handlePlay, handlePause, handleReset,
    syncFreq, syncAmp, syncPhase, syncMedium, syncTemp, syncBoundary,
  } = useSoundSimulation({ tankCanvasRef: tankRef, graphCanvasRef: graphRef, canvasSize });

  const setFreq     = useCallback((v) => { setFreqState(v);       syncFreq(v);     }, [syncFreq]);
  const setAmp      = useCallback((v) => { setAmpState(v);        syncAmp(v);      }, [syncAmp]);
  const setPhase    = useCallback((v) => { setPhaseState(v);      syncPhase(v);    }, [syncPhase]);
  const setTemp     = useCallback((v) => { setTempState(v);       syncTemp(v);     }, [syncTemp]);
  const setMedium   = useCallback((v) => { setMediumState(v);     syncMedium(v);   }, [syncMedium]);
  const setBoundary = useCallback((v) => { setBoundaryState(v);   syncBoundary(v); }, [syncBoundary]);

  const handleFullReset = useCallback(() => {
    handleReset();
  }, [handleReset]);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0d1117", fontFamily: "Inter, sans-serif" }}>

      {/* LEFT */}
      {!workspaceFocus && <LeftPanel
        running={telemetry.running}
        onPlay={handlePlay} onPause={handlePause} onReset={handleFullReset}
        onBack={() => navigate(-1)} embedded={embedded}
        medium={medium} setMedium={setMedium}
        boundary={boundary} setBoundary={setBoundary}
        showFormulas={showFormulas} setShowFormulas={setShowFormulas}
      />}

      {/* CENTER */}
      <div className="flex flex-col flex-1 min-w-0 p-3 gap-2 relative">
        <FormulaOverlay
          type="sound"
          position="dock"
          isOpen={showFormulas}
          onClose={() => setShowFormulas(false)}
          data={{ freq, amp, phase, temp, medium, telemetry }}
        />
        <SoundCanvas
          tankRef={tankRef} graphRef={graphRef}
          tankSize={canvasSize} graphSize={canvasSize}
          onResize={setCanvasSize}
        />
        <SoundTelemetry telemetry={telemetry} />
      </div>

      {/* RIGHT */}
      {!workspaceFocus && <SoundControlPanel
        freq={freq}       setFreq={setFreq}
        amp={amp}         setAmp={setAmp}
        phase={phase}     setPhase={setPhase}
        temp={temp}       setTemp={setTemp}
        medium={medium}   setMedium={setMedium}
        boundary={boundary} setBoundary={setBoundary}
        running={telemetry.running}
        onPlay={handlePlay} onPause={handlePause} onReset={handleFullReset}
      />}
    </div>
  );
}
